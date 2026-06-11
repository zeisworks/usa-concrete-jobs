import { getCities, getContractors, fmtUSD } from "../lib/data";

export const revalidate = 86400;

export default async function Home() {
  const [cities, contractors] = await Promise.all([getCities(), getContractors()]);
  const totalPermits = cities.reduce((s, c) => s + Number(c.permits), 0);
  const top = contractors.slice(0, 5);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Public records · permits · licenses</p>
        <h1>Every concrete job is a public record.<br />We put them in one place.</h1>
        <p className="locale">
          Permit and license records for concrete contractors, sourced directly
          from city and county systems. Starting with the Colorado Front Range.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{cities.length}</b><span>cities tracked</span></div>
        <div className="stat"><b>{contractors.length}</b><span>contractors on record</span></div>
        <div className="stat"><b>{totalPermits}</b><span>permits in window</span></div>
        <div className="stat"><b>Daily</b><span>refresh cadence</span></div>
      </div>

      <h2>Browse by city</h2>
      <div className="cards">
        {cities.map((c) => (
          <a className="card" key={c.slug} href={`/co/${c.slug}`}>
            <span className="card-eyebrow">{c.state || "CO"}</span>
            <b>{c.name}</b>
            <span className="card-line">{c.permits} permits on record</span>
            <span className="card-line">{fmtUSD(c.total_value)} declared</span>
          </a>
        ))}
      </div>
      <p><a href="/co">All cities →</a></p>

      <h2>Most active permitted contractors</h2>
      <table className="lic">
        <thead>
          <tr><th>Contractor</th><th>City</th><th>Permits (12 mo)</th><th>Median job</th><th>License</th></tr>
        </thead>
        <tbody>
          {top.map((c) => (
            <tr key={c.slug}>
              <td><a href={`/contractor/${c.slug}`}>{c.canonical_name}</a></td>
              <td>{c.city}, {c.state}</td>
              <td>{c.permits_12mo}</td>
              <td>{fmtUSD(c.median_job_value)}</td>
              <td><span className={`pill ${c.has_active_license ? "active" : "lapsed"}`}>{c.has_active_license ? "active" : "none found"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sourcenote">
        Ranking reflects permit volume only — a public-records fact, not an
        endorsement. <a href="/contractors">All contractors →</a>
      </p>

      <h2>How it works</h2>
      <div className="steps">
        <div className="step">
          <span className="step-no">01</span>
          <b>Ingest</b>
          <p>
            Permit and license records pulled daily from each city and
            county&apos;s own systems — open data where it exists, public
            portals where it doesn&apos;t.
          </p>
        </div>
        <div className="step">
          <span className="step-no">02</span>
          <b>Resolve</b>
          <p>
            Name variants across jurisdictions are matched into one canonical
            contractor record via state entity IDs, license numbers, and phone
            matching.
          </p>
        </div>
        <div className="step">
          <span className="step-no">03</span>
          <b>Publish</b>
          <p>
            Each contractor gets a primary-source ledger: permits, declared
            values, license status, enforcement actions. Facts only —{" "}
            <a href="/about-data">see the methodology</a>.
          </p>
        </div>
      </div>

      <div className="claim">
        <p>
          Contractors: your permit history is already public — and probably
          already ranking for your name. Find your record and claim it to add
          your contact details and service area.
        </p>
        <a href="/contractors">Find your record</a>
      </div>
    </article>
  );
}
