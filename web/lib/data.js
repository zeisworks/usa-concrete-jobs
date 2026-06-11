// Data access for entity pages. With DATABASE_URL set, reads the materialized
// views from db/schema.sql. Without it, falls back to seed JSON so `npm run dev`
// renders real-looking pages immediately.
import { Pool } from "pg";
import seed from "../data/seed.json" assert { type: "json" };

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function getContractor(slug) {
  if (!pool) return seed.contractors.find((c) => c.slug === slug) || null;
  const { rows } = await pool.query(
    `SELECT c.*, cp.concrete_permits, cp.permits_12mo, cp.median_job_value,
            cp.first_permit, cp.latest_permit, cp.jurisdictions_active,
            cp.enforcement_count, cp.has_active_license
     FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
     WHERE c.slug = $1`, [slug]);
  if (!rows[0]) return null;
  const permits = await pool.query(
    `SELECT permit_no, concrete_class, description, declared_value,
            issued_on, status, site_city, j.name AS jurisdiction
     FROM permit p JOIN jurisdiction j ON j.id = p.jurisdiction_id
     WHERE p.contractor_id = $1 AND p.is_concrete
     ORDER BY issued_on DESC NULLS LAST LIMIT 50`, [rows[0].id]);
  const licenses = await pool.query(
    `SELECT license_no, license_type, status, expires_on, j.name AS jurisdiction
     FROM license l JOIN jurisdiction j ON j.id = l.jurisdiction_id
     WHERE l.contractor_id = $1`, [rows[0].id]);
  return { ...rows[0], permits: permits.rows, licenses: licenses.rows };
}

export async function getCity(stateAbbr, citySlug) {
  const st = String(stateAbbr).toLowerCase();
  if (!pool)
    return seed.cities.find(
      (c) => c.slug === citySlug && c.state.toLowerCase() === st) || null;
  const city = citySlug.replace(/-/g, " ");
  const { rows } = await pool.query(
    `SELECT month, concrete_class, permits, total_value, median_value
     FROM city_activity WHERE lower(city) = lower($1) AND lower(state) = $2
     ORDER BY month DESC LIMIT 60`, [city, st]);
  const top = await pool.query(
    `SELECT c.slug, c.canonical_name, cp.permits_12mo, cp.median_job_value,
            cp.has_active_license
     FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
     WHERE lower(c.city) = lower($1) AND lower(c.state) = $2 AND cp.permits_12mo > 0
     ORDER BY cp.permits_12mo DESC LIMIT 25`, [city, st]);
  return rows.length || top.rows.length
    ? { slug: citySlug, name: titleCase(city), state: st.toUpperCase(), activity: rows, contractors: top.rows }
    : null;
}

export async function getCities() {
  if (!pool)
    return seed.cities.map((c) => ({
      slug: c.slug,
      name: c.name,
      state: c.state,
      permits: c.activity.reduce((s, a) => s + Number(a.permits), 0),
      total_value: c.activity.reduce((s, a) => s + Number(a.total_value), 0),
      contractors: c.contractors.length,
    }));
  const { rows } = await pool.query(
    `SELECT lower(replace(city, ' ', '-')) AS slug, city AS name, state,
            sum(permits)::int AS permits, sum(total_value) AS total_value,
            0 AS contractors
     FROM city_activity
     WHERE month > CURRENT_DATE - INTERVAL '12 months'
     GROUP BY 1, 2, 3 ORDER BY permits DESC`);
  return rows;
}

// States with any tracked activity, aggregated from the city rollup.
export async function getStates() {
  const cities = await getCities();
  const byState = new Map();
  for (const c of cities) {
    const key = c.state.toLowerCase();
    const s = byState.get(key) || { abbr: key, state: c.state, cities: 0, permits: 0, total_value: 0 };
    s.cities += 1;
    s.permits += Number(c.permits);
    s.total_value += Number(c.total_value);
    byState.set(key, s);
  }
  return [...byState.values()].sort((a, b) => b.permits - a.permits);
}

export async function getContractors() {
  if (!pool)
    return seed.contractors.map((c) => ({
      slug: c.slug,
      canonical_name: c.canonical_name,
      city: c.city,
      state: c.state,
      concrete_permits: c.concrete_permits,
      permits_12mo: c.permits_12mo,
      median_job_value: c.median_job_value,
      has_active_license: c.has_active_license,
    }));
  const { rows } = await pool.query(
    `SELECT c.slug, c.canonical_name, c.city, c.state, cp.concrete_permits,
            cp.permits_12mo, cp.median_job_value, cp.has_active_license
     FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
     WHERE cp.concrete_permits > 0
     ORDER BY cp.permits_12mo DESC, cp.concrete_permits DESC LIMIT 500`);
  return rows;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export async function getJobs() {
  if (!pool)
    return seed.jobs
      .filter((j) => j.status === "open" && j.due_on >= todayISO())
      .sort((a, b) => a.due_on.localeCompare(b.due_on));
  const { rows } = await pool.query(
    `SELECT slug, title, source_level, buyer, solicitation_no, concrete_class,
            est_value, set_aside, city, state, posted_on, due_on, status,
            source_url, contact
     FROM bid_opportunity
     WHERE status = 'open' AND due_on >= CURRENT_DATE
     ORDER BY due_on`);
  return rows;
}

export async function getJob(slug) {
  if (!pool) return seed.jobs.find((j) => j.slug === slug) || null;
  const { rows } = await pool.query(
    `SELECT * FROM bid_opportunity WHERE slug = $1`, [slug]);
  return rows[0] || null;
}

export async function getJobsByCity(cityName, stateAbbr) {
  const jobs = await getJobs();
  return jobs.filter(
    (j) =>
      j.city?.toLowerCase() === cityName.toLowerCase() &&
      (!stateAbbr || j.state?.toLowerCase() === String(stateAbbr).toLowerCase()));
}

export async function getJobsByState(stateAbbr) {
  const jobs = await getJobs();
  return jobs.filter((j) => j.state?.toLowerCase() === String(stateAbbr).toLowerCase());
}

export async function allJobSlugs() {
  const jobs = await getJobs();
  return jobs.map((j) => j.slug);
}

export async function createClaimRequest({ slug, name, email, phone, role, message }) {
  if (!pool) {
    // No database connected (seed mode): keep the request in worker logs so
    // nothing is silently dropped before the claim_request table is live.
    console.log("claim_request (no DB)", JSON.stringify({ slug, name, email, phone, role, message }));
    return true;
  }
  const { rows } = await pool.query(`SELECT id FROM contractor WHERE slug = $1`, [slug]);
  if (!rows[0]) return false;
  await pool.query(
    `INSERT INTO claim_request (contractor_id, name, email, phone, role, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [rows[0].id, name, email, phone, role, message]);
  return true;
}

export async function allContractorSlugs() {
  if (!pool) return seed.contractors.map((c) => c.slug);
  const { rows } = await pool.query(`SELECT slug FROM contractor`);
  return rows.map((r) => r.slug);
}

export async function allCityParams() {
  if (!pool)
    return seed.cities.map((c) => ({ state: c.state.toLowerCase(), city: c.slug }));
  const { rows } = await pool.query(
    `SELECT DISTINCT lower(state) AS state,
            lower(replace(city, ' ', '-')) AS city
     FROM city_activity`);
  return rows;
}

const titleCase = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

export const fmtUSD = (n) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const fmtDate = (iso) =>
  iso == null
    ? "—"
    : new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

export const daysUntil = (iso) =>
  Math.ceil((new Date(`${String(iso).slice(0, 10)}T00:00:00`) - Date.now()) / 86400000);
