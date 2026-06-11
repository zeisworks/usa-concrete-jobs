import { getStates, getContractors, getJobs, fmtUSD } from "../lib/data";
import { stateName } from "../lib/states";
import JobRows from "../components/JobRows";

export const revalidate = 86400;

export default async function Home() {
  const [states, contractors, jobs] = await Promise.all([getStates(), getContractors(), getJobs()]);
  const totalPermits = states.reduce((s, c) => s + Number(c.permits), 0);
  const top = contractors.slice(0, 5);
  const nextJobs = jobs.slice(0, 5);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Public records · permits · licenses · open bids</p>
        <h1>Every concrete job is a public record.<br />We put them in one place.</h1>
        <p className="locale">
          Permit and license records for concrete contractors — and concrete
          work out for bid, federal to private — sourced directly from the
          systems of record, coast to coast.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{jobs.length}</b><span>jobs open for bid</span></div>
        <div className="stat"><b>{states.length}</b><span>states tracked</span></div>
        <div className="stat"><b>{contractors.length}</b><span>contractors on record</span></div>
        <div className="stat"><b>{totalPermits}</b><span>permits in window</span></div>
        <div className="stat"><b>Daily</b><span>refresh cadence</span></div>
      </div>

      <h2>Open for bid</h2>
      <JobRows jobs={nextJobs} />
      <p><a href="/jobs">All open jobs →</a></p>

      <h2>Browse by state</h2>
      <div className="cards">
        {states.map((s) => (
          <a className="card" key={s.abbr} href={`/${s.abbr}`}>
            <span className="card-eyebrow">{s.state}</span>
            <b>{stateName(s.abbr)}</b>
            <span className="card-line">{s.cities} cit{s.cities === 1 ? "y" : "ies"} tracked</span>
            <span className="card-line">{s.permits} permits · {fmtUSD(s.total_value)}</span>
          </a>
        ))}
      </div>
      <p><a href="/cities">All cities →</a></p>

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
            Permit, license, and bid records pulled daily from federal, state,
            city, and county systems — open data where it exists, public
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
