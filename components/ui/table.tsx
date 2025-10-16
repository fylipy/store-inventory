import { ReactNode } from "react";
import { clsx } from "clsx";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={clsx("hover:bg-slate-50", className)}>{children}</tr>;
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={clsx("px-4 py-3", className)}>{children}</th>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx("px-4 py-3", className)}>{children}</td>;
}
