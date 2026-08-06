import { useRef, useState, type DragEvent } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/ui/Container";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { FileTypeIcon } from "../components/ui/FileTypeIcon";
import { formatBytes, formatTime, sampleUploads } from "../utils/format";
import { cn } from "../utils/cn";
import type { FileType, UploadStatus } from "../types";

const MAX_SIZE = 10 * 1024 * 1024;

interface UploadItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  status: UploadStatus;
  progress: number;
  uploadedAt: string;
  error?: string;
}

const formats: { type: FileType; title: string; hint: string; icon: IconName; gradient: string }[] = [
  {
    type: "pdf",
    title: "PDF Documents",
    hint: "Textbooks, chapters, question papers",
    icon: "file",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    type: "image",
    title: "Images & Notes",
    hint: "Screenshots, scanned pages, handwriting (OCR)",
    icon: "image",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    type: "note",
    title: "Text Notes",
    hint: "Plain text study notes (.txt)",
    icon: "note",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    type: "youtube",
    title: "YouTube Videos",
    hint: "Paste a link and get the transcript",
    icon: "youtube",
    gradient: "from-red-500 to-orange-600",
  },
];

function detectType(name: string): FileType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "note";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return "image";
  return "pdf";
}

export function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [items, setItems] = useState<UploadItem[]>(
    sampleUploads.map((f) => ({ ...f, progress: f.status === "completed" ? 100 : 40 }))
  );

  const addFiles = (files: FileList | File[]) => {
    const now = new Date().toISOString();
    const next: UploadItem[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        next.push({
          id: `up-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: detectType(file.name),
          size: file.size,
          status: "error",
          progress: 0,
          uploadedAt: now,
          error: "File exceeds the 10 MB limit",
        });
        return;
      }
      next.push({
        id: `up-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: detectType(file.name),
        size: file.size,
        status: "uploading",
        progress: 0,
        uploadedAt: now,
      });
    });

    setItems((prev) => [...next, ...prev]);

    next.forEach((item) => {
      if (item.status === "error") return;
      let progress = 0;
      const timer = window.setInterval(() => {
        progress = Math.min(100, progress + 7 + Math.random() * 12);
        setItems((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, progress: Math.round(progress) } : p))
        );
        if (progress >= 100) {
          window.clearInterval(timer);
          setItems((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, status: "completed" } : p))
          );
        }
      }, 180);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const fetchTranscript = () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setYoutubeUrl("");
    const id = `up-${Date.now()}`;
    setItems((prev) => [
      {
        id,
        name: "YouTube video transcript",
        type: "youtube",
        size: 0,
        status: "processing",
        progress: 0,
        uploadedAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 9 + Math.random() * 14);
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, progress: Math.round(progress) } : p))
      );
      if (progress >= 100) {
        window.clearInterval(timer);
        setItems((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
        );
      }
    }, 220);
  };

  return (
    <div className="py-14 lg:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary" className="px-4 py-1.5 text-xs normal-case tracking-normal">
            <Icon name="upload" size={13} />
            Upload
          </Badge>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Upload your study material
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            PDFs, images, notes or YouTube videos — we turn them into something
            you can chat with.
          </p>
        </div>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload files"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "group relative mt-12 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 sm:py-20",
            dragging
              ? "scale-[1.01] border-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-500/[0.03] dark:border-white/15 dark:bg-slate-900 dark:hover:border-blue-400/60"
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/30 transition-transform duration-300 group-hover:scale-110">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-pulse-ring rounded-3xl border-2 border-blue-500"
            />
            <Icon name="upload" size={34} />
          </span>
          <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
            {dragging ? "Drop it right here" : "Drag & drop your files"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            or click to browse — PDF, images, .txt · max 10 MB per file
          </p>
          <div className="mt-7">
            <Button type="button">
              <Icon name="plus" size={16} />
              Browse files
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Format cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {formats.map((f) => (
            <Card key={f.type} hover className="group p-5">
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                  f.gradient
                )}
              >
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {f.hint}
              </p>
            </Card>
          ))}
        </div>

        {/* YouTube */}
        <Card className="mt-8 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25">
              <Icon name="youtube" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Study from a YouTube video
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste a lecture link and we'll fetch the full transcript.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-1/2 sm:flex-row sm:items-center lg:w-3/5 xl:w-1/2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTranscript()}
                placeholder="https://youtu.be/..."
                aria-label="YouTube video URL"
                className="w-full min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/15 dark:bg-slate-800 dark:text-white"
              />
              <Button type="button" disabled={!youtubeUrl.trim()} onClick={fetchTranscript}>
                Fetch transcript
              </Button>
            </div>
          </div>
        </Card>

        {/* Upload list */}
        <div className="mt-14">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Uploads
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your files, as they process.
          </p>

          {items.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/15 dark:bg-slate-900/60">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500">
                <Icon name="upload" size={26} />
              </span>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                No uploads yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Drag a file above or paste a YouTube link — your uploads will
                appear here with live progress.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((file) => (
                <Card key={file.id} className="animate-fade-in-up p-4">
                  <div className="flex items-center gap-4">
                    <FileTypeIcon type={file.type} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <UploadStatusBadge status={file.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {file.size > 0 ? formatBytes(file.size) : "Video"} ·{" "}
                        {formatTime(file.uploadedAt)}
                        {file.error ? ` · ${file.error}` : ""}
                      </p>
                      {(file.status === "uploading" || file.status === "processing") && (
                        <div
                          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                          role="progressbar"
                          aria-valuenow={file.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Upload progress for ${file.name}`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(file.id)}
                      aria-label={`Remove ${file.name}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const map: Record<UploadStatus, { label: string; variant: "primary" | "success" | "warning" | "danger" | "neutral"; icon: IconName | null }> = {
    uploaded: { label: "Uploaded", variant: "neutral", icon: "check" },
    uploading: { label: "Uploading", variant: "primary", icon: "loader" },
    processing: { label: "Processing", variant: "warning", icon: "loader" },
    completed: { label: "Ready", variant: "success", icon: "check" },
    error: { label: "Failed", variant: "danger", icon: "close" },
  };
  const token = map[status];
  return (
    <Badge variant={token.variant} className="shrink-0 normal-case tracking-normal">
      {token.icon && (
        <Icon
          name={token.icon}
          size={11}
          className={status === "uploading" || status === "processing" ? "animate-spin" : ""}
        />
      )}
      {token.label}
    </Badge>
  );
}