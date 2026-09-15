"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import ClayButton from "@/components/ui/ClayButton";

export default function AdminLoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("That key doesn't fit. Check your email and password.");
      return;
    }

    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Admin login"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm animate-modal-in border-2 border-line bg-paper p-8 shadow-brutal-lg">
        <p className="font-mono text-[11px] text-ink-soft">Admin access</p>
        <h2 className="mt-2 font-display text-2xl font-black text-ink">
          Welcome back.
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="sr-only">
              Email
            </label>
            <input
              ref={emailRef}
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-accent" role="alert">
              {error}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <ClayButton type="submit" disabled={loading} className="flex-1">
              {loading ? "Checking…" : "Log in"}
            </ClayButton>
            <ClayButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </ClayButton>
          </div>
        </form>
      </div>
    </div>
  );
}
