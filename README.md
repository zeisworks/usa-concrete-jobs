# USAConcreteJobs — public records layer for concrete work

Permit + license records for concrete contractors, aggregated from municipal and
county systems into canonical entity pages. Directory → claimed profiles →
marketplace, in that order, with the lead-signal layer feeding the existing
stratawidth/Instantly operation from day one.

## Why this works (one paragraph)
Colorado has no statewide GC license; concrete contractors are licensed
city-by-city and their work is disproportionately permitted (foundations,
flatwork over thresholds, retaining walls, structural cutting). The records are
public, fragmented, and miserable to access — which is exactly the aggregation
pain that makes the unified dataset defensible. Pages are primary-source
entity records (the Zillow pattern), not templated content, so they survive
AI Overviews and become the citable source when assistants are asked
"is this contractor legit."

The bid board closes the loop: open solicitations (SAM.gov, CDOT, BidNet,
city procurement, plus owner/GC direct postings) flow through the same
raw → resolve → publish pipeline into `/jobs`, so contractors come for work
and leave with a claimed record — and buyers can verify any bidder's permit
history on the same site.

## Repo layout
```
db/schema.sql                    Postgres schema: raw → entities → views
pipeline/
  config/jurisdictions.yaml      Front Range launch set + concrete keywords
  scrapers/base.py               Rate-limited, hash-deduped raw ingest
  scrapers/denver_permits_soda.py  Denver open data (start here — zero risk)
  scrapers/accela_permits.py     County portal pattern (API or Stagehand)
  scrapers/sam_gov_opportunities.py  Federal bid board ingest (SAM.gov API)
  resolve/entity_resolution.py   Name/phone/SoS-id match cascade + classifier
  load/lead_signals.py           Velocity + expiry signals → Instantly export
web/                             Next.js entity pages (ISR, JSON-LD, sitemap)
```

## Run order
```bash
createdb usaconcretejobs && psql usaconcretejobs < db/schema.sql
# seed jurisdictions from yaml (write a 10-line loader or insert by hand)
python -m pipeline.run denver-co            # raw ingest
python -m pipeline.resolve                  # entities + classification
psql -c "REFRESH MATERIALIZED VIEW CONCURRENTLY contractor_profile"
cd web && npm i && npm run dev              # renders from seed.json without DB
```

## Deployment (Cloudflare Workers)
The web app deploys to Cloudflare Workers via the OpenNext adapter
(`@opennextjs/cloudflare`); config lives in `web/wrangler.jsonc` and
`web/open-next.config.ts`.

```bash
cd web && npm run preview    # build + serve in the local Workers runtime
cd web && npm run deploy     # build + deploy with wrangler
```

For git-driven deploys, connect the repo in the Cloudflare dashboard
(Workers Builds) with root directory `web/`, build command
`npx opennextjs-cloudflare build`, and deploy command
`npx opennextjs-cloudflare deploy`.

Postgres access from the Worker: set `DATABASE_URL` as a Worker secret
(`wrangler secret put DATABASE_URL`); put a Cloudflare Hyperdrive in front of
the database for connection pooling once off seed data. Without it the app
serves the prerendered seed pages.

## Launch sequence and validation gates
1. **Recon (week 1).** Verify Denver open-data dataset IDs; recon each county
   portal per the checklist in `accela_permits.py`. Pull the CO Secretary of
   State bulk entity file for the resolution backbone.
2. **Denver only (weeks 1–2).** Full ingest, resolve, classify. Gate: does the
   keyword classifier hit >90% precision on a 100-permit hand check?
3. **Lead signal test (weeks 2–6).** Generate velocity/expiry signals, export
   to Instantly, run against the existing sequences. **This is the kill/scale
   gate: signal-personalized sends must beat the generic baseline on reply
   rate. If they don't, the data asset thesis is wrong — stop before building
   pages.**
4. **Public pages (weeks 6–10).** Ship contractor + city pages for Denver
   metro. Email contractors their own record ("your permit history is ranking
   for your name") — measure claim rate.
5. **Expand or pivot.** If claims and leads both convert, add counties and
   verticals. Architecture is already service-agnostic: `concrete_class` and
   the keyword config are the only concrete-specific pieces.

## Legal/positioning notes (not legal advice — review before launch)
- Everything published is public record, but rankings must stay factual:
  "most permits issued" is a fact; "best contractor" is an opinion that
  invites defamation exposure. The copy in the app holds that line — keep it.
- Honor correction requests by pointing to the issuing jurisdiction and
  re-scraping; never hand-edit records.
- Respect each portal's ToS and rate limits; Denver's open data makes it the
  risk-free start while county recon happens.
- Keep this entirely on personal infrastructure and personal time. No M&Q
  code, accounts, or data anywhere in this repo.
