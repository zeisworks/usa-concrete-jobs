export default function NotFound() {
  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">404 · no record found</p>
        <h1>No record at this address</h1>
        <p className="locale">
          The page you&apos;re looking for doesn&apos;t exist — or the record
          behind it hasn&apos;t been ingested yet.
        </p>
      </div>
      <div className="prose">
        <p>
          Try browsing <a href="/cities">cities</a>,{" "}
          <a href="/jobs">open jobs</a>, or{" "}
          <a href="/contractors">contractors on record</a>, or head{" "}
          <a href="/">back to the front page</a>.
        </p>
      </div>
    </article>
  );
}
