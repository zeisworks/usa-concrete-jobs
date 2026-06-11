"""Base scraper: every adapter yields raw dicts; persistence and dedupe live here.

Design rules:
- Raw records are immutable. We never transform at ingest; payload goes into
  raw_record.payload as-is. Classification and resolution are separate,
  re-runnable passes (pipeline/resolve). This is the same pattern as the
  CPF/CDS stack: when classification logic improves, re-run resolve without
  re-scraping anything.
- content_hash means re-scrapes of unchanged records are no-ops.
- Be polite: identify yourself, rate limit, respect robots.txt and ToS per
  source. Public records portals are public, but bans are operational debt.
"""
from __future__ import annotations
import hashlib, json, time
import psycopg2, psycopg2.extras
import requests

USER_AGENT = "USAConcreteJobsBot/0.1 (+https://usaconcretejobs.com/about-data)"


class BaseScraper:
    record_type: str = "permit"          # or 'license', 'violation'
    rate_limit_seconds: float = 1.0

    def __init__(self, dsn: str, jurisdiction_slug: str, source_config: dict):
        self.conn = psycopg2.connect(dsn)
        self.cfg = source_config
        with self.conn.cursor() as cur:
            cur.execute("SELECT id FROM jurisdiction WHERE slug = %s", (jurisdiction_slug,))
            row = cur.fetchone()
            if not row:
                raise ValueError(f"jurisdiction {jurisdiction_slug} not seeded")
            self.jurisdiction_id = row[0]
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self._last_request = 0.0

    # -- subclasses implement -------------------------------------------------
    def fetch(self):
        """Yield (source_id: str, payload: dict) tuples."""
        raise NotImplementedError

    # -- shared ----------------------------------------------------------------
    def get(self, url: str, **kw) -> requests.Response:
        wait = self.rate_limit_seconds - (time.time() - self._last_request)
        if wait > 0:
            time.sleep(wait)
        resp = self.session.get(url, timeout=30, **kw)
        self._last_request = time.time()
        resp.raise_for_status()
        return resp

    @staticmethod
    def _hash(payload: dict) -> str:
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, default=str).encode()
        ).hexdigest()[:32]

    def run(self) -> dict:
        inserted = skipped = 0
        with self.conn.cursor() as cur:
            for source_id, payload in self.fetch():
                cur.execute(
                    """INSERT INTO raw_record
                         (jurisdiction_id, record_type, source_id, payload, content_hash)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT DO NOTHING""",
                    (self.jurisdiction_id, self.record_type, str(source_id),
                     psycopg2.extras.Json(payload), self._hash(payload)),
                )
                inserted += cur.rowcount
                skipped += 1 - cur.rowcount
        self.conn.commit()
        return {"inserted": inserted, "unchanged": skipped}
