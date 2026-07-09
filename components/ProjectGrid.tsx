import type { Project } from "@/lib/types";
import ProjectCard from "./ProjectCard";
import FeaturedProject from "./FeaturedProject";
import Reveal from "./Reveal";

export default function ProjectGrid({
  projects,
  name,
}: {
  projects: Project[];
  name?: string | null;
}) {
  const [featured, ...rest] = projects;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-28">
      <Reveal className="mb-10">
        <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
          {name ? `Recent projects.` : "Recent projects."}
        </h2>
      </Reveal>

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl italic text-ink-soft">
            The shelf is empty — for now.
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-ink-soft/70">
            press space, space, space to add the first piece
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {featured && (
            <Reveal>
              <FeaturedProject project={featured} />
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((project, index) => (
                <Reveal key={project.id} delay={index * 80}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}