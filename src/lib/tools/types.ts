export type ToolCategoryId =
  | "image"
  | "pdf"
  | "image-documents"
  | "student"
  | "text"
  | "developer"
  | "seo"
  | "calculators"
  | "utilities"
  | "social-color";

export type ToolStatus = "planned" | "available" | "excluded";

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  description: string;
  icon: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: ToolCategoryId;
  keywords: string[];
  status: ToolStatus;
}
