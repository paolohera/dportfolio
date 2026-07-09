import ContactButton from "./ContactButton";

export default function Hero({
  showContact,
  onContactClick,
}: {
  showContact?: boolean;
  onContactClick?: () => void;
}) {
  return (
    <header className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
      {/* Signature: an organic clay blob sitting behind the headline, like a
          slab of clay the type has been pressed into. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-10 h-[420px] w-[420px] opacity-70 sm:-left-24"
        viewBox="0 0 400 400"
      >
        <path
          fill="#EDE9DE"
          d="M300.5,299 Q292,368 210,360 Q120,352 88,290 Q52,220 96,150 Q140,78 220,72 Q300,66 330,140 Q358,210 300.5,299 Z"
        />
      </svg>

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-soft">
            Selected Work — 2023 / 2026
          </p>
          {showContact && <ContactButton onClick={onContactClick!} />}
        </div>

        <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-7xl">
          Things I&apos;ve
          <br />
          <span className="italic text-accent">shaped</span> by hand.
        </h1>

        <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
          A working collection of interfaces, tools, and experiments — each
          one pressed, reworked, and fired until it held its form.
        </p>
      </div>
    </header>
  );
}