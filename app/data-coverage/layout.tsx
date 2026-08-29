import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "U.S. Data Coverage | UtilityDataUSA",
  description: "See which UtilityDataUSA source connections are live nationwide, which require follow-up and which state and local data areas are expanding.",
  alternates: { canonical: "/data-coverage" },
  openGraph: {
    url: "/data-coverage",
    title: "UtilityDataUSA U.S. Data Coverage",
    description: "Live, follow-up, planned and expanding U.S. public-data coverage by source family."
  }
};

export default function DataCoverageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
