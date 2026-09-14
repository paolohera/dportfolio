import Image from "next/image";
import type { Profile } from "@/lib/types";
import TechBadge from "./TechBadge";
import EmailLink from "./EmailLink";
import GitHubContributions from "./GitHubContributions";

export default function About({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  return (
    <div className="relative">
      <p className="font-mono text-xs text-ink-soft">02 / about</p>

      <div className="mt-6 grid grid-cols-1 border-2 border-line sm:grid-cols-[340px,1fr]">
        <div className="relative aspect-[4/5] w-full border-b-2 border-line bg-paper-alt sm:aspect-auto sm:border-b-0 sm:border-r-2">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              fill
              sizes="(min-width: 640px) 340px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-ink-soft">
              no photo yet
            </div>
          )}
        </div>

        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-black tracking-tight text-ink">
              {profile.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] ${
                profile.available_for_work
                  ? "border-good text-good"
                  : "border-line/30 text-ink-soft"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 ${
                  profile.available_for_work ? "bg-good" : "bg-ink-soft"
                }`}
                aria-hidden
              />
              {profile.available_for_work ? "Available" : "Not available"}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {profile.bio}
          </p>

          {(profile.current_focus || profile.email || profile.github_url || profile.linkedin_url) && (
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t-2 border-line pt-5 sm:grid-cols-2">
              {profile.current_focus && (
                <div>
                  <dt className="font-mono text-[11px] text-ink-soft">
                    Currently building
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {profile.current_focus}
                  </dd>
                </div>
              )}
              {profile.email && (
                <div>
                  <dt className="font-mono text-[11px] text-ink-soft">Email</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    <EmailLink
                      email={profile.email}
                      className="underline decoration-line underline-offset-4 hover:text-accent"
                    />
                  </dd>
                </div>
              )}
              {profile.github_url && (
                <div>
                  <dt className="font-mono text-[11px] text-ink-soft">GitHub</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-line underline-offset-4 hover:text-accent"
                    >
                      {profile.github_url.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
              {profile.linkedin_url && (
                <div>
                  <dt className="font-mono text-[11px] text-ink-soft">
                    LinkedIn
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-line underline-offset-4 hover:text-accent"
                    >
                      {profile.linkedin_url.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}

          {profile.tools?.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2 border-t-2 border-line pt-5">
              {profile.tools.map((tool) => (
                <TechBadge key={tool} name={tool} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {profile.github_url && (
        <div className="mt-6">
          <GitHubContributions
            githubUrl={profile.github_url}
            persona={{
              name: "LazyDev",
              pronouns: "he/him",
              status: "I do anything I want, you cant boss me around",
              // Add a hosted image URL here (Supabase storage, /public, etc.)
              // avatarUrl: "https://...",
            }}
          />
        </div>
      )}
    </div>
  );
}