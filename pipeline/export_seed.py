"""Snapshot the database into web/data/seed.json.

  python -m pipeline.export_seed [--out web/data/seed.json]

This is the bridge between the pipeline and the deployed site before (or
instead of) wiring the Worker to Postgres: run the pipeline, export, commit,
deploy — the site stays fully static and serves real records. The JSON shape
matches what web/lib/data.js expects in seed mode exactly.
"""
from __future__ import annotations
import argparse
import json
from decimal import Decimal

import psycopg2
import psycopg2.extras

from . import dsn


def _jsonable(v):
    if isinstance(v, Decimal):
        f = float(v)
        return int(f) if f.is_integer() else f
    return str(v) if hasattr(v, "isoformat") else v


def _rows(cur, sql, params=()):
    cur.execute(sql, params)
    return [{k: _jsonable(v) for k, v in r.items()} for r in cur.fetchall()]


def export(conn) -> dict:
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    contractors = _rows(cur, """
        SELECT c.slug, c.canonical_name, c.city, c.state, c.claimed,
               cp.has_active_license, cp.concrete_permits, cp.permits_12mo,
               cp.median_job_value, cp.first_permit, cp.latest_permit,
               cp.jurisdictions_active, cp.enforcement_count, c.id AS _id
        FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
        WHERE cp.concrete_permits > 0
        ORDER BY cp.permits_12mo DESC, cp.concrete_permits DESC""")
    for c in contractors:
        cid = c.pop("_id")
        c["licenses"] = _rows(cur, """
            SELECT l.license_no, l.license_type, l.status, l.expires_on,
                   j.name AS jurisdiction
            FROM license l JOIN jurisdiction j ON j.id = l.jurisdiction_id
            WHERE l.contractor_id = %s ORDER BY l.expires_on DESC NULLS LAST""", (cid,))
        c["permits"] = _rows(cur, """
            SELECT p.permit_no, p.concrete_class, p.description, p.declared_value,
                   p.issued_on, p.status, p.site_city, j.name AS jurisdiction
            FROM permit p JOIN jurisdiction j ON j.id = p.jurisdiction_id
            WHERE p.contractor_id = %s AND p.is_concrete
            ORDER BY p.issued_on DESC NULLS LAST LIMIT 50""", (cid,))

    city_rows = _rows(cur, """
        SELECT lower(replace(city, ' ', '-')) AS slug, city AS name, state,
               month, concrete_class, permits, total_value, median_value
        FROM city_activity ORDER BY city, month DESC""")
    cities: dict[tuple, dict] = {}
    for r in city_rows:
        key = (r["slug"], r["state"])
        city = cities.setdefault(key, {
            "slug": r["slug"], "name": r["name"], "state": r["state"],
            "activity": [], "contractors": [],
        })
        if len(city["activity"]) < 60:
            city["activity"].append({k: r[k] for k in
                ("month", "concrete_class", "permits", "total_value", "median_value")})
    for city in cities.values():
        city["contractors"] = _rows(cur, """
            SELECT c.slug, c.canonical_name, cp.permits_12mo, cp.median_job_value,
                   cp.has_active_license
            FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
            WHERE lower(c.city) = lower(%s) AND lower(c.state) = lower(%s)
              AND cp.permits_12mo > 0
            ORDER BY cp.permits_12mo DESC LIMIT 25""",
            (city["name"], city["state"]))

    jobs = _rows(cur, """
        SELECT slug, title, source_level, buyer, solicitation_no, concrete_class,
               description, est_value, set_aside, city, state, posted_on, due_on,
               status, source_url, contact
        FROM bid_opportunity WHERE status = 'open' ORDER BY due_on""")

    return {"contractors": contractors, "cities": list(cities.values()), "jobs": jobs}


def main():
    ap = argparse.ArgumentParser(prog="pipeline.export_seed", description=__doc__)
    ap.add_argument("--out", default="web/data/seed.json")
    args = ap.parse_args()
    conn = psycopg2.connect(dsn())
    data = export(conn)
    with open(args.out, "w") as f:
        json.dump(data, f, indent=2, default=str)
        f.write("\n")
    print(f"{args.out}: {len(data['contractors'])} contractors, "
          f"{len(data['cities'])} cities, {len(data['jobs'])} jobs")


if __name__ == "__main__":
    main()
