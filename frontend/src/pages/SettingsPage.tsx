import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { useTheme } from "../hooks/theme-context";
import { languageOptions, version } from "../utils/format";
import { cn } from "../utils/cn";
import type { LanguageCode } from "../types";

export const LANGUAGE_STORAGE_KEY = "quorixa-language";

const appearanceOptions = [
  { id: "light", label: "Light", icon: "sun" as const, hint: "Bright & clean" },
  { id: "dark", label: "Dark", icon: "moon" as const, hint: "Easy on the eyes" },
  { id: "system", label: "System", icon: "settings" as const, hint: "Follow device" },
];

const modelDisplayName = "openai/gpt-oss-20b via Groq";
const modelDisplayHint = "Fast and capable open-weights model for study answers";

export function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "te" || stored === "hi" ? stored : "en";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return (
    <div className="py-14 lg:py-20">
      <Container>
        <div className="mx-auto max-w-4xl">
          <Badge variant="primary" className="px-4 py-1.5 text-xs normal-case tracking-normal">
          <Icon name="settings" size={13} />
          Settings
        </Badge>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Personalize Quorixa
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Make it yours — theme, language and more.
        </p>

        <div className="mt-10 space-y-6">
          {/* Appearance */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                <Icon name={resolvedTheme === "dark" ? "moon" : "sun"} size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Appearance
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose how Quorixa looks.
                </p>
              </div>
            </div>

            <div
              className="mt-6 grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Theme"
            >
              {appearanceOptions.map((option) => {
                const active = theme === option.id;
                return (
                  <button
                    key={option.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(option.id as "light" | "dark" | "system")}
                    className={cn(
                      "group rounded-2xl border p-4 text-left transition-all duration-300",
                      active
                        ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-600/10 ring-2 ring-blue-500/25 dark:border-blue-400/60"
                        : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:hover:border-white/25"
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <Icon
                        name={option.icon}
                        size={18}
                        className={cn(
                          "transition-colors",
                          active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        )}
                      />
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300",
                          active
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300 dark:border-white/20"
                        )}
                      >
                        {active && <Icon name="check" size={11} className="text-white" />}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-3 block text-sm font-bold",
                        active
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-900 dark:text-white"
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Language */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/25">
                <Icon name="globe" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Language
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  The language Quorixa answers in.
                </p>
              </div>
            </div>

            <div
              className="mt-6 grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Answer language"
            >
              {languageOptions.map((option) => {
                const active = language === option.code;
                return (
                  <button
                    key={option.code}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLanguage(option.code)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
                      active
                        ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-600/10 ring-2 ring-blue-500/25 dark:border-blue-400/60"
                        : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:hover:border-white/25"
                    )}
                  >
                    <span className="text-2xl">{option.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {option.nativeLabel}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                        active
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300 dark:border-white/20"
                      )}
                    >
                      {active && <Icon name="check" size={11} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* AI Model */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
                <Icon name="sparkles" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Model
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  The model that powers your answers.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {modelDisplayName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {modelDisplayHint}
                  </p>
                </div>
                <Badge variant="primary">Active</Badge>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Quorixa generates answers with Groq and grounds them in your
                uploaded documents only — no open-web lookups. Document
                embeddings are produced separately and never sent to the chat
                provider.
              </p>
            </div>
          </Card>

          {/* About */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                <Icon name="sparkles" size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  About Quorixa
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Version {version}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Quorixa is an AI-powered multilingual study assistant. Upload your
              own material — PDFs, images, notes or YouTube videos — and get
              answers grounded only in your documents, with source citations,
              in English, Telugu and Hindi.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="success" dot>
                Grounded answers
              </Badge>
              <Badge variant="primary">English · తెలుగు · हिन्दी</Badge>
              <Badge variant="neutral">Portfolio project</Badge>
            </div>
          </Card>
        </div>
        </div>
      </Container>
    </div>
  );
}