-- usaconcretejobs.com — public records layer
-- Postgres 15+. Entity model: contractor is the canonical entity; licenses and
-- permits are records that resolve TO a contractor. Raw records are immutable;
-- resolution is re-runnable.

CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- fuzzy name matching
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Jurisdictions (CO licensing is municipal/county — no statewide GC license)
-- ---------------------------------------------------------------------------
CREATE TABLE jurisdiction (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,          -- 'denver-co', 'jefferson-county-co'
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('city','county','state','federal')),
  state         CHAR(2) NOT NULL,
  fips          TEXT,
  permit_system TEXT,                          -- 'socrata','arcgis','accela','etrakit','manual'
  license_system TEXT,
  source_config JSONB DEFAULT '{}'::jsonb,     -- endpoints, dataset ids, field maps
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Raw ingest (immutable; one row per source record per scrape)
-- ---------------------------------------------------------------------------
CREATE TABLE raw_record (
  id            BIGSERIAL PRIMARY KEY,
  jurisdiction_id INT REFERENCES jurisdiction(id),
  record_type   TEXT NOT NULL CHECK (record_type IN ('permit','license','violation','discipline','solicitation')),
  source_id     TEXT NOT NULL,                 -- the jurisdiction's own record id
  payload       JSONB NOT NULL,
  content_hash  TEXT NOT NULL,                 -- skip unchanged records on re-scrape
  scraped_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (jurisdiction_id, record_type, source_id, content_hash)
);
CREATE INDEX raw_record_jur_type_idx ON raw_record (jurisdiction_id, record_type);

-- ---------------------------------------------------------------------------
-- Canonical contractor entity
-- ---------------------------------------------------------------------------
CREATE TABLE contractor (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,          -- 'rocky-mountain-concrete-denver-co'
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,               -- lower, suffix-stripped (llc/inc/co)
  dba_names     TEXT[] DEFAULT '{}',
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  address       TEXT,
  city          TEXT,
  state         CHAR(2),
  zip           TEXT,
  sos_entity_id TEXT,                          -- CO Secretary of State id (strongest key)
  first_seen    DATE,
  last_activity DATE,
  claimed       BOOLEAN DEFAULT FALSE,         -- profile-claim monetization flag
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX contractor_name_trgm ON contractor USING gin (normalized_name gin_trgm_ops);
CREATE INDEX contractor_geo_idx ON contractor (state, city);

-- Aliases: every raw name/phone variant that resolved to this contractor.
CREATE TABLE contractor_alias (
  id            BIGSERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractor(id) ON DELETE CASCADE,
  alias_name    TEXT,
  alias_phone   TEXT,
  source_raw_id BIGINT REFERENCES raw_record(id),
  match_method  TEXT,                          -- 'sos_id','license_no','phone','fuzzy_name'
  match_score   NUMERIC(4,3),
  UNIQUE (contractor_id, alias_name, alias_phone)
);

-- ---------------------------------------------------------------------------
-- Licenses (municipal registries)
-- ---------------------------------------------------------------------------
CREATE TABLE license (
  id            BIGSERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractor(id),
  jurisdiction_id INT REFERENCES jurisdiction(id),
  license_no    TEXT NOT NULL,
  license_type  TEXT,                          -- jurisdiction's class, e.g. 'Class C General'
  status        TEXT,                          -- 'active','expired','suspended','revoked'
  issued_on     DATE,
  expires_on    DATE,
  bond_amount   NUMERIC(12,2),
  insurance_on_file BOOLEAN,
  raw_id        BIGINT REFERENCES raw_record(id),
  UNIQUE (jurisdiction_id, license_no)
);
CREATE INDEX license_contractor_idx ON license (contractor_id);

-- ---------------------------------------------------------------------------
-- Permits (the demand + activity signal)
-- ---------------------------------------------------------------------------
CREATE TABLE permit (
  id            BIGSERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractor(id),  -- NULL = homeowner/unresolved
  jurisdiction_id INT REFERENCES jurisdiction(id),
  permit_no     TEXT NOT NULL,
  permit_type   TEXT,
  work_class    TEXT,
  description   TEXT,
  concrete_class TEXT CHECK (concrete_class IN
    ('foundation','flatwork','driveway','retaining_wall','structural',
     'decorative','demolition','other')),       -- classified, see pipeline/resolve
  is_concrete   BOOLEAN DEFAULT FALSE,
  declared_value NUMERIC(14,2),
  status        TEXT,
  applied_on    DATE,
  issued_on     DATE,
  finaled_on    DATE,
  site_address  TEXT,
  site_city     TEXT,
  site_zip      TEXT,
  lat           NUMERIC(9,6),
  lon           NUMERIC(9,6),
  raw_id        BIGINT REFERENCES raw_record(id),
  UNIQUE (jurisdiction_id, permit_no)
);
CREATE INDEX permit_contractor_idx ON permit (contractor_id) WHERE contractor_id IS NOT NULL;
CREATE INDEX permit_concrete_idx ON permit (jurisdiction_id, issued_on) WHERE is_concrete;
CREATE INDEX permit_geo_idx ON permit (site_city, site_zip);

-- Violations / disciplinary actions
CREATE TABLE enforcement (
  id            BIGSERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractor(id),
  jurisdiction_id INT REFERENCES jurisdiction(id),
  kind          TEXT CHECK (kind IN ('code_violation','license_discipline','stop_work')),
  description   TEXT,
  occurred_on   DATE,
  resolved      BOOLEAN,
  raw_id        BIGINT REFERENCES raw_record(id)
);

-- ---------------------------------------------------------------------------
-- Lead layer (powers the stratawidth outreach integration)
-- ---------------------------------------------------------------------------
CREATE TABLE lead_signal (
  id            BIGSERIAL PRIMARY KEY,
  signal_type   TEXT NOT NULL,   -- 'permit_velocity_up','permit_velocity_down',
                                 -- 'homeowner_adjacent_permit','license_expiring'
  contractor_id UUID REFERENCES contractor(id),
  permit_id     BIGINT REFERENCES permit(id),
  detail        JSONB,
  score         NUMERIC(4,3),
  generated_on  DATE DEFAULT CURRENT_DATE,
  exported_at   TIMESTAMPTZ                    -- pushed to Instantly
);

-- ---------------------------------------------------------------------------
-- Bid board: open concrete work out for bid (federal/state/local/private).
-- Public solicitations arrive via scrapers (SAM.gov, CDOT, BidNet, city
-- procurement pages) as raw_record 'solicitation' rows and resolve here;
-- private rows are posted directly by buyers (raw_id NULL).
-- ---------------------------------------------------------------------------
CREATE TABLE bid_opportunity (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  source_level  TEXT NOT NULL CHECK (source_level IN ('federal','state','local','private')),
  buyer         TEXT NOT NULL,                 -- agency, owner, or GC issuing the bid
  solicitation_no TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  concrete_class TEXT CHECK (concrete_class IN
    ('foundation','flatwork','driveway','retaining_wall','structural',
     'decorative','demolition','other')),
  est_value     NUMERIC(14,2),                 -- engineer's estimate / declared budget
  set_aside     TEXT,                          -- e.g. 'Total Small Business' (federal)
  city          TEXT,
  state         CHAR(2),
  posted_on     DATE,
  due_on        DATE,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','closed','awarded','cancelled')),
  source_url    TEXT,                          -- the official solicitation (NULL = private)
  contact       TEXT,                          -- bid contact for private postings
  raw_id        BIGINT REFERENCES raw_record(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX bid_opportunity_open_idx ON bid_opportunity (due_on) WHERE status = 'open';
CREATE INDEX bid_opportunity_geo_idx ON bid_opportunity (state, city);

-- ---------------------------------------------------------------------------
-- Profile claims (web form → manual verification → contractor.claimed)
-- ---------------------------------------------------------------------------
CREATE TABLE claim_request (
  id            BIGSERIAL PRIMARY KEY,
  contractor_id UUID REFERENCES contractor(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  role          TEXT,                          -- 'owner','office','field','other'
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  verified_at   TIMESTAMPTZ                    -- set when ownership is confirmed
);
CREATE INDEX claim_request_contractor_idx ON claim_request (contractor_id);

-- ---------------------------------------------------------------------------
-- Page-serving views (what the Next.js app reads)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW contractor_profile AS
SELECT
  c.id, c.slug, c.canonical_name, c.city, c.state, c.claimed,
  count(p.id) FILTER (WHERE p.is_concrete)                      AS concrete_permits,
  count(p.id) FILTER (WHERE p.is_concrete
        AND p.issued_on > CURRENT_DATE - INTERVAL '12 months')  AS permits_12mo,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.declared_value)
        FILTER (WHERE p.is_concrete AND p.declared_value > 0)   AS median_job_value,
  min(p.issued_on)                                              AS first_permit,
  max(p.issued_on)                                              AS latest_permit,
  count(DISTINCT p.jurisdiction_id)                             AS jurisdictions_active,
  count(e.id)                                                   AS enforcement_count,
  bool_or(l.status = 'active')                                  AS has_active_license
FROM contractor c
LEFT JOIN permit p      ON p.contractor_id = c.id
LEFT JOIN license l     ON l.contractor_id = c.id
LEFT JOIN enforcement e ON e.contractor_id = c.id
GROUP BY c.id;
CREATE UNIQUE INDEX contractor_profile_id ON contractor_profile (id);

CREATE MATERIALIZED VIEW city_activity AS
SELECT
  p.site_city AS city, j.state,
  date_trunc('month', p.issued_on)::date AS month,
  p.concrete_class,
  count(*)              AS permits,
  sum(p.declared_value) AS total_value,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.declared_value)
      FILTER (WHERE p.declared_value > 0) AS median_value
FROM permit p JOIN jurisdiction j ON j.id = p.jurisdiction_id
WHERE p.is_concrete AND p.issued_on IS NOT NULL
GROUP BY 1,2,3,4;

-- Refresh after each pipeline run:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY contractor_profile;
--   REFRESH MATERIALIZED VIEW city_activity;
