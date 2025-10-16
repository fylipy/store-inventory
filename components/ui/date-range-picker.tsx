"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { Input } from "./input";

type Props = {
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
};

export function DateRangePicker({ start, end, onChange }: Props) {
  const formatted = useMemo(() => {
    const fallback = { startLabel: "", endLabel: "" };
    try {
      return {
        startLabel: start ? format(new Date(start), "MMM dd, yyyy") : "",
        endLabel: end ? format(new Date(end), "MMM dd, yyyy") : ""
      };
    } catch (err) {
      return fallback;
    }
  }, [start, end]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-600">
        Start date
        <Input
          type="date"
          value={start}
          max={end || undefined}
          onChange={(event) => onChange({ start: event.target.value, end })}
        />
        {formatted.startLabel && <span className="text-xs text-slate-400">{formatted.startLabel}</span>}
      </label>
      <label className="text-sm font-medium text-slate-600">
        End date
        <Input
          type="date"
          value={end}
          min={start || undefined}
          onChange={(event) => onChange({ start, end: event.target.value })}
        />
        {formatted.endLabel && <span className="text-xs text-slate-400">{formatted.endLabel}</span>}
      </label>
    </div>
  );
}
