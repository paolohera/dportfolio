import { NextRequest } from "next/server";
import { CHAT_CONFIG } from "@/lib/chat/config";
import {
  GENERIC_ERROR,
  clientIp,
  fail,
  getSessionConversation,
  hashIp,
  loadMessages,
  ok,
  publicConversation,
  rateHit,
  tooFast,
} from "@/lib/chat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the visitor's own conversation (proved by the httpOnly cookie), if any.
export async function GET(req: NextRequest) {
  try {
    const ip = hashIp(clientIp(req));
    const limit = CHAT_CONFIG.limits.session.perIp;
    const rl = await rateHit(`session:ip:${ip}`, limit.windowSeconds, limit.max);
    if (!rl.allowed) return tooFast(rl.retryAfter);

    const conv = await getSessionConversation(req);
    if (!conv) return ok({ conversation: null, messages: [] });

    return ok({
      conversation: publicConversation(conv),
      messages: await loadMessages(conv.id),
    });
  } catch (err) {
    console.error("[chat/session]", err);
    return fail(500, "server_error", GENERIC_ERROR);
  }
}