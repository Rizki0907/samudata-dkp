# SAMUDATA - Dashboard DKP Jawa Timur

Proyek ini adalah sistem dashboard kelautan dan perikanan Provinsi Jawa Timur, dibangun menggunakan arsitektur **Monorepo** (Frontend dengan React + Vite, Backend dengan Node.js + Express + Prisma).

## 🚀 Cara Memulai (Panduan Anggota Tim)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di laptop masing-masing:

### 1. Clone Repository
Buka terminal/Git Bash dan jalankan:
```bash
git clone https://github.com/Rizki0907/samudata-dkp.git
cd samudata-dkp
```

### 2. Setup Backend (Server)
Buka terminal pertama (khusus backend):
```bash
cd server
npm install
```
> **PENTING:** Anda membutuhkan file `.env` yang berisi URL koneksi ke Database Supabase. Silakan minta file `.env` ini kepada Rizki dan letakkan di dalam folder `server/`.

Jalankan server backend:
```bash
npm run dev
```

### 3. Setup Frontend (Client)
Buka terminal kedua (khusus frontend):
```bash
cd client
npm install
```
> **PENTING:** Anda juga membutuhkan file `.env` untuk frontend (biasanya berisi `VITE_API_URL`). Minta kepada Rizki dan letakkan di folder `client/`.

Jalankan server frontend:
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

---

## 📂 Pembagian Tugas Per Sektor

Jika Anda kebagian mengerjakan sektor tertentu (misal: *Budidaya*, *Garam*, *Ekspor*, dll), fokuskan pekerjaan Anda pada bagian berikut:

### Di Frontend (`client/`)
1. **Halaman Publik (Tampilan Chart & Data):**
   Buat/edit file di `client/src/pages/user/[SektorAnda].jsx`.
2. **Halaman Admin (Form Input/Tabel):**
   Buat/edit file di `client/src/pages/admin/Admin[SektorAnda].jsx`.
3. **Mengaktifkan Halaman Anda:**
   Buka file `client/src/router/index.jsx` dan ganti komponen `PlaceholderPage` pada sektor Anda dengan komponen yang baru saja Anda buat.

### Di Backend (`server/`)
Jika sektor Anda membutuhkan tabel tersendiri atau API tersendiri:
1. Tambahkan struktur tabel (Model) di `server/prisma/schema.prisma`.
2. Buat file controller di `server/src/controllers/`.
3. Buat file routes di `server/src/routes/` dan daftarkan di `server/src/app.js`.

> **Catatan:** Untuk fitur global seperti autentikasi, layouting, animasi, sidebar, dan final polish, akan di-*handle* langsung oleh Rizki. Jika ada error terkait environment atau dependensi, segera koordinasikan.
