# Checkpoint — 15 September 2026

Titik henti Admin Panel E-Library Universitas Pamulang. Ditulis agar pekerjaan dapat
dilanjutkan besok tanpa membaca ulang riwayat percakapan.

## Ringkas: di mana posisinya

Kodenya **selesai**. Ketujuh belas task rencana sudah dikerjakan, masing-masing lewat
gerbang review, lalu review menyeluruh seluruh branch menemukan enam temuan Important
yang seluruhnya sudah diperbaiki dan diverifikasi ulang. Pekerjaan sudah di-merge ke
`master` dan **sudah ter-push ke GitHub**.

Yang tersisa bukan kodenya, melainkan tiga hal yang membutuhkan akun Anda: Figma, Vercel,
dan Stitch.

| Hal | Status |
|---|---|
| Kode aplikasi, 17 task | Selesai, review bersih |
| Merge ke `master` | Selesai (`55bde7d`) |
| Push ke GitHub | Selesai, 42 commit |
| Dokumentasi Milestone 1 | Selesai, kecuali tautan Figma dan Stitch |
| Figma — design system | Selesai |
| Figma — dua layar High-Fidelity | **Belum**, terhenti kuota |
| Deploy Vercel | **Belum** |
| Wireframe Stitch | **Belum tersentuh** |

Repositori: <https://github.com/omangs007/Project_Pemrograman_web_2-E-Library->

## Cara menjalankan aplikasi

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const root=process.cwd();const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain'};http.createServer((req,res)=>{let p=decodeURIComponent(url.parse(req.url).pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));"
```

Buka `http://127.0.0.1:8123/index.html`, masuk dengan `admin@unpam.ac.id` / `admin123`.
`python -m http.server` gagal di mesin ini, karena itu dipakai server Node di atas.

## Menjalankan pengujian

| Suite | Perintah | Jumlah |
|---|---|---|
| Suite utama | buka `http://127.0.0.1:8123/tests/runner.html` | 60 |
| Harness sirkulasi | `node tests/page-peminjaman.check.cjs` | 6 |
| Harness form buku | `node tests/page-form-buku.check.cjs` | 5 |
| Harness regresi review akhir | `node tests/review-akhir.check.cjs` | 12 |

Seluruhnya hijau pada `master` saat checkpoint ini ditulis. Test runner peramban kini
memakai penyimpanan terisolasi, jadi menjalankannya tidak lagi menimpa data aplikasi.

---

## Yang membutuhkan Anda

### 1. Figma — dua layar High-Fidelity

File sudah dibuat dan design system-nya sudah berdiri:
<https://www.figma.com/design/mWdzokvX5gWuq22QAhlgux>

**Sudah jadi** di halaman `Design System`:

- 4 collection, 66 variable, seluruhnya ber-scope eksplisit dan ber-code-syntax memakai
  nama CSS asli dari kode (`var(--glass)`, `var(--muted)`, `var(--bg-a)`)
- 10 text style, 3 effect style
- 14 swatch warna semantik, spesimen tipografi, skala spasi dan radius
- 4 component set: `Button`, `Input`, `Badge`, `Card`

**Belum jadi:** halaman `Dashboard` dan `Data Buku` masih kosong. Keduanya adalah
High-Fidelity UI yang diminta Milestone 1.

**Satu cacat yang perlu diperbaiki:** properti TEXT pada tiga component set menimpa teks
tiap varian, sehingga ketiga Button bertuliskan "Hapus", ketiga Input "123", dan ketiga
Badge "Terlambat 13 hari". Badge hijau dan kuning karena itu salah makna. Cara
memperbaikinya beserta daftar teks yang benar ada di `docs/panduan-rakit-figma.md`.

**Kenapa berhenti:** kuota panggilan MCP Figma paket Starter habis. Paket itu membatasi
tiga hal sekaligus, dan ketiganya sempat mengubah rencana:

| Batasan Starter | Dampak |
|---|---|
| Variable dibatasi 1 mode | Light/Dark tidak bisa jadi mode variable; token diikat ke tema gelap |
| Maksimal 3 halaman | Rencana 10 halaman dipadatkan jadi Design System + dua layar |
| 20 panggilan MCP per bulan | Menghentikan pekerjaan; reset bulanan |

**Salah paham yang sudah terjawab:** field **Role: Education** di pengaturan akun Figma
BUKAN paket Education — itu hanya isian profesi. Paket Education diajukan terpisah lewat
figma.com/education dan butuh bukti status mahasiswa. Tanda paketnya sudah aktif: badge
di dekat Drafts tidak lagi bertuliskan **Free**, dan bagian **Your spaces** berisi space
Education. Sebelum kedua tanda itu muncul, `whoami` akan tetap melaporkan `starter`.

Autentikasi ulang MCP **tidak** memperbaiki ini; sudah dicoba empat kali dengan hasil
identik, termasuk setelah autentikasi dibersihkan total.

**Dua jalan ke depan.** Kalau paketnya nanti aktif, minta agen melanjutkan — state
lengkapnya tersimpan di scratchpad sesi (`ds-state.json`) berisi ID tiap component set,
sehingga design system tidak perlu diulang. Kalau tenggatnya dekat, rakit sendiri kedua
layar memakai `docs/panduan-rakit-figma.md`, yang memuat nilai layout persis dari
`style.css` dan isi tabel dari seed aplikasi.

Setelah selesai, **setel sharing file ke "Anyone with the link"** lalu isi slot
`[LINK FIGMA ANDA]` di `docs/perancangan.md`. Tautan yang tidak publik akan gagal dibuka
penilai.

### 2. Deploy Vercel

Belum dikerjakan. Setelah live, isi slot `[LINK VERCEL ANDA]` di `README.md`.

### 3. Wireframe dan user flow di Stitch

Belum tersentuh sama sekali, dan ini terpisah dari pekerjaan Figma. Panduan tugas
memintanya untuk Milestone 1. Slotnya `[SCREENSHOT STITCH]` di `docs/perancangan.md`.

### 4. Pertimbangkan identitas commit

Seluruh 42 commit tercatat atas nama akun lain, sementara repositorinya milik
`omangs007`. Push berhasil, jadi aksesnya tidak bermasalah — tetapi kontribusinya tidak
akan tertaut ke profil `omangs007` di halaman repo. Bila penilai memeriksa riwayat commit,
ini bisa menimbulkan pertanyaan. Mengubahnya berarti menulis ulang seluruh riwayat, jadi
keputusannya di Anda.

---

## Hal yang perlu diingat saat melanjutkan

**Git di mesin ini.** Config global menyetel `credential.helper = cache`, helper gaya
Linux yang tidak berfungsi di Windows dan memunculkan galat "unable to connect to cache
daemon". Repo ini sudah dialihkan ke `manager` lewat config **lokal**; setelan global
sengaja tidak disentuh. Peringatan cache daemon masih muncul sekali tiap push tetapi tidak
berpengaruh. Repositori lain di mesin ini masih akan mengalami masalah yang sama.

**Codex berbagi satu antrean.** Hanya satu job berjalan pada satu waktu. Dispatch baru
mengantre dengan selamat, tetapi `--resume` gagal cepat bila masih ada job lain berjalan.

**Agen forwarder yang tampak gagal belum tentu berhenti.** Satu gelombang perbaikan pernah
hidup kembali dan berjalan bersamaan dengan kiriman ulangnya, nyaris menerapkan enam
perbaikan dua kali ke berkas yang sama. Sebelum mengirim ulang pekerjaan yang MENULIS,
pastikan job lama benar-benar mati lewat daftar proses, bukan lewat berkas status —
berkas status terbukti basi setelah proses dimatikan paksa.

**Aturan warna yang berulang menjadi sumber cacat:** token tema untuk permukaan, border,
dan teks isi; nilai literal untuk warna yang membawa makna. Di blok cetak, hasil akhirnya
harus hitam di atas putih.

**Mengukur kontras harus memakai warna komposit.** Latar aplikasi ini gradien, sehingga
`backgroundColor` bernilai transparan di kedua tema; dan tint badge beralfa 0,16. Mengukur
langsung terhadap keduanya menghasilkan angka palsu. Rasio tepat 1,00 atau pola "semuanya
gagal" hampir selalu berarti alat ukurnya yang salah, bukan produknya.

**Tangkapan layar `fullPage` Playwright menyesatkan** pada halaman ini karena
`background-attachment: fixed`. Gunakan tangkapan per-viewport.

**Jangan menyimpan referensi elemen tabel melintasi aksi yang memicu render** — `DataTable`
menulis ulang seluruh `innerHTML`-nya. Query ulang setiap kali.

---

## Dokumen penting

| Berkas | Isi |
|---|---|
| `docs/perancangan.md` | Keluaran Milestone 1: hirarki menu, ER-D, user flow, design system |
| `README.md` | Cara menjalankan, struktur, kredensial demo, cara menguji |
| `docs/panduan-rakit-figma.md` | Panduan merakit dua layar High-Fidelity, nilai layout persis dari kode |
| `docs/keputusan-controller.md` | 38 keputusan yang diambil tanpa menunggu jawaban, beserta alasan dan biayanya bila keliru |
| `.superpowers/sdd/2026-09-14-elibrary-admin-panel/progress.md` | Ledger lengkap eksekusi; git-ignored |
| `.superpowers/sdd/2026-09-14-elibrary-admin-panel/review-akhir.md` | Laporan review menyeluruh seluruh branch |
