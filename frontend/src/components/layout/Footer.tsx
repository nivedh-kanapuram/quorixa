import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Container } from "../ui/Container";
import { BrandLockup } from "../ui/BrandLockup";

const linkColumns = [
  {
    title: "Product",
    links: [
      { label: "Upload", to: "/upload" },
      { label: "Study Chat", to: "/chat" },
      { label: "Library", to: "/library" },
      { label: "Settings", to: "/settings" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Supported formats", to: "/upload" },
      { label: "How it works", to: "/" },
      { label: "Languages", to: "/" },
      { label: "FAQ", to: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center" aria-label="Quorixa — back to home">
              <BrandLockup iconClassName="h-8 w-8" textClassName="text-lg" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The AI-powered multilingual study assistant. Learn from your own
              material — PDFs, images, notes and YouTube videos — with answers
              that always cite their sources.
            </p>
          </div>

          {linkColumns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Supported languages
            </h3>
            <p className="mt-4 flex flex-wrap gap-2">
              {["English", "తెలుగు", "हिन्दी"].map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {lang}
                </span>
              ))}
            </p>
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Icon name="check" size={13} className="text-emerald-500" />
              Every answer cites its sources
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Quorixa. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Icon name="globe" size={15} /> English · తెలుగు · हिन्दी
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}