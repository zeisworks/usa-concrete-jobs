import { allContractorSlugs, allCityParams, allJobSlugs, getStates } from "../lib/data";

export default async function sitemap() {
  const base = "https://usaconcretejobs.com";
  const [contractors, cityParams, jobs, states] = await Promise.all([
    allContractorSlugs(), allCityParams(), allJobSlugs(), getStates(),
  ]);
  return [
    { url: base, changeFrequency: "daily" },
    { url: `${base}/jobs`, changeFrequency: "daily" },
    { url: `${base}/cities`, changeFrequency: "daily" },
    { url: `${base}/contractors`, changeFrequency: "daily" },
    { url: `${base}/about-data`, changeFrequency: "monthly" },
    ...states.map((s) => ({ url: `${base}/${s.abbr}`, changeFrequency: "daily" })),
    ...jobs.map((s) => ({ url: `${base}/jobs/${s}`, changeFrequency: "daily" })),
    ...cityParams.map((p) => ({ url: `${base}/${p.state}/${p.city}`, changeFrequency: "daily" })),
    ...contractors.map((s) => ({ url: `${base}/contractor/${s}`, changeFrequency: "weekly" })),
  ];
}
