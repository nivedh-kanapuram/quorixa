import type { FileType } from "../../types";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";

export interface FileTypeIconProps {
  type: FileType;
  size?: number;
  className?: string;
}

const tokens: Record<FileType, { color: string; bg: string }> = {
  pdf: { color: "text-rose-500", bg: "bg-rose-500/10" },
  image: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  note: { color: "text-sky-500", bg: "bg-sky-500/10" },
  youtube: { color: "text-red-500", bg: "bg-red-500/10" },
};

const iconFor: Record<FileType, "file" | "image" | "note" | "youtube"> = {
  pdf: "file",
  image: "image",
  note: "note",
  youtube: "youtube",
};

export function FileTypeIcon({ type, size = 22, className = "" }: FileTypeIconProps) {
  const token = tokens[type];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl",
        token.bg,
        token.color,
        className
      )}
      style={{ width: size * 2.2, height: size * 2.2 }}
    >
      <Icon name={iconFor[type]} size={size} />
    </span>
  );
}

export const fileTypeLabel: Record<FileType, string> = {
  pdf: "PDF",
  image: "Image",
  note: "Note",
  youtube: "YouTube",
};