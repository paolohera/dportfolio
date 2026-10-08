import type { ContactContentDraft } from "@/types";

// Used only as a fallback while the database row loads (or if it is missing).
// The database row is the source of truth.
export const CONTACT_DEFAULTS: ContactContentDraft = {
  section_label: "05 / contact",
  heading: "Got something you need built, fixed, or set up?",
  description:
    "From websites and custom web applications to PC formatting, Windows setup, and Microsoft 365, I provide practical solutions tailored to what you actually need. Tell me what you're working on or what problem you're running into, and let's figure out the best way to get it done.",
  primary_button_label: "Let's talk",
  primary_button_action: "message_form",
  primary_button_url: null,
  secondary_button_label: "Email directly",
  secondary_button_action: "email",
  secondary_button_url: null,
};

// Only allow http(s) links, same-site paths, and #anchors (blocks javascript: etc.)
export function isSafeContactUrl(url: string): boolean {
  return /^(https?:\/\/|\/(?!\/)|#)/i.test(url.trim());
}