"""Lead signals: turn permit flow into outreach-ready rows.

This is the revenue test. Before any public page exists, these signals feed
the existing Instantly campaigns and the success metric is simple:
reply rate on signal-personalized sends vs. the current generic sequences.

Signals v1:
  permit_velocity_up    contractor's trailing-90d concrete permits >= 2x prior 90d
                        -> pitch: capacity/hiring/lead-buying mode
  permit_velocity_down  trailing-90d <= 0.5x prior 90d (min 3 prior)
                        -> pitch: hungry, will buy leads
  homeowner_adjacent    new permit within radius of a contractor's active jobs
                        -> route as a lead to that contractor (PPL test)
  license_expiring      license expires within 45 days
                        -> claim-your-profile hook ('your expiration is public')
"""
VELOCITY_SQL = """
WITH windows AS (
  SELECT contractor_id,
         count(*) FILTER (WHERE issued_on > CURRENT_DATE - 90)  AS recent,
         count(*) FILTER (WHERE issued_on <= CURRENT_DATE - 90
                            AND issued_on > CURRENT_DATE - 180) AS prior
  FROM permit
  WHERE is_concrete AND contractor_id IS NOT NULL
  GROUP BY contractor_id
)
INSERT INTO lead_signal (signal_type, contractor_id, detail, score)
SELECT CASE WHEN recent >= 2 * GREATEST(prior, 1) THEN 'permit_velocity_up'
            ELSE 'permit_velocity_down' END,
       contractor_id,
       jsonb_build_object('recent_90d', recent, 'prior_90d', prior),
       LEAST(1.0, abs(recent - prior)::numeric / GREATEST(prior, 1) / 4)
FROM windows
WHERE (recent >= 2 * GREATEST(prior, 1) AND recent >= 3)
   OR (prior >= 3 AND recent * 2 <= prior)
ON CONFLICT DO NOTHING;
"""

EXPIRING_SQL = """
INSERT INTO lead_signal (signal_type, contractor_id, detail, score)
SELECT 'license_expiring', l.contractor_id,
       jsonb_build_object('license_no', l.license_no, 'expires_on', l.expires_on,
                          'jurisdiction_id', l.jurisdiction_id),
       0.7
FROM license l
WHERE l.status = 'active'
  AND l.expires_on BETWEEN CURRENT_DATE AND CURRENT_DATE + 45
  AND l.contractor_id IS NOT NULL
ON CONFLICT DO NOTHING;
"""

EXPORT_SQL = """
-- Instantly export: one row per un-exported signal with merge fields.
SELECT ls.id, c.canonical_name, c.email, c.phone, c.city,
       ls.signal_type, ls.detail,
       cp.permits_12mo, cp.median_job_value
FROM lead_signal ls
JOIN contractor c        ON c.id = ls.contractor_id
JOIN contractor_profile cp ON cp.id = c.id
WHERE ls.exported_at IS NULL AND c.email IS NOT NULL
ORDER BY ls.score DESC;
"""


def main():
    """python -m pipeline.load.lead_signals [--export out.csv] [--mark]

    Generates velocity + expiry signals, then optionally exports un-exported
    rows to CSV for Instantly. --mark stamps exported_at on what it exported
    (only use once the CSV is actually uploaded).
    """
    import argparse
    import csv
    import json
    import sys

    import psycopg2

    from .. import dsn

    ap = argparse.ArgumentParser(prog="pipeline.load.lead_signals", description=main.__doc__)
    ap.add_argument("--export", metavar="CSV", help="write un-exported signals to this file ('-' = stdout)")
    ap.add_argument("--mark", action="store_true", help="stamp exported_at on exported rows")
    args = ap.parse_args()

    conn = psycopg2.connect(dsn())
    with conn.cursor() as cur:
        cur.execute(VELOCITY_SQL)
        velocity = cur.rowcount
        cur.execute(EXPIRING_SQL)
        expiring = cur.rowcount
    conn.commit()
    print(f"signals: {velocity} velocity, {expiring} license-expiring", file=sys.stderr)

    if args.export:
        with conn.cursor() as cur:
            cur.execute(EXPORT_SQL)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
        out = sys.stdout if args.export == "-" else open(args.export, "w", newline="")
        w = csv.writer(out)
        w.writerow(cols)
        for row in rows:
            w.writerow([json.dumps(v) if isinstance(v, dict) else v for v in row])
        if out is not sys.stdout:
            out.close()
        print(f"exported {len(rows)} rows", file=sys.stderr)
        if args.mark and rows:
            with conn.cursor() as cur:
                cur.execute("UPDATE lead_signal SET exported_at = now() WHERE id = ANY(%s)",
                            ([r[0] for r in rows],))
            conn.commit()


if __name__ == "__main__":
    main()
