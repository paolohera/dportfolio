"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTripleSpacePress } from "@/hooks/useTripleSpacePress";
import type { Profile, Project } from "@/lib/types";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Reveal from "@/components/Reveal";
import ProjectGrid from "@/components/ProjectGrid";
import AdminLoginModal from "@/components/AdminLoginModal";
import AdminDashboard from "@/components/AdminDashboard";
import ContactModal from "@/components/ContactModal";
import ClayButton from "@/components/ClayButton";

export default function Home() {
  const { isAdmin, signOut } = useAdminAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  useEffect(() => {
    loadProjects();
    loadProfile();
  }, [loadProjects, loadProfile]);

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
      <Hero
        showContact={!!profile?.email}
        onContactClick={() => setShowContact(true)}
      />
      <Reveal>
        <About profile={profile} />
      </Reveal>
      <ProjectGrid projects={projects} name={profile?.name} />

      {showHint && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-toast-in rounded-full bg-ink px-5 py-2.5 font-mono text-xs text-clay-surface shadow-clay-raised-sm">
          ● ● ● gesture recognized
        </div>
      )}

      {isAdmin && !showDashboard && (
        <button
          onClick={() => setShowDashboard(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-accent px-5 py-3 font-mono text-xs uppercase tracking-wide text-clay-surface shadow-clay-raised transition-transform hover:-translate-y-0.5 active:scale-95"
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
          onClose={() => setShowDashboard(false)}
          onRefresh={loadProjects}
          onRefreshProfile={loadProfile}
          onSignOut={async () => {
            await signOut();
            setShowDashboard(false);
          }}
        />
      )}

      <div className="relative mx-auto max-w-6xl px-6 pb-4">
        <svg
          aria-hidden
          className="pointer-events-none absolute -bottom-10 left-0 h-[220px] w-[220px] opacity-30"
          viewBox="0 0 400 400"
        >
          <path
            fill="#EDE9DE"
            d="M300.5,299 Q292,368 210,360 Q120,352 88,290 Q52,220 96,150 Q140,78 220,72 Q300,66 330,140 Q358,210 300.5,299 Z"
          />
        </svg>
        <p className="relative font-display text-xl italic text-ink-soft">
          — fired, and holding its form.
        </p>
      </div>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-4">
        <p className="font-mono text-[11px] text-ink-soft/60">
          Built with Next.js &amp; Supabase.
        </p>
      </footer>

      {!isAdmin && (
        <ClayButton
          variant="ghost"
          size="sm"
          className="sr-only focus:not-sr-only fixed left-6 top-6 z-40"
          onClick={handleTripleSpace}
        >
          Admin login
        </ClayButton>
      )}
    </main>
  );
}