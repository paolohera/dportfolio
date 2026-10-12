"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { joinChatTopic, type ChatTopicHandle } from "@/lib/chat/realtimeHub";
import type {
  AdminChatConversation,
  AdminChatMessage,
  ChatStatus,
} from "@/types";

// Explicit columns: never pull the visitor token hash, channel key or IP hash into the admin UI
const CONVERSATION_COLUMNS =
  "id, channel_key, visitor_name, visitor_email, status, last_message_at, last_message_preview, admin_unread_count, visitor_unread_count, admin_last_read_at, visitor_last_read_at, created_at, updated_at";
const MESSAGE_COLUMNS = "id, conversation_id, sender_type, message, created_at, read_at";

function pickConversation(row: Record<string, unknown>): AdminChatConversation {
  return {
    id: row.id as string,
    channel_key: row.channel_key as string,
    visitor_name: row.visitor_name as string,
    visitor_email: (row.visitor_email as string | null) ?? null,
    status: row.status as ChatStatus,
    last_message_at: row.last_message_at as string,
    last_message_preview: (row.last_message_preview as string) ?? "",
    admin_unread_count: Number(row.admin_unread_count ?? 0),
    visitor_unread_count: Number(row.visitor_unread_count ?? 0),
    admin_last_read_at: (row.admin_last_read_at as string | null) ?? null,
    visitor_last_read_at: (row.visitor_last_read_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function pickMessage(row: Record<string, unknown>): AdminChatMessage {
  return {
    id: row.id as string,
    conversation_id: row.conversation_id as string,
    sender_type: row.sender_type as AdminChatMessage["sender_type"],
    message: row.message as string,
    created_at: row.created_at as string,
    read_at: (row.read_at as string | null) ?? null,
  };
}

/**
 * One realtime channel for the whole Admin Studio session (mounted once in
 * AdminDashboard, removed on unmount). Selecting a conversation never creates
 * a new subscription.
 */
export function useChatAdmin() {
  const [conversations, setConversations] = useState<AdminChatConversation[]>([]);
  const [available, setAvailable] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [connection, setConnection] = useState<"connected" | "reconnecting">("connected");
  const [visitorTyping, setVisitorTyping] = useState(false);
  const selectedRef = useRef<string | null>(null);
  const disconnectedRef = useRef(false);
  const typingHandleRef = useRef<ChatTopicHandle | null>(null);
  const typingReadyRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const idleRef = useRef<number | null>(null);
  const expiryRef = useRef<number | null>(null);

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select(CONVERSATION_COLUMNS)
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) {
      // Most likely the chat SQL hasn't been run yet. Don't break the dashboard.
      setAvailable(false);
      setLoaded(true);
      return;
    }
    setAvailable(true);
    setConversations((data ?? []).map((r) => pickConversation(r as Record<string, unknown>)));
    setLoaded(true);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setMessagesLoading(true);
    const { data } = await supabase
      .from("chat_messages")
      .select(MESSAGE_COLUMNS)
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (selectedRef.current === id) {
      setMessages((data ?? []).map((r) => pickMessage(r as Record<string, unknown>)));
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel("admin-chat-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (oldId) setConversations((prev) => prev.filter((c) => c.id !== oldId));
            return;
          }
          const next = pickConversation(payload.new as Record<string, unknown>);
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === next.id);
            return exists ? prev.map((c) => (c.id === next.id ? next : c)) : [next, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = pickMessage(payload.new as Record<string, unknown>);
          if (msg.conversation_id !== selectedRef.current) return;
          if (msg.sender_type === "visitor") setVisitorTyping(false);
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("connected");
          if (disconnectedRef.current) {
            disconnectedRef.current = false;
            loadConversations();
            if (selectedRef.current) loadMessages(selectedRef.current);
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          disconnectedRef.current = true;
          setConnection("reconnecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, loadMessages]);

  // ---------- typing indicator (broadcast only, nothing is stored) ----------
  // One extra channel, and only for the conversation that is currently open.
  const selectedKey = useMemo(
    () => conversations.find((c) => c.id === selectedId)?.channel_key ?? null,
    [conversations, selectedId]
  );

  useEffect(() => {
    setVisitorTyping(false);
    if (!selectedKey) return;

    const handle = joinChatTopic(
      `chat:${selectedKey}`,
      (event, payload) => {
        if (event !== "typing") return;
        const p = payload as { role?: string; typing?: boolean };
        if (p?.role !== "visitor") return;
        if (expiryRef.current) window.clearTimeout(expiryRef.current);
        if (p.typing) {
          setVisitorTyping(true);
          expiryRef.current = window.setTimeout(() => setVisitorTyping(false), 5000);
        } else {
          setVisitorTyping(false);
        }
      },
      (status) => {
        typingReadyRef.current = status === "SUBSCRIBED";
      }
    );
    typingHandleRef.current = handle;

    return () => {
      typingReadyRef.current = false;
      typingHandleRef.current = null;
      lastTypingSentRef.current = 0;
      if (expiryRef.current) window.clearTimeout(expiryRef.current);
      if (idleRef.current) window.clearTimeout(idleRef.current);
      handle.leave();
    };
  }, [selectedKey]);

  /** Call as the admin types (true) and when the box is emptied or a reply is sent (false). */
  const notifyTyping = useCallback((typing: boolean) => {
    const handle = typingHandleRef.current;
    if (!handle || !typingReadyRef.current) return;
    if (idleRef.current) {
      window.clearTimeout(idleRef.current);
      idleRef.current = null;
    }
    const send = (value: boolean) => {
      handle.send("typing", { role: "admin", typing: value });
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
  }, []);

  const select = useCallback(
    (id: string | null) => {
      selectedRef.current = id;
      setSelectedId(id);
      setMessages([]);
      if (id) loadMessages(id);
    },
    [loadMessages]
  );

  const sendReply = useCallback(async (conversationId: string, text: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, sender_type: "admin", message: text })
      .select(MESSAGE_COLUMNS)
      .single();
    if (error || !data) return { ok: false as const, error: error?.message ?? "Couldn't send." };
    const msg = pickMessage(data as Record<string, unknown>);
    if (selectedRef.current === conversationId) {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    }
    return { ok: true as const };
  }, []);

  /** Call only when the admin is actually looking at the conversation. */
  const markRead = useCallback(async (conversationId: string) => {
    const now = new Date().toISOString();
    await supabase
      .from("chat_conversations")
      .update({ admin_unread_count: 0, admin_last_read_at: now })
      .eq("id", conversationId);
    await supabase
      .from("chat_messages")
      .update({ read_at: now })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "visitor")
      .is("read_at", null);
  }, []);

  const setStatus = useCallback(async (conversationId: string, status: ChatStatus) => {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ status })
      .eq("id", conversationId);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  }, []);

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ),
    [conversations]
  );
  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.admin_unread_count > 0 ? c.admin_unread_count : 0), 0),
    [conversations]
  );

  return {
    conversations: sorted,
    unreadTotal,
    available,
    loaded,
    connection,
    selectedId,
    messages,
    messagesLoading,
    visitorTyping,
    notifyTyping,
    select,
    sendReply,
    markRead,
    setStatus,
  };
}

export type ChatAdminApi = ReturnType<typeof useChatAdmin>;