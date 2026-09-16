import { NextResponse } from "next/server"
import { getIntegrationStatus } from "@/lib/env-validator"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ integrations: getIntegrationStatus() })
}
