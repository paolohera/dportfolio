// All chat limits live here. Override with env vars without touching code.
function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const CHAT_CONFIG = {
  maxMessageLength: 2000,
  maxNameLength: 60,
  maxEmailLength: 254,
  maxBodyBytes: 8 * 1024,
  historyLimit: 200,

  cookieName: "pp_chat",
  cookieMaxAgeSeconds: 60 * 60 * 24 * 7,

  limits: {
    // Conversations created per IP
    start: {
      perIp: {
        max: num(process.env.CHAT_LIMIT_START_PER_HOUR, 3),
        windowSeconds: 3600,
      },
      // Bounds how often one IP can make us call Turnstile / validate
      attemptsPerIp: { max: 20, windowSeconds: 600 },
    },
    message: {
      minIntervalSeconds: num(process.env.CHAT_MIN_INTERVAL_SECONDS, 2),
      perConversation: {
        max: num(process.env.CHAT_LIMIT_MSG_PER_MINUTE, 10),
        windowSeconds: 60,
      },
      perIp: {
        max: num(process.env.CHAT_LIMIT_MSG_PER_10_MIN, 30),
        windowSeconds: 600,
      },
      perConversationPerDay: { max: 300, windowSeconds: 86400 },
    },
    read: { perIp: { max: 60, windowSeconds: 60 } },
    session: { perIp: { max: 60, windowSeconds: 60 } },
  },

  // After this many rate-limit violations, ask for a Turnstile token on messages
  escalation: { violationsBeforeChallenge: 3, windowSeconds: 600 },
} as const;