-- Extend the existing UtilityDataUSA database. Apply as one transaction.
alter table public.address_profiles
  add column if not exists cache_key text,
  add column if not exists schema_version integer not null default 1,
  add column if not exists profile jsonb,
  add column if not exists stored_bytes integer not null default 0,
  add column if not exists share_token text,
  add column if not exists retained_until timestamptz not null default (now() + interval '30 days');
create index if not exists address_profiles_cache_created on public.address_profiles(cache_key, created_at desc);
create unique index if not exists address_profiles_share_token on public.address_profiles(share_token) where share_token is not null;
create index if not exists address_profiles_retention on public.address_profiles(retained_until);

alter table public.source_results add column if not exists expires_at timestamptz;
alter table public.source_results drop constraint if exists source_results_status_check;
alter table public.source_results add constraint source_results_status_check check (status in ('ok','no_data','error','not_checked','limited','planned'));
alter table public.source_results drop constraint if exists source_results_address_profile_id_fkey;
alter table public.source_results add constraint source_results_address_profile_id_fkey
  foreign key (address_profile_id) references public.address_profiles(id) on delete cascade;
-- The existing unique constraint covers (address_profile_id, source_key).
create index if not exists source_results_source_key_idx on public.source_results(source_key);

alter table public.address_profiles enable row level security;
alter table public.source_results enable row level security;
alter table public.data_sources enable row level security;
revoke all on public.address_profiles, public.source_results, public.data_sources from anon, authenticated;
grant select on public.data_sources to anon, authenticated;
grant select, insert, update, delete on public.address_profiles, public.source_results, public.data_sources to service_role;

-- The server's current source catalog is mirrored here, including geography.
insert into public.data_sources(source_key,name,agency,category,status,base_url,coverage_note) values
('census_geocoder','U.S. Census Geocoder','U.S. Census Bureau','address','active','https://geocoding.geo.census.gov/','Address matching and coordinates, not utility ownership.'),
('census_geography','U.S. Census Geography','U.S. Census Bureau','geography','active','https://geocoding.geo.census.gov/','Physical county and state; postal state is not substituted.'),
('fema_flood','FEMA NFHL Flood Data','Federal Emergency Management Agency','risk','active','https://hazards.fema.gov/','Point flood context, not a survey or insurance determination.'),
('epa_environment','EPA Facility Registry Service','U.S. Environmental Protection Agency','environment','active','https://www.epa.gov/frs/','Nearby facility screening, not complete environmental due diligence.'),
('usgs_water','USGS Water Services','U.S. Geological Survey','water','active','https://waterservices.usgs.gov/','Hydrologic monitoring locations; not drinking-water service maps.'),
('nws_weather','National Weather Service API','National Weather Service / NOAA','weather','active','https://api.weather.gov/','Forecast and independent alert checks; maximum reuse one minute.'),
('usgs_elevation','USGS 3DEP Elevation','U.S. Geological Survey','terrain','active','https://epqs.nationalmap.gov/','Terrain-model elevation, not a surveyed building elevation.'),
('usda_soils','USDA Soil Data Access','USDA NRCS','soil','active','https://sdmdataaccess.nrcs.usda.gov/','Regional map-unit context, not a site investigation.'),
('eia_energy','EIA Energy Data','U.S. Energy Information Administration','energy','limited','https://www.eia.gov/opendata/','Optional state-average electricity price; supplier is not confirmed.'),
('phmsa_npms','PHMSA National Pipeline Mapping System','Pipeline and Hazardous Materials Safety Administration','pipeline','limited','https://www.npms.phmsa.dot.gov/','Official references only; no pipeline positions are retrieved.'),
('state_811','State 811 Guidance','State one-call systems','excavation','limited','https://call811.com/','Follow the official 811 process before excavation.')
on conflict(source_key) do update set name=excluded.name, agency=excluded.agency, category=excluded.category,
  status=excluded.status, base_url=excluded.base_url, coverage_note=excluded.coverage_note, updated_at=now();

create or replace function public.utilitydata_storage_health() returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('ok',true,'schemaVersion',1,'tablesReady',
    to_regclass('public.address_profiles') is not null and to_regclass('public.source_results') is not null);
$$;

create or replace function public.utilitydata_load_profile(p_cache_key text) returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',id,'share_token',share_token,'created_at',created_at,'retained_until',retained_until,'profile',profile)
  from public.address_profiles where cache_key=p_cache_key and schema_version=1 and profile is not null and retained_until>now()
  order by created_at desc limit 1;
$$;

create or replace function public.utilitydata_load_snapshot(p_token text) returns jsonb
language sql stable security invoker set search_path='' as $$
  select jsonb_build_object('id',id,'share_token',share_token,'created_at',created_at,'retained_until',retained_until,'profile',profile)
  from public.address_profiles where share_token=p_token and schema_version=1 and retained_until>now() and length(p_token)=64 limit 1;
$$;

create or replace function public.utilitydata_save_profile(p_cache_key text,p_profile jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  saved public.address_profiles;
  address jsonb := p_profile->'address';
  canonical text := address->>'matchedAddress';
  clean jsonb;
  entry record;
  payload jsonb;
  freshness jsonb;
  fetched timestamptz;
  expires timestamptz;
begin
  if p_cache_key !~ '^[a-f0-9]{64}$' or p_cache_key is null
     or jsonb_typeof(p_profile) is distinct from 'object'
     or p_profile->>'ok' is distinct from 'true'
     or canonical is null or length(canonical) not between 3 and 250
     or octet_length(p_profile::text)>500000
     or jsonb_typeof(address->'latitude') is distinct from 'number'
     or jsonb_typeof(address->'longitude') is distinct from 'number'
     or abs((address->>'latitude')::numeric)>90 or abs((address->>'longitude')::numeric)>180
     or jsonb_typeof(p_profile->'sourceFreshness') is distinct from 'object'
     or jsonb_typeof(p_profile->'generatedAt') is distinct from 'string'
     or jsonb_typeof(p_profile->'energy') is distinct from 'object'
     or not (p_profile ?& array['address','geography','flood','environment','water','weather','terrain','soil','energy','pipeline','excavation811'])
  then raise exception 'invalid_profile'; end if;

  clean := (p_profile - 'persistence') || jsonb_build_object('query',canonical);
  if (clean->>'generatedAt')::timestamptz>now()+interval '1 minute'
     or (clean->>'generatedAt')::timestamptz<now()-interval '10 minutes' then raise exception 'invalid_profile_time'; end if;

  -- Bound concurrent writes and stop saving before the free database fills.
  -- A capacity error returns live evidence to the caller without claiming saved.
  perform pg_advisory_xact_lock(728190263);
  delete from public.address_profiles where id in (
    select id from public.address_profiles where retained_until<now() order by retained_until limit 500);
  if (select coalesce(sum(stored_bytes),0) from public.address_profiles)
      + octet_length(clean::text)*2+4096>314572800
    then raise exception 'storage_capacity'; end if;

  insert into public.address_profiles(query,matched_address,latitude,longitude,cache_key,schema_version,profile,stored_bytes,share_token)
  values(canonical,canonical,(address->>'latitude')::double precision,(address->>'longitude')::double precision,
    p_cache_key,1,clean,octet_length(clean::text)*2+4096,encode(extensions.gen_random_bytes(32),'hex')) returning * into saved;

  for entry in select * from (values
    ('census_geocoder','address'),('census_geography','geography'),('fema_flood','flood'),('epa_environment','environment'),
    ('usgs_water','water'),('nws_weather','weather'),('usgs_elevation','terrain'),('usda_soils','soil'),
    ('eia_energy','energy'),('phmsa_npms','pipeline'),('state_811','excavation811')) as fields(source_key,field_name)
  loop
    payload := clean->entry.field_name;
    freshness := clean->'sourceFreshness'->entry.source_key;
    if jsonb_typeof(payload)='object' then
      if freshness->>'fetchedAt' is null or freshness->>'expiresAt' is null then raise exception 'missing_source_time'; end if;
      fetched := (freshness->>'fetchedAt')::timestamptz;
      expires := (freshness->>'expiresAt')::timestamptz;
      if fetched>now()+interval '1 minute' or expires<fetched then raise exception 'invalid_source_time'; end if;
      insert into public.source_results(address_profile_id,source_key,status,payload,source_url,coverage_note,fetched_at,expires_at)
      values(saved.id,entry.source_key,coalesce(payload->>'status','ok'),payload,
        coalesce(payload->>'sourceUrl',(select base_url from public.data_sources where source_key=entry.source_key)),
        payload->>'limitation',fetched,expires);
    end if;
  end loop;
  return jsonb_build_object('id',saved.id,'share_token',saved.share_token,'created_at',saved.created_at,'retained_until',saved.retained_until,'profile',saved.profile);
end;
$$;

create or replace function public.utilitydata_prune_profiles() returns void
language sql security invoker set search_path='' as $$
  delete from public.address_profiles where retained_until<now();
$$;

revoke all on function public.utilitydata_storage_health(), public.utilitydata_load_profile(text),
  public.utilitydata_load_snapshot(text), public.utilitydata_save_profile(text,jsonb), public.utilitydata_prune_profiles()
  from public, anon, authenticated;
grant execute on function public.utilitydata_storage_health(), public.utilitydata_load_profile(text),
  public.utilitydata_load_snapshot(text), public.utilitydata_save_profile(text,jsonb) to service_role;

-- A real retention job, not an artificial keep-alive request.
create extension if not exists pg_cron;
select cron.schedule('utilitydatausa-profile-retention','23 3 * * *','select public.utilitydata_prune_profiles()');
