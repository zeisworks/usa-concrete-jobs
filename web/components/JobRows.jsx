import { fmtUSD, fmtDate, daysUntil } from "../lib/data";

// Shared bid-board ledger. `second` picks the second column: the work class
// (within a level section) or the source level (mixed lists).
export default function JobRows({ jobs, second = "level", showCity = true }) {
  return (
    <div className="ledger">
      <div className="ledger-row ledger-head">
        <span>Bids due</span>
        <span>{second === "class" ? "Class" : "Level"}</span>
        <span>Project</span>
        <span>Est. value</span>
        <span>Closes</span>
      </div>
      {jobs.map((j) => {
        const days = daysUntil(j.due_on);
        return (
          <div className="ledger-row" key={j.slug}>
            <span className="no">{fmtDate(j.due_on)}</span>
            <span className="class">
              {second === "class" ? j.concrete_class?.replace("_", " ") : j.source_level}
            </span>
            <span>
              <a href={`/jobs/${j.slug}`}>{j.title}</a> — {j.buyer}
              {showCity ? ` · ${j.city}, ${j.state}` : ""}
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
