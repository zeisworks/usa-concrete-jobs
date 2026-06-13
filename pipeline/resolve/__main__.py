"""Resolution entrypoint: python -m pipeline.resolve

Runs the full re-runnable pass: raw permits/licenses -> entities,
concrete classification, solicitations -> bid board, expiry sweep,
then refreshes the page-serving materialized views.
"""
import argparse

import psycopg2

from .. import dsn
from .entity_resolution import load_keywords, classify_concrete, upsert_permits, upsert_licenses
from .bid_opportunities import upsert_bid_opportunities, close_expired


def main():
    ap = argparse.ArgumentParser(prog="pipeline.resolve", description=__doc__)
    ap.add_argument("--skip-refresh", action="store_true",
                    help="skip the materialized view refresh (e.g. mid-backfill)")
    args = ap.parse_args()

    conn = psycopg2.connect(dsn())

    print(f"permits resolved:   {upsert_permits(conn)}")
    print(f"licenses resolved:  {upsert_licenses(conn)}")

    with conn.cursor() as cur:
        classify_concrete(cur, load_keywords())
    conn.commit()
    print("concrete classification: done")

    print(f"bids upserted:      {upsert_bid_opportunities(conn)}")
    print(f"bids closed (past due): {close_expired(conn)}")

    if not args.skip_refresh:
        with conn.cursor() as cur:
            # CONCURRENTLY needs the unique index and a committed first refresh;
            # fall back to a plain refresh on the very first run.
            try:
                cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY contractor_profile")
            except psycopg2.Error:
                conn.rollback()
                cur.execute("REFRESH MATERIALIZED VIEW contractor_profile")
            cur.execute("REFRESH MATERIALIZED VIEW city_activity")
        conn.commit()
        print("materialized views: refreshed")


if __name__ == "__main__":
    main()
