import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatLayout } from "../layouts/ChatLayout";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FileTypeIcon } from "../components/ui/FileTypeIcon";
import { Icon } from "../components/ui/Icon";
import { Markdown } from "../components/ui/Markdown";
import { sampleDocuments, sampleMessages, formatTime, shortName } from "../utils/format";
import { cn } from "../utils/cn";
import type { ChatMessage, SourceRef } from "../types";

const suggestions = [
  "Summarise the Krebs cycle from my notes",
  "Explain Newton's third law in Telugu",
  "What are the key dates in World War II?",
  "Quiz me on chapter 5",
];

export function StudyChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  const send = (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || typing) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
    setDraft("");
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-a`,
          role: "assistant",
          content:
            "Great question! Once the backend is connected, I'll answer this using only your uploaded documents — with citations you can tap to verify. For now this is a preview of the interface.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 1400);
  };

  const sidebar = useMemo(
    () => (
      <div className="space-y-2">
        {sampleDocuments.map((doc) => (
          <button
            key={doc.id}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 dark:hover:border-white/10 dark:hover:bg-white/10"
          >
            <FileTypeIcon type={doc.type} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {shortName(doc.name, 30)}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {doc.language.toUpperCase()}
              </span>
            </span>
          </button>
        ))}
      </div>
    ),
    []
  );

  const suggestionsVisible = messages.length <= 4;

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
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-6 lg:px-12"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {typing && <TypingIndicator />}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-slate-200/80 bg-white/60 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-12 dark:border-white/10 dark:bg-slate-950/60">
          {suggestionsVisible && (
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
                placeholder="Ask about your documents…"
                aria-label="Chat message"
                className="max-h-40 min-h-[42px] flex-1 resize-none bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <Button
                type="submit"
                disabled={!draft.trim() || typing}
                className="h-10 w-10 shrink-0 !rounded-xl p-0"
                aria-label="Send message"
              >
                <Icon name="send" size={17} />
              </Button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Answers are grounded in your documents only — ask in English, తెలుగు or हिन्दी.
          </p>
        </div>
      </div>
    </ChatLayout>
  );
}

/* ------------------------------------------------------------------ */

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
          {!isUser && message.sources && <SourceChip sources={message.sources} />}
        </div>

        {!isUser && message.sources && (
          <div className="mt-2.5 space-y-1.5">
            {message.sources.map((src) => (
              <SourceCard key={src.id} source={src} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceChip({ sources }: { sources: SourceRef[] }) {
  return (
    <Badge
      variant="primary"
      className="cursor-pointer normal-case tracking-normal transition-all duration-200 hover:-translate-y-0.5"
    >
      <Icon name="book" size={11} />
      {sources.length} source{sources.length > 1 ? "s" : ""}
    </Badge>
  );
}

function SourceCard({ source }: { source: SourceRef }) {
  return (
    <button
      className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-md dark:border-white/10 dark:bg-white/5"
    >
      <FileTypeIcon type={source.type} size={22} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {source.label}
        </span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
          {source.snippet}
        </span>
      </span>
      <Icon name="chevron-right" size={14} className="shrink-0 text-slate-400" />
    </button>
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