import Link from "next/link";

interface NavLinkProps extends React.LinkHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

export default function NavLink({
  children,
  href,
  active,
  onClick,
}: NavLinkProps & { children: React.ReactNode; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative inline-flex items-center py-1 text-sm font-medium transition-colors ${
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`absolute -bottom-1 left-0 h-[2px] w-full bg-accent transition-transform origin-left ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </Link>
  );
}
