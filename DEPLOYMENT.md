# PANDUAN DEPLOYMENT KE VERCEL (DEPLOYMENT GUIDE)

Dokumen ini menjelaskan prosedur penerapan (*deployment*) aplikasi **E-Voting Kiosk** ke platform **Vercel** untuk produksi.

---

## 1. Prasyarat Deployment

- Akun GitHub / GitLab / Bitbucket yang menampung repositori proyek.
- Akun [Vercel](https://vercel.com) yang telah terhubung dengan penyedia Git Anda.
- Proyek Supabase yang telah dimigrasi skema database-nya dan memiliki akun admin aktif (lihat [SETUP.md](./SETUP.md)).

---

## 2. Struktur Konfigurasi Vercel

File konfigurasi [vercel.json](./vercel.json) telah disediakan di root proyek dengan spesifikasi:
- **Framework**: `vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Rewrites**: Mengarahkan seluruh rute dinamis (`/vote`, `/admin`, `/admin/candidates`, dll) ke `/index.html`.
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Static Asset Caching**: 1 tahun immutable cache untuk chunk JavaScript dan CSS.

---

## 3. Langkah-Langkah Deployment via Vercel Dashboard

### Langkah 3.1: Impor Proyek di Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard).
2. Tekan tombol **"Add New..."** > **"Project"**.
3. Pilih repositori Git `11. Pemilihan Jendral`.
4. Beri nama proyek Vercel, misalnya `evoting-pemilihan-jendral`.

### Langkah 3.2: Konfigurasi Proyek
Vercel akan mendeteksi framework `Vite` secara otomatis:
- **Build Command**: `npm run build` (atau kosongkan untuk default)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Langkah 3.3: Tambahkan Environment Variables
Pada bagian **Environment Variables**, tambahkan dua variabel produksi:

| Key | Value Contoh | Deskripsi |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://xxxxxx.supabase.co` | URL API Supabase Produksi |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anon Key (Public) |

> ⚠️ **CATATAN PENTING**:
> - Jangan masukkan `SUPABASE_SERVICE_ROLE_KEY` ke Vercel!
> - Pastikan value tidak memiliki spasi di awal atau akhir.
> - Centang target environment: **Production**, **Preview**, dan **Development**.

### Langkah 3.4: Deploy
1. Tekan tombol **"Deploy"**.
2. Tunggu proses build selesai (~1-2 menit).
3. Vercel akan menghasilkan URL resmi ber-HTTPS (misalnya: `https://evoting-pemilihan-jendral.vercel.app`).

---

## 4. Opsi Deployment Alternatif: Vercel CLI

Jika Anda memiliki akses terminal dengan Vercel CLI yang terautentikasi:

```bash
# 1. Login ke akun Vercel
npx vercel login

# 2. Tautkan proyek dan deploy preview
npx vercel

# 3. Deploy langsung ke produksi
npx vercel --prod
```

---

## 5. Checklist Verifikasi Pasca-Deployment

Setelah deployment selesai, lakukan pemeriksaan pada domain produksi:

- [ ] **Akses Halaman Utama / Bilik Suara (`/vote`)**:
  - Halaman dimuat melalui protokol HTTPS.
  - Logo institusi dan teks Bahasa Indonesia tampil tajam.
  - Lencana status menampilkan **"Resmi"** (bukan *Mode Demo*).
- [ ] **Akses Panel Login Admin (`/admin/login`)**:
  - Form login tampil rapi.
  - Lakukan login menggunakan akun panitia yang dibuat di Supabase.
  - Sesi login tersimpan dengan aman di browser.
- [ ] **Akses Rute Langsung (Direct Link Test)**:
  - Buka tab baru dan ketik langsung URL: `https://domain-anda.vercel.app/admin/settings`.
  - Pastikan tidak terjadi error `404 Not Found` (membuktikan SPA rewrite di `vercel.json` berfungsi).
- [ ] **Konektivitas Supabase Live**:
  - Pada dashboard overview admin, pastikan tertera lencana hijau **"Supabase Terhubung"**.
- [ ] **Inspeksi Console Browser**:
  - Buka Developer Tools (F12) > tab Console.
  - Pastikan tidak ada pesan error merah atau kebocoran kunci rahasia (*secret keys*).
