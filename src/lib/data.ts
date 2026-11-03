import { getPublicClient } from "./supabase";
import type { Experience, Highlight, Project, SiteSettings, SkillGroup } from "./types";

/** Dipakai saat Supabase belum diatur atau tabel masih kosong. */
export const DEFAULT_SETTINGS: SiteSettings = {
  full_name: "Nama Anda",
  headline: "Software Developer",
  tagline: "Membangun aplikasi web yang rapi, cepat, dan mudah dirawat.",
  location: "",
  email: "",
  github_url: "",
  linkedin_url: "",
  cv_url: "",
  available: true,
  availability_note: "",
  about: "",
  highlights: [],
  skills: [],
};

/** Jaga-jaga kalau isi jsonb di database tidak sesuai bentuk yang diharapkan. */
export function cleanHighlights(raw: unknown): Highlight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => ({
      value: String(h?.value ?? "").trim().slice(0, 12),
      label: String(h?.label ?? "").trim().slice(0, 60),
    }))
    .filter((h) => h.value && h.label)
    .slice(0, 4);
}

export function cleanSkills(raw: unknown): SkillGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => ({
      group: String(g?.group ?? "").trim().slice(0, 40),
      items: (Array.isArray(g?.items) ? g.items : [])
        .map((i: unknown) => String(i).trim().slice(0, 30))
        .filter(Boolean)
        .slice(0, 16),
    }))
    .filter((g) => g.group && g.items.length > 0)
    .slice(0, 4);
}

export async function getSettings(): Promise<SiteSettings> {
  const db = getPublicClient();
  if (!db) return DEFAULT_SETTINGS;
  try {
    const { data } = await db
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      highlights: cleanHighlights(data.highlights),
      skills: cleanSkills(data.skills),
    } as SiteSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Project terbit, urut sesuai pengaturan admin. */
export async function getProjects(): Promise<Project[]> {
  const db = getPublicClient();
  if (!db) return [];
  try {
    const { data } = await db
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? []) as Project[];
  } catch {
    return [];
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  const db = getPublicClient();
  if (!db) return null;
  try {
    const { data } = await db
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as Project | null) ?? null;
  } catch {
    return null;
  }
}

/** Project unggulan tampil lebih dulu di beranda. */
export function featuredFirst(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
}

/** Pengalaman yang terbit, urut sesuai pengaturan admin. */
export async function getExperiences(): Promise<Experience[]> {
  const db = getPublicClient();
  if (!db) return [];
  try {
    const { data } = await db
      .from("experiences")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? []) as Experience[];
  } catch {
    return [];
  }
}
