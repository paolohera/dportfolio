export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  demo_url: string | null;
  repo_url: string | null;
  tags: string[];
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectDraft = Omit<
  Project,
  "id" | "created_at" | "updated_at"
>;