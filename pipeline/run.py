"""Ingest CLI: seed jurisdictions and dispatch scrapers.

  python -m pipeline.run --seed              upsert jurisdictions from yaml
  python -m pipeline.run denver-co           run one jurisdiction's adapter
  python -m pipeline.run denver-co aurora-co run several
  python -m pipeline.run all                 run every slug with an adapter

DSN comes from DATABASE_URL (default postgresql:///usaconcretejobs).
"""
from __future__ import annotations
import argparse
import importlib
import json
import sys

import psycopg2
import psycopg2.extras
import yaml

from . import dsn

CONFIG_PATH = "pipeline/config/jurisdictions.yaml"

# adapter name (jurisdictions.yaml source_config.adapter) -> module, class
ADAPTERS = {
    "denver_permits_soda": ("pipeline.scrapers.denver_permits_soda", "DenverPermits"),
    "denver_licenses_soda": ("pipeline.scrapers.denver_permits_soda", "DenverContractorLicenses"),
    "accela_permits": ("pipeline.scrapers.accela_permits", "AccelaPermits"),
    "sam_gov_opportunities": ("pipeline.scrapers.sam_gov_opportunities", "SamGovOpportunities"),
}


def load_config(path: str = CONFIG_PATH) -> list[dict]:
    with open(path) as f:
        return yaml.safe_load(f)["jurisdictions"]


def seed_jurisdictions(conn, jurisdictions: list[dict]) -> int:
    """Upsert the yaml into the jurisdiction table. Idempotent; safe to re-run
    after every config edit."""
    n = 0
    with conn.cursor() as cur:
        for j in jurisdictions:
            cur.execute(
                """INSERT INTO jurisdiction (slug, name, kind, state, permit_system, source_config)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON CONFLICT (slug) DO UPDATE SET
                     name = EXCLUDED.name, kind = EXCLUDED.kind,
                     state = EXCLUDED.state, permit_system = EXCLUDED.permit_system,
                     source_config = EXCLUDED.source_config""",
                (j["slug"], j["name"], j["kind"], j["state"],
                 j.get("permit_system"), psycopg2.extras.Json(j.get("source_config", {}))),
            )
            n += 1
    conn.commit()
    return n


def run_jurisdiction(slug: str, config: list[dict]) -> dict:
    block = next((j for j in config if j["slug"] == slug), None)
    if not block:
        raise SystemExit(f"{slug}: not in {CONFIG_PATH}")
    adapter = block.get("source_config", {}).get("adapter")
    if not adapter or adapter not in ADAPTERS:
        raise SystemExit(f"{slug}: no runnable adapter (source_config.adapter = {adapter!r})")
    module_name, class_name = ADAPTERS[adapter]
    cls = getattr(importlib.import_module(module_name), class_name)
    scraper = cls(dsn(), slug, block.get("source_config", {}))
    return scraper.run()


def main(argv: list[str] | None = None):
    ap = argparse.ArgumentParser(prog="pipeline.run", description=__doc__)
    ap.add_argument("slugs", nargs="*", help="jurisdiction slugs, or 'all'")
    ap.add_argument("--seed", action="store_true", help="seed jurisdictions from yaml and exit")
    args = ap.parse_args(argv)

    config = load_config()
    if args.seed:
        conn = psycopg2.connect(dsn())
        n = seed_jurisdictions(conn, config)
        print(f"seeded {n} jurisdictions")
        return

    slugs = args.slugs
    if slugs == ["all"]:
        slugs = [j["slug"] for j in config
                 if j.get("source_config", {}).get("adapter") in ADAPTERS]
    if not slugs:
        ap.print_help()
        sys.exit(1)

    for slug in slugs:
        try:
            stats = run_jurisdiction(slug, config)
            print(f"{slug}: {json.dumps(stats)}")
        except NotImplementedError as e:
            print(f"{slug}: skipped — {e}")


if __name__ == "__main__":
    main()
