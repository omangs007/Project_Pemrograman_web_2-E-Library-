# Panduan merakit dua layar High-Fidelity di Figma

Dokumen ini untuk menyelesaikan bagian Milestone 1 yang tersisa: **High-Fidelity UI
untuk Dashboard dan Data Master**. Design system-nya sudah berdiri di file Figma, jadi
pekerjaan yang tersisa adalah menyusun, bukan membangun dari nol.

Seluruh angka di bawah diambil langsung dari `assets/css/style.css`, bukan perkiraan dari
tangkapan layar. Kalau ada nilai yang saya perkirakan, itu disebutkan secara eksplisit.

File: <https://www.figma.com/design/mWdzokvX5gWuq22QAhlgux>

> **Status 21 September 2026 — sudah dikerjakan, tidak perlu dirakit tangan.**
> Paket Figma akun ini naik dari Starter ke Education, sehingga batas panggilan MCP berubah
> dari 20 per bulan menjadi 200 per hari. Dengan kuota itu kedua layar dibangun langsung
> lewat MCP dan cacat properti TEXT pada Button, Input, serta Badge sudah diperbaiki.
> Dokumen ini disimpan sebagai catatan nilai layout yang dipakai dan sebagai panduan cadangan
> bila suatu saat kedua layar perlu dirakit ulang secara manual.

---

## 1. Yang sudah ada di file

**Halaman `Design System`** memuat seluruh fondasinya:

| Aset | Isi |
|---|---|
| Collection `Primitives` | 31 warna mentah, disembunyikan dari picker |
| Collection `Color` | 19 token semantik, alias ke primitif |
| Collection `Spacing` | 11 nilai: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32 |
| Collection `Radius` | icon 10, control 12, card 16, panel 24, pill 999 |
| Text style | `Display/Stat`, `Display/Value`, `Heading/XL`, `Heading/L`, `Heading/M`, `Body/M`, `Body/S`, `Label/M`, `Label/S`, `Caption` |
| Effect style | `Shadow/Card`, `Shadow/Modal`, `Shadow/Action` |
| Component set | `Button` (Primary / Ghost / Danger) |
| Component set | `Input` (Default / Focus / Error) |
| Component set | `Badge` (Ok / Warn / Bad) |
| Component | `Card` |

Halaman `Dashboard` dan `Data Buku` sudah ada tetapi **masih kosong**.

### Satu cacat kecil yang perlu diperbaiki lebih dulu

Ketiga component set menampilkan teks contoh yang sama di semua variannya, karena
properti TEXT pada set menimpa teks tiap varian. Akibatnya badge merah ikut bertuliskan
teks varian hijau, yang menyesatkan.

Perbaikannya: pilih component set-nya, buka panel kanan, hapus properti teks di bagian
**Properties**, lalu ketik ulang teks tiap varian:

| Varian | Teks |
|---|---|
| `Style=Primary` | Tambah Buku |
| `Style=Ghost` | Setel Ulang |
| `Style=Danger` | Hapus |
| `State=Default` | Cari judul, pengarang, atau ISBN… |
| `State=Focus` | Algoritma dan Struktur Data |
| `State=Error` | 123 |
| `Tone=Ok` | Tersedia |
| `Tone=Warn` | Terbatas |
| `Tone=Bad` | Terlambat 13 hari |

Menghapus properti itu tidak mengurangi kegunaan komponen: teks di dalam instance tetap
bisa diedit langsung di Figma tanpa properti.

---

## 2. Kerangka bersama kedua layar

Buat frame **1440 × 900**, isi `color/bg/a`. Di dalamnya, dua kolom berdampingan.

### Sidebar — lebar 264

| Properti | Nilai |
|---|---|
| Lebar | 264, tinggi penuh |
| Padding | 20 atas-bawah, 14 kiri-kanan |
| Gap antar item | 8 |
| Isi | `color/surface/glass` |
| Border kanan | 1px `color/border/glass` |

**Blok merek** di paling atas: gap 12, padding 6 atas / 10 samping / 18 bawah.
Kotak logo 40 × 40 radius `radius/control` isi `color/accent/brand`, berisi huruf `P`
putih. Di sebelahnya dua baris: `Perpustakaan Digital` (15px, line-height 1.25) dan
`Universitas Pamulang` (11px, `color/text/muted`).

**Item navigasi**: padding 10 atas-bawah / 12 kiri-kanan, radius `radius/control`,
gap 12, teks 14px Medium `color/text/muted`, ikon 18 × 18.

Item **aktif** memakai isi `color/accent/brand`, teks putih, dan `Shadow/Action`.

Susunan menu, dengan label kelompok memakai `Caption` huruf kapital `color/text/muted`:

```
Dashboard                 ← aktif di layar Dashboard
MASTER DATA
  Data Buku               ← aktif di layar Data Buku
  Data Anggota
TRANSAKSI
  Peminjaman
  Pengembalian
LAPORAN
  Laporan Sirkulasi
─────────────
Pengaturan
Keluar
```

### Topbar

| Properti | Nilai |
|---|---|
| Padding | 14 atas-bawah, 24 kiri-kanan |
| Gap | 16 |
| Isi | `color/surface/glass` |
| Border bawah | 1px `color/border/glass` |

Di kiri dua baris teks: judul halaman memakai `Heading/L` `color/text/primary`, dan
subjudul memakai `Body/S` `color/text/muted`. Di kanan, ikon matahari 20 × 20 dan avatar
bulat 36 × 36 isi `color/accent/brand` berisi inisial `AR` putih.

### Area konten

Padding 24 di semua sisi. Semua panel di bawah memakai komponen `Card` atau frame dengan
isi `color/surface/glass`, border 1px `color/border/glass`, radius `radius/card` atau
`radius/panel`, dan efek `Shadow/Card`.

---

## 3. Layar Dashboard

Judul topbar: **Dashboard**, subjudul **Ringkasan aktivitas perpustakaan**.

### Baris kartu statistik

Empat kartu sejajar, gap 20, masing-masing melebar rata. Tiap kartu: padding 24, radius
`radius/card`, ikon 44 × 44 radius `radius/control`, lalu label, angka, dan catatan.

| Label (`Body/S` muted) | Angka (`Display/Stat`) | Catatan (`Caption` muted) | Warna ikon |
|---|---|---|---|
| Total Koleksi | 24 | 117 eksemplar | `color/accent/brand` |
| Anggota Aktif | 15 | dari 18 terdaftar | `color/accent/teal` |
| Sedang Dipinjam | 11 | transaksi berjalan | `color/status/warn-text` |
| Terlambat | 4 | perlu ditindaklanjuti | `color/status/bad-text` |

### Baris grafik

Dua panel, gap 20, perbandingan lebar kira-kira 3 : 2 — proporsi ini saya perkirakan dari
tampilan aplikasi, bukan dari nilai CSS.

**Kiri — Tren Sirkulasi.** Judul `Heading/M`, subjudul `Body/S` muted
"Peminjaman 12 bulan terakhir". Isinya grafik garis dua seri: Peminjaman memakai
`color/accent/brand`, Pengembalian memakai `color/accent/teal` bergaris putus-putus.
Sumbu X: Okt 25 sampai Sep 26. Sumbu Y: 0 sampai 80.

**Kanan — Komposisi Koleksi.** Subjudul "Jumlah judul per kategori", grafik donat delapan
kategori: Karya Umum, Filsafat, Agama, Ilmu Sosial, Bahasa, Sains Murni, Teknologi,
Seni & Sastra.

### Baris bawah

Tiga panel sejajar, gap 20.

**Aktivitas Terbaru** — tiap baris: titik 8 × 8 `color/accent/brand`, nama tebal, teks
aksi biasa, lalu tanggal `Caption` muted di bawahnya.

| Isi | Tanggal |
|---|---|
| **Salsabila Putri** meminjam "Bumi Manusia" | 14 Sep 2026 |
| **Intan Permata** meminjam "Laskar Pelangi" | 13 Sep 2026 |
| **Bagas Prasetyo** meminjam "Pemrograman Web Modern" | 12 Sep 2026 |

**Buku Terpopuler** — nomor dan judul di kiri, hitungan di kanan, lalu bar progres tinggi
6 radius `radius/pill` isi `color/accent/brand` di atas alur `color/surface/glass-strong`.

| Judul | Hitungan | Panjang bar |
|---|---|---|
| 1. Bumi Manusia | 2x | penuh |
| 2. Laskar Pelangi | 2x | penuh |
| 3. Pemrograman Web Modern | 1x | separuh |

**Jatuh Tempo** — subjudul "Hari ini dan yang sudah terlewat". Tiap baris: judul buku
`Body/S`, nama peminjam `Body/M`, dan instance `Badge` varian `Tone=Bad` di kanan.

| Buku | Peminjam | Badge |
|---|---|---|
| Rekayasa Perangkat Lunak | Hendra Wijaya | Terlambat 13 hari |
| Statistika Terapan | Andi Kurniawan | Terlambat 8 hari |

---

## 4. Layar Data Buku — halaman Data Master

Judul topbar: **Data Buku**, subjudul **Kelola koleksi perpustakaan**.

Satu panel besar radius `radius/panel` berisi toolbar di atas dan tabel di bawahnya.

### Toolbar

Padding 16, gap 12, border bawah 1px `color/border/glass`.

Dari kiri ke kanan: instance `Input` varian `State=Default` yang melebar mengisi ruang,
dua dropdown "Semua Kategori" dan "Semua Status" dengan gaya yang sama tetapi lebar tetap,
lalu instance `Button` varian `Style=Primary` bertuliskan **+ Tambah Buku** menempel di
kanan.

### Kepala tabel

Padding 12 atas-bawah / 16 kiri-kanan, isi `color/surface/glass-strong`, border bawah 1px,
teks 12px SemiBold huruf kapital `color/text/muted` dengan jarak huruf 0.04em.

Kolom: `JUDUL BUKU · ISBN · KATEGORI · RAK · STOK · STATUS · AKSI`

### Baris tabel

Padding 14 atas-bawah / 16 kiri-kanan, border bawah 1px `color/border/glass`, baris
terakhir tanpa border.

Kolom Judul berisi avatar huruf 40 × 40 radius `radius/control` isi `color/accent/brand`,
lalu judul `Body/M` `color/text/primary` dan pengarang `Body/S` `color/text/muted` di
bawahnya. Kolom Kategori memakai chip radius `radius/pill` isi `color/surface/glass-strong`.
Kolom Status memakai instance `Badge`. Kolom Aksi berisi dua ikon 18 × 18 `color/text/muted`.

| Judul | Pengarang | ISBN | Kategori | Rak | Stok | Status |
|---|---|---|---|---|---|---|
| Academic English for Students | Michael Swan | 9780194738767 | Bahasa | R-04-A | 4 / 5 | Tersedia |
| Algoritma dan Struktur Data | Rinaldi Munir | 9786020332123 | Teknologi | R-07-A | 5 / 6 | Tersedia |
| Basis Data Relasional | Fathansyah | 9789792248470 | Teknologi | R-07-A | 5 / 5 | Tersedia |
| Bumi Manusia | Pramoedya Ananta Toer | 9786020385129 | Seni & Sastra | R-08-A | 8 / 9 | Tersedia |
| Ensiklopedia Umum Nusantara | Tim Redaksi | 9789792201234 | Karya Umum | R-00-A | 2 / 2 | **Terbatas** |
| Filsafat Ilmu Pengetahuan | Jujun S. Suriasumantri | 9786020332451 | Filsafat | R-01-A | 3 / 3 | Tersedia |
| Fisika untuk Universitas | Halliday & Resnick | 9789790335486 | Sains Murni | R-05-A | 4 / 4 | Tersedia |

Baris **Ensiklopedia Umum Nusantara** memakai `Badge` varian `Tone=Warn`; sisanya
`Tone=Ok`. Datanya nyata, diambil dari seed aplikasi, jadi layar ini konsisten dengan
demo yang akan Anda tunjukkan.

### Kaki tabel

Di kiri `Caption` muted: **Menampilkan 1–8 dari 24 data**. Di kanan, tombol paginasi
gap 6, tiap tombol radius `radius/control`; tombol halaman aktif memakai isi
`color/accent/brand` dan teks putih.

---

## 5. Sebelum dikumpulkan — sudah beres

- Sharing file sudah disetel **Anyone with the link** dan diuji dari peramban tanpa login.
- Tautannya sudah tertempel di `docs/perancangan.md`, lengkap dengan tautan ke tiap layar.
- Wireframe dan user flow yang diminta panduan tugas dikerjakan lewat jalur HTML/CSS yang
  dibolehkan, ada di `docs/wireframe.html`, terpisah dari pekerjaan Figma ini.

## 6. Bila kuota MCP Figma sudah aktif

Kalau paket akunnya sudah naik sehingga kuota panggilan longgar, dua layar di atas dapat
dibangun otomatis tanpa dirakit tangan. State pekerjaannya tersimpan lengkap, termasuk ID
tiap component set, sehingga design system yang sudah jadi tidak perlu diulang.
