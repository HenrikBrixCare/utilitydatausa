import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | UtilityDataUSA",
  description: "See how one U.S. address becomes one organized view across connected public-data sources, with original evidence kept traceable.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    url: "/how-it-works",
    title: "How UtilityDataUSA Works",
    description: "Enter one U.S. address once. UtilityDataUSA checks connected sources, organizes the evidence and keeps the original source available."
  }
};

export default function HowItWorksLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
