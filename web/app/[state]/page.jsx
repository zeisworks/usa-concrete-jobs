import { getCities, getContractors, getJobsByState, getStates, fmtUSD } from "../../lib/data";
import { stateName } from "../../lib/states";
import JobRows from "../../components/JobRows";
import { notFound } from "next/navigation";

export const revalidate = 86400;

export async function generateStaticParams() {
  const states = await getStates();
  return states.map((s) => ({ state: s.abbr }));
}

export async function generateMetadata({ params }) {
  const { state } = await params;
  const name = stateName(state);
  if (!name) return {};
  return {
    title: `Concrete permits, contractors & open bids — ${name}`,
    description: `Concrete permit activity by city, permitted contractors, and work out for bid in ${name}, from official permit and procurement systems.`,
  };
}

export default async function StatePage({ params }) {
  const { state } = await params;
  const name = stateName(state);
  if (!name) notFound();
  const st = state.toUpperCase();

  const [allCities, allContractors, jobs] = await Promise.all([
    getCities(), getContractors(), getJobsByState(state),
  ]);
  const cities = allCities.filter((c) => c.state?.toUpperCase() === st);
  const contractors = allContractors.filter((c) => c.state?.toUpperCase() === st);
  if (!cities.length && !contractors.length && !jobs.length) notFound();
  const totalPermits = cities.reduce((s, c) => s + Number(c.permits), 0);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">State record · {name}</p>
        <h1>Concrete in {name}</h1>
        <p className="locale">
          Permit activity, permitted contractors, and work out for bid —
          aggregated from {name} city, county, and state systems of record.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{cities.length}</b><span>cities tracked</span></div>
        <div className="stat"><b>{contractors.length}</b><span>contractors on record</span></div>
        <div className="stat"><b>{totalPermits}</b><span>permits in window</span></div>
        <div className="stat"><b>{jobs.length}</b><span>jobs open for bid</span></div>
      </div>

      {cities.length > 0 && (
        <>
          <h2>Cities</h2>
          <div className="cards">
            {cities.map((c) => (
              <a className="card" key={c.slug} href={`/${state.toLowerCase()}/${c.slug}`}>
                <span className="card-eyebrow">{c.state}</span>
                <b>{c.name}</b>
                <span className="card-line">{c.permits} permits on record</span>
                <span className="card-line">{fmtUSD(c.total_value)} declared</span>
              </a>
            ))}
          </div>
        </>
      )}

      {jobs.length > 0 && (
        <>
          <h2>Open for bid in {name}</h2>
          <JobRows jobs={jobs} />
          <p className="sourcenote">
            From each buyer&apos;s official solicitation system. <a href="/jobs">All open jobs →</a>
          </p>
        </>
      )}

      {contractors.length > 0 && (
        <>
          <h2>Most active permitted contractors</h2>
          <table className="lic">
            <thead>
              <tr><th>Contractor</th><th>City</th><th>Permits (12 mo)</th><th>Median job</th><th>License</th></tr>
            </thead>
            <tbody>
              {contractors.map((c) => (
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
          <p className="sourcenote">Ranking reflects permit volume only — a public-records fact, not an endorsement.</p>
        </>
      )}
    </article>
  );
}
