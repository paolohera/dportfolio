"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { joinChatTopic, type ChatTopicHandle } from "@/lib/chat/realtimeHub";
import type { ChatMessage, PublicChatConversation } from "@/types";
import TurnstileWidget from "@/components/chat/TurnstileWidget";
import TypingIndicator from "@/components/chat/TypingIndicator";

type Phase = "idle" | "loading" | "form" | "chat";
type Connection = "connected" | "reconnecting";

interface UIMessage extends ChatMessage {
  tempId?: string;
  state?: "sending" | "failed";
}

const HINT_KEY = "pp_chat_hint"; // only a hint that a session may exist; the server verifies ownership

function readHint(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}
function writeHint() {
  try {
    window.localStorage.setItem(HINT_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface ApiError {
  status: number;
  code: string;
  message: string;
  retryAfter: number;
}

async function api<T>(
  url: string,
  init?: { method?: "POST"; body?: unknown }
): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: {
          status: res.status,
          code: json?.error?.code ?? "error",
          message: json?.error?.message ?? "Something went wrong. Please try again.",
          retryAfter: Number(json?.retryAfter ?? res.headers.get("Retry-After") ?? 0),
        },
      };
    }
    return { ok: true, data: json as T };
  } catch {
    return {
      ok: false,
      error: {
        status: 0,
        code: "network",
        message: "Couldn't reach the server. Check your connection and try again.",
        retryAfter: 0,
      },
    };
  }
}

interface SessionPayload {
  conversation: PublicChatConversation | null;
  messages: ChatMessage[];
}

export default function ChatWidget({
  raised = false,
  ownerName = "Paolo",
}: {
  /** Lift the launcher when another fixed button occupies the corner. */
  raised?: boolean;
  ownerName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [conv, setConv] = useState<PublicChatConversation | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [connection, setConnection] = useState<Connection>("connected");
  const [adminTyping, setAdminTyping] = useState(false);

  // start form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [starting, setStarting] = useState(false);

  // composer
  const [draft, setDraft] = useState("");
  const [needChallenge, setNeedChallenge] = useState(false);

  // turnstile
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [widgetFailed, setWidgetFailed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const openRef = useRef(open);
  const convRef = useRef(conv);
  const tokenRef = useRef(token);
  const disconnectedRef = useRef(false);
  const handleRef = useRef<ChatTopicHandle | null>(null);
  const connectedRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const idleRef = useRef<number | null>(null);
  const expiryRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  openRef.current = open;
  convRef.current = conv;
  tokenRef.current = token;

  // ---------- session ----------
  const loadSession = useCallback(async () => {
    setPhase((p) => (p === "chat" ? p : "loading"));
    const result = await api<SessionPayload>("/api/chat/session");
    if (!result.ok) {
      setPhase(convRef.current ? "chat" : "form");
      if (result.error.status !== 429) setError(result.error.message);
      return;
    }
    const { conversation, messages: history } = result.data;
    if (conversation) {
      setConv(conversation);
      setMessages(history);
      setUnread(conversation.visitor_unread_count);
      setPhase("chat");
    } else {
      setConv(null);
      setMessages([]);
      setPhase("form");
    }
  }, []);

  // Only talk to the server on page load if this browser has chatted before
  useEffect(() => {
    if (readHint()) loadSession();
  }, [loadSession]);

  // First open for a browser with no hint
  useEffect(() => {
    if (open && phase === "idle") loadSession();
  }, [open, phase, loadSession]);

  // ---------- realtime (one channel, only while a conversation exists) ----------
  const channelKey = conv?.channel_key;
  useEffect(() => {
    if (!channelKey) return;

    const handle = joinChatTopic(
      `chat:${channelKey}`,
      (event, payload) => {
        if (event === "message") {
          const incoming = payload as ChatMessage;
          if (!incoming?.id) return;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
          if (incoming.sender_type === "admin") {
            setAdminTyping(false);
            if (expiryRef.current) window.clearTimeout(expiryRef.current);
            const looking = openRef.current && document.visibilityState === "visible";
            if (looking) {
              // The visitor is viewing it right now, so it counts as read
              api("/api/chat/read", { method: "POST", body: {} });
            } else {
              setUnread((u) => u + 1);
            }
          }
        } else if (event === "typing") {
          const p = payload as { role?: string; typing?: boolean };
          if (p?.role !== "admin") return;
          if (expiryRef.current) window.clearTimeout(expiryRef.current);
          if (p.typing) {
            setAdminTyping(true);
            // Auto-hide if the "stopped typing" signal never arrives
            expiryRef.current = window.setTimeout(() => setAdminTyping(false), 5000);
          } else {
            setAdminTyping(false);
          }
        } else if (event === "status") {
          const status = (payload as { status?: string })?.status;
          if (status === "open" || status === "closed") {
            setConv((c) => (c ? { ...c, status } : c));
          }
        }
      },
      (status) => {
        if (status === "SUBSCRIBED") {
          setConnection("connected");
          connectedRef.current = true;
          if (disconnectedRef.current) {
            disconnectedRef.current = false;
            // Catch up on anything missed while disconnected
            api<SessionPayload>("/api/chat/session").then((r) => {
              if (r.ok && r.data.conversation) {
                setMessages(r.data.messages);
                setConv(r.data.conversation);
              }
            });
          }
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          disconnectedRef.current = true;
          setConnection("reconnecting");
          connectedRef.current = false;
        }
      }
    );
    handleRef.current = handle;

    return () => {
      connectedRef.current = false;
      handleRef.current = null;
      if (expiryRef.current) window.clearTimeout(expiryRef.current);
      if (idleRef.current) window.clearTimeout(idleRef.current);
      handle.leave();
    };
  }, [channelKey]);

  // ---------- read state: only when the visitor is actually looking ----------
  useEffect(() => {
    if (!open || phase !== "chat" || unread === 0) return;
    if (document.visibilityState !== "visible") return;
    setUnread(0);
    api("/api/chat/read", { method: "POST", body: {} });
  }, [open, phase, unread, messages.length]);

  // ---------- UX plumbing ----------
  // A Turnstile token is single-use and short-lived: drop it when the panel closes
  useEffect(() => {
    if (!open) setToken(null);
  }, [open]);

  useEffect(() => {
    if (!open) emitTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      (phase === "chat" ? draftRef.current : firstFieldRef.current)?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, phase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, open, phase, adminTyping]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  // ---------- actions ----------
  // Typing signal: a tiny broadcast with no message content. Sent at most every
  // 2.5s while typing, and cleared after 3s of silence, on send, or on minimize.
  function emitTyping(typing: boolean) {
    const handle = handleRef.current;
    if (!handle || !connectedRef.current) return;
    if (idleRef.current) {
      window.clearTimeout(idleRef.current);
      idleRef.current = null;
    }
    const send = (value: boolean) => {
      handle.send("typing", { role: "visitor", typing: value });
    };
    if (typing) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2500) {
        lastTypingSentRef.current = now;
        send(true);
      }
      idleRef.current = window.setTimeout(() => {
        lastTypingSentRef.current = 0;
        send(false);
      }, 3000);
    } else if (lastTypingSentRef.current !== 0) {
      lastTypingSentRef.current = 0;
      send(false);
    }
  }

  function freshToken() {
    setToken(null);
    setResetKey((k) => k + 1);
  }

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (starting || !token) return;
    setError(null);
    setStarting(true);

    const result = await api<SessionPayload>("/api/chat/start", {
      method: "POST",
      body: {
        name,
        email,
        message: firstMessage,
        website: honeypot,
        turnstileToken: token,
      },
    });

    setStarting(false);
    freshToken(); // Turnstile tokens are single-use

    if (!result.ok) {
      if (result.error.retryAfter) setCooldown(Math.min(result.error.retryAfter, 3600));
      setError(result.error.message);
      return;
    }

    const { conversation, messages: history } = result.data;
    if (!conversation) {
      setError("Something went wrong. Please try again.");
      return;
    }
    writeHint();
    setConv(conversation);
    setMessages(history);
    setUnread(0);
    setPhase("chat");
    setFirstMessage("");
  }

  async function sendMessage(text: string, existingTempId?: string) {
    const tempId = existingTempId ?? crypto.randomUUID();
    setError(null);

    setMessages((prev) =>
      existingTempId
        ? prev.map((m) => (m.tempId === tempId ? { ...m, state: "sending" as const } : m))
        : [
            ...prev,
            {
              id: tempId,
              tempId,
              sender_type: "visitor" as const,
              message: text,
              created_at: new Date().toISOString(),
              state: "sending" as const,
            },
          ]
    );

    const result = await api<{ message: ChatMessage; reopened: boolean }>(
      "/api/chat/message",
      { method: "POST", body: { message: text, turnstileToken: tokenRef.current } }
    );

    if (needChallenge) freshToken();

    const markFailed = () =>
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, state: "failed" as const } : m))
      );

    if (!result.ok) {
      markFailed();
      const { error: err } = result;
      if (err.code === "turnstile_required") setNeedChallenge(true);
      if (err.status === 429 && err.retryAfter) setCooldown(Math.min(err.retryAfter, 600));
      if (err.status === 401) {
        setConv(null);
        setMessages([]);
        setPhase("form");
      }
      setError(err.message);
      return;
    }

    const real = result.data.message;
    if (result.data.reopened) setConv((c) => (c ? { ...c, status: "open" } : c));
    setNeedChallenge(false);
    setMessages((prev) =>
      prev.some((m) => m.id === real.id)
        ? prev.filter((m) => m.tempId !== tempId) // realtime already delivered it
        : prev.map((m) => (m.tempId === tempId ? { ...real } : m))
    );
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || cooldown > 0) return;
    if (needChallenge && !token) return;
    setDraft("");
    emitTyping(false);
    sendMessage(text);
  }

  const canStart =
    !starting &&
    !!token &&
    cooldown === 0 &&
    name.trim().length > 0 &&
    firstMessage.trim().length > 0;
  const canSend =
    draft.trim().length > 0 && cooldown === 0 && (!needChallenge || !!token);

  // ---------- render ----------
  const launcherOffset = raised ? "bottom-20" : "bottom-6";
  const panelOffset = raised ? "sm:bottom-32" : "sm:bottom-20";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : unread > 0 ? `Open chat, ${unread} unread` : "Open chat"}
        aria-expanded={open}
        aria-controls="portfolio-chat-panel"
        className={`brutal-press fixed right-4 z-40 border-2 border-line bg-ink px-4 py-3 font-mono text-xs text-paper shadow-brutal-sm hover:border-accent hover:bg-accent sm:right-6 ${launcherOffset} ${
          open ? "hidden sm:inline-flex" : "inline-flex"
        } items-center gap-2`}
      >
        Chat
        {unread > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] text-paper">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="portfolio-chat-panel"
          role="dialog"
          aria-label={`Chat with ${ownerName}`}
          className={`fixed inset-x-3 bottom-3 z-40 flex h-[min(34rem,calc(100dvh-1.5rem))] flex-col border-2 border-line bg-paper shadow-brutal sm:inset-x-auto sm:right-6 sm:h-[min(34rem,calc(100dvh-7rem))] sm:w-96 ${panelOffset}`}
        >
          <header className="flex items-start justify-between gap-3 border-b-2 border-line px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-black text-ink">
                Chat with {ownerName}
              </p>
              <p className="font-mono text-[11px] text-ink-soft">
                {connection === "reconnecting"
                  ? "Reconnecting…"
                  : "Usually replies within a few hours"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Minimize chat"
              className="shrink-0 border border-line/40 px-2 py-1 font-mono text-xs text-ink-soft hover:border-ink hover:text-ink"
            >
              ✕
            </button>
          </header>

          {(phase === "idle" || phase === "loading") && (
            <p className="p-4 font-mono text-xs text-ink-soft">Loading…</p>
          )}

          {phase === "form" && (
            <form
              onSubmit={handleStart}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
            >
              <div>
                <label htmlFor="chat-name" className="field-label">
                  Name
                </label>
                <input
                  ref={firstFieldRef}
                  id="chat-name"
                  required
                  maxLength={60}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="chat-email" className="field-label">
                  Email (optional)
                </label>
                <input
                  id="chat-email"
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                  placeholder="So I can reply if you leave"
                />
              </div>
              <div>
                <label htmlFor="chat-first" className="field-label">
                  Message
                </label>
                <textarea
                  id="chat-first"
                  required
                  rows={4}
                  maxLength={2000}
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  className="field-input resize-none"
                  placeholder="What do you need help with?"
                />
              </div>

              {/* Honeypot — invisible to people, bots tend to fill every field */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="chat-website">Website</label>
                <input
                  id="chat-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <TurnstileWidget
                onToken={setToken}
                onError={() => setWidgetFailed(true)}
                resetKey={resetKey}
              />

              {widgetFailed && (
                <p className="font-mono text-xs text-accent" role="alert">
                  The security check couldn&apos;t load. Reload the page and try
                  again.
                </p>
              )}
              {error && (
                <p className="break-words font-mono text-xs text-accent" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canStart}
                className="brutal-press mt-auto border-2 border-line bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-brutal-sm hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting
                  ? "Starting…"
                  : cooldown > 0
                  ? `Please wait ${cooldown}s`
                  : !token && !widgetFailed
                  ? "Verifying…"
                  : "Start chat"}
              </button>
            </form>
          )}

          {phase === "chat" && conv && (
            <>
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
              >
                <ul className="flex flex-col gap-3">
                  {messages.map((m) => {
                    const mine = m.sender_type === "visitor";
                    return (
                      <li
                        key={m.tempId ?? m.id}
                        className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}
                      >
                        <p className="mb-0.5 font-mono text-[11px] text-ink-soft">
                          {mine ? "You" : ownerName}
                        </p>
                        <p
                          className={`max-w-[85%] whitespace-pre-wrap border-2 border-line px-3 py-2 text-sm [overflow-wrap:anywhere] ${
                            mine ? "bg-ink text-paper" : "bg-paper text-ink"
                          } ${m.state === "failed" ? "border-accent" : ""}`}
                        >
                          {m.message}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-ink-soft/70">
                          {m.state === "sending" ? (
                            "Sending…"
                          ) : m.state === "failed" ? (
                            <>
                              Not sent ·{" "}
                              <button
                                type="button"
                                onClick={() => sendMessage(m.message, m.tempId)}
                                className="underline underline-offset-2 hover:text-ink"
                              >
                                Retry
                              </button>
                            </>
                          ) : (
                            formatTime(m.created_at)
                          )}
                        </p>
                      </li>
                    );
                  })}
                  {adminTyping && <TypingIndicator name={ownerName} />}
                </ul>
              </div>

              {conv.status === "closed" && (
                <p className="border-t-2 border-line bg-paper-alt px-4 py-2 font-mono text-[11px] text-ink-soft">
                  This conversation was closed. Send a message to reopen it.
                </p>
              )}

              <form onSubmit={handleSend} className="border-t-2 border-line p-3">
                {needChallenge && (
                  <div className="mb-2">
                    <TurnstileWidget
                      onToken={setToken}
                      onError={() => setWidgetFailed(true)}
                      resetKey={resetKey}
                    />
                  </div>
                )}
                {error && (
                  <p className="mb-2 break-words font-mono text-xs text-accent" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <label htmlFor="chat-draft" className="sr-only">
                    Write a message
                  </label>
                  <textarea
                    ref={draftRef}
                    id="chat-draft"
                    rows={2}
                    maxLength={2000}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      emitTyping(e.target.value.trim().length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Write a message…"
                    className="field-input min-w-0 flex-1 resize-none py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    className="brutal-press shrink-0 border-2 border-line bg-ink px-4 py-2 text-sm font-medium text-paper shadow-brutal-sm hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cooldown > 0 ? `${cooldown}s` : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}