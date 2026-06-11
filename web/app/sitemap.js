import { allContractorSlugs, allCitySlugs } from "../lib/data";

export default async function sitemap() {
  const base = "https://usaconcretejobs.com";
  const [contractors, cities] = await Promise.all([allContractorSlugs(), allCitySlugs()]);
  return [
    { url: base, changeFrequency: "daily" },
    ...cities.map((c) => ({ url: `${base}/co/${c}`, changeFrequency: "daily" })),
    ...contractors.map((s) => ({ url: `${base}/contractor/${s}`, changeFrequency: "weekly" })),
  ];
}
