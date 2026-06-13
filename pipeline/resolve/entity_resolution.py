"""Resolution pass: raw_record -> contractor / license / permit tables.

This file is the moat. Anyone can scrape a permit portal; the value is a clean
canonical contractor entity across jurisdictions whose names disagree
('Rocky Mtn Concrete LLC' / 'ROCKY MOUNTAIN CONCRETE' / 'R.M. Concrete').

Match cascade (strongest key wins, score recorded on contractor_alias):
  1.00  CO Secretary of State entity id (when a source exposes it)
  0.95  license_no already linked in another jurisdiction
  0.90  exact phone match (normalized to digits)
  0.80+ trigram name similarity >= 0.6 AND same city  (pg_trgm)
  else  create new contractor

Run order: resolve_contractors() -> upsert_permits() -> classify_concrete()
Then: REFRESH MATERIALIZED VIEW CONCURRENTLY contractor_profile, city_activity.
"""
from __future__ import annotations
import re
try:
    import psycopg2, psycopg2.extras  # required for DB passes only
except ImportError:
    psycopg2 = None
try:
    import yaml
except ImportError:
    yaml = None

SUFFIXES = re.compile(r"\b(llc|inc|co|corp|ltd|llp|company|incorporated)\b\.?", re.I)


def normalize_name(name: str) -> str:
    n = SUFFIXES.sub("", (name or "").lower())
    return re.sub(r"[^a-z0-9 ]", "", n).strip()


def normalize_phone(phone: str | None) -> str | None:
    digits = re.sub(r"\D", "", phone or "")
    return digits[-10:] if len(digits) >= 10 else None


def slugify(name: str, city: str, state: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", f"{name} {city} {state}".lower()).strip("-")
    return re.sub(r"-{2,}", "-", base)


def resolve_contractor(cur, name: str, city: str, state: str,
                       phone: str | None = None, sos_id: str | None = None):
    """Return contractor_id, creating the entity if no match clears threshold."""
    norm = normalize_name(name)
    if not norm:
        return None

    if sos_id:
        cur.execute("SELECT id FROM contractor WHERE sos_entity_id = %s", (sos_id,))
        if (row := cur.fetchone()):
            return row[0], "sos_id", 1.0

    p = normalize_phone(phone)
    if p:
        cur.execute("SELECT id FROM contractor WHERE phone = %s", (p,))
        if (row := cur.fetchone()):
            return row[0], "phone", 0.90

    cur.execute(
        """SELECT id, similarity(normalized_name, %s) AS s
           FROM contractor
           WHERE normalized_name %% %s AND (city IS NULL OR lower(city) = lower(%s))
           ORDER BY s DESC LIMIT 1""",
        (norm, norm, city or ""),
    )
    row = cur.fetchone()
    if row and row[1] >= 0.6:
        return row[0], "fuzzy_name", float(row[1])

    cur.execute(
        """INSERT INTO contractor
             (slug, canonical_name, normalized_name, phone, city, state, sos_entity_id)
           VALUES (%s,%s,%s,%s,%s,%s,%s)
           ON CONFLICT (slug) DO UPDATE SET updated_at = now()
           RETURNING id""",
        (slugify(name, city or "", state), name.strip(), norm, p, city, state, sos_id),
    )
    return cur.fetchone()[0], "created", 1.0


def load_keywords(path="pipeline/config/jurisdictions.yaml") -> dict:
    with open(path) as f:
        return yaml.safe_load(f)["concrete_keywords"]


def classify_concrete(cur, keywords: dict):
    """Re-runnable keyword pass over permit descriptions. Start with keywords,
    graduate to a Haiku batch classifier once you have labeled volume — same
    upgrade path as the CPF classifier. Keyword precision here is decent
    because permit descriptions are terse and literal."""
    for klass, words in keywords.items():
        pattern = "|".join(re.escape(w) for w in words)
        cur.execute(
            """UPDATE permit
               SET is_concrete = TRUE, concrete_class = %s
               WHERE concrete_class IS NULL
                 AND description ~* %s""",
            (klass, pattern),
        )


# ---------------------------------------------------------------------------
# raw_record -> permit / license upserts
#
# Source systems disagree on field names. Defaults below cover the common
# Socrata/Accela exports; per-jurisdiction overrides live in
# jurisdiction.source_config.field_map as {logical_name: source_key}.
# ---------------------------------------------------------------------------
PERMIT_FIELDS = {
    "permit_no":      ["permit_number", "permit_no", "permit_num", "PERMIT_NUM", "record_id", "id"],
    "permit_type":    ["permit_type", "permit_class", "type", "record_type"],
    "work_class":     ["work_class", "workclass", "work_type"],
    "description":    ["description", "work_description", "permit_description", "scope_of_work", "desc"],
    "declared_value": ["declared_valuation", "valuation", "declared_value", "est_project_cost", "job_value", "project_value"],
    "status":         ["status", "permit_status", "current_status", "status_current"],
    "applied_on":     ["application_date", "applied_date", "apply_date", "date_applied"],
    "issued_on":      ["issued_date", "issue_date", "issued_on", "date_issued"],
    "finaled_on":     ["completed_date", "final_date", "finaled_date", "date_completed"],
    "site_address":   ["address", "site_address", "full_address", "original_address1"],
    "site_city":      ["city", "site_city", "original_city"],
    "site_zip":       ["zip", "zipcode", "site_zip", "original_zip"],
    "contractor_name":  ["contractor_name", "contractor", "company_name", "contractor_business_name", "contractor_company"],
    "contractor_phone": ["contractor_phone", "phone", "contractor_phone_number"],
    "contractor_license": ["contractor_license", "license_number", "contractor_license_no"],
}

LICENSE_FIELDS = {
    "license_no":   ["license_number", "license_no", "license_id", "bfn"],
    "license_type": ["license_type", "license_class", "type", "lic_type"],
    "status":       ["status", "license_status", "current_status"],
    "issued_on":    ["issued_date", "issue_date", "first_issued_date"],
    "expires_on":   ["expiration_date", "expires_on", "expire_date", "license_expiration_date"],
    "name":         ["entity_name", "business_name", "name", "company_name", "licensee"],
    "phone":        ["phone", "phone_number", "business_phone"],
    "city":         ["city", "business_city"],
}

_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
_DATE_US = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})")


def parse_date(value) -> str | None:
    s = str(value or "").strip()
    if (m := _DATE.match(s)):
        return f"{m[1]}-{m[2]}-{m[3]}"
    if (m := _DATE_US.match(s)):
        return f"{m[3]}-{int(m[1]):02d}-{int(m[2]):02d}"
    return None


def parse_money(value) -> float | None:
    s = re.sub(r"[^0-9.]", "", str(value or ""))
    try:
        return float(s) if s else None
    except ValueError:
        return None


def pick(payload: dict, logical: str, fields: dict, overrides: dict):
    """Resolve a logical field from the payload: override key first, then the
    default candidates, case-insensitively."""
    keys = [overrides[logical]] if logical in overrides else fields[logical]
    lowered = {str(k).lower(): v for k, v in payload.items()}
    for k in keys:
        v = lowered.get(str(k).lower())
        if v not in (None, ""):
            return v
    return None


def upsert_permits(conn) -> int:
    """Map un-resolved raw permit records into the permit table, resolving the
    contractor as we go. Re-runnable: keyed on (jurisdiction_id, permit_no),
    newer raw rows update in place."""
    n = 0
    with conn.cursor() as cur, conn.cursor(name="raw_permits") as raw:
        raw.itersize = 1000
        raw.execute(
            """SELECT r.id, r.jurisdiction_id, r.payload,
                      j.state, j.source_config->'field_map' AS fmap
               FROM raw_record r
               JOIN jurisdiction j ON j.id = r.jurisdiction_id
               WHERE r.record_type = 'permit'
                 AND NOT EXISTS (SELECT 1 FROM permit p WHERE p.raw_id = r.id)""")
        for raw_id, jur_id, payload, state, fmap in raw:
            o = fmap or {}
            permit_no = pick(payload, "permit_no", PERMIT_FIELDS, o)
            if not permit_no:
                continue
            site_city = pick(payload, "site_city", PERMIT_FIELDS, o)
            contractor_id = None
            cname = pick(payload, "contractor_name", PERMIT_FIELDS, o)
            if cname:
                resolved = resolve_contractor(
                    cur, str(cname), site_city and str(site_city), state,
                    phone=pick(payload, "contractor_phone", PERMIT_FIELDS, o))
                if resolved:
                    contractor_id = resolved[0]
                    cur.execute(
                        """INSERT INTO contractor_alias
                             (contractor_id, alias_name, alias_phone, source_raw_id,
                              match_method, match_score)
                           VALUES (%s,%s,%s,%s,%s,%s)
                           ON CONFLICT DO NOTHING""",
                        (contractor_id, str(cname),
                         normalize_phone(pick(payload, "contractor_phone", PERMIT_FIELDS, o)),
                         raw_id, resolved[1], resolved[2]))
            cur.execute(
                """INSERT INTO permit
                     (contractor_id, jurisdiction_id, permit_no, permit_type, work_class,
                      description, declared_value, status, applied_on, issued_on,
                      finaled_on, site_address, site_city, site_zip, raw_id)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (jurisdiction_id, permit_no) DO UPDATE SET
                     contractor_id = COALESCE(EXCLUDED.contractor_id, permit.contractor_id),
                     description   = COALESCE(EXCLUDED.description, permit.description),
                     declared_value = COALESCE(EXCLUDED.declared_value, permit.declared_value),
                     status        = COALESCE(EXCLUDED.status, permit.status),
                     issued_on     = COALESCE(EXCLUDED.issued_on, permit.issued_on),
                     finaled_on    = COALESCE(EXCLUDED.finaled_on, permit.finaled_on),
                     raw_id        = EXCLUDED.raw_id""",
                (contractor_id, jur_id, str(permit_no),
                 pick(payload, "permit_type", PERMIT_FIELDS, o),
                 pick(payload, "work_class", PERMIT_FIELDS, o),
                 pick(payload, "description", PERMIT_FIELDS, o),
                 parse_money(pick(payload, "declared_value", PERMIT_FIELDS, o)),
                 pick(payload, "status", PERMIT_FIELDS, o),
                 parse_date(pick(payload, "applied_on", PERMIT_FIELDS, o)),
                 parse_date(pick(payload, "issued_on", PERMIT_FIELDS, o)),
                 parse_date(pick(payload, "finaled_on", PERMIT_FIELDS, o)),
                 pick(payload, "site_address", PERMIT_FIELDS, o),
                 site_city, pick(payload, "site_zip", PERMIT_FIELDS, o), raw_id))
            n += 1
    conn.commit()
    return n


def upsert_licenses(conn) -> int:
    n = 0
    with conn.cursor() as cur, conn.cursor(name="raw_licenses") as raw:
        raw.itersize = 1000
        raw.execute(
            """SELECT r.id, r.jurisdiction_id, r.payload,
                      j.state, j.source_config->'field_map' AS fmap
               FROM raw_record r
               JOIN jurisdiction j ON j.id = r.jurisdiction_id
               WHERE r.record_type = 'license'
                 AND NOT EXISTS (SELECT 1 FROM license l WHERE l.raw_id = r.id)""")
        for raw_id, jur_id, payload, state, fmap in raw:
            o = fmap or {}
            license_no = pick(payload, "license_no", LICENSE_FIELDS, o)
            if not license_no:
                continue
            contractor_id = None
            name = pick(payload, "name", LICENSE_FIELDS, o)
            if name:
                resolved = resolve_contractor(
                    cur, str(name),
                    (c := pick(payload, "city", LICENSE_FIELDS, o)) and str(c), state,
                    phone=pick(payload, "phone", LICENSE_FIELDS, o))
                if resolved:
                    contractor_id = resolved[0]
            cur.execute(
                """INSERT INTO license
                     (contractor_id, jurisdiction_id, license_no, license_type,
                      status, issued_on, expires_on, raw_id)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (jurisdiction_id, license_no) DO UPDATE SET
                     contractor_id = COALESCE(EXCLUDED.contractor_id, license.contractor_id),
                     status     = COALESCE(EXCLUDED.status, license.status),
                     expires_on = COALESCE(EXCLUDED.expires_on, license.expires_on),
                     raw_id     = EXCLUDED.raw_id""",
                (contractor_id, jur_id, str(license_no),
                 pick(payload, "license_type", LICENSE_FIELDS, o),
                 (s := pick(payload, "status", LICENSE_FIELDS, o)) and str(s).lower(),
                 parse_date(pick(payload, "issued_on", LICENSE_FIELDS, o)),
                 parse_date(pick(payload, "expires_on", LICENSE_FIELDS, o)), raw_id))
            n += 1
    conn.commit()
    return n
