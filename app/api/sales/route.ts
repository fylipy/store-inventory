import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/prisma";

const saleSchema = z.object({
  productId: z.number({ required_error: "productId is required" }).int().positive(),
  quantity: z.number({ required_error: "quantity is required" }).int().positive(),
  unitPrice: z.coerce.number().nonnegative("unitPrice must be zero or greater"),
  soldAt: z.coerce.date().optional(),
});

const updateSaleSchema = saleSchema.partial().extend({
  id: z.number({ required_error: "id is required" }).int().positive(),
});

function validationError(error: z.ZodError) {
  return NextResponse.json({ error: "Validation error", details: error.flatten() }, { status: 400 });
}

function formatSale(sale: {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: Prisma.Decimal;
  soldAt: Date;
  createdAt: Date;
  updatedAt: Date;
  product?: { id: number; code: string; name: string } | null;
}) {
  return {
    ...sale,
    unitPrice: Number(sale.unitPrice),
    product: sale.product ? { ...sale.product } : undefined,
  };
}

async function availableStock(productId: number, excludeSaleId?: number) {
  const [purchases, sales] = await prisma.$transaction([
    prisma.purchase.aggregate({
      where: { productId },
      _sum: { quantity: true },
    }),
    prisma.sale.aggregate({
      where: excludeSaleId
        ? { productId, NOT: { id: excludeSaleId } }
        : { productId },
      _sum: { quantity: true },
    }),
  ]);

  const purchased = purchases._sum.quantity ?? 0;
  const sold = sales._sum.quantity ?? 0;
  return purchased - sold;
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

  const where: Prisma.SaleWhereInput = {};
  if (productId) {
    where.productId = productId;
  }
  if (from || to) {
    where.soldAt = {
      gte: from,
      lte: to,
    };
  }

  try {
    const sales = await prisma.sale.findMany({
      where,
      include: { product: { select: { id: true, code: true, name: true } } },
      orderBy: { soldAt: "desc" },
    });
    return NextResponse.json(sales.map(formatSale));
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

  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const stock = await availableStock(parsed.data.productId);
    if (parsed.data.quantity > stock) {
      return NextResponse.json(
        { error: "Insufficient stock", available: stock },
        { status: 409 }
      );
    }

    const sale = await prisma.sale.create({
      data: {
        productId: parsed.data.productId,
        quantity: parsed.data.quantity,
        unitPrice: new Prisma.Decimal(parsed.data.unitPrice.toFixed(2)),
        soldAt: parsed.data.soldAt ?? new Date(),
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });

    return NextResponse.json(formatSale(sale), { status: 201 });
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

  const parsed = updateSaleSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const existing = await prisma.sale.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const targetProductId = parsed.data.productId ?? existing.productId;
    const targetQuantity = parsed.data.quantity ?? existing.quantity;
    const stock = await availableStock(targetProductId, existing.id);

    if (targetQuantity > stock) {
      return NextResponse.json(
        { error: "Insufficient stock", available: stock },
        { status: 409 }
      );
    }

    const sale = await prisma.sale.update({
      where: { id: existing.id },
      data: {
        productId: parsed.data.productId ?? undefined,
        quantity: parsed.data.quantity ?? undefined,
        unitPrice:
          parsed.data.unitPrice !== undefined
            ? new Prisma.Decimal(parsed.data.unitPrice.toFixed(2))
            : undefined,
        soldAt: parsed.data.soldAt ?? undefined,
      },
      include: { product: { select: { id: true, code: true, name: true } } },
    });

    return NextResponse.json(formatSale(sale));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Sale id is required" }, { status: 400 });
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Sale id must be a positive integer" }, { status: 400 });
  }

  try {
    await prisma.sale.delete({ where: { id } });
    return NextResponse.json({ message: "Sale deleted" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
