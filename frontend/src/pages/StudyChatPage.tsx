import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatLayout } from "../layouts/ChatLayout";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FileTypeIcon } from "../components/ui/FileTypeIcon";
import { Icon } from "../components/ui/Icon";
import { Markdown } from "../components/ui/Markdown";
import { formatTime, shortName } from "../utils/format";
import { cn } from "../utils/cn";
import type { ChatMessage, LibraryDocument, SourceRef } from "../types";
import { queryChat } from "../services/chat.api";
import { LANGUAGE_STORAGE_KEY } from "./SettingsPage";
import { getLibraryDocuments } from "../services/library.api";
import { useToast } from "../components/ui/toast-context";

const suggestions = [
  "Summarise this document",
  "What are the key concepts?",
  "Explain this in simple terms",
  "Create a quiz from this document",
  "Explain this in Telugu",
  "Explain this in Hindi",
];

const typeLabels: Record<LibraryDocument["type"], string> = {
  pdf: "PDF",
  image: "Image",
  note: "Notes",
  youtube: "Video",
};

interface LocationState {
  documentIds?: string[];
}

export function StudyChatPage() {
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>({});
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;
    const loadDocuments = async () => {
      setDocsLoading(true);
      try {
        const docs = await getLibraryDocuments();
        if (cancelled) return;
        setDocuments(docs);

        const available = new Set(docs.map((doc) => doc.id));
        setSessions((prev) => {
          const next: Record<string, ChatMessage[]> = {};
          for (const [id, msgs] of Object.entries(prev)) {
            if (available.has(id)) next[id] = msgs;
          }
          return next;
        });

        if (!initializedRef.current) {
          initializedRef.current = true;
          const preselected = (location.state as LocationState | null)?.documentIds;
          const valid = preselected?.find((id) => docs.some((doc) => doc.id === id));
          setActiveId(valid ?? docs[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) setDocuments([]);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    };
    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

  const messages = useMemo(
    () => (activeId ? sessions[activeId] ?? [] : []),
    [sessions, activeId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const activeDoc = useMemo(
    () => documents.find((doc) => doc.id === activeId) ?? null,
    [documents, activeId]
  );

  const documentLookup = useMemo(() => {
    const map = new Map<string, LibraryDocument>();
    documents.forEach((doc) => map.set(doc.id, doc));
    return map;
  }, [documents]);

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || typing || !activeId) return;

    const targetId = activeId;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setSessions((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] ?? []), userMessage],
    }));
    setDraft("");
    setTyping(true);

    try {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const language = storedLanguage === "te" || storedLanguage === "hi" ? storedLanguage : "en";
      const response = await queryChat(content, [targetId], language);
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: Array.from(
          new Map(
            (response.sources ?? []).map((source) => {
              const doc = documentLookup.get(source.documentId);
              return [
                source.documentId,
                {
                  id: source.documentId,
                  label: doc?.name ?? `Document ${source.documentId}`,
                  type: doc?.type ?? "note",
                },
              ] as const;
            })
          ).values()
        ),
      };

      setSessions((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] ?? []), assistantMessage],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch the answer.";
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-e`,
        role: "assistant",
        content: `Sorry, I couldn't fetch the answer: ${message}`,
        timestamp: new Date().toISOString(),
      };
      setSessions((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] ?? []), errorMessage],
      }));
      push({ title: 'Chat error', description: message, variant: 'error' });
      console.error('Chat query failed:', error);
    } finally {
      setTyping(false);
    }
  };

  const selectDocument = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const sidebar = useMemo(
    () => (
      <div className="space-y-2">
        {docsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2.5">
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-3/4 rounded-full" />
                <div className="skeleton h-2.5 w-1/3 rounded-full" />
              </div>
            </div>
          ))
        ) : documents.length === 0 ? (
          <div className="px-2.5 py-6 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No documents yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Upload your study material to start learning.
            </p>
            <Button
              size="sm"
              variant="secondary"
              fullWidth
              className="mt-4"
              onClick={() => navigate("/upload")}
            >
              <Icon name="plus" size={15} />
              Upload documents
            </Button>
          </div>
        ) : (
          documents.map((doc) => {
            const isActive = doc.id === activeId;
            return (
              <button
                key={doc.id}
                onClick={() => selectDocument(doc.id)}
                aria-pressed={isActive}
                title={doc.name}
                aria-label={`Study ${doc.name}`}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors duration-150",
                  isActive
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-white/10 dark:hover:bg-white/10"
                )}
              >
                <FileTypeIcon type={doc.type} size={32} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      isActive
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-800 dark:text-slate-100"
                    )}
                  >
                    {shortName(doc.name, 30)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {doc.status === "Processing" || doc.status === "Pending" ? (
                      <Badge variant="warning" className="normal-case tracking-normal">
                        Processing
                      </Badge>
                    ) : doc.status === "Failed" ? (
                      <Badge variant="danger" className="normal-case tracking-normal">
                        Failed
                      </Badge>
                    ) : (
                      <span>
                        {typeLabels[doc.type]} · {doc.language.toUpperCase()}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  )}
                >
                  <Icon name="check" size={12} />
                </span>
              </button>
            );
          })
        )}
      </div>
    ),
    [documents, docsLoading, activeId, navigate, selectDocument]
  );

  const hasDocuments = documents.length > 0;

  return (
    <ChatLayout
      sidebar={sidebar}
      sidebarFooter={
        <Button fullWidth size="sm" onClick={() => navigate("/upload")}>
          <Icon name="plus" size={16} />
          Add documents
        </Button>
      }
    >
      <div className="flex h-full flex-col">
        {/* Context bar */}
        {hasDocuments && (
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/70 px-4 py-2.5 backdrop-blur-xl sm:px-6 lg:px-12 dark:border-white/10 dark:bg-slate-950/70">
            <Icon name="book" size={15} className="shrink-0 text-blue-600 dark:text-blue-400" />
            {activeDoc ? (
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                Studying: <span className="font-semibold">{activeDoc.name}</span>
              </span>
            ) : (
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                Choose a document from the sidebar to start.
              </span>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-6 lg:px-12 scroll-smooth"
        >
          {messages.length === 0 && !typing && !docsLoading ? (
            <EmptyChatState
              hasDocuments={hasDocuments}
              activeDoc={activeDoc}
              onUpload={() => navigate("/upload")}
              onAsk={send}
            />
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {typing && <TypingIndicator />}
            </>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 sticky bottom-0 border-t border-slate-200/80 bg-white/60 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-12 dark:border-white/10 dark:bg-slate-950/60">
          {messages.length > 0 && (
            <div
              className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1"
              role="list"
              aria-label="Suggested questions"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  role="listitem"
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 hover:shadow dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:text-blue-400"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="mx-auto flex max-w-3xl items-end gap-3"
          >
            <div className="flex flex-1 items-end gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 shadow-sm transition-all duration-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/15 dark:bg-slate-800">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={
                  !hasDocuments
                    ? "Upload documents to start…"
                    : activeDoc
                    ? `Ask about ${shortName(activeDoc.name, 40)}…`
                    : "Choose a document to ask questions…"
                }
                aria-label={activeDoc ? `Ask about ${shortName(activeDoc.name, 40)}` : "Chat message"}
                disabled={!hasDocuments || !activeDoc}
                className="max-h-40 min-h-[42px] flex-1 resize-none bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white"
              />
              <Button
                type="submit"
                disabled={!draft.trim() || typing || !hasDocuments || !activeDoc}
                className="h-10 w-10 shrink-0 !rounded-xl p-0"
                aria-label="Send message"
              >
                <Icon name="send" size={17} />
              </Button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Answers are grounded in your selected document only — ask in English, తెలుగు or
            हिन्दी.
          </p>
        </div>
      </div>
    </ChatLayout>
  );
}

/* ------------------------------------------------------------------ */

function EmptyChatState({
  hasDocuments,
  activeDoc,
  onUpload,
  onAsk,
}: {
  hasDocuments: boolean;
  activeDoc: LibraryDocument | null;
  onUpload: () => void;
  onAsk: (prompt: string) => void;
}) {
  if (!hasDocuments) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-blue-500">
          <Icon name="book" size={34} />
        </span>
        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
          Your library is empty
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Upload a PDF, image, note or YouTube video to start studying.
        </p>
        <Button className="mt-6" onClick={onUpload}>
          <Icon name="plus" size={16} />
          Upload your first document
        </Button>
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-blue-500">
          <Icon name="book" size={34} />
        </span>
        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
          Choose a document to study
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Pick a document from the sidebar to start asking questions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-blue-500">
        <Icon name="book" size={34} />
      </span>
      <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
        Ask anything about {shortName(activeDoc.name, 40)}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Your answers will be grounded only in the material you've selected.
      </p>
      <div
        className="mt-6 flex max-w-xl flex-wrap justify-center gap-2"
        role="list"
        aria-label="Suggested questions"
      >
        {suggestions.map((s) => (
          <button
            key={s}
            role="listitem"
            onClick={() => onAsk(s)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 hover:shadow dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:text-blue-400"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex animate-fade-in-up items-end gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/25">
          <Icon name="sparkles" size={16} />
        </span>
      )}

      <div className={cn("max-w-[85%] sm:max-w-[72%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:px-5 sm:py-3.5",
            isUser
              ? "rounded-br-md bg-gradient-to-r from-blue-600 to-violet-600 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2 px-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceFrom sources={message.sources} />
        )}
      </div>
    </div>
  );
}

function SourceFrom({ sources }: { sources: SourceRef[] }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-slate-400 dark:text-slate-500">
      <Icon name="file" size={12} className="shrink-0" />
      <span className="min-w-0 truncate">
        Based on: {sources.map((source) => source.label).join(" · ")}
      </span>
    </p>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in items-end gap-3" aria-label="Quorixa is typing">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/25">
        <Icon name="sparkles" size={16} />
      </span>
      <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-800">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}