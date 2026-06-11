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
