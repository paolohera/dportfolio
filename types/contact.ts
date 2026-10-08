export type ContactAction = "message_form" | "email" | "link";

export interface ContactContent {
  id: string;
  section_label: string;
  heading: string;
  description: string;
  primary_button_label: string;
  primary_button_action: ContactAction;
  primary_button_url: string | null;
  secondary_button_label: string;
  secondary_button_action: ContactAction;
  secondary_button_url: string | null;
  updated_at: string;
}

export type ContactContentDraft = Omit<ContactContent, "id" | "updated_at">;