"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ChatAdminApi } from "@/components/admin/chat/useChatAdmin";
import ClayButton from "@/components/ui/ClayButton";
import TypingIndicator from "@/components/chat/TypingIndicator";

type Filter = "all" | "unread" | "open" | "closed";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatInbox({
  chat,
  active,
}: {
  chat: ChatAdminApi;
  /** True while this inbox is actually on screen */
  active: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { conversations, selectedId, messages } = chat;
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "unread" && c.admin_unread_count === 0) return false;
      if (filter === "open" && c.status !== "open") return false;
      if (filter === "closed" && c.status !== "closed") return false;
      if (!q) return true;
      return (
        c.visitor_name.toLowerCase().includes(q) ||
        (c.visitor_email ?? "").toLowerCase().includes(q) ||
        c.last_message_preview.toLowerCase().includes(q)
      );
    });
  }, [conversations, filter, search]);

  // Read state follows what the admin is actually looking at, not merely incoming events
  const unreadOnSelected = selected?.admin_unread_count ?? 0;
  useEffect(() => {
    if (!active || !selected || unreadOnSelected === 0) return;
    if (document.visibilityState !== "visible") return;
    chat.markRead(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, selected?.id, unreadOnSelected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, selectedId, chat.visitorTyping]);

  useEffect(() => {
    setReply("");
    setError(null);
  }, [selectedId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError(null);
    chat.notifyTyping(false);
    const result = await chat.sendReply(selected.id, text);
    setSending(false);
    if (!result.ok) {
      setError("Couldn't send that reply. Try again.");
      return;
    }
    setReply("");
  }

  async function toggleStatus() {
    if (!selected) return;
    const result = await chat.setStatus(
      selected.id,
      selected.status === "open" ? "closed" : "open"
    );
    if (!result.ok) setError("Couldn't update the conversation. Try again.");
  }

  if (!chat.available && chat.loaded) {
    return (
      <p className="border-2 border-line p-6 font-mono text-xs text-ink-soft">
        Live chat isn&apos;t set up yet. Run the chat SQL in Supabase to enable it.
      </p>
    );
  }

  return (
    <div>
      {chat.connection === "reconnecting" && (
        <p className="mb-3 font-mono text-[11px] text-accent" role="status">
          Reconnecting…
        </p>
      )}

      <div className="grid h-[clamp(24rem,calc(100dvh_-_12rem),42rem)] grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden border-2 border-line md:grid-cols-[17rem,1fr]">
        {/* Inbox list — on mobile it hides while a conversation is open */}
        <div
          className={`min-h-0 min-w-0 flex-col overflow-hidden border-b-2 border-line md:flex md:border-b-0 md:border-r-2 ${
            selected ? "hidden" : "flex"
          }`}
        >
          <div className="flex shrink-0 flex-col gap-2 border-b-2 border-line p-3">
            <div className="flex flex-wrap border-2 border-line font-mono text-[11px]">
              {(["all", "unread", "open", "closed"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-1.5 capitalize ${
                    filter === f ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              aria-label="Search chats"
              className="field-input py-2 text-sm"
            />
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {!chat.loaded ? (
              <li className="p-4 font-mono text-xs text-ink-soft">Loading chats…</li>
            ) : visible.length === 0 ? (
              <li className="px-4 py-10 text-center font-mono text-xs text-ink-soft/70">
                {conversations.length === 0 ? "No chats yet." : "No chats match this filter."}
              </li>
            ) : (
              visible.map((c) => (
                <li key={c.id} className="border-b border-line/20 last:border-b-0">
                  <button
                    onClick={() => chat.select(c.id)}
                    className={`block w-full min-w-0 px-4 py-3 text-left hover:bg-paper-alt/60 ${
                      c.id === selectedId ? "bg-accent/5" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          c.admin_unread_count > 0 ? "font-semibold text-ink" : "font-medium text-ink"
                        }`}
                      >
                        {c.visitor_name}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-ink-soft/70">
                        {timeAgo(c.last_message_at)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink-soft">
                        {c.last_message_preview}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {c.status === "closed" && (
                          <span className="font-mono text-[10px] text-ink-soft/70">closed</span>
                        )}
                        {c.admin_unread_count > 0 && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-mono text-[10px] text-paper">
                            {c.admin_unread_count}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Conversation */}
        <div className={`min-h-0 min-w-0 flex-col overflow-hidden md:flex ${selected ? "flex" : "hidden"}`}>
          {!selected ? (
            <p className="m-auto p-6 font-mono text-xs text-ink-soft/70">
              Select a chat to read and reply.
            </p>
          ) : (
            <>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b-2 border-line p-4">
                <div className="min-w-0">
                  <button
                    onClick={() => chat.select(null)}
                    className="mb-2 font-mono text-[11px] text-ink-soft hover:text-ink md:hidden"
                  >
                    ← All chats
                  </button>
                  <p className="break-words font-display text-lg font-black text-ink">
                    {selected.visitor_name}
                  </p>
                  {selected.visitor_email ? (
                    <a
                      href={`mailto:${selected.visitor_email}`}
                      className="break-all font-mono text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-accent"
                    >
                      {selected.visitor_email}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-ink-soft/70">No email given</p>
                  )}
                  <p className="mt-1 font-mono text-[11px] text-ink-soft/70">
                    {selected.status === "open" ? "Open" : "Closed"} · started{" "}
                    {new Date(selected.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ClayButton size="sm" variant="ghost" onClick={toggleStatus}>
                  {selected.status === "open" ? "Close conversation" : "Reopen"}
                </ClayButton>
              </div>

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4"
              >
                {chat.messagesLoading && messages.length === 0 ? (
                  <p className="font-mono text-xs text-ink-soft">Loading messages…</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {messages.map((m) => {
                      const mine = m.sender_type === "admin";
                      return (
                        <li
                          key={m.id}
                          className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}
                        >
                          <p className="mb-0.5 font-mono text-[11px] text-ink-soft">
                            {mine ? "You" : selected.visitor_name}
                          </p>
                          <p
                            className={`max-w-[85%] whitespace-pre-wrap border-2 border-line px-3 py-2 text-sm [overflow-wrap:anywhere] ${
                              mine ? "bg-ink text-paper" : "bg-paper text-ink"
                            }`}
                          >
                            {m.message}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-ink-soft/70">
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {mine && m.read_at ? " · Seen" : ""}
                          </p>
                        </li>
                      );
                    })}
                    {chat.visitorTyping && (
                      <TypingIndicator name={selected.visitor_name} />
                    )}
                  </ul>
                )}
              </div>

              <form onSubmit={handleSend} className="shrink-0 border-t-2 border-line p-3">
                {error && (
                  <p className="mb-2 font-mono text-xs text-accent" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <label htmlFor="admin-chat-reply" className="sr-only">
                    Reply
                  </label>
                  <textarea
                    id="admin-chat-reply"
                    rows={2}
                    maxLength={2000}
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      chat.notifyTyping(e.target.value.trim().length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Type a reply…"
                    className="field-input min-w-0 flex-1 resize-none py-2 text-sm"
                  />
                  <ClayButton type="submit" size="sm" disabled={sending || !reply.trim()}>
                    {sending ? "Sending…" : "Send"}
                  </ClayButton>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}