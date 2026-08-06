import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Lightweight markdown renderer for chat answers.
 * Supports: headings, bold, italic, inline code, fenced code blocks, lists, paragraphs.
 * Avoids adding a runtime markdown dependency.
 */

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "code"; value: string };

function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }
    if (match[2]) tokens.push({ type: "strong", value: match[2] });
    else if (match[4]) tokens.push({ type: "em", value: match[4] });
    else if (match[6]) tokens.push({ type: "code", value: match[6] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", value: source.slice(lastIndex) });
  }
  return tokens;
}

function renderInline(source: string, keyPrefix: string): ReactNode[] {
  return parseInline(source).map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case "strong":
        return (
          <strong key={key} className="font-bold">
            {token.value}
          </strong>
        );
      case "em":
        return <em key={key}>{token.value}</em>;
      case "code":
        return (
          <code
            key={key}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-700 dark:bg-white/10 dark:text-blue-300"
          >
            {token.value}
          </code>
        );
      default:
        return <span key={key}>{token.value}</span>;
    }
  });
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10"
        >
          <Icon name={copied ? "check" : "download"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let blockIndex = 0;

  while (i < lines.length) {
    const line = lines[i];
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const codeFence = /^```(\w*)\s*$/.exec(line);

    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const base = "font-bold tracking-tight";
      const size =
        level === 1
          ? "text-xl"
          : level === 2
            ? "text-lg"
            : "text-base";
      blocks.push(
        <p key={`h-${blockIndex++}`} className={`my-3 ${base} ${size}`}>
          {renderInline(text, `h-${blockIndex}`)}
        </p>
      );
      i += 1;
    } else if (codeFence) {
      const lang = codeFence[1];
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push(
        <CodeBlock key={`code-${blockIndex++}`} code={buf.join("\n")} language={lang} />
      );
    } else if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${blockIndex++}`} className="my-2 list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${blockIndex}-${idx}`)}</li>
          ))}
        </ul>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${blockIndex++}`} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${blockIndex}-${idx}`)}</li>
          ))}
        </ol>
      );
    } else if (line.trim() === "") {
      i += 1;
    } else {
      const para: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^#{1,3}\s/.test(lines[i]) &&
        !/^```/.test(lines[i])
      ) {
        para.push(lines[i]);
        i += 1;
      }
      blocks.push(
        <p key={`p-${blockIndex++}`} className="my-2">
          {renderInline(para.join(" "), `p-${blockIndex}`)}
        </p>
      );
    }
  }

  return <div className="flex flex-col gap-0.5">{blocks}</div>;
}