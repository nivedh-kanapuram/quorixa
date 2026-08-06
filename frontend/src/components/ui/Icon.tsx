import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Home,
  Image,
  LayoutGrid,
  Library,
  List,
  Loader2,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";

function GithubIcon({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.26 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function YoutubeIcon({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  );
}

export type IconName =
  | "book"
  | "file"
  | "image"
  | "note"
  | "youtube"
  | "send"
  | "search"
  | "trash"
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "globe"
  | "chat"
  | "settings"
  | "home"
  | "upload"
  | "library"
  | "check"
  | "download"
  | "arrow-right"
  | "plus"
  | "sparkles"
  | "github"
  | "chevron-down"
  | "chevron-right"
  | "grid"
  | "list"
  | "loader";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const icons: Record<IconName, IconComponent> = {
  book: BookOpen,
  file: FileText,
  image: Image,
  note: FileText,
  youtube: YoutubeIcon,
  send: Send,
  search: Search,
  trash: Trash2,
  menu: Menu,
  close: X,
  sun: Sun,
  moon: Moon,
  globe: Globe,
  chat: MessageSquare,
  settings: Settings,
  home: Home,
  upload: Upload,
  library: Library,
  check: Check,
  download: Download,
  "arrow-right": ArrowRight,
  plus: Plus,
  sparkles: Sparkles,
  github: GithubIcon,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  grid: LayoutGrid,
  list: List,
  loader: Loader2,
};

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const Component = icons[name];
  return <Component size={size} aria-hidden="true" {...rest} />;
}

export const fileTypeIcon: Record<string, IconName> = {
  pdf: "file",
  image: "image",
  note: "note",
  youtube: "youtube",
};
