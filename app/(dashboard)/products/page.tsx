"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useCreateProduct, useProducts, useUpdateProduct } from "@/app/(dashboard)/hooks/use-products";
import { useStock } from "@/app/(dashboard)/hooks/use-stock";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { clsx } from "clsx";

const SORTABLE_COLUMNS = ["code", "description", "price", "stock"] as const;
type SortKey = (typeof SORTABLE_COLUMNS)[number];

type FormState = {
  code: string;
  description: string;
  price: string;
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

const defaultState: FormState = { code: "", description: "", price: "" };

export default function ProductsPage() {
  const { data: products, isLoading, isError } = useProducts();
  const { data: stock } = useStock();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "code",
    direction: "asc"
  });
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stock?.forEach((item) => map.set(item.productId, item.current));
    return map;
  }, [stock]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const query = search.toLowerCase();
    const sorted = [...products].filter((product) =>
      product.code.toLowerCase().includes(query) || product.description.toLowerCase().includes(query)
    );
    return sorted.sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "price") {
        return (a.price - b.price) * direction;
      }
      if (sort.key === "stock") {
        const stockA = stockMap.get(a.id) ?? 0;
        const stockB = stockMap.get(b.id) ?? 0;
        return (stockA - stockB) * direction;
      }
      return a[sort.key].localeCompare(b[sort.key]) * direction;
    });
  }, [products, search, sort, stockMap]);

  const openCreateModal = () => {
    setFormState(defaultState);
    setFormErrors({});
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditing(product);
    setFormState({
      code: product.code,
      description: product.description,
      price: String(product.price)
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormState(defaultState);
    setFormErrors({});
    setEditing(null);
  };

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const handleSubmit = async () => {
    setFormErrors({});
    const payload = {
      code: formState.code.trim(),
      description: formState.description.trim(),
      price: Number(formState.price)
    };

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      closeModal();
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
        setFormErrors({ general: "Unable to save product" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500">Manage products and stock levels.</p>
        </div>
        <Button onClick={openCreateModal}>Add product</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Loading products…
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          Something went wrong while loading products. Please refresh.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No products found. Try adjusting your search or add a new product.
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              {SORTABLE_COLUMNS.map((column) => (
                <TH key={column}>
                  <button
                    onClick={() => handleSort(column)}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    <span className="capitalize">{column}</span>
                    <span className={clsx("text-xs", sort.key === column ? "opacity-100" : "opacity-0")}>
                      {sort.direction === "asc" ? "▲" : "▼"}
                    </span>
                  </button>
                </TH>
              ))}
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((product) => (
              <TR key={product.id}>
                <TD className="font-medium text-slate-700">{product.code}</TD>
                <TD>{product.description}</TD>
                <TD>{formatCurrency(product.price)}</TD>
                <TD>{stockMap.get(product.id) ?? 0}</TD>
                <TD className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
                    Edit
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit product" : "Add product"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Code</label>
            <Input
              value={formState.code}
              onChange={(event) => setFormState((state) => ({ ...state, code: event.target.value }))}
              error={formErrors.code}
              placeholder="SKU or internal code"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Description</label>
            <Input
              value={formState.description}
              onChange={(event) => setFormState((state) => ({ ...state, description: event.target.value }))}
              error={formErrors.description}
              placeholder="Product name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Price</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formState.price}
              onChange={(event) => setFormState((state) => ({ ...state, price: event.target.value }))}
              error={formErrors.price}
              placeholder="0.00"
            />
          </div>
          {formErrors.general ? <p className="text-sm text-red-600">{formErrors.general}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeModal} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createProduct.isPending || updateProduct.isPending}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {editing ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
