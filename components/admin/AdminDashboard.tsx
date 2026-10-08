"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import type { ContactContent, Message, Profile, Project, Service } from "@/types";
import ClayButton from "@/components/ui/ClayButton";
import ProjectForm from "@/components/admin/ProjectForm";
import ProfileForm from "@/components/admin/ProfileForm";
import ServiceForm from "@/components/admin/ServiceForm";
import ContactForm from "@/components/admin/ContactForm";
import ConfirmModal from "@/components/ui/ConfirmModal";

type MessageFilter = "all" | "unread" | "read";
type Tab = "projects" | "about" | "services" | "contact" | "messages";

export default function AdminDashboard({
  projects,
  profile,
  services,
  contactContent,
  onClose,
  onRefresh,
  onRefreshProfile,
  onRefreshServices,
  onRefreshContact,
  onSignOut,
}: {
  projects: Project[];
  profile: Profile | null;
  services: Service[];
  contactContent: ContactContent | null;
  onClose: () => void;
  onRefresh: () => void;
  onRefreshProfile: () => void;
  onRefreshServices: () => void;
  onRefreshContact: () => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("projects");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set()
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [reorderingServiceId, setReorderingServiceId] = useState<string | null>(
    null
  );
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(
    null
  );

  const [contactDirty, setContactDirty] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null
  );

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message?: string;
    confirmLabel?: string;
    variant?: "default" | "danger";
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runConfirmed(action: () => Promise<void>) {
    setConfirmBusy(true);
    try {
      await action();
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  }

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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [projects, projectSearch]);

  const filteredMessages = useMemo(() => {
    let list = messages;
    if (messageFilter === "unread") list = list.filter((m) => !m.is_read);
    if (messageFilter === "read") list = list.filter((m) => m.is_read);
    const q = messageSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.company ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, messageFilter, messageSearch]);

  function toggleProjectSelected(id: string) {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllProjects() {
    setSelectedProjectIds((prev) =>
      prev.size === filteredProjects.length
        ? new Set()
        : new Set(filteredProjects.map((p) => p.id))
    );
  }

  function toggleMessageSelected(id: string) {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllMessages() {
    setSelectedMessageIds((prev) =>
      prev.size === filteredMessages.length
        ? new Set()
        : new Set(filteredMessages.map((m) => m.id))
    );
  }

  function requestDeleteProject(project: Project) {
    setConfirmDialog({
      title: `Delete "${project.title}"?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () =>
        runConfirmed(async () => {
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
            setErrorMessage(`Couldn't delete: ${error.message}`);
            return;
          }
          onRefresh();
        }),
    });
  }

  function requestBulkDeleteProjects() {
    const ids = Array.from(selectedProjectIds);
    if (ids.length === 0) return;

    setConfirmDialog({
      title: `Delete ${ids.length} project${ids.length > 1 ? "s" : ""}?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () =>
        runConfirmed(async () => {
          setBulkBusy(true);
          const { error } = await supabase
            .from("projects")
            .delete()
            .in("id", ids);
          setBulkBusy(false);

          if (error) {
            setErrorMessage(`Couldn't delete: ${error.message}`);
            return;
          }
          setSelectedProjectIds(new Set());
          onRefresh();
        }),
    });
  }

  async function moveProject(project: Project, direction: "up" | "down") {
    const ordered = [...projects].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((p) => p.id === project.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;

    const other = ordered[swapIdx];
    setReorderingId(project.id);

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase
        .from("projects")
        .update({ sort_order: other.sort_order })
        .eq("id", project.id),
      supabase
        .from("projects")
        .update({ sort_order: project.sort_order })
        .eq("id", other.id),
    ]);

    setReorderingId(null);
    if (e1 || e2) {
      setErrorMessage("Couldn't reorder — try again.");
      return;
    }
    onRefresh();
  }

  async function toggleFeatured(project: Project) {
    setPinningId(project.id);
    const { error } = await supabase
      .from("projects")
      .update({ is_featured: !project.is_featured })
      .eq("id", project.id);
    setPinningId(null);

    if (error) {
      setErrorMessage(`Couldn't update: ${error.message}`);
      return;
    }
    onRefresh();
  }

  async function moveService(service: Service, direction: "up" | "down") {
    const ordered = [...services].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((s) => s.id === service.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;

    const other = ordered[swapIdx];
    setReorderingServiceId(service.id);

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase
        .from("services")
        .update({ sort_order: other.sort_order })
        .eq("id", service.id),
      supabase
        .from("services")
        .update({ sort_order: service.sort_order })
        .eq("id", other.id),
    ]);

    setReorderingServiceId(null);
    if (e1 || e2) {
      setErrorMessage("Couldn't reorder — try again.");
      return;
    }
    onRefreshServices();
  }

  async function toggleServicePublished(service: Service) {
    setTogglingServiceId(service.id);
    const { error } = await supabase
      .from("services")
      .update({ published: !service.published })
      .eq("id", service.id);
    setTogglingServiceId(null);

    if (error) {
      setErrorMessage(`Couldn't update: ${error.message}`);
      return;
    }
    onRefreshServices();
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

  async function handleBulkMarkRead(read: boolean) {
    const ids = Array.from(selectedMessageIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    const { error } = await supabase
      .from("messages")
      .update({ is_read: read })
      .in("id", ids);
    setBulkBusy(false);

    if (error) {
      setErrorMessage(`Couldn't update: ${error.message}`);
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, is_read: read } : m))
    );
  }

  function requestBulkDeleteMessages() {
    const ids = Array.from(selectedMessageIds);
    if (ids.length === 0) return;

    setConfirmDialog({
      title: `Delete ${ids.length} message${ids.length > 1 ? "s" : ""}?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () =>
        runConfirmed(async () => {
          setBulkBusy(true);
          const { error } = await supabase
            .from("messages")
            .delete()
            .in("id", ids);
          setBulkBusy(false);

          if (error) {
            setErrorMessage(`Couldn't delete: ${error.message}`);
            return;
          }
          setSelectedMessageIds(new Set());
          setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
        }),
    });
  }

  function requestDeleteMessage(msg: Message) {
    setConfirmDialog({
      title: `Delete the message from "${msg.name}"?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: () =>
        runConfirmed(async () => {
          setDeletingMessageId(msg.id);

          const { error } = await supabase
            .from("messages")
            .delete()
            .eq("id", msg.id);

          setDeletingMessageId(null);
          if (error) {
            setErrorMessage(`Couldn't delete: ${error.message}`);
            return;
          }
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        }),
    });
  }

  function requestSignOut() {
    setConfirmDialog({
      title: "Log out?",
      message: "You'll need to sign back in to manage the site.",
      confirmLabel: "Log out",
      variant: "danger",
      onConfirm: () =>
        runConfirmed(async () => {
          onSignOut();
        }),
    });
  }

  function goTo(next: Tab) {
    if (tab === "contact" && next !== "contact" && contactDirty) {
      setMobileNavOpen(false);
      setConfirmDialog({
        title: "Discard unsaved changes?",
        message: "Your Contact edits haven't been saved.",
        confirmLabel: "Discard",
        variant: "danger",
        onConfirm: () =>
          runConfirmed(async () => {
            setContactDirty(false);
            setTab(next);
          }),
      });
      return;
    }
    setTab(next);
    setMobileNavOpen(false);
  }

  const navItems: { id: Tab; label: string; count?: number; badge?: number }[] = [
    { id: "projects", label: "Projects", count: projects.length },
    { id: "about", label: "About section" },
    { id: "services", label: "Services", count: services.length },
    { id: "contact", label: "Contact" },
    { id: "messages", label: "Messages", count: messages.length, badge: unreadCount },
  ];

  const activeLabel = navItems.find((n) => n.id === tab)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex bg-paper">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r-2 border-line md:flex">
        <div className="border-b-2 border-line px-6 py-6">
          <p className="font-mono text-[11px] text-ink-soft">Admin studio</p>
          <h2 className="mt-1 font-display text-2xl font-black leading-tight text-ink">
            Manage your site.
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => goTo(item.id)}
              className={`flex w-full items-center justify-between gap-2 border-l-4 px-5 py-3 text-left text-sm transition-colors ${
                tab === item.id
                  ? "border-accent bg-accent/5 font-semibold text-ink"
                  : "border-transparent text-ink-soft hover:border-line hover:text-ink"
              }`}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-mono text-[10px] text-paper">
                    {item.badge}
                  </span>
                )}
              </span>
              {item.count !== undefined && (
                <span className="font-mono text-[11px] text-ink-soft/70">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t-2 border-line px-4 py-4">
          <div className="flex flex-col gap-2">
            <ClayButton variant="ghost" size="sm" onClick={onClose}>
              Back to site
            </ClayButton>
            <ClayButton variant="ghost" size="sm" onClick={requestSignOut}>
              Log out
            </ClayButton>
          </div>
        </div>
      </aside>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-10 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper">
            <div className="flex items-center justify-between border-b-2 border-line px-6 py-5">
              <div>
                <p className="font-mono text-[11px] text-ink-soft">
                  Admin studio
                </p>
                <h2 className="mt-1 font-display text-xl font-black text-ink">
                  Manage your site.
                </h2>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="border border-line/40 px-2 py-1 font-mono text-xs text-ink-soft hover:border-ink hover:text-ink"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`flex w-full items-center justify-between gap-2 border-l-4 px-5 py-3 text-left text-sm transition-colors ${
                    tab === item.id
                      ? "border-accent bg-accent/5 font-semibold text-ink"
                      : "border-transparent text-ink-soft hover:border-line hover:text-ink"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-mono text-[10px] text-paper">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {item.count !== undefined && (
                    <span className="font-mono text-[11px] text-ink-soft/70">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="border-t-2 border-line px-4 py-4">
              <div className="flex flex-col gap-2">
                <ClayButton variant="ghost" size="sm" onClick={onClose}>
                  Back to site
                </ClayButton>
                <ClayButton variant="ghost" size="sm" onClick={requestSignOut}>
                  Log out
                </ClayButton>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b-2 border-line px-5 py-4 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex items-center gap-2 border border-line/40 px-3 py-1.5 font-mono text-xs text-ink hover:border-ink"
          >
            ☰ Menu
          </button>
          <p className="font-mono text-xs text-ink-soft">{activeLabel}</p>
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 py-10 md:px-10">
          {tab === "projects" && (
            <>
              <div className="hidden items-baseline justify-between md:flex">
                <h3 className="font-display text-xl font-black text-ink">
                  Projects
                </h3>
              </div>

              {showForm ? (
                <div className="mt-6">
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
                <>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <ClayButton size="sm" onClick={() => setIsAdding(true)}>
                      + Add a new piece
                    </ClayButton>
                    <input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects…"
                      className="field-input max-w-xs flex-1"
                    />
                  </div>

                  {selectedProjectIds.size > 0 && (
                    <div className="mt-4 flex items-center gap-3 border-2 border-accent bg-accent/5 px-4 py-2.5 font-mono text-xs text-ink">
                      <span>{selectedProjectIds.size} selected</span>
                      <button
                        onClick={requestBulkDeleteProjects}
                        disabled={bulkBusy}
                        className="border border-accent px-2.5 py-1 text-accent hover:bg-accent hover:text-paper disabled:opacity-50"
                      >
                        Delete selected
                      </button>
                      <button
                        onClick={() => setSelectedProjectIds(new Set())}
                        className="text-ink-soft hover:text-ink"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <div className="mt-4 overflow-x-auto border-2 border-line">
                    <table className="w-full min-w-[760px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b-2 border-line bg-paper-alt font-mono text-[11px] text-ink-soft">
                          <th className="w-10 px-3 py-2.5 text-left">
                            <input
                              type="checkbox"
                              checked={
                                filteredProjects.length > 0 &&
                                selectedProjectIds.size === filteredProjects.length
                              }
                              onChange={toggleAllProjects}
                              className="h-4 w-4 accent-accent"
                            />
                          </th>
                          <th className="w-16 px-3 py-2.5 text-left">Cover</th>
                          <th className="px-3 py-2.5 text-left">Title</th>
                          <th className="px-3 py-2.5 text-left">Tags</th>
                          <th className="w-16 px-3 py-2.5 text-left">Featured</th>
                          <th className="w-24 px-3 py-2.5 text-left">Order</th>
                          <th className="w-40 px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <tr
                            key={project.id}
                            className="border-b border-line/20 last:border-b-0 hover:bg-paper-alt/60"
                          >
                            <td className="px-3 py-2.5 align-top">
                              <input
                                type="checkbox"
                                checked={selectedProjectIds.has(project.id)}
                                onChange={() => toggleProjectSelected(project.id)}
                                className="h-4 w-4 accent-accent"
                              />
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div className="relative h-10 w-14 shrink-0 overflow-hidden border border-line/30 bg-paper-alt">
                                {project.image_url && (
                                  <Image
                                    src={project.image_url}
                                    alt=""
                                    fill
                                    sizes="56px"
                                    className="object-cover"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="max-w-xs px-3 py-2.5 align-top">
                              <p className="truncate font-medium text-ink">
                                {project.title}
                              </p>
                              <p className="truncate text-xs text-ink-soft">
                                {project.description}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="max-w-[160px] truncate font-mono text-xs text-ink-soft">
                                {project.tags?.length ? project.tags.join(", ") : "—"}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <button
                                onClick={() => toggleFeatured(project)}
                                disabled={pinningId === project.id}
                                aria-label={
                                  project.is_featured
                                    ? "Unpin from carousel"
                                    : "Pin to carousel"
                                }
                                title={
                                  project.is_featured
                                    ? "Unpin from carousel"
                                    : "Pin to carousel"
                                }
                                className={`border px-2 py-1 text-sm disabled:opacity-40 ${
                                  project.is_featured
                                    ? "border-accent bg-accent text-paper"
                                    : "border-line/30 text-ink-soft hover:border-ink hover:text-ink"
                                }`}
                              >
                                {project.is_featured ? "★" : "☆"}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div className="flex items-center gap-1 font-mono text-xs">
                                <button
                                  onClick={() => moveProject(project, "up")}
                                  disabled={reorderingId !== null}
                                  aria-label="Move up"
                                  className="border border-line/30 px-1.5 py-0.5 hover:border-ink disabled:opacity-40"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => moveProject(project, "down")}
                                  disabled={reorderingId !== null}
                                  aria-label="Move down"
                                  className="border border-line/30 px-1.5 py-0.5 hover:border-ink disabled:opacity-40"
                                >
                                  ↓
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditing(project);
                                    setIsAdding(false);
                                  }}
                                  className="border border-line/40 px-3 py-1 text-xs font-medium text-ink hover:border-ink"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => requestDeleteProject(project)}
                                  disabled={deletingId === project.id}
                                  className="border border-accent/60 px-3 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-paper disabled:opacity-50"
                                >
                                  {deletingId === project.id ? "…" : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredProjects.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-10 text-center font-mono text-xs text-ink-soft/70"
                            >
                              {projects.length === 0
                                ? "No pieces yet — add your first above."
                                : "No projects match your search."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "about" && (
            <div>
              <h3 className="hidden font-display text-xl font-black text-ink md:block">
                About section
              </h3>
              <div className="mt-6">
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
                  <div className="border-2 border-line bg-paper p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-line bg-paper-alt">
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
                        <p className="font-display text-lg font-black text-ink">
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
            </div>
          )}

          {tab === "services" && (
            <div>
              <h3 className="hidden font-display text-xl font-black text-ink md:block">
                Services
              </h3>

              {editingService ? (
                <div className="mt-6">
                  <ServiceForm
                    key={editingService.id}
                    service={editingService}
                    onCancel={() => setEditingService(null)}
                    onSaved={() => {
                      setEditingService(null);
                      onRefreshServices();
                    }}
                  />
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto border-2 border-line">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-line bg-paper-alt font-mono text-[11px] text-ink-soft">
                        <th className="w-14 px-3 py-2.5 text-left">No.</th>
                        <th className="px-3 py-2.5 text-left">Title</th>
                        <th className="px-3 py-2.5 text-left">Tags</th>
                        <th className="w-20 px-3 py-2.5 text-left">Visible</th>
                        <th className="w-24 px-3 py-2.5 text-left">Order</th>
                        <th className="w-24 px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr
                          key={service.id}
                          className="border-b border-line/20 last:border-b-0 hover:bg-paper-alt/60"
                        >
                          <td className="px-3 py-2.5 align-top font-mono text-xs text-ink-soft">
                            {service.number || "—"}
                          </td>
                          <td className="max-w-xs px-3 py-2.5 align-top">
                            <p className="truncate font-medium text-ink">
                              {service.title}
                            </p>
                            <p className="truncate text-xs text-ink-soft">
                              {service.description}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <p className="max-w-[200px] truncate font-mono text-xs text-ink-soft">
                              {service.tags?.length
                                ? service.tags.join(", ")
                                : "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <button
                              onClick={() => toggleServicePublished(service)}
                              disabled={togglingServiceId === service.id}
                              aria-label={
                                service.published
                                  ? "Hide from site"
                                  : "Show on site"
                              }
                              title={
                                service.published
                                  ? "Hide from site"
                                  : "Show on site"
                              }
                              className={`border px-2 py-1 font-mono text-[11px] disabled:opacity-40 ${
                                service.published
                                  ? "border-accent bg-accent text-paper"
                                  : "border-line/30 text-ink-soft hover:border-ink hover:text-ink"
                              }`}
                            >
                              {service.published ? "Live" : "Hidden"}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <button
                                onClick={() => moveService(service, "up")}
                                disabled={reorderingServiceId !== null}
                                aria-label="Move up"
                                className="border border-line/30 px-1.5 py-0.5 hover:border-ink disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveService(service, "down")}
                                disabled={reorderingServiceId !== null}
                                aria-label="Move down"
                                className="border border-line/30 px-1.5 py-0.5 hover:border-ink disabled:opacity-40"
                              >
                                ↓
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <div className="flex justify-end">
                              <button
                                onClick={() => setEditingService(service)}
                                className="border border-line/40 px-3 py-1 text-xs font-medium text-ink hover:border-ink"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {services.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center font-mono text-xs text-ink-soft/70"
                          >
                            No services found — run the services SQL in
                            Supabase first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "contact" && (
            <div>
              <h3 className="hidden font-display text-xl font-black text-ink md:block">
                Contact
              </h3>
              <div className="mt-6">
                <ContactForm
                  key={contactContent ? "loaded" : "default"}
                  content={contactContent}
                  onDirtyChange={setContactDirty}
                  onSaved={onRefreshContact}
                />
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div>
              <h3 className="hidden font-display text-xl font-black text-ink md:block">
                Messages
              </h3>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex border-2 border-line font-mono text-xs">
                  {(["all", "unread", "read"] as MessageFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setMessageFilter(f)}
                      className={`px-3 py-1.5 capitalize ${
                        messageFilter === f
                          ? "bg-ink text-paper"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="field-input max-w-xs flex-1"
                />
              </div>

              {selectedMessageIds.size > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-2 border-accent bg-accent/5 px-4 py-2.5 font-mono text-xs text-ink">
                  <span>{selectedMessageIds.size} selected</span>
                  <button
                    onClick={() => handleBulkMarkRead(true)}
                    disabled={bulkBusy}
                    className="border border-line/40 px-2.5 py-1 hover:border-ink disabled:opacity-50"
                  >
                    Mark read
                  </button>
                  <button
                    onClick={() => handleBulkMarkRead(false)}
                    disabled={bulkBusy}
                    className="border border-line/40 px-2.5 py-1 hover:border-ink disabled:opacity-50"
                  >
                    Mark unread
                  </button>
                  <button
                    onClick={requestBulkDeleteMessages}
                    disabled={bulkBusy}
                    className="border border-accent px-2.5 py-1 text-accent hover:bg-accent hover:text-paper disabled:opacity-50"
                  >
                    Delete selected
                  </button>
                  <button
                    onClick={() => setSelectedMessageIds(new Set())}
                    className="text-ink-soft hover:text-ink"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="mt-4 border-2 border-line">
                {!messagesLoaded ? (
                  <p className="p-6 font-mono text-xs text-ink-soft">
                    Loading messages…
                  </p>
                ) : filteredMessages.length === 0 ? (
                  <p className="py-10 text-center font-mono text-xs text-ink-soft/70">
                    {messages.length === 0
                      ? "No messages yet."
                      : "No messages match this filter."}
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 border-b-2 border-line bg-paper-alt px-4 py-2 font-mono text-[11px] text-ink-soft">
                      <input
                        type="checkbox"
                        checked={
                          filteredMessages.length > 0 &&
                          selectedMessageIds.size === filteredMessages.length
                        }
                        onChange={toggleAllMessages}
                        className="h-4 w-4 accent-accent"
                      />
                      <span>Select all</span>
                    </div>
                    {filteredMessages.map((msg) => {
                      const expanded = expandedMessageId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          className={`border-b border-line/20 last:border-b-0 ${
                            !msg.is_read ? "bg-accent/[0.04]" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 px-4 py-3.5">
                            <input
                              type="checkbox"
                              checked={selectedMessageIds.has(msg.id)}
                              onChange={() => toggleMessageSelected(msg.id)}
                              className="mt-1 h-4 w-4 shrink-0 accent-accent"
                            />
                            <button
                              className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left"
                              onClick={() =>
                                setExpandedMessageId(expanded ? null : msg.id)
                              }
                            >
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-sm ${
                                    !msg.is_read ? "font-semibold text-ink" : "font-medium text-ink"
                                  }`}
                                >
                                  {msg.name}
                                  {msg.company && (
                                    <span className="ml-2 font-mono text-xs font-normal text-ink-soft">
                                      {msg.company}
                                    </span>
                                  )}
                                </p>
                                <p className="truncate font-mono text-xs text-ink-soft">
                                  {msg.email}
                                </p>
                                {!expanded && (
                                  <p className="mt-1 truncate text-xs text-ink-soft/80">
                                    {msg.message}
                                  </p>
                                )}
                              </div>
                              <p className="shrink-0 font-mono text-[11px] text-ink-soft/70">
                                {new Date(msg.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </button>
                          </div>

                          {expanded && (
                            <div className="px-4 pb-4 pl-11">
                              <p className="whitespace-pre-wrap border-2 border-line/20 bg-paper-alt/60 p-4 text-sm leading-relaxed text-ink-soft">
                                {msg.message}
                              </p>
                              <div className="mt-3 flex gap-2">
                                <ClayButton
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleRead(msg)}
                                >
                                  {msg.is_read ? "Mark unread" : "Mark read"}
                                </ClayButton>
                                <ClayButton
                                  size="sm"
                                  variant="danger"
                                  disabled={deletingMessageId === msg.id}
                                  onClick={() => requestDeleteMessage(msg)}
                                >
                                  {deletingMessageId === msg.id ? "Deleting…" : "Delete"}
                                </ClayButton>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        busy={confirmBusy}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => {
          if (!confirmBusy) setConfirmDialog(null);
        }}
      />

      <ConfirmModal
        open={errorMessage !== null}
        title="Something went wrong"
        message={errorMessage ?? undefined}
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  );
}