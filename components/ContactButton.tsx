export default function ContactButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="brutal-press inline-flex items-center gap-2 border-2 border-line bg-ink px-4 py-2 text-sm font-medium text-paper shadow-brutal-sm hover:bg-accent hover:border-accent"
    >
      Send a message
    </button>
  );
}
