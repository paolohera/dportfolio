"use client";

import { useState } from "react";
import ClayButton from "@/components/ui/ClayButton";
import ContactModal from "@/components/contact/ContactModal";
import EmailLink from "@/components/contact/EmailLink";
import type { Profile } from "@/types";

export interface ContactSectionProps {
  profile?: Profile | null;
}

export default function ContactSection({ profile }: ContactSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">05 / contact</p>

      <div className="mt-6 border-2 border-line p-10 text-center sm:p-16">
        <h2 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Ready for your next project?
        </h2>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Send a short brief — what you're building, and what you need help
          with — and I'll reply within a couple of days.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ClayButton variant="primary" size="md" onClick={() => setOpen(true)}>
            Send a message
          </ClayButton>

          {profile?.email && (
            <EmailLink
              email={profile.email}
              className="brutal-press inline-flex items-center gap-2 border-2 border-line px-6 py-3 text-base font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper"
            >
              Email directly
            </EmailLink>
          )}
        </div>
      </div>

      {open && profile?.email && (
        <ContactModal fallbackEmail={profile.email} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
