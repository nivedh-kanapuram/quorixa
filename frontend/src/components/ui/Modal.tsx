import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cn } from "../../utils/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: "danger" | "success" | "info";
  children?: ReactNode;
  footer?: ReactNode;
}

const iconTokens = {
  danger: "bg-rose-500/10 text-rose-500",
  success: "bg-emerald-500/10 text-emerald-500",
  info: "bg-blue-500/10 text-blue-500",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dialog"}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-md animate-scale-in rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10 outline-none dark:border-white/10 dark:bg-slate-900"
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <Icon name="close" size={18} />
        </button>

        {icon && (
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              iconTokens[icon]
            )}
          >
            <Icon name={icon === "danger" ? "trash" : icon === "success" ? "check" : "sparkles"} size={22} />
          </span>
        )}

        {title && (
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}

        {children}

        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}