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
  github_persona_name: string | null;
  github_persona_pronouns: string | null;
  github_persona_status: string | null;
  github_persona_avatar_url: string | null;
  updated_at: string;
}

export type ProfileDraft = Omit<Profile, "id" | "updated_at">;