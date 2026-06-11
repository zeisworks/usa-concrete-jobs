import { getCity } from "../lib/data";

export default async function Home() {
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
        <div className="stat"><b>6</b><span>jurisdictions ingested</span></div>
        <div className="stat"><b>Front Range</b><span>launch market</span></div>
        <div className="stat"><b>Daily</b><span>refresh cadence</span></div>
      </div>
      <h2>Browse</h2>
      <p><a href="/co/golden">Concrete permits in Golden, CO →</a></p>
      <p><a href="/contractor/rocky-mountain-concrete-golden-co">Sample contractor record →</a></p>
    </article>
  );
}
