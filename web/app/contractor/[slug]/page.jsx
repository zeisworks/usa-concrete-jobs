import { getContractor, allContractorSlugs, fmtUSD } from "../../../lib/data";
import { notFound } from "next/navigation";

export const revalidate = 86400; // ISR: rebuild daily as pipeline refreshes

export async function generateStaticParams() {
  const slugs = await allContractorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const c = await getContractor(params.slug);
  if (!c) return {};
  return {
    title: `${c.canonical_name} — license & permit record, ${c.city}, ${c.state}`,
    description: `${c.canonical_name}: ${c.concrete_permits} concrete permits on record, license status, and declared job values from ${c.jurisdictions_active} jurisdiction(s).`,
  };
}

export default async function ContractorPage({ params }) {
  const c = await getContractor(params.slug);
  if (!c) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: c.canonical_name,
    address: { "@type": "PostalAddress", addressLocality: c.city, addressRegion: c.state },
    // Structured, citable record — this block is what makes the page the
    // source an assistant cites when asked "is this contractor legit".
    additionalProperty: [
      { "@type": "PropertyValue", name: "concretePermitsOnRecord", value: c.concrete_permits },
      { "@type": "PropertyValue", name: "permitsLast12Months", value: c.permits_12mo },
      { "@type": "PropertyValue", name: "medianDeclaredJobValueUSD", value: c.median_job_value },
      { "@type": "PropertyValue", name: "activeLicense", value: c.has_active_license },
      { "@type": "PropertyValue", name: "enforcementActions", value: c.enforcement_count },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="entity-head">
        <p className="eyebrow">Contractor record · {c.state}</p>
        <div className="head-row">
          <div>
            <h1>{c.canonical_name}</h1>
            <p className="locale">
              {c.city}, {c.state} · on record since {String(c.first_permit).slice(0, 4)} ·{" "}
              {c.jurisdictions_active} jurisdiction{c.jurisdictions_active === 1 ? "" : "s"}
            </p>
          </div>
          <div className={`stamp ${c.has_active_license ? "" : "lapsed"}`}>
            {c.has_active_license ? "License Active" : "No Active License"}
            <small>verified against issuing jurisdiction</small>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{c.concrete_permits}</b><span>concrete permits on record</span></div>
        <div className="stat"><b>{c.permits_12mo}</b><span>permits, last 12 months</span></div>
        <div className="stat"><b>{fmtUSD(c.median_job_value)}</b><span>median declared job value</span></div>
        <div className="stat"><b>{c.enforcement_count}</b><span>enforcement actions</span></div>
      </div>

      <h2>Licenses</h2>
      <table className="lic">
        <thead><tr><th>License no.</th><th>Type</th><th>Jurisdiction</th><th>Status</th><th>Expires</th></tr></thead>
        <tbody>
          {(c.licenses || []).map((l) => (
            <tr key={l.license_no}>
              <td>{l.license_no}</td>
              <td>{l.license_type}</td>
              <td>{l.jurisdiction}</td>
              <td><span className={`pill ${l.status === "active" ? "active" : "lapsed"}`}>{l.status}</span></td>
              <td>{l.expires_on}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Permit ledger</h2>
      <div className="ledger">
        <div className="ledger-row ledger-head">
          <span>Permit no.</span><span>Class</span><span>Scope</span><span>Declared</span><span>Issued</span>
        </div>
        {(c.permits || []).map((p) => (
          <div className="ledger-row" key={p.permit_no}>
            <span className="no">{p.permit_no}</span>
            <span className="class">{p.concrete_class?.replace("_", " ")}</span>
            <span>{p.description} — {p.site_city}</span>
            <span className="val">{fmtUSD(p.declared_value)}</span>
            <span className="date">{p.issued_on}</span>
          </div>
        ))}
      </div>
      <p className="sourcenote">
        Source: building permit records, {c.jurisdictions_active} issuing jurisdiction(s).
        Latest record {c.latest_permit}. Declared values are as filed by the applicant.
      </p>

      {!c.claimed && (
        <div className="claim">
          <p>
            Is this your company? This record is built from public filings.
            Claim it to add your contact details, service area, and photos, and to
            respond before your competitors do.
          </p>
          <a href={`/claim/${c.slug}`}>Claim this record</a>
        </div>
      )}
    </article>
  );
}
