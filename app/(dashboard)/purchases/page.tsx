"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useCreatePurchase, usePurchases } from "@/app/(dashboard)/hooks/use-purchases";
import { useProducts } from "@/app/(dashboard)/hooks/use-products";
import { formatCurrency, formatDate } from "@/lib/format";

const today = new Date().toISOString().slice(0, 10);

type FormState = {
  productId: string;
  quantity: string;
  unitCost: string;
  date: string;
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

const defaultState: FormState = {
  productId: "",
  quantity: "",
  unitCost: "",
  date: today
};

export default function PurchasesPage() {
  const { data: products } = useProducts();
  const [filters, setFilters] = useState<{ productId?: string; start?: string; end?: string }>({});
  const { data: purchases, isLoading, isError } = usePurchases(filters);
  const createPurchase = useCreatePurchase(filters);

  const [formState, setFormState] = useState<FormState>(defaultState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const totalPurchases = useMemo(() => {
    return (purchases ?? []).reduce((sum, purchase) => sum + purchase.quantity * purchase.unitCost, 0);
  }, [purchases]);

  const handleSubmit = async () => {
    setFormErrors({});
    const payload = {
      productId: formState.productId,
      quantity: Number(formState.quantity),
      unitCost: Number(formState.unitCost),
      date: formState.date
    };

    try {
      await createPurchase.mutateAsync(payload);
      setFormState(defaultState);
    } catch (error: any) {
      const details = error?.details as Record<string, string> | undefined;
      if (details) {
        const mapped: FormErrors = {};
        Object.entries(details).forEach(([key, value]) => {
          if (key in defaultState) {
            mapped[key as keyof FormState] = value;
          } else if (key === "general") {
            mapped.general = value;
          }
        });
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: "Unable to save purchase" });
      }
    }
  };

  const productOptions = useMemo(() => {
    return (products ?? []).map((product) => ({ value: product.id, label: `${product.code} — ${product.description}` }));
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Purchases</h1>
          <p className="text-sm text-slate-500">Record incoming stock and review history.</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700">New purchase</h2>
          <p className="text-sm text-slate-500">Add new inventory received from suppliers.</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Product</label>
              <Select
                value={formState.productId}
                onChange={(event) => setFormState((state) => ({ ...state, productId: event.target.value }))}
                error={formErrors.productId}
              >
                <option value="">Select a product</option>
                {productOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={formState.quantity}
                  onChange={(event) => setFormState((state) => ({ ...state, quantity: event.target.value }))}
                  error={formErrors.quantity}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Unit cost</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.unitCost}
                  onChange={(event) => setFormState((state) => ({ ...state, unitCost: event.target.value }))}
                  error={formErrors.unitCost}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Date</label>
              <Input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((state) => ({ ...state, date: event.target.value }))}
                error={formErrors.date}
              />
            </div>
            {formErrors.general ? <p className="text-sm text-red-600">{formErrors.general}</p> : null}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                loading={createPurchase.isPending}
                disabled={createPurchase.isPending}
              >
                Save purchase
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700">Filters</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Product</label>
              <Select
                value={filters.productId ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    productId: event.target.value || undefined
                  }))
                }
              >
                <option value="">All products</option>
                {productOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <DateRangePicker
              start={filters.start ?? ""}
              end={filters.end ?? ""}
              onChange={({ start, end }) =>
                setFilters((current) => ({
                  ...current,
                  start: start || undefined,
                  end: end || undefined
                }))
              }
            />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setFilters({})}>
                Clear filters
              </Button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-600">Total invested</p>
              <p className="text-lg font-semibold text-slate-800">{formatCurrency(totalPurchases)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">Purchase history</h2>
        </div>
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Loading purchases…
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            Unable to load purchases. Please try again.
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No purchases found for the selected filters.
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Product</TH>
                <TH>Quantity</TH>
                <TH>Unit cost</TH>
                <TH>Total</TH>
              </TR>
            </THead>
            <TBody>
              {purchases.map((purchase) => {
                const product = products?.find((item) => item.id === purchase.productId);
                return (
                  <TR key={purchase.id}>
                    <TD>{formatDate(purchase.date)}</TD>
                    <TD>{product ? `${product.code} — ${product.description}` : purchase.productId}</TD>
                    <TD>{purchase.quantity}</TD>
                    <TD>{formatCurrency(purchase.unitCost)}</TD>
                    <TD>{formatCurrency(purchase.unitCost * purchase.quantity)}</TD>
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
