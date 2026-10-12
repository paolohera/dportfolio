"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useTripleSpacePress } from "@/hooks";
import type { ContactContent, Profile, Project, Service } from "@/types";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Navigation from "@/components/layout/Navigation";
import ProjectGrid from "@/components/projects/ProjectGrid";
import ServicesSection from "@/components/sections/ServicesSection";
import ContactSection from "@/components/sections/ContactSection";
import ContactModal from "@/components/contact/ContactModal";
import ClayButton from "@/components/ui/ClayButton";

// Loaded on demand so the chat never slows the first page load
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contactContent, setContactContent] = useState<ContactContent | null>(null);
  const [showContact, setShowContact] = useState(false);

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) setProjects(data as Project[]);
  }, []);

  const loadProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("id", "main")
      .single();

    if (!error && data) setProfile(data as Profile);
  }, []);

  const loadServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) setServices(data as Service[]);
  }, []);

  const loadContact = useCallback(async () => {
    const { data, error } = await supabase
      .from("contact_content")
      .select("*")
      .eq("id", "main")
      .single();

    if (!error && data) setContactContent(data as ContactContent);
  }, []);

  useEffect(() => {
    loadProjects();
    loadProfile();
    loadServices();
    loadContact();
  }, [loadProjects, loadProfile, loadServices, loadContact]);

  // Triple-space (or the hidden "Admin login" button) opens the dedicated admin page
  const handleTripleSpace = useCallback(() => {
    router.push("/admin");
  }, [router]);

  useTripleSpacePress(handleTripleSpace);

  return (
    <main className="relative min-h-screen">
      <Navigation />

      <Hero profile={profile} />

      <section id="about-section" className="mx-auto max-w-6xl border-b-2 border-line px-6 py-20">
        <About profile={profile} />
      </section>

      <section id="services-section" className="mx-auto max-w-6xl border-b-2 border-line px-6 py-20">
        <ServicesSection services={services} />
      </section>

      <section id="work-section" className="mx-auto max-w-6xl border-b-2 border-line px-6 py-20">
        <ProjectGrid projects={projects} name={profile?.name} />
      </section>

      <section id="contact-section" className="mx-auto max-w-6xl px-6 py-20">
        <ContactSection profile={profile} content={contactContent} />
      </section>

      {showContact && profile?.email && (
        <ContactModal
          fallbackEmail={profile.email}
          onClose={() => setShowContact(false)}
        />
      )}

      <footer className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-soft/70">
          <span>06 / end of file</span>
          <span>Built with Next.js &amp; Supabase.</span>
        </div>
      </footer>

      <ChatWidget ownerName={profile?.name?.split(" ")[0] || "Paolo"} />

      <ClayButton
        variant="ghost"
        size="sm"
        className="sr-only focus:not-sr-only fixed left-6 top-20 z-40"
        onClick={handleTripleSpace}
      >
        Admin login
      </ClayButton>
    </main>
  );
}