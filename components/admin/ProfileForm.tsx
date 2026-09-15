"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import ClayButton from "@/components/ui/ClayButton";
import TechStackPicker from "@/components/skills/TechStackPicker";

const BUCKET = "profile-images";

export default function ProfileForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: Profile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [availableForWork, setAvailableForWork] = useState(
    profile.available_for_work
  );
  const [currentFocus, setCurrentFocus] = useState(profile.current_focus ?? "");
  const [tools, setTools] = useState<string[]>(profile.tools ?? []);
  const [email, setEmail] = useState(profile.email ?? "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [personaName, setPersonaName] = useState(
    profile.github_persona_name ?? ""
  );
  const [personaPronouns, setPersonaPronouns] = useState(
    profile.github_persona_pronouns ?? ""
  );
  const [personaStatus, setPersonaStatus] = useState(
    profile.github_persona_status ?? ""
  );
  const [personaAvatarUrl, setPersonaAvatarUrl] = useState(
    profile.github_persona_avatar_url ?? ""
  );
  const [personaAvatarFile, setPersonaAvatarFile] = useState<File | null>(
    null
  );
  const [personaPreviewUrl, setPersonaPreviewUrl] = useState(
    profile.github_persona_avatar_url ?? ""
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handlePersonaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPersonaAvatarFile(file);
    setPersonaPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadAvatarIfNeeded(): Promise<string> {
    if (!avatarFile) return avatarUrl;

    const ext = avatarFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, avatarFile, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadPersonaAvatarIfNeeded(): Promise<string> {
    if (!personaAvatarFile) return personaAvatarUrl;

    const ext = personaAvatarFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, personaAvatarFile, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const finalAvatarUrl = await uploadAvatarIfNeeded();
      const finalPersonaAvatarUrl = await uploadPersonaAvatarIfNeeded();

      const { error: updateError } = await supabase
        .from("profile")
        .update({
          name: name.trim(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl || null,
          available_for_work: availableForWork,
          current_focus: currentFocus.trim() || null,
          tools,
          email: email.trim() || null,
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          github_persona_name: personaName.trim() || null,
          github_persona_pronouns: personaPronouns.trim() || null,
          github_persona_status: personaStatus.trim() || null,
          github_persona_avatar_url: finalPersonaAvatarUrl || null,
        })
        .eq("id", profile.id);

      if (updateError) throw new Error(updateError.message);

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
      <h3 className="font-display text-xl font-black text-ink">
        Edit about section
      </h3>

      <div>
        <label className="field-label">Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden border-2 border-line bg-paper-alt">
            {previewUrl ? (
              <Image src={previewUrl} alt="" fill sizes="80px" className="object-cover" />
            ) : null}
          </div>
          <label className="brutal-press cursor-pointer border-2 border-line bg-paper px-4 py-2 text-sm font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper">
            Choose file
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="bio" className="field-label">
          Short intro
        </label>
        <textarea
          id="bio"
          required
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="field-input resize-none"
          placeholder="A sentence or two on who you are and what you build."
        />
      </div>

      <div className="flex items-center gap-3 border-2 border-line px-4 py-3">
        <input
          id="available"
          type="checkbox"
          checked={availableForWork}
          onChange={(e) => setAvailableForWork(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        <label htmlFor="available" className="text-sm text-ink-soft">
          Show as &ldquo;Available to work&rdquo;
        </label>
      </div>

      <div>
        <label htmlFor="currentFocus" className="field-label">
          Currently working on (optional)
        </label>
        <input
          id="currentFocus"
          value={currentFocus}
          onChange={(e) => setCurrentFocus(e.target.value)}
          className="field-input"
          placeholder="e.g. Building a Next.js SaaS starter"
        />
      </div>

      <div>
        <p className="field-label">Tools / skills</p>
        <TechStackPicker value={tools} onChange={setTools} />
      </div>

      <div className="border-t-2 border-line pt-5">
        <p className="field-label">GitHub activity card</p>
        <p className="mb-3 -mt-1 text-xs text-ink-soft">
          The persona shown beside your contribution calendar.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="personaName" className="field-label">
              Display name
            </label>
            <input
              id="personaName"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              className="field-input"
              placeholder="e.g. LazyDev"
            />
          </div>
          <div>
            <label htmlFor="personaPronouns" className="field-label">
              Pronouns (optional)
            </label>
            <input
              id="personaPronouns"
              value={personaPronouns}
              onChange={(e) => setPersonaPronouns(e.target.value)}
              className="field-input"
              placeholder="e.g. he/him"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="personaStatus" className="field-label">
              Status line (optional)
            </label>
            <input
              id="personaStatus"
              value={personaStatus}
              onChange={(e) => setPersonaStatus(e.target.value)}
              className="field-input"
              placeholder="A short one-liner"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Avatar (optional)</label>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-line bg-paper-alt">
                {personaPreviewUrl ? (
                  <Image
                    src={personaPreviewUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <label className="brutal-press cursor-pointer border-2 border-line bg-paper px-4 py-2 text-sm font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePersonaFileChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="githubUrl" className="field-label">
            GitHub URL
          </label>
          <input
            id="githubUrl"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="linkedinUrl" className="field-label">
            LinkedIn URL
          </label>
          <input
            id="linkedinUrl"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      {error && (
        <p className="font-mono text-xs text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <ClayButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save about section"}
        </ClayButton>
        <ClayButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </ClayButton>
      </div>
    </form>
  );
}