import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UtilityDataUSA",
    short_name: "UtilityDataUSA",
    description: "One U.S. address. Connected public data. Original sources. One faster workflow.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#073b73",
    lang: "en-US"
  };
}
