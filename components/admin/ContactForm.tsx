"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ContactAction, ContactContent, ContactContentDraft } from "@/types";
import { CONTACT_DEFAULTS, isSafeContactUrl } from "@/lib/contact/defaults";
import ClayButton from "@/components/ui/ClayButton";

const ACTION_OPTIONS: { value: ContactAction; label: string }[] = [
  { value: "message_form", label: "Open the message form" },
  { value: "email", label: "Send an email (uses the About email)" },
  { value: "link", label: "Open a link" },
];

function toDraft(content: ContactContent | null): ContactContentDraft {
  if (!content) return { ...CONTACT_DEFAULTS };
  return {
    section_label: content.section_label ?? "",
    heading: content.heading,
    description: content.description,
    primary_button_label: content.primary_button_label,
    primary_button_action: content.primary_button_action,
    primary_button_url: content.primary_button_url,
    secondary_button_label: content.secondary_button_label,
    secondary_button_action: content.secondary_button_action,
    secondary_button_url: content.secondary_button_url,
  };
}

export default function ContactForm({
  content,
  onSaved,
  onDirtyChange,
}: {
  content: ContactContent | null;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const saved = toDraft(content);

  const [sectionLabel, setSectionLabel] = useState(saved.section_label);
  const [heading, setHeading] = useState(saved.heading);
  const [description, setDescription] = useState(saved.description);
  const [primaryLabel, setPrimaryLabel] = useState(saved.primary_button_label);
  const [primaryAction, setPrimaryAction] = useState<ContactAction>(
    saved.primary_button_action
  );
  const [primaryUrl, setPrimaryUrl] = useState(saved.primary_button_url ?? "");
  const [secondaryLabel, setSecondaryLabel] = useState(saved.secondary_button_label);
  const [secondaryAction, setSecondaryAction] = useState<ContactAction>(
    saved.secondary_button_action
  );
  const [secondaryUrl, setSecondaryUrl] = useState(saved.secondary_button_url ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty =
    sectionLabel !== saved.section_label ||
    heading !== saved.heading ||
    description !== saved.description ||
    primaryLabel !== saved.primary_button_label ||
    primaryAction !== saved.primary_button_action ||
    primaryUrl !== (saved.primary_button_url ?? "") ||
    secondaryLabel !== saved.secondary_button_label ||
    secondaryAction !== saved.secondary_button_action ||
    secondaryUrl !== (saved.secondary_button_url ?? "");

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Warn before reloading/closing the tab with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function resetToSaved() {
    setSectionLabel(saved.section_label);
    setHeading(saved.heading);
    setDescription(saved.description);
    setPrimaryLabel(saved.primary_button_label);
    setPrimaryAction(saved.primary_button_action);
    setPrimaryUrl(saved.primary_button_url ?? "");
    setSecondaryLabel(saved.secondary_button_label);
    setSecondaryAction(saved.secondary_button_action);
    setSecondaryUrl(saved.secondary_button_url ?? "");
    setError(null);
    setJustSaved(false);
  }

  function validate(): string | null {
    if (!heading.trim()) return "Heading can't be empty.";
    if (!description.trim()) return "Description can't be empty.";
    if (!primaryLabel.trim()) return "Primary button label can't be empty.";
    if (!secondaryLabel.trim()) return "Secondary button label can't be empty.";
    if (primaryAction === "link") {
      if (!primaryUrl.trim()) return "Primary button needs a link.";
      if (!isSafeContactUrl(primaryUrl))
        return "Primary link must start with https://, http://, / or #.";
    }
    if (secondaryAction === "link") {
      if (!secondaryUrl.trim()) return "Secondary button needs a link.";
      if (!isSafeContactUrl(secondaryUrl))
        return "Secondary link must start with https://, http://, / or #.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setJustSaved(false);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      const { data, error: updateError } = await supabase
        .from("contact_content")
        .update({
          section_label: sectionLabel.trim(),
          heading: heading.trim(),
          description: description.trim(),
          primary_button_label: primaryLabel.trim(),
          primary_button_action: primaryAction,
          primary_button_url:
            primaryAction === "link" ? primaryUrl.trim() : null,
          secondary_button_label: secondaryLabel.trim(),
          secondary_button_action: secondaryAction,
          secondary_button_url:
            secondaryAction === "link" ? secondaryUrl.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "main")
        .select("id");

      if (updateError) throw new Error(updateError.message);
      if (!data || data.length === 0) {
        throw new Error(
          "Contact record not found. Run the contact_content SQL in Supabase first."
        );
      }

      setJustSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border-2 border-line bg-paper p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-black text-ink">
          Edit contact section
        </h3>
        {dirty && (
          <span className="font-mono text-[11px] text-accent">
            Unsaved changes
          </span>
        )}
      </div>

      <div>
        <label htmlFor="contactLabel" className="field-label">
          Section label (optional)
        </label>
        <input
          id="contactLabel"
          value={sectionLabel}
          onChange={(e) => setSectionLabel(e.target.value)}
          className="field-input"
          placeholder="05 / contact"
        />
      </div>

      <div>
        <label htmlFor="contactHeading" className="field-label">
          Heading
        </label>
        <input
          id="contactHeading"
          required
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="contactDescription" className="field-label">
          Description
        </label>
        <textarea
          id="contactDescription"
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 border-t-2 border-line pt-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="field-label">Primary button</p>
          <div>
            <label htmlFor="primaryLabel" className="field-label">
              Label
            </label>
            <input
              id="primaryLabel"
              required
              value={primaryLabel}
              onChange={(e) => setPrimaryLabel(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="primaryAction" className="field-label">
              Action
            </label>
            <select
              id="primaryAction"
              value={primaryAction}
              onChange={(e) => setPrimaryAction(e.target.value as ContactAction)}
              className="field-input"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {primaryAction === "link" && (
            <div>
              <label htmlFor="primaryUrl" className="field-label">
                Link
              </label>
              <input
                id="primaryUrl"
                value={primaryUrl}
                onChange={(e) => setPrimaryUrl(e.target.value)}
                className="field-input"
                placeholder="https://…"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="field-label">Secondary button</p>
          <div>
            <label htmlFor="secondaryLabel" className="field-label">
              Label
            </label>
            <input
              id="secondaryLabel"
              required
              value={secondaryLabel}
              onChange={(e) => setSecondaryLabel(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="secondaryAction" className="field-label">
              Action
            </label>
            <select
              id="secondaryAction"
              value={secondaryAction}
              onChange={(e) => setSecondaryAction(e.target.value as ContactAction)}
              className="field-input"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {secondaryAction === "link" && (
            <div>
              <label htmlFor="secondaryUrl" className="field-label">
                Link
              </label>
              <input
                id="secondaryUrl"
                value={secondaryUrl}
                onChange={(e) => setSecondaryUrl(e.target.value)}
                className="field-input"
                placeholder="https://…"
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        The email address itself is edited in the About section.
      </p>

      {error && (
        <p className="font-mono text-xs text-accent" role="alert">
          {error}
        </p>
      )}
      {justSaved && !dirty && !error && (
        <p className="font-mono text-xs text-good" role="status">
          Saved. The public site is updated.
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <ClayButton type="submit" disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </ClayButton>
        <ClayButton
          type="button"
          variant="ghost"
          disabled={saving || !dirty}
          onClick={resetToSaved}
        >
          Cancel
        </ClayButton>
      </div>
    </form>
  );
}