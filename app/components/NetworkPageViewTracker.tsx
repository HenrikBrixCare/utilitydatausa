"use client";

import { useEffect } from "react";

export default function NetworkPageViewTracker() {
  useEffect(() => {
    if (document.getElementById("brixcare-network-analytics")) return;
    const script = document.createElement("script");
    script.id = "brixcare-network-analytics";
    script.src = "https://brixcare.dk/network-analytics.js?v=20261020";
    script.defer = true;
    document.head.appendChild(script);
  }, []);
  return null;
}

