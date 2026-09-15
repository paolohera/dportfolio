import Image from "next/image";
import type { Project } from "@/types";
import TechBadge from "@/components/skills/TechBadge";

export default function FeaturedProject({
  project,
  label = "Latest — 00",
}: {
  project: Project;
  label?: string;
}) {
  return (
    <article className="group grid grid-cols-1 border-2 border-line sm:grid-cols-2">
      <div className="relative aspect-[16/11] w-full overflow-hidden border-b-2 border-line bg-paper-alt sm:aspect-auto sm:border-b-0 sm:border-r-2">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-ink-soft">
            No image yet
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
        <p className="font-mono text-[11px] text-accent">{label}</p>

        <h3 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
          {project.title}
        </h3>

        <p className="text-[15px] leading-relaxed text-ink-soft">
          {project.description}
        </p>

        {project.tags?.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TechBadge key={tag} name={tag} />
            ))}
          </ul>
        )}

        <div className="flex items-center gap-5 pt-2">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-press border-2 border-line bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-brutal-sm hover:bg-accent hover:border-accent"
            >
              View demo
            </a>
          )}
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
            >
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}