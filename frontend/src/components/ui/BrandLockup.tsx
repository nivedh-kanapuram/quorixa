import { cn } from "../../utils/cn";

export function BrandLockup({
  className,
  iconClassName,
  textClassName,
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/quorixa-favicon.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn("shrink-0 object-contain", iconClassName)}
      />
      <span
        className={cn(
          "whitespace-nowrap font-bold tracking-tight text-slate-900 dark:text-white",
          textClassName
        )}
      >
        Quori
        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          x
        </span>
        a
      </span>
    </span>
  );
}