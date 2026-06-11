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

export async function getCity(citySlug) {
  if (!pool) return seed.cities.find((c) => c.slug === citySlug) || null;
  const city = citySlug.replace(/-/g, " ");
  const { rows } = await pool.query(
    `SELECT month, concrete_class, permits, total_value, median_value
     FROM city_activity WHERE lower(city) = lower($1)
     ORDER BY month DESC LIMIT 60`, [city]);
  const top = await pool.query(
    `SELECT c.slug, c.canonical_name, cp.permits_12mo, cp.median_job_value,
            cp.has_active_license
     FROM contractor c JOIN contractor_profile cp ON cp.id = c.id
     WHERE lower(c.city) = lower($1) AND cp.permits_12mo > 0
     ORDER BY cp.permits_12mo DESC LIMIT 25`, [city]);
  return rows.length || top.rows.length
    ? { slug: citySlug, name: titleCase(city), activity: rows, contractors: top.rows }
    : null;
}

export async function getCities() {
  if (!pool)
    return seed.cities.map((c) => ({
      slug: c.slug,
      name: c.name,
      state: "CO",
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

export async function allCitySlugs() {
  if (!pool) return seed.cities.map((c) => c.slug);
  const { rows } = await pool.query(
    `SELECT DISTINCT lower(replace(city, ' ', '-')) AS slug FROM city_activity`);
  return rows.map((r) => r.slug);
}

const titleCase = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

export const fmtUSD = (n) =>
  n == null ? "—" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
