"use client";

import { useQuery } from "@tanstack/react-query";
import { DetailedReportRow, ReportRow, ReportSummary } from "@/lib/types";

type ReportResponse = {
  summary: ReportSummary;
  rows: ReportRow[];
  details: DetailedReportRow[];
};

const REPORTS_KEY = (filters?: { start?: string; end?: string }) =>
  ["reports", filters?.start ?? "", filters?.end ?? ""] as const;

async function fetchReport(filters?: { start?: string; end?: string }): Promise<ReportResponse> {
  const params = new URLSearchParams();
  if (filters?.start) params.set("start", filters.start);
  if (filters?.end) params.set("end", filters.end);
  const response = await fetch(`/api/reports${params.toString() ? `?${params}` : ""}`);
  if (!response.ok) {
    throw new Error("Failed to load report");
  }
  return response.json();
}

export function useReports(filters?: { start?: string; end?: string }) {
  return useQuery({ queryKey: REPORTS_KEY(filters), queryFn: () => fetchReport(filters) });
}
