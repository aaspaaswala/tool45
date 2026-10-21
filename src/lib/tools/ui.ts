import {
  Binary,
  Braces,
  Cake,
  Calculator,
  CaseSensitive,
  Clock3,
  Code2,
  Crop,
  Droplets,
  Eraser,
  FileText,
  Files,
  FlipHorizontal,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  Link2,
  Maximize2,
  Minimize2,
  Palette,
  Pipette,
  QrCode,
  Repeat,
  RotateCw,
  Scissors,
  Search,
  Smile,
  Stamp,
  Star,
  Type,
  UserSquare,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { ToolCategoryId, ToolDefinition } from "@/lib/tools/types";

export type Tone =
  | "blue"
  | "red"
  | "violet"
  | "teal"
  | "orange"
  | "green"
  | "pink"
  | "amber"
  | "indigo"
  | "cyan";

interface CategoryPresentation {
  icon: LucideIcon;
  tone: Tone;
  shortName: string;
}

export const categoryPresentation: Record<ToolCategoryId, CategoryPresentation> = {
  image: { icon: ImageIcon, tone: "blue", shortName: "Image" },
  pdf: { icon: FileText, tone: "red", shortName: "PDF" },
  "image-documents": { icon: Files, tone: "indigo", shortName: "Image & Docs" },
  student: { icon: GraduationCap, tone: "amber", shortName: "Student" },
  text: { icon: Type, tone: "violet", shortName: "Text" },
  developer: { icon: Code2, tone: "teal", shortName: "Developer" },
  seo: { icon: Search, tone: "green", shortName: "SEO" },
  calculators: { icon: Calculator, tone: "orange", shortName: "Math" },
  utilities: { icon: Clock3, tone: "cyan", shortName: "Date & Time" },
  "social-color": { icon: Palette, tone: "pink", shortName: "Social Tools" },
};

const keywordIcons: Array<[RegExp, LucideIcon]> = [
  [/resiz/, Maximize2],
  [/compress|reducer/, Minimize2],
  [/crop/, Crop],
  [/background|eraser|remove/, Eraser],
  [/passport|id-photo|signature/, UserSquare],
  [/base64|binary/, Binary],
  [/color|palette/, Pipette],
  [/qr/, QrCode],
  [/rotat/, RotateCw],
  [/flip/, FlipHorizontal],
  [/blur/, Droplets],
  [/watermark/, Stamp],
  [/meme/, Smile],
  [/favicon/, Star],
  [/json/, Braces],
  [/url/, Link2],
  [/count/, Hash],
  [/case/, CaseSensitive],
  [/split|extract/, Scissors],
  [/(^|-)age(-|$)/, Cake],
  [/pdf/, FileText],
  [/convert|jpg|png|webp|avif|heic|tiff|svg|ico/, Repeat],
  [/calculator/, Calculator],
];

export function getToolIcon(tool: ToolDefinition): LucideIcon {
  const match = keywordIcons.find(([pattern]) => pattern.test(tool.id));
  return match?.[1] ?? categoryPresentation[tool.categoryId]?.icon ?? Wrench;
}

export function getToolTone(tool: ToolDefinition): Tone {
  return categoryPresentation[tool.categoryId]?.tone ?? "blue";
}
