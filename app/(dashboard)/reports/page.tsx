"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useReports } from "@/app/(dashboard)/hooks/use-reports";
import { useProducts } from "@/app/(dashboard)/hooks/use-products";
import { formatCurrency, formatDate } from "@/lib/format";
import { format } from "date-fns";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function monthToISO(month?: string) {
  if (!month) return undefined;
  const [year, value] = month.split("-");
  return `${year}-${value}-01`;
}

function downloadCSV(rows: string[][], filename: string) {
  const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [filter, setFilter] = useState<{ start?: string; end?: string }>({});
  const { data, isLoading, isError } = useReports({
    start: monthToISO(filter.start),
    end: monthToISO(filter.end)
  });
  const { data: products } = useProducts();

  const monthLabel = useCallback((month: string) => {
    try {
      return format(new Date(`${month}-01T00:00:00`), "MMM yyyy");
    } catch {
      return month;
    }
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.rows.map((row) => ({
      month: monthLabel(row.month),
      purchased: row.unitsPurchased,
      sold: row.unitsSold
    }));
  }, [data, monthLabel]);

  const exportCSV = () => {
    if (!data) return;
    const header = ["Type", "Date", "Product", "Quantity", "Unit value", "Total"];
    const rows = data.details.map((detail) => {
      const product = products?.find((item) => item.id === detail.productId);
      const productLabel = product
        ? `${product.code} — ${product.description}`
        : `${detail.productCode} — ${detail.productDescription}`;
      return [
        detail.type,
        formatDate(detail.date),
        productLabel,
        detail.quantity.toString(),
        formatCurrency(detail.unitValue),
        formatCurrency(detail.total)
      ];
    });
    downloadCSV([header, ...rows], "inventory-report.csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Review performance over time with filters and exports.</p>
        </div>
        <Button onClick={exportCSV} disabled={!data}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Products" value={data?.summary.totalProducts ?? "—"} description="Active SKUs" />
        <Card title="Units purchased" value={data?.summary.totalPurchases ?? "—"} description="Across period" />
        <Card title="Units sold" value={data?.summary.totalSales ?? "—"} description="Across period" />
        <Card title="Net" value={data ? formatCurrency(data.summary.net) : "—"} description="Revenue - cost" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Filters</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Start month</label>
            <Input
              type="month"
              value={filter.start ?? ""}
              max={filter.end ?? undefined}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  start: event.target.value || undefined
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">End month</label>
            <Input
              type="month"
              value={filter.end ?? ""}
              min={filter.start ?? undefined}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  end: event.target.value || undefined
                }))
              }
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => setFilter({})}>
              Reset filters
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">Units per month</h2>
        <p className="text-sm text-slate-500">Compare purchased and sold units over time.</p>
        <div className="mt-6 h-80">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-slate-500">Loading chart…</div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center text-red-600">Unable to load chart.</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500">No data for selected period.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="purchased" fill="#60a5fa" name="Purchased" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sold" fill="#34d399" name="Sold" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">Monthly breakdown</h2>
        </div>
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Loading summary…
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            Unable to load summary data.
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No monthly data for the selected period.
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Month</TH>
                <TH>Units purchased</TH>
                <TH>Units sold</TH>
                <TH>Cost</TH>
                <TH>Revenue</TH>
                <TH>Net</TH>
              </TR>
            </THead>
            <TBody>
              {data.rows.map((row) => (
                <TR key={row.month}>
                  <TD>{monthLabel(row.month)}</TD>
                  <TD>{row.unitsPurchased}</TD>
                  <TD>{row.unitsSold}</TD>
                  <TD>{formatCurrency(row.cost)}</TD>
                  <TD>{formatCurrency(row.revenue)}</TD>
                  <TD>{formatCurrency(row.net)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">Detailed activity</h2>
        </div>
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Loading report…
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            Unable to load report data.
          </div>
        ) : !data || data.details.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No activity for the selected period.
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Type</TH>
                <TH>Date</TH>
                <TH>Product</TH>
                <TH>Quantity</TH>
                <TH>Unit value</TH>
                <TH>Total</TH>
              </TR>
            </THead>
            <TBody>
              {data.details.map((detail) => {
                const product = products?.find((item) => item.id === detail.productId);
                const label = product
                  ? `${product.code} — ${product.description}`
                  : `${detail.productCode} — ${detail.productDescription}`;
                return (
                  <TR key={`${detail.type}-${detail.id}`}>
                    <TD className="capitalize">{detail.type}</TD>
                    <TD>{formatDate(detail.date)}</TD>
                    <TD>{label}</TD>
                    <TD>{detail.quantity}</TD>
                    <TD>{formatCurrency(detail.unitValue)}</TD>
                    <TD>{formatCurrency(detail.total)}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
