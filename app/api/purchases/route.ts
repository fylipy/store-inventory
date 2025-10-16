import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

const purchaseSchema = z.object({
  productId: z.number({ required_error: "productId is required" }).int().positive(),
  quantity: z.number({ required_error: "quantity is required" }).int().positive(),
  unitCost: z.coerce.number().nonnegative("unitCost must be zero or greater"),
  purchasedAt: z.coerce.date().optional(),
});

const updatePurchaseSchema = purchaseSchema.partial().extend({
  id: z.number({ required_error: "id is required" }).int().positive(),
});

function validationError(error: z.ZodError) {
  return NextResponse.json({ error: "Validation error", details: error.flatten() }, { status: 400 });
}

function formatPurchase(purchase: {
  id: number;
  productId: number;
  quantity: number;
  unitCost: Prisma.Decimal;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  product?: { id: number; code: string; name: string } | null;
}) {
  return {
    ...purchase,
    unitCost: Number(purchase.unitCost),
    product: purchase.product
      ? {
          ...purchase.product,
        }
      : undefined,
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productIdParam = params.get("productId");
  const fromParam = params.get("from");
  const toParam = params.get("to");

  let productId: number | undefined;
  let from: Date | undefined;
  let to: Date | undefined;

  if (productIdParam) {
    productId = Number(productIdParam);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId must be a positive integer" }, { status: 400 });
    }
  }

  if (fromParam) {
    const parsed = new Date(fromParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "from must be a valid date" }, { status: 400 });
    }
    from = parsed;
  }

  if (toParam) {
    const parsed = new Date(toParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "to must be a valid date" }, { status: 400 });
    }
    to = parsed;
  }

  const where: Prisma.PurchaseWhereInput = {};
  if (productId) {
    where.productId = productId;
  }
  if (from || to) {
    where.purchasedAt = {
      gte: from,
      lte: to,
    };
  }

  try {
    const purchases = await prisma.purchase.findMany({
      where,
      include: { product: { select: { id: true, code: true, name: true } } },
      orderBy: { purchasedAt: "desc" },
    });
    return NextResponse.json(purchases.map(formatPurchase));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (!body) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const purchase = await prisma.purchase.create({
      data: {
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        unitCost: new Prisma.Decimal(parsed.data.unitCost.toFixed(2)),
        purchasedAt: parsed.data.purchasedAt ?? new Date(),
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });

    return NextResponse.json(formatPurchase(purchase), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (!body) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const parsed = updatePurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const purchase = await prisma.purchase.update({
      where: { id: parsed.data.id },
      data: {
        productId: parsed.data.productId ?? undefined,
        quantity: parsed.data.quantity ?? undefined,
        unitCost:
          parsed.data.unitCost !== undefined
            ? new Prisma.Decimal(parsed.data.unitCost.toFixed(2))
            : undefined,
        purchasedAt: parsed.data.purchasedAt ?? undefined,
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });

    return NextResponse.json(formatPurchase(purchase));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const idParam = request.nextUrl.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Purchase id is required" }, { status: 400 });
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Purchase id must be a positive integer" }, { status: 400 });
  }

  try {
    await prisma.purchase.delete({ where: { id } });
    return NextResponse.json({ message: "Purchase deleted" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
