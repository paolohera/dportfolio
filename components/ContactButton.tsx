export default function ContactButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-clay-sm bg-accent px-5 py-2.5 text-sm font-medium text-clay-surface shadow-clay-raised-sm transition-all duration-150 hover:bg-accent-dark hover:-translate-y-0.5 active:scale-[0.98] active:shadow-clay-pressed"
    >
      Contact
      <span aria-hidden>→</span>
    </button>
  );
}