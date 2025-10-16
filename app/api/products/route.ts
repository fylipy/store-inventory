import { NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json(listProducts());
}

export async function POST(request: Request) {
  const payload = await request.json();
  const errors: Record<string, string> = {};

  if (!payload.code?.trim()) {
    errors.code = "Code is required";
  }
  if (!payload.description?.trim()) {
    errors.description = "Description is required";
  }
  if (payload.price === undefined || payload.price === null || Number(payload.price) <= 0) {
    errors.price = "Price must be greater than zero";
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const product = createProduct({
      code: payload.code,
      description: payload.description,
      price: Number(payload.price)
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        errors: { general: error instanceof Error ? error.message : "Unable to create product" }
      },
      { status: 400 }
    );
  }
}
