import type { Project } from "@/lib/types";
import ProjectCard from "./ProjectCard";
import FeaturedProject from "./FeaturedProject";

export default function ProjectGrid({
  projects,
  name,
}: {
  projects: Project[];
  name?: string | null;
}) {
  const [featured, ...rest] = projects;

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">04 / work</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
        Recent projects
      </h2>

      {projects.length === 0 ? (
        <div className="mt-8 border-2 border-dashed border-line/40 py-16 text-center">
          <p className="font-display text-2xl font-black text-ink">
            The shelf is empty — for now.
          </p>
          <p className="mt-2 font-mono text-xs text-ink-soft/70">
            press space, space, space to add the first piece
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {featured && <FeaturedProject project={featured} />}

          {rest.length > 0 && (
            <div className="border-b-2 border-line">
              {rest.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
