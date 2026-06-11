export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/claim/"] }],
    sitemap: "https://usaconcretejobs.com/sitemap.xml",
  };
}
