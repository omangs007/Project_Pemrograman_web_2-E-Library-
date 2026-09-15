# Checkpoint — 14-15 September 2026

Titik henti pengerjaan Admin Panel E-Library Universitas Pamulang. Dokumen ini
ditulis agar pekerjaan dapat dilanjutkan besok tanpa perlu membaca ulang seluruh
riwayat percakapan.

## Cara melanjutkan

Buka sesi baru di direktori proyek, lalu katakan:

> Lanjutkan eksekusi `docs/superpowers/plans/2026-09-14-elibrary-admin-panel.md`
> dari Task 14. Baca `docs/superpowers/CHECKPOINT.md` dan ledger di
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
| 12 | Peminjaman dan Pengembalian | Selesai, review bersih setelah 1 fix round |
| 13 | Form Buku | Selesai, review bersih setelah 1 fix round |
| 14 | Laporan dan stylesheet cetak | Selesai, review bersih setelah 3 fix round |
| 15 | Modal Pengaturan | Selesai, review bersih setelah 1 fix round |
| 16 | Dokumentasi Milestone 1 dan README | Selesai, review bersih setelah 1 fix round |
| 17 | Verifikasi menyeluruh dan deploy | Step 1-9 selesai; Step 10-12 menunggu pengguna |

Branch `feat/admin-panel` sudah di-merge ke `master` dan dihapus. Commit merge: `55bde7d`.

## Yang harus dikerjakan berikutnya

Task 12 dan Task 13 sudah SELESAI pada 15 September 2026, keduanya lewat gerbang
review dengan satu putaran perbaikan. Rinciannya ada di ledger.

Task 12 diperbaiki dengan menambahkan diskriminator `field` pada nilai kembalian
`bolehPinjam()`, sehingga alasan penolakan yang menyangkut buku ditandai pada
field Buku, bukan field Anggota. Asersi harness sirkulasi ikut diperbarui karena
asersi lamanya justru mengunci perilaku yang diperbaiki.

Task 13 diperbaiki karena penyimpanan dapat mengumumkan sukses padahal gagal.
`tulis()` kini mengembalikan boolean dan halaman memeriksanya lewat
`Store.simpan()`. Saat gagal di mode tambah, record yang terlanjur masuk ke
memori dibuang lagi — tanpa itu, percobaan ulang ditolak sebagai duplikat ISBN
dari record yang belum tersimpan itu sendiri.

Sisa pekerjaan: Task 14 (Laporan dan stylesheet cetak), Task 15 (Modal
Pengaturan), Task 16 (Dokumentasi Milestone 1 dan README), Task 17 (verifikasi
menyeluruh dan deploy), lalu review menyeluruh seluruh branch.

## Cakupan tes otomatis saat ini

- Suite utama: 60 tes.
- Harness sirkulasi: `node tests/page-peminjaman.check.cjs` (6 pemeriksaan).
- Harness form buku: `node tests/page-form-buku.check.cjs` (5 pemeriksaan) — baru
  di Task 13; menutup gagal dan berhasil untuk mode tambah maupun ubah, ditambah
  percobaan ulang setelah penyimpanan gagal.

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

## Status gerbang akhir — 15 September 2026

Ketujuh belas task selesai dan seluruhnya melewati gerbang review per-task. Review
menyeluruh seluruh branch menghasilkan enam temuan Important; keenamnya sudah
diperbaiki, diverifikasi controller di peramban, dan dinyatakan DITUTUP oleh
re-review tercakup. Laporan review akhir ada di
`.superpowers/sdd/2026-09-14-elibrary-admin-panel/review-akhir.md`.

Pekerjaan sudah di-merge ke `master` sebagai `55bde7d`, dan seluruh tes hijau pada
hasil merge itu: suite utama 60/60, harness sirkulasi 6/6, harness form buku 5/5,
harness regresi review akhir 12/12.

Seluruh 38 keputusan yang diambil controller tanpa menunggu jawaban pengguna
tercatat di `docs/keputusan-controller.md`, beserta alasan dan biayanya bila keliru.

## Yang membutuhkan Anda

Repositori ini BELUM punya remote. Tiga langkah terakhir Task 17 menunggu Anda:

1. Isi empat penanda slot: tautan Figma publik dan tangkapan layar Stitch di
   `docs/perancangan.md`, tautan GitHub dan URL Vercel di `README.md`.
2. Tambahkan remote GitHub lalu dorong `master` ke sana.
3. Deploy ke Vercel dan isi URL-nya.

Daftar periksa di `docs/perancangan.md` menyebutkan syarat penilaian yang mudah
terlewat: tautan Figma harus publik dan dapat dibuka penilai tanpa meminta akses,
dan High-Fidelity UI wajib untuk DUA halaman yaitu Dashboard dan Data Master.
