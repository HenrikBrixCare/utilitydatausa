import type { Metadata } from "next";
import "./globals.css";
import "./typography.css";
import "./logo.css";
import "./master-design.css";
import "./pixel-match.css";
import WebMCPTools from "./components/WebMCPTools";

export const metadata: Metadata = {
  title: "UtilityDataUSA — One address. One utility data view.",
  description: "AI- and WebMCP-powered U.S. utility, property and risk data platform."
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
