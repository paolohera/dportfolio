import Image from "next/image";
import type { Project } from "@/lib/types";
import TechBadge from "./TechBadge";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <article className="group grid grid-cols-1 gap-6 border-t-2 border-line py-8 sm:grid-cols-[160px,1fr] sm:gap-8">
      <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-line bg-paper-alt sm:aspect-square">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-ink-soft">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-ink-soft">
            {String(index).padStart(2, "0")}
          </span>
          <h3 className="font-display text-2xl font-black tracking-tight text-ink">
            {project.title}
          </h3>
        </div>

        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          {project.description}
        </p>

        {project.tags?.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TechBadge key={tag} name={tag} />
            ))}
          </ul>
        )}

        <div className="flex items-center gap-5 pt-1">
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
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
