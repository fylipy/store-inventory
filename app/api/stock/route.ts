import { NextResponse } from "next/server";
import { getStock } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json(getStock());
}
