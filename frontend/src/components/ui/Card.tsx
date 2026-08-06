import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export function Card({
  hover = false,
  glass = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900",
        glass && "glass !border-slate-200/70 shadow-lg shadow-slate-950/5 dark:!border-white/10",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-600/10 dark:hover:border-blue-400/25 dark:hover:shadow-blue-500/5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}