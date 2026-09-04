"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const endpoint = "https://www.trygttilbud.dk/api/network-pageview";
const sessionKey = "brixcare-network-session-v1";

function getSessionId() {
  try {
    let value = sessionStorage.getItem(sessionKey);
    if (!value) {
      value = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, value);
    }
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

export default function NetworkPageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api") || pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    let referrerHost: string | null = null;
    try {
      if (document.referrer) referrerHost = new URL(document.referrer).hostname || null;
    } catch {
      referrerHost = null;
    }

    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        path: pathname,
        referrerHost,
        siteKey: "utilitydatausa",
        host: window.location.hostname.toLowerCase(),
      }),
      keepalive: true,
      cache: "no-store",
      mode: "cors",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
