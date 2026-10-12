import { NextRequest } from "next/server";
import { CHAT_CONFIG } from "@/lib/chat/config";
import {
  GENERIC_ERROR,
  cleanEmail,
  cleanText,
  clientIp,
  fail,
  hashIp,
  hashToken,
  loadMessages,
  newVisitorToken,
  ok,
  originAllowed,
  publicConversation,
  rateCount,
  rateHit,
  readJson,
  setSessionCookie,
  supabaseService,
  tooFast,
  verifyTurnstile,
} from "@/lib/chat/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!originAllowed(req)) return fail(403, "forbidden", GENERIC_ERROR);

    const body = await readJson(req);
    if (!body) return fail(400, "bad_request", "Couldn't start the chat. Please try again.");

    // Honeypot: real visitors never fill this. Reject without saying why.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return fail(400, "bad_request", "Couldn't start the chat. Please try again.");
    }

    const name = cleanText(body.name, CHAT_CONFIG.maxNameLength);
    const email = cleanEmail(body.email);
    const message = cleanText(body.message, CHAT_CONFIG.maxMessageLength);
    if (!name) return fail(400, "invalid_name", "Please enter your name.");
    if (email === undefined) return fail(400, "invalid_email", "That email address doesn't look right.");
    if (!message) return fail(400, "invalid_message", "Please write a message (up to 2000 characters).");

    const rawIp = clientIp(req);
    const ip = hashIp(rawIp);
    const { start } = CHAT_CONFIG.limits;

    // Bound how often one IP can reach Turnstile / validation at all
    const attempts = await rateHit(
      `start:attempt:${ip}`,
      start.attemptsPerIp.windowSeconds,
      start.attemptsPerIp.max
    );
    if (!attempts.allowed) return tooFast(attempts.retryAfter);

    // Conversation quota: check first, consume only after everything passes
    const used = await rateCount(`start:ip:${ip}`, start.perIp.windowSeconds);
    if (used >= start.perIp.max) return tooFast(start.perIp.windowSeconds);

    // Turnstile is mandatory when starting a conversation
    const human = await verifyTurnstile(body.turnstileToken, rawIp);
    if (!human) {
      return fail(403, "turnstile_failed", "We couldn't verify you're human. Please try again.");
    }

    const quota = await rateHit(`start:ip:${ip}`, start.perIp.windowSeconds, start.perIp.max);
    if (!quota.allowed) return tooFast(quota.retryAfter);

    const sb = supabaseService();
    const token = newVisitorToken();

    const { data: conv, error: convError } = await sb
      .from("chat_conversations")
      .insert({
        visitor_name: name,
        visitor_email: email,
        visitor_token_hash: hashToken(token),
        ip_hash: ip,
      })
      .select("id")
      .single();
    if (convError || !conv) throw convError ?? new Error("insert failed");

    const { error: msgError } = await sb.from("chat_messages").insert({
      conversation_id: conv.id,
      sender_type: "visitor",
      message,
    });
    if (msgError) {
      await sb.from("chat_conversations").delete().eq("id", conv.id);
      throw msgError;
    }

    // Re-read so counters set by the database trigger are included
    const { data: fresh } = await sb
      .from("chat_conversations")
      .select("id, visitor_token_hash, channel_key, visitor_name, visitor_email, status, visitor_unread_count")
      .eq("id", conv.id)
      .single();
    if (!fresh) throw new Error("conversation vanished");

    const res = ok({
      conversation: publicConversation(fresh),
      messages: await loadMessages(conv.id),
    });
    setSessionCookie(res, conv.id, token);
    return res;
  } catch (err) {
    console.error("[chat/start]", err);
    return fail(500, "server_error", GENERIC_ERROR);
  }
}