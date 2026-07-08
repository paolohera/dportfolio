import type { Project } from "@/lib/types";
import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="font-display text-2xl italic text-ink-soft">
          The shelf is empty — for now.
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-ink-soft/70">
          press space, space, space to add the first piece
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-28 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  );
}
