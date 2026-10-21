# CHECKLIST OPERASIONAL HARI-H PEMILIHAN (EVENT-DAY CHECKLIST)

Petunjuk praktis untuk Panitia Pemilihan dalam mengoperasikan bilik suara tablet pada hari pelaksanaan acara.

---

## 🕒 FASE 1: PERSIAPAN SEBELUM ACARA (PRE-EVENT)

Lakukan tahapan ini minimal **1-2 jam sebelum** registrasi pemilih dibuka:

### 1.1 Persiapan Fisik & Perangkat Tablet
- [ ] **Koneksi Daya**: Hubungkan tablet ke pengisi daya (*charger*) dan pastikan indikator baterai 100%. Jangan biarkan tablet berjalan hanya dengan daya baterai.
- [ ] **Koneksi Jaringan**: Hubungkan tablet ke jaringan Wi-Fi acara yang stabil. Uji koneksi dengan memuat ulang halaman.
- [ ] **Pengaturan Kiosk / Kunci Layar**:
  - Pada Android: Aktifkan fitur **App Pinning / Kunci Layar Aplikasi** di menu *Settings > Security > App Pinning* agar pemilih tidak dapat membuka aplikasi lain atau keluar dari browser.
  - Pada iPad (iOS): Aktifkan **Guided Access** (*Akses Terpandu*) di menu *Settings > Accessibility > Guided Access*.
- [ ] **Nonaktifkan Gangguan**:
  - Matikan semua notifikasi aplikasi (WhatsApp, Email, Alarm, Kalender).
  - Atur kecerahan layar ke tingkat nyaman dan matikan mode hemat baterai (*Power Saving*).
  - Atur *Screen Timeout* ke maksimum atau gunakan fitur *Stay Awake while Charging*.

### 1.2 Verifikasi Data & Administrator
- [ ] **Login Administrator**: Buka laptop panitia (terpisah dari tablet pemilih) dan login ke panel admin (`/admin/login`).
- [ ] **Pemeriksaan 3 Kandidat**:
  - Buka menu **Manajemen Kandidat** (`/admin/candidates`).
  - Pastikan Nomor Urut 01, 02, dan 03 memiliki nama lengkap, gelar, visi, dan foto resmi yang benar.
- [ ] **Pastikan Database Bersih**:
  - Total suara yang tercatat harus **0 suara**.
  - Jika sebelumnya dilakukan simulasi pengujian dengan data uji coba, pastikan tabel `votes` di Supabase telah dikosongkan.
- [ ] **Buka Bilik Suara di Tablet**:
  - Buka URL bilik suara: `https://domain-anda.vercel.app/vote`.
  - Tekan tombol **Layar Penuh** (ikon persegi di pojok kanan bawah).
  - Pastikan layar bilik suara menampilkan status **"Bilik Suara Siap"** atau **"Voting Belum Dimulai"** sesuai instruksi panitia.

---

## 🗳️ FASE 2: SAAT VOTING BERLANGSUNG (DURING EVENT)

### 2.1 Pembukaan Resmi Pemilihan
- [ ] Ketua Panitia mengumumkan pembukaan pemungutan suara secara resmi di hadapan hadirin.
- [ ] Administrator menekan tombol **"Buka Pemilihan Sekarang"** pada Dashboard Laptop Admin.
- [ ] Status pemilihan di database berubah menjadi **AKTIF** (`active`). Bilik suara di tablet otomatis siap menerima pemilih.

### 2.2 Prosedur Pengawasan Pemilih di Bilik Suara
- [ ] **Panggilan Satu per Satu**: Pemilih dipanggil secara berurutan sesuai daftar hadir fisik panitia.
- [ ] **Kerahasiaan Pemilih**: Petugas pengawas berdiri pada jarak aman (minimal 2 meter) dari bilik suara untuk menjaga asas Langsung, Umum, Bebas, dan Rahasia (LUBER).
- [ ] **Alur Pemilih**:
  1. Pemilih mengetuk tombol **"MULAI VOTING"**.
  2. Pemilih memilih salah satu dari 3 kartu kandidat.
  3. Pemilih meninjau nama & foto kandidat, lalu mengetuk **"YA, KONFIRMASI PILIHAN"**.
  4. Layar menampilkan centang hijau sukses dan hitung mundur 5 detik.
  5. Pemilih meninggalkan bilik suara. Layar otomatis kembali ke halaman awal untuk pemilih berikutnya.
- [ ] **Monitoring Jumlah Total Suara**:
  - Panitia memantau angka akumulasi total suara di Dashboard Admin Laptop (`/admin`).
  - **Jaminan Kerahasiaan**: Sistem tidak akan pernah menampilkan perolehan suara masing-masing kandidat selama voting aktif. Angka yang terlihat hanyalah total pemilih yang telah menggunakan hak suaranya.

---

## 🏁 FASE 3: PENUTUPAN & PENGUMUMAN HASIL (POST-EVENT)

### 3.1 Penutupan Pemungutan Suara
- [ ] Setelah pemilih terakhir selesai atau batas waktu berakhir, Ketua Panitia menyatakan pemungutan suara selesai.
- [ ] Administrator menekan tombol **"Tutup Pemilihan Sekarang"** di Dashboard Admin Laptop.
- [ ] Sistem mengunci database secara permanen (*atomic closure*). Tidak ada suara baru yang dapat masuk setelah status berubah menjadi **CLOSED** (`closed`).
- [ ] Layar tablet bilik suara otomatis beralih menampilkan pesan resmi **"Voting Telah Ditutup"**.

### 3.2 Pencetakan & Pengunduhan Berita Acara
- [ ] Masuk ke menu **Hasil Akhir** (`/admin/results`).
- [ ] Tekan tombol **"Unduh Berita Acara (PDF)"**:
  - Sistem mengunduh dokumen resmi A4 lengkap dengan kop surat, tabel hasil, persentase 2 desimal, dan kolom tanda tangan Dewan Kehormatan.
  - Cetak dokumen PDF tersebut untuk ditandatangani oleh saksi dan ketua panitia.
- [ ] Tekan tombol **"Ekspor Data Excel (XLSX)"** untuk arsip tabulasi digital panitia.

### 3.3 Penayangan Pengumuman Pemenang (Proyektor / Layar Besar)
- [ ] Hubungkan laptop admin ke proyektor / videotron panggung utama.
- [ ] Tekan tombol **"Buka Mode Pengumuman (16:9)"** atau buka rute `/admin/announcement`.
- [ ] Masuk ke mode fullscreen browser (tekan `F11`).
- [ ] Gunakan **Mode A (Pengumuman Pemenang Dramatis)**:
  - Tampilkan hitung mundur pembukaan hasil.
  - Tampilkan kartu pemenang dengan sorotan emas (*gold highlight*) dan lencana pemenang.
- [ ] Beralih ke **Mode B (Tabel Rekapitulasi Lengkap)** untuk memperlihatkan rekapitulasi seluruh 3 kandidat secara transparan kepada seluruh peserta musyawarah.

---

## 🚨 PANDUAN PENANGANAN KENDALA (TROUBLESHOOTING)

| Gejala | Penyebab Kemungkinan | Solusi Cepat Panitia |
| :--- | :--- | :--- |
| Muncul pesan *"Koneksi terputus. Status suara belum dapat dipastikan..."* | Wi-Fi tablet terputus sesaat saat voter menekan tombol konfirmasi. | Periksa sinyal Wi-Fi tablet. Jangan segarkan (*refresh*) browser. Tekan tombol **"COBA LAGI SIMPAN SUARA"** (ID sesi transaksi tetap utuh sehingga suara tidak akan terhitung ganda). |
| Layar tablet keluar dari bilik suara ke halaman beranda Android/iPad. | Fitur App Pinning / Guided Access belum diaktifkan oleh panitia. | Buka kembali browser Chrome, masuk ke URL `/vote`, aktifkan kembali mode layar penuh dan aktifkan fitur App Pinning. |
| Total suara di laptop admin tidak bertambah setelah pemilih selesai. | Koneksi WebSocket real-time terputus di laptop admin. | Tekan tombol muat ulang (*Refresh Data*) di sudut kanan atas dashboard admin. Data di server tetap tersimpan aman. |
| Tombol Mulai Voting tidak merespons. | Pemilihan belum dibuka secara resmi oleh admin (masih status DRAFT). | Buka dashboard admin di laptop dan pastikan status telah diubah ke **AKTIF**. |
