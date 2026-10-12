// Messenger-style "is typing" bubble. Rendered as the last item of a message list (<ul>).
// Squares instead of circles to match the portfolio's rectangular look.
export default function TypingIndicator({ name }: { name: string }) {
  return (
    <li className="flex min-w-0 flex-col items-start">
      <p className="mb-0.5 font-mono text-[11px] text-ink-soft">{name}</p>
      <p
        role="status"
        className="inline-flex items-center gap-1.5 border-2 border-line bg-paper px-3 py-3"
      >
        <span className="sr-only">{name} is typing</span>
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse bg-ink"
            style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
          />
        ))}
      </p>
    </li>
  );
}