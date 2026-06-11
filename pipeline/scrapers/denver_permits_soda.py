"""Denver building permits via open data (Socrata SODA or ArcGIS FeatureServer).

Denver publishes permits and contractor licenses in its open data catalog,
which makes it the zero-risk first jurisdiction: documented APIs, no HTML
scraping, no ban risk. Endpoint/dataset IDs must be confirmed at
data.denvergov.org before first run — set them in jurisdictions.yaml
source_config as either:

  soda:   {"domain": "data.denvergov.org", "dataset_id": "xxxx-xxxx"}
  arcgis: {"feature_url": "https://services.../FeatureServer/0"}
"""
from .base import BaseScraper


class DenverPermits(BaseScraper):
    record_type = "permit"
    rate_limit_seconds = 0.25  # documented public APIs tolerate this fine

    def fetch(self):
        if "soda" in self.cfg:
            yield from self._fetch_soda()
        elif "arcgis" in self.cfg:
            yield from self._fetch_arcgis()
        else:
            raise ValueError("set source_config.soda or source_config.arcgis")

    def _fetch_soda(self):
        c = self.cfg["soda"]
        base = f"https://{c['domain']}/resource/{c['dataset_id']}.json"
        limit, offset = 5000, 0
        while True:
            rows = self.get(base, params={
                "$limit": limit, "$offset": offset, "$order": ":id",
            }).json()
            if not rows:
                break
            for row in rows:
                sid = row.get("permit_number") or row.get("permit_no") or row.get(":id")
                yield sid, row
            offset += limit

    def _fetch_arcgis(self):
        url = self.cfg["arcgis"]["feature_url"] + "/query"
        offset, page = 0, 2000
        while True:
            data = self.get(url, params={
                "where": "1=1", "outFields": "*", "f": "json",
                "resultOffset": offset, "resultRecordCount": page,
            }).json()
            feats = data.get("features", [])
            if not feats:
                break
            for f in feats:
                attrs = f.get("attributes", {})
                sid = attrs.get("PERMIT_NUM") or attrs.get("OBJECTID")
                yield sid, attrs
            offset += page


class DenverContractorLicenses(DenverPermits):
    """Same transport, different dataset — point source_config at the
    contractor/business license dataset and set record_type."""
    record_type = "license"
