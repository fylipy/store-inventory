export interface Purchase {
  sku: string;
  quantity: number;
  date: string | Date;
}

export interface Sale {
  sku: string;
  quantity: number;
  date: string | Date;
}

export interface StockBalance {
  sku: string;
  purchased: number;
  sold: number;
  balance: number;
}

export interface MonthlyStockSummary {
  month: string;
  purchases: number;
  sales: number;
  closingBalance: number;
}

export type MonthlyStockReport = Record<string, MonthlyStockSummary[]>;

type MovementType = 'purchase' | 'sale';

interface Movement {
  sku: string;
  quantity: number;
  date: Date;
  type: MovementType;
}

function toDate(value: string | Date): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date value: ${value}`);
  }
  return date;
}

function formatMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

function mapMovements(purchases: Purchase[], sales: Sale[]): Movement[] {
  const mapMovement = (type: MovementType) =>
    (record: Purchase | Sale): Movement => ({
      sku: record.sku,
      quantity: record.quantity,
      date: toDate(record.date),
      type,
    });

  return [
    ...purchases.map(mapMovement('purchase')),
    ...sales.map(mapMovement('sale')),
  ];
}

function assertPositiveQuantity(quantity: number, context: string): void {
  if (quantity <= 0 || !Number.isFinite(quantity)) {
    throw new RangeError(`${context} must be a positive, finite number.`);
  }
}

function ensureNonNegative(balance: number, sku: string, date: Date): void {
  if (balance < 0) {
    const isoDate = date.toISOString().slice(0, 10);
    throw new RangeError(`Negative stock for SKU "${sku}" on ${isoDate}.`);
  }
}

export function calculateStockBalances(
  purchases: Purchase[],
  sales: Sale[],
): Record<string, StockBalance> {
  const totals: Record<string, StockBalance> = {};

  for (const purchase of purchases) {
    assertPositiveQuantity(purchase.quantity, 'Purchase quantity');
    const sku = purchase.sku;
    const existing = totals[sku] ?? { sku, purchased: 0, sold: 0, balance: 0 };
    existing.purchased += purchase.quantity;
    existing.balance += purchase.quantity;
    totals[sku] = existing;
  }

  for (const sale of sales) {
    assertPositiveQuantity(sale.quantity, 'Sale quantity');
    const sku = sale.sku;
    const existing = totals[sku] ?? { sku, purchased: 0, sold: 0, balance: 0 };
    existing.sold += sale.quantity;
    existing.balance -= sale.quantity;
    ensureNonNegative(existing.balance, sku, toDate(sale.date));
    totals[sku] = existing;
  }

  for (const balance of Object.values(totals)) {
    ensureNonNegative(balance.balance, balance.sku, new Date());
  }

  return totals;
}

export function buildMonthlyStockReport(
  purchases: Purchase[],
  sales: Sale[],
): MonthlyStockReport {
  const movements = mapMovements(purchases, sales).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const report: MonthlyStockReport = {};
  const runningBalances = new Map<string, number>();

  for (const movement of movements) {
    assertPositiveQuantity(movement.quantity, 'Movement quantity');

    const month = formatMonth(movement.date);
    const skuReport = (report[movement.sku] = report[movement.sku] ?? []);
    let monthSummary = skuReport.find((item) => item.month === month);

    if (!monthSummary) {
      monthSummary = {
        month,
        purchases: 0,
        sales: 0,
        closingBalance: runningBalances.get(movement.sku) ?? 0,
      };
      skuReport.push(monthSummary);
      skuReport.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
    }

    const currentBalance = runningBalances.get(movement.sku) ?? 0;
    let updatedBalance = currentBalance;

    if (movement.type === 'purchase') {
      monthSummary.purchases += movement.quantity;
      updatedBalance += movement.quantity;
    } else {
      monthSummary.sales += movement.quantity;
      updatedBalance -= movement.quantity;
    }

    ensureNonNegative(updatedBalance, movement.sku, movement.date);
    monthSummary.closingBalance = updatedBalance;
    runningBalances.set(movement.sku, updatedBalance);
  }

  // Ensure month summaries are ordered chronologically within each SKU
  for (const summaries of Object.values(report)) {
    summaries.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  }

  return report;
}
