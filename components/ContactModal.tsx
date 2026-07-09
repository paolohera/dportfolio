"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ClayButton from "./ClayButton";
import EmailLink from "./EmailLink";

// Minimum time (ms) a real person needs to notice the modal and type a
// message. Submissions faster than this are almost certainly a bot filling
// the form programmatically.
const MIN_FILL_TIME_MS = 2500;

export default function ContactModal({
  fallbackEmail,
  onClose,
}: {
  fallbackEmail: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // hidden field — bots tend to fill every input
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const openedAt = useRef(Date.now());

  useEffect(() => {
    nameRef.current?.focus();
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Silently "succeed" on suspected bot submissions instead of showing an
    // error — this avoids tipping the bot off that it was caught, so it
    // doesn't retry with a workaround.
    const looksLikeBot =
      honeypot.trim().length > 0 ||
      Date.now() - openedAt.current < MIN_FILL_TIME_MS;

    if (looksLikeBot) {
      setSent(true);
      return;
    }

    setSending(true);

    const { error: insertError } = await supabase.from("messages").insert({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || null,
      message: message.trim(),
    });

    setSending(false);

    if (insertError) {
      setError("Couldn't send that — please try again in a moment.");
      return;
    }

    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-modal-in rounded-clay bg-clay-surface p-8 shadow-clay-raised">
        {sent ? (
          <div className="py-4 text-center">
            <p className="font-display text-2xl font-medium text-ink">
              Message sent.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Thanks for reaching out — I&apos;ll get back to you soon.
            </p>
            <ClayButton className="mt-6" onClick={onClose}>
              Close
            </ClayButton>
          </div>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Get in touch
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium text-ink">
              Let&apos;s talk.
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="contact-name" className="sr-only">
                  Name
                </label>
                <input
                  ref={nameRef}
                  id="contact-name"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="clay-input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clay-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="sr-only">
                    Company (optional)
                  </label>
                  <input
                    id="contact-company"
                    placeholder="Company (optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="clay-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="What are you looking to build?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="clay-input resize-none"
                />
              </div>

              {/* Honeypot — visually hidden from real users, but bots that
                  auto-fill every field on a page will fill this in too. */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {error && (
                <p className="font-mono text-xs text-warm-dark" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-1 flex items-center gap-3">
                <ClayButton type="submit" disabled={sending} className="flex-1">
                  {sending ? "Sending…" : "Send message"}
                </ClayButton>
                <ClayButton type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </ClayButton>
              </div>

              <p className="text-center font-mono text-[11px] text-ink-soft/70">
                Prefer email?{" "}
                <EmailLink
                  email={fallbackEmail}
                  className="underline decoration-clay-line underline-offset-4 hover:text-ink"
                >
                  Reach out directly
                </EmailLink>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}