# Portofolio dengan Admin Panel (Astro + Supabase)

Situs portofolio berbasis template **DarkMinimal** (MIT) yang dikembangkan menjadi aplikasi SSR:

- Beranda, daftar proyek, dan halaman studi kasus per proyek, semua dibaca dari Supabase.
- Admin panel di `/admin` (login, CRUD proyek + upload gambar sampul, kotak masuk pesan, pengaturan profil).
- Form kontak menyimpan pesan ke database.
- Siap deploy ke Vercel.

## 1. Menjalankan di komputer

Butuh Node.js 20+ dan pnpm.

```bash
corepack enable
pnpm install
cp .env.example .env     # lalu isi, lihat langkah 2
pnpm dev                 # http://localhost:4321
```

Tanpa `.env`, situs publik tetap jalan dengan data bawaan, tetapi admin belum bisa dipakai.

## 2. Menyiapkan Supabase (sekali saja)

1. Buat project di [supabase.com](https://supabase.com) (gratis).
2. **Authentication → Users → Add user → Create new user.** Isi email dan password Anda, centang *Auto Confirm User*. Ini akun admin.
3. **Authentication → Sign In / Providers → Email:** matikan *Allow new users to sign up* supaya orang lain tidak bisa mendaftar.
4. Buka `supabase/schema.sql`, **ganti `GANTI_DENGAN_EMAIL_ADMIN_ANDA@gmail.com`** dengan email dari langkah 2, lalu tempel seluruh isinya di **SQL Editor → New query → Run**.
5. **Project Settings → API:** salin *Project URL* dan *anon public key* ke `.env`:

```
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Jangan pernah memakai `service_role` key di project ini.

6. Jalankan `pnpm dev`, buka `http://localhost:4321/admin`, masuk, lalu isi **Profil**, tambah **Pengalaman**, dan proyek pertama.

> Sudah pernah menjalankan `schema.sql` sebelumnya? Jalankan ulang file yang sama. Isinya idempotent, jadi aman dan hanya menambah kolom/tabel baru (ketersediaan, angka sorotan, skill, pengalaman).

### Yang dilihat HRD di halaman utama

Semua diisi dari admin, tidak perlu mengubah kode:

- **Profil → Ketersediaan:** badge hijau "Open to work" beserta posisi yang Anda incar.
- **Profil → Angka sorotan:** maksimal 4 angka di kartu hero. Isi hanya angka yang benar dan bisa Anda jelaskan saat wawancara.
- **Profil → Tentang & Skill:** paragraf singkat dan kelompok skill. Logo teknologi di hero dibuat otomatis dari skill dan stack proyek Anda.
- **Pengalaman:** magang, freelance, atau pekerjaan sebelumnya. Satu poin per baris. Bagian ini hilang otomatis jika kosong.
- **Profil → Link CV:** memunculkan tombol Download CV di hero dan menu.

### Tampilan

- Tampilan utama gelap. Tombol matahari/bulan di pojok kanan atas mengganti ke tema terang, dan pilihannya tersimpan di browser pengunjung.
- Warna tema ada sebagai variabel di bagian atas `src/layouts/Layout.astro` (blok `:root` untuk gelap dan `:root[data-theme="light"]` untuk terang). Ganti `--sec` untuk mengubah warna aksen.
- Animasi: muncul saat scroll (kelas `rv`), cahaya kursor di kartu proyek (kelas `spot`), angka sorotan menghitung naik, dan garis progres scroll. Semua mati otomatis bagi pengunjung yang memilih "reduce motion".

## 3. Deploy ke Vercel

1. Push project ke GitHub.
2. Di [vercel.com](https://vercel.com) pilih **Add New → Project**, impor repo-nya. Framework Astro terdeteksi otomatis.
3. Tambahkan dua Environment Variable yang sama dengan `.env` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`), lalu **Deploy**.
4. Setelah punya domain, tambahkan di Vercel **Settings → Domains**.

Perubahan dari admin tampil di situs dalam hitungan detik (cache CDN 15 detik).

## Keamanan

- Semua halaman `/admin/*` dijaga middleware yang memanggil fungsi `is_admin()` di database, aturannya sama dengan Row Level Security.
- Data hanya bisa diubah oleh email admin. Pengunjung hanya bisa membaca proyek yang terbit dan mengirim pesan.
- Form kontak memakai honeypot anti-bot dan validasi panjang di server dan database.
- Link yang dimasukkan lewat admin hanya boleh `http(s)`.

## Struktur penting

```
supabase/schema.sql        skema, RLS, storage
src/middleware.ts          proteksi /admin
src/lib/                   supabase client, data publik, logika admin
src/pages/admin/           login, ringkasan, proyek, pengalaman, pesan, profil
src/pages/projects/        daftar dan studi kasus publik
src/pages/api/contact.ts   penerima form kontak
src/components/            bagian halaman publik
```

## Yang masih bisa Anda ubah langsung di kode

- Peta nama skill ke logo ada di `src/lib/techIcons.ts`.
- Teks tetap seperti "My work" dan "Let's talk" ada di komponen di `src/components/`.

## Lisensi

Template asli © Andres Hernandez, lisensi MIT (lihat `LICENSE`). Pemberitahuan hak cipta itu harus tetap disertakan.

## Font

Judul memakai **Lora** (serif, SIL OFL) lewat kelas `.display`, teks memakai **Montserrat**. Keduanya ada di `public/fonts`.
Untuk mengganti font judul, ubah satu baris `--font-display` di `src/layouts/Layout.astro` (dan `@font-face`-nya).
Judul yang ingin tetap sans-serif cukup tidak diberi kelas `display`.
