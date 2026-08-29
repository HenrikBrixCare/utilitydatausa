export const dynamic = "force-static";

export function GET() {
  const body = `# UtilityDataUSA

UtilityDataUSA is a U.S.-focused public-data software product developed by BrixCare.

Website: https://utilitydatausa.com
Developer: https://brixcare.dk/en

## Product purpose
UtilityDataUSA is designed to save users from searching multiple U.S. public-data websites separately. The user enters one U.S. address once, and the product organizes evidence from connected authoritative sources around that address while keeping original sources traceable.

Core value proposition: One address instead of ten websites.

## Current product areas
- Address and geography: U.S. Census Bureau geocoding
- Flood context: FEMA National Flood Hazard Layer
- Environmental screening: U.S. EPA Facility Registry Service
- Water monitoring context: U.S. Geological Survey
- Excavation safety follow-up: state-aware 811 / one-call guidance
- Electric utility context: planned / expanding
- Pipeline context: planned / expanding
- State, county, city, utility, zoning and permit sources: expanding source by source

## Important boundaries
UtilityDataUSA is an independent platform. It does not replace the original authorities behind the data. It does not locate underground lines and is not a substitute for 811, field locating, engineering review, permits or required clearances.

## Main pages
- https://utilitydatausa.com/
- https://utilitydatausa.com/how-it-works
- https://utilitydatausa.com/data-coverage
- https://utilitydatausa.com/resources
- https://utilitydatausa.com/developers
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
