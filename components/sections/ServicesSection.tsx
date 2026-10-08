"use client";

import type { Service } from "@/types";

export interface ServicesSectionProps {
  services: Service[];
}

export default function ServicesSection({ services }: ServicesSectionProps) {
  const visible = services
    .filter((s) => s.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (visible.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">04 / services</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
        Services
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        What I can build and take care of for you.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-[2px] border-2 border-line bg-line md:grid-cols-3">
        {visible.map((service) => (
          <article key={service.id} className="flex flex-col bg-paper p-6">
            {service.number && (
              <p className="font-mono text-[11px] text-ink-soft">
                {service.number}
              </p>
            )}
            <h3 className="mt-2 font-display text-xl font-black tracking-tight text-ink">
              {service.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {service.description}
            </p>
            {service.tags?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {service.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-line px-2 py-1 font-mono text-[11px] text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}