import type { Project } from "@/types";
import FeaturedProject from "@/components/projects/FeaturedProject";
import ProjectCarousel from "@/components/projects/ProjectCarousel";

export default function ProjectGrid({
  projects,
  name,
}: {
  projects: Project[];
  name?: string | null;
}) {
  const featuredProjects = projects.filter((p) => p.is_featured);

  return (
    <div>
      

      <p className="font-mono text-xs text-ink-soft">03 / work</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
        Recent Accomplishments
      </h2>

      {featuredProjects.length > 0 && (
        <div className="mb-14">
          <ProjectCarousel projects={featuredProjects} />
        </div>
      )}
      
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
          {projects.map((project, index) => (
            <FeaturedProject
              key={project.id}
              project={project}
              label={
                index === 0
                  ? "Latest — 00"
                  : String(index).padStart(2, "0")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}