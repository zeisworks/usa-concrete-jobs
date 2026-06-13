"""USAConcreteJobs pipeline. See README for run order.

Entry points:
  python -m pipeline.run --seed          seed jurisdictions from yaml
  python -m pipeline.run denver-co       raw ingest for one jurisdiction
  python -m pipeline.run all             raw ingest for every configured slug
  python -m pipeline.resolve             raw -> entities -> classification
  python -m pipeline.load.lead_signals   generate + export outreach signals
  python -m pipeline.export_seed         DB -> web/data/seed.json snapshot
"""
import os


def dsn() -> str:
    return os.environ.get("DATABASE_URL", "postgresql:///usaconcretejobs")
