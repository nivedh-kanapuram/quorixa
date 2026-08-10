import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon";
import { Sidebar } from "../components/layout/Sidebar";
import { ThemeToggleButton } from "../components/layout/ThemeToggleButton";
import { BrandLockup } from "../components/ui/BrandLockup";

export interface ChatLayoutProps {
  sidebar: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

export function ChatLayout({ sidebar, sidebarFooter, children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:flex-row">
      <Sidebar
        title="Documents"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        footer={sidebarFooter}
      >
        {sidebar}
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open documents"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden"
            >
              <Icon name="menu" size={18} />
            </button>
            <Link
              to="/library"
              aria-label="Back to Library"
              className="group flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Icon
                name="arrow-right"
                size={14}
                className="rotate-180 transition-transform group-hover:-translate-x-0.5"
              />
              Back to Library
            </Link>
            <span aria-hidden="true" className="h-5 w-px shrink-0 bg-slate-200 dark:bg-white/10" />
            <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Quorixa — back to home">
              <BrandLockup iconClassName="h-7 w-7" textClassName="text-base" />
              <span className="ml-1 hidden rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 sm:inline-block dark:text-blue-400">
                Study Chat
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Link
              to="/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            >
              <Icon name="settings" size={18} />
            </Link>
          </div>
        </header>

        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}