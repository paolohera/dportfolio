import { getTechIconUrl } from "@/lib/utils/techIcons";

export default function TechBadge({ name }: { name: string }) {
  const iconUrl = getTechIconUrl(name);

  return (
    <li
      title={name}
      className="inline-flex h-9 items-center gap-1.5 border border-line/40 bg-paper px-2.5 font-mono text-[11px] text-ink-soft"
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" aria-hidden className="h-4 w-4" width={16} height={16} />
      ) : null}
      {name}
    </li>
  );
}
