export type Product = {
  id: string;
  code: string;
  description: string;
  price: number;
  createdAt: string;
};

export type Purchase = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  date: string;
  createdAt: string;
};

export type Sale = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  date: string;
  createdAt: string;
};

export type StockRecord = {
  productId: string;
  current: number;
};

export type ReportSummary = {
  totalProducts: number;
  totalPurchases: number;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  net: number;
};

export type ReportRow = {
  month: string;
  unitsPurchased: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  net: number;
};

export type DetailedReportRow = {
  id: string;
  type: "purchase" | "sale";
  productId: string;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitValue: number;
  total: number;
  date: string;
};
