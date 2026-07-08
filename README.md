# Clay Portfolio

A single-owner portfolio site with a claymorphism + minimalism visual style,
built with Next.js (App Router) and Supabase. Projects are public to view;
only you, the admin, can add/edit/delete them.

## How the admin login works

Press the **spacebar 3 times in quick succession** (within ~0.6s of each
other) anywhere on the page — a login modal appears. Log in with the single
admin account you create in Supabase, and you get an "Edit portfolio" button
plus full create/update/delete access. The gesture is ignored while typing in
a text field, so it won't interfere with normal use. There's also a
screen-reader/keyboard-accessible "Admin login" link (visually hidden, but
focusable via Tab) so the login isn't only reachable by the gesture.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and run
   it. This creates the `projects` table, the `project-images` storage
   bucket, and the row-level security policies (public read, admin-only
   write).
3. Go to **Authentication → Users → Add user**, create your one admin
   account (your email + a strong password), and set "Auto Confirm User" to
   yes. This is the only account that should exist — do not enable public
   sign-ups.
4. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with
the values from step 1.4.

## 3. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Press space-space-space to log in as admin
and add your first project.

## 4. Deploy

Any Next.js host works (Vercel is the easiest). Add the same two environment
variables in your host's dashboard, and you're done — Supabase handles the
database, auth, and image storage.

## Project structure

```
app/                 Routes, layout, global styles
components/           UI components (Hero, ProjectCard, AdminLoginModal, ...)
hooks/                useTripleSpacePress (gesture), useAdminAuth (session)
lib/                  Supabase client + shared types
supabase/schema.sql   Database schema, storage bucket, RLS policies
```

## Notes on security

- Row Level Security means writes are rejected by Supabase itself unless the
  request carries a valid session for your admin account — the frontend
  can't be tricked into writing without it.
- Image uploads go to a public storage bucket named `project-images`; only
  authenticated (admin) requests can upload/delete, everyone can view.
- Keep sign-ups disabled in Supabase Auth settings so no one else can create
  an account with write access.
