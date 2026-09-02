import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { createLoader } from './load-typescript.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const token = 'a'.repeat(64);
const secondToken = 'b'.repeat(64);
let passed = 0;
const json = (value, status = 200) => Response.json(value, { status });
const loader = () => createLoader({ '@vercel/oidc': { getVercelOidcToken: async () => 'test-workload-token-only' } });
const policy = loader()('lib/profilePolicy.ts');
async function test(name, work) { await work(); passed++; console.log('PASS', name); }
function fixture() {
  const p = {
    ok:true, query:'1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500',
    address:{matchedAddress:'1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500',latitude:38.898699,longitude:-77.035188,tigerLineId:null,side:null,addressComponents:{state:'DC',zip:'20500'}},
    geography:{status:'ok',stateCode:'DC',stateName:'District of Columbia',stateFips:'11',countyName:'District of Columbia',countyFips:'11001',zip:'20500',sourceUrl:'https://geocoding.geo.census.gov/',limitation:'Physical location'},
    flood:{status:'ok',floodZone:'X',zoneSubtype:null,sfha:false,staticBfe:null,depth:null,sourceUrl:'https://hazards.fema.gov/',limitation:'Public context'},
    environment:{status:'ok',facilities:[],radiusMiles:3,sourceUrl:'https://www.epa.gov/frs/',limitation:'Screening'},
    water:{status:'ok',nearbySites:[],sourceUrl:'https://waterservices.usgs.gov/',limitation:'Monitoring'},
    weather:{status:'ok',forecastStatus:'ok',alertsStatus:'ok',forecastPeriods:[],alerts:[],forecastOffice:null,gridId:null,sourceUrl:'https://api.weather.gov/',alertsUrl:'https://api.weather.gov/alerts/',limitation:'Weather'},
    terrain:{status:'ok',elevationMeters:10,resolutionMeters:null,acquisitionDate:null,sourceUrl:'https://epqs.nationalmap.gov/',limitation:'Model'},
    soil:{status:'ok',components:[],sourceUrl:'https://sdmdataaccess.nrcs.usda.gov/',limitation:'Map'},
    energy:{status:'limited',apiConfigured:false,state:'DC',county:'District of Columbia',countyFips:'11001',residentialPriceCentsPerKwh:null,pricePeriod:null,sourceUrl:'https://www.eia.gov/',serviceTerritoryUrl:'https://www.eia.gov/electricity/data/eia861/',limitation:'Reference'},
    pipeline:{status:'limited',state:'DC',county:'District of Columbia',countyFips:'11001',zip:'20500',sourceUrl:'https://www.npms.phmsa.dot.gov/',publicViewerUrl:'https://pvnpms.phmsa.dot.gov/',operatorDirectoryUrl:'https://www.npms.phmsa.dot.gov/FindWhosOperating.aspx',limitation:'Reference'},
    excavation811:{status:'limited',state:'DC',sourceUrl:'https://call811.com/',instruction:'Use 811',limitation:'Follow up'},
    generatedAt:new Date().toISOString(),limitation:'Public evidence',sourceFreshness:{}
  };
  for (const [key,field] of Object.entries(policy.SOURCE_FIELDS)) p.sourceFreshness[key]={fetchedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+policy.reuseDuration(key,p[field])).toISOString(),reused:false};
  return p;
}
function row(profile=fixture(), shareToken=token) { return {id:'00000000-0000-4000-8000-000000000001',share_token:shareToken,created_at:new Date().toISOString(),retained_until:new Date(Date.now()+30*86400000).toISOString(),profile}; }
function upstream(url) {
  const u=String(url);
  if(u.includes('locations/onelineaddress')) return json({result:{addressMatches:[{matchedAddress:fixture().address.matchedAddress,coordinates:{x:-77.035188,y:38.898699},addressComponents:{state:'DC'}}]}});
  if(u.includes('geographies/coordinates')) return json({result:{geographies:{States:[{STATE:'11',NAME:'District of Columbia'}],Counties:[{GEOID:'11001',NAME:'District of Columbia'}]}}});
  if(u.includes('hazards.fema.gov')) return json({features:[{attributes:{FLD_ZONE:'X',SFHA_TF:'F'}}]});
  if(u.includes('epa.gov')) return json({Results:{FRSFacility:[]}});
  if(u.includes('waterservices.usgs.gov')) return new Response('# valid empty monitoring response\nagency_cd\tsite_no\tstation_nm\tsite_tp_cd\tdec_lat_va\tdec_long_va\n5s\t15s\t50s\t7s\t16n\t16n\n');
  if(u.includes('api.waterdata.usgs.gov')) return json({features:[]});
  if(u.includes('/alerts/')) return json({features:[]});
  if(u.includes('/points/')) return json({properties:{forecast:'https://api.weather.gov/gridpoints/LWX/1,1/forecast'}});
  if(u.includes('api.weather.gov')) return json({properties:{periods:[{name:'Today',temperature:70}]}});
  if(u.includes('epqs.nationalmap.gov')) return json({value:10});
  if(u.includes('sdmdataaccess')) return json({Table:[['mukey','muname','compname','comppct_r','hydgrp','drainagecl','slope_r'],['1','Urban','Urban',100,'D','Poor',1]]});
  throw new Error(`Unexpected upstream ${new URL(u).hostname}`);
}
function mockStore(profile=fixture(), options={}) {
  const seen={operations:[],upstreams:[],saved:[]};
  globalThis.fetch=async(url,init={})=>{
    if(String(url).includes('/functions/v1/address-profile-store')) {
      const body=JSON.parse(init.body);seen.operations.push(body.operation);
      assert.equal(init.headers.Authorization,'Bearer test-workload-token-only');
      if(options.offline)return json({},503);
      if(body.operation==='load')return json(profile ? row(profile) : null);
      if(body.operation==='snapshot')return json(body.token===token && profile ? row(profile) : null);
      if(body.operation==='save'){seen.saved.push(body);return json(row(body.profile,secondToken));}
      if(body.operation==='health')return json({ok:true});
    }
    seen.upstreams.push(String(url));
    return options.upstream ? options.upstream(url,init) : upstream(url);
  };
  return seen;
}
try {
 process.env.VERCEL_ENV='production';delete process.env.EIA_API_KEY;delete process.env.USGS_API_KEY;delete process.env.SUPABASE_PROFILE_STORAGE_DISABLED;
 await test('a fresh durable profile survives a new server module with no source calls',async()=>{
   const seen=mockStore();const first=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('address one');
   const second=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('address one');
   assert.equal(first.persistence.status,'saved');assert.equal(second.persistence.mode,'cached');assert.equal(seen.upstreams.length,0);assert.deepEqual(seen.operations,['load','load']);
 });
 await test('only expired weather is fetched again; original terrain timestamp remains',async()=>{
   const p=fixture();p.sourceFreshness.nws_weather.fetchedAt=new Date(Date.now()-61000).toISOString();p.sourceFreshness.nws_weather.expiresAt=new Date(Date.now()-1000).toISOString();
   const terrainTime=p.sourceFreshness.usgs_elevation.fetchedAt;const seen=mockStore(p);
   const result=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('weather expiry');
   assert.equal(result.persistence.mode,'mixed');assert.equal(seen.upstreams.length,3);assert.ok(seen.upstreams.every(u=>u.startsWith('https://api.weather.gov/')));
   assert.equal(result.sourceFreshness.usgs_elevation.fetchedAt,terrainTime);assert.equal(result.sourceFreshness.usgs_elevation.reused,true);assert.equal(seen.saved.length,1);
 });
 await test('a failed EPA source is retried, without re-fetching the other sources',async()=>{
   const p=fixture();p.environment.status='error';const seen=mockStore(p);
   const result=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('retry EPA');
   assert.equal(result.environment.status,'no_data');assert.equal(seen.upstreams.length,1);assert.ok(seen.upstreams[0].includes('epa.gov'));assert.equal(seen.saved.length,1);
 });
 await test('partial NWS alert failure is never reused as a completed alert check',async()=>{
   const p=fixture();p.weather.status='limited';p.weather.alertsStatus='error';const seen=mockStore(p);
   await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('retry weather');assert.equal(seen.upstreams.length,3);
 });
 await test('explicit refresh bypasses stored evidence and creates a separate report',async()=>{
   const seen=mockStore();const result=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('forced refresh',{refresh:true});
   assert.ok(!seen.operations.includes('load'));assert.ok(seen.upstreams.length>=9);assert.equal(result.persistence.shareToken,secondToken);assert.equal(result.persistence.mode,'live');
 });
 await test('database failure does not break a valid live address lookup or claim saved',async()=>{
   const seen=mockStore(null,{offline:true});const result=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('database offline');
   assert.equal(result.ok,true);assert.ok(result.address);assert.equal(result.persistence.status,'unavailable');assert.ok(seen.upstreams.length>=9);
 });
 await test('no-match addresses do not become saved profiles or trigger downstream calls',async()=>{
   const seen=mockStore(null,{upstream:()=>json({result:{addressMatches:[]}})});
   const result=await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('no match');
   assert.equal(result.address,null);assert.equal(seen.upstreams.length,1);assert.equal(seen.saved.length,0);
 });
 await test('the raw typed query is replaced by the canonical matched address before storage',async()=>{
   const seen=mockStore(null);await loader()('lib/expandedAddressProfile.ts').getExpandedAddressProfile('private typed note with an address');
   assert.equal(seen.saved[0].profile.query,fixture().address.matchedAddress);assert.ok(!JSON.stringify(seen.saved[0]).includes('private typed note'));assert.equal(seen.saved[0].profile.persistence,undefined);
 });
 await test('cache keys normalize spacing and case, and separate integration configuration',async()=>{
   const store=loader()('lib/profileStore.ts');assert.equal(store.profileCacheKey('  One   ADDRESS '),store.profileCacheKey('one address'));
   const key=store.profileCacheKey('one address');process.env.EIA_API_KEY='fixture';assert.notEqual(store.profileCacheKey('one address'),key);delete process.env.EIA_API_KEY;
 });
 await test('concurrent equivalent lookups share work but return each caller query',async()=>{
   const seen=mockStore();const api=loader()('lib/expandedAddressProfile.ts');const [a,b]=await Promise.all([api.getExpandedAddressProfile('Same Address'),api.getExpandedAddressProfile('same address')]);
   assert.deepEqual(seen.operations,['load']);assert.equal(a.query,'Same Address');assert.equal(b.query,'same address');
 });
 await test('snapshot reads preserve old evidence and make no source calls',async()=>{
   const p=fixture();p.generatedAt='2026-08-01T10:00:00.000Z';const seen=mockStore(p);const result=await loader()('lib/profileStore.ts').loadSavedProfile(token);
   assert.equal(result.status,'ok');assert.equal(result.profile.generatedAt,p.generatedAt);assert.equal(result.profile.persistence.mode,'snapshot');assert.equal(seen.upstreams.length,0);
 });
 await test('snapshot route rejects malformed and unknown tokens without source calls',async()=>{
   const seen=mockStore();const api=loader()('app/api/saved-profile/route.ts');
   const req=token=>new NextRequest('https://utilitydatausa.vercel.app/api/saved-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
   assert.equal((await api.POST(req('bad'))).status,400);assert.equal((await api.POST(req('c'.repeat(64)))).status,404);assert.equal(seen.upstreams.length,0);
 });
 await test('preview deployments cannot use the production storage bridge',async()=>{
   process.env.VERCEL_ENV='preview';const seen=mockStore();assert.equal(await loader()('lib/profileStore.ts').getProfileStorageHealth(),'disabled');assert.equal(seen.operations.length,0);process.env.VERCEL_ENV='production';
 });
 await test('API health performs a real storage round trip',async()=>{
   const seen=mockStore();const response=await loader()('app/api/health/route.ts').GET();assert.equal((await response.json()).integrations.supabaseStorage,'connected');assert.deepEqual(seen.operations,['health']);
 });
 const { privateKey, publicKey }=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='fixture';const jwks=createLocalJWKSet({keys:[jwk]});
 const claims={owner:'tilbudstjek',owner_id:'team_9cKMaAkrIGKLnDaVoytUxCyJ',project:'utilitydatausa',project_id:'prj_Pn6jfLnaLwiWKENAC4IcxukqfIUq',environment:'production'};
 const sign=(overrides={},issuer='https://oidc.vercel.com/tilbudstjek',audience='https://vercel.com/tilbudstjek',expiry='2h')=>new SignJWT({...claims,...overrides}).setProtectedHeader({alg:'RS256',kid:'fixture'}).setIssuer(issuer).setAudience(audience).setSubject('owner:tilbudstjek:project:utilitydatausa:environment:production').setIssuedAt().setExpirationTime(expiry).sign(privateKey);
 const auth=loader()('supabase/functions/address-profile-store/auth.ts');
 await test('bridge accepts only a correctly signed identity for this production project',async()=>{await auth.verifyIdentity(await sign(),jwks)});
 await test('bridge rejects wrong team, project, environment, audience and expired tokens',async()=>{
   for(const changes of [{owner_id:'team_other'},{project_id:'prj_other'},{environment:'preview'}])await assert.rejects(()=>sign(changes).then(t=>auth.verifyIdentity(t,jwks)));
   await assert.rejects(()=>sign({},undefined,'https://vercel.com/other').then(t=>auth.verifyIdentity(t,jwks)));
   await assert.rejects(()=>sign({},undefined,undefined,'-1h').then(t=>auth.verifyIdentity(t,jwks)));
   await assert.rejects(()=>sign({},'https://attacker.example').then(t=>auth.verifyIdentity(t,jwks)));
   const wrongPair=await generateKeyPair('RS256');const wrong=await exportJWK(wrongPair.publicKey);wrong.kid='fixture';
   await assert.rejects(()=>sign().then(t=>auth.verifyIdentity(t,createLocalJWKSet({keys:[wrong]}))));
 });
 await test('bridge performs no database operation if identity validation fails',async()=>{
   let calls=0;const handler=loader()('supabase/functions/address-profile-store/handler.ts').createHandler(async()=>{throw new Error('denied')},async()=>{calls++});
   const response=await handler(new Request('https://example.com',{method:'POST',headers:{Authorization:'Bearer '+ 'x'.repeat(30),'Content-Type':'application/json'},body:'invalid json'}));
   assert.equal(response.status,401);assert.equal(calls,0);
 });
 await test('bridge rejects oversized bodies and unsupported operations after authentication',async()=>{
   let calls=0;const handler=loader()('supabase/functions/address-profile-store/handler.ts').createHandler(async()=>{},async()=>{calls++});
   const req=body=>new Request('https://example.com',{method:'POST',headers:{Authorization:'Bearer '+ 'x'.repeat(30),'Content-Type':'application/json'},body});
   assert.equal((await handler(req(' '.repeat(524289)))).status,400);
   assert.equal((await handler(req(JSON.stringify({operation:'delete',schemaVersion:1,cacheKey:token})))).status,400);assert.equal(calls,0);
 });
 await test('AI uses the saved server-side snapshot and never sends the sharing token to OpenAI',async()=>{
   const p=fixture();p.generatedAt='2026-08-01T10:00:00.000Z';const seen=mockStore(p);const storeFetch=globalThis.fetch;let evidence;
   process.env.OPENAI_API_KEY='non-secret-test-fixture';
   globalThis.fetch=async(url,init)=>{if(String(url)==='https://api.openai.com/v1/responses'){evidence=JSON.parse(JSON.parse(init.body).input);return json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({headline:'Test',summary:'Test',findings:[],follow_up:[],excavation_notice:'811'})}]}]});}return storeFetch(url,init)};
   const req=new NextRequest('https://utilitydatausa.vercel.app/api/ai/address-analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'test address',reportToken:token})});
   const response=await loader()('app/api/ai/address-analysis/route.ts').POST(req);
   assert.equal(response.status,200);assert.equal(evidence.generatedAt,p.generatedAt);assert.ok(evidence.sourceFreshness);assert.ok(!JSON.stringify(evidence).includes(token));assert.deepEqual(seen.operations,['snapshot']);assert.equal(seen.upstreams.length,0);
 });
 console.log(`${passed} storage and access checks passed.`);
} finally {
 globalThis.fetch=originalFetch;
 for(const name of ['VERCEL_ENV','EIA_API_KEY','USGS_API_KEY','SUPABASE_PROFILE_STORAGE_DISABLED','OPENAI_API_KEY']){if(originalEnv[name]===undefined)delete process.env[name];else process.env[name]=originalEnv[name];}
}
