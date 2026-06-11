import { getContractors, fmtUSD } from "../../lib/data";

export const revalidate = 86400;

export const metadata = {
  title: "Contractor records — concrete permits & licenses",
  description:
    "Permit history and license status for concrete contractors across the United States, sourced from municipal, county, and state records.",
};

export default async function ContractorsIndex() {
  const contractors = await getContractors();

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Contractor records · United States</p>
        <h1>Concrete contractors on record</h1>
        <p className="locale">
          Every contractor below resolved from permit and license filings —
          ordered by permit volume, a public-records fact, not an endorsement.
        </p>
      </div>

      <table className="lic">
        <thead>
          <tr><th>Contractor</th><th>City</th><th>Permits (12 mo)</th><th>On record</th><th>Median job</th><th>License</th></tr>
        </thead>
        <tbody>
          {contractors.map((c) => (
            <tr key={c.slug}>
              <td><a href={`/contractor/${c.slug}`}>{c.canonical_name}</a></td>
              <td>{c.city}, {c.state}</td>
              <td>{c.permits_12mo}</td>
              <td>{c.concrete_permits}</td>
              <td>{fmtUSD(c.median_job_value)}</td>
              <td><span className={`pill ${c.has_active_license ? "active" : "lapsed"}`}>{c.has_active_license ? "active" : "none found"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sourcenote">
        License status is checked against the issuing jurisdiction&apos;s
        registry. &ldquo;None found&rdquo; means no active license matched in
        the jurisdictions we ingest — not that none exists anywhere.
      </p>
    </article>
  );
}
