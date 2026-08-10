import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const features: { icon: IconName; title: string; description: string; gradient: string }[] = [
  {
    icon: "file",
    title: "PDF Upload",
    description:
      "Extract clean, searchable text from textbooks, chapters and question papers in seconds.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: "image",
    title: "Image OCR",
    description:
      "Handwritten notes, diagrams and scanned pages are turned into readable, searchable text.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: "youtube",
    title: "YouTube Transcripts",
    description:
      "Paste any video link and get a full transcript to search, summarise and ask questions about.",
    gradient: "from-red-500 to-orange-600",
  },
  {
    icon: "sparkles",
    title: "RAG-Powered Answers",
    description:
      "Ask anything about your material and get answers grounded only in your documents — never the open web.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: "globe",
    title: "Three Languages",
    description:
      "Ask and receive answers in English, Telugu or Hindi — switch anytime, mid-conversation.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: "check",
    title: "Source Citations",
    description:
      "Every answer links back to the exact document and section it was drawn from.",
    gradient: "from-amber-500 to-yellow-600",
  },
];

const steps = [
  {
    title: "Upload your material",
    description: "PDFs, images, notes or a YouTube link — drag and drop, done.",
    icon: "upload" as IconName,
  },
  {
    title: "We index it",
    description: "Text is extracted, cleaned and turned into vector embeddings.",
    icon: "sparkles" as IconName,
  },
  {
    title: "Ask anything",
    description: "Chat naturally in English, Telugu or Hindi.",
    icon: "chat" as IconName,
  },
  {
    title: "Learn with sources",
    description: "Get cited, grounded answers you can trust and verify.",
    icon: "library" as IconName,
  },
];

const languages = [
  { name: "English", native: "English", tag: "Global", flag: "🇬🇧", gradient: "from-sky-500 to-blue-600" },
  { name: "Telugu", native: "తెలుగు", tag: "Native first", flag: "🇮🇳", gradient: "from-violet-500 to-purple-600" },
  { name: "Hindi", native: "हिन्दी", tag: "Native first", flag: "🇮🇳", gradient: "from-emerald-500 to-teal-600" },
];

const values = [
  {
    title: "Your Material, Your Answers",
    description:
      "Ask questions about your uploaded documents and get answers grounded in your own study material.",
    icon: "file" as IconName,
    gradient: "from-blue-600 to-violet-600",
  },
  {
    title: "Learn in Your Language",
    description:
      "Study in English, తెలుగు, or हिन्दी while keeping your learning material at the center.",
    icon: "globe" as IconName,
    gradient: "from-violet-600 to-fuchsia-600",
  },
  {
    title: "Answers You Can Verify",
    description:
      "Trace answers back to the relevant document sources instead of relying on unsupported information.",
    icon: "check" as IconName,
    gradient: "from-emerald-600 to-teal-600",
  },
];

const faqs = [
  {
    q: "How is Quorixa different from ChatGPT?",
    a: "Quorixa never answers from the open internet. It only answers from the material you upload, so every response is grounded in your own documents — and every answer shows the exact sources it was built from.",
  },
  {
    q: "What file types are supported?",
    a: "PDF documents, images (including handwritten notes, processed with OCR), plain text notes (.txt) and YouTube videos via automatic transcript fetching.",
  },
  {
    q: "Can I really ask questions in Telugu and Hindi?",
    a: "Yes. Quorixa understands and answers in English, Telugu and Hindi. Ask a question in one language and switch at any time — the answer follows your language.",
  },
  {
    q: "How large can my uploads be?",
    a: "Each file can be up to 10 MB. There's no limit on the number of documents you can upload to your library.",
  },
  {
    q: "Will my documents stay private?",
    a: "Yes. Your documents are processed and stored only for your study sessions, and answers are generated from your library alone.",
  },
  {
    q: "Is Quorixa free?",
    a: "Quorixa is in early access and free to use. As it grows, core learning features will stay free for students.",
  },
];

/* ------------------------------------------------------------------ */
/* LandingPage                                                         */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className="relative">
      <Hero />
      <Features />
      <HowItWorks />
      <Languages />
      <ValueSection />
      <Faq />
      <CtaBand />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const heroStats = [
  { value: "3", label: "Languages" },
  { value: "4", label: "Content types" },
  { value: "100%", label: "Grounded answers" },
  { value: "0", label: "Open-web answers" },
];

function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden pb-24 pt-16 lg:pb-28 lg:pt-28"
      aria-label="Hero"
    >
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] animate-blob rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-600/20" />
        <div
          className="absolute -right-24 top-24 h-[420px] w-[420px] animate-blob rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-600/20"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="absolute left-1/3 top-64 h-[380px] w-[380px] animate-blob rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/15"
          style={{ animationDelay: "-8s" }}
        />
        <div className="absolute inset-0 hero-grid opacity-[0.35] dark:opacity-20" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* Text */}
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <div className="animate-fade-in-up">
              <Badge
                variant="primary"
                className="px-4 py-1.5 text-xs normal-case tracking-normal"
              >
                <Icon name="sparkles" size={13} />
                AI-Powered Study Assistant
              </Badge>
            </div>

            <h1
              className="mt-7 animate-fade-in-up text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.75rem] dark:text-white"
              style={{ animationDelay: "80ms" }}
            >
              Learn from your own{" "}
              <span className="text-gradient animate-gradient-x">study material</span>
            </h1>

            <p
              className="mt-6 animate-fade-in-up text-lg leading-relaxed text-slate-600 dark:text-slate-300"
              style={{ animationDelay: "160ms" }}
            >
              Upload PDFs, images, notes or YouTube videos. Quorixa answers only
              from that content — with sources — in English, Telugu or Hindi.
            </p>

            <div
              className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              style={{ animationDelay: "240ms" }}
            >
              <Button size="lg" onClick={() => navigate("/upload")}>
                Start learning
                <Icon name="arrow-right" size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/chat")}>
                Try Study Chat
              </Button>
            </div>

            <div
              className="mt-8 animate-fade-in-up text-sm text-slate-500 dark:text-slate-400"
              style={{ animationDelay: "320ms" }}
            >
              Grounded in your uploaded material · English · తెలుగు · हिन्दी
            </div>
          </div>

          {/* Visual */}
          <div
            className="relative mx-auto hidden h-[460px] w-full max-w-md lg:mx-0 lg:block lg:max-w-none"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 via-violet-600/15 to-cyan-400/15 blur-2xl" />

            <div className="absolute left-1/2 top-1/2 flex h-64 w-64 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/70 bg-white/70 px-8 text-center shadow-2xl shadow-blue-600/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                <Icon name="chat" size={24} />
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Ask in any language
              </p>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                “Explain Newton's third law in తెలుగు”
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Icon name="check" size={12} />
                Answer cited · 2 sources
              </span>
            </div>

            <div className="absolute -left-2 top-4 animate-float">
              <FloatingCard
                icon="globe"
                label="Ask in తెలుగు"
                sub="భౌతిక శాస్త్రం వివరించండి"
                accent="text-violet-500 bg-violet-500/10"
              />
            </div>
            <div className="absolute -right-2 top-28 animate-float-delayed">
              <FloatingCard
                icon="check"
                label="Answer cited"
                sub="2 sources used"
                accent="text-emerald-500 bg-emerald-500/10"
              />
            </div>
            <div className="absolute -bottom-6 left-6 animate-float-delayed">
              <FloatingCard
                icon="youtube"
                label="Transcript ready"
                sub="Khan Academy · Calculus"
                accent="text-red-500 bg-red-500/10"
              />
            </div>
            <div className="absolute bottom-12 -right-3 animate-float">
              <FloatingCard
                icon="image"
                label="OCR complete"
                sub="Notes → readable text"
                accent="text-cyan-500 bg-cyan-500/10"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 max-w-5xl animate-fade-in-up lg:mt-24">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-white/10 dark:bg-white/10">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white px-6 py-6 text-center transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FloatingCard({
  icon,
  label,
  sub,
  accent,
}: {
  icon: IconName;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl shadow-slate-950/10">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent)}>
        <Icon name={icon} size={18} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{sub}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function Features() {
  return (
    <section id="features" className="section py-24" aria-label="Features">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to study"
          subtitle="Built for students who want grounded, citation-backed learning — in their own language."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} hover className="group p-7">
              <span
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                  feature.gradient
                )}
              >
                <Icon name={feature.icon} size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section id="how-it-works" className="section py-24" aria-label="How it works">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From file to answer in four steps"
          subtitle="No setup, no configuration. Upload, ask, learn."
        />
        <div className="mx-auto max-w-3xl">
          <ol className="relative space-y-10 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-gradient-to-b before:from-blue-500 before:via-violet-500 before:to-transparent">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex animate-fade-in-up items-start gap-6">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-600/10 dark:border-white/15 dark:bg-slate-900">
                  <Icon name={step.icon} size={22} className="text-blue-600 dark:text-blue-400" />
                </span>
                <Card className="flex-1 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Languages                                                           */
/* ------------------------------------------------------------------ */

function Languages() {
  return (
    <section id="languages" className="section py-24" aria-label="Supported languages">
      <Container>
        <SectionHeading
          eyebrow="Languages"
          title="Speak your language"
          subtitle="Ask in the language you think in — and switch anytime."
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {languages.map((lang) => (
            <Card key={lang.name} hover className="group relative overflow-hidden p-8 text-center">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-all duration-500 group-hover:opacity-30",
                  lang.gradient
                )}
              />
              <span className="text-5xl">{lang.flag}</span>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                {lang.name}
              </h3>
              <p className="mt-1 text-lg font-semibold text-slate-500 dark:text-slate-400">
                {lang.native}
              </p>
              <div className="mt-5">
                <Badge variant="primary">{lang.tag}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Product value                                                       */
/* ------------------------------------------------------------------ */

function ValueSection() {
  return (
    <section id="value" className="section py-24" aria-label="Product value">
      <Container>
        <SectionHeading
          eyebrow="BUILT FOR STUDENTS"
          title="Study smarter with your own material"
          subtitle="Upload your study material and get grounded answers, explanations, and sources from the content you actually need to learn."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} hover glass className="flex flex-col p-7">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                  v.gradient
                )}
              >
                <Icon name={v.icon} size={22} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
                {v.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {v.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section py-24" aria-label="Frequently asked questions">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          subtitle="Everything you need to know before you start studying."
        />
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={faq.q}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-300",
                  open
                    ? "border-blue-400/40 bg-white shadow-lg shadow-blue-600/10 dark:border-blue-400/25 dark:bg-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
                )}
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 dark:bg-white/10 dark:text-slate-300",
                      open && "rotate-180 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    <Icon name="chevron-down" size={16} />
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA band                                                            */
/* ------------------------------------------------------------------ */

function CtaBand() {
  const navigate = useNavigate();

  return (
    <section className="py-24" aria-label="Get started">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-xl shadow-slate-950/[0.04] sm:px-16 lg:py-16 dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_0_60px_-16px_rgba(124,58,237,0.35)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-24 h-64 w-64 animate-blob rounded-full bg-blue-500/10 blur-3xl" />
            <div
              className="absolute -bottom-24 -right-16 h-72 w-72 animate-blob rounded-full bg-violet-500/10 blur-3xl"
              style={{ animationDelay: "-6s" }}
            />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <span
              aria-hidden="true"
              className="mx-auto block h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
            />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Ready to study smarter?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Upload your material and start asking questions grounded in your
              own content.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate("/upload")}>
                Upload your material
                <Icon name="arrow-right" size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate("/chat")}>
                Open Study Chat
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}