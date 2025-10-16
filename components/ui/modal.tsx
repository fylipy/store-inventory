"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className={`w-full rounded-xl bg-white p-6 shadow-xl ${width}`}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
