"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Product } from "@/lib/types";

const PRODUCTS_KEY = ["products"] as const;

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Failed to load products");
  }
  return response.json();
}

async function createProductRequest(payload: Pick<Product, "code" | "description" | "price">) {
  const response = await fetch("/api/products", {
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

async function updateProductRequest(id: string, payload: Pick<Product, "code" | "description" | "price">) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
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

export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: fetchProducts });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductRequest,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTS_KEY });
      const previous = queryClient.getQueryData<Product[]>(PRODUCTS_KEY);
      const optimistic: Product = {
        id: "temp-" + Math.random().toString(36).slice(2),
        code: input.code,
        description: input.description,
        price: input.price,
        createdAt: new Date().toISOString()
      };
      queryClient.setQueryData<Product[]>(PRODUCTS_KEY, (old) => (old ? [...old, optimistic] : [optimistic]));
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PRODUCTS_KEY, context.previous);
      }
      const details = error?.details;
      if (details?.general) {
        toast.error(details.general);
      } else {
        toast.error("Unable to create product");
      }
    },
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_KEY, (old) => {
        if (!old) return [product];
        return old.map((item) => (item.id.startsWith("temp-") ? product : item));
      });
      toast.success("Product created");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Pick<Product, "code" | "description" | "price">) =>
      updateProductRequest(id, payload),
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTS_KEY });
      const previous = queryClient.getQueryData<Product[]>(PRODUCTS_KEY);
      queryClient.setQueryData<Product[]>(PRODUCTS_KEY, (old) =>
        old?.map((product) => (product.id === id ? { ...product, ...input } : product)) || []
      );
      return { previous };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PRODUCTS_KEY, context.previous);
      }
      const details = error?.details;
      if (details?.general) {
        toast.error(details.general);
      } else {
        toast.error("Unable to update product");
      }
    },
    onSuccess: () => {
      toast.success("Product updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    }
  });
}
