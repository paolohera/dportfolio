"use client";

import TechBadge from "./TechBadge";
import type { Profile } from "@/lib/types";

const CATEGORIES = {
  frontend: ["react", "vue", "svelte", "angular", "next.js", "nuxt", "svelte", "remix", "gatsby"],
  backend: ["node.js", "express", "django", "flask", "fastapi", "spring", "fastify", "koajs"],
  database: ["postgresql", "mysql", "mongoDB", "sqlite", "supabase", "firebase", "redis"],
  tools: ["docker", "kubernetes", "jenkins", "terraform", "circl", "github", "gitlab", "bitbucket"],
  deployment: ["vercel", "netlify", "aws", "gcp", "heroku", "digitalocean"],
};

export interface SkillsSectionProps {
  profile: Profile | null;
}

function categorizeTools(tools: string[]) {
  const categorized: Record<string, string[]> = {
    frontend: [],
    backend: [],
    database: [],
    tools: [],
    deployment: [],
  };

  tools.forEach((tool) => {
    const lower = tool.toLowerCase().replace(/\s+/g, "");
    let category = "tools";

    if (CATEGORIES.frontend.some((f) => f === lower)) category = "frontend";
    else if (CATEGORIES.backend.some((b) => b === lower)) category = "backend";
    else if (CATEGORIES.database.some((d) => d === lower)) category = "database";
    else if (CATEGORIES.deployment.some((d) => d === lower)) category = "deployment";

    categorized[category].push(tool);
  });

  return categorized;
}

export default function SkillsSection({ profile }: SkillsSectionProps) {
  if (!profile || profile.tools.length === 0) return null;

  const categories = categorizeTools(profile.tools);
  const order = ["frontend", "backend", "database", "tools", "deployment"];
  const visible = order.filter((key) => categories[key].length > 0);

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">03 / skills</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
        Skills
      </h2>

      {visible.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-[2px] border-2 border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {visible.map((key) => {
            const items = categories[key];
            return (
              <div key={key} className="bg-paper p-5">
                <p className="font-mono text-[11px] text-ink-soft mb-3 capitalize">
                  {key}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {items.map((tool) => (
                    <TechBadge key={tool} name={tool} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}