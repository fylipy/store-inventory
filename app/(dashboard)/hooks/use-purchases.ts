"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Purchase } from "@/lib/types";

const PURCHASES_KEY = (filters?: Record<string, string | undefined>) =>
  ["purchases", filters?.productId ?? "all", filters?.start ?? "", filters?.end ?? ""] as const;

async function fetchPurchases(filters?: { productId?: string; start?: string; end?: string }): Promise<Purchase[]> {
  const params = new URLSearchParams();
  if (filters?.productId) params.set("productId", filters.productId);
  if (filters?.start) params.set("start", filters.start);
  if (filters?.end) params.set("end", filters.end);
  const response = await fetch(`/api/purchases${params.toString() ? `?${params}` : ""}`);
  if (!response.ok) {
    throw new Error("Failed to load purchases");
  }
  return response.json();
}

async function createPurchaseRequest(payload: Pick<Purchase, "productId" | "quantity" | "unitCost" | "date">) {
  const response = await fetch("/api/purchases", {
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

export function usePurchases(filters?: { productId?: string; start?: string; end?: string }) {
  return useQuery({ queryKey: PURCHASES_KEY(filters), queryFn: () => fetchPurchases(filters) });
}

export function useCreatePurchase(filters?: { productId?: string; start?: string; end?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseRequest,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: PURCHASES_KEY(filters) });
      const previous = queryClient.getQueryData<Purchase[]>(PURCHASES_KEY(filters));
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PURCHASES_KEY(filters), context.previous);
      }
      const details = error?.details;
      if (details) {
        const message = Object.values(details).join("\n");
        toast.error(message || "Unable to save purchase");
      } else {
        toast.error("Unable to save purchase");
      }
    },
    onSuccess: () => {
      toast.success("Purchase recorded");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY(filters) });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    }
  });
}
