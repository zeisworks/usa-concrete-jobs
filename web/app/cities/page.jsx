import { getCities, getStates, fmtUSD } from "../../lib/data";
import { stateName } from "../../lib/states";

export const revalidate = 86400;

export const metadata = {
  title: "Concrete permit activity by city — United States",
  description:
    "Monthly concrete permit volume, declared values, and active contractors by city, sourced from each jurisdiction's own permit system. Coverage expanding metro by metro.",
};

export default async function CitiesIndex() {
  const [cities, states] = await Promise.all([getCities(), getStates()]);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">City records · United States</p>
        <h1>Concrete permits by city</h1>
        <p className="locale">
          Issued permits and declared values, aggregated from each city and
          county&apos;s own permit system. Coverage expands metro by metro —
          {" "}{states.length} states and counting.
        </p>
      </div>

      {states.map((s) => (
        <section key={s.abbr}>
          <h2><a href={`/${s.abbr}`}>{stateName(s.abbr)}</a></h2>
          <div className="cards">
            {cities
              .filter((c) => c.state?.toLowerCase() === s.abbr)
              .map((c) => (
                <a className="card" key={`${s.abbr}-${c.slug}`} href={`/${s.abbr}/${c.slug}`}>
                  <span className="card-eyebrow">{c.state}</span>
                  <b>{c.name}</b>
                  <span className="card-line">{c.permits} permits on record</span>
                  <span className="card-line">{fmtUSD(c.total_value)} declared</span>
                </a>
              ))}
          </div>
        </section>
      ))}

      <p className="sourcenote">
        Counts reflect concrete-classified permits in the recorded window for
        each jurisdiction. Source systems refresh on different cadences.
      </p>
    </article>
  );
}
