"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { clsx } from "clsx";
import { BarChart3, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/sales", label: "Sales", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={clsx(
          "fixed inset-y-0 z-40 w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <span className="text-lg font-semibold text-slate-800">Inventory</span>
          <button
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="space-y-1 px-4 py-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur md:hidden">
          <button
            className="rounded-md border px-3 py-2 text-sm font-medium"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            Menu
          </button>
          <span className="text-base font-semibold text-slate-800">
            {links.find((link) => pathname.startsWith(link.href))?.label ?? "Dashboard"}
          </span>
        </header>
        <main className="flex-1 space-y-6 bg-slate-50 px-4 pb-10 pt-6 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
