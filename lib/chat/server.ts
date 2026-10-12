// SERVER-ONLY helpers for the chat API routes.
// Never import this file from a "use client" component: it reads the
// Supabase service-role key and the Turnstile secret.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CHAT_CONFIG } from "./config";
import type { ChatMessage, ChatStatus, PublicChatConversation } from "@/types";

export const GENERIC_ERROR = "Something went wrong. Please try again.";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- Supabase (service role) ----------
let cached: SupabaseClient | null = null;

export function supabaseService(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Chat server is not configured.");
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

interface ConversationRow {
  id: string;
  visitor_token_hash: string;
  channel_key: string;
  visitor_name: string;
  visitor_email: string | null;
  status: ChatStatus;
  visitor_unread_count: number;
}

// ---------- Responses ----------
export function ok(body: Record<string, unknown>, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function fail(
  status: number,
  code: string,
  message: string,
  retryAfter?: number
) {
  const res = NextResponse.json(
    { error: { code, message }, ...(retryAfter ? { retryAfter } : {}) },
    { status }
  );
  res.headers.set("Cache-Control", "no-store");
  if (retryAfter) res.headers.set("Retry-After", String(retryAfter));
  return res;
}

export function tooFast(retryAfter: number) {
  return fail(
    429,
    "rate_limited",
    "You're sending messages a little too quickly. Please wait a moment and try again.",
    retryAfter
  );
}

// ---------- Request metadata ----------
export function clientIp(req: NextRequest): string {
  const h = req.headers;
  // Only trust cf-connecting-ip if the site really sits behind Cloudflare,
  // otherwise anyone could spoof it.
  const trustCf = process.env.TRUST_CLOUDFLARE_IP === "true";
  const raw =
    (trustCf && h.get("cf-connecting-ip")) ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  return raw.trim();
}

export function hashIp(ip: string): string {
  const salt =
    process.env.CHAT_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function allowedHostnames(): Set<string> {
  const set = new Set<string>();
  const add = (v: string) => {
    const host = v.trim().toLowerCase().split(":")[0];
    if (host) set.add(host);
  };
  (process.env.CHAT_ALLOWED_HOSTS ?? "").split(",").forEach(add);
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      add(new URL(site).host);
    } catch {
      /* ignore bad URL */
    }
  }
  // localhost is only ever accepted outside production
  if (process.env.NODE_ENV !== "production") {
    add("localhost");
    add("127.0.0.1");
  }
  return set;
}

export function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return allowedHostnames().has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

// ---------- Input handling ----------
export async function readJson(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return null;
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > CHAT_CONFIG.maxBodyBytes) return null;
  const text = await req.text();
  if (text.length > CHAT_CONFIG.maxBodyBytes) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// Strips control characters but keeps tab / newline / carriage return
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(CONTROL, "").trim();
  if (!text || text.length > max) return null;
  return text;
}

/** undefined = invalid, null = not provided, string = valid email */
export function cleanEmail(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const email = value.trim();
  if (email === "") return null;
  if (email.length > CHAT_CONFIG.maxEmailLength) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

// ---------- Rate limiting (shared store: Postgres) ----------
export async function rateHit(
  key: string,
  windowSeconds: number,
  max: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const { data, error } = await supabaseService().rpc("chat_rate_hit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error || !data) throw new Error("rate limit store unavailable");
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    retryAfter: Number(row?.retry_after ?? 0),
  };
}

export async function rateCount(key: string, windowSeconds: number) {
  const { data, error } = await supabaseService().rpc("chat_rate_count", {
    p_key: key,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("rate limit store unavailable");
  return Number(data ?? 0);
}

// ---------- Cloudflare Turnstile ----------
export async function verifyTurnstile(
  token: unknown,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Turnstile is not configured.");
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body, cache: "no-store" }
  );
  if (!res.ok) return false;

  const result = (await res.json()) as { success?: boolean; hostname?: string };
  if (!result.success) return false;

  // In production the token must have been issued for one of our hostnames.
  if (process.env.NODE_ENV === "production") {
    const host = result.hostname?.toLowerCase();
    if (!host || !allowedHostnames().has(host)) return false;
  }
  return true;
}

// ---------- Visitor session (httpOnly cookie) ----------
export function newVisitorToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function setSessionCookie(
  res: NextResponse,
  conversationId: string,
  token: string
) {
  res.cookies.set(CHAT_CONFIG.cookieName, `${conversationId}.${token}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHAT_CONFIG.cookieMaxAgeSeconds,
  });
}

/** Returns the conversation only if the cookie proves ownership. */
export async function getSessionConversation(
  req: NextRequest
): Promise<ConversationRow | null> {
  const raw = req.cookies.get(CHAT_CONFIG.cookieName)?.value;
  if (!raw) return null;

  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!UUID_RE.test(id) || token.length < 20 || token.length > 100) return null;

  const { data } = await supabaseService()
    .from("chat_conversations")
    .select(
      "id, visitor_token_hash, channel_key, visitor_name, visitor_email, status, visitor_unread_count"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(String(data.visitor_token_hash));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return data as ConversationRow;
}

export function publicConversation(c: ConversationRow): PublicChatConversation {
  return {
    id: c.id,
    status: c.status,
    visitor_name: c.visitor_name,
    channel_key: c.channel_key,
    visitor_unread_count: c.visitor_unread_count,
  };
}

export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await supabaseService()
    .from("chat_messages")
    .select("id, sender_type, message, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(CHAT_CONFIG.historyLimit);
  return ((data ?? []) as ChatMessage[]).reverse();
}