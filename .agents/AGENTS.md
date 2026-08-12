# Deployment & Infrastructure (cPanel PPID)

## 1. Informasi Server CPanel
- **Domain Web Utama**: https://ppid.dkp.jatimprov.go.id
- **Sub-Direktori Samudera**: https://ppid.dkp.jatimprov.go.id/samudera
- **Endpoint API**: https://ppid.dkp.jatimprov.go.id/api
- **Username CPanel**: dkpppid (Password disimpan secara mandiri oleh tim)
- **Database Utama**: PostgreSQL (Localhost CPanel)

## 2. Arsitektur Deployment
Aplikasi Samudera di-deploy menggunakan teknik Reverse Proxy dan subfolder karena berjalan di atas Shared Hosting CPanel yang ketat:
- **Frontend (React/Vite)** diletakkan di `public_html/samudera`.
- **Backend (Node.js/Express)** diletakkan di folder luar publik (`~/samudera_app/server`) dan dijalankan di port 5000 menggunakan PM2.
- **Terowongan API (Reverse Proxy)** menggunakan `.htaccess` di folder `public_html/api` untuk menghubungkan traffic dari luar ke port 5000 secara aman.
*(Semua konfigurasi ini sudah tertanam di CPanel dan tidak perlu diulang dari nol saat update).*

## 3. Cara Update (Revisi) Aplikasi ke CPanel
Jika ada perubahan fitur di laptop lokal dan ingin diunggah ke CPanel PPID:

### A. Update Frontend (Tampilan Web)
1. Buka terminal lokal di folder `samudata/client`.
2. Pastikan file `.env` mengarah ke: `VITE_API_URL=https://ppid.dkp.jatimprov.go.id/api`.
3. Jalankan perintah: `npm run build`
4. ZIP seluruh isi folder `dist` yang baru terbentuk.
5. Kembalikan `.env` ke localhost untuk development lokal.
6. Buka File Manager CPanel.
7. Masuk ke folder `public_html/samudera`.
8. Hapus semua file lama di sana.
9. Upload dan Extract file ZIP yang baru. (Catatan: Error refresh 404 otomatis teratasi karena `client/public/.htaccess` sudah dibundel ke dalam build).

### B. Update Backend (Mesin/API/Database)
1. Pastikan kode backend terbaru sudah di-push ke Github.
2. Buka layar hitam Terminal di CPanel.
3. Masuk ke folder server: `cd ~/samudera_app/server`
4. Tarik kode terbaru dari Github: `git pull`
5. Jika ada instalasi library NPM baru: `npm install`
6. Jika ada perubahan skema database prisma: `npx prisma db push`
7. Jika ada perubahan master data, jalankan seeder: `node scripts/seedAllMasterData.js` (PENTING!)
8. Terapkan perubahan dengan me-restart PM2: `npx pm2 restart samudera-api`

## 4. Arsip Konfigurasi Penting (Jangan Dihapus)

### A. Konfigurasi .env Backend (CPanel)
```env
DATABASE_URL="postgresql://[USER_DB]:[PASSWORD_DB]@localhost:5432/[NAMA_DB]"
ADMIN_CABANG_CODE="SAMUDATA2026DKP"
ADMIN_PUSAT_CODE="SAMUDERA_PUSAT_2026"
JWT_SECRET="samudata-super-secret-key-2026-dkp-jatim"
JWT_EXPIRES_IN="8h"
PORT=5000
CLIENT_URL="https://ppid.dkp.jatimprov.go.id"
```

### B. Aturan Reverse Proxy API (`public_html/api/.htaccess`)
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:5000/api/$1 [P,L]
```

### C. Aturan SPA Routing Frontend (`public_html/samudera/.htaccess`)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /samudera/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /samudera/index.html [L]
</IfModule>
```

## 5. Catatan Penting Deployment & Server
- **Backend (Server)**: Backend berjalan di VPS/cPanel menggunakan proses **PM2** melalui akses terminal (`cd samudera_app/server`). JANGAN merekomendasikan penggunaan menu "Setup Node.js App" di cPanel.
- **Restart Backend**: Untuk merestart backend, selalu masuk ke direktori server (`cd samudera_app/server`) dan jalankan perintah `pm2 restart all` (atau `pm2 restart samudera-api`).
- **Frontend (Client)**: URL API *production* untuk frontend wajib mengarah ke `https://ppid.dkp.jatimprov.go.id/api`. Pastikan `VITE_API_URL` di file `.env.production` menggunakan URL tersebut sebelum melakukan *build*.
