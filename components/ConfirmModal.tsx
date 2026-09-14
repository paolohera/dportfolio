"use client";

import { useEffect } from "react";
import ClayButton from "./ClayButton";

export type ConfirmModalProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" styles the confirm button red — use for anything destructive. */
  variant?: "default" | "danger";
  /** Shows a spinner state and disables both buttons while an action runs. */
  busy?: boolean;
  onConfirm: () => void;
  /** Omit to render a single-button "OK" dialog (e.g. for error messages). */
  onCancel?: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && onCancel && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, busy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        aria-label="Dismiss"
        tabIndex={onCancel ? 0 : -1}
        onClick={() => !busy && onCancel?.()}
        className="absolute inset-0 bg-ink/50"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={message ? "confirm-modal-message" : undefined}
        className="relative w-full max-w-sm border-2 border-line bg-paper p-6"
      >
        <p
          id="confirm-modal-title"
          className="font-display text-lg font-black leading-snug text-ink"
        >
          {title}
        </p>
        {message && (
          <p
            id="confirm-modal-message"
            className="mt-2 text-sm leading-relaxed text-ink-soft"
          >
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          {onCancel && (
            <ClayButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelLabel}
            </ClayButton>
          )}
          <ClayButton
            variant={variant === "danger" ? "danger" : undefined}
            size="sm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </ClayButton>
        </div>
      </div>
    </div>
  );
}