# Checkpoint — 14 September 2026

Titik henti pengerjaan Admin Panel E-Library Universitas Pamulang. Dokumen ini
ditulis agar pekerjaan dapat dilanjutkan besok tanpa perlu membaca ulang seluruh
riwayat percakapan.

## Cara melanjutkan

Buka sesi baru di direktori proyek, lalu katakan:

> Lanjutkan eksekusi `docs/superpowers/plans/2026-09-14-elibrary-admin-panel.md`
> dari Task 13. Baca `docs/superpowers/CHECKPOINT.md` dan ledger di
> `.superpowers/sdd/2026-09-14-elibrary-admin-panel/progress.md` lebih dulu.

Ledger adalah catatan lengkapnya: berisi setiap temuan, setiap keputusan, dan
setiap hasil verifikasi. Dokumen ini hanya ringkasannya.

## Cara menjalankan aplikasi

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const root=process.cwd();const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain'};http.createServer((req,res)=>{let p=decodeURIComponent(url.parse(req.url).pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d);});}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));"
```

Buka `http://127.0.0.1:8123/index.html`. Masuk dengan `admin@unpam.ac.id` /
`admin123`.

Catatan: `python -m http.server` gagal di mesin ini, karena itu dipakai server
Node di atas.

## Menjalankan pengujian

- Suite utama (60 tes): buka `http://127.0.0.1:8123/tests/runner.html`, atau
  jalankan di Node dengan stub `localStorage` — lihat pola perintahnya di ledger.
- Harness sirkulasi: `node tests/page-peminjaman.check.cjs` (6 pemeriksaan).

## Status per task

| Task | Halaman / modul | Status |
|---|---|---|
| 1 | Design token, stylesheet glass, design system | Selesai, review bersih |
| 2 | Seed mock data | Selesai, 1 fix round |
| 3 | Store localStorage + tes CRUD | Selesai, 1 fix round |
| 4 | Aturan sirkulasi dan denda | Selesai, 1 fix round |
| 5 | Perkakas UI (modal, toast, validator) | Selesai, 1 fix round |
| 6 | Mesin tabel generik | Selesai, 1 fix round |
| 7 | Kerangka layout — **Milestone 2** | Selesai, 1 fix round |
| 8 | Halaman login | Selesai, review bersih |
| 9 | Dashboard | Selesai, review bersih |
| 10 | Data Buku | Selesai, review bersih |
| 11 | Data Anggota | Selesai, review bersih |
| 12 | Peminjaman dan Pengembalian | Selesai, 1 temuan menunggu perbaikan |
| 13 | Form Buku | **WIP — belum diverifikasi, belum di-review** |
| 14 | Laporan dan stylesheet cetak | Belum mulai |
| 15 | Modal Pengaturan | Belum mulai |
| 16 | Dokumentasi Milestone 1 dan README | Belum mulai |
| 17 | Verifikasi menyeluruh dan deploy | Belum mulai |

Branch: `feat/admin-panel`. Commit terakhir: `82fca3e`.

## Yang harus dikerjakan pertama besok

### 1. Perbaikan tertunda dari Task 12

Reviewer menemukan bahwa `bolehPinjam()` memiliki lima cabang penolakan, dua di
antaranya menyangkut **buku** — "Buku tidak ditemukan" dan "Stok … sedang habis"
— tetapi `assets/js/page-peminjaman.js` selalu menempelkan alasannya ke field
**Anggota**. Pustakawan yang melihat pesan "Stok habis" di bawah label Anggota
akan memeriksa kontrol yang salah.

Keputusan yang sudah diambil: tambahkan diskriminator `field: 'anggota' | 'buku'`
pada nilai kembalian `bolehPinjam()` di `assets/js/store.js`, lalu gunakan itu di
halaman untuk menandai input yang tepat. Jangan menebak field dari isi pesan —
pendekatan itu rapuh terhadap perubahan kata. Penambahan properti bersifat aditif
sehingga tes yang memeriksa `.boleh` dan `.alasan` tidak terpengaruh.

### 2. Selesaikan Task 13

Berkasnya sudah ada di disk dan lolos pemeriksaan sintaks, tetapi belum pernah
dibuka di peramban dan belum melewati gerbang review. Perlakukan sebagai draf.

Yang harus diverifikasi di peramban, karena semuanya jenis kesalahan yang tidak
memunculkan pesan galat:

- Mengedit buku yang punya sampul, tanpa menyentuh input sampul, tidak boleh
  mengosongkan sampulnya.
- Konvensi "jumlah tersedia mengikuti jumlah total" hanya berlaku saat menambah
  buku baru. Bila ikut berjalan di mode ubah, mengedit buku akan diam-diam
  mereset stok tersedia ke total dan menggelembungkan stok buku yang sedang
  dipinjam orang.
- Pemeriksaan ISBN duplikat harus mengecualikan record yang sedang diedit.
- ISBN dinormalisasi sebelum dibandingkan maupun disimpan, sehingga
  `978-602-033-212-3` dan `9786020332123` dikenali sebagai ISBN yang sama.

## Hal yang perlu diingat saat melanjutkan

**Codex tidak bisa menulis ke `.git`.** Sandbox-nya menolak, jadi controller yang
menjalankan setiap `git commit`. Jangan minta Codex melakukan operasi git.

**Codex tidak punya peramban.** Seluruh verifikasi visual dan interaksi dilakukan
controller lewat Playwright. Minta Codex menyatakan dengan jujur apa yang tidak
bisa ia verifikasi, jangan biarkan ia mengklaim sebaliknya.

**Model Codex yang valid** adalah `gpt-5.6-sol` dan `gpt-6-astra`. Varian dengan
sisipan `-codex-` ditolak CLI.

**Aturan warna yang berulang kali menjadi sumber cacat:** token tema untuk
permukaan, border, dan teks isi; nilai literal untuk warna yang membawa makna.
Satu task pernah ditolak karena mengganti indikator galat dengan `var(--text)`,
yang membuatnya ter-render tanpa warna merah sama sekali.

**Jangan menyimpan referensi elemen tabel melintasi aksi yang memicu render**,
karena `DataTable` menulis ulang seluruh `innerHTML`-nya dan node lama terlepas
dari DOM. Query ulang setiap kali. Kesalahan ini pernah membuat uji asap salah
melaporkan pengurutan tidak bekerja.

**Tangkapan layar `fullPage` Playwright menyesatkan** pada halaman ini karena
`background-attachment: fixed`; panel bawah tampak putih polos padahal normal.
Gunakan tangkapan per-viewport.

## Yang masih harus Anda kerjakan sendiri

Milestone 1 mensyaratkan **link publik Figma** dan hasil rancangan **Stitch by
Google**. Keduanya butuh akun pribadi Anda. Task 16 akan menyediakan slot
`[LINK FIGMA ANDA]` dan `[SCREENSHOT STITCH]` di `docs/perancangan.md` untuk
diisi, serta `docs/design-system.html` yang bisa dibuka dan ditangkap layarnya
sebagai sumber nilai warna dan tipografi.

Task 17 juga akan meminta link repositori GitHub dan URL deploy Vercel Anda.

## Temuan yang ditunda ke review akhir

Ledger mencatat 25 temuan Minor dan beberapa observasi yang sengaja tidak masuk
fix loop. Review menyeluruh di akhir akan mentriase mana yang harus diperbaiki
sebelum penyerahan. Yang paling menonjol:

- `create()` dan `update()` pada Store mengembalikan objek hidup, bukan salinan —
  kelas bug yang sama dengan yang sudah diperbaiki pada `find()` dan `all()`,
  hanya lewat jalur tulis. Belum ada konsumen yang memutasinya.
- Menghapus atau mengedit baris melempar tampilan kembali ke halaman 1 alih-alih
  bertahan di sekitar posisi semula.
- Pengurutan kolom hanya bisa lewat tetikus; `<th>` belum bisa difokuskan
  keyboard.
