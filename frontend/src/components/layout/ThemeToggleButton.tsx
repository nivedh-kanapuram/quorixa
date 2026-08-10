import { Icon } from "../ui/Icon";
import { useTheme } from "../../hooks/theme-context";
import { cn } from "../../utils/cn";

export function ThemeToggleButton() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      role="switch"
      aria-checked={dark}
      className={cn(
        "relative flex h-9 w-16 shrink-0 items-center rounded-full border border-slate-300 px-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:focus-visible:ring-offset-slate-950",
        dark ? "bg-slate-800" : "bg-slate-100"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300",
          dark
            ? "translate-x-7 text-slate-800"
            : "translate-x-0 text-amber-500"
        )}
      >
        <Icon name={dark ? "moon" : "sun"} size={15} />
      </span>
    </button>
  );
}