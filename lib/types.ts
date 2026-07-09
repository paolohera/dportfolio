export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  demo_url: string | null;
  repo_url: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectDraft = Omit<
  Project,
  "id" | "created_at" | "updated_at"
>;

export interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  available_for_work: boolean;
  current_focus: string | null;
  tools: string[];
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  updated_at: string;
}

export type ProfileDraft = Omit<Profile, "id" | "updated_at">;