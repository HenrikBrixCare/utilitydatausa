const timeout = (ms = 15000) => AbortSignal.timeout(ms);

async function expectJson(name, url, validate) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "UtilityDataUSA-source-smoke/0.2" },
    signal: timeout()
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const data = await response.json();
  if (!validate(data)) throw new Error(`${name}: unexpected response shape`);
  console.log(`PASS ${name}`);
}

async function expectText(name, url, validate) {
  const response = await fetch(url, {
    headers: { Accept: "text/plain", "User-Agent": "UtilityDataUSA-source-smoke/0.2" },
    signal: timeout()
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const data = await response.text();
  if (!validate(data)) throw new Error(`${name}: unexpected response shape`);
  console.log(`PASS ${name}`);
}

const address = encodeURIComponent("4600 Silver Hill Rd, Washington, DC 20233");
await expectJson(
  "Census Geocoder",
  `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${address}&benchmark=Public_AR_Current&format=json`,
  (data) => Array.isArray(data?.result?.addressMatches) && data.result.addressMatches.length > 0
);

await expectJson(
  "FEMA NFHL",
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=-76.928366%2C38.845053&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY%2CSFHA_TF&returnGeometry=false&f=json",
  (data) => !data?.error && Array.isArray(data?.features)
);

await expectText(
  "USGS Water Services",
  "https://waterservices.usgs.gov/nwis/site/?format=rdb&bBox=-77.01,38.76,-76.85,38.93&siteStatus=active&siteOutput=basic",
  (data) => data.includes("agency_cd") && data.includes("site_no")
);

await expectJson(
  "EPA FRS",
  "https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities?latitude83=38.8&longitude83=-77.01&search_radius=1&output=JSON",
  (data) => data !== null && typeof data === "object"
);

console.log("All authoritative source smoke checks passed.");
