import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { cn } from "../../utils/cn";

export interface SidebarProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({
  title,
  open,
  onClose,
  children,
  footer,
  className,
}: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-white/10 dark:bg-slate-900 lg:sticky lg:top-0 lg:translate-x-0 lg:bg-transparent dark:lg:bg-transparent",
          open ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 px-4 py-4 dark:border-white/10">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}