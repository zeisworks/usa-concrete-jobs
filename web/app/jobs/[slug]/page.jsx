import { getJob, allJobSlugs, fmtUSD, fmtDate, daysUntil } from "../../../lib/data";
import { notFound } from "next/navigation";

export const revalidate = 86400;

const LEVEL_LABEL = { federal: "Federal", state: "State", local: "Local", private: "Private" };

export async function generateStaticParams() {
  const slugs = await allJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const j = await getJob(slug);
  if (!j) return {};
  return {
    title: `${j.title} — bids due ${fmtDate(j.due_on)}`,
    description: `${LEVEL_LABEL[j.source_level]} concrete bid: ${j.buyer}, ${j.city}, ${j.state}. Estimated ${fmtUSD(j.est_value)}, bids due ${fmtDate(j.due_on)}.`,
  };
}

export default async function JobPage({ params }) {
  const { slug } = await params;
  const j = await getJob(slug);
  if (!j) notFound();
  const days = daysUntil(j.due_on);
  const open = j.status === "open" && days >= 0;

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Bid board · {LEVEL_LABEL[j.source_level]} · {j.state}</p>
        <div className="head-row">
          <div>
            <h1>{j.title}</h1>
            <p className="locale">
              {j.buyer} · {j.city}, {j.state}
              {j.solicitation_no ? ` · Sol. no. ${j.solicitation_no}` : ""}
            </p>
          </div>
          <div className={`stamp ${open ? "" : "lapsed"}`}>
            {open ? `Bids due ${fmtDate(j.due_on)}` : "Bidding closed"}
            <small>{open ? `${days <= 0 ? "due today" : `${days} day${days === 1 ? "" : "s"} remaining`}` : `was due ${fmtDate(j.due_on)}`}</small>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{fmtUSD(j.est_value)}</b><span>estimated value</span></div>
        <div className="stat"><b>{j.concrete_class?.replace("_", " ") || "—"}</b><span>work class</span></div>
        <div className="stat"><b>{fmtDate(j.posted_on)}</b><span>posted</span></div>
        <div className="stat"><b>{j.set_aside || "None"}</b><span>set-aside</span></div>
      </div>

      <h2>Scope</h2>
      <div className="prose">
        <p>{j.description}</p>
      </div>

      <h2>How to bid</h2>
      <div className="prose">
        {j.source_url ? (
          <>
            <p>
              Bids go through the buyer&apos;s own system — this listing is a
              summary. The official solicitation has the full plans, specs,
              bonding requirements, and submission instructions.
            </p>
            <p><a className="cta" href={j.source_url} rel="nofollow noopener">View official solicitation →</a></p>
          </>
        ) : (
          <p>
            This scope was posted directly by the buyer. Contact{" "}
            <a href={`mailto:${j.contact}`}>{j.contact}</a> for plans and
            walk-through scheduling; reference the project title above.
          </p>
        )}
      </div>
      <p className="sourcenote">
        Always confirm scope, dates, licensing, and bonding in the official bid
        documents. Estimated value is the buyer&apos;s figure, not ours.
      </p>

      <div className="claim">
        <p>
          Bidding on this? Your permit history is your track record — buyers
          here can see it. Make sure your record reads the way it should.
        </p>
        <a href="/contractors">Find your record</a>
      </div>
    </article>
  );
}
