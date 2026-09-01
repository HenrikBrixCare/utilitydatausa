export const USER_AGENT = "UtilityDataUSA/0.5 (+https://utilitydatausa.com; info@brixcare.dk)";

// Explicit per-source deadline; retry only transient HTTP failures once.
export async function fetchSource(url: string | URL, init: RequestInit = {}, timeoutMs = 8000) {
  const signal = AbortSignal.timeout(timeoutMs);
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      ...init,
      signal,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...init.headers },
      cache: "no-store"
    });
    if (attempt === 0 && [502, 503, 504].includes(response.status)) {
      await response.body?.cancel();
      continue;
    }
    return response;
  }
}
