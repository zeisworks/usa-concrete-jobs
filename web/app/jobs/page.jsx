import { getJobs, fmtUSD, daysUntil } from "../../lib/data";
import JobRows from "../../components/JobRows";

export const revalidate = 86400;

export const metadata = {
  title: "Open concrete jobs for bid — federal, state, local & private",
  description:
    "Concrete work currently out for bid across the United States: federal solicitations, state DOT projects, city and county programs, and private postings.",
};

const LEVELS = [
  ["federal", "Federal", "Solicitations from SAM.gov — Davis-Bacon wages, set-asides as noted."],
  ["state", "State", "DOTs, state agencies, and higher-ed institutions."],
  ["local", "Local", "City, county, and district procurement."],
  ["private", "Private", "Owners and GCs posting concrete scopes directly."],
];

export default async function JobsBoard() {
  const jobs = await getJobs();
  const closingSoon = jobs.filter((j) => daysUntil(j.due_on) <= 14).length;
  const totalValue = jobs.reduce((s, j) => s + Number(j.est_value || 0), 0);
  const stateCount = new Set(jobs.map((j) => j.state)).size;

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Bid board · United States</p>
        <h1>Open concrete jobs</h1>
        <p className="locale">
          Concrete work currently out for bid — federal, state, local, and
          private — pulled from each buyer&apos;s official solicitation system.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{jobs.length}</b><span>open for bid now</span></div>
        <div className="stat"><b>{closingSoon}</b><span>closing within 14 days</span></div>
        <div className="stat"><b>{stateCount}</b><span>states with open work</span></div>
        <div className="stat"><b>{fmtUSD(totalValue)}</b><span>combined est. value</span></div>
      </div>

      {LEVELS.map(([level, label, blurb]) => {
        const rows = jobs.filter((j) => j.source_level === level);
        if (!rows.length) return null;
        return (
          <section key={level}>
            <h2>{label}</h2>
            <p className="sourcenote">{blurb}</p>
            <JobRows jobs={rows} second="class" />
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
