"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
    const variants: Record<typeof variant, string> = {
      primary: "bg-accent text-white hover:bg-blue-600 focus-visible:outline-blue-500",
      secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:outline-slate-400",
      ghost: "text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-300"
    } as const;
    const sizes: Record<typeof size, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    } as const;

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], sizes[size], className, (disabled || loading) && "pointer-events-none opacity-60")}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
