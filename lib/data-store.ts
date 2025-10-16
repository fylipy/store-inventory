import { DetailedReportRow, Product, Purchase, ReportRow, ReportSummary, Sale, StockRecord } from "./types";

const now = new Date();
const iso = (value: string | Date) => new Date(value).toISOString();

const products: Product[] = [
  {
    id: "prod-1",
    code: "BK-001",
    description: "Notebook - Dot Grid",
    price: 14.5,
    createdAt: iso(now)
  },
  {
    id: "prod-2",
    code: "PN-002",
    description: "Gel Pen - 0.5mm",
    price: 2.2,
    createdAt: iso(now)
  },
  {
    id: "prod-3",
    code: "ER-003",
    description: "Soft Eraser",
    price: 1.1,
    createdAt: iso(now)
  }
];

const purchases: Purchase[] = [
  {
    id: "pur-1",
    productId: "prod-1",
    quantity: 120,
    unitCost: 7.8,
    date: iso("2024-01-10"),
    createdAt: iso("2024-01-10T09:00:00")
  },
  {
    id: "pur-2",
    productId: "prod-2",
    quantity: 400,
    unitCost: 1.1,
    date: iso("2024-02-05"),
    createdAt: iso("2024-02-05T13:30:00")
  },
  {
    id: "pur-3",
    productId: "prod-3",
    quantity: 200,
    unitCost: 0.35,
    date: iso("2024-03-02"),
    createdAt: iso("2024-03-02T15:45:00")
  }
];

const sales: Sale[] = [
  {
    id: "sale-1",
    productId: "prod-1",
    quantity: 40,
    unitPrice: 16.5,
    date: iso("2024-02-20"),
    createdAt: iso("2024-02-20T16:00:00")
  },
  {
    id: "sale-2",
    productId: "prod-2",
    quantity: 150,
    unitPrice: 2.5,
    date: iso("2024-03-12"),
    createdAt: iso("2024-03-12T11:10:00")
  }
];

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function listProducts() {
  return [...products].sort((a, b) => a.code.localeCompare(b.code));
}

export function createProduct(input: Pick<Product, "code" | "description" | "price">) {
  const existing = products.find((product) => product.code.toLowerCase() === input.code.toLowerCase());
  if (existing) {
    throw new Error("Product code already exists");
  }

  const product: Product = {
    id: uuid(),
    code: input.code,
    description: input.description,
    price: Number(input.price),
    createdAt: iso(new Date())
  };
  products.push(product);
  return product;
}

export function updateProduct(id: string, input: Partial<Pick<Product, "code" | "description" | "price">>) {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) {
    throw new Error("Product not found");
  }
  if (input.code) {
    const conflict = products.find((product) => product.code.toLowerCase() === input.code!.toLowerCase() && product.id !== id);
    if (conflict) {
      throw new Error("Product code already exists");
    }
  }
  const updated: Product = {
    ...products[index],
    ...input,
    price: input.price !== undefined ? Number(input.price) : products[index].price
  };
  products[index] = updated;
  return updated;
}

export function listPurchases(filters?: { productId?: string; start?: string; end?: string }) {
  return purchases
    .filter((purchase) => {
      if (filters?.productId && purchase.productId !== filters.productId) {
        return false;
      }
      if (filters?.start && new Date(purchase.date) < new Date(filters.start)) {
        return false;
      }
      if (filters?.end && new Date(purchase.date) > new Date(filters.end)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function createPurchase(input: Pick<Purchase, "productId" | "quantity" | "unitCost" | "date">) {
  const purchase: Purchase = {
    id: uuid(),
    productId: input.productId,
    quantity: Number(input.quantity),
    unitCost: Number(input.unitCost),
    date: iso(input.date),
    createdAt: iso(new Date())
  };
  purchases.push(purchase);
  return purchase;
}

export function listSales(filters?: { productId?: string; start?: string; end?: string }) {
  return sales
    .filter((sale) => {
      if (filters?.productId && sale.productId !== filters.productId) {
        return false;
      }
      if (filters?.start && new Date(sale.date) < new Date(filters.start)) {
        return false;
      }
      if (filters?.end && new Date(sale.date) > new Date(filters.end)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function createSale(input: Pick<Sale, "productId" | "quantity" | "unitPrice" | "date">) {
  const sale: Sale = {
    id: uuid(),
    productId: input.productId,
    quantity: Number(input.quantity),
    unitPrice: Number(input.unitPrice),
    date: iso(input.date),
    createdAt: iso(new Date())
  };
  sales.push(sale);
  return sale;
}

export function getStock(): StockRecord[] {
  return products.map((product) => ({
    productId: product.id,
    current: getStockForProduct(product.id)
  }));
}

export function getStockForProduct(productId: string) {
  const purchased = purchases
    .filter((purchase) => purchase.productId === productId)
    .reduce((sum, purchase) => sum + purchase.quantity, 0);
  const sold = sales
    .filter((sale) => sale.productId === productId)
    .reduce((sum, sale) => sum + sale.quantity, 0);
  return purchased - sold;
}

function monthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildReport(start?: string, end?: string) {
  const startDate = start ? new Date(start) : undefined;
  const endDate = end ? new Date(end) : undefined;

  const filteredPurchases = purchases.filter((purchase) => {
    if (startDate && new Date(purchase.date) < startDate) {
      return false;
    }
    if (endDate && new Date(purchase.date) > endDate) {
      return false;
    }
    return true;
  });

  const filteredSales = sales.filter((sale) => {
    if (startDate && new Date(sale.date) < startDate) {
      return false;
    }
    if (endDate && new Date(sale.date) > endDate) {
      return false;
    }
    return true;
  });

  const summary: ReportSummary = {
    totalProducts: products.length,
    totalPurchases: filteredPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0),
    totalSales: filteredSales.reduce((sum, sale) => sum + sale.quantity, 0),
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.quantity * sale.unitPrice, 0),
    totalCost: filteredPurchases.reduce((sum, purchase) => sum + purchase.quantity * purchase.unitCost, 0),
    net: 0
  };
  summary.net = summary.totalRevenue - summary.totalCost;

  const grouped = new Map<string, ReportRow>();
  const ensureRow = (key: string) => {
    if (!grouped.has(key)) {
      grouped.set(key, {
        month: key,
        unitsPurchased: 0,
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        net: 0
      });
    }
    return grouped.get(key)!;
  };

  filteredPurchases.forEach((purchase) => {
    const row = ensureRow(monthKey(purchase.date));
    row.unitsPurchased += purchase.quantity;
    row.cost += purchase.quantity * purchase.unitCost;
    row.net = row.revenue - row.cost;
  });

  filteredSales.forEach((sale) => {
    const row = ensureRow(monthKey(sale.date));
    row.unitsSold += sale.quantity;
    row.revenue += sale.quantity * sale.unitPrice;
    row.net = row.revenue - row.cost;
  });

  const rows = Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month));

  const details: DetailedReportRow[] = [
    ...filteredPurchases.map((purchase) => {
      const product = products.find((product) => product.id === purchase.productId)!;
      return {
        id: purchase.id,
        type: "purchase" as const,
        productId: product.id,
        productCode: product.code,
        productDescription: product.description,
        quantity: purchase.quantity,
        unitValue: purchase.unitCost,
        total: purchase.quantity * purchase.unitCost,
        date: purchase.date
      };
    }),
    ...filteredSales.map((sale) => {
      const product = products.find((product) => product.id === sale.productId)!;
      return {
        id: sale.id,
        type: "sale" as const,
        productId: product.id,
        productCode: product.code,
        productDescription: product.description,
        quantity: sale.quantity,
        unitValue: sale.unitPrice,
        total: sale.quantity * sale.unitPrice,
        date: sale.date
      };
    })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { summary, rows, details };
}

export function findProduct(productId: string) {
  return products.find((product) => product.id === productId);
}
