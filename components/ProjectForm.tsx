"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { Project } from "@/lib/types";
import ClayButton from "./ClayButton";
import TechStackPicker from "./TechStackPicker";

const BUCKET = "project-images";

export default function ProjectForm({
  project,
  onSaved,
  onCancel,
}: {
  project: Project | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [demoUrl, setDemoUrl] = useState(project?.demo_url ?? "");
  const [repoUrl, setRepoUrl] = useState(project?.repo_url ?? "");
  const [tags, setTags] = useState<string[]>(project?.tags ?? []);
  const [imageUrl, setImageUrl] = useState(project?.image_url ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(project?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadImageIfNeeded(): Promise<string> {
    if (!imageFile) return imageUrl;

    const ext = imageFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, imageFile, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      const finalImageUrl = await uploadImageIfNeeded();

      const payload = {
        title: title.trim(),
        description: description.trim(),
        image_url: finalImageUrl || null,
        demo_url: demoUrl.trim() || null,
        repo_url: repoUrl.trim() || null,
        tags,
      };

      if (project) {
        const { error: updateError } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", project.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from("projects")
          .insert(payload);
        if (insertError) throw new Error(insertError.message);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border-2 border-line bg-paper p-7"
    >
      <h3 className="font-display text-xl font-black text-ink">
        {project ? "Edit piece" : "Add a new piece"}
      </h3>

      <div>
        <label className="field-label">Cover image</label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden border-2 border-line bg-paper-alt">
            {previewUrl ? (
              <Image src={previewUrl} alt="" fill sizes="128px" className="object-cover" />
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
        <label htmlFor="title" className="field-label">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field-input"
          placeholder="Project name"
        />
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Description
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input resize-none"
          placeholder="What it is, what it does, what you learned building it."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demoUrl" className="field-label">
            Demo link
          </label>
          <input
            id="demoUrl"
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="field-input"
            placeholder="https://…"
          />
        </div>
        <div>
          <label htmlFor="repoUrl" className="field-label">
            Source link (optional)
          </label>
          <input
            id="repoUrl"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="field-input"
            placeholder="https://github.com/…"
          />
        </div>
      </div>

      <div>
        <p className="field-label">Tags</p>
        <TechStackPicker value={tags} onChange={setTags} />
      </div>

      {error && (
        <p className="font-mono text-xs text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <ClayButton type="submit" disabled={uploading}>
          {uploading ? "Saving…" : project ? "Save changes" : "Add piece"}
        </ClayButton>
        <ClayButton type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </ClayButton>
      </div>
    </form>
  );
}
