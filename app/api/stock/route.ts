import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [products, purchaseGroups, saleGroups] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.purchase.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
      }),
      prisma.sale.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
      }),
    ]);

    const purchasedMap = new Map<number, number>();
    const soldMap = new Map<number, number>();

    for (const item of purchaseGroups) {
      purchasedMap.set(item.productId, item._sum.quantity ?? 0);
    }
    for (const item of saleGroups) {
      soldMap.set(item.productId, item._sum.quantity ?? 0);
    }

    const stock = products.map((product) => {
      const purchased = purchasedMap.get(product.id) ?? 0;
      const sold = soldMap.get(product.id) ?? 0;
      const onHand = purchased - sold;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        purchased,
        sold,
        onHand,
      };
    });

    return NextResponse.json(stock);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
