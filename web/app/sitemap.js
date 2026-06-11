import { allContractorSlugs, allCitySlugs } from "../lib/data";

export default async function sitemap() {
  const base = "https://usaconcretejobs.com";
  const [contractors, cities] = await Promise.all([allContractorSlugs(), allCitySlugs()]);
  return [
    { url: base, changeFrequency: "daily" },
    { url: `${base}/co`, changeFrequency: "daily" },
    { url: `${base}/contractors`, changeFrequency: "daily" },
    { url: `${base}/about-data`, changeFrequency: "monthly" },
    ...cities.map((c) => ({ url: `${base}/co/${c}`, changeFrequency: "daily" })),
    ...contractors.map((s) => ({ url: `${base}/contractor/${s}`, changeFrequency: "weekly" })),
  ];
}
