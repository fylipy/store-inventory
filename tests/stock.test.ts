import { describe, expect, it } from 'vitest';
import {
  buildMonthlyStockReport,
  calculateStockBalances,
  Purchase,
  Sale,
} from '../lib/stock';

describe('calculateStockBalances', () => {
  it('aggregates purchases and sales into current stock balances', () => {
    const purchases: Purchase[] = [
      { sku: 'A-1', quantity: 10, date: '2024-01-15' },
      { sku: 'A-1', quantity: 5, date: '2024-02-01' },
      { sku: 'B-9', quantity: 3, date: '2024-01-05' },
    ];

    const sales: Sale[] = [
      { sku: 'A-1', quantity: 4, date: '2024-02-10' },
      { sku: 'B-9', quantity: 1, date: '2024-01-20' },
    ];

    const balances = calculateStockBalances(purchases, sales);

    expect(balances).toEqual({
      'A-1': { sku: 'A-1', purchased: 15, sold: 4, balance: 11 },
      'B-9': { sku: 'B-9', purchased: 3, sold: 1, balance: 2 },
    });
  });

  it('throws when sales drive the stock negative', () => {
    const purchases: Purchase[] = [{ sku: 'A-1', quantity: 3, date: '2024-01-01' }];
    const sales: Sale[] = [{ sku: 'A-1', quantity: 4, date: '2024-01-02' }];

    expect(() => calculateStockBalances(purchases, sales)).toThrowError(
      /Negative stock for SKU "A-1"/,
    );
  });
});

describe('buildMonthlyStockReport', () => {
  it('tracks month-by-month totals and closing balances per SKU', () => {
    const purchases: Purchase[] = [
      { sku: 'A-1', quantity: 5, date: '2024-01-05' },
      { sku: 'A-1', quantity: 2, date: '2024-02-10' },
      { sku: 'A-1', quantity: 3, date: '2024-03-01' },
      { sku: 'B-9', quantity: 10, date: '2024-02-15' },
    ];

    const sales: Sale[] = [
      { sku: 'A-1', quantity: 1, date: '2024-01-31' },
      { sku: 'A-1', quantity: 1, date: '2024-02-20' },
      { sku: 'A-1', quantity: 2, date: '2024-03-05' },
      { sku: 'B-9', quantity: 4, date: '2024-03-20' },
    ];

    const report = buildMonthlyStockReport(purchases, sales);

    expect(report['A-1']).toEqual([
      { month: '2024-01', purchases: 5, sales: 1, closingBalance: 4 },
      { month: '2024-02', purchases: 2, sales: 1, closingBalance: 5 },
      { month: '2024-03', purchases: 3, sales: 2, closingBalance: 6 },
    ]);

    expect(report['B-9']).toEqual([
      { month: '2024-02', purchases: 10, sales: 0, closingBalance: 10 },
      { month: '2024-03', purchases: 0, sales: 4, closingBalance: 6 },
    ]);
  });

  it('throws if any sale causes the running balance to go negative mid-month', () => {
    const purchases: Purchase[] = [{ sku: 'C-3', quantity: 2, date: '2024-01-10' }];
    const sales: Sale[] = [
      { sku: 'C-3', quantity: 1, date: '2024-01-15' },
      { sku: 'C-3', quantity: 2, date: '2024-01-16' },
    ];

    expect(() => buildMonthlyStockReport(purchases, sales)).toThrowError(
      /Negative stock for SKU "C-3"/,
    );
  });
});
