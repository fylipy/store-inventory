import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  title?: string;
  value?: string | number | ReactNode;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function Card({ title, value, description, className, children }: CardProps) {
  return (
    <div className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title ? <p className="text-sm font-medium text-slate-500">{title}</p> : null}
      {value ? <h3 className="mt-2 text-2xl font-semibold text-slate-800">{value}</h3> : null}
      {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
