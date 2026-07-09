import { getTechIconUrl } from "@/lib/techIcons";

export default function TechBadge({ name }: { name: string }) {
  const iconUrl = getTechIconUrl(name);

  return (
    <li
      title={name}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-bg shadow-clay-pressed"
    >
      <span className="sr-only">{name}</span>
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt=""
          aria-hidden
          className="h-5 w-5"
          width={20}
          height={20}
        />
      ) : (
        <span
          aria-hidden
          className="font-mono text-[10px] font-semibold uppercase text-ink-soft"
        >
          {name.slice(0, 2)}
        </span>
      )}
    </li>
  );
}