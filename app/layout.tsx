import type { Metadata } from "next";
import "./globals.css";
import "./typography.css";
import "./logo.css";
import "./master-design.css";
import "./pixel-match.css";
import "./product-pages.css";
import "./tech-depth.css";
import WebMCPTools from "./components/WebMCPTools";

export const metadata: Metadata = {
  title: "UtilityDataUSA — One address instead of ten websites.",
  description: "Search one U.S. address and bring connected public-data sources into one faster, traceable workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WebMCPTools />
        {children}
      </body>
    </html>
  );
}
