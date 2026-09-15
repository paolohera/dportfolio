"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";

function usernameFromGithubUrl(url: string) {
  return url
    .replace(/^https?:\/\/(www\.)?github\.com\//, "")
    .replace(/\/.*$/, "")
    .trim();
}

type Rgb = [number, number, number];

function parseRgb(value: string): Rgb {
  const nums = value.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length < 3) return [0, 0, 0];
  return [Number(nums[0]), Number(nums[1]), Number(nums[2])];
}

function mix(a: Rgb, b: Rgb, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export type GitHubContributionsPersona = {
  name: string;
  pronouns?: string;
  status?: string;
  avatarUrl?: string;
};

export default function GitHubContributions({
  githubUrl,
  persona,
}: {
  githubUrl: string;
  /** Optional card shown to the right of the calendar. Omit to hide it. */
  persona?: GitHubContributionsPersona;
}) {
  const username = usernameFromGithubUrl(githubUrl);
  const baseRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string[] | null>(null);

  useEffect(() => {
    if (!baseRef.current || !accentRef.current) return;
    const base = parseRgb(getComputedStyle(baseRef.current).backgroundColor);
    const accent = parseRgb(
      getComputedStyle(accentRef.current).backgroundColor
    );
    setTheme([0, 0.25, 0.5, 0.75, 1].map((t) => mix(base, accent, t)));
  }, []);

  if (!username) return null;

  return (
    <div className="border-2 border-line bg-paper p-6">
      {/* Invisible reference swatches — read at runtime to theme the
          calendar with your real "paper-alt" and "accent" colors, whatever
          their underlying hex values happen to be. */}
      <div
        ref={baseRef}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden bg-paper-alt opacity-0"
      />
      <div
        ref={accentRef}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden bg-accent opacity-0"
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-ink-soft">GitHub activity</p>
          <div className="mt-4 overflow-x-auto pb-1">
            {theme ? (
              <GitHubCalendar
                username={username}
                colorScheme="light"
                blockSize={10}
                blockMargin={3}
                blockRadius={2}
                fontSize={12}
                theme={{ light: theme }}
                errorMessage="Couldn't load GitHub activity."
              />
            ) : (
              <p className="font-mono text-[11px] text-ink-soft">Loading…</p>
            )}
          </div>
        </div>

        {persona && (
          <div className="flex shrink-0 flex-row items-center gap-4 border-t-2 border-line pt-5 sm:w-56 sm:flex-col sm:items-start sm:border-l-2 sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-full border-2 border-line bg-paper-alt">
              {persona.avatarUrl ? (
                <Image
                  src={persona.avatarUrl}
                  alt={persona.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink-soft">
                  ?
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-black text-ink">
                {persona.name}
              </p>
              <p className="truncate font-mono text-[11px] text-ink-soft">
                {username}
                {persona.pronouns ? ` · ${persona.pronouns}` : ""}
              </p>
              {persona.status && (
                <p className="mt-2 text-sm leading-snug text-ink-soft">
                  {persona.status}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}