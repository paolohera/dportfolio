"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/types";
import TechBadge from "@/components/skills/TechBadge";

const SWIPE_THRESHOLD_PX = 50;

function projectLink(project: Project): string | null {
  return project.demo_url || project.repo_url || null;
}

function CoverflowCard({
  project,
  interactive,
}: {
  project: Project;
  interactive: boolean;
}) {
  const link = projectLink(project);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden border-2 border-line bg-paper-alt shadow-brutal">
      {project.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image_url}
          alt={project.title}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            No image yet
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-xl font-black leading-tight text-paper [text-shadow:0_2px_6px_rgba(0,0,0,0.5)] sm:text-2xl">
          {project.title}
        </h3>


        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={interactive ? 0 : -1}
            onClick={(e) => {
              if (!interactive) e.preventDefault();
            }}
            className="brutal-press mt-4 inline-flex items-center border-2 border-paper/70 bg-paper/95 px-4 py-2 text-xs font-medium text-ink shadow-brutal-sm hover:bg-accent hover:border-accent hover:text-paper"
          >
            visit →
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const count = projects.length;
  const touchStartX = useRef<number | null>(null);

  // Keep the index valid if the underlying list changes (e.g. a project
  // gets unpinned while it's the one currently showing).
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  function goTo(next: number) {
    setIndex(((next % count) + count) % count);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      goTo(index + (delta < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-soft">
          Featured
          {count > 1 &&
            ` — ${String(index + 1).padStart(2, "0")} / ${String(count).padStart(
              2,
              "0"
            )}`}
        </p>

        {count > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Previous featured project"
              className="brutal-press border-2 border-line bg-paper px-3 py-1.5 text-sm text-ink shadow-brutal-sm hover:bg-ink hover:text-paper"
            >
              ←
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Next featured project"
              className="brutal-press border-2 border-line bg-paper px-3 py-1.5 text-sm text-ink shadow-brutal-sm hover:bg-ink hover:text-paper"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Mobile: coverflow tilt doesn't hold up at narrow widths, so just
          show the active card full-width with swipe support. */}
      <div
        className="mt-4 max-w-sm md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <CoverflowCard project={projects[index]} interactive />
      </div>

      {/* Desktop: true coverflow — active card centered and facing
          forward, neighbors tilted away in 3D perspective. */}
      <div
        className="relative mt-4 hidden min-h-[420px] md:block"
        style={{ perspective: "1600px" }}
      >
        {projects.map((project, i) => {
          // Shortest signed distance from the active slide, wrapping
          // around the ends so navigation always spins the short way.
          let offset = i - index;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;

          const abs = Math.abs(offset);
          const isActive = offset === 0;

          const style: React.CSSProperties = {
            transform: `translate(-50%, -50%) translateX(${
              offset * 62
            }%) translateZ(${-abs * 180}px) rotateY(${
              offset * -45
            }deg) scale(${isActive ? 1 : 0.78})`,
            opacity: abs > 2 ? 0 : isActive ? 1 : 0.55 - abs * 0.15,
            zIndex: count - abs,
            transition:
              "transform 550ms cubic-bezier(0.22, 1, 0.36, 1), opacity 550ms ease",
            pointerEvents: abs <= 2 ? "auto" : "none",
          };

          return (
            <div
              key={project.id}
              className="absolute left-1/2 top-1/2 w-[280px]"
              style={style}
              onClickCapture={(e) => {
                if (!isActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  goTo(i);
                }
              }}
            >
              <CoverflowCard project={project} interactive={isActive} />
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {projects.map((project, i) => (
            <button
              key={project.id}
              onClick={() => goTo(i)}
              aria-label={`Go to ${project.title}`}
              aria-current={i === index}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? "bg-accent" : "bg-line/30 hover:bg-line/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}