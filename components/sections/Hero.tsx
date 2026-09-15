import type { Profile } from "@/types";

export default function Hero({ profile }: { profile?: Profile | null }) {
  return (
    <header
      id="hero"
      className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center border-b-2 border-line px-6 py-20 text-center"
    >
      <p className="font-mono text-xs text-ink-soft">01 / start</p>

      <div className="mt-8 max-w-3xl">
        <h1 className="font-display text-5xl font-black leading-[0.98] tracking-tight text-ink sm:text-7xl">
          Builds software that ships.
        </h1>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#work-section"
            className="brutal-press border-2 border-line bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-brutal hover:bg-accent hover:border-accent hover:shadow-brutal-accent"
          >
            View the work
          </a>
          <a
            href="#contact-section"
            className="brutal-press border-2 border-line bg-paper px-5 py-2.5 text-sm font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper"
          >
            Contact
          </a>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line/20 pt-5 font-mono text-xs text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 ${
              profile?.available_for_work ? "bg-good" : "bg-ink-soft"
            }`}
            aria-hidden
          />
          {profile?.available_for_work
            ? "Available for new work"
            : "Not taking new work right now"}
        </span>
        {profile?.current_focus && (
          <span>
            building: {profile.current_focus}
            <span className="ml-0.5 inline-block h-3 w-[7px] animate-blink bg-ink align-[-2px]" />
          </span>
        )}
      </div>
    </header>
  );
}