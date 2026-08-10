import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";

export function BackLink({
  to,
  label,
  className,
}: {
  to: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      <Icon
        name="arrow-right"
        size={14}
        className="rotate-180 transition-transform group-hover:-translate-x-0.5"
      />
      {label}
    </Link>
  );
}