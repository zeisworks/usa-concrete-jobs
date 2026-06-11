import { allContractorSlugs, allCitySlugs, allJobSlugs } from "../lib/data";

export default async function sitemap() {
  const base = "https://usaconcretejobs.com";
  const [contractors, cities, jobs] = await Promise.all([
    allContractorSlugs(), allCitySlugs(), allJobSlugs(),
  ]);
  return [
    { url: base, changeFrequency: "daily" },
    { url: `${base}/jobs`, changeFrequency: "daily" },
    { url: `${base}/co`, changeFrequency: "daily" },
    { url: `${base}/contractors`, changeFrequency: "daily" },
    { url: `${base}/about-data`, changeFrequency: "monthly" },
    ...jobs.map((s) => ({ url: `${base}/jobs/${s}`, changeFrequency: "daily" })),
    ...cities.map((c) => ({ url: `${base}/co/${c}`, changeFrequency: "daily" })),
    ...contractors.map((s) => ({ url: `${base}/contractor/${s}`, changeFrequency: "weekly" })),
  ];
}
