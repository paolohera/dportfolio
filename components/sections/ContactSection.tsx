"use client";

import { useState } from "react";
import ClayButton from "@/components/ui/ClayButton";
import ContactModal from "@/components/contact/ContactModal";
import EmailLink from "@/components/contact/EmailLink";
import type { ContactAction, ContactContent, Profile } from "@/types";
import { CONTACT_DEFAULTS, isSafeContactUrl } from "@/lib/contact/defaults";

export interface ContactSectionProps {
  profile?: Profile | null;
  content?: ContactContent | null;
}

const SECONDARY_CLASS =
  "brutal-press inline-flex items-center justify-center gap-2 border-2 border-line px-6 py-3 text-center text-base font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper";

export default function ContactSection({ profile, content }: ContactSectionProps) {
  const [open, setOpen] = useState(false);

  const c = content ?? CONTACT_DEFAULTS;
  const email = profile?.email ?? null;

  function openLink(url: string) {
    if (url.startsWith("#") || url.startsWith("/")) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function renderPrimary(label: string, action: ContactAction, url: string | null) {
    if (action === "message_form") {
      return (
        <ClayButton variant="primary" size="md" onClick={() => setOpen(true)}>
          {label}
        </ClayButton>
      );
    }
    if (action === "email" && email) {
      return (
        <ClayButton
          variant="primary"
          size="md"
          onClick={() => {
            window.location.href = `mailto:${email}`;
          }}
        >
          {label}
        </ClayButton>
      );
    }
    if (action === "link" && url && isSafeContactUrl(url)) {
      return (
        <ClayButton variant="primary" size="md" onClick={() => openLink(url)}>
          {label}
        </ClayButton>
      );
    }
    return null;
  }

  function renderSecondary(label: string, action: ContactAction, url: string | null) {
    if (action === "email" && email) {
      return (
        <EmailLink email={email} className={SECONDARY_CLASS}>
          {label}
        </EmailLink>
      );
    }
    if (action === "message_form") {
      return (
        <button type="button" onClick={() => setOpen(true)} className={SECONDARY_CLASS}>
          {label}
        </button>
      );
    }
    if (action === "link" && url && isSafeContactUrl(url)) {
      const external = /^https?:\/\//i.test(url);
      return (
        <a
          href={url}
          className={SECONDARY_CLASS}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }
    return null;
  }

  return (
    <div>
      {c.section_label && (
        <p className="font-mono text-xs text-ink-soft">{c.section_label}</p>
      )}

      <div className="mt-6 border-2 border-line p-10 text-center sm:p-16">
        <h2 className="break-words font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
          {c.heading}
        </h2>

        <p className="mx-auto mt-4 max-w-xl whitespace-pre-line break-words text-[15px] leading-relaxed text-ink-soft">
          {c.description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          {renderPrimary(c.primary_button_label, c.primary_button_action, c.primary_button_url)}
          {renderSecondary(c.secondary_button_label, c.secondary_button_action, c.secondary_button_url)}
        </div>
      </div>

      {open && profile?.email && (
        <ContactModal fallbackEmail={profile.email} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}