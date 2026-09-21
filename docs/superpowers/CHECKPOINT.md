# Checkpoint — 21 September 2026

Titik henti Admin Panel E-Library Universitas Pamulang. Ditulis agar pekerjaan dapat
dilanjutkan besok tanpa membaca ulang riwayat percakapan.

## Ringkas: di mana posisinya

Kodenya **selesai**. Ketujuh belas task rencana sudah dikerjakan, masing-masing lewat
gerbang review, lalu review menyeluruh seluruh branch menemukan enam temuan Important
yang seluruhnya sudah diperbaiki dan diverifikasi ulang. Pekerjaan sudah di-merge ke
`master` dan **sudah ter-push ke GitHub**.

Yang tersisa bukan kodenya. Figma dan Vercel sudah rampung pada 21 September 2026; yang
masih menganggur tinggal wireframe dan user flow di Stitch.

| Hal | Status |
|---|---|
| Kode aplikasi, 17 task | Selesai, review bersih |
| Merge ke `master` | Selesai (`55bde7d`) |
| Push ke GitHub | Selesai, 42 commit |
| Dokumentasi Milestone 1 | Selesai, kecuali tangkapan layar Stitch |
| Figma — design system | Selesai |
| Figma — dua layar High-Fidelity | Selesai, 21 September 2026 |
| Deploy Vercel | Selesai, 21 September 2026 |
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

### 1. Figma — selesai, tinggal disetel publik

<https://www.figma.com/design/mWdzokvX5gWuq22QAhlgux>

Ketiga halaman file sudah terisi:

| Halaman | Isi |
|---|---|
| `Design System` | 4 collection dan 68 variable, 10 text style, 3 effect style, 14 swatch, component set Button, Input, Badge, Card; ditambah section `Komponen Aplikasi` berisi App/Sidebar (2 varian), App/Topbar, dan App/KartuStatistik (4 varian) |
| `Dashboard` | Layar High-Fidelity 1440x900: empat kartu statistik, grafik garis tren 12 bulan, donat komposisi 8 kategori, tiga panel ringkasan |
| `Data Buku` | Layar High-Fidelity 1440x900: toolbar cari dan saring, tabel 8 baris, badge status, kaki tabel dengan paginasi |

Cacat properti TEXT pada Button, Input, dan Badge sudah diperbaiki: propertinya dihapus dari
ketiga component set lalu teks tiap varian diisi sendiri-sendiri, sehingga badge merah tidak
lagi bertuliskan teks varian hijau.

Angka di kedua layar diambil dari seed aplikasi, bukan dikarang: deret tren memakai
`JUMLAH_TREN` di `assets/js/data.js`, komposisi donat memakai hitungan judul per kategori,
dan delapan baris tabel adalah delapan data pertama berurut judul sesuai `perHalaman: 8`.

**Kenapa akhirnya bisa jalan.** Paket akun sudah menjadi Education, dan `whoami` melaporkan
tier `student`. Menurut dokumen rate limit Figma, Education memakai batas yang sama dengan
seat Dev dan Full pada paket Professional: 200 panggilan per hari dan 10 per menit, bukan lagi
20 per bulan seperti Starter. Batas 3 halaman dan 1 mode variable yang dulu membentuk rencana
juga tidak lagi mengikat, jadi mode Light bisa ditambahkan ke collection `Color` bila mau.

**Yang masih Anda perlukan:** setel sharing file ke **Anyone with the link**. Tautannya sudah
ditempel di `docs/perancangan.md`, tetapi penilai tetap gagal membukanya selama file masih
privat. Ini satu-satunya langkah Figma yang tidak bisa dikerjakan lewat MCP.

### 2. Deploy Vercel — selesai

<https://project-pemrograman-web-2-e-library.vercel.app>

Di-import dari repositori GitHub sebagai situs statis, preset Other, tanpa build command
dan tanpa output directory. Tidak ada `package.json`, jadi Vercel menyajikan berkas apa
adanya. Setiap push ke `master` memicu deploy ulang otomatis.

Sebelum deploy, dua hal yang biasanya merusak deploy Windows ke Linux sudah diperiksa:
seluruh aset yang dirujuk HTML terlacak git (tidak ada berkas yang hanya ada di komputer
lokal), dan penulisan huruf besar-kecil setiap referensi cocok persis dengan nama
berkasnya. Slot `[LINK VERCEL ANDA]` di README sudah terisi.

### 3. Wireframe dan user flow di Stitch

Belum tersentuh sama sekali, dan ini terpisah dari pekerjaan Figma. Panduan tugas
memintanya untuk Milestone 1. Slotnya `[SCREENSHOT STITCH]` di `docs/perancangan.md`.

### 4. Identitas commit — sudah diperbaiki

Seluruh riwayat kini atas nama `omangs007 <128009290+omangs007@users.noreply.github.com>`,
dan GitHub memetakan tiap commit ke akun tersebut. Sebelumnya commit tercatat atas nama
akun lain karena `git config --global` di mesin ini menyetel identitas itu, sementara
kredensial push-nya selalu `omangs007`. Jadi ini soal penulis commit, bukan kolaborator:
GitHub dan layanan yang membacanya seperti Vercel menampilkan penulis commit, yang dipetakan
lewat email penulis.

Perbaikannya memakai `git filter-branch` atas seluruh commit lalu force push dengan
`--force-with-lease`. Isi pohon tidak berubah satu byte pun, hanya hash-nya yang bergeser.
Pada putaran kedua, baris trailer co-author pada setiap pesan commit ikut dihapus, sehingga
riwayat repositori ini hanya menyebut satu nama.

Repo ini punya `user.name` dan `user.email` lokal sendiri, jadi commit berikutnya sudah
benar tanpa menyentuh config global mesin — yang masih memakai identitas lama untuk
repositori lain.

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

**Kontrol bawaan peramban tidak ikut tema aplikasi.** Daftar pilihan `<select>` dan panel
kalender `<input type="date">` digambar peramban di luar alur halaman. Dengan
`color-scheme: light dark`, keduanya mengikuti tema sistem operasi, bukan kelas `.dark`
aplikasi; ketika aplikasi gelap tetapi sistem terang, teks `<option>` mewarisi `--text`
yang nyaris putih di atas latar sistem yang juga putih sehingga tidak terbaca sama sekali.
Perbaikannya mengikat `color-scheme` ke tema aplikasi dan menyetel warna `<option>` secara
eksplisit dengan nilai pekat sebagai jaring pengaman. Menguji ini tidak bisa lewat tangkapan
layar karena menu melayang digambar di luar halaman; ukur `getComputedStyle` pada `<option>`
di kedua tema. Warna saja pun tidak cukup bila tampilannya dinilai: radius, bayangan, dan gaya
sorot memang tidak dapat disentuh CSS, sehingga daftar pilihan dan kalender akhirnya diganti
popover sendiri di `ui.js`. Elemen aslinya tetap di DOM sebagai sumber nilai supaya kode
halaman yang membaca `.value` dan mendengarkan `change` tidak perlu diubah sama sekali.

**Tiruan objek di harness harus ikut tumbuh.** Menambah satu fungsi ke `Layout` langsung
merobohkan dua harness yang memalsukan objek itu dengan `{ init, sesi }` saja. Setelah
menambah API yang dipanggil kode halaman, lengkapi tiruannya di
`tests/page-peminjaman.check.cjs` dan `tests/review-akhir.check.cjs`, jangan menambal
kode produksi dengan pemeriksaan keberadaan fungsi demi menyenangkan tiruan yang basi.

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
| `docs/panduan-rakit-figma.md` | Catatan nilai layout kedua layar High-Fidelity; kini panduan cadangan karena layarnya sudah dirakit |
| `docs/keputusan-controller.md` | 38 keputusan yang diambil tanpa menunggu jawaban, beserta alasan dan biayanya bila keliru |
| `.superpowers/sdd/2026-09-14-elibrary-admin-panel/progress.md` | Ledger lengkap eksekusi; git-ignored |
| `.superpowers/sdd/2026-09-14-elibrary-admin-panel/review-akhir.md` | Laporan review menyeluruh seluruh branch |
