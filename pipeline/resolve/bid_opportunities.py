"""raw_record 'solicitation' rows -> bid_opportunity (the /jobs board).

v1 handles the SAM.gov Get Opportunities v2 payload shape. State/local
adapters land their own payloads; add a mapper per source as they come
online (the jurisdiction's source_config.adapter tells you which shape
you're holding).

Concrete filtering: keyword pass over the title using the same
concrete_keywords config as the permit classifier, with the poured-concrete
NAICS as a backstop. Notices that match neither are skipped, not deleted —
re-running after a keyword change picks them up.
"""
from __future__ import annotations
import re

from .entity_resolution import load_keywords, parse_date

CONCRETE_NAICS_PREFIX = "2381"   # poured concrete foundation & structure


def _slugify(*parts: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", " ".join(p for p in parts if p).lower())
    return re.sub(r"-{2,}", "-", base).strip("-")[:80].rstrip("-")


def classify_title(title: str, keywords: dict) -> str | None:
    for klass, words in keywords.items():
        if any(w.lower() in title.lower() for w in words):
            return klass
    return None


def map_sam_notice(payload: dict, keywords: dict) -> dict | None:
    """SAM v2 search opportunity -> bid_opportunity columns, or None to skip."""
    title = payload.get("title") or ""
    klass = classify_title(title, keywords)
    naics = str(payload.get("naicsCode") or "")
    if not klass and not naics.startswith(CONCRETE_NAICS_PREFIX):
        return None
    pop = payload.get("placeOfPerformance") or {}
    city = ((pop.get("city") or {}).get("name") or "").title() or None
    state = (pop.get("state") or {}).get("code")
    # fullParentPathName: 'DEPT OF DEFENSE.DEPT OF THE ARMY....OFFICE'; the
    # last segment is the buying office, the most useful display name.
    path = (payload.get("fullParentPathName") or "").split(".")
    buyer = (path[-1] or "Federal agency").strip().title()
    return {
        "slug": _slugify(title, city or "", (payload.get("noticeId") or "")[-6:]),
        "source_level": "federal",
        "buyer": buyer,
        "solicitation_no": payload.get("solicitationNumber"),
        "title": title.strip() or payload.get("solicitationNumber") or "Untitled notice",
        "description": None,   # v2 search returns a description *link*; fetch lazily if needed
        "concrete_class": klass or "other",
        "est_value": None,     # SAM rarely carries a value; magnitude lives in the docs
        "set_aside": payload.get("typeOfSetAsideDescription"),
        "city": city,
        "state": state,
        "posted_on": parse_date(payload.get("postedDate")),
        "due_on": parse_date(payload.get("responseDeadLine")),
        "source_url": payload.get("uiLink"),
    }


def upsert_bid_opportunities(conn) -> int:
    keywords = load_keywords()
    n = 0
    with conn.cursor() as cur, conn.cursor(name="raw_solicitations") as raw:
        raw.itersize = 1000
        raw.execute(
            """SELECT r.id, r.payload FROM raw_record r
               WHERE r.record_type = 'solicitation'
                 AND NOT EXISTS (SELECT 1 FROM bid_opportunity b WHERE b.raw_id = r.id)""")
        for raw_id, payload in raw:
            row = map_sam_notice(payload, keywords)
            if not row or not row["due_on"]:
                continue
            cur.execute(
                """INSERT INTO bid_opportunity
                     (slug, source_level, buyer, solicitation_no, title, description,
                      concrete_class, est_value, set_aside, city, state,
                      posted_on, due_on, source_url, raw_id)
                   VALUES (%(slug)s,%(source_level)s,%(buyer)s,%(solicitation_no)s,
                           %(title)s,%(description)s,%(concrete_class)s,%(est_value)s,
                           %(set_aside)s,%(city)s,%(state)s,%(posted_on)s,%(due_on)s,
                           %(source_url)s,%(raw_id)s)
                   ON CONFLICT (slug) DO UPDATE SET
                     due_on = EXCLUDED.due_on, set_aside = EXCLUDED.set_aside,
                     source_url = EXCLUDED.source_url, raw_id = EXCLUDED.raw_id,
                     status = 'open', updated_at = now()""",
                {**row, "raw_id": raw_id})
            n += 1
    conn.commit()
    return n


def close_expired(conn) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """UPDATE bid_opportunity SET status = 'closed', updated_at = now()
               WHERE status = 'open' AND due_on < CURRENT_DATE""")
        n = cur.rowcount
    conn.commit()
    return n
