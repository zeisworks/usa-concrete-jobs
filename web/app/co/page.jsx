import { getCities, fmtUSD } from "../../lib/data";

export const revalidate = 86400;

export const metadata = {
  title: "Concrete permit activity by city — Colorado",
  description:
    "Monthly concrete permit volume, declared values, and active contractors for Colorado Front Range cities, from county and municipal records.",
};

export default async function CitiesIndex() {
  const cities = await getCities();

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">City records · Colorado</p>
        <h1>Concrete permits by city</h1>
        <p className="locale">
          Issued permits and declared values, aggregated from each city and
          county&apos;s own permit system. Front Range launch set; more
          jurisdictions as ingest expands.
        </p>
      </div>

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

      <p className="sourcenote">
        Counts reflect concrete-classified permits in the recorded window for
        each jurisdiction. Source systems refresh on different cadences.
      </p>
    </article>
  );
}
