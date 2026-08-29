import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official U.S. Data Resources | UtilityDataUSA",
  description: "Direct links to official U.S. public-data tools and source documentation from Census, FEMA, EPA, USGS, PHMSA, 811, EIA and state sources.",
  alternates: { canonical: "/resources" },
  openGraph: {
    url: "/resources",
    title: "UtilityDataUSA Official U.S. Data Resources",
    description: "The official tools without the scavenger hunt: public-data sources, documentation and direct source links in one place."
  }
};

export default function ResourcesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
