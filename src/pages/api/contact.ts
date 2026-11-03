import type { APIRoute } from "astro";
import { getPublicClient } from "@/lib/supabase";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "Permintaan tidak valid." }, 400);
  }

  // Honeypot: bot biasanya mengisi kolom tersembunyi ini.
  if (typeof data.company === "string" && data.company.trim() !== "") {
    return json({ ok: true });
  }

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "").trim();

  if (!name || name.length > 120) return json({ ok: false, error: "Nama wajib diisi." }, 422);
  if (!EMAIL_RE.test(email) || email.length > 200)
    return json({ ok: false, error: "Email belum valid." }, 422);
  if (message.length < 5 || message.length > 4000)
    return json({ ok: false, error: "Pesan minimal 5 karakter." }, 422);

  const db = getPublicClient();
  if (!db) return json({ ok: false, error: "Form belum aktif." }, 503);

  const { error } = await db.from("messages").insert({ name, email, message });
  if (error) return json({ ok: false, error: "Pesan gagal dikirim. Coba lagi." }, 500);

  // Notifikasi email opsional lewat Resend. Gagal kirim tidak boleh membatalkan
  // pesan yang sudah tersimpan di database.
  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.CONTACT_TO_EMAIL;
  if (apiKey && to) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Portfolio <onboarding@resend.dev>",
          to: [to],
          reply_to: email,
          subject: `Pesan baru dari ${name.slice(0, 80).replace(/[\r\n]+/g, " ")}`,
          text: `Nama: ${name}\nEmail: ${email}\n\n${message}`,
        }),
      });
    } catch {
      /* abaikan: pesan tetap ada di /admin/messages */
    }
  }

  return json({ ok: true });
};
