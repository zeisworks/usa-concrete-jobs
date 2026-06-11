import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://usaconcretejobs.com"),
  title: { default: "USAConcreteJobs — Concrete permit & license records", template: "%s | USAConcreteJobs" },
  description:
    "Public permit and license records for concrete contractors, sourced directly from city and county systems.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-head">
          <a className="wordmark" href="/">USA<span>CONCRETE</span>JOBS</a>
          <nav>
            <a href="/jobs">Open jobs</a>
            <a href="/co">Cities</a>
            <a href="/contractors">Contractors</a>
            <a href="/about-data">About the data</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-foot">
          <p>
            Records sourced directly from municipal and county permit and licensing
            systems. Data is public record; corrections via the issuing jurisdiction.
          </p>
          <p className="foot-nav">
            <a href="/jobs">Open jobs</a> · <a href="/co">Cities</a> ·{" "}
            <a href="/contractors">Contractors</a> ·{" "}
            <a href="/about-data">About the data</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
