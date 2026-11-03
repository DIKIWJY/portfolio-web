import { defineMiddleware } from "astro:middleware";
import {
  applyPendingCookies,
  createServerSupabase,
  isConfigured,
  type PendingCookie,
} from "./lib/supabase";

/**
 * Melindungi semua halaman /admin/*. Pengecekan memakai fungsi is_admin()
 * di database, jadi aturannya sama persis dengan RLS.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminArea) return next();

  // Admin tidak boleh di-cache oleh CDN atau browser.
  const withNoStore = (res: Response) => {
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  };

  if (!isConfigured) {
    if (pathname === "/admin/login") return withNoStore(await next());
    return context.redirect("/admin/login");
  }

  const pending: PendingCookie[] = [];
  const supabase = createServerSupabase(context.request, pending);
  context.locals.supabase = supabase;
  context.locals.user = null;

  // Semua respons admin melewati sini agar cookie sesi selalu terpasang.
  const finish = (res: Response) => applyPendingCookies(withNoStore(res), pending);

  if (pathname === "/admin/login") return finish(await next());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return finish(context.redirect("/admin/login"));

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return finish(context.redirect("/admin/login?error=forbidden"));
  }

  context.locals.user = user;
  return finish(await next());
});