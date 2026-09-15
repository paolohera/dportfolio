"use client";

import { ReactNode } from "react";
import { maskEmail } from "@/lib/utils/email";

export default function EmailLink({
  email,
  className,
  children,
}: {
  email: string;
  className?: string;
  children?: ReactNode;
}) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    window.location.href = `mailto:${email}`;
  }

  return (
    <a href="#" onClick={handleClick} className={className}>
      {children ?? maskEmail(email)}
    </a>
  );
}