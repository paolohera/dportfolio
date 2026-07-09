"use client";

import { useState } from "react";
import { getTechIconUrl } from "@/lib/techIcons";

const CURATED_TOOLS = [
  "Next.js",
  "React",
  "Vue.js",
  "Node.js",
  "Supabase",
  "SQLite",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "HTML",
  "CSS",
  "Firebase",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Docker",
  "Python",
  "PHP",
  "Java",
  "GraphQL",
  "Express",
  "Figma",
  "Git",
  "GitHub",
  "AWS",
  "Vercel",
  "Netlify",
];

export default function TechStackPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const extras = value.filter((v) => !CURATED_TOOLS.includes(v));

  function toggle(name: string) {
    if (value.includes(name)) {
      onChange(value.filter((v) => v !== name));
    } else {
      onChange([...value, name]);
    }
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed || value.includes(trimmed)) {
      setCustomInput("");
      return;
    }
    onChange([...value, trimmed]);
    setCustomInput("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CURATED_TOOLS.map((tool) => {
          const selected = value.includes(tool);
          const iconUrl = getTechIconUrl(tool);
          return (
            <button
              key={tool}
              type="button"
              onClick={() => toggle(tool)}
              aria-pressed={selected}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-all ${
                selected
                  ? "bg-accent text-clay-surface shadow-clay-pressed"
                  : "bg-clay-bg text-ink-soft shadow-clay-raised-sm hover:text-ink"
              }`}
            >
              {iconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconUrl}
                  alt=""
                  className="h-3.5 w-3.5"
                  width={14}
                  height={14}
                />
              )}
              {tool}
            </button>
          );
        })}
      </div>

      {extras.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {extras.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggle(tool)}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-clay-surface shadow-clay-pressed"
            >
              {tool}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Other — type and press Enter"
          className="clay-input flex-1"
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-clay-sm bg-clay-bg px-4 py-2 text-sm font-medium text-ink-soft shadow-clay-raised-sm hover:text-ink"
        >
          Add
        </button>
      </div>
    </div>
  );
}