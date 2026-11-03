/** "Sistem Informasi Kampus!" -> "sistem-informasi-kampus" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Pecah teks panjang menjadi paragraf (dipisah baris kosong). */
export function paragraphs(text?: string | null): string[] {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Hanya izinkan http(s) dan mailto. Mengembalikan null kalau tidak valid. */
export function safeUrl(value?: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (["http:", "https:", "mailto:"].includes(u.protocol)) return u.href;
  } catch {
    /* tidak valid */
  }
  return null;
}

export function formatDate(iso: string, locale = "id-ID"): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

/** Satu baris = satu poin. Baris kosong dibuang dan tanda "-" di awal dihapus. */
export function bullets(text?: string | null): string[] {
  return (text ?? "")
    .split(/\n+/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}
