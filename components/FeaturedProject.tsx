import Image from "next/image";
import type { Project } from "@/lib/types";
import TechBadge from "./TechBadge";

export default function FeaturedProject({ project }: { project: Project }) {
  return (
    <article className="group grid grid-cols-1 gap-0 overflow-hidden rounded-clay bg-clay-surface shadow-clay-raised sm:grid-cols-2">
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-clay-deep sm:aspect-auto">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-ink-soft">
            No image yet
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Latest piece
        </p>

        <h3 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
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

        <div className="flex items-center gap-3 pt-2">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-clay-sm bg-accent px-5 py-2.5 text-sm font-medium text-clay-surface shadow-clay-raised-sm transition-all duration-150 hover:bg-accent-dark active:scale-[0.98] active:shadow-clay-pressed"
            >
              View demo
              <span aria-hidden>→</span>
            </a>
          )}
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ink-soft underline decoration-clay-line underline-offset-4 hover:text-ink"
            >
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}