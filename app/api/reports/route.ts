import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";

import prisma from "@/lib/prisma";

const querySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function GET(request: NextRequest) {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = querySchema.safeParse(rawQuery);

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  const { format = "json", start, end } = parsedQuery.data;
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if ((start && !startDate) || (end && !endDate)) {
    return NextResponse.json({ error: "start and end must be valid date strings" }, { status: 400 });
  }

  const purchaseWhere: Parameters<typeof prisma.purchase.findMany>[0] = {};
  const saleWhere: Parameters<typeof prisma.sale.findMany>[0] = {};

  if (startDate || endDate) {
    purchaseWhere.where = {
      purchasedAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    saleWhere.where = {
      soldAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  try {
    const [products, purchases, sales] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.purchase.findMany({ select: { productId: true, quantity: true, unitCost: true, purchasedAt: true }, ...purchaseWhere }),
      prisma.sale.findMany({ select: { productId: true, quantity: true, unitPrice: true, soldAt: true }, ...saleWhere }),
    ]);

    const purchaseMap = new Map<number, typeof purchases>();
    for (const purchase of purchases) {
      if (!purchaseMap.has(purchase.productId)) {
        purchaseMap.set(purchase.productId, []);
      }
      purchaseMap.get(purchase.productId)!.push(purchase);
    }

    const saleMap = new Map<number, typeof sales>();
    for (const sale of sales) {
      if (!saleMap.has(sale.productId)) {
        saleMap.set(sale.productId, []);
      }
      saleMap.get(sale.productId)!.push(sale);
    }

    const report = products.map((product) => {
      const productPurchases = purchaseMap.get(product.id) ?? [];
      const productSales = saleMap.get(product.id) ?? [];

      const totalPurchased = productPurchases.reduce((sum, item) => sum + item.quantity, 0);
      const totalPurchaseValue = productPurchases.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitCost),
        0
      );
      const totalSold = productSales.reduce((sum, item) => sum + item.quantity, 0);
      const totalSalesValue = productSales.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      );
      const stock = totalPurchased - totalSold;
      const stockValue = stock * Number(product.price);

      return {
        productId: product.id,
        code: product.code,
        name: product.name,
        price: Number(product.price),
        totalPurchased,
        totalPurchaseValue: Number(totalPurchaseValue.toFixed(2)),
        totalSold,
        totalSalesValue: Number(totalSalesValue.toFixed(2)),
        stock,
        stockValue: Number(stockValue.toFixed(2)),
        period: {
          start: startDate?.toISOString() ?? null,
          end: endDate?.toISOString() ?? null,
        },
      };
    });

    if (format === "csv") {
      const csv = Papa.unparse(
        report.map(({ period, ...rest }) => ({
          ...rest,
          periodStart: period.start ?? "",
          periodEnd: period.end ?? "",
        }))
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=inventory-report.csv",
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
