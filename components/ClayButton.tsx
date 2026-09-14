"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "warm" | "danger";
  size?: "sm" | "md";
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-ink text-paper border-2 border-ink shadow-brutal hover:bg-accent hover:border-accent hover:shadow-brutal-accent",
  ghost:
    "bg-paper text-ink border-2 border-ink shadow-brutal-sm hover:bg-ink hover:text-paper",
  warm: "bg-accent text-paper border-2 border-accent shadow-brutal-accent hover:bg-accent-dark hover:border-accent-dark",
  danger:
    "bg-paper text-accent border-2 border-accent shadow-brutal-sm hover:bg-accent hover:text-paper",
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
      className={`brutal-press ${sizeClasses} font-medium tracking-tight disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
