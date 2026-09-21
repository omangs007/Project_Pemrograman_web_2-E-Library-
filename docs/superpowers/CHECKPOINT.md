# Checkpoint — 21 September 2026

Titik henti Admin Panel E-Library Universitas Pamulang. Ditulis agar pekerjaan dapat
dilanjutkan besok tanpa membaca ulang riwayat percakapan.

## Ringkas: di mana posisinya

**Seluruh keluaran Milestone 1 sudah lengkap, dan tidak ada yang menunggu tindakan Anda.**
Kodenya selesai sejak 15 September; hari ini yang dikerjakan adalah sisa deliverable,
perbaikan tampilan, dan pembenahan identitas repositori.

| Hal | Status |
|---|---|
| Kode aplikasi, 17 task | Selesai, review bersih |
| Dokumentasi Milestone 1 | Selesai seluruhnya; daftar periksa tercentang penuh |
| Wireframe dan user flow | Selesai, `docs/wireframe.html` |
| Figma — design system | Selesai |
| Figma — dua layar High-Fidelity | Selesai, sudah publik dan terverifikasi tanpa login |
| Deploy Vercel | Live dan mutakhir; deploy otomatis tiap push tetap berjalan |
| Identitas commit | Bersih: 50 commit, satu nama, tanpa jejak akun lama |

- Repositori: <https://github.com/omangs007/Project_Pemrograman_web_2-E-Library->
- Demo: <https://project-pemrograman-web-2-e-library.vercel.app>
- Figma: <https://www.figma.com/design/mWdzokvX5gWuq22QAhlgux>

---

## Catatan tentang Vercel

Repositori GitHub sempat dihapus dan dibuat ulang hari ini untuk menghabisi jejak nama lama
di sisi server. Sempat diduga koneksi Git proyek Vercel ikut putus, tetapi pemeriksaan
terakhir membuktikan sebaliknya: situs live sudah memuat lembar wireframe, lambang UNPAM,
popover kustom, dan token tema terang, jadi deploy otomatis tetap berjalan dan mengikuti
commit terakhir. Tidak ada yang perlu disambung ulang.

Cara memastikannya lain kali tanpa menebak: periksa penanda berkas di situs live, bukan
menyimpulkan dari dugaan. Berkas yang hanya ada pada commit terbaru harus mengembalikan 200,
dan token CSS terbaru harus ikut terkirim.

```bash
BASIS=https://project-pemrograman-web-2-e-library.vercel.app
curl -s -o /dev/null -w "%{http_code}\n" "$BASIS/docs/wireframe.html"
curl -s "$BASIS/assets/css/style.css" | grep -c control-border
```

---

## Yang dikerjakan hari ini

**Figma.** Paket akun naik dari Starter ke Education, sehingga batas panggilan MCP berubah
dari 20 per bulan menjadi 200 per hari dan pekerjaan yang dulu terhenti kuota bisa
diselesaikan. Halaman `Dashboard` dan `Data Buku` kini berisi layar High-Fidelity 1440×900.
Cacat properti TEXT pada component set Button, Input, dan Badge diperbaiki. Ditambahkan
komponen `App/Sidebar` (2 varian), `App/Topbar`, `App/KartuStatistik` (4 varian), dan token
`color/status/brand-bg`. Angka pada kedua layar diambil dari seed aplikasi, bukan dikarang.

**Identitas repositori.** Seluruh commit dulu tercatat atas nama akun lama karena
`git config --global` di mesin ini, padahal kredensial push-nya sudah benar. Riwayat ditulis
ulang, lalu repositori GitHub dihapus dan dibuat ulang agar objek commit lamanya benar-benar
hilang dari server, bukan sekadar tidak terjangkau. Baris atribusi asisten pada pesan commit
juga dihapus atas permintaan. Hasilnya diverifikasi lewat API GitHub: 50 commit, satu penulis,
nol sebutan nama lain, dan commit lama mengembalikan 422.

**Perbaikan tampilan.** Empat hal: kontrol bawaan peramban yang mengikuti tema sistem alih-alih
tema aplikasi; sorotan sidebar yang tidak mengikuti tab Peminjaman/Pengembalian; baris saring
Laporan yang berdesakan di bawah 1280 px; dan — yang paling luas — kontrol serta pemisah yang
lenyap di tema terang karena putih di atas putih.

**Komponen baru.** Daftar pilihan dan kalender bawaan peramban diganti popover sendiri di
`ui.js`, karena radius, bayangan, dan gaya sorotnya memang tidak dapat disentuh CSS.

**Identitas visual.** Lambang Universitas Pamulang menggantikan ubin huruf "P" di sidebar,
halaman masuk, favicon, dan component set Figma.

**Milestone 1.** `docs/wireframe.html` melengkapi butir terakhir: user flow admin, tujuh
wireframe layar, dan skema komponen polimorfik.

---

## Cara menjalankan aplikasi

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const root=process.cwd();const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain'};http.createServer((req,res)=>{let p=decodeURIComponent(url.parse(req.url).pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));"
```

Buka `http://127.0.0.1:8123/index.html`, masuk dengan `admin@unpam.ac.id` / `admin123`.
`python -m http.server` gagal di mesin ini, karena itu dipakai server Node di atas. Sertakan
`.png` pada peta MIME — sejak ada lambang, server tanpa entri itu menyajikan gambar sebagai
`octet-stream`.

## Menjalankan pengujian

| Suite | Perintah | Jumlah |
|---|---|---|
| Suite utama | buka `http://127.0.0.1:8123/tests/runner.html` | 60 |
| Harness sirkulasi | `node tests/page-peminjaman.check.cjs` | 6 |
| Harness form buku | `node tests/page-form-buku.check.cjs` | 5 |
| Harness regresi review akhir | `node tests/review-akhir.check.cjs` | 12 |

Seluruhnya hijau saat checkpoint ini ditulis.

---

## Hal yang perlu diingat saat melanjutkan

**Repositori GitHub sudah dibuat ulang.** Kalau ada klon lama di komputer lain, klon itu
harus dihapus dan diambil ulang. Push dari klon lama akan menaikkan kembali riwayat berikut
nama-nama yang sudah susah payah dihapus.

**Identitas commit.** Config global mesin kini `omangs007` dengan email
`128009290+omangs007@users.noreply.github.com`, dan repo ini punya salinan lokalnya.
Pesan commit **tidak memakai baris atribusi asisten** — itu permintaan tegas pengguna.

**Git di mesin ini.** `credential.helper` global masih `cache`, helper gaya Linux yang tidak
berfungsi di Windows; repo ini sudah dialihkan ke `manager` lewat config lokal. Peringatan
"unable to connect to cache daemon" tetap muncul sekali tiap push dan tidak berpengaruh.

**Berkas repo ini berakhiran CRLF.** Penggantian string multi-baris lewat skrip Node akan
gagal diam-diam bila polanya memakai `\n`. Pola yang dipakai sekarang: baca berkas, normalkan
ke `\n`, lakukan penggantian, lalu kembalikan ke akhir baris asli saat menulis.

**Kontrol bawaan peramban tidak ikut tema aplikasi.** `color-scheme: light dark` menyerahkan
daftar `<select>` dan kalender `<input type="date">` kepada tema sistem operasi. Sekarang
`color-scheme` diikat ke tema aplikasi, dan daftar pilihan serta kalender sudah diganti
popover sendiri di `ui.js`. Elemen aslinya tetap di DOM sebagai sumber nilai, sehingga kode
halaman yang membaca `.value` dan mendengarkan `change` tidak perlu diubah.

**Menguji popover tidak bisa lewat tangkapan layar** bila menunya digambar peramban; ukur
`getComputedStyle` pada elemennya di kedua tema.

**Tema terang punya jebakan putih di atas putih.** Token `--glass-border` hanya untuk tepi
permukaan glass terhadap latar halaman. Untuk pemisah di dalam permukaan pakai `--line`, dan
untuk batas kotak kontrol pakai `--control-border`. Melanggar ini membuat kotak pencarian,
dropdown, dan garis tabel lenyap di tema terang sementara tema gelap tampak baik-baik saja.

**Mengukur kontras harus memakai warna komposit.** Latar aplikasi ini gradien dan
permukaannya beralfa, sehingga membaca `backgroundColor` apa adanya menghasilkan angka palsu.
Rasio tepat 1,00 atau pola "semuanya gagal" hampir selalu berarti alat ukurnya yang salah.

**Tiruan objek di harness harus ikut tumbuh.** Menambah satu fungsi ke `Layout` langsung
merobohkan dua harness yang memalsukan objek itu dengan `{ init, sesi }` saja. Lengkapi
tiruannya di `tests/page-peminjaman.check.cjs` dan `tests/review-akhir.check.cjs`; jangan
menambal kode produksi dengan pemeriksaan keberadaan fungsi demi menyenangkan tiruan basi.

**Aturan warna yang berulang menjadi sumber cacat:** token tema untuk permukaan, border, dan
teks isi; nilai literal untuk warna yang membawa makna. Di blok cetak, hasil akhirnya harus
hitam di atas putih.

**Tangkapan layar `fullPage` Playwright menyesatkan** pada halaman aplikasi karena
`background-attachment: fixed`. Gunakan tangkapan per-viewport. Untuk `docs/wireframe.html`
yang tidak memakai latar itu, `fullPage` justru cara termudah mengambil seluruh lembar.

**Jangan menyimpan referensi elemen tabel melintasi aksi yang memicu render** — `DataTable`
menulis ulang seluruh `innerHTML`-nya. Query ulang setiap kali.

**Figma.** Paket Education memberi 200 panggilan MCP per hari dan 10 per menit. Importer SVG
Figma tidak menghormati `stroke-dasharray`; untuk donat pakai `arcData` bawaan. Varian hasil
`combineAsVariants` menumpuk di satu titik sampai component set-nya diberi auto-layout.

---

## Yang bisa dikerjakan berikutnya

Tidak ada yang tersisa dari Milestone 1. Kalau ingin menambah nilai:

- **Stitch by Google.** Panduan tugas membolehkan alat HTML/CSS sejenis dan jalur itu yang
  dipakai, tetapi bila penilai secara khusus menuntut Stitch, tiap layar di
  `docs/wireframe.html` dapat disalin menjadi prompt Stitch tanpa merancang ulang.
- **Mode terang di variable Figma.** Batas satu mode sudah hilang bersama paket Starter,
  sehingga collection `Color` kini bisa diberi mode Light di samping Dark.
- **Milestone berikutnya** sesuai panduan tugas, bila sudah dibuka.

---

## Dokumen penting

| Berkas | Isi |
|---|---|
| `docs/perancangan.md` | Keluaran Milestone 1: hirarki menu, ER-D, user flow, design system, tautan rancangan |
| `docs/wireframe.html` | Wireframe Low-to-Mid Fidelity tujuh layar, user flow, skema komponen polimorfik |
| `docs/design-system.html` | Style guide hidup: token dan komponen pada kedua tema |
| `README.md` | Cara menjalankan, struktur, kredensial demo, cara menguji, tautan demo |
| `docs/panduan-rakit-figma.md` | Catatan nilai layout kedua layar High-Fidelity; kini panduan cadangan |
| `docs/keputusan-controller.md` | 38 keputusan yang diambil tanpa menunggu jawaban, beserta alasan dan biayanya bila keliru |
| `.superpowers/sdd/2026-09-14-elibrary-admin-panel/progress.md` | Ledger lengkap eksekusi; git-ignored |
