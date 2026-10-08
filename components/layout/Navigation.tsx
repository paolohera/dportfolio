"use client";

import { useEffect, useRef, useState } from "react";
import NavLink from "@/components/layout/NavLink";

export default function Navigation() {
  const [activeSection, setActiveSection] = useState("hero");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let newestActive = "hero";
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            if (id && id !== "hero") {
              newestActive = id.replace("section-", "");
            }
          }
        }
        if (activeSection !== newestActive) {
          setActiveSection(newestActive);
        }
      },
      {
        rootMargin: "-200px 0px 0px 0px",
        threshold: 0.1,
      }
    );

    const sections = document.querySelectorAll(
      '#about-section, #work-section, #services-section, #contact-section'
    );
    sections.forEach((section) => observer.observe(section));

    observerRef.current = observer;
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [activeSection]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-line bg-paper px-6 sm:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <span className="font-display text-xl font-black tracking-tight text-ink">
          Paolo Patigdas
        </span>

        <div className="hidden items-center gap-7 sm:flex">
          <NavLink
            href="#hero"
            active={activeSection === "hero"}
            onClick={() => setActiveSection("hero")}
          >
            Home
          </NavLink>
          <NavLink
            href="#about-section"
            active={activeSection === "about"}
            onClick={() => setActiveSection("about")}
          >
            About
          </NavLink>
          <NavLink
            href="#work-section"
            active={activeSection === "work"}
            onClick={() => setActiveSection("work")}
          >
            Work
          </NavLink>
          <NavLink
            href="#services-section"
            active={activeSection === "services"}
            onClick={() => setActiveSection("services")}
          >
            Services
          </NavLink>
          <NavLink
            href="#contact-section"
            active={activeSection === "contact"}
            onClick={() => setActiveSection("contact")}
          >
            Contact
          </NavLink>
        </div>

        <a
          href="#contact-section"
          className="hidden border-2 border-line px-4 py-1.5 text-sm font-medium text-ink shadow-brutal-sm brutal-press hover:bg-ink hover:text-paper sm:inline-block"
        >
          Get in touch
        </a>

        <button
          className="border-2 border-line px-3 py-1.5 text-sm font-medium text-ink sm:hidden"
          onClick={() => setActiveSection("hero")}
        >
          Menu
        </button>
      </div>
    </nav>
  );
}
