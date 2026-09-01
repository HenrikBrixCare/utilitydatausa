// Census state FIPS codes describe physical jurisdiction, unlike a mailing address.
const states: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY","60":"AS","66":"GU","69":"MP","72":"PR","78":"VI"
};

export function stateFromFips(fips: string | null) {
  return fips ? states[fips.padStart(2, "0")] ?? null : null;
}

export function boundingBox(latitude: number, longitude: number) {
  const latitudeDelta = 0.08;
  const longitudeDelta = Math.min(0.2, latitudeDelta / Math.max(0.25, Math.cos(latitude * Math.PI / 180)));
  // Legacy USGS bBox rejects coordinates with more than six decimal places.
  return [Math.max(-180, longitude - longitudeDelta), Math.max(-90, latitude - latitudeDelta), Math.min(180, longitude + longitudeDelta), Math.min(90, latitude + latitudeDelta)].map(n => n.toFixed(6)).join(",");
}

export function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number !== -9999 && number !== -999999 ? number : null;
}
