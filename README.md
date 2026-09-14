# Sistem Informasi Manajemen Kepegawaian & Keuangan

Aplikasi terpadu Kepegawaian & Keuangan ASN dengan integrasi Google Spreadsheet, ekspor Excel (.xlsx) dan PDF resmi BKN / instansi.

---

## 🚀 Panduan Deploy ke GitHub Pages

Aplikasi ini telah dikonfigurasi secara lengkap untuk dapat di-online-kan melalui **GitHub Pages** dengan 2 metode:

### Metode 1: Deploy Otomatis via GitHub Actions (Rekomendasi ⭐)

Konfigurasi workflow CI/CD otomatis telah disediakan di `.github/workflows/deploy.yml`.

1. **Export / Push Project ke GitHub Repository**:
   - Jika menggunakan menu Google AI Studio: Pilih menu **Export** -> **Export to GitHub** (atau hubungkan repository GitHub Anda).
   - Atau via Git CLI:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - Sistem Kepegawaian & Keuangan"
     git branch -M main
     git remote add origin https://github.com/USERNAME/NAMA-REPO.git
     git push -u origin main
     ```

2. **Aktifkan GitHub Pages**:
   - Buka repositori Anda di GitHub: `https://github.com/USERNAME/NAMA-REPO`
   - Klik tab **Settings** > **Pages** (di menu sebelah kiri).
   - Pada bagian **Build and deployment** > **Source**, pilih **GitHub Actions**.
   - Selesai! Setiap kali Anda melakukan push ke branch `main`, GitHub Actions akan otomatis melakukan build dan mempublikasikan aplikasi ke alamat:
     `https://USERNAME.github.io/NAMA-REPO/`

---

### Metode 2: Deploy Cepat via Terminal (CLI `gh-pages`)

Package `gh-pages` telah terpasang dan terkonfigurasi pada `package.json`.

1. Jalankan perintah deploy:
   ```bash
   npm run deploy
   ```
2. Perintah ini akan otomatis:
   - Menjalankan `npm run build` untuk mengompilasi file produksi ke folder `dist/`.
   - Mengunggah folder `dist/` ke branch `gh-pages` pada repository GitHub Anda.
3. Pada tab **Settings** > **Pages** di repository GitHub, pastikan Source disetel ke **Deploy from a branch** dengan branch **`gh-pages`** / root (`/`).

---

## ⚙️ Fitur Konfigurasi yang Telah Disiapkan:

- **Relative Base Asset Path (`base: './'`)**: Memastikan seluruh berkas CSS, Javascript, dan aset gambar dapat dimuat dengan sempurna baik pada subpath repository (`https://username.github.io/repo-name/`) maupun domain khusus (*custom domain*).
- **GitHub Actions Workflow (`.github/workflows/deploy.yml`)**: Otomatisasi proses build dan publikasi setiap ada pembaruan kode.
- **SPA Fallback Routing (`public/404.html`)**: Mencegah tampilan blank / error 404 saat pengguna me-refresh halaman pada GitHub Pages.
- **Script NPM**: `"predeploy": "npm run build"` dan `"deploy": "gh-pages -d dist"`.
