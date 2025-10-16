"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <select
          ref={ref}
          className={clsx(
            "w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200",
            error ? "border-red-400" : "border-slate-300",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }
);
Select.displayName = "Select";
