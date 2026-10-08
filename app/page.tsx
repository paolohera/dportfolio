"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAdminAuth, useTripleSpacePress } from "@/hooks";
import type { ContactContent, Profile, Project, Service } from "@/types";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Navigation from "@/components/layout/Navigation";
import ProjectGrid from "@/components/projects/ProjectGrid";
import ServicesSection from "@/components/sections/ServicesSection";
import ContactSection from "@/components/sections/ContactSection";
import AdminLoginModal from "@/components/admin/AdminLoginModal";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ContactModal from "@/components/contact/ContactModal";
import ClayButton from "@/components/ui/ClayButton";

export default function Home() {
  const { isAdmin, signOut } = useAdminAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contactContent, setContactContent] = useState<ContactContent | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showHint, setShowHint] = useState(false);
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

  const handleTripleSpace = useCallback(() => {
    if (isAdmin) {
      setShowDashboard(true);
    } else {
      setShowLogin(true);
    }
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 1400);
  }, [isAdmin]);

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

      {showHint && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-toast-in border-2 border-line bg-ink px-5 py-2.5 font-mono text-xs text-paper shadow-brutal-sm">
          ● ● ● gesture recognized
        </div>
      )}

      {isAdmin && !showDashboard && (
        <button
          onClick={() => setShowDashboard(true)}
          className="brutal-press fixed bottom-6 right-6 z-40 border-2 border-line bg-accent px-5 py-3 font-mono text-xs text-paper shadow-brutal"
        >
          Edit portfolio
        </button>
      )}

      {showContact && profile?.email && (
        <ContactModal
          fallbackEmail={profile.email}
          onClose={() => setShowContact(false)}
        />
      )}

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setShowDashboard(true);
          }}
        />
      )}

      {showDashboard && (
        <AdminDashboard
          projects={projects}
          profile={profile}
          services={services}
          contactContent={contactContent}
          onClose={() => setShowDashboard(false)}
          onRefresh={loadProjects}
          onRefreshProfile={loadProfile}
          onRefreshServices={loadServices}
          onRefreshContact={loadContact}
          onSignOut={async () => {
            await signOut();
            setShowDashboard(false);
          }}
        />
      )}

      <footer className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-soft/70">
          <span>06 / end of file</span>
          <span>Built with Next.js &amp; Supabase.</span>
        </div>
      </footer>

      {!isAdmin && (
        <ClayButton
          variant="ghost"
          size="sm"
          className="sr-only focus:not-sr-only fixed left-6 top-20 z-40"
          onClick={handleTripleSpace}
        >
          Admin login
        </ClayButton>
      )}
    </main>
  );
}