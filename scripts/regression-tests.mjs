import assert from 'node:assert/strict';
import { createLoader } from './load-typescript.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const originalFetch = globalThis.fetch;
let passed = 0;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type':'application/json' } });
async function test(name, work) { await work(); passed++; console.log('PASS', name); }
try {
 await test('physical Maryland overrides the DC mailing state', async () => {
  const load = createLoader(); globalThis.fetch = async () => json({ result:{ geographies:{ States:[{STATE:'24',NAME:'Maryland'}],Counties:[{GEOID:'24033',NAME:"Prince George's County"}] } } });
  const geo = await load('lib/expandedAddressProfile.ts').getCensusGeography({latitude:38.84,longitude:-76.92,addressComponents:{state:'DC',zip:'20233'}});
  assert.equal(geo.stateCode,'MD'); assert.equal(geo.countyFips,'24033');
  assert.equal(load('lib/addressProfile.ts').get811Guidance(geo.stateCode).state,'MD');
 });
 await test('geography failure cannot fall back to mailing state', async () => {
  globalThis.fetch = async () => {throw new Error('offline')};
  const geo = await createLoader()('lib/expandedAddressProfile.ts').getCensusGeography({latitude:38.84,longitude:-76.92,addressComponents:{state:'DC'}});
  assert.equal(geo.stateCode,null); assert.equal(geo.status,'error');
 });
 await test('USGS bbox uses six decimals; failed services stay errors', async () => {
  let seen; globalThis.fetch = async url => {seen ??= new URL(url).searchParams.get('bBox'); return new Response('upstream broken',{status:500});};
  const result = await createLoader()('lib/addressProfile.ts').getWaterContext(38.89869893252,-77.03518753691);
  assert.ok(seen.split(',').every(n => /^-?\d+\.\d{6}$/.test(n))); assert.equal(result.status,'error');
 });
 await test('USGS invalid HTTP-200 response is not no-data', async () => {
  globalThis.fetch = async url => String(url).includes('waterservices') ? new Response('<html>unavailable</html>') : json({error:'offline'},500);
  assert.equal((await createLoader()('lib/addressProfile.ts').getWaterContext(38,-77)).status,'error');
 });
 await test('modern USGS fallback does not claim active or exhaustive records', async () => {
  globalThis.fetch = async url => String(url).includes('waterservices') ? new Response('error',{status:500}) : json({features:[{properties:{agency_code:'USGS',monitoring_location_number:'123',monitoring_location_name:'River'},geometry:{coordinates:[-77,38]}}]});
  const result = await createLoader()('lib/addressProfile.ts').getWaterContext(38,-77);assert.equal(result.status,'limited');assert.equal(result.nearbySites.length,1);
 });
 await test('FEMA sentinel values become null, not elevations', async () => {
  globalThis.fetch = async () => json({features:[{attributes:{FLD_ZONE:'X',STATIC_BFE:-9999,DEPTH:-9999,SFHA_TF:'F'}}]});
  const result = await createLoader()('lib/addressProfile.ts').getFloodContext(38,-77);assert.equal(result.staticBfe,null);assert.equal(result.depth,null);
 });
 await test('FEMA and EPA unknown JSON bodies are not clean no-data findings', async () => {
  globalThis.fetch = async () => json({message:'maintenance'});
  const adapters = createLoader()('lib/addressProfile.ts');
  assert.equal((await adapters.getFloodContext(38,-77)).status,'error');
  assert.equal((await adapters.getEnvironmentalContext(38,-77)).status,'error');
 });
 await test('EPA known empty collection remains a completed lookup', async () => {
  globalThis.fetch = async () => json({Results:{FRSFacility:[]}});
  assert.equal((await createLoader()('lib/addressProfile.ts').getEnvironmentalContext(38,-77)).status,'no_data');
 });
 await test('NWS failed alert feed remains separate from good forecast', async () => {
  globalThis.fetch = async url => String(url).includes('/alerts/') ? new Response('offline',{status:500}) : String(url).includes('/points/') ? json({properties:{forecast:'https://api.weather.gov/gridpoints/LWX/1,1/forecast'}}) : json({properties:{periods:[{name:'Today',temperature:70}]}});
  const weather = await createLoader()('lib/weatherContext.ts').getWeatherContext(38,-77);assert.equal(weather.status,'limited');assert.equal(weather.alertsStatus,'error');assert.equal(weather.forecastStatus,'ok');
 });
 await test('NWS empty valid alert feed means completed check', async () => {
  globalThis.fetch = async url => String(url).includes('/alerts/') ? json({features:[]}) : String(url).includes('/points/') ? json({properties:{forecast:'https://api.weather.gov/gridpoints/LWX/1,1/forecast'}}) : json({properties:{periods:[{name:'Today'}]}});
  assert.equal((await createLoader()('lib/weatherContext.ts').getWeatherContext(38,-77)).alertsStatus,'ok');
 });
 await test('NWS rejects external URLs returned by upstream', async () => {
  const hosts=[];globalThis.fetch=async url=>{hosts.push(new URL(url).hostname);return String(url).includes('/alerts/')?json({features:[]}):json({properties:{forecast:'https://attacker.example/private'}})};
  await createLoader()('lib/weatherContext.ts').getWeatherContext(38,-77);assert.ok(hosts.every(h=>h==='api.weather.gov'));
 });
 await test('USDA missing measurements remain null', async () => {
  globalThis.fetch=async()=>json({Table:[['mukey','muname','compname','comppct_r','hydgrp','drainagecl','slope_r'],['1','Urban land','Urban',100,null,null,null]]});
  const soil=await createLoader()('lib/groundContext.ts').getSoilContext(38,-77);assert.equal(soil.components[0].slopePercent,null);assert.equal(soil.components[0].drainage,null);
 });
 const mcp = createLoader()('app/api/mcp/route.ts');
 const request=(body,headers={})=>new NextRequest('https://utilitydatausa.vercel.app/api/mcp',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 await test('MCP rejects null JSON and wrong argument types',async()=>{assert.equal((await mcp.POST(request(null))).status,400);const r=await mcp.POST(request({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_us_address_profile',arguments:{query:42}}}));assert.equal((await r.json()).error.code,-32602)});
 await test('MCP validates origin and protocol version',async()=>{assert.equal((await mcp.POST(request({}, {Origin:'https://attacker.example'}))).status,403);assert.equal((await mcp.POST(request({}, {'MCP-Protocol-Version':'2099-01-01'}))).status,400)});
 await test('MCP handshake and complete tool discovery',async()=>{const r=await mcp.POST(request({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25'}}));assert.equal((await r.json()).result.protocolVersion,'2025-11-25');const t=await mcp.POST(request({jsonrpc:'2.0',id:2,method:'tools/list'}));assert.equal((await t.json()).result.tools.length,11)});
 await test('MCP notifications have no response body',async()=>{const r=await mcp.POST(request({jsonrpc:'2.0',method:'notifications/initialized'}));assert.equal(r.status,202);assert.equal(await r.text(),'')});
 await test('oversized address input is rejected before source calls',async()=>{const guard=createLoader()('lib/apiGuard.ts');assert.equal(guard.normalizeQuery('a'.repeat(251)),null);assert.equal(guard.normalizeQuery(null),null)});
 console.log(`${passed} regression checks passed.`);
} finally {globalThis.fetch=originalFetch;}
