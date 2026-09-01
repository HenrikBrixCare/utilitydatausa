import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UtilityDataUSA",
    short_name: "UtilityDataUSA",
    description: "One U.S. address. Connected public data. Original sources. One faster workflow.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#073b73",
    lang: "en-US",
    icons: [
      {
        src: "/utilitydata-emblem.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
