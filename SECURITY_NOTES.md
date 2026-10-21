# CATATAN ARSITEKTUR KEAMANAN (SECURITY NOTES)

Dokumen ini mendokumentasikan model ancaman (*threat model*), mekanisme perlindungan database, batasan sistem, dan analisis keamanan pada aplikasi **E-Voting Kiosk**.

---

## 1. Model Ancaman & Asumsi Keamanan

Sistem dirancang untuk pemilihan tunggal formal (*single-event election*) dengan kriteria:
- Jumlah pemilih: Kurang dari 100 orang.
- Metode pemungutan suara: **Anonim tanpa autentikasi individual pemilih** (tanpa login akun pemilih, PIN, NIK, atau kartu pemilih digital).
- Media pemungutan suara: **1 unit tablet touchscreen fisik**.

### Batasan Pengawasan Fisik (Physical Supervision Boundary)
Karena sistem sengaja tidak meminta identitas pemilih di layar bilik suara demi menjaga asas anonimitas mutlak, **pencegahan agar seseorang tidak mencoblos dua kali adalah tanggung jawab pengawasan fisik panitia di lokasi acara** (melalui meja registrasi fisik dan pemanggilan satu per satu). Sistem aplikasi tidak mengidentifikasi wajah atau biometrik pemilih.

---

## 2. Mekanisme Keamanan yang Diimplementasikan

### 2.1 Pencegahan Suara Ganda Teknis & Idempotensi Transaksi
- **ID Transaksi Unik (`request_id`)**: Setiap kali pemilih menekan tombol "MULAI VOTING", frontend menghasilkan UUID unik (`crypto.randomUUID()`).
- **Idempotensi Database**: RPC `submit_vote` memeriksa `request_id` pada tabel `votes` menggunakan penguncian baris (*row-level locking* `FOR UPDATE`).
  - Jika `request_id` dikirim ulang untuk kandidat yang sama (akibat koneksi lambat, *double tap*, atau *retry* otomatis browser), sistem mengembalikan status sukses tanpa menambah jumlah suara di database.
  - Jika `request_id` yang sama digunakan untuk kandidat berbeda, sistem **menolak transaksi** dengan galat `23505 (Unique Violation)`.
- **Pembersihan State**: Setelah suara sukses tercatat, seluruh state seleksi pemilih segera dihapus dari memori sebelum sesi kembali ke layar sambutan.

### 2.2 Kerahasiaan Hasil Pemilihan (Strict Result Confidentiality)
- **RLS Tabel Suara**: Akses `SELECT` langsung pada tabel `votes` diblokir sepenuhnya untuk peran publik (`anon`).
- **Pencegahan Kebocoran Parsial**: RPC `get_final_results` secara ketat memverifikasi status pemilihan di server PostgreSQL:
  ```sql
  IF v_status <> 'closed' THEN
      RETURN NULL;
  END IF;
  ```
  Tidak ada satupun pemilih, penonton, atau peretas yang dapat melihat jumlah suara kandidat sebelum pemilihan resmi ditutup oleh panitia.
- **Total Suara Administratif**: RPC `get_admin_total_votes` hanya mengembalikan angka agregat total suara masuk (`COUNT(*)`), tanpa mengelompokkan berdasarkan kandidat (`GROUP BY candidate_id`).

### 2.3 Keamanan Hak Akses Administrator (Admin Authorization)
- Autentikasi berbasis Supabase Auth dengan kata sandi terenkripsi (bcrypt).
- Verifikasi peran (*Role Verification*) dilakukan di tingkat database melalui fungsi `public.is_admin()`, yang memeriksa tabel `admin_users`.
- Pengubahan informasi kandidat dan pengaturan acara hanya diizinkan saat status pemilihan berada dalam fase **DRAFT** (`status = 'draft'`). Saat pemilihan **AKTIF** atau **DITUTUP**, modifikasi ditolak oleh RLS.
- Penutupan pemilihan bersifat permanen dan tidak dapat dibuka kembali (*immutable closure*).

### 2.4 Keamanan Bundle Frontend & Kredensial
- File bundle JavaScript publik **hanya berisi URL Supabase dan Anon Key**.
- **Service Role Key** tidak pernah dimasukkan ke dalam kode sumber, git, atau konfigurasi frontend.
- Rute bilik suara (`/vote`) tidak memiliki tautan navigasi atau rujukan ke halaman admin.
- Mode pengujian status acara (*developer status controls*) otomatis dinonaktifkan pada lingkungan produksi (`import.meta.env.PROD`).
- Jika konfigurasi Supabase tidak ditemukan pada lingkungan produksi, sistem voting menolak berjalan (*fail-closed*) dan tidak akan pernah diam-diam menyimpan suara ke mock data.

### 2.5 HTTP Security Headers (Vercel)
File `vercel.json` mengonfigurasi header proteksi:
- `X-Frame-Options: DENY` (mencegah *clickjacking*).
- `X-Content-Type-Options: nosniff` (mencegah *MIME sniffing*).
- `Referrer-Policy: strict-origin-when-cross-origin` (mencegah kebocoran URL referer).
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (membatasi akses perangkat keras yang tidak relevan).

---

## 3. Batasan Keamanan & Rekomendasi Mitigasi di Lapangan

| Risiko Potensial | Dampak | Rekomendasi Mitigasi Lapangan |
| :--- | :--- | :--- |
| Pemilih mencoba menekan tombol kembali pada tablet fisik. | Keluar dari aplikasi browser. | Aktifkan fitur **App Pinning (Android)** atau **Guided Access (iPad)** agar browser terkunci permanen pada layar pemilihan. |
| Orang yang sama mengantre kembali untuk mencoblos kedua kali. | Suara ganda oleh orang yang sama. | Panitia meja registrasi wajib memberikan tanda fisik (misalnya: tinta pemilu di jari kelingking atau pencoretan nama pada daftar hadir resmi). |
| Koneksi internet di lokasi acara terputus saat voting berjalan. | Pengiriman suara tertunda. | Tablet akan menampilkan pesan *"Koneksi terputus. Status suara belum dapat dipastikan..."*. ID sesi transaksi tetap utuh; panitia hanya perlu memastikan Wi-Fi terhubung kembali dan menekan tombol *"Coba Lagi"*. |
| Seseorang mencoba mengakses URL `/admin` dari tablet kiosk. | Akses ke halaman login admin. | Halaman admin dilindungi oleh autentikasi Supabase. Tanpa email dan password panitia yang sah, tidak ada aksi administratif yang dapat dieksekusi. Namun, panitia disarankan mengoperasikan panel admin dari laptop terpisah. |
