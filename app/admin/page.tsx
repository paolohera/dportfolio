"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { ContactContent, Profile, Project, Service } from "@/types";
import AdminLoginModal from "@/components/admin/AdminLoginModal";
import AdminDashboard from "@/components/admin/AdminDashboard";

type AuthState = "loading" | "anon" | "admin";

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>("loading");
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contactContent, setContactContent] = useState<ContactContent | null>(null);

  // Ask Supabase to validate the session (not just trust what's in local storage)
  useEffect(() => {
    let active = true;

    async function check() {
      const { data, error } = await supabase.auth.getUser();
      if (active) setAuth(!error && data.user ? "admin" : "anon");
    }

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Never await Supabase calls directly inside this callback
      window.setTimeout(check, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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

  // Only fetch anything once we know this is a signed-in admin
  useEffect(() => {
    if (auth !== "admin") return;
    loadProjects();
    loadProfile();
    loadServices();
    loadContact();
  }, [auth, loadProjects, loadProfile, loadServices, loadContact]);

  if (auth === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center font-mono text-xs text-ink-soft">
        Checking access…
      </main>
    );
  }

  if (auth === "anon") {
    return (
      <main className="min-h-screen">
        <AdminLoginModal
          onClose={() => router.replace("/")}
          onSuccess={() => setAuth("admin")}
        />
      </main>
    );
  }

  return (
    <AdminDashboard
      projects={projects}
      profile={profile}
      services={services}
      contactContent={contactContent}
      onClose={() => router.push("/")}
      onRefresh={loadProjects}
      onRefreshProfile={loadProfile}
      onRefreshServices={loadServices}
      onRefreshContact={loadContact}
      onSignOut={async () => {
        await supabase.auth.signOut();
        router.replace("/");
      }}
    />
  );
}