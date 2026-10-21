# E-Voting Kiosk — Pemilihan Jendral & Dewan Kehormatan

Aplikasi pemungutan suara elektronik (*E-Voting Kiosk*) berbasis web yang elegan, aman, dan responsif. Dirancang khusus untuk pemilihan formal satu acara (*single-event election*) dengan **3 kandidat**, **<100 pemilih**, dan dioperasikan pada **1 unit tablet touchscreen fisik**.

---

## 🏛️ Karakteristik & Fitur Utama

- **Antarmuka Kiosk Tablet**: Alur pemilih 3 langkah (Pilih → Konfirmasi → Bukti Sah). Tampilan responsif landscape (*landscape-first*, 1280×800 & 1024×768) dan portrait (800×1280).
- **Kerahasiaan Suara Anonim**: Pemilih tidak memerlukan login/PIN/registrasi akun. Tidak ada hubungan antara identitas fisik pemilih dan baris suara di database.
- **Pencegahan Suara Ganda & Idempotensi Teknis**: Dilindungi UUID transaksi unik per sesi (`request_id`). Pengetukan ganda (*double tap*) atau percobaan berulang dengan kandidat berbeda ditolak tegas di level backend.
- **Kerahasiaan Hasil Pemilihan**: Hasil suara individu kandidat terkunci rapat (*strictly hidden*) selama masa voting aktif. Penghitungan suara hanya dapat diakses setelah status pemilihan resmi diubah menjadi **CLOSED** oleh Administrator.
- **Panel Administrator Lengkap**:
  - Otentikasi terenkripsi berbasis peran (*server-side verified*).
  - Manajemen informasi 3 kandidat (terkunci saat voting aktif/tutup).
  - Pengaturan nama acara & logo.
  - Pemantauan akumulasi jumlah total pemilih secara *real-time*.
  - Pengumuman pemenang format layar penuh (*Presentation Mode*) rasio 16:9 dengan animasi bertahap.
  - Ekspor Berita Acara resmi format **PDF (A4)** dan rekapitulasi data **Excel (XLSX)**.

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Ikonografi & Animasi**: Lucide React, Framer Motion.
- **Visualisasi & Ekspor**: Recharts, jsPDF, jspdf-autotable, SheetJS (xlsx).
- **Backend & Database**: Supabase (PostgreSQL 15+, Row Level Security, Security Definer RPCs, Storage).
- **Deployment**: Vercel (Edge Network, SPA routing rewrites, HTTP Security Headers).

---

## 📂 Struktur Proyek

```
11. Pemilihan Jendral/
├── public/                 # Favicon dan aset statis
├── src/
│   ├── components/
│   │   ├── admin/         # Komponen dashboard administrator
│   │   ├── common/        # Komponen UI inti (Button, Card, Logo, Modal)
│   │   └── kiosk/         # Komponen alur bilik suara pemilih
│   ├── context/           # ElectionContext (sinkronisasi state real-time)
│   ├── hooks/             # Custom React hooks (useElection, useAuth, useVoteSession)
│   ├── layouts/           # AdminLayout & KioskLayout
│   ├── lib/               # Supabase client, calculation utilities, storage helper
│   ├── pages/
│   │   ├── admin/         # Overview, Candidates, Settings, Results, Announcement, Login
│   │   └── VoteKioskPage.tsx # Halaman utama bilik suara
│   ├── services/          # Repositori & layanan (voting, election, candidate, auth, export)
│   └── types/             # Definisi TypeScript domain pemilihan
├── supabase/
│   └── migrations/        # Skema SQL, RLS policies, dan RPC security functions
├── tests/                 # Rangkaian pengujian otomatis (Phase 3, 4, 5)
├── vercel.json            # Konfigurasi rewrite SPA & HTTP security headers
├── SETUP.md               # Panduan instalasi dan inisialisasi lokal
├── DEPLOYMENT.md          # Panduan deployment produksi (Vercel & Supabase)
├── EVENT_CHECKLIST.md     # Prosedur operasional hari-H pemilihan
└── SECURITY_NOTES.md      # Panduan keamanan, audit RLS, dan mitigasi risiko
```

---

## 🚀 Panduan Memulai Cepat

1. **Instal dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173/vote` untuk bilik suara atau `http://localhost:5173/admin/login` untuk panel admin.

3. **Jalankan pengujian otomatis**:
   ```bash
   npx tsx tests/phase3_backend_security.ts
   npx tsx tests/phase4_results_export.ts
   npx tsx tests/phase5_e2e_verification.ts
   ```

4. **Verifikasi kompilasi produksi**:
   ```bash
   npm run build
   npm run lint
   ```

Lihat [SETUP.md](./SETUP.md) untuk konfigurasi Supabase lengkap dan [EVENT_CHECKLIST.md](./EVENT_CHECKLIST.md) untuk panduan hari acara.
# AuthenticVoting
