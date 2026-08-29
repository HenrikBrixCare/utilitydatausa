import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API & Developers | UtilityDataUSA",
  description: "Developer overview for UtilityDataUSA address profiles, public-source boundaries, API architecture and WebMCP tools.",
  alternates: { canonical: "/developers" },
  openGraph: {
    url: "/developers",
    title: "UtilityDataUSA API & Developers",
    description: "One address layer for people, software and agents, built around the same source-aware evidence model."
  }
};

export default function DevelopersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
