-- ============================================================
-- Clay Portfolio — Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  demo_url text,
  repo_url text,
  tags text[] default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on every edit
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 2. ROW LEVEL SECURITY
alter table public.projects enable row level security;

-- Anyone (including anonymous visitors) can read projects — it's a public portfolio
drop policy if exists "Public can view projects" on public.projects;
create policy "Public can view projects"
  on public.projects for select
  to anon, authenticated
  using (true);

-- Only a logged-in (admin) user can create/edit/delete
drop policy if exists "Admin can insert projects" on public.projects;
create policy "Admin can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

drop policy if exists "Admin can update projects" on public.projects;
create policy "Admin can update projects"
  on public.projects for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin can delete projects" on public.projects;
create policy "Admin can delete projects"
  on public.projects for delete
  to authenticated
  using (true);

-- 3. STORAGE BUCKET FOR PROJECT IMAGES
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'project-images');

drop policy if exists "Admin can upload project images" on storage.objects;
create policy "Admin can upload project images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images');

drop policy if exists "Admin can update project images" on storage.objects;
create policy "Admin can update project images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-images');

drop policy if exists "Admin can delete project images" on storage.objects;
create policy "Admin can delete project images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images');

-- ============================================================
-- NOTE ON THE ADMIN ACCOUNT
-- This schema treats ANY authenticated user as the admin, because
-- the app is designed for a single owner. Create your one admin
-- account in: Dashboard -> Authentication -> Users -> Add user
-- (set "Auto Confirm User" to yes). Use that email + password to
-- log in via the triple-spacebar modal. Do not enable public
-- sign-ups for this project.
-- ============================================================
