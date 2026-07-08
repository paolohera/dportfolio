import Image from "next/image";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-clay bg-clay-surface shadow-clay-raised transition-transform duration-200 ease-out hover:-translate-y-1">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-clay-deep">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-xs text-ink-soft">
            No image yet
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-7">
        <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
          {project.title}
        </h3>

        <p className="flex-1 text-[15px] leading-relaxed text-ink-soft">
          {project.description}
        </p>

        {project.tags?.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-clay-bg px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-soft shadow-clay-pressed"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 pt-1">
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
