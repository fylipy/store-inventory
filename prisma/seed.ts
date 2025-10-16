import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const productSeed = [
  {
    code: "pen-blk",
    name: "Black Ballpoint Pen",
    description: "Smooth-writing 0.7mm ballpoint pen",
    price: new Prisma.Decimal("1.50"),
  },
  {
    code: "notebook-lin",
    name: "Lined Notebook",
    description: "A5 notebook with 200 lined pages",
    price: new Prisma.Decimal("4.50"),
  },
  {
    code: "marker-red",
    name: "Red Permanent Marker",
    description: "Fine tip permanent marker",
    price: new Prisma.Decimal("2.80"),
  },
  {
    code: "stapler-mid",
    name: "Mid-size Stapler",
    description: "Durable stapler for up to 20 sheets",
    price: new Prisma.Decimal("9.75"),
  },
  {
    code: "folder-asm",
    name: "Assorted Folders",
    description: "Pack of 10 letter-size folders",
    price: new Prisma.Decimal("1.10"),
  },
  {
    code: "tape-clear",
    name: "Clear Packing Tape",
    description: "48mm x 50m clear tape roll",
    price: new Prisma.Decimal("3.50"),
  },
];

const purchaseSeed = [
  { code: "pen-blk", quantity: 60, unitCost: "0.65", days: 90 },
  { code: "notebook-lin", quantity: 80, unitCost: "3.10", days: 85 },
  { code: "marker-red", quantity: 45, unitCost: "1.60", days: 82 },
  { code: "stapler-mid", quantity: 25, unitCost: "6.80", days: 80 },
  { code: "folder-asm", quantity: 120, unitCost: "0.45", days: 78 },
  { code: "tape-clear", quantity: 70, unitCost: "2.10", days: 75 },
  { code: "pen-blk", quantity: 40, unitCost: "0.62", days: 70 },
  { code: "notebook-lin", quantity: 60, unitCost: "3.05", days: 65 },
  { code: "marker-red", quantity: 50, unitCost: "1.58", days: 60 },
  { code: "stapler-mid", quantity: 20, unitCost: "6.75", days: 55 },
  { code: "folder-asm", quantity: 90, unitCost: "0.44", days: 50 },
  { code: "tape-clear", quantity: 60, unitCost: "2.05", days: 45 },
  { code: "pen-blk", quantity: 45, unitCost: "0.63", days: 40 },
  { code: "notebook-lin", quantity: 55, unitCost: "3.00", days: 35 },
  { code: "marker-red", quantity: 40, unitCost: "1.55", days: 30 },
  { code: "stapler-mid", quantity: 30, unitCost: "6.70", days: 25 },
  { code: "folder-asm", quantity: 110, unitCost: "0.43", days: 20 },
  { code: "tape-clear", quantity: 65, unitCost: "2.00", days: 15 },
  { code: "pen-blk", quantity: 35, unitCost: "0.64", days: 10 },
  { code: "notebook-lin", quantity: 45, unitCost: "2.95", days: 5 },
];

const saleSeed = [
  { code: "pen-blk", quantity: 25, unitPrice: "1.30", days: 75 },
  { code: "notebook-lin", quantity: 30, unitPrice: "4.20", days: 70 },
  { code: "marker-red", quantity: 20, unitPrice: "2.60", days: 68 },
  { code: "stapler-mid", quantity: 10, unitPrice: "9.10", days: 66 },
  { code: "folder-asm", quantity: 60, unitPrice: "0.95", days: 64 },
  { code: "tape-clear", quantity: 25, unitPrice: "3.10", days: 62 },
  { code: "pen-blk", quantity: 28, unitPrice: "1.35", days: 58 },
  { code: "notebook-lin", quantity: 40, unitPrice: "4.30", days: 54 },
  { code: "marker-red", quantity: 18, unitPrice: "2.65", days: 52 },
  { code: "stapler-mid", quantity: 12, unitPrice: "9.00", days: 48 },
  { code: "folder-asm", quantity: 75, unitPrice: "0.98", days: 46 },
  { code: "tape-clear", quantity: 30, unitPrice: "3.20", days: 42 },
  { code: "pen-blk", quantity: 22, unitPrice: "1.40", days: 38 },
  { code: "notebook-lin", quantity: 35, unitPrice: "4.25", days: 32 },
  { code: "marker-red", quantity: 15, unitPrice: "2.70", days: 28 },
  { code: "stapler-mid", quantity: 15, unitPrice: "9.15", days: 24 },
  { code: "folder-asm", quantity: 80, unitPrice: "1.00", days: 20 },
  { code: "tape-clear", quantity: 35, unitPrice: "3.25", days: 16 },
  { code: "pen-blk", quantity: 20, unitPrice: "1.45", days: 12 },
  { code: "notebook-lin", quantity: 25, unitPrice: "4.35", days: 8 },
];

async function main() {
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();

  const products = await Promise.all(
    productSeed.map((product) =>
      prisma.product.create({
        data: {
          ...product,
          code: product.code.toLowerCase(),
        },
      })
    )
  );

  const productByCode = new Map(products.map((p) => [p.code, p]));

  for (const purchase of purchaseSeed) {
    const product = productByCode.get(purchase.code);
    if (!product) continue;

    await prisma.purchase.create({
      data: {
        productId: product.id,
        quantity: purchase.quantity,
        unitCost: new Prisma.Decimal(purchase.unitCost),
        purchasedAt: daysAgo(purchase.days),
      },
    });
  }

  for (const sale of saleSeed) {
    const product = productByCode.get(sale.code);
    if (!product) continue;

    await prisma.sale.create({
      data: {
        productId: product.id,
        quantity: sale.quantity,
        unitPrice: new Prisma.Decimal(sale.unitPrice),
        soldAt: daysAgo(sale.days),
      },
    });
  }
}

main()
  .then(() => {
    console.log("Seed data inserted successfully");
  })
  .catch((error) => {
    console.error("Error seeding database", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
