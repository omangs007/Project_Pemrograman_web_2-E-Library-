# Sistem Informasi Perpustakaan Digital (E-Library)

Admin Panel berbasis Client-Side untuk pengelolaan perpustakaan **Universitas Pamulang**.

Mata Kuliah Pemrograman Web 2 — Tugas Ke-1 (Project-Based Learning).

## Ringkasan

Aplikasi ini adalah back-office perpustakaan yang berjalan sepenuhnya di peramban:
tanpa backend, tanpa basis data server, dan tanpa proses build. Data disimulasikan
dengan mock data JavaScript yang dipersistensi ke `localStorage`, sehingga operasi
tambah, ubah, dan hapus tetap bertahan setelah halaman dimuat ulang.

Tema visual yang diterapkan adalah **Glassmorphism**, dengan mode gelap sebagai
tampilan baku dan tombol untuk beralih ke mode terang.

## Menjalankan

Prasyarat: akses internet saat membuka aplikasi untuk memuat Tailwind, Chart.js, dan Google Fonts dari CDN; tanpa akses tersebut, halaman tampil tanpa gaya Tailwind, grafik tidak dimuat, dan font memakai cadangan lokal.

Jalankan perintah satu baris berikut di PowerShell dari akar proyek. Node.js diperlukan untuk server statis lokal ini; tidak perlu instalasi paket npm. Perintah disalin dari `docs/superpowers/CHECKPOINT.md` bagian "Cara menjalankan aplikasi":

```powershell
node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const root=process.cwd();const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain'};http.createServer((req,res)=>{let p=decodeURIComponent(url.parse(req.url).pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));"
```

Lalu buka `http://127.0.0.1:8123/index.html`.

### Akun demo

| Peran | Surel | Kata Sandi |
|---|---|---|
| Administrator | `admin@unpam.ac.id` | `admin123` |
| Pustakawan | `siti@unpam.ac.id` | `admin123` |

## Halaman

| Halaman | Berkas | Isi |
|---|---|---|
| Login | `index.html` | Masuk admin dengan validasi surel dan kata sandi |
| Dashboard | `pages/dashboard.html` | Empat kartu statistik, dua grafik, tiga panel ringkasan |
| Data Buku | `pages/data-buku.html` | Tabel koleksi dengan cari, saring, urut, dan hapus |
| Data Anggota | `pages/data-anggota.html` | Tabel keanggotaan dengan modal tambah dan ubah |
| Peminjaman | `pages/peminjaman.html` | Sirkulasi pinjam dan kembali, denda dihitung otomatis |
| Form Buku | `pages/form-buku.html` | Tambah dan ubah buku dengan validasi serta pratinjau sampul |
| Laporan | `pages/laporan.html` | Rekap periode, grafik, dan keluaran siap cetak |

Ada tujuh halaman pengguna pada tabel di atas: login di akar dan enam halaman fitur di `pages/`.

| Berkas pendukung | Fungsi |
|---|---|
| `pages/layout.html` | Template master Milestone 2 untuk kerangka halaman |

Pengembalian memakai halaman Peminjaman yang memiliki tab Peminjaman Aktif dan Riwayat.
Pengaturan berupa modal profil, tema, dan reset data demo yang dibuka melalui event
`bukapengaturan` dan ditangani `assets/js/page-pengaturan.js`.

## Teknologi

- HTML5 semantik
- Tailwind CSS 3 (Play CDN) untuk layout dan spacing
- CSS3 kustom untuk seluruh komponen, permukaan glass, dan stylesheet cetak
- JavaScript ES6+ tanpa framework
- Chart.js 4.4.1 untuk grafik
- `localStorage` untuk persistensi

## Struktur Proyek

```
├── index.html              Halaman login admin
├── docs/
│   ├── perancangan.md      Dokumentasi Milestone 1
│   └── design-system.html  Style guide hidup
├── assets/
│   ├── css/style.css       Token tema dan seluruh komponen
│   ├── js/                 config, data, store, ui, table, layout, page-*
│   └── img/
├── pages/                  Enam halaman fitur + layout.html (template master Milestone 2)
└── tests/runner.html       Pengujian logika, buka di peramban
```

### Modul JavaScript

| Berkas | Tanggung jawab |
|---|---|
| `assets/js/config.js` | Konfigurasi token Tailwind |
| `assets/js/data.js` | Seed data demo |
| `assets/js/store.js` | CRUD, persistensi, dan aturan sirkulasi |
| `assets/js/ui.js` | Modal, toast, validasi, format tampilan, serta daftar pilihan dan kalender kustom |
| `assets/js/table.js` | DataTable: cari, saring, urut, dan paginasi |
| `assets/js/layout.js` | Sidebar, navigasi, tema, dan sesi |
| `assets/js/page-login.js` | Validasi akun demo dan masuk |
| `assets/js/page-dashboard.js` | Statistik dan grafik dashboard |
| `assets/js/page-buku.js` | Daftar koleksi dan aksi buku |
| `assets/js/page-anggota.js` | Daftar serta modal tambah dan ubah anggota |
| `assets/js/page-peminjaman.js` | Pinjam, kembali, dan denda |
| `assets/js/page-form-buku.js` | Form tambah dan ubah serta pratinjau sampul |
| `assets/js/page-laporan.js` | Rekap periode, grafik, dan cetak |
| `assets/js/page-pengaturan.js` | Modal Pengaturan melalui event bukapengaturan |

## Data dan aturan bisnis

- Masa pinjam **7 hari**, denda **Rp1.000 per hari terlambat**, maksimal **3 buku per anggota** yang masih dipinjam.
- Kunci `localStorage`: `elibrary.db.v1` untuk data, `elibrary.session` untuk sesi, dan `elibrary.theme` untuk tema.
- ID memakai prefiks buku `BK`, anggota `AG`, kategori `KT`, peminjaman `PJ`, detail `DT`, denda `DN`, petugas `PT`, dengan nomor urut tiga digit (misalnya `BK001`).
- Login merupakan simulasi client-side, dan data disimpan pada peramban yang digunakan.

Dokumentasi Milestone 1 tersedia di [Perancangan](docs/perancangan.md).
[Design system hidup](docs/design-system.html) menampilkan token dan komponen.

## Pengujian

Buka `http://127.0.0.1:8123/tests/runner.html`. Runner memakai penyimpanan memori yang terisolasi dan tidak memengaruhi data aplikasi di localStorage. Suite utama berisi 60 tes yang menguji logika murni —
CRUD store, perhitungan denda, penyaringan tabel, dan validator — tanpa dependensi
apa pun. Seluruh tes harus berwarna hijau.

Dua harness tambahan dijalankan dari akar proyek:

```powershell
node tests/page-peminjaman.check.cjs
node tests/page-form-buku.check.cjs
```

Harness peminjaman memuat 6 pemeriksaan; harness form buku memuat 5 pemeriksaan.
Jumlah cakupan ini tidak menggantikan pemeriksaan hasil eksekusi masing-masing suite.

## Catatan

`cdn.tailwindcss.com` menampilkan peringatan "not for production" di console peramban.
Peringatan tersebut disengaja: Play CDN dipilih agar proyek dapat dijalankan dan
dikumpulkan tanpa proses build maupun paket npm; Node.js di atas hanya melayani berkas statis.

## Demo

- **Repositori:** <https://github.com/omangs007/Project_Pemrograman_web_2-E-Library->
- **Demo langsung:** <https://project-pemrograman-web-2-e-library.vercel.app>

Kedua tautan di atas sudah aktif. Demo di-deploy dari cabang `master` sebagai situs statis tanpa proses build, dan setiap push ke `master` memicu deploy ulang otomatis.
