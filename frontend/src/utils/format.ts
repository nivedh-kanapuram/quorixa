import type { LibraryDocument, ChatMessage, LanguageOption, UploadedFile } from "../types";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortName(name: string, max = 26): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 3)}...`;
}

export const languageOptions: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
];

export const sampleDocuments: LibraryDocument[] = [
  {
    id: "doc-1",
    name: "Physics_Chapter_5.pdf",
    type: "pdf",
    size: 2480000,
    sourceName: "Physics Chapter 5 — Work & Energy",
    language: "en",
    uploadedAt: "2026-07-28T09:12:00.000Z",
  },
  {
    id: "doc-2",
    name: "Handwritten_Notes.jpg",
    type: "image",
    size: 1120000,
    sourceName: "Chemistry hand-written notes",
    language: "te",
    uploadedAt: "2026-07-29T14:40:00.000Z",
  },
  {
    id: "doc-3",
    name: "World_War_II_notes.txt",
    type: "note",
    size: 48000,
    sourceName: "History — WW2 timeline",
    language: "en",
    uploadedAt: "2026-07-30T18:05:00.000Z",
  },
  {
    id: "doc-4",
    name: "Khan Academy calculus",
    type: "youtube",
    size: 0,
    sourceName: "https://youtu.be/dQw4w9WgXcQ",
    language: "en",
    uploadedAt: "2026-08-01T11:22:00.000Z",
  },
  {
    id: "doc-5",
    name: "Valavani Formula Sheet.png",
    type: "image",
    size: 920000,
    sourceName: "Formula sheet",
    language: "te",
    uploadedAt: "2026-08-02T08:10:00.000Z",
  },
  {
    id: "doc-6",
    name: "Chemistry_Reactions.pdf",
    type: "pdf",
    size: 3100000,
    sourceName: "Chemistry reactions & balancing",
    language: "hi",
    uploadedAt: "2026-08-03T20:31:00.000Z",
  },
];

export const sampleUploads: UploadedFile[] = [
  {
    id: "up-1",
    name: "Biology_Chapter_5.pdf",
    type: "pdf",
    size: 2480000,
    status: "completed",
    uploadedAt: "2026-07-28T09:12:00.000Z",
  },
  {
    id: "up-2",
    name: "Handwritten_Notes.jpg",
    type: "image",
    size: 1120000,
    status: "completed",
    uploadedAt: "2026-07-29T14:40:00.000Z",
  },
  {
    id: "up-3",
    name: "Mathematical_WWII_notes.txt",
    type: "note",
    size: 48000,
    status: "processing",
    uploadedAt: "2026-08-03T08:00:00.000Z",
  },
];

export const sampleMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Explain Newton's third law of motion in simple terms.",
    timestamp: "2026-08-03T10:12:00.000Z",
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "Newton's third law states that for every action, there is an equal and opposite reaction. When you push a wall, the wall pushes back with the same force in the opposite direction. This principle is why rockets move forward — exhaust gases are pushed backward, and the rocket is pushed forward.",
    timestamp: "2026-08-03T10:12:05.000Z",
    sources: [
      {
        id: "src-1",
        label: "Biology_Chapter_5.pdf",
        type: "pdf",
        snippet: "Chapter 5: Motion & Energy — page 12",
      },
      {
        id: "src-2",
        label: "Handwritten_Notes.jpg",
        type: "image",
        snippet: "Handwritten notes — Laws of Motion section",
      },
    ],
  },
  {
    id: "msg-3",
    role: "user",
    content: "Whst are the key steps in the Krebs cycle?",
    timestamp: "2026-08-03T10:13:00.000Z",
  },
  {
    id: "msg-4",
    role: "assistant",
    content:
      "Based on your uploaded material, the key steps in the Krebs cycle (citric acid cycle) are: 1) Acetyl-CoA combines with oxaloacetate to form citrate, 2) Citrate is converted into isocitrate, 3) Isocitrate is oxidized, releasing CO₂ and producing alpha-ketoglutarate, 4) Alpha-ketoglutarate is oxidized to succinyl-CoA, 5) Succinyl-CoA is converted to succinate, then to fumarate, malate and finally back to oxaloacetate.",
    timestamp: "2026-08-03T10:20:08.000Z",
    sources: [
      {
        id: "src-3",
        label: "Biology_Chapter_5.pdf",
        type: "pdf",
        snippet: "Chapter 5 · Cellular respiration — page 34",
      },
    ],
  },
];

export const version = "0.1.0";