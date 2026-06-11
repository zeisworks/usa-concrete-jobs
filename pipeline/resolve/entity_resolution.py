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
