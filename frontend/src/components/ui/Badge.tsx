import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "neutral";
  dot?: boolean;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  primary:
    "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-400",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-400",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-400",
  danger:
    "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-400",
  neutral:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300",
};

const dots: Record<NonNullable<BadgeProps["variant"]>, string> = {
  primary: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-slate-400",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...rest}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[variant])} />}
      {children}
    </span>
  );
}