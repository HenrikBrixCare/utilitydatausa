import type { Metadata } from "next";
import "./globals.css";
import "./typography.css";
import "./logo.css";
import "./master-design.css";
import "./pixel-match.css";
import "./product-pages.css";
import "./tech-depth.css";
import "./tech-arrow-fix.css";
import WebMCPTools from "./components/WebMCPTools";

const siteUrl = "https://utilitydatausa.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "UtilityDataUSA | U.S. Public Data by Address",
  description: "Enter one U.S. address and bring connected public data, official sources and address-based context into one faster, traceable workflow.",
  applicationName: "UtilityDataUSA",
  keywords: [
    "UtilityDataUSA",
    "U.S. public data",
    "address data",
    "property data",
    "utility data",
    "FEMA flood data",
    "EPA environmental data",
    "USGS water data",
    "811 excavation",
    "public data API"
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "UtilityDataUSA",
    title: "UtilityDataUSA | One address instead of ten websites",
    description: "Search one U.S. address and organize connected public-data evidence and original sources in one place."
  },
  twitter: {
    card: "summary",
    title: "UtilityDataUSA | U.S. Public Data by Address",
    description: "One U.S. address. Connected public data. Original sources. One faster workflow."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" }
  },
  category: "technology"
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://brixcare.dk/#organization",
      name: "BrixCare",
      url: "https://brixcare.dk/en",
      description: "Danish software, technology and product development company."
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "UtilityDataUSA",
      url: siteUrl,
      description: "A U.S.-focused public-data platform that organizes connected address-based evidence and keeps original sources traceable.",
      publisher: { "@id": "https://brixcare.dk/#organization" },
      inLanguage: "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "UtilityDataUSA",
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Public data and address intelligence",
      operatingSystem: "Web",
      description: "Enter one U.S. address to bring connected public-data sources, address-based context and original evidence into one organized workflow.",
      provider: { "@id": "https://brixcare.dk/#organization" },
      isPartOf: { "@id": `${siteUrl}/#website` }
    }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <WebMCPTools />
        {children}
      </body>
    </html>
  );
}
