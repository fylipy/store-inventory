import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

const productSchema = z.object({
  code: z.string().min(1, "Product code is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price must be zero or greater"),
});

const updateProductSchema = productSchema.partial().extend({
  id: z.number({ required_error: "Product id is required" }).int().positive(),
});

function formatProduct(product: {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...product,
    price: Number(product.price),
  };
}

function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    { error: "Validation error", details: error.flatten() },
    { status: 400 }
  );
}

function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Product code must be unique" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const code = params.get("code");

  try {
    if (id) {
      const productId = Number(id);
      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json(
          { error: "The provided product id is invalid" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json(formatProduct(product));
    }

    if (code) {
      const product = await prisma.product.findUnique({ where: { code: code.toLowerCase() } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json(formatProduct(product));
    }

    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(products.map(formatProduct));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (!body) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const product = await prisma.product.create({
      data: {
        code: parsed.data.code.toLowerCase(),
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: new Prisma.Decimal(parsed.data.price.toFixed(2)),
      },
    });

    return NextResponse.json(formatProduct(product), { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (!body) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const data = parsed.data;

  try {
    const product = await prisma.product.update({
      where: { id: data.id },
      data: {
        code: data.code ? data.code.toLowerCase() : undefined,
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        price: data.price !== undefined ? new Prisma.Decimal(data.price.toFixed(2)) : undefined,
      },
    });

    return NextResponse.json(formatProduct(product));
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Product id must be a positive integer" }, { status: 400 });
  }

  try {
    const [purchaseCount, saleCount] = await Promise.all([
      prisma.purchase.count({ where: { productId: id } }),
      prisma.sale.count({ where: { productId: id } }),
    ]);

    if (purchaseCount > 0 || saleCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a product with existing purchases or sales" },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    return handlePrismaError(error);
  }
}
