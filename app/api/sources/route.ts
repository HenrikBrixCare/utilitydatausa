import { NextResponse } from "next/server";
import { getDataSources } from "@/lib/dataSources";
export async function GET() {
  return NextResponse.json({ sources: await getDataSources(), note: "These are deployed capabilities, not a real-time availability check. Each address result reports individual source status.", mcp: "/api/mcp", openapi: "/api/openapi" });
}
