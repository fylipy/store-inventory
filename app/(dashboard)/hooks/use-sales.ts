"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Sale } from "@/lib/types";

const SALES_KEY = (filters?: Record<string, string | undefined>) =>
  ["sales", filters?.productId ?? "all", filters?.start ?? "", filters?.end ?? ""] as const;

async function fetchSales(filters?: { productId?: string; start?: string; end?: string }): Promise<Sale[]> {
  const params = new URLSearchParams();
  if (filters?.productId) params.set("productId", filters.productId);
  if (filters?.start) params.set("start", filters.start);
  if (filters?.end) params.set("end", filters.end);
  const response = await fetch(`/api/sales${params.toString() ? `?${params}` : ""}`);
  if (!response.ok) {
    throw new Error("Failed to load sales");
  }
  return response.json();
}

async function createSaleRequest(payload: Pick<Sale, "productId" | "quantity" | "unitPrice" | "date">) {
  const response = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const data = await response.json();
    const error = new Error("Validation failed");
    (error as any).details = data.errors ?? {};
    throw error;
  }
  return response.json();
}

export function useSales(filters?: { productId?: string; start?: string; end?: string }) {
  return useQuery({ queryKey: SALES_KEY(filters), queryFn: () => fetchSales(filters) });
}

export function useCreateSale(filters?: { productId?: string; start?: string; end?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSaleRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SALES_KEY(filters) });
      const previous = queryClient.getQueryData<Sale[]>(SALES_KEY(filters));
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SALES_KEY(filters), context.previous);
      }
      const details = error?.details;
      if (details) {
        const message = Object.values(details).join("\n");
        toast.error(message || "Unable to record sale");
      } else {
        toast.error("Unable to record sale");
      }
    },
    onSuccess: () => {
      toast.success("Sale recorded");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEY(filters) });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });
}
