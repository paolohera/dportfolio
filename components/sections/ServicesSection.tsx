"use client";

interface Service {
  title: string;
  description: string;
  includes: string[];
}

// Edit this list to change what shows up on the site.
const SERVICES: Service[] = [
  {
    title: "Web Development",
    description:
      "Fast, responsive websites and web apps built from scratch, from landing pages to full products.",
    includes: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    title: "Backend & APIs",
    description:
      "Server logic, authentication, and APIs that your frontend can rely on.",
    includes: ["Node.js", "Express", "REST APIs", "Auth"],
  },
  {
    title: "Database Design",
    description:
      "Clean schemas and queries that keep your data organized, secure, and quick to read.",
    includes: ["Supabase", "PostgreSQL", "MySQL", "Firebase"],
  },
  {
    title: "Content & Admin Systems",
    description:
      "Custom dashboards and CMS tools so you can update your own content without touching code.",
    includes: ["Admin dashboards", "CMS", "Role-based access"],
  },
  {
    title: "Deployment & Maintenance",
    description:
      "Getting your project live, keeping it online, and fixing or improving it after launch.",
    includes: ["Vercel", "Netlify", "Git workflow", "Bug fixes"],
  },
];

export default function ServicesSection() {
  return (
    <div>
      <p className="font-mono text-xs text-ink-soft">04 / services</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
        Services
      </h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        What I can build and take care of for you.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-[2px] border-2 border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <article key={service.title} className="flex flex-col bg-paper p-6">
            <p className="font-mono text-[11px] text-ink-soft">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-display text-xl font-black tracking-tight text-ink">
              {service.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {service.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {service.includes.map((item) => (
                <li
                  key={item}
                  className="border border-line px-2 py-1 font-mono text-[11px] text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}

        {/* Fills the empty sixth cell on desktop with a call to action */}
        <div className="flex flex-col justify-between bg-ink p-6 text-paper">
          <p className="font-display text-xl font-black tracking-tight">
            Have a project in mind?
          </p>
          <a
            href="#contact-section"
            className="brutal-press mt-6 inline-block self-start border-2 border-paper px-4 py-2 font-mono text-xs text-paper"
          >
            Get in touch
          </a>
        </div>
      </div>
    </div>
  );
}