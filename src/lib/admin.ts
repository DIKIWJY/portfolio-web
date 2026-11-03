import type { SupabaseClient } from "@supabase/supabase-js";
import { PROJECT_STATUSES, type Experience, type Project } from "./types";
import { safeUrl, slugify } from "./format";
import { STORAGE_BUCKET } from "./supabase";

/** Pesan notifikasi memakai kode tetap (bukan teks dari URL) supaya aman. */
export const FLASH: Record<string, string> = {
  "project-created": "Proyek dibuat.",
  "project-saved": "Perubahan proyek disimpan.",
  "project-deleted": "Proyek dihapus.",
  "project-moved": "Urutan diperbarui.",
  "project-toggled": "Status proyek diperbarui.",
  "settings-saved": "Pengaturan disimpan.",
  "experience-created": "Pengalaman dibuat.",
  "experience-saved": "Perubahan pengalaman disimpan.",
  "experience-deleted": "Pengalaman dihapus.",
  "message-updated": "Pesan diperbarui.",
  "message-deleted": "Pesan dihapus.",
};

export type ProjectInput = Pick<
  Project,
  | "slug"
  | "title"
  | "summary"
  | "role"
  | "year"
  | "status"
  | "stack"
  | "repo_url"
  | "demo_url"
  | "problem"
  | "solution"
  | "result"
  | "featured"
  | "published"
>;

const str = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "")
    .trim()
    .slice(0, max);

export function parseProjectForm(fd: FormData): {
  values: ProjectInput;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = str(fd, "title", 120);
  if (!title) errors.title = "Judul wajib diisi.";

  const slug = slugify(str(fd, "slug", 80) || title);
  if (!slug) errors.slug = "Slug wajib diisi (huruf kecil, angka, dan tanda hubung).";

  const summary = str(fd, "summary", 280);

  const yearRaw = str(fd, "year", 4);
  let year: number | null = null;
  if (yearRaw) {
    year = Number(yearRaw);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.year = "Tahun harus antara 2000 dan 2100.";
      year = null;
    }
  }

  const statusRaw = str(fd, "status", 30);
  const status = (PROJECT_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : PROJECT_STATUSES[0];

  const stack = [
    ...new Set(
      str(fd, "stack", 400)
        .split(",")
        .map((s) => s.trim().slice(0, 30))
        .filter(Boolean),
    ),
  ].slice(0, 12);

  const repoRaw = str(fd, "repo_url", 300);
  const demoRaw = str(fd, "demo_url", 300);
  if (repoRaw && !safeUrl(repoRaw)) errors.repo_url = "Link harus diawali http:// atau https://.";
  if (demoRaw && !safeUrl(demoRaw)) errors.demo_url = "Link harus diawali http:// atau https://.";

  return {
    values: {
      slug,
      title,
      summary,
      role: str(fd, "role", 80),
      year,
      status,
      stack,
      repo_url: safeUrl(repoRaw) ?? "",
      demo_url: safeUrl(demoRaw) ?? "",
      problem: str(fd, "problem", 4000),
      solution: str(fd, "solution", 4000),
      result: str(fd, "result", 4000),
      featured: fd.get("featured") === "on",
      published: fd.get("published") === "on",
    },
    errors,
  };
}

/* ------------------------------ gambar ------------------------------ */

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function coverPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${STORAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? url.slice(i + marker.length).split("?")[0]! : null;
}

export async function uploadCover(
  supabase: SupabaseClient,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "Format gambar harus JPG, PNG, WebP, atau AVIF." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Ukuran gambar maksimal 4 MB." };

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) return { error: `Gagal mengunggah gambar: ${error.message}` };

  return {
    url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl,
  };
}

export async function removeCover(
  supabase: SupabaseClient,
  url: string | null | undefined,
) {
  const path = coverPath(url);
  if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

/* ------------------------------ proyek ------------------------------ */

export type SaveResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; values: ProjectInput; errors: Record<string, string> };

export async function saveProject(
  supabase: SupabaseClient,
  fd: FormData,
  existing: Project | null,
): Promise<SaveResult> {
  const { values, errors } = parseProjectForm(fd);

  const file = fd.get("cover");
  const hasNewFile = file instanceof File && file.size > 0;
  const wantsRemove = fd.get("remove_cover") === "on";

  let coverUrl = existing?.cover_url ?? null;
  let uploadedUrl: string | undefined;

  if (Object.keys(errors).length === 0 && hasNewFile) {
    const up = await uploadCover(supabase, file as File);
    if (up.error) errors.cover = up.error;
    else uploadedUrl = up.url;
  }
  if (Object.keys(errors).length > 0) return { ok: false, values, errors };

  if (uploadedUrl) coverUrl = uploadedUrl;
  else if (wantsRemove) coverUrl = null;

  let id = existing?.id ?? "";

  if (existing) {
    const { error } = await supabase
      .from("projects")
      .update({ ...values, cover_url: coverUrl })
      .eq("id", existing.id);
    if (error) {
      if (uploadedUrl) await removeCover(supabase, uploadedUrl);
      return {
        ok: false,
        values,
        errors: { form: dbMessage(error) },
      };
    }
  } else {
    // Proyek baru tampil paling atas.
    const { data: first } = await supabase
      .from("projects")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const sort_order = (first?.sort_order ?? 1) - 1;

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...values, cover_url: coverUrl, sort_order })
      .select("id")
      .single();
    if (error || !data) {
      if (uploadedUrl) await removeCover(supabase, uploadedUrl);
      return {
        ok: false,
        values,
        errors: { form: dbMessage(error) },
      };
    }
    id = data.id as string;
  }

  // Hapus gambar lama kalau sudah diganti atau dilepas.
  if (existing?.cover_url && existing.cover_url !== coverUrl) {
    await removeCover(supabase, existing.cover_url);
  }

  return { ok: true, id, created: !existing };
}

function dbMessage(error: { code?: string; message?: string } | null): string {
  if (error?.code === "23505") return "Slug sudah dipakai proyek lain. Ganti slug-nya.";
  if (error?.code === "42501") return "Akun ini tidak punya izin admin. Periksa email di fungsi is_admin().";
  return `Gagal menyimpan: ${error?.message ?? "kesalahan tidak diketahui"}`;
}

/** Geser baris satu posisi ke atas/bawah dengan menormalkan sort_order. */
export async function moveRow(
  supabase: SupabaseClient,
  table: "projects" | "experiences",
  id: string,
  dir: "up" | "down",
) {
  const { data } = await supabase
    .from(table)
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as { id: string; sort_order: number }[];
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;

  [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  await Promise.all(
    rows.map((r, idx) =>
      r.sort_order === idx
        ? null
        : supabase.from(table).update({ sort_order: idx }).eq("id", r.id),
    ),
  );
}

export const moveProject = (supabase: SupabaseClient, id: string, dir: "up" | "down") =>
  moveRow(supabase, "projects", id, dir);

/* ---------------------------- pengalaman ---------------------------- */

export type ExperienceInput = Pick<
  Experience,
  "role" | "company" | "location" | "period" | "is_current" | "summary" | "published"
>;

export function parseExperienceForm(fd: FormData): {
  values: ExperienceInput;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const values: ExperienceInput = {
    role: str(fd, "role", 120),
    company: str(fd, "company", 120),
    location: str(fd, "location", 80),
    period: str(fd, "period", 60),
    is_current: fd.get("is_current") === "on",
    summary: str(fd, "summary", 1500),
    published: fd.get("published") === "on",
  };
  if (!values.role) errors.role = "Posisi wajib diisi.";
  if (!values.company) errors.company = "Nama perusahaan atau organisasi wajib diisi.";
  return { values, errors };
}

export async function saveExperience(
  supabase: SupabaseClient,
  fd: FormData,
  existing: Experience | null,
): Promise<
  | { ok: true; id: string }
  | { ok: false; values: ExperienceInput; errors: Record<string, string> }
> {
  const { values, errors } = parseExperienceForm(fd);
  if (Object.keys(errors).length > 0) return { ok: false, values, errors };

  if (existing) {
    const { error } = await supabase.from("experiences").update(values).eq("id", existing.id);
    if (error) return { ok: false, values, errors: { form: dbMessage(error) } };
    return { ok: true, id: existing.id };
  }

  const { data: first } = await supabase
    .from("experiences")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const sort_order = (first?.sort_order ?? 1) - 1;

  const { data, error } = await supabase
    .from("experiences")
    .insert({ ...values, sort_order })
    .select("id")
    .single();
  if (error || !data) return { ok: false, values, errors: { form: dbMessage(error) } };
  return { ok: true, id: data.id as string };
}
