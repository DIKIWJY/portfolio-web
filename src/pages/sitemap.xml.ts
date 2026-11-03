import type { APIRoute } from "astro";
import { getProjects } from "@/lib/data";

/** Sitemap dinamis: beranda, daftar proyek, dan tiap studi kasus yang terbit. */
export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const projects = await getProjects();

  const entries = [
    { loc: `${origin}/`, lastmod: undefined as string | undefined },
    { loc: `${origin}/projects`, lastmod: undefined },
    ...projects.map((p) => ({
      loc: `${origin}/projects/${p.slug}`,
      lastmod: p.updated_at,
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""}</url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
