import { NextRequest } from "next/server";
import { CHAT_CONFIG } from "@/lib/chat/config";
import {
  GENERIC_ERROR,
  cleanText,
  clientIp,
  fail,
  getSessionConversation,
  hashIp,
  ok,
  originAllowed,
  rateCount,
  rateHit,
  readJson,
  supabaseService,
  tooFast,
  verifyTurnstile,
} from "@/lib/chat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!originAllowed(req)) return fail(403, "forbidden", GENERIC_ERROR);

    const conv = await getSessionConversation(req);
    if (!conv) {
      return fail(401, "no_session", "Your chat session has expired. Please start a new conversation.");
    }

    const body = await readJson(req);
    if (!body) return fail(400, "bad_request", GENERIC_ERROR);

    const message = cleanText(body.message, CHAT_CONFIG.maxMessageLength);
    if (!message) return fail(400, "invalid_message", "Please write a message (up to 2000 characters).");

    const rawIp = clientIp(req);
    const ip = hashIp(rawIp);
    const lim = CHAT_CONFIG.limits.message;
    const escalation = CHAT_CONFIG.escalation;

    // Escalation: after repeated violations, require a fresh Turnstile token
    const violationKey = `viol:conv:${conv.id}`;
    const violations = await rateCount(violationKey, escalation.windowSeconds);
    const mustChallenge =
      process.env.CHAT_TURNSTILE_EVERY_MESSAGE === "true" ||
      violations >= escalation.violationsBeforeChallenge;
    if (mustChallenge) {
      const human = await verifyTurnstile(body.turnstileToken, rawIp);
      if (!human) {
        return fail(403, "turnstile_required", "Please complete the quick check below to keep chatting.");
      }
    }

    // Layered limits. Any block is recorded as a violation.
    const checks: Array<[string, number, number]> = [
      [`msg:interval:${conv.id}`, lim.minIntervalSeconds, 1],
      [`msg:conv:${conv.id}`, lim.perConversation.windowSeconds, lim.perConversation.max],
      [`msg:ip:${ip}`, lim.perIp.windowSeconds, lim.perIp.max],
      [`msg:day:${conv.id}`, lim.perConversationPerDay.windowSeconds, lim.perConversationPerDay.max],
    ];
    for (const [key, windowSeconds, max] of checks) {
      const result = await rateHit(key, windowSeconds, max);
      if (!result.allowed) {
        await rateHit(violationKey, escalation.windowSeconds, 1000);
        return tooFast(result.retryAfter);
      }
    }

    // A visitor message on a closed conversation reopens it (done by a DB trigger)
    const { data, error } = await supabaseService()
      .from("chat_messages")
      .insert({ conversation_id: conv.id, sender_type: "visitor", message })
      .select("id, sender_type, message, created_at")
      .single();
    if (error || !data) throw error ?? new Error("insert failed");

    return ok({ message: data, reopened: conv.status === "closed" });
  } catch (err) {
    console.error("[chat/message]", err);
    return fail(500, "server_error", GENERIC_ERROR);
  }
}