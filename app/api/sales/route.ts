import { NextRequest, NextResponse } from "next/server";
import { createSale, listSales } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") || undefined;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  return NextResponse.json(listSales({ productId, start, end }));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const errors: Record<string, string> = {};

  if (!payload.productId) {
    errors.productId = "Product is required";
  }
  if (!payload.quantity || Number(payload.quantity) <= 0) {
    errors.quantity = "Quantity must be greater than zero";
  }
  if (payload.unitPrice === undefined || payload.unitPrice === null || Number(payload.unitPrice) <= 0) {
    errors.unitPrice = "Unit price must be greater than zero";
  }
  if (!payload.date) {
    errors.date = "Date is required";
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const sale = createSale({
    productId: payload.productId,
    quantity: Number(payload.quantity),
    unitPrice: Number(payload.unitPrice),
    date: payload.date
  });
  return NextResponse.json(sale, { status: 201 });
}
