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
              className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-line/40 text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {iconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt="" className="h-3.5 w-3.5" width={14} height={14} />
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
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] text-paper"
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
          className="field-input flex-1"
        />
        <button
          type="button"
          onClick={addCustom}
          className="brutal-press shrink-0 border-2 border-line bg-paper px-4 py-2 text-sm font-medium text-ink shadow-brutal-sm hover:bg-ink hover:text-paper"
        >
          Add
        </button>
      </div>
    </div>
  );
}
