"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "warm" | "danger";
  size?: "sm" | "md";
}

const variantStyles: Record<string, string> = {
  primary: "bg-clay-surface text-ink hover:text-accent",
  ghost: "bg-transparent text-ink-soft hover:text-ink shadow-none hover:shadow-clay-raised-sm",
  warm: "bg-warm text-clay-surface hover:bg-warm-dark",
  danger: "bg-clay-surface text-warm-dark hover:text-warm-dark",
};

export default function ClayButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ClayButtonProps) {
  const sizeClasses = size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";

  return (
    <button
      className={`${sizeClasses} rounded-clay-sm font-medium tracking-tight shadow-clay-raised-sm transition-all duration-150 ease-out active:shadow-clay-pressed active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
