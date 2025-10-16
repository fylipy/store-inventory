import { NextResponse } from "next/server";
import { updateProduct } from "@/lib/data-store";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    const product = updateProduct(params.id, {
      code: payload.code,
      description: payload.description,
      price: Number(payload.price)
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      {
        errors: { general: error instanceof Error ? error.message : "Unable to update product" }
      },
      { status: 400 }
    );
  }
}
