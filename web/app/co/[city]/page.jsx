import { getCity, allCitySlugs, fmtUSD } from "../../../lib/data";
import { notFound } from "next/navigation";

export const revalidate = 86400;

export async function generateStaticParams() {
  const slugs = await allCitySlugs();
  return slugs.map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const c = await getCity(params.city);
  if (!c) return {};
  return {
    title: `Concrete permits in ${c.name}, CO — activity & contractors`,
    description: `Monthly concrete permit volume, declared values, and the most active permitted contractors in ${c.name}, Colorado.`,
  };
}

export default async function CityPage({ params }) {
  const c = await getCity(params.city);
  if (!c) notFound();
  const latestMonth = c.activity[0]?.month;
  const latest = c.activity.filter((a) => a.month === latestMonth);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">City record · Colorado</p>
        <h1>Concrete permits — {c.name}</h1>
        <p className="locale">Issued permits, declared values, and active contractors from county and municipal records</p>
      </div>

      <div className="stats">
        <div className="stat"><b>{latest.reduce((s, a) => s + Number(a.permits), 0)}</b><span>permits this month</span></div>
        <div className="stat"><b>{fmtUSD(latest.reduce((s, a) => s + Number(a.total_value), 0))}</b><span>declared value this month</span></div>
        <div className="stat"><b>{c.contractors.length}</b><span>contractors active (12 mo)</span></div>
      </div>

      <h2>This month by class</h2>
      <div className="ledger">
        <div className="ledger-row ledger-head">
          <span>Month</span><span>Class</span><span></span><span>Median</span><span>Permits</span>
        </div>
        {latest.map((a) => (
          <div className="ledger-row" key={a.concrete_class}>
            <span className="no">{String(a.month).slice(0, 7)}</span>
            <span className="class">{a.concrete_class.replace("_", " ")}</span>
            <span></span>
            <span className="val">{fmtUSD(a.median_value)}</span>
            <span className="date">{a.permits}</span>
          </div>
        ))}
      </div>

      <h2>Most active permitted contractors</h2>
      <table className="lic">
        <thead><tr><th>Contractor</th><th>Permits (12 mo)</th><th>Median job</th><th>License</th></tr></thead>
        <tbody>
          {c.contractors.map((t) => (
            <tr key={t.slug}>
              <td><a href={`/contractor/${t.slug}`}>{t.canonical_name}</a></td>
              <td>{t.permits_12mo}</td>
              <td>{fmtUSD(t.median_job_value)}</td>
              <td><span className={`pill ${t.has_active_license ? "active" : "lapsed"}`}>{t.has_active_license ? "active" : "none found"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sourcenote">Ranking reflects permit volume only — a public-records fact, not an endorsement.</p>
    </article>
  );
}
