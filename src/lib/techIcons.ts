/** Peta nama teknologi (bebas ditulis) ke berkas ikon di /public/svg. */
const FILES: Record<string, string> = {
  astro: "astro",
  vue: "vue",
  vuejs: "vue",
  react: "react",
  reactjs: "react",
  typescript: "typeScript",
  ts: "typeScript",
  javascript: "javaScript",
  js: "javaScript",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  next: "next",
  nextjs: "next",
  node: "nodejs",
  nodejs: "nodejs",
  html: "HTML5",
  html5: "HTML5",
  css: "CSS3",
  css3: "CSS3",
  git: "git",
  supabase: "supabase",
  mysql: "mysql",
  bash: "bash",
  shell: "bash",
  vercel: "vercel",
};

export interface TechIcon {
  label: string;
  file: string;
}

/** Ambil teknologi yang punya ikon, tanpa duplikat, mempertahankan urutan. */
export function techIcons(names: string[]): TechIcon[] {
  const seen = new Set<string>();
  const out: TechIcon[] = [];
  for (const raw of names) {
    const key = raw.toLowerCase().replace(/[.\s-]/g, "");
    const file = FILES[key];
    if (file && !seen.has(file)) {
      seen.add(file);
      out.push({ label: raw, file });
    }
  }
  return out;
}
