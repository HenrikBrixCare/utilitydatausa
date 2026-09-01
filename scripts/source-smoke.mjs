import { createLoader } from './load-typescript.mjs';
const load = createLoader();
const { getExpandedAddressProfile } = load('lib/expandedAddressProfile.ts');
const query = process.env.SMOKE_ADDRESS || '4600 Silver Hill Rd, Washington, DC 20233';
const started = Date.now();
const profile = await getExpandedAddressProfile(query);
const statuses = Object.fromEntries(['geography','flood','environment','water','weather','terrain','soil','energy','pipeline','excavation811'].map(key => [key, profile[key]?.status ?? 'not_checked']));
console.log(JSON.stringify({ address: profile.address?.matchedAddress, coordinates: profile.address ? [profile.address.longitude, profile.address.latitude] : null, elapsedSeconds: (Date.now()-started)/1000, physicalState: profile.geography?.stateCode, county: profile.geography?.countyName, guidanceState: profile.excavation811?.state, statuses, facilities: profile.environment?.status === "error" ? null : profile.environment?.facilities.length, monitoringLocations: profile.water?.status === "error" ? null : profile.water?.nearbySites.length, weatherForecast: profile.weather?.forecastStatus, weatherAlerts: profile.weather?.alertsStatus, elevationMeters: profile.terrain?.elevationMeters, soilMapUnit: profile.soil?.components[0]?.mapUnit },null,2));
if (!profile.ok || !profile.address) { console.error('Census address lookup failed.'); process.exitCode=1; }
else if (query.includes('Silver Hill') && (profile.geography?.stateCode !== 'MD' || profile.excavation811?.state !== 'MD')) { console.error('Physical-state regression.'); process.exitCode=1; }
else if (['flood','environment','water','weather','terrain','soil'].some(key => profile[key]?.status === 'error') || profile.weather?.forecastStatus === 'error' || profile.weather?.alertsStatus === 'error') { console.error('One or more public sources unavailable. See statuses; no clean bill of health is inferred.'); process.exitCode=1; }
