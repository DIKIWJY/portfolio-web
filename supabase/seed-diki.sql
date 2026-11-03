-- =====================================================================
-- Data awal portofolio: Diki (diambil dari CV_ATS_DIKI_3.pdf)
-- Cara pakai: jalankan supabase/schema.sql dulu, lalu tempel seluruh file
-- ini di Supabase -> SQL Editor -> New query -> Run.
-- Aman dijalankan ulang: pengaturan ditimpa, proyek diperbarui lewat slug,
-- pengalaman dengan perusahaan yang sama diganti. Data lain tidak disentuh.
-- Semua teks bisa diubah lagi dari /admin.
-- =====================================================================

insert into public.site_settings (id, full_name, headline, tagline, location, email, available, availability_note, about, highlights, skills)
values (
  1,
  'Diki',
  'Full-Stack Developer',
  'Saya membangun sistem informasi untuk kebutuhan nyata: memantau dokumen kredit di PT Pupuk Sriwidjaja, menggantikan pencatatan manual di dinas, dan mengelola data peserta sertifikasi.',
  'Palembang, Sumatera Selatan',
  '2230803169@radenfatah.ac.id',
  true,
  'Full-Stack / Web Developer',
  'Saya biasa mulai dari masalahnya, baru kodenya. Di Dinas Pendidikan Kota Palembang saya mewawancarai staf dan menggambar use case dan ERD sebelum membangun sistemnya. Di PT Pupuk Sriwidjaja saya merancang tampilan di Figma, lalu membangun backend Golang dan frontend Next.js.

Saya lulusan S1 Sistem Informasi UIN Raden Fatah Palembang (IPK 3.75), pernah memimpin Study Club Sistem Informasi sebagai Ketua Umum, dan meraih Juara Harapan 1 Hackathon PTKIN 2025. Saya terbuka untuk posisi full-stack atau web developer.',
  '[{"value": "3.75", "label": "IPK S1 Sistem Informasi"}, {"value": "4", "label": "Sistem informasi dibangun"}, {"value": "3", "label": "Instansi tempat kerja praktik"}, {"value": "2", "label": "Juara tingkat nasional 2025"}]'::jsonb,
  '[{"group": "Backend", "items": ["Golang", "Gin", "GORM", "Laravel", "CodeIgniter"]}, {"group": "Frontend", "items": ["Next.js", "React JS", "TypeScript", "JavaScript", "Tailwind CSS"]}, {"group": "Data & DevOps", "items": ["PostgreSQL", "Docker", "MinIO", "Git"]}, {"group": "Desain & Analisis", "items": ["Figma", "Draw.io", "Bizagi Modeler"]}]'::jsonb
)
on conflict (id) do update set
  full_name = excluded.full_name, headline = excluded.headline, tagline = excluded.tagline,
  location = excluded.location, email = excluded.email, available = excluded.available,
  availability_note = excluded.availability_note, about = excluded.about,
  highlights = excluded.highlights, skills = excluded.skills;

-- Pengalaman
delete from public.experiences where company in ('PT Pupuk Sriwidjaja Palembang','Dinas Pendidikan Kota Palembang','PUSTIPD','PUSTIPD (Pusat Teknologi Informasi dan Pangkalan Data)','Study Club Sistem Informasi');

insert into public.experiences (role, company, location, period, is_current, summary, published, sort_order) values
  ('Kerja Praktik Full-Stack Developer', 'PT Pupuk Sriwidjaja Palembang', 'Palembang', 'April 2026 - Juli 2026', false, 'Full-stack pada sistem monitoring SKBDN, dengan Golang di backend dan Next.js di frontend.', true, 1),
  ('Kerja Praktik Full-Stack Developer', 'Dinas Pendidikan Kota Palembang', 'Palembang', 'Juli 2025 - Agustus 2025', false, 'Membangun SI-KP, sistem berbasis web pengganti pencatatan manual peserta kerja praktik.', true, 2),
  ('Kerja Praktik Web Developer', 'PUSTIPD', 'Palembang', 'Oktober 2024 - April 2025', false, 'Landing page dan fitur admin untuk sistem informasi LSP, dengan PHP dan CodeIgniter.', true, 3),
  ('Ketua Umum', 'Study Club Sistem Informasi', 'UIN Raden Fatah Palembang', '', false, 'Memimpin Study Club Sistem Informasi sebagai Ketua Umum.', true, 4);

-- Proyek
insert into public.projects (slug, title, summary, role, year, status, stack, repo_url, demo_url, problem, solution, result, featured, published, sort_order) values
  ('sistem-monitoring-skbdn', 'Sistem Monitoring SKBDN', 'Sistem untuk memantau Surat Kredit Berdokumen Dalam Negeri (SKBDN) di PT Pupuk Sriwidjaja: data diperbarui real-time dan dokumen PDF tersimpan rapi.', 'Full-Stack Developer (kerja praktik)', 2026, 'Contributor', array['Golang','Gin','GORM','Next.js','TypeScript','Tailwind CSS','PostgreSQL','MinIO','Docker']::text[], '', '', 'Departemen Teknologi Informasi membutuhkan cara untuk memantau SKBDN beserta dokumen PDF-nya dalam satu sistem.', 'Backend Golang dengan Gin dan GORM di atas PostgreSQL, dan frontend Next.js dengan TypeScript dan Tailwind CSS. Dokumen PDF disimpan di MinIO. Login memakai JWT dengan password di-hash bcrypt, dan perubahan data sampai ke layar lewat WebSocket tanpa memuat ulang halaman. Tampilannya saya rancang dulu di Figma.', 'Seluruh layanan (backend, frontend, database, penyimpanan dokumen) berjalan lewat Docker Compose, dari perancangan sampai pengujian.', true, true, 1),
  ('si-kp-dinas-pendidikan', 'SI-KP Dinas Pendidikan', 'Sistem Informasi Kerja Praktik untuk Dinas Pendidikan Kota Palembang: pendaftaran online, absensi, laporan akhir, penilaian, sertifikat, dan export CSV.', 'Full-Stack Developer (kerja praktik)', 2025, 'Archived', array[]::text[], '', '', 'Peserta kerja praktik di Dinas Pendidikan Kota Palembang masih dicatat secara manual.', 'Saya mengumpulkan kebutuhan lewat observasi dan wawancara dengan staf, lalu merancang sistem dengan use case diagram, class diagram, dan ERD. Pengerjaannya memakai metode Rapid Application Development (RAD). Mahasiswa mendaftar online, absen, dan mengunggah laporan akhir. Admin menilai, menerbitkan sertifikat, memantau lewat dashboard, dan mengekspor data ke CSV.', 'Sistem berbasis web yang dirancang untuk menggantikan pencatatan manual peserta kerja praktik.', true, true, 2),
  ('sistem-informasi-lsp', 'Sistem Informasi LSP', 'Landing page dan fitur admin untuk mengelola data peserta pada sistem informasi Lembaga Sertifikasi Profesi (LSP) di PUSTIPD, dengan tampilan responsif.', 'Web Developer (kerja praktik)', 2024, 'Contributor', array['PHP','CodeIgniter','Bootstrap','JavaScript']::text[], '', '', '', 'Saya mengerjakan frontend yang responsif untuk landing page dan beberapa fitur admin pengelolaan peserta. Kodenya dikerjakan bersama tim langsung di server lewat SSH di VS Code, dengan PHP dan CodeIgniter di backend serta HTML, CSS, Bootstrap, dan JavaScript di frontend.', '', false, true, 3),
  ('sim-study-club', 'SIM Study Club (Skripsi)', 'Sistem informasi manajemen berbasis Laravel untuk study club, disusun sebagai skripsi S1 Sistem Informasi.', 'Full-Stack Developer (skripsi)', null, 'Archived', array['Laravel','PHP']::text[], '', '', '', 'Sistem informasi manajemen dengan framework Laravel untuk mengelola kegiatan study club.', '', false, true, 4)
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, role = excluded.role, year = excluded.year,
  status = excluded.status, stack = excluded.stack, problem = excluded.problem, solution = excluded.solution,
  result = excluded.result, featured = excluded.featured, published = excluded.published, sort_order = excluded.sort_order;

-- Tautan sosial
update public.site_settings set
  github_url = 'https://github.com/DIKIWJY/',
  linkedin_url = 'https://www.linkedin.com/in/diki-5603032b1/'
where id = 1;
