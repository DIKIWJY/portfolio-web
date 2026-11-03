import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
export const STORAGE_BUCKET = "project-images";

/** false saat .env belum diisi: situs publik tetap tampil dengan data bawaan. */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let publicClient: SupabaseClient | null = null;

/** Client tanpa sesi login, dipakai untuk halaman publik (hanya data terbit). */
export function getPublicClient(): SupabaseClient | null {
  if (!isConfigured) return null;
  publicClient ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

export type PendingCookie = {
  name: string;
  value: string;
  options: Parameters<typeof serializeCookieHeader>[2];
};

/**
 * Client yang membaca/menulis sesi login lewat cookie (untuk area admin).
 *
 * Cookie sesi tidak ditulis lewat Astro.cookies, karena Supabase bisa
 * menuliskannya setelah respons mulai dikirim (error "ResponseSentError").
 * Sebagai gantinya cookie ditampung di `pending`, lalu dipasang ke header
 * Set-Cookie oleh middleware (lihat applyPendingCookies).
 */
export function createServerSupabase(
  request: Request,
  pending: PendingCookie[],
): SupabaseClient {
  return createServerClient(SUPABASE_URL!, SUPABASE_KEY!, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
          (c) => ({ name: c.name, value: c.value ?? "" }),
        );
      },
      setAll(list) {
        for (const c of list) pending.push(c);
      },
    },
  });
}

export function applyPendingCookies(res: Response, pending: PendingCookie[]) {
  for (const { name, value, options } of pending) {
    res.headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
  }
  pending.length = 0;
  return res;
}