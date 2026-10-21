# PANDUAN PENGATURAN & INSTALASI (SETUP GUIDE)

Dokumen ini menjelaskan langkah-langkah penyiapan lingkungan lokal dan konfigurasi backend Supabase untuk aplikasi **E-Voting Kiosk**.

---

## 1. Prasyarat Sistem

- **Node.js**: Versi 18.x atau lebih baru (disarankan Node.js 20+ LTS).
- **NPM**: Versi 9.x atau lebih baru.
- **Akun Supabase**: [Supabase](https://supabase.com) (gratis untuk 1 proyek acara).
- **Web Browser Modern**: Google Chrome, Microsoft Edge, atau Safari (disarankan Chrome untuk kiosk tablet).

---

## 2. Instalasi Dependensi Lokal

Klon repositori atau navigasikan ke direktori proyek, lalu jalankan:

```bash
npm install
```

---

## 3. Konfigurasi Backend Supabase

### Langkah 3.1: Buat Proyek Supabase
1. Masuk ke [Supabase Dashboard](https://app.supabase.com).
2. Tekan **"New Project"**.
3. Beri nama proyek, misalnya: `evoting-pemilihan-jendral`.
4. Pilih region terdekat (misal: `Singapore (ap-southeast-1)`).
5. Buat dan catat kata sandi database.

### Langkah 3.2: Eksekusi Migrasi Database
1. Pada menu navigasi Supabase, buka menu **SQL Editor**.
2. Buka file skema database proyek:
   `supabase/migrations/20261021_001_initial_schema.sql`
3. Salin seluruh konten file tersebut, tempel ke dalam SQL Editor Supabase, lalu tekan tombol **RUN**.
4. Skema akan membuat secara otomatis:
   - Tabel: `elections`, `candidates`, `votes`, `admin_users`, `kiosk_sessions`, `audit_logs`.
   - Kebijakan keamanan **Row Level Security (RLS)**.
   - Fungsi tersimpan aman (**Security Definer RPCs**): `submit_vote`, `get_final_results`, `get_admin_total_votes`, `start_election`, `close_election`.
   - Bucket Storage: `election-assets` dengan RLS unggah foto kandidat.

### Langkah 3.3: Daftarkan Administrator Pertama
1. Buka menu **Authentication** > **Users** di Supabase Dashboard.
2. Tekan **"Add user"** > **"Create user"**.
   - Email: `admin@pemilihan-jendral.id` (atau email resmi panitia).
   - Password: buat password kuat (minimal 8 karakter).
   - Pastikan opsi *Auto Confirm User* dicentang.
3. Buka **SQL Editor** dan daftarkan UUID pengguna tersebut ke tabel `admin_users`:
   ```sql
   INSERT INTO public.admin_users (auth_user_id, full_name, role)
   VALUES (
     'PASTE-USER-UUID-DARI-AUTH-DISINI',
     'Panitia Pemilihan Jendral',
     'superadmin'
   );
   ```

---

## 4. Konfigurasi Environment Variables

1. Buat file `.env` di root direktori proyek (salin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Isi kredensial dari menu **Project Settings > API** di Supabase:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   > ⚠️ **PERHATIAN KEAMANAN**: Hanya gunakan `anon` / `public` key pada file `.env`. **JANGAN PERNAH** memasukkan `service_role` key ke dalam frontend Vite!

---

## 5. Menjalankan Server Lokal

Jalankan perintah pengembang:
```bash
npm run dev
```

Akses rute aplikasi di browser:
- **Bilik Suara (Voting Kiosk)**: `http://localhost:5173/vote`
- **Panel Administrator**: `http://localhost:5173/admin/login`
- **Dashboard Ringkasan**: `http://localhost:5173/admin`
- **Layar Pengumuman Hasil (16:9)**: `http://localhost:5173/admin/announcement`

---

## 6. Verifikasi Pengujian

Jalankan 3 rangkaian pengujian otomatis untuk memvalidasi integritas sistem:

```bash
# Uji keamanan RPC & Idempotensi Backend (Phase 3)
npx tsx tests/phase3_backend_security.ts

# Uji kalkulasi hasil, penanganan seri, dan ekspor PDF/Excel (Phase 4)
npx tsx tests/phase4_results_export.ts

# Uji alur lengkap pemilih, status siklus pemilihan, dan proteksi duplikasi (Phase 5)
npx tsx tests/phase5_e2e_verification.ts
```

Pastikan seluruh pengujian menghasilkan output `0 FAILED`.
