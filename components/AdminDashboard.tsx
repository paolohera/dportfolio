"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { Message, Profile, Project } from "@/lib/types";
import ClayButton from "./ClayButton";
import ProjectForm from "./ProjectForm";
import ProfileForm from "./ProfileForm";

export default function AdminDashboard({
  projects,
  profile,
  onClose,
  onRefresh,
  onRefreshProfile,
  onSignOut,
}: {
  projects: Project[];
  profile: Profile | null;
  onClose: () => void;
  onRefresh: () => void;
  onRefreshProfile: () => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<"projects" | "about" | "messages">(
    "projects"
  );
  const [editing, setEditing] = useState<Project | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  const showForm = isAdding || editing !== null;
  const unreadCount = messages.filter((m) => !m.is_read).length;

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setMessages(data as Message[]);
    setMessagesLoaded(true);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleDelete(project: Project) {
    if (!confirm(`Delete "${project.title}"? This can't be undone.`)) return;
    setDeletingId(project.id);

    if (project.image_url) {
      const path = project.image_url.split("/project-images/")[1];
      if (path) {
        await supabase.storage.from("project-images").remove([path]);
      }
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    setDeletingId(null);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    onRefresh();
  }

  async function toggleRead(msg: Message) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);

    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, is_read: !m.is_read } : m
        )
      );
    }
  }

  async function handleDeleteMessage(msg: Message) {
    if (!confirm(`Delete the message from "${msg.name}"?`)) return;
    setDeletingMessageId(msg.id);

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", msg.id);

    setDeletingMessageId(null);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-clay-bg">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Admin studio
            </p>
            <h2 className="mt-1 font-display text-3xl font-medium text-ink">
              Manage your site.
            </h2>
          </div>
          <div className="flex gap-3">
            <ClayButton variant="ghost" onClick={onClose}>
              Back to site
            </ClayButton>
            <ClayButton variant="ghost" onClick={onSignOut}>
              Log out
            </ClayButton>
          </div>
        </div>

        <div className="mt-8 inline-flex gap-1 rounded-clay-sm bg-clay-bg p-1 shadow-clay-pressed">
          <button
            onClick={() => setTab("projects")}
            className={`rounded-clay-sm px-4 py-2 text-sm font-medium transition-colors ${
              tab === "projects"
                ? "bg-clay-surface text-ink shadow-clay-raised-sm"
                : "text-ink-soft"
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setTab("about")}
            className={`rounded-clay-sm px-4 py-2 text-sm font-medium transition-colors ${
              tab === "about"
                ? "bg-clay-surface text-ink shadow-clay-raised-sm"
                : "text-ink-soft"
            }`}
          >
            About section
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`relative rounded-clay-sm px-4 py-2 text-sm font-medium transition-colors ${
              tab === "messages"
                ? "bg-clay-surface text-ink shadow-clay-raised-sm"
                : "text-ink-soft"
            }`}
          >
            Messages
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warm px-1 font-mono text-[10px] text-clay-surface">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {tab === "projects" && (
          <>
            {showForm ? (
              <div className="mt-8">
                <ProjectForm
                  project={editing}
                  onCancel={() => {
                    setEditing(null);
                    setIsAdding(false);
                  }}
                  onSaved={() => {
                    setEditing(null);
                    setIsAdding(false);
                    onRefresh();
                  }}
                />
              </div>
            ) : (
              <div className="mt-8">
                <ClayButton onClick={() => setIsAdding(true)}>
                  + Add a new piece
                </ClayButton>
              </div>
            )}

            <ul className="mt-10 flex flex-col gap-4">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center gap-4 rounded-clay-sm bg-clay-surface p-4 shadow-clay-raised-sm"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-clay-sm bg-clay-deep">
                    {project.image_url && (
                      <Image
                        src={project.image_url}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-medium text-ink">
                      {project.title}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <ClayButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(project);
                        setIsAdding(false);
                      }}
                    >
                      Edit
                    </ClayButton>
                    <ClayButton
                      size="sm"
                      variant="danger"
                      disabled={deletingId === project.id}
                      onClick={() => handleDelete(project)}
                    >
                      {deletingId === project.id ? "Deleting…" : "Delete"}
                    </ClayButton>
                  </div>
                </li>
              ))}

              {projects.length === 0 && (
                <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-ink-soft/70">
                  No pieces yet — add your first above.
                </p>
              )}
            </ul>
          </>
        )}

        {tab === "about" && (
          <div className="mt-8">
            {!profile ? (
              <p className="font-mono text-xs text-ink-soft">
                Loading profile…
              </p>
            ) : editingProfile ? (
              <ProfileForm
                profile={profile}
                onCancel={() => setEditingProfile(false)}
                onSaved={() => {
                  setEditingProfile(false);
                  onRefreshProfile();
                }}
              />
            ) : (
              <div className="rounded-clay bg-clay-surface p-6 shadow-clay-raised-sm">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-clay-deep">
                    {profile.avatar_url && (
                      <Image
                        src={profile.avatar_url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-medium text-ink">
                      {profile.name}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {profile.bio}
                    </p>
                  </div>
                  <ClayButton size="sm" onClick={() => setEditingProfile(true)}>
                    Edit
                  </ClayButton>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div className="mt-8 flex flex-col gap-4">
            {!messagesLoaded ? (
              <p className="font-mono text-xs text-ink-soft">
                Loading messages…
              </p>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-ink-soft/70">
                No messages yet.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-clay-sm p-5 shadow-clay-raised-sm ${
                    msg.is_read ? "bg-clay-surface" : "bg-clay-surface ring-2 ring-accent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-medium text-ink">
                        {msg.name}
                        {msg.company && (
                          <span className="ml-2 font-mono text-xs font-normal text-ink-soft">
                            {msg.company}
                          </span>
                        )}
                      </p>
                      <a
                        href={`mailto:${msg.email}`}
                        className="font-mono text-xs text-accent underline decoration-clay-line underline-offset-4"
                      >
                        {msg.email}
                      </a>
                    </div>
                    <p className="shrink-0 font-mono text-[11px] text-ink-soft/70">
                      {new Date(msg.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                    {msg.message}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <ClayButton size="sm" variant="ghost" onClick={() => toggleRead(msg)}>
                      {msg.is_read ? "Mark unread" : "Mark read"}
                    </ClayButton>
                    <ClayButton
                      size="sm"
                      variant="danger"
                      disabled={deletingMessageId === msg.id}
                      onClick={() => handleDeleteMessage(msg)}
                    >
                      {deletingMessageId === msg.id ? "Deleting…" : "Delete"}
                    </ClayButton>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}