import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { cn } from "../../utils/cn";
import { BrandLockup } from "../ui/BrandLockup";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/chat", label: "Study Chat" },
  { to: "/library", label: "Library" },
  { to: "/settings", label: "Settings" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300",
        scrolled
          ? "border-slate-200/80 bg-white/80 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-slate-950/80"
          : "border-transparent bg-white/50 dark:bg-slate-950/50"
      )}
    >
      <nav
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link to="/" className="group flex shrink-0 items-center" aria-label="Quorixa — back to home">
          <BrandLockup
            iconClassName="h-9 w-9 transition-transform duration-300 group-hover:scale-[1.03]"
            textClassName="text-lg"
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggleButton />
          <Link to="/upload" className="hidden md:block">
            <Button size="sm">Get Started</Button>
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-slide-down border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-slate-950/95 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/upload" className="flex-1" onClick={() => setOpen(false)}>
                <Button fullWidth size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}