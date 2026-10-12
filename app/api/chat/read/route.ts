import { NextRequest } from "next/server";
import { CHAT_CONFIG } from "@/lib/chat/config";
import {
  GENERIC_ERROR,
  clientIp,
  fail,
  getSessionConversation,
  hashIp,
  ok,
  originAllowed,
  rateHit,
  supabaseService,
  tooFast,
} from "@/lib/chat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The visitor is actually looking at the conversation: clear their unread state.
export async function POST(req: NextRequest) {
  try {
    if (!originAllowed(req)) return fail(403, "forbidden", GENERIC_ERROR);

    const conv = await getSessionConversation(req);
    if (!conv) return fail(401, "no_session", "Your chat session has expired.");

    const ip = hashIp(clientIp(req));
    const limit = CHAT_CONFIG.limits.read.perIp;
    const rl = await rateHit(`read:ip:${ip}`, limit.windowSeconds, limit.max);
    if (!rl.allowed) return tooFast(rl.retryAfter);

    const now = new Date().toISOString();
    const sb = supabaseService();
    await sb
      .from("chat_conversations")
      .update({ visitor_unread_count: 0, visitor_last_read_at: now })
      .eq("id", conv.id);
    await sb
      .from("chat_messages")
      .update({ read_at: now })
      .eq("conversation_id", conv.id)
      .eq("sender_type", "admin")
      .is("read_at", null);

    return ok({ ok: true });
  } catch (err) {
    console.error("[chat/read]", err);
    return fail(500, "server_error", GENERIC_ERROR);
  }
}