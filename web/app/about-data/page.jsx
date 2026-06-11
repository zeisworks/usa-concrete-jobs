export const metadata = {
  title: "About the data — sources, methodology, corrections",
  description:
    "Where USAConcreteJobs records come from, how contractors are matched across jurisdictions, what the numbers mean, and how to request a correction.",
};

export default function AboutData() {
  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Methodology · sources · corrections</p>
        <h1>About the data</h1>
        <p className="locale">
          Every number on this site traces back to a public record filed with a
          city or county. This page explains how.
        </p>
      </div>

      <h2>Where records come from</h2>
      <div className="prose">
        <p>
          Colorado has no statewide general-contractor license. Concrete
          contractors are licensed city-by-city and county-by-county, and most
          concrete work — foundations, flatwork over local thresholds,
          retaining walls, structural cutting — requires a building permit. We
          pull those records directly from each jurisdiction&apos;s own permit
          and licensing systems: open-data portals where they exist, public
          lookup portals where they don&apos;t.
        </p>
        <p>
          We do not collect reviews, accept paid placements, or editorialize.
          A contractor page is a ledger of that company&apos;s public filings,
          nothing more.
        </p>
      </div>

      <h2>How contractors are matched</h2>
      <div className="prose">
        <p>
          The same company appears under different names across systems —
          &ldquo;Rocky Mountain Concrete LLC&rdquo; in one county,
          &ldquo;Rocky Mtn Concrete&rdquo; in another. We resolve these
          variants into one canonical record using, in order of strength:
          Colorado Secretary of State entity IDs, license numbers, phone
          numbers, and normalized-name matching. Every alias that resolved to
          a record is retained, so matches are auditable and re-runnable.
        </p>
      </div>

      <h2>What the numbers mean</h2>
      <table className="lic">
        <thead><tr><th>Field</th><th>Definition</th></tr></thead>
        <tbody>
          <tr>
            <td>Permits on record</td>
            <td>Concrete-classified permits naming this contractor across all jurisdictions we ingest.</td>
          </tr>
          <tr>
            <td>Permits, last 12 months</td>
            <td>Same count, restricted to permits issued in the trailing 12 months.</td>
          </tr>
          <tr>
            <td>Median declared job value</td>
            <td>Median of values the applicant declared on the permit. Declared values are as filed — they are not verified contract prices.</td>
          </tr>
          <tr>
            <td>License status</td>
            <td>Checked against the issuing jurisdiction&apos;s registry. &ldquo;None found&rdquo; means no active license matched in the jurisdictions we ingest, not that none exists anywhere.</td>
          </tr>
          <tr>
            <td>Enforcement actions</td>
            <td>Code violations, license discipline, and stop-work orders on the public record, resolved or not.</td>
          </tr>
        </tbody>
      </table>

      <h2>What we deliberately don&apos;t say</h2>
      <div className="prose">
        <p>
          Rankings on this site reflect permit volume only. &ldquo;Most permits
          issued&rdquo; is a fact from the public record; &ldquo;best
          contractor&rdquo; is an opinion, and we don&apos;t publish opinions.
          A high permit count is not an endorsement, and a low one is not a
          warning — plenty of excellent specialists pull few permits.
        </p>
      </div>

      <h2>Freshness</h2>
      <div className="prose">
        <p>
          Source systems are re-scraped on a daily cadence and pages rebuild as
          records change. Each contractor page shows the date of its latest
          record. Jurisdictions publish on different schedules, so a permit can
          take a few days to appear here after issuance.
        </p>
      </div>

      <h2>Corrections</h2>
      <div className="prose">
        <p>
          We publish what the issuing jurisdiction publishes — we never
          hand-edit records. If a record is wrong, the fix is at the source:
          contact the issuing city or county, and once their system reflects
          the correction, the next scrape picks it up automatically. If a
          record has been resolved to the wrong company (a mismatch, not a
          source error), claim the record from its page and flag it in the
          message — mismatches we can and do fix.
        </p>
      </div>
    </article>
  );
}
