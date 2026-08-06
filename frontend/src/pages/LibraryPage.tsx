import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { FileTypeIcon } from "../components/ui/FileTypeIcon";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { sampleDocuments, formatBytes, formatDate } from "../utils/format";
import { cn } from "../utils/cn";
import type { LibraryDocument } from "../types";

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "name";
type TypeFilter = LibraryDocument["type"] | "all";

const typeFilters: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Images" },
  { id: "note", label: "Notes" },
  { id: "youtube", label: "Video" },
];

const typeGradient: Record<LibraryDocument["type"], string> = {
  pdf: "from-rose-500 to-pink-600",
  image: "from-emerald-500 to-teal-600",
  note: "from-sky-500 to-blue-600",
  youtube: "from-red-500 to-orange-600",
};

export function LibraryPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<LibraryDocument | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDocuments(sampleDocuments);
      setLoading(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = documents
    .filter((doc) => {
      if (filter !== "all" && doc.type !== filter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.sourceName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "oldest") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDocuments((docs) => docs.filter((d) => d.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="py-14 lg:py-20">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="primary" className="px-4 py-1.5 text-xs normal-case tracking-normal">
              <Icon name="library" size={13} />
              Library
            </Badge>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Your library
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {documents.length} document{documents.length !== 1 ? "s" : ""} ready
              to study
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={17} />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                aria-label="Search documents"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/15 dark:bg-slate-900"
              role="group"
              aria-label="View mode"
            >
              {(
                [
                  { id: "grid", label: "Grid view", icon: "grid" as IconName },
                  { id: "list", label: "List view", icon: "list" as IconName },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setView(mode.id)}
                  aria-label={mode.label}
                  aria-pressed={view === mode.id}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                    view === mode.id
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                  )}
                >
                  <Icon name={mode.icon} size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters + sort */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
            {typeFilters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                    active
                      ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/25"
                      : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-white/25"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              aria-label="Sort documents"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
        </div>

        {/* Body */}
        {loading ? (
          <SkeletonGrid view={view} />
        ) : visible.length === 0 ? (
          <EmptyState
            hasQuery={Boolean(query) || filter !== "all"}
            onClear={() => {
              setQuery("");
              setFilter("all");
            }}
          />
        ) : view === "grid" ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onDelete={() => setPendingDelete(doc)}
                onStudy={() => navigate("/chat")}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {visible.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onDelete={() => setPendingDelete(doc)}
                onStudy={() => navigate("/chat")}
              />
            ))}
          </div>
        )}
      </Container>

      {/* Delete confirmation */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        icon="danger"
        title="Delete this document?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from your library. This can't be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Icon name="trash" size={15} />
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DocCard({
  doc,
  onDelete,
  onStudy,
}: {
  doc: LibraryDocument;
  onDelete: () => void;
  onStudy: () => void;
}) {
  return (
    <Card hover className="group animate-fade-in-up overflow-hidden">
      <div
        aria-hidden="true"
        className={cn("h-1.5 bg-gradient-to-r", typeGradient[doc.type])}
      />
      <div className="flex flex-col p-6">
        <div className="flex items-start justify-between">
          <FileTypeIcon type={doc.type} size={44} />
          <button
            onClick={onDelete}
            aria-label={`Delete ${doc.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-500 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>

        <h3 className="mt-4 truncate font-bold text-slate-900 dark:text-white">
          {doc.name}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {doc.sourceName}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{doc.type}</Badge>
          <Badge variant="neutral">{doc.language.toUpperCase()}</Badge>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {doc.size > 0 ? formatBytes(doc.size) : "Video"} · {formatDate(doc.uploadedAt)}
          </span>
          <Button size="sm" onClick={onStudy}>
            <Icon name="chat" size={14} />
            Study
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DocRow({
  doc,
  onDelete,
  onStudy,
}: {
  doc: LibraryDocument;
  onDelete: () => void;
  onStudy: () => void;
}) {
  return (
    <Card className="group flex animate-fade-in-up items-center gap-4 p-4">
      <FileTypeIcon type={doc.type} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {doc.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {doc.sourceName} · {doc.size > 0 ? formatBytes(doc.size) : "Video"} ·{" "}
          {formatDate(doc.uploadedAt)}
        </p>
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        <Badge>{doc.type}</Badge>
        <Badge variant="neutral">{doc.language.toUpperCase()}</Badge>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={onDelete}
          aria-label={`Delete ${doc.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
        >
          <Icon name="trash" size={16} />
        </button>
        <Button size="sm" onClick={onStudy}>
          <Icon name="chat" size={14} />
          Study
        </Button>
      </div>
    </Card>
  );
}

function SkeletonGrid({ view }: { view: ViewMode }) {
  return (
    <div
      className={cn("mt-10", view === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3")}
      aria-label="Loading documents"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
        >
          <div className="skeleton h-1.5" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="skeleton h-9 w-9 rounded-xl" />
            </div>
            <div className="skeleton mt-4 h-4 w-3/4 rounded-full" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded-full" />
            <div className="mt-4 flex gap-2">
              <div className="skeleton h-5 w-14 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-8 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="mt-16 flex animate-fade-in flex-col items-center text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-blue-500">
        <Icon name="library" size={34} />
      </span>
      <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
        {hasQuery ? "No matches found" : "Your library is empty"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {hasQuery
          ? "Try a different search term."
          : "Upload a PDF, image, note or YouTube video to start studying."}
      </p>
      {hasQuery ? (
        <Button variant="secondary" className="mt-6" onClick={onClear}>
          Clear search
        </Button>
      ) : (
        <Button className="mt-6" onClick={() => navigate("/upload")}>
          <Icon name="plus" size={16} />
          Upload your first document
        </Button>
      )}
    </div>
  );
}