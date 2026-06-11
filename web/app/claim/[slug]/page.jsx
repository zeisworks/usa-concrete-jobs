import { getContractor, createClaimRequest } from "../../../lib/data";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = await getContractor(slug);
  if (!c) return {};
  return {
    title: `Claim ${c.canonical_name} — verify your record`,
    description: `Claim the public permit and license record for ${c.canonical_name}, ${c.city}, ${c.state}.`,
    robots: { index: false },
  };
}

export default async function ClaimPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getContractor(slug);
  if (!c) notFound();

  async function submit(formData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    if (!name || !email) redirect(`/claim/${slug}?error=1`);
    await createClaimRequest({
      slug,
      name,
      email,
      phone: String(formData.get("phone") || "").trim() || null,
      role: String(formData.get("role") || "other"),
      message: String(formData.get("message") || "").trim() || null,
    });
    redirect(`/claim/${slug}?submitted=1`);
  }

  if (sp?.submitted) {
    return (
      <article>
        <div className="entity-head">
          <p className="eyebrow">Claim request · {c.state}</p>
          <h1>Request received</h1>
          <p className="locale">{c.canonical_name} · {c.city}, {c.state}</p>
        </div>
        <div className="prose">
          <p>
            Thanks — we&apos;ll verify ownership against the contact details on
            the underlying filings and follow up by email. Verification is
            manual and usually takes a business day or two.
          </p>
          <p>
            <a href={`/contractor/${c.slug}`}>← Back to the record</a>
          </p>
        </div>
      </article>
    );
  }

  return (
    <article>
      <div className="entity-head">
        <p className="eyebrow">Claim request · {c.state}</p>
        <h1>Claim this record</h1>
        <p className="locale">
          {c.canonical_name} · {c.city}, {c.state} · {c.concrete_permits} permits on record
        </p>
      </div>

      <div className="prose">
        <p>
          This record was built from public permit and license filings — it
          exists whether or not you claim it. Claiming lets you add contact
          details, service area, and photos, and flag any record that was
          matched to your company by mistake. Verification is manual: we check
          your details against the contact information on the underlying
          filings.
        </p>
      </div>

      {sp?.error && (
        <p className="form-error">Name and email are required.</p>
      )}

      <form className="claim-form" action={submit}>
        <label>
          Your name
          <input name="name" type="text" required autoComplete="name" />
        </label>
        <label>
          Work email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Phone <span className="opt">optional</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Your role at {c.canonical_name}
          <select name="role" defaultValue="owner">
            <option value="owner">Owner / principal</option>
            <option value="office">Office / admin</option>
            <option value="field">Field / operations</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="full">
          Anything we should know? <span className="opt">optional — e.g. a permit matched to you by mistake</span>
          <textarea name="message" rows={4} />
        </label>
        <button type="submit">Submit claim request</button>
      </form>

      <p className="sourcenote">
        Claiming never changes the underlying public records — corrections to
        permits or licenses go through the issuing jurisdiction.
      </p>
    </article>
  );
}
