import { getJobs, fmtUSD, fmtDate, daysUntil } from "../../lib/data";

export const revalidate = 86400;

export const metadata = {
  title: "Open concrete jobs for bid — federal, state, local & private",
  description:
    "Concrete work currently out for bid on the Colorado Front Range: federal solicitations, CDOT and state projects, city and county programs, and private postings.",
};

const LEVELS = [
  ["federal", "Federal", "Solicitations from SAM.gov — Davis-Bacon wages, set-asides as noted."],
  ["state", "State", "CDOT, state agencies, and higher-ed institutions."],
  ["local", "Local", "City, county, and district procurement."],
  ["private", "Private", "Owners and GCs posting concrete scopes directly."],
];

function JobRows({ jobs }) {
  return (
    <div className="ledger">
      <div className="ledger-row ledger-head">
        <span>Bids due</span><span>Class</span><span>Project</span><span>Est. value</span><span>Closes</span>
      </div>
      {jobs.map((j) => {
        const days = daysUntil(j.due_on);
        return (
          <div className="ledger-row" key={j.slug}>
            <span className="no">{fmtDate(j.due_on)}</span>
            <span className="class">{j.concrete_class?.replace("_", " ")}</span>
            <span>
              <a href={`/jobs/${j.slug}`}>{j.title}</a> — {j.buyer} · {j.city}, {j.state}
            </span>
            <span className="val">{fmtUSD(j.est_value)}</span>
            <span className={`date ${days <= 7 ? "due-soon" : ""}`}>
              {days <= 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function JobsBoard() {
  const jobs = await getJobs();
  const closingSoon = jobs.filter((j) => daysUntil(j.due_on) <= 14).length;
  const totalValue = jobs.reduce((s, j) => s + Number(j.est_value || 0), 0);

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Bid board · Colorado</p>
        <h1>Open concrete jobs</h1>
        <p className="locale">
          Concrete work currently out for bid — federal, state, local, and
          private — pulled from each buyer&apos;s official solicitation system.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{jobs.length}</b><span>open for bid now</span></div>
        <div className="stat"><b>{closingSoon}</b><span>closing within 14 days</span></div>
        <div className="stat"><b>{fmtUSD(totalValue)}</b><span>combined est. value</span></div>
        <div className="stat"><b>Daily</b><span>refresh cadence</span></div>
      </div>

      {LEVELS.map(([level, label, blurb]) => {
        const rows = jobs.filter((j) => j.source_level === level);
        if (!rows.length) return null;
        return (
          <section key={level}>
            <h2>{label}</h2>
            <p className="sourcenote">{blurb}</p>
            <JobRows jobs={rows} />
          </section>
        );
      })}

      <p className="sourcenote">
        Listings summarize the buyer&apos;s official solicitation — always
        confirm scope, dates, and bonding in the official documents before
        bidding. Estimated values are the buyer&apos;s, not ours.
      </p>

      <div className="claim">
        <p>
          Buying concrete work? Owners and GCs can post a scope here directly —
          bids come from contractors whose permit history you can verify on
          this site.
        </p>
        <a href="mailto:bids@usaconcretejobs.com?subject=Post%20a%20job">Post a job</a>
      </div>
    </article>
  );
}
