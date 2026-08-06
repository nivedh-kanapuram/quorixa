import { cn } from "../../utils/cn";
import { Container } from "./Container";

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  return (
    <Container
      className={cn(
        "mb-14",
        align === "center" && "text-center",
        className
      )}
    >
      <p className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400">
        {eyebrow}
      </p>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.6rem] dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300",
            align === "center" && "mx-auto max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </Container>
  );
}