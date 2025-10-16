"use client";

import { useQuery } from "@tanstack/react-query";
import { StockRecord } from "@/lib/types";

const STOCK_KEY = ["stock"] as const;

async function fetchStock(): Promise<StockRecord[]> {
  const response = await fetch("/api/stock");
  if (!response.ok) {
    throw new Error("Failed to load stock");
  }
  return response.json();
}

export function useStock() {
  return useQuery({ queryKey: STOCK_KEY, queryFn: fetchStock });
}
