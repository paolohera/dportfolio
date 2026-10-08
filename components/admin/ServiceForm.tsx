"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Service } from "@/types";
import ClayButton from "@/components/ui/ClayButton";

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((t) => {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    });
  return result;
}

export default function ServiceForm({
  service,
  onSaved,
  onCancel,
}: {
  service: Service;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [number, setNumber] = useState(service.number);
  const [title, setTitle] = useState(service.title);
  const [description, setDescription] = useState(service.description);
  const [tagsText, setTagsText] = useState((service.tags ?? []).join(", "));
  const [published, setPublished] = useState(service.published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("services")
        .update({
          number: number.trim(),
          title: title.trim(),
          description: description.trim(),
          tags: parseTags(tagsText),
          published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", service.id);

      if (updateError) throw new Error(updateError.message);

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const previewTags = parseTags(tagsText);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border-2 border-line bg-paper p-7"
    >
      <h3 className="font-display text-xl font-black text-ink">
        Edit service
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px,1fr]">
        <div>
          <label htmlFor="serviceNumber" className="field-label">
            Number
          </label>
          <input
            id="serviceNumber"
            maxLength={4}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="field-input"
            placeholder="01"
          />
        </div>
        <div>
          <label htmlFor="serviceTitle" className="field-label">
            Title
          </label>
          <input
            id="serviceTitle"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field-input"
            placeholder="Service name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="serviceDescription" className="field-label">
          Description
        </label>
        <textarea
          id="serviceDescription"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input resize-none"
          placeholder="What you offer and who it's for."
        />
      </div>

      <div>
        <label htmlFor="serviceTags" className="field-label">
          Tags (separate with commas)
        </label>
        <input
          id="serviceTags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="field-input"
          placeholder="Next.js, Vue.js, JavaScript"
        />
        {previewTags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {previewTags.map((tag) => (
              <li
                key={tag}
                className="border border-line px-2 py-1 font-mono text-[11px] text-ink"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-3 border-2 border-line px-4 py-3">
        <input
          id="servicePublished"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <label htmlFor="servicePublished" className="text-sm text-ink-soft">
          Show this service on the site
        </label>
      </div>

      {error && (
        <p className="font-mono text-xs text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <ClayButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </ClayButton>
        <ClayButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </ClayButton>
      </div>
    </form>
  );
}