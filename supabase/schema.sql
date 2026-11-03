-- =====================================================================
-- Skema database portfolio (Supabase / PostgreSQL)
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel
-- seluruh isi file ini -> Run.
--
-- WAJIB: ganti email di fungsi is_admin() di bawah dengan email akun
-- admin Anda (email yang sama dengan user yang dibuat di
-- Authentication -> Users). Hanya email itu yang boleh mengubah data.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Siapa yang boleh jadi admin
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = lower('GANTI_DENGAN_EMAIL_ADMIN_ANDA@gmail.com'),
    false
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Trigger updated_at
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Pengaturan situs (selalu 1 baris)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id           smallint primary key default 1 check (id = 1),
  full_name    text not null default 'Nama Anda',
  headline     text not null default 'Software Developer',
  tagline      text not null default 'Membangun aplikasi web yang rapi, cepat, dan mudah dirawat.',
  location     text not null default '',
  email        text not null default '',
  github_url   text not null default '',
  linkedin_url text not null default '',
  cv_url       text not null default '',
  available    boolean not null default true,
  availability_note text not null default '',
  about        text not null default '',
  highlights   jsonb not null default '[]'::jsonb,
  skills       jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Aman dijalankan ulang: menambah kolom baru bila tabel sudah ada dari versi sebelumnya.
alter table public.site_settings add column if not exists available boolean not null default true;
alter table public.site_settings add column if not exists availability_note text not null default '';
alter table public.site_settings add column if not exists about text not null default '';
alter table public.site_settings add column if not exists highlights jsonb not null default '[]'::jsonb;
alter table public.site_settings add column if not exists skills jsonb not null default '[]'::jsonb;

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. Project
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title       text not null check (char_length(title) between 1 and 120),
  summary     text not null default '' check (char_length(summary) <= 280),
  role        text not null default '',
  year        smallint check (year is null or year between 2000 and 2100),
  status      text not null default 'Deployed',
  stack       text[] not null default '{}',
  repo_url    text not null default '',
  demo_url    text not null default '',
  problem     text not null default '',
  solution    text not null default '',
  result      text not null default '',
  cover_url   text,
  featured    boolean not null default false,
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_order_idx on public.projects (published, sort_order, created_at desc);

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4b. Pengalaman (kerja, magang, organisasi, freelance)
-- ---------------------------------------------------------------------
create table if not exists public.experiences (
  id          uuid primary key default gen_random_uuid(),
  role        text not null check (char_length(role) between 1 and 120),
  company     text not null check (char_length(company) between 1 and 120),
  location    text not null default '',
  period      text not null default '',
  is_current  boolean not null default false,
  summary     text not null default '' check (char_length(summary) <= 1500),
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists experiences_order_idx on public.experiences (published, sort_order, created_at desc);

drop trigger if exists trg_experiences_updated on public.experiences;
create trigger trg_experiences_updated
  before update on public.experiences
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 5. Pesan dari form kontak
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200 and email like '%_@_%._%'),
  message    text not null check (char_length(message) between 5 and 4000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_created_idx on public.messages (created_at desc);

-- ---------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.projects      enable row level security;
alter table public.experiences   enable row level security;
alter table public.messages      enable row level security;

-- site_settings: semua orang boleh baca, hanya admin yang boleh ubah
drop policy if exists "settings read"   on public.site_settings;
drop policy if exists "settings write"  on public.site_settings;
create policy "settings read"  on public.site_settings for select to anon, authenticated using (true);
create policy "settings write" on public.site_settings for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects: pengunjung hanya melihat yang terbit, admin melihat semua
drop policy if exists "projects read"   on public.projects;
drop policy if exists "projects write"  on public.projects;
create policy "projects read"  on public.projects for select to anon, authenticated using (published or public.is_admin());
create policy "projects write" on public.projects for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- experiences: sama seperti projects
drop policy if exists "experiences read"  on public.experiences;
drop policy if exists "experiences write" on public.experiences;
create policy "experiences read"  on public.experiences for select to anon, authenticated using (published or public.is_admin());
create policy "experiences write" on public.experiences for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- messages: pengunjung hanya boleh mengirim, admin yang membaca/mengelola
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages admin"  on public.messages;
create policy "messages insert" on public.messages for insert to anon, authenticated with check (is_read = false);
create policy "messages admin"  on public.messages for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Storage untuk gambar project (publik dibaca, hanya admin yang unggah)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images', 'project-images', true, 4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project images read"   on storage.objects;
drop policy if exists "project images insert" on storage.objects;
drop policy if exists "project images update" on storage.objects;
drop policy if exists "project images delete" on storage.objects;

create policy "project images read"   on storage.objects for select to anon, authenticated using (bucket_id = 'project-images');
create policy "project images insert" on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and public.is_admin());
create policy "project images update" on storage.objects for update to authenticated using (bucket_id = 'project-images' and public.is_admin());
create policy "project images delete" on storage.objects for delete to authenticated using (bucket_id = 'project-images' and public.is_admin());
