"""Accela Citizen Access adapter (Jeffco / Arapahoe / Douglas / Aurora pattern).

Accela portals share a structure but each instance differs in module names and
search forms. Two viable paths, in order of preference:

1. Accela Construct API — some agencies expose the documented REST API
   (apis.accela.com) with an agency app key. Check each county; if available
   this is the clean path.
2. Citizen Access HTML search — ASP.NET WebForms (viewstate-heavy). For these,
   use the Browserbase/Stagehand pattern from the congressional scraper stack
   rather than hand-rolling viewstate handling. This module defines the
   contract; the Stagehand driver fills `fetch`.

Recon checklist per county (do this once, store findings in jurisdictions.yaml):
  [ ] Does /CitizenAccess/ exist? Which modules (Building, Permits)?
  [ ] Is there a 'search by date range' that returns paginated result tables?
  [ ] Does a record detail page expose contractor name + license number?
  [ ] robots.txt and ToS review; set rate_limit_seconds accordingly (2-5s).
"""
from .base import BaseScraper


class AccelaPermits(BaseScraper):
    record_type = "permit"
    rate_limit_seconds = 3.0

    def fetch(self):
        if "construct_api" in self.cfg:
            yield from self._fetch_api()
        else:
            raise NotImplementedError(
                "HTML path: drive with Stagehand (see stagehand_driver.md). "
                "This adapter intentionally does not hand-roll WebForms viewstate."
            )

    def _fetch_api(self):
        c = self.cfg["construct_api"]
        url = "https://apis.accela.com/v4/records"
        headers = {"Authorization": c["token"], "x-accela-appid": c["app_id"]}
        offset, limit = 0, 100
        while True:
            data = self.get(url, headers=headers, params={
                "module": c.get("module", "Building"),
                "limit": limit, "offset": offset,
                "openedDateFrom": c.get("from", "2023-01-01"),
            }).json()
            recs = data.get("result", [])
            if not recs:
                break
            for r in recs:
                yield r.get("id"), r
            offset += limit
