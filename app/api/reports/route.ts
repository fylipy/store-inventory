import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  return NextResponse.json(buildReport(start, end));
}
