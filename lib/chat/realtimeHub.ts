// CLIENT-ONLY. One shared Supabase Realtime channel per topic.
//
// Why: the visitor widget and the Admin Studio can both live on the same page
// (the dashboard is an overlay on the public site, and the browser may hold a
// visitor cookie for the same conversation). If each created its own channel
// for `chat:<key>`, the second one would clash with the first and typing events
// would silently go nowhere. Everything now joins through here instead, so a
// topic has exactly one channel no matter how many components use it.
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type EventHandler = (event: string, payload: unknown) => void;
type StatusHandler = (status: string) => void;

export interface ChatTopicHandle {
  /** Broadcast to everyone else on the topic. No-op until the channel is joined. */
  send: (event: string, payload: Record<string, unknown>) => void;
  leave: () => void;
}

interface Entry {
  channel: RealtimeChannel;
  eventHandlers: Set<EventHandler>;
  statusHandlers: Set<StatusHandler>;
  status: string;
  refs: number;
  teardown: number | null;
}

const EVENTS = ["message", "status", "typing"] as const;
// Small grace period so React StrictMode's mount/unmount/mount doesn't thrash the socket
const TEARDOWN_DELAY_MS = 500;
const entries = new Map<string, Entry>();
const DEBUG = process.env.NEXT_PUBLIC_CHAT_DEBUG === "true";

function log(...args: unknown[]) {
  if (DEBUG) console.debug("[chat-realtime]", ...args);
}

export function joinChatTopic(
  topic: string,
  onEvent: EventHandler,
  onStatus?: StatusHandler
): ChatTopicHandle {
  let entry = entries.get(topic);

  if (!entry) {
    const channel = supabase.channel(topic, {
      config: { broadcast: { self: false } },
    });
    const created: Entry = {
      channel,
      eventHandlers: new Set(),
      statusHandlers: new Set(),
      status: "JOINING",
      refs: 0,
      teardown: null,
    };
    for (const event of EVENTS) {
      channel.on("broadcast", { event }, ({ payload }) => {
        log("received", topic, event, payload);
        created.eventHandlers.forEach((handler) => handler(event, payload));
      });
    }
    channel.subscribe((status) => {
      log("status", topic, status);
      created.status = status;
      created.statusHandlers.forEach((handler) => handler(status));
    });
    entries.set(topic, created);
    entry = created;
    log("created", topic);
  }

  const shared = entry;
  if (shared.teardown !== null) {
    window.clearTimeout(shared.teardown);
    shared.teardown = null;
  }
  shared.refs += 1;
  shared.eventHandlers.add(onEvent);
  if (onStatus) {
    shared.statusHandlers.add(onStatus);
    // A late joiner should learn the current state straight away
    if (shared.status !== "JOINING") onStatus(shared.status);
  }

  let left = false;
  return {
    send(event, payload) {
      if (shared.status !== "SUBSCRIBED") {
        log("send skipped (not joined)", topic, event);
        return;
      }
      log("send", topic, event, payload);
      void shared.channel.send({ type: "broadcast", event, payload });
    },
    leave() {
      if (left) return;
      left = true;
      shared.eventHandlers.delete(onEvent);
      if (onStatus) shared.statusHandlers.delete(onStatus);
      shared.refs -= 1;
      if (shared.refs <= 0) {
        shared.teardown = window.setTimeout(() => {
          if (shared.refs <= 0 && entries.get(topic) === shared) {
            entries.delete(topic);
            void supabase.removeChannel(shared.channel);
            log("removed", topic);
          }
        }, TEARDOWN_DELAY_MS);
      }
    },
  };
}