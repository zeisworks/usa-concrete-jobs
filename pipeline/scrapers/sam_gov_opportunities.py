"""Federal concrete solicitations via the SAM.gov Get Opportunities API v2.

SAM.gov is the single front door for federal construction solicitations, and
unlike the permit portals it has a documented, keyed public API — zero
scraping risk. Register for a free api key at sam.gov, then set it in
jurisdictions.yaml source_config or the SAM_API_KEY env var.

Filtering strategy: pull everything under the poured-concrete NAICS plus
construction notices, store raw, and let resolve/classify decide what is
concrete work — same immutable-raw / re-runnable-classify pattern as permits.

State and local sources follow the same shape with different transports:
  - CDOT:   bid tab on codot.gov (project list is JSON behind the page)
  - BidNet: Rocky Mountain E-Purchasing System hosts most CO cities/counties
  - direct: city procurement pages for the few that self-host
Each gets its own adapter yielding (source_id, payload) exactly like this one.
"""
from __future__ import annotations
import os
from datetime import date, timedelta

from .base import BaseScraper

API = "https://api.sam.gov/opportunities/v2/search"

# 238110: Poured Concrete Foundation & Structure Contractors. 237310 (highway,
# street) and 236220 (commercial building) also carry concrete packages; the
# classifier downstream separates the concrete scope from the noise.
NAICS = ["238110", "237310"]


class SamGovOpportunities(BaseScraper):
    record_type = "solicitation"
    rate_limit_seconds = 1.0  # SAM rate limits per key; stay polite

    def fetch(self):
        api_key = self.cfg.get("api_key") or os.environ.get("SAM_API_KEY")
        if not api_key:
            raise ValueError("set source_config.api_key or SAM_API_KEY")
        posted_from = (date.today() - timedelta(days=self.cfg.get("lookback_days", 30)))
        for naics in self.cfg.get("naics", NAICS):
            offset, limit = 0, 1000
            while True:
                data = self.get(API, params={
                    "api_key": api_key,
                    "ncode": naics,
                    "state": self.cfg.get("place_of_performance_state", "CO"),
                    "postedFrom": posted_from.strftime("%m/%d/%Y"),
                    "postedTo": date.today().strftime("%m/%d/%Y"),
                    "ptype": "o,k",          # solicitations + combined synopsis
                    "limit": limit,
                    "offset": offset,
                }).json()
                opps = data.get("opportunitiesData", [])
                if not opps:
                    break
                for opp in opps:
                    yield opp.get("noticeId"), opp
                offset += limit
                if offset >= int(data.get("totalRecords", 0)):
                    break
