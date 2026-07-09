import Image from "next/image";
import type { Profile } from "@/lib/types";
import TechBadge from "./TechBadge";
import EmailLink from "./EmailLink";

export default function About({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-20">
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-16 h-[320px] w-[320px] opacity-40"
        viewBox="0 0 400 400"
      >
        <path
          fill="#EDE9DE"
          d="M300.5,299 Q292,368 210,360 Q120,352 88,290 Q52,220 96,150 Q140,78 220,72 Q300,66 330,140 Q358,210 300.5,299 Z"
        />
      </svg>

      <div className="relative grid grid-cols-1 gap-10 rounded-clay bg-clay-surface p-8 shadow-clay-raised sm:grid-cols-[auto,1fr] sm:p-10">
        <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-full bg-clay-deep shadow-clay-pressed sm:mx-0 sm:h-40 sm:w-40">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              sizes="160px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-ink-soft">
              no photo yet
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              About
            </p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide shadow-clay-pressed ${
                profile.available_for_work
                  ? "bg-clay-bg text-accent"
                  : "bg-clay-bg text-ink-soft"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  profile.available_for_work ? "bg-accent" : "bg-ink-soft"
                }`}
                aria-hidden
              />
              {profile.available_for_work
                ? "Available to work"
                : "Not currently available"}
            </span>
          </div>

          <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
            Hi, I&apos;m <span className="italic text-accent">{profile.name}</span>.
          </h2>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {profile.bio}
          </p>

          {profile.current_focus && (
            <p className="mt-3 max-w-xl font-mono text-[13px] text-ink-soft">
              <span className="text-accent">Currently Working On:</span>{" "}
              {profile.current_focus}
            </p>
          )}

          {profile.tools?.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {profile.tools.map((tool) => (
                <TechBadge key={tool} name={tool} />
              ))}
            </ul>
          )}

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-ink-soft">
            {profile.email && (
              <li>
                <EmailLink
                  email={profile.email}
                  className="underline decoration-clay-line underline-offset-4 hover:text-ink"
                />
              </li>
            )}
            {profile.github_url && (
              <li>
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-clay-line underline-offset-4 hover:text-ink"
                >
                  GitHub
                </a>
              </li>
            )}
            {profile.linkedin_url && (
              <li>
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-clay-line underline-offset-4 hover:text-ink"
                >
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}