# Admin Panel E-Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun Admin Panel Sistem Informasi Perpustakaan Digital untuk Universitas Pamulang — tujuh halaman client-side bergaya glassmorphism dengan CRUD yang bertahan di `localStorage`.

**Architecture:** Aplikasi statis tanpa build step. Lapisan data (`store.js`) tidak menyentuh DOM sama sekali; lapisan tampilan generik (`ui.js`, `table.js`) tidak tahu apa pun tentang domain perpustakaan; tiap halaman punya satu berkas `page-*.js` yang merekatkan keduanya. Logika murni diuji lewat test runner berbasis peramban tanpa dependensi.

**Tech Stack:** HTML5, Tailwind CSS 3 (Play CDN), CSS3 kustom, JavaScript ES6+ vanilla, Chart.js 4.4.1, `localStorage`.

**Spec:** `docs/superpowers/specs/2026-09-14-elibrary-admin-panel-design.md`

## Global Constraints

- **Tanpa build step, tanpa npm, tanpa bundler.** Seluruh berkas dibuka langsung dari disk atau server statis.
- **Tanpa backend.** Tidak ada `fetch` ke server mana pun kecuali CDN untuk Tailwind, Chart.js, dan Google Fonts.
- **`@apply` DILARANG di `assets/css/style.css`.** Tailwind Play CDN hanya mengompilasi direktif Tailwind di dalam blok `<style type="text/tailwindcss">`, bukan di berkas CSS eksternal. `style.css` berisi CSS biasa dan **dimuat setelah** `<script src="https://cdn.tailwindcss.com">` agar kelas komponen menang atas utility Tailwind. *(Koreksi terhadap Bagian 2 spec, yang menyebut `@layer components`.)*
- **Tailwind hanya untuk layout dan spacing** — grid, flex, gap, padding, margin, breakpoint. Seluruh warna, permukaan glass, border, bayangan, dan tipografi diatur lewat kelas komponen di `style.css`.
- **Mode gelap adalah default.** `<html class="dark">` di setiap halaman. `tailwind.config.darkMode = 'class'`.
- **Versi CDN dikunci:** Chart.js `4.4.1`. Tailwind Play CDN tidak berversi (memang begitu desainnya).
- **Aturan bisnis (nilai persis):** masa pinjam `7` hari, denda `Rp1.000` per hari terlambat, maksimal `3` buku per anggota.
- **Prefiks ID:** buku `BK`, anggota `AG`, kategori `KT`, peminjaman `PJ`, detail `DT`, denda `DN`, petugas `PT`. Nomor urut tiga digit, contoh `BK001`.
- **Kunci localStorage:** `elibrary.db.v1` (data), `elibrary.session` (sesi), `elibrary.theme` (tema).
- **Bahasa antarmuka:** Indonesia. Nama institusi ditulis persis **"Universitas Pamulang"**.
- **Tanggal** disimpan sebagai string ISO `YYYY-MM-DD` dan ditampilkan dalam format `DD Mmm YYYY` (contoh: `14 Sep 2026`).
- **Semua tanggal seed dihitung relatif terhadap hari ini** saat seeding pertama, agar status "jatuh tempo" dan "terlambat" selalu relevan saat demo.
- **Commit setiap akhir task** dengan pesan berbahasa Indonesia berprefiks `feat:`, `docs:`, `style:`, atau `test:`.

## Catatan Pengujian

Spec Bagian 12 hanya merencanakan verifikasi manual di peramban. Rencana ini **menambahkan** test runner minimal tanpa dependensi (`tests/runner.html`, sekitar 60 baris) untuk menguji logika murni: CRUD store, perhitungan denda, penyaringan tabel, dan validator. Alasannya, perhitungan denda dan pengurangan stok adalah bagian paling rawan galat di proyek ini dan memverifikasinya dengan klik satu per satu tidak dapat diandalkan. Berkas tes tidak memengaruhi aplikasi dan tidak dimuat oleh halaman mana pun.

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `assets/js/config.js` | `tailwind.config` — seluruh design token |
| `assets/css/style.css` | Variabel CSS tema + seluruh kelas komponen |
| `assets/js/data.js` | Seed mock data (`SEED`) |
| `assets/js/store.js` | CRUD di atas `localStorage` + aturan bisnis. Tanpa DOM. |
| `assets/js/ui.js` | Modal, toast, validator, formatter. Tanpa domain. |
| `assets/js/table.js` | Mesin tabel generik: cari, saring, urutkan, paginasi |
| `assets/js/layout.js` | Tema, sidebar, menu aktif, penjaga sesi |
| `assets/js/page-*.js` | Perekat per halaman |
| `pages/layout.html` | Template master (keluaran Milestone 2) |
| `tests/*` | Test runner + berkas tes |

---

### Task 1: Design Token dan Stylesheet Glass

**Files:**
- Create: `assets/js/config.js`
- Create: `assets/css/style.css`
- Create: `docs/design-system.html`

**Interfaces:**
- Consumes: tidak ada (task pertama)
- Produces: variabel CSS `--bg-a --bg-b --glass --glass-strong --glass-border --text --muted`; kelas komponen `.app-bg .glass-card .glass-panel .glass-strong .glass-input .glass-select .btn .btn-primary .btn-ghost .btn-danger .badge .badge-ok .badge-warn .badge-bad .chip .stat-value`; warna Tailwind `brand ok warn bad ink`

- [ ] **Step 1: Buat `assets/js/config.js`**

```js
/* Design token — satu sumber kebenaran untuk seluruh nilai visual.
   Dimuat SETELAH cdn.tailwindcss.com; Play CDN membaca variabel global
   `tailwind.config` lalu mengompilasi ulang utility yang dipakai. */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#6366F1', 600: '#4F46E5', 400: '#818CF8' },
        ok:    '#14B8A6',
        warn:  '#F59E0B',
        bad:   '#F43F5E',
        ink:   { 900: '#0B1020', 800: '#131A33', 700: '#1B2347' }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: { control: '12px', card: '16px', panel: '24px' },
      backdropBlur: { sm: '12px', md: '20px', lg: '32px' }
    }
  }
};
```

- [ ] **Step 2: Buat `assets/css/style.css`**

Perhatikan: tanpa `@apply`, tanpa `@layer`. CSS biasa, dimuat setelah skrip Tailwind.

```css
/* ============================================================
   E-Library — Universitas Pamulang
   Variabel tema + kelas komponen.
   JANGAN pakai @apply di sini: Tailwind Play CDN tidak
   mengompilasi berkas CSS eksternal.
   ============================================================ */

/* --- Token tema: :root = mode terang, .dark = mode gelap --- */
:root {
  --bg-a: #EEF2FF;
  --bg-b: #E0E7FF;
  --glass: rgba(255, 255, 255, .65);
  --glass-strong: rgba(255, 255, 255, .86);
  --glass-border: rgba(255, 255, 255, .90);
  --text: #0F172A;
  --muted: #475569;
  --shadow-card: 0 8px 32px rgba(15, 23, 42, .10);
  --shadow-modal: 0 24px 64px rgba(15, 23, 42, .22);
  --orb-1: rgba(99, 102, 241, .35);
  --orb-2: rgba(20, 184, 166, .28);
}
.dark {
  --bg-a: #0B1020;
  --bg-b: #131A33;
  --glass: rgba(255, 255, 255, .08);
  --glass-strong: rgba(255, 255, 255, .14);
  --glass-border: rgba(255, 255, 255, .18);
  --text: #F8FAFC;
  --muted: #94A3B8;
  --shadow-card: 0 8px 32px rgba(0, 0, 0, .24);
  --shadow-modal: 0 24px 64px rgba(0, 0, 0, .40);
  --orb-1: rgba(99, 102, 241, .45);
  --orb-2: rgba(20, 184, 166, .32);
}

/* --- Dasar --- */
html { color-scheme: light dark; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, system-ui, sans-serif;
  color: var(--text);
  background: var(--bg-a);
  transition: background-color .3s ease, color .3s ease;
}
h1, h2, h3, h4 { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-weight: 700; margin: 0; }
:focus-visible { outline: 2px solid #6366F1; outline-offset: 2px; border-radius: 6px; }

/* Latar mesh gradient + dua orb blur.
   Orb memakai ::before/::after pada .app-bg agar tidak menambah markup. */
.app-bg {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 15% -10%, var(--orb-1), transparent 60%),
    radial-gradient(900px 500px at 95% 10%, var(--orb-2), transparent 55%),
    linear-gradient(160deg, var(--bg-a) 0%, var(--bg-b) 100%);
  background-attachment: fixed;
}

/* --- Permukaan glass --- */
.glass-card,
.glass-panel {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-card);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
}
.glass-card  { border-radius: 16px; }
.glass-panel { border-radius: 24px; -webkit-backdrop-filter: blur(32px) saturate(140%); backdrop-filter: blur(32px) saturate(140%); }

/* Permukaan pekat untuk data tabular — keterbacaan menang atas efek. */
.glass-strong {
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  backdrop-filter: blur(20px) saturate(120%);
}

/* Cadangan untuk peramban tanpa backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .glass-card, .glass-panel { background: var(--glass-strong); }
}

/* --- Kontrol --- */
.glass-input,
.glass-select,
.glass-textarea {
  width: 100%;
  padding: 10px 14px;
  color: var(--text);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  font: inherit;
  transition: border-color .2s, box-shadow .2s;
}
.glass-input::placeholder, .glass-textarea::placeholder { color: var(--muted); }
.glass-input:focus, .glass-select:focus, .glass-textarea:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, .25);
}
.glass-input[aria-invalid="true"] { border-color: #F43F5E; box-shadow: 0 0 0 3px rgba(244, 63, 94, .22); }
.field-error { display: block; margin-top: 6px; color: #F43F5E; font-size: 12px; }
.field-label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: var(--muted); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 18px; border-radius: 12px; border: 1px solid transparent;
  font: inherit; font-weight: 600; cursor: pointer;
  transition: transform .15s, filter .15s, background-color .2s;
}
.btn:active { transform: translateY(1px); }
.btn-primary { background: #6366F1; color: #fff; box-shadow: 0 6px 20px rgba(99, 102, 241, .35); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-ghost { background: var(--glass); border-color: var(--glass-border); color: var(--text); }
.btn-ghost:hover { background: var(--glass-strong); }
.btn-danger { background: #F43F5E; color: #fff; }
.btn-danger:hover { filter: brightness(1.08); }
.btn-icon { padding: 8px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--muted); cursor: pointer; }
.btn-icon:hover { background: var(--glass); border-color: var(--glass-border); color: var(--text); }

/* --- Lencana & chip. Warna tidak pernah jadi satu-satunya penanda:
       teks selalu ikut. --- */
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.badge::before { content: ""; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.badge-ok   { color: #0D9488; background: rgba(20, 184, 166, .16); }
.badge-warn { color: #B45309; background: rgba(245, 158, 11, .16); }
.badge-bad  { color: #BE123C; background: rgba(244, 63, 94, .16); }
.badge-muted{ color: var(--muted); background: var(--glass-strong); }
.dark .badge-ok   { color: #5EEAD4; }
.dark .badge-warn { color: #FCD34D; }
.dark .badge-bad  { color: #FDA4AF; }

.chip {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 500;
  color: #4F46E5; background: rgba(99, 102, 241, .14);
}
.dark .chip { color: #A5B4FC; }

/* --- Angka statistik: digit sejajar antar baris --- */
.stat-value, .tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
.stat-value { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 32px; font-weight: 700; line-height: 1.1; }
.text-muted { color: var(--muted); }
```

- [ ] **Step 3: Buat `docs/design-system.html`**

Halaman ini menggantikan Figma sebagai sumber nilai yang pasti — dibuka, ditangkap layar, lalu nilainya disalin ke Figma.

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design System — E-Library Universitas Pamulang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="../assets/js/config.js"></script>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="app-bg">
<div class="max-w-5xl mx-auto px-6 py-10 space-y-10">

  <header class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-3xl">Design System</h1>
      <p class="text-muted mt-1">E-Library &mdash; Universitas Pamulang</p>
    </div>
    <button id="toggleTema" class="btn btn-ghost">Ganti Mode</button>
  </header>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Warna Aksen</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="swatchAksen"></div>
  </section>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Permukaan</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-card p-5"><p class="font-semibold">glass-card</p><p class="text-muted text-sm mt-1">blur 20px &middot; radius 16px</p></div>
      <div class="glass-panel p-5"><p class="font-semibold">glass-panel</p><p class="text-muted text-sm mt-1">blur 32px &middot; radius 24px</p></div>
      <div class="glass-strong p-5"><p class="font-semibold">glass-strong</p><p class="text-muted text-sm mt-1">untuk tabel data</p></div>
    </div>
  </section>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Tipografi</h2>
    <p style="font-size:40px" class="font-display font-bold">40 &middot; Plus Jakarta Sans</p>
    <p style="font-size:32px" class="font-display font-bold">32 &middot; Plus Jakarta Sans</p>
    <p style="font-size:24px" class="font-display font-bold">24 &middot; Plus Jakarta Sans</p>
    <p style="font-size:20px" class="font-display font-bold">20 &middot; Plus Jakarta Sans</p>
    <p style="font-size:16px">16 &middot; Inter &mdash; teks isi</p>
    <p style="font-size:14px">14 &middot; Inter &mdash; teks tabel</p>
    <p style="font-size:12px" class="text-muted">12 &middot; Inter &mdash; keterangan</p>
    <p class="stat-value mt-4">1.284</p>
    <p class="text-muted text-sm">Angka statistik &mdash; tabular-nums</p>
  </section>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Tombol</h2>
    <div class="flex flex-wrap gap-3">
      <button class="btn btn-primary">Tombol Utama</button>
      <button class="btn btn-ghost">Tombol Sekunder</button>
      <button class="btn btn-danger">Hapus</button>
    </div>
  </section>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Lencana &amp; Chip</h2>
    <div class="flex flex-wrap gap-3">
      <span class="badge badge-ok">Tersedia</span>
      <span class="badge badge-warn">Jatuh Tempo</span>
      <span class="badge badge-bad">Terlambat</span>
      <span class="badge badge-muted">Nonaktif</span>
      <span class="chip">Teknologi</span>
    </div>
  </section>

  <section class="glass-panel p-6">
    <h2 class="text-xl mb-4">Kontrol Form</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <label class="field-label" for="c1">Judul Buku</label>
        <input id="c1" class="glass-input" placeholder="Masukkan judul">
      </div>
      <div>
        <label class="field-label" for="c2">ISBN (contoh galat)</label>
        <input id="c2" class="glass-input" aria-invalid="true" value="123">
        <span class="field-error">ISBN harus terdiri dari 10 atau 13 digit.</span>
      </div>
    </div>
  </section>

</div>

<script src="../assets/js/layout.js"></script>
<script>
  Layout.initTheme();
  document.getElementById('toggleTema').addEventListener('click', Layout.toggleTheme);

  const AKSEN = [
    ['brand / primary', '#6366F1', 'Aksi utama, menu aktif'],
    ['ok / success',    '#14B8A6', 'Tersedia, aktif, tepat waktu'],
    ['warn / warning',  '#F59E0B', 'Mendekati jatuh tempo'],
    ['bad / danger',    '#F43F5E', 'Terlambat, hapus, galat']
  ];
  document.getElementById('swatchAksen').innerHTML = AKSEN.map(function (s) {
    return '<div class="glass-card overflow-hidden">' +
             '<div style="height:72px;background:' + s[1] + '"></div>' +
             '<div class="p-3">' +
               '<p class="font-semibold text-sm">' + s[0] + '</p>' +
               '<p class="text-muted text-xs tabular">' + s[1] + '</p>' +
               '<p class="text-muted text-xs mt-1">' + s[2] + '</p>' +
             '</div>' +
           '</div>';
  }).join('');
</script>
</body>
</html>
```

- [ ] **Step 4: Buat `assets/js/layout.js` — baru bagian tema saja**

Sisa modul ini diisi pada Task 7. Dipisahkan agar `design-system.html` bisa memakai tema tanpa ikut terkena penjaga sesi.

```js
/* Kerangka bersama seluruh halaman.
   initTheme() sengaja berdiri sendiri agar halaman di luar aplikasi
   (mis. design-system.html) bisa memakainya tanpa memicu penjaga sesi. */
var Layout = (function () {
  var KEY_TEMA = 'elibrary.theme';

  function terapkanTema(tema) {
    document.documentElement.classList.toggle('dark', tema === 'dark');
  }

  function initTheme() {
    var tersimpan = null;
    try { tersimpan = localStorage.getItem(KEY_TEMA); } catch (e) { /* mode privat */ }
    terapkanTema(tersimpan || 'dark');   // gelap adalah default
  }

  function toggleTema() {
    var jadiGelap = !document.documentElement.classList.contains('dark');
    terapkanTema(jadiGelap ? 'dark' : 'light');
    try { localStorage.setItem(KEY_TEMA, jadiGelap ? 'dark' : 'light'); } catch (e) { /* abaikan */ }
    document.dispatchEvent(new CustomEvent('temaberubah', { detail: { gelap: jadiGelap } }));
  }

  return { initTheme: initTheme, toggleTheme: toggleTema };
})();
```

- [ ] **Step 5: Verifikasi di peramban**

Jalankan dari akar proyek:

```bash
python -m http.server 8080
```

Buka `http://localhost:8080/docs/design-system.html`. Yang harus terlihat:
- Latar gradien gelap dengan dua orb lembut
- Seluruh panel tampak buram/frosted, bukan kotak datar
- Tombol "Ganti Mode" membalik ke mode terang; muat ulang halaman dan mode terang bertahan
- Console bersih kecuali peringatan `cdn.tailwindcss.com should not be used in production`

- [ ] **Step 6: Commit**

```bash
git add assets/js/config.js assets/css/style.css assets/js/layout.js docs/design-system.html
git commit -m "feat: design token, stylesheet glass, dan halaman design system"
```

---

### Task 2: Seed Mock Data

**Files:**
- Create: `assets/js/data.js`

**Interfaces:**
- Consumes: tidak ada
- Produces: `Data.buatSeed()` → objek `{ petugas, kategori, buku, anggota, peminjaman, detailPeminjaman, denda, trenBulanan }`. Seluruh tanggal berupa string ISO `YYYY-MM-DD`, dihitung relatif terhadap hari saat fungsi dipanggil.

- [ ] **Step 1: Buat `assets/js/data.js`**

```js
/* Seed mock data. Dipanggil sekali oleh Store saat localStorage masih kosong.
   Tanggal dihitung relatif terhadap hari pemanggilan agar status
   "jatuh tempo hari ini" dan "terlambat" selalu relevan kapan pun didemokan. */
var Data = (function () {

  function geser(hari) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + hari);
    return d.toISOString().slice(0, 10);
  }

  var KATEGORI = [
    { id: 'KT001', nama: 'Karya Umum',      kodeDdc: '000' },
    { id: 'KT002', nama: 'Filsafat',        kodeDdc: '100' },
    { id: 'KT003', nama: 'Agama',           kodeDdc: '200' },
    { id: 'KT004', nama: 'Ilmu Sosial',     kodeDdc: '300' },
    { id: 'KT005', nama: 'Bahasa',          kodeDdc: '400' },
    { id: 'KT006', nama: 'Sains Murni',     kodeDdc: '500' },
    { id: 'KT007', nama: 'Teknologi',       kodeDdc: '600' },
    { id: 'KT008', nama: 'Seni & Sastra',   kodeDdc: '700' }
  ];

  var PETUGAS = [
    { id: 'PT001', nama: 'Abdul Rachman', username: 'admin', email: 'admin@unpam.ac.id', role: 'Administrator' },
    { id: 'PT002', nama: 'Siti Nurhaliza', username: 'pustakawan', email: 'siti@unpam.ac.id', role: 'Pustakawan' }
  ];

  /* 24 judul. jumlahTersedia diselaraskan dengan peminjaman aktif di Step berikutnya. */
  var BUKU = [
    { id: 'BK001', isbn: '9786020332123', judul: 'Algoritma dan Struktur Data', pengarang: 'Rinaldi Munir', penerbit: 'Informatika', tahunTerbit: 2021, idKategori: 'KT007', jumlahTotal: 6, lokasiRak: 'R-07-A' },
    { id: 'BK002', isbn: '9789792248470', judul: 'Basis Data Relasional', pengarang: 'Fathansyah', penerbit: 'Informatika', tahunTerbit: 2020, idKategori: 'KT007', jumlahTotal: 5, lokasiRak: 'R-07-A' },
    { id: 'BK003', isbn: '9786020634562', judul: 'Pemrograman Web Modern', pengarang: 'Betha Sidik', penerbit: 'Informatika', tahunTerbit: 2022, idKategori: 'KT007', jumlahTotal: 8, lokasiRak: 'R-07-B' },
    { id: 'BK004', isbn: '9789794338872', judul: 'Jaringan Komputer Dasar', pengarang: 'Iwan Sofana', penerbit: 'Informatika', tahunTerbit: 2019, idKategori: 'KT007', jumlahTotal: 4, lokasiRak: 'R-07-B' },
    { id: 'BK005', isbn: '9786230012345', judul: 'Kecerdasan Buatan Terapan', pengarang: 'Suyanto', penerbit: 'Informatika', tahunTerbit: 2023, idKategori: 'KT007', jumlahTotal: 3, lokasiRak: 'R-07-C' },
    { id: 'BK006', isbn: '9789791234567', judul: 'Rekayasa Perangkat Lunak', pengarang: 'Rosa A. S.', penerbit: 'Informatika', tahunTerbit: 2021, idKategori: 'KT007', jumlahTotal: 5, lokasiRak: 'R-07-C' },
    { id: 'BK007', isbn: '9786020385471', judul: 'Kalkulus Dasar', pengarang: 'Edwin J. Purcell', penerbit: 'Erlangga', tahunTerbit: 2018, idKategori: 'KT006', jumlahTotal: 7, lokasiRak: 'R-05-A' },
    { id: 'BK008', isbn: '9789790335486', judul: 'Fisika untuk Universitas', pengarang: 'Halliday & Resnick', penerbit: 'Erlangga', tahunTerbit: 2020, idKategori: 'KT006', jumlahTotal: 4, lokasiRak: 'R-05-A' },
    { id: 'BK009', isbn: '9786020451237', judul: 'Kimia Organik Dasar', pengarang: 'Hardjono Sastrohamidjojo', penerbit: 'UGM Press', tahunTerbit: 2017, idKategori: 'KT006', jumlahTotal: 3, lokasiRak: 'R-05-B' },
    { id: 'BK010', isbn: '9789794613542', judul: 'Statistika Terapan', pengarang: 'Sugiyono', penerbit: 'Alfabeta', tahunTerbit: 2022, idKategori: 'KT006', jumlahTotal: 6, lokasiRak: 'R-05-B' },
    { id: 'BK011', isbn: '9786024225551', judul: 'Pengantar Ilmu Ekonomi', pengarang: 'Sadono Sukirno', penerbit: 'Rajawali Pers', tahunTerbit: 2019, idKategori: 'KT004', jumlahTotal: 8, lokasiRak: 'R-03-A' },
    { id: 'BK012', isbn: '9789790767829', judul: 'Manajemen Sumber Daya Manusia', pengarang: 'Malayu Hasibuan', penerbit: 'Bumi Aksara', tahunTerbit: 2021, idKategori: 'KT004', jumlahTotal: 5, lokasiRak: 'R-03-A' },
    { id: 'BK013', isbn: '9786020629934', judul: 'Sosiologi Perubahan Sosial', pengarang: 'Soerjono Soekanto', penerbit: 'Rajawali Pers', tahunTerbit: 2018, idKategori: 'KT004', jumlahTotal: 4, lokasiRak: 'R-03-B' },
    { id: 'BK014', isbn: '9789794611234', judul: 'Pengantar Hukum Indonesia', pengarang: 'Titik Triwulan', penerbit: 'Kencana', tahunTerbit: 2020, idKategori: 'KT004', jumlahTotal: 3, lokasiRak: 'R-03-B' },
    { id: 'BK015', isbn: '9786020332789', judul: 'Tata Bahasa Indonesia Baku', pengarang: 'Gorys Keraf', penerbit: 'Gramedia', tahunTerbit: 2016, idKategori: 'KT005', jumlahTotal: 6, lokasiRak: 'R-04-A' },
    { id: 'BK016', isbn: '9780194738767', judul: 'Academic English for Students', pengarang: 'Michael Swan', penerbit: 'Oxford', tahunTerbit: 2021, idKategori: 'KT005', jumlahTotal: 5, lokasiRak: 'R-04-A' },
    { id: 'BK017', isbn: '9786020332451', judul: 'Filsafat Ilmu Pengetahuan', pengarang: 'Jujun S. Suriasumantri', penerbit: 'Pustaka Sinar Harapan', tahunTerbit: 2015, idKategori: 'KT002', jumlahTotal: 3, lokasiRak: 'R-01-A' },
    { id: 'BK018', isbn: '9789794336677', judul: 'Logika dan Penalaran Kritis', pengarang: 'Alex Lanur', penerbit: 'Kanisius', tahunTerbit: 2017, idKategori: 'KT002', jumlahTotal: 2, lokasiRak: 'R-01-A' },
    { id: 'BK019', isbn: '9786024881122', judul: 'Pendidikan Agama dan Karakter', pengarang: 'Abdul Majid', penerbit: 'Remaja Rosdakarya', tahunTerbit: 2019, idKategori: 'KT003', jumlahTotal: 5, lokasiRak: 'R-02-A' },
    { id: 'BK020', isbn: '9789793067889', judul: 'Sejarah Peradaban Dunia', pengarang: 'Badri Yatim', penerbit: 'Rajawali Pers', tahunTerbit: 2018, idKategori: 'KT003', jumlahTotal: 4, lokasiRak: 'R-02-A' },
    { id: 'BK021', isbn: '9786020385129', judul: 'Bumi Manusia', pengarang: 'Pramoedya Ananta Toer', penerbit: 'Lentera Dipantara', tahunTerbit: 2011, idKategori: 'KT008', jumlahTotal: 9, lokasiRak: 'R-08-A' },
    { id: 'BK022', isbn: '9789794338833', judul: 'Laskar Pelangi', pengarang: 'Andrea Hirata', penerbit: 'Bentang Pustaka', tahunTerbit: 2008, idKategori: 'KT008', jumlahTotal: 7, lokasiRak: 'R-08-A' },
    { id: 'BK023', isbn: '9786020332000', judul: 'Sejarah Seni Rupa Indonesia', pengarang: 'Agus Sachari', penerbit: 'Erlangga', tahunTerbit: 2016, idKategori: 'KT008', jumlahTotal: 3, lokasiRak: 'R-08-B' },
    { id: 'BK024', isbn: '9789792201234', judul: 'Ensiklopedia Umum Nusantara', pengarang: 'Tim Redaksi', penerbit: 'Balai Pustaka', tahunTerbit: 2014, idKategori: 'KT001', jumlahTotal: 2, lokasiRak: 'R-00-A' }
  ];

  var JURUSAN = ['Teknik Informatika', 'Manajemen', 'Akuntansi', 'Ilmu Hukum', 'Sastra Inggris', 'Teknik Industri'];

  var ANGGOTA = [
    { id: 'AG001', nim: '211011400101', nama: 'Bagas Prasetyo',   jurusan: 'Teknik Informatika', angkatan: 2021, status: 'Aktif' },
    { id: 'AG002', nim: '211011400102', nama: 'Dewi Anggraini',   jurusan: 'Teknik Informatika', angkatan: 2021, status: 'Aktif' },
    { id: 'AG003', nim: '221011400203', nama: 'Rizki Ramadhan',   jurusan: 'Teknik Informatika', angkatan: 2022, status: 'Aktif' },
    { id: 'AG004', nim: '221011400204', nama: 'Nabila Syifa',     jurusan: 'Manajemen',          angkatan: 2022, status: 'Aktif' },
    { id: 'AG005', nim: '201011400305', nama: 'Fajar Nugroho',    jurusan: 'Manajemen',          angkatan: 2020, status: 'Nonaktif' },
    { id: 'AG006', nim: '231011400306', nama: 'Salsabila Putri',  jurusan: 'Akuntansi',          angkatan: 2023, status: 'Aktif' },
    { id: 'AG007', nim: '221011400207', nama: 'Andi Kurniawan',   jurusan: 'Akuntansi',          angkatan: 2022, status: 'Aktif' },
    { id: 'AG008', nim: '211011400108', nama: 'Maulana Hakim',    jurusan: 'Ilmu Hukum',         angkatan: 2021, status: 'Diblokir' },
    { id: 'AG009', nim: '231011400309', nama: 'Citra Amelia',     jurusan: 'Ilmu Hukum',         angkatan: 2023, status: 'Aktif' },
    { id: 'AG010', nim: '201011400310', nama: 'Yoga Pratama',     jurusan: 'Sastra Inggris',     angkatan: 2020, status: 'Aktif' },
    { id: 'AG011', nim: '221011400211', nama: 'Intan Permata',    jurusan: 'Sastra Inggris',     angkatan: 2022, status: 'Aktif' },
    { id: 'AG012', nim: '231011400312', nama: 'Hendra Wijaya',    jurusan: 'Teknik Industri',    angkatan: 2023, status: 'Aktif' },
    { id: 'AG013', nim: '211011400113', nama: 'Larasati Ayu',     jurusan: 'Teknik Industri',    angkatan: 2021, status: 'Aktif' },
    { id: 'AG014', nim: '221011400214', nama: 'Dimas Aryo',       jurusan: 'Teknik Informatika', angkatan: 2022, status: 'Aktif' },
    { id: 'AG015', nim: '231011400315', nama: 'Putri Maharani',   jurusan: 'Manajemen',          angkatan: 2023, status: 'Aktif' },
    { id: 'AG016', nim: '201011400316', nama: 'Reza Firmansyah',  jurusan: 'Akuntansi',          angkatan: 2020, status: 'Nonaktif' },
    { id: 'AG017', nim: '221011400217', nama: 'Alya Rahmadani',   jurusan: 'Ilmu Hukum',         angkatan: 2022, status: 'Aktif' },
    { id: 'AG018', nim: '231011400318', nama: 'Galih Saputra',    jurusan: 'Teknik Industri',    angkatan: 2023, status: 'Aktif' }
  ];

  /* Rencana 20 transaksi.
     pinjamHariKe = offset hari dari hari ini (negatif = masa lalu).
     kembaliHariKe = null bila masih dipinjam. */
  var RENCANA_PINJAM = [
    { anggota: 'AG001', buku: 'BK003', pinjamHariKe: -3,  kembaliHariKe: null },
    { anggota: 'AG002', buku: 'BK001', pinjamHariKe: -7,  kembaliHariKe: null },
    { anggota: 'AG003', buku: 'BK005', pinjamHariKe: -12, kembaliHariKe: null },
    { anggota: 'AG004', buku: 'BK011', pinjamHariKe: -6,  kembaliHariKe: null },
    { anggota: 'AG006', buku: 'BK021', pinjamHariKe: -1,  kembaliHariKe: null },
    { anggota: 'AG007', buku: 'BK010', pinjamHariKe: -15, kembaliHariKe: null },
    { anggota: 'AG009', buku: 'BK014', pinjamHariKe: -5,  kembaliHariKe: null },
    { anggota: 'AG010', buku: 'BK016', pinjamHariKe: -9,  kembaliHariKe: null },
    { anggota: 'AG011', buku: 'BK022', pinjamHariKe: -2,  kembaliHariKe: null },
    { anggota: 'AG012', buku: 'BK006', pinjamHariKe: -20, kembaliHariKe: null },
    { anggota: 'AG013', buku: 'BK007', pinjamHariKe: -4,  kembaliHariKe: null },
    { anggota: 'AG014', buku: 'BK002', pinjamHariKe: -30, kembaliHariKe: -25 },
    { anggota: 'AG015', buku: 'BK012', pinjamHariKe: -28, kembaliHariKe: -22 },
    { anggota: 'AG017', buku: 'BK019', pinjamHariKe: -45, kembaliHariKe: -36 },
    { anggota: 'AG018', buku: 'BK008', pinjamHariKe: -40, kembaliHariKe: -34 },
    { anggota: 'AG001', buku: 'BK015', pinjamHariKe: -60, kembaliHariKe: -52 },
    { anggota: 'AG003', buku: 'BK021', pinjamHariKe: -55, kembaliHariKe: -49 },
    { anggota: 'AG009', buku: 'BK004', pinjamHariKe: -50, kembaliHariKe: -41 },
    { anggota: 'AG012', buku: 'BK013', pinjamHariKe: -35, kembaliHariKe: -29 },
    { anggota: 'AG015', buku: 'BK022', pinjamHariKe: -70, kembaliHariKe: -63 }
  ];

  var MASA_PINJAM = 7;
  var DENDA_PER_HARI = 1000;

  function buatSeed() {
    var buku = BUKU.map(function (b) {
      return Object.assign({}, b, { jumlahTersedia: b.jumlahTotal, cover: '', sinopsis: '' });
    });

    var anggota = ANGGOTA.map(function (a, i) {
      return Object.assign({}, a, {
        email: a.nama.toLowerCase().replace(/\s+/g, '.') + '@student.unpam.ac.id',
        telepon: '08' + String(1234567890 + i * 137).slice(0, 10),
        tglDaftar: geser(-(400 - i * 13))
      });
    });

    var peminjaman = [];
    var detailPeminjaman = [];
    var denda = [];

    RENCANA_PINJAM.forEach(function (r, i) {
      var nomor = String(i + 1).padStart(3, '0');
      var tglPinjam = geser(r.pinjamHariKe);
      var tglJatuhTempo = geser(r.pinjamHariKe + MASA_PINJAM);
      var tglKembali = r.kembaliHariKe === null ? null : geser(r.kembaliHariKe);

      peminjaman.push({
        id: 'PJ' + nomor,
        idAnggota: r.anggota,
        idPetugas: i % 2 === 0 ? 'PT001' : 'PT002',
        tglPinjam: tglPinjam,
        tglJatuhTempo: tglJatuhTempo,
        tglKembali: tglKembali,
        status: tglKembali ? 'Dikembalikan' : 'Dipinjam'
      });

      detailPeminjaman.push({
        id: 'DT' + nomor,
        idPinjam: 'PJ' + nomor,
        idBuku: r.buku,
        kondisiKembali: tglKembali ? 'Baik' : null
      });

      // Kurangi stok untuk peminjaman yang masih berjalan
      if (!tglKembali) {
        var target = buku.find(function (b) { return b.id === r.buku; });
        if (target && target.jumlahTersedia > 0) target.jumlahTersedia -= 1;
      }

      // Denda untuk yang dikembalikan melewati jatuh tempo
      if (r.kembaliHariKe !== null) {
        var terlambat = r.kembaliHariKe - (r.pinjamHariKe + MASA_PINJAM);
        if (terlambat > 0) {
          denda.push({
            id: 'DN' + nomor,
            idPinjam: 'PJ' + nomor,
            hariTerlambat: terlambat,
            nominal: terlambat * DENDA_PER_HARI,
            statusBayar: 'Lunas'
          });
        }
      }
    });

    /* Tren 12 bulan terakhir untuk grafik dashboard. Indeks 11 = bulan ini. */
    var JUMLAH_TREN = [38, 45, 41, 52, 47, 58, 63, 55, 61, 72, 68, 74];
    var trenBulanan = JUMLAH_TREN.map(function (jml, i) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      return {
        bulan: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        peminjaman: jml,
        pengembalian: Math.max(0, jml - (i === 11 ? 12 : 3))
      };
    });

    return {
      petugas: PETUGAS,
      kategori: KATEGORI,
      buku: buku,
      anggota: anggota,
      peminjaman: peminjaman,
      detailPeminjaman: detailPeminjaman,
      denda: denda,
      trenBulanan: trenBulanan
    };
  }

  return { buatSeed: buatSeed, MASA_PINJAM: MASA_PINJAM, DENDA_PER_HARI: DENDA_PER_HARI };
})();
```

- [ ] **Step 2: Verifikasi bentuk data di console**

Buka `http://localhost:8080/docs/design-system.html`, lalu di console peramban:

```js
var s = Data.buatSeed();
console.log(s.buku.length, s.anggota.length, s.kategori.length, s.peminjaman.length);
console.log(s.peminjaman.filter(p => p.status === 'Dipinjam').length);
console.log(s.buku.find(b => b.id === 'BK021'));
```

Diharapkan: `24 18 8 20`, lalu `11` peminjaman aktif, dan `BK021` punya `jumlahTersedia: 8` dari `jumlahTotal: 9`.

Catatan: `data.js` belum dimuat oleh halaman mana pun. Untuk pemeriksaan ini, tambahkan sementara `<script src="../assets/js/data.js"></script>` di `design-system.html`, jalankan, lalu hapus lagi sebelum commit.

- [ ] **Step 3: Commit**

```bash
git add assets/js/data.js
git commit -m "feat: seed mock data 24 buku, 18 anggota, 20 transaksi"
```

---

### Task 3: Test Runner dan Store CRUD

**Files:**
- Create: `tests/assert.js`
- Create: `tests/runner.html`
- Create: `tests/store.test.js`
- Create: `assets/js/store.js`

**Interfaces:**
- Consumes: `Data.buatSeed()` dari Task 2
- Produces:
  - `T.test(nama, fn)`, `T.run()`, `eq(aktual, harapan, pesan)`, `truthy(nilai, pesan)`, `throws(fn, pesan)`
  - `Store.init()`, `Store.reset()`, `Store.raw()`
  - Untuk tiap entitas `buku | anggota | peminjaman`: `.all()`, `.find(id)`, `.create(obj)` → objek dengan `id` baru, `.update(id, patch)` → objek terbaru atau `null`, `.remove(id)` → `boolean`
  - `Store.kategori.all()`, `Store.kategori.find(id)`, `Store.petugas.all()`
  - `Store.detail.all()`, `Store.denda.all()`, `Store.tren()`

- [ ] **Step 1: Tulis test runner `tests/assert.js`**

```js
/* Test runner minimal tanpa dependensi. Berjalan di peramban,
   hasilnya dirender ke elemen #hasil oleh runner.html. */
var T = (function () {
  var daftar = [];
  var galat = [];

  function test(nama, fn) { daftar.push({ nama: nama, fn: fn }); }

  function eq(aktual, harapan, pesan) {
    var a = JSON.stringify(aktual), h = JSON.stringify(harapan);
    if (a !== h) throw new Error((pesan || 'Tidak sama') + ' — diharapkan ' + h + ', didapat ' + a);
  }

  function truthy(nilai, pesan) {
    if (!nilai) throw new Error((pesan || 'Diharapkan bernilai benar') + ' — didapat ' + JSON.stringify(nilai));
  }

  function throws(fn, pesan) {
    var terlempar = false;
    try { fn(); } catch (e) { terlempar = true; }
    if (!terlempar) throw new Error(pesan || 'Diharapkan melempar galat, tetapi tidak');
  }

  function run(mount) {
    var lolos = 0;
    galat = [];
    var baris = daftar.map(function (t) {
      try {
        t.fn();
        lolos++;
        return '<li style="color:#14B8A6">LULUS &mdash; ' + t.nama + '</li>';
      } catch (e) {
        galat.push(t.nama + ': ' + e.message);
        return '<li style="color:#F43F5E">GAGAL &mdash; ' + t.nama + '<br><small>' + e.message + '</small></li>';
      }
    });
    var ringkas = lolos + ' / ' + daftar.length + ' lulus';
    mount.innerHTML = '<h2>' + ringkas + '</h2><ul style="line-height:1.8">' + baris.join('') + '</ul>';
    console.log('[TES] ' + ringkas);
    galat.forEach(function (g) { console.error('[TES] ' + g); });
    return { total: daftar.length, lolos: lolos, gagal: galat };
  }

  return { test: test, run: run, eq: eq, truthy: truthy, throws: throws };
})();

var test = T.test, eq = T.eq, truthy = T.truthy, throws = T.throws;
```

- [ ] **Step 2: Tulis `tests/runner.html`**

```html
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Tes — E-Library</title>
<style>
  body { font-family: ui-monospace, Consolas, monospace; background: #0B1020; color: #F8FAFC; padding: 24px; }
  h1 { font-size: 18px; } h2 { font-size: 16px; color: #818CF8; }
  ul { list-style: none; padding-left: 0; } small { color: #94A3B8; }
</style>
</head>
<body>
<h1>Tes Logika E-Library &mdash; Universitas Pamulang</h1>
<div id="hasil">Menjalankan&hellip;</div>

<script src="assert.js"></script>
<script src="../assets/js/data.js"></script>
<script src="../assets/js/store.js"></script>
<script src="../assets/js/ui.js"></script>
<script src="../assets/js/table.js"></script>

<script src="store.test.js"></script>
<script src="rules.test.js"></script>
<script src="ui.test.js"></script>
<script src="table.test.js"></script>

<script>T.run(document.getElementById('hasil'));</script>
</body>
</html>
```

Berkas `ui.js`, `table.js`, `rules.test.js`, `ui.test.js`, dan `table.test.js` belum ada sampai Task 4–6. Sampai saat itu runner akan mencatat 404 di console; ini normal dan tidak menggagalkan tes yang sudah ada. Jangan hapus baris-baris tersebut.

- [ ] **Step 3: Tulis tes Store yang gagal `tests/store.test.js`**

```js
function bersih() { Store.reset(); }

test('reset menghasilkan 24 buku', function () {
  bersih();
  eq(Store.buku.all().length, 24);
});

test('reset menghasilkan 18 anggota dan 8 kategori', function () {
  bersih();
  eq(Store.anggota.all().length, 18);
  eq(Store.kategori.all().length, 8);
});

test('find mengembalikan buku sesuai id', function () {
  bersih();
  eq(Store.buku.find('BK001').judul, 'Algoritma dan Struktur Data');
});

test('find mengembalikan null untuk id tak dikenal', function () {
  bersih();
  eq(Store.buku.find('BK999'), null);
});

test('create menambah buku dengan id berurutan', function () {
  bersih();
  var baru = Store.buku.create({ judul: 'Buku Uji', pengarang: 'Penulis Uji', isbn: '1234567890', penerbit: 'Uji', tahunTerbit: 2024, idKategori: 'KT007', jumlahTotal: 2, jumlahTersedia: 2, lokasiRak: 'R-09-A' });
  eq(baru.id, 'BK025');
  eq(Store.buku.all().length, 25);
});

test('create menyimpan data lintas pembacaan ulang', function () {
  bersih();
  Store.buku.create({ judul: 'Buku Persist', pengarang: 'X', isbn: '1111111111', penerbit: 'Y', tahunTerbit: 2024, idKategori: 'KT001', jumlahTotal: 1, jumlahTersedia: 1, lokasiRak: 'R-00-B' });
  Store.init();  // paksa baca ulang dari localStorage
  truthy(Store.buku.all().some(function (b) { return b.judul === 'Buku Persist'; }));
});

test('update mengubah field dan mempertahankan sisanya', function () {
  bersih();
  var hasil = Store.buku.update('BK001', { judul: 'Judul Baru' });
  eq(hasil.judul, 'Judul Baru');
  eq(hasil.pengarang, 'Rinaldi Munir');
  eq(Store.buku.find('BK001').judul, 'Judul Baru');
});

test('update mengembalikan null untuk id tak dikenal', function () {
  bersih();
  eq(Store.buku.update('BK999', { judul: 'X' }), null);
});

test('remove menghapus satu baris', function () {
  bersih();
  eq(Store.buku.remove('BK024'), true);
  eq(Store.buku.all().length, 23);
  eq(Store.buku.find('BK024'), null);
});

test('remove mengembalikan false untuk id tak dikenal', function () {
  bersih();
  eq(Store.buku.remove('BK999'), false);
});

test('anggota mendukung create dengan prefiks AG', function () {
  bersih();
  var a = Store.anggota.create({ nim: '231011400399', nama: 'Uji Coba', jurusan: 'Manajemen', angkatan: 2023, status: 'Aktif', email: 'uji@student.unpam.ac.id', telepon: '081234567890', tglDaftar: '2026-01-01' });
  eq(a.id, 'AG019');
});

test('tren berisi 12 bulan', function () {
  bersih();
  eq(Store.tren().length, 12);
});
```

- [ ] **Step 4: Jalankan tes untuk memastikan gagal**

Buka `http://localhost:8080/tests/runner.html`.
Diharapkan: semua tes **GAGAL** dengan pesan bertipe `Store is not defined`.

- [ ] **Step 5: Implementasi `assets/js/store.js`**

```js
/* Lapisan data. Tidak menyentuh DOM sama sekali.
   Seluruh isi database disimpan sebagai satu objek JSON di localStorage
   dengan kunci elibrary.db.v1, lalu di-cache di memori. */
var Store = (function () {
  var KUNCI = 'elibrary.db.v1';
  var db = null;

  var PREFIKS = {
    buku: 'BK', anggota: 'AG', kategori: 'KT',
    peminjaman: 'PJ', detailPeminjaman: 'DT', denda: 'DN', petugas: 'PT'
  };

  function baca() {
    try {
      var mentah = localStorage.getItem(KUNCI);
      return mentah ? JSON.parse(mentah) : null;
    } catch (e) {
      return null;   // mode privat atau JSON rusak
    }
  }

  function tulis() {
    try { localStorage.setItem(KUNCI, JSON.stringify(db)); }
    catch (e) { console.warn('Gagal menyimpan ke localStorage:', e.message); }
  }

  function init() {
    db = baca();
    if (!db) { db = Data.buatSeed(); tulis(); }
    return db;
  }

  function pastikan() { if (!db) init(); return db; }

  function reset() { db = Data.buatSeed(); tulis(); return db; }

  /* Nomor urut berikutnya dihitung dari id tertinggi yang ada,
     bukan dari panjang array — menghapus baris tidak boleh
     menyebabkan id terpakai ulang. */
  function idBerikutnya(koleksi, prefiks) {
    var tertinggi = 0;
    koleksi.forEach(function (r) {
      var n = parseInt(String(r.id).replace(prefiks, ''), 10);
      if (!isNaN(n) && n > tertinggi) tertinggi = n;
    });
    return prefiks + String(tertinggi + 1).padStart(3, '0');
  }

  function koleksi(nama) {
    var prefiks = PREFIKS[nama];
    return {
      all: function () { return pastikan()[nama].slice(); },
      find: function (id) {
        var hasil = pastikan()[nama].find(function (r) { return r.id === id; });
        return hasil || null;
      },
      create: function (obj) {
        var arr = pastikan()[nama];
        var baru = Object.assign({}, obj, { id: idBerikutnya(arr, prefiks) });
        arr.push(baru);
        tulis();
        return baru;
      },
      update: function (id, patch) {
        var arr = pastikan()[nama];
        var i = arr.findIndex(function (r) { return r.id === id; });
        if (i === -1) return null;
        arr[i] = Object.assign({}, arr[i], patch, { id: id });
        tulis();
        return arr[i];
      },
      remove: function (id) {
        var arr = pastikan()[nama];
        var i = arr.findIndex(function (r) { return r.id === id; });
        if (i === -1) return false;
        arr.splice(i, 1);
        tulis();
        return true;
      }
    };
  }

  return {
    init: init,
    reset: reset,
    raw: function () { return pastikan(); },
    simpan: tulis,
    buku: koleksi('buku'),
    anggota: koleksi('anggota'),
    peminjaman: koleksi('peminjaman'),
    detail: koleksi('detailPeminjaman'),
    denda: koleksi('denda'),
    kategori: {
      all: function () { return pastikan().kategori.slice(); },
      find: function (id) {
        var hasil = pastikan().kategori.find(function (r) { return r.id === id; });
        return hasil || null;
      }
    },
    petugas: {
      all: function () { return pastikan().petugas.slice(); },
      find: function (id) {
        var hasil = pastikan().petugas.find(function (r) { return r.id === id; });
        return hasil || null;
      }
    },
    tren: function () { return pastikan().trenBulanan.slice(); }
  };
})();
```

- [ ] **Step 6: Jalankan tes untuk memastikan lulus**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: **12 / 12 lulus**.

- [ ] **Step 7: Commit**

```bash
git add tests/assert.js tests/runner.html tests/store.test.js assets/js/store.js
git commit -m "feat: lapisan store localStorage dengan tes CRUD"
```

---

### Task 4: Aturan Bisnis Sirkulasi

**Files:**
- Modify: `assets/js/store.js` (tambahkan `Store.rules` sebelum baris `return {`, lalu ekspos di objek yang dikembalikan)
- Create: `tests/rules.test.js`

**Interfaces:**
- Consumes: `Store.buku`, `Store.peminjaman`, `Store.detail`, `Store.denda` dari Task 3
- Produces:
  - Konstanta `Store.rules.MASA_PINJAM_HARI = 7`, `DENDA_PER_HARI = 1000`, `MAKS_PINJAM = 3`
  - `Store.rules.hariIni()` → ISO `YYYY-MM-DD`
  - `Store.rules.tambahHari(iso, n)` → ISO
  - `Store.rules.selisihHari(isoAwal, isoAkhir)` → bilangan bulat (bisa negatif)
  - `Store.rules.jatuhTempo(tglPinjam)` → ISO
  - `Store.rules.sisaHari(tglJatuhTempo, isoHariIni)` → bilangan bulat
  - `Store.rules.statusPinjam(pinjam, isoHariIni)` → `'Dikembalikan' | 'Terlambat' | 'Segera' | 'Aman'`
  - `Store.rules.hitungDenda(tglJatuhTempo, tglKembali)` → `{ hariTerlambat, nominal }`
  - `Store.rules.jumlahPinjamanAktif(idAnggota)` → angka
  - `Store.rules.bolehPinjam(idAnggota, idBuku)` → `{ boleh, alasan }`
  - `Store.rules.catatPeminjaman({ idAnggota, idBuku, tglPinjam, idPetugas })` → objek peminjaman baru
  - `Store.rules.prosesPengembalian(idPinjam, tglKembali)` → `{ pinjam, denda }` (`denda` bernilai `null` bila tidak terlambat)
  - `Store.rules.bukuDariPinjam(idPinjam)` → objek buku atau `null`

- [ ] **Step 1: Tulis tes yang gagal `tests/rules.test.js`**

```js
var R = function () { return Store.rules; };

test('konstanta aturan bisnis sesuai spec', function () {
  eq(R().MASA_PINJAM_HARI, 7);
  eq(R().DENDA_PER_HARI, 1000);
  eq(R().MAKS_PINJAM, 3);
});

test('tambahHari menyeberangi pergantian bulan', function () {
  eq(R().tambahHari('2026-01-28', 7), '2026-02-04');
  eq(R().tambahHari('2026-03-01', -1), '2026-02-28');
});

test('selisihHari menghitung arah maju dan mundur', function () {
  eq(R().selisihHari('2026-09-01', '2026-09-08'), 7);
  eq(R().selisihHari('2026-09-08', '2026-09-01'), -7);
  eq(R().selisihHari('2026-09-08', '2026-09-08'), 0);
});

test('jatuhTempo jatuh 7 hari setelah tanggal pinjam', function () {
  eq(R().jatuhTempo('2026-09-01'), '2026-09-08');
});

test('hitungDenda bernilai nol saat dikembalikan tepat waktu', function () {
  eq(R().hitungDenda('2026-09-08', '2026-09-08'), { hariTerlambat: 0, nominal: 0 });
});

test('hitungDenda bernilai nol saat dikembalikan lebih awal', function () {
  eq(R().hitungDenda('2026-09-08', '2026-09-05'), { hariTerlambat: 0, nominal: 0 });
});

test('hitungDenda mengenakan Rp1.000 per hari keterlambatan', function () {
  eq(R().hitungDenda('2026-09-08', '2026-09-11'), { hariTerlambat: 3, nominal: 3000 });
});

test('statusPinjam menandai yang sudah dikembalikan', function () {
  eq(R().statusPinjam({ tglKembali: '2026-09-05', tglJatuhTempo: '2026-09-08' }, '2026-09-10'), 'Dikembalikan');
});

test('statusPinjam menandai Terlambat setelah jatuh tempo', function () {
  eq(R().statusPinjam({ tglKembali: null, tglJatuhTempo: '2026-09-08' }, '2026-09-09'), 'Terlambat');
});

test('statusPinjam menandai Segera saat sisa dua hari atau kurang', function () {
  eq(R().statusPinjam({ tglKembali: null, tglJatuhTempo: '2026-09-10' }, '2026-09-08'), 'Segera');
  eq(R().statusPinjam({ tglKembali: null, tglJatuhTempo: '2026-09-08' }, '2026-09-08'), 'Segera');
});

test('statusPinjam menandai Aman saat sisa lebih dari dua hari', function () {
  eq(R().statusPinjam({ tglKembali: null, tglJatuhTempo: '2026-09-12' }, '2026-09-08'), 'Aman');
});

test('catatPeminjaman mengurangi stok tersedia', function () {
  Store.reset();
  var sebelum = Store.buku.find('BK021').jumlahTersedia;
  R().catatPeminjaman({ idAnggota: 'AG002', idBuku: 'BK021', tglPinjam: R().hariIni(), idPetugas: 'PT001' });
  eq(Store.buku.find('BK021').jumlahTersedia, sebelum - 1);
});

test('catatPeminjaman membuat baris peminjaman dan detailnya', function () {
  Store.reset();
  var jml = Store.peminjaman.all().length;
  var p = R().catatPeminjaman({ idAnggota: 'AG002', idBuku: 'BK021', tglPinjam: '2026-09-01', idPetugas: 'PT001' });
  eq(Store.peminjaman.all().length, jml + 1);
  eq(p.tglJatuhTempo, '2026-09-08');
  eq(p.status, 'Dipinjam');
  truthy(Store.detail.all().some(function (d) { return d.idPinjam === p.id && d.idBuku === 'BK021'; }));
});

test('bolehPinjam menolak saat anggota sudah meminjam 3 buku', function () {
  Store.reset();
  R().catatPeminjaman({ idAnggota: 'AG002', idBuku: 'BK021', tglPinjam: R().hariIni(), idPetugas: 'PT001' });
  R().catatPeminjaman({ idAnggota: 'AG002', idBuku: 'BK022', tglPinjam: R().hariIni(), idPetugas: 'PT001' });
  // AG002 sudah punya 1 peminjaman aktif dari seed, ditambah 2 di atas = 3
  eq(R().jumlahPinjamanAktif('AG002'), 3);
  eq(R().bolehPinjam('AG002', 'BK003').boleh, false);
});

test('bolehPinjam menolak anggota yang diblokir', function () {
  Store.reset();
  eq(R().bolehPinjam('AG008', 'BK003').boleh, false);
});

test('bolehPinjam menolak buku yang stoknya habis', function () {
  // AG014 berstatus Aktif dan tidak punya pinjaman berjalan di seed,
  // sehingga penolakan pasti berasal dari stok, bukan dari sebab lain.
  Store.reset();
  Store.buku.update('BK003', { jumlahTersedia: 0 });
  eq(R().bolehPinjam('AG014', 'BK003').boleh, false);
});

test('bolehPinjam mengizinkan anggota aktif atas buku tersedia', function () {
  Store.reset();
  eq(R().bolehPinjam('AG014', 'BK003').boleh, true);
});

test('prosesPengembalian mengembalikan stok dan menutup transaksi', function () {
  Store.reset();
  var sebelum = Store.buku.find('BK003').jumlahTersedia;
  var hasil = R().prosesPengembalian('PJ001', R().hariIni());
  eq(hasil.pinjam.status, 'Dikembalikan');
  eq(Store.buku.find('BK003').jumlahTersedia, sebelum + 1);
});

test('prosesPengembalian tidak membuat denda bila tepat waktu', function () {
  Store.reset();
  var p = Store.peminjaman.find('PJ001');
  var hasil = R().prosesPengembalian('PJ001', p.tglJatuhTempo);
  eq(hasil.denda, null);
});

test('prosesPengembalian membuat denda bila terlambat', function () {
  Store.reset();
  var p = Store.peminjaman.find('PJ001');
  var telat = R().tambahHari(p.tglJatuhTempo, 4);
  var hasil = R().prosesPengembalian('PJ001', telat);
  eq(hasil.denda.hariTerlambat, 4);
  eq(hasil.denda.nominal, 4000);
  eq(hasil.denda.statusBayar, 'Belum Lunas');
});

test('bukuDariPinjam menemukan buku lewat tabel detail', function () {
  Store.reset();
  eq(R().bukuDariPinjam('PJ001').id, 'BK003');
});
```

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: 12 tes Task 3 tetap lulus, seluruh tes baru **GAGAL** dengan `Cannot read properties of undefined (reading 'MASA_PINJAM_HARI')`.

- [ ] **Step 3: Implementasi `Store.rules` di `assets/js/store.js`**

Sisipkan blok berikut tepat sebelum `return {` pada IIFE `Store`:

```js
  /* --- Aturan bisnis sirkulasi ---------------------------------- */
  var MASA_PINJAM_HARI = 7;
  var DENDA_PER_HARI = 1000;
  var MAKS_PINJAM = 3;
  var AMBANG_SEGERA = 2;   // sisa hari yang dianggap "mendekati jatuh tempo"

  function hariIni() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  /* Perhitungan tanggal memakai UTC agar pergeseran zona waktu dan
     daylight saving tidak menggeser hasil selisih hari. */
  function keUtc(iso) {
    var b = iso.split('-');
    return Date.UTC(+b[0], +b[1] - 1, +b[2]);
  }

  function tambahHari(iso, n) {
    return new Date(keUtc(iso) + n * 86400000).toISOString().slice(0, 10);
  }

  function selisihHari(isoAwal, isoAkhir) {
    return Math.round((keUtc(isoAkhir) - keUtc(isoAwal)) / 86400000);
  }

  function jatuhTempo(tglPinjam) { return tambahHari(tglPinjam, MASA_PINJAM_HARI); }

  function sisaHari(tglJatuhTempo, isoHariIni) {
    return selisihHari(isoHariIni || hariIni(), tglJatuhTempo);
  }

  function statusPinjam(pinjam, isoHariIni) {
    if (pinjam.tglKembali) return 'Dikembalikan';
    var sisa = sisaHari(pinjam.tglJatuhTempo, isoHariIni);
    if (sisa < 0) return 'Terlambat';
    if (sisa <= AMBANG_SEGERA) return 'Segera';
    return 'Aman';
  }

  function hitungDenda(tglJatuhTempo, tglKembali) {
    var telat = selisihHari(tglJatuhTempo, tglKembali);
    if (telat <= 0) return { hariTerlambat: 0, nominal: 0 };
    return { hariTerlambat: telat, nominal: telat * DENDA_PER_HARI };
  }

  function jumlahPinjamanAktif(idAnggota) {
    return pastikan().peminjaman.filter(function (p) {
      return p.idAnggota === idAnggota && !p.tglKembali;
    }).length;
  }

  function bukuDariPinjam(idPinjam) {
    var d = pastikan().detailPeminjaman.find(function (x) { return x.idPinjam === idPinjam; });
    if (!d) return null;
    var b = pastikan().buku.find(function (x) { return x.id === d.idBuku; });
    return b || null;
  }

  function bolehPinjam(idAnggota, idBuku) {
    var a = pastikan().anggota.find(function (x) { return x.id === idAnggota; });
    if (!a) return { boleh: false, alasan: 'Anggota tidak ditemukan.' };
    if (a.status !== 'Aktif') return { boleh: false, alasan: 'Keanggotaan ' + a.nama + ' berstatus ' + a.status + '.' };
    if (jumlahPinjamanAktif(idAnggota) >= MAKS_PINJAM) {
      return { boleh: false, alasan: a.nama + ' sudah meminjam ' + MAKS_PINJAM + ' buku (batas maksimal).' };
    }
    var b = pastikan().buku.find(function (x) { return x.id === idBuku; });
    if (!b) return { boleh: false, alasan: 'Buku tidak ditemukan.' };
    if (b.jumlahTersedia < 1) return { boleh: false, alasan: 'Stok "' + b.judul + '" sedang habis.' };
    return { boleh: true, alasan: '' };
  }

  function catatPeminjaman(opsi) {
    var tglPinjam = opsi.tglPinjam || hariIni();
    var pinjam = koleksi('peminjaman').create({
      idAnggota: opsi.idAnggota,
      idPetugas: opsi.idPetugas || 'PT001',
      tglPinjam: tglPinjam,
      tglJatuhTempo: jatuhTempo(tglPinjam),
      tglKembali: null,
      status: 'Dipinjam'
    });
    koleksi('detailPeminjaman').create({ idPinjam: pinjam.id, idBuku: opsi.idBuku, kondisiKembali: null });
    var b = pastikan().buku.find(function (x) { return x.id === opsi.idBuku; });
    if (b) { b.jumlahTersedia = Math.max(0, b.jumlahTersedia - 1); tulis(); }
    return pinjam;
  }

  function prosesPengembalian(idPinjam, tglKembali) {
    var tgl = tglKembali || hariIni();
    var pinjam = koleksi('peminjaman').update(idPinjam, { tglKembali: tgl, status: 'Dikembalikan' });
    if (!pinjam) return { pinjam: null, denda: null };

    var d = pastikan().detailPeminjaman.find(function (x) { return x.idPinjam === idPinjam; });
    if (d) { d.kondisiKembali = 'Baik'; }

    var b = bukuDariPinjam(idPinjam);
    if (b) b.jumlahTersedia = Math.min(b.jumlahTotal, b.jumlahTersedia + 1);
    tulis();

    var hitung = hitungDenda(pinjam.tglJatuhTempo, tgl);
    if (hitung.hariTerlambat === 0) return { pinjam: pinjam, denda: null };

    var denda = koleksi('denda').create({
      idPinjam: idPinjam,
      hariTerlambat: hitung.hariTerlambat,
      nominal: hitung.nominal,
      statusBayar: 'Belum Lunas'
    });
    return { pinjam: pinjam, denda: denda };
  }
```

Lalu tambahkan properti berikut di dalam objek yang dikembalikan `Store`:

```js
    rules: {
      MASA_PINJAM_HARI: MASA_PINJAM_HARI,
      DENDA_PER_HARI: DENDA_PER_HARI,
      MAKS_PINJAM: MAKS_PINJAM,
      hariIni: hariIni,
      tambahHari: tambahHari,
      selisihHari: selisihHari,
      jatuhTempo: jatuhTempo,
      sisaHari: sisaHari,
      statusPinjam: statusPinjam,
      hitungDenda: hitungDenda,
      jumlahPinjamanAktif: jumlahPinjamanAktif,
      bolehPinjam: bolehPinjam,
      catatPeminjaman: catatPeminjaman,
      prosesPengembalian: prosesPengembalian,
      bukuDariPinjam: bukuDariPinjam
    },
```

- [ ] **Step 4: Jalankan tes untuk memastikan lulus**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: **33 / 33 lulus**.

Jika tes `bolehPinjam menolak saat anggota sudah meminjam 3 buku` gagal, periksa bahwa `AG002` memang punya tepat satu peminjaman aktif di seed (`RENCANA_PINJAM` baris kedua, `BK001`).

- [ ] **Step 5: Commit**

```bash
git add assets/js/store.js tests/rules.test.js
git commit -m "feat: aturan sirkulasi, denda, dan batas peminjaman dengan tes"
```

---

### Task 5: UI Toolkit — Modal, Toast, Validator, Formatter

**Files:**
- Create: `assets/js/ui.js`
- Create: `tests/ui.test.js`
- Modify: `assets/css/style.css` (tambahkan blok modal, toast, dan overlay di akhir berkas)

**Interfaces:**
- Consumes: tidak ada (murni generik, tidak tahu domain perpustakaan)
- Produces:
  - `UI.formatRupiah(n)` → `'Rp1.000'`
  - `UI.formatTanggal(iso)` → `'14 Sep 2026'`; `UI.formatTanggalPanjang(iso)` → `'14 September 2026'`
  - `UI.inisial(nama)` → maksimal 2 huruf kapital
  - `UI.escapeHtml(s)` → string aman untuk `innerHTML`
  - `UI.rules.wajib(pesan)`, `.minLen(n, pesan)`, `.email(pesan)`, `.isbn(pesan)`, `.angkaMin(n, pesan)`, `.rentang(a, b, pesan)`, `.custom(fn, pesan)`
  - `UI.validate(nilai, daftarAturan)` → `null` bila lolos, atau string pesan galat pertama
  - `UI.validateForm(formEl, skema)` → `{ valid, errors }` dan menandai field secara visual
  - `UI.tandaiGalat(input, pesan)`, `UI.bersihkanGalat(input)`
  - `UI.modal({ judul, isiHtml, konfirmasi, batal, nada, lebar, onKonfirmasi, onTutup })` → fungsi penutup. `onKonfirmasi` mengembalikan `false` untuk menahan modal tetap terbuka (dipakai saat validasi gagal); `onTutup(dikonfirmasi)` selalu terpanggil sekali, apa pun cara penutupannya; `batal: null` menghilangkan tombol batal; `lebar: true` memakai lebar 720 px
  - `UI.konfirmasi({ judul, pesan, konfirmasi, nada })` → `Promise<boolean>`
  - `UI.toast(pesan, nada)` dengan `nada` ∈ `'ok' | 'bad' | 'info'`

- [ ] **Step 1: Tambahkan gaya modal dan toast ke akhir `assets/css/style.css`**

```css
/* --- Modal --- */
.modal-overlay {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(2, 6, 23, .55);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: fadeIn .18s ease;
}
.modal-box {
  width: 100%; max-width: 520px;
  max-height: calc(100vh - 32px); overflow-y: auto;
  padding: 24px;
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: var(--shadow-modal);
  -webkit-backdrop-filter: blur(32px) saturate(140%);
  backdrop-filter: blur(32px) saturate(140%);
  animation: popIn .18s ease;
}
.modal-box.modal-lebar { max-width: 720px; }
.modal-judul { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
.modal-aksi { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(.98) } to { opacity: 1; transform: none } }

/* --- Toast --- */
.toast-wrap { position: fixed; right: 16px; bottom: 16px; z-index: 70; display: flex; flex-direction: column; gap: 10px; }
.toast {
  display: flex; align-items: center; gap: 10px;
  min-width: 260px; max-width: 360px; padding: 12px 16px;
  border-radius: 12px; font-size: 14px; font-weight: 500;
  color: var(--text);
  background: var(--glass-strong);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-modal);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  animation: popIn .2s ease;
}
.toast::before { content: ""; width: 8px; height: 8px; border-radius: 999px; flex: none; }
.toast-ok::before   { background: #14B8A6; }
.toast-bad::before  { background: #F43F5E; }
.toast-info::before { background: #6366F1; }
.toast-keluar { opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s; }

@media (prefers-reduced-motion: reduce) {
  .modal-overlay, .modal-box, .toast { animation: none; }
}
```

- [ ] **Step 2: Tulis tes yang gagal `tests/ui.test.js`**

```js
test('formatRupiah memakai pemisah ribuan titik', function () {
  eq(UI.formatRupiah(1000), 'Rp1.000');
  eq(UI.formatRupiah(0), 'Rp0');
  eq(UI.formatRupiah(1250000), 'Rp1.250.000');
});

test('formatTanggal memakai format DD Mmm YYYY', function () {
  eq(UI.formatTanggal('2026-09-14'), '14 Sep 2026');
  eq(UI.formatTanggal('2026-01-05'), '05 Jan 2026');
});

test('formatTanggal menangani nilai kosong', function () {
  eq(UI.formatTanggal(null), '-');
  eq(UI.formatTanggal(''), '-');
});

test('inisial mengambil maksimal dua huruf', function () {
  eq(UI.inisial('Bagas Prasetyo'), 'BP');
  eq(UI.inisial('Dewi'), 'D');
  eq(UI.inisial('Abdul Rachman Nugroho'), 'AR');
});

test('escapeHtml menetralkan tag', function () {
  eq(UI.escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  eq(UI.escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
});

test('aturan wajib menolak string kosong dan spasi', function () {
  eq(UI.validate('', [UI.rules.wajib('Wajib diisi')]), 'Wajib diisi');
  eq(UI.validate('   ', [UI.rules.wajib('Wajib diisi')]), 'Wajib diisi');
  eq(UI.validate('ada', [UI.rules.wajib('Wajib diisi')]), null);
});

test('aturan isbn menerima 10 dan 13 digit saja', function () {
  var a = [UI.rules.isbn('ISBN harus 10 atau 13 digit')];
  eq(UI.validate('9786020332123', a), null);
  eq(UI.validate('1234567890', a), null);
  eq(UI.validate('123', a), 'ISBN harus 10 atau 13 digit');
  eq(UI.validate('978-602-033-212-3', a), null);   // tanda hubung diabaikan
});

test('aturan email menolak format tidak valid', function () {
  var a = [UI.rules.email('Format surel tidak valid')];
  eq(UI.validate('admin@unpam.ac.id', a), null);
  eq(UI.validate('admin@', a), 'Format surel tidak valid');
  eq(UI.validate('admin.unpam.ac.id', a), 'Format surel tidak valid');
});

test('aturan rentang memeriksa batas bawah dan atas', function () {
  var a = [UI.rules.rentang(1900, 2026, 'Tahun harus antara 1900 dan 2026')];
  eq(UI.validate('2021', a), null);
  eq(UI.validate('1899', a), 'Tahun harus antara 1900 dan 2026');
  eq(UI.validate('2027', a), 'Tahun harus antara 1900 dan 2026');
});

test('aturan angkaMin menolak nol dan nilai negatif', function () {
  var a = [UI.rules.angkaMin(1, 'Minimal 1')];
  eq(UI.validate('1', a), null);
  eq(UI.validate('0', a), 'Minimal 1');
  eq(UI.validate('-3', a), 'Minimal 1');
});

test('validate mengembalikan pesan galat pertama saja', function () {
  var a = [UI.rules.wajib('Wajib diisi'), UI.rules.minLen(5, 'Minimal 5 karakter')];
  eq(UI.validate('', a), 'Wajib diisi');
  eq(UI.validate('abc', a), 'Minimal 5 karakter');
});

test('aturan custom memakai predikat sendiri', function () {
  var a = [UI.rules.custom(function (v) { return v === 'ok'; }, 'Harus bernilai ok')];
  eq(UI.validate('ok', a), null);
  eq(UI.validate('salah', a), 'Harus bernilai ok');
});
```

- [ ] **Step 3: Jalankan tes untuk memastikan gagal**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: 33 tes sebelumnya tetap lulus, 12 tes baru **GAGAL** dengan `UI is not defined`.

- [ ] **Step 4: Implementasi `assets/js/ui.js`**

```js
/* Perkakas tampilan generik. Tidak tahu apa pun tentang buku, anggota,
   atau peminjaman — sehingga bisa dipakai ulang di seluruh halaman. */
var UI = (function () {

  var BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* --- Formatter ------------------------------------------------ */
  function formatRupiah(n) {
    var angka = Number(n) || 0;
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function pecahIso(iso) {
    if (!iso) return null;
    var b = String(iso).slice(0, 10).split('-');
    if (b.length !== 3) return null;
    return { th: b[0], bl: parseInt(b[1], 10) - 1, tg: b[2] };
  }

  function formatTanggal(iso) {
    var p = pecahIso(iso);
    return p ? p.tg + ' ' + BULAN_PENDEK[p.bl] + ' ' + p.th : '-';
  }

  function formatTanggalPanjang(iso) {
    var p = pecahIso(iso);
    return p ? parseInt(p.tg, 10) + ' ' + BULAN_PANJANG[p.bl] + ' ' + p.th : '-';
  }

  function inisial(nama) {
    return String(nama || '').trim().split(/\s+/).slice(0, 2)
      .map(function (k) { return k.charAt(0).toUpperCase(); }).join('');
  }

  function escapeHtml(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* --- Validasi -------------------------------------------------- */
  var rules = {
    wajib: function (pesan) {
      return function (v) { return String(v || '').trim() !== '' ? null : (pesan || 'Wajib diisi'); };
    },
    minLen: function (n, pesan) {
      return function (v) { return String(v || '').trim().length >= n ? null : (pesan || 'Minimal ' + n + ' karakter'); };
    },
    email: function (pesan) {
      return function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')) ? null : (pesan || 'Format surel tidak valid'); };
    },
    isbn: function (pesan) {
      return function (v) {
        var bersih = String(v || '').replace(/[-\s]/g, '');
        return /^\d{10}$|^\d{13}$/.test(bersih) ? null : (pesan || 'ISBN harus 10 atau 13 digit');
      };
    },
    angkaMin: function (n, pesan) {
      return function (v) {
        var x = Number(v);
        return (!isNaN(x) && x >= n) ? null : (pesan || 'Minimal ' + n);
      };
    },
    rentang: function (a, b, pesan) {
      return function (v) {
        var x = Number(v);
        return (!isNaN(x) && x >= a && x <= b) ? null : (pesan || 'Harus antara ' + a + ' dan ' + b);
      };
    },
    custom: function (fn, pesan) {
      return function (v) { return fn(v) ? null : (pesan || 'Nilai tidak valid'); };
    }
  };

  /* Mengembalikan pesan galat PERTAMA saja — menampilkan seluruh galat
     sekaligus pada satu field membingungkan pengguna. */
  function validate(nilai, daftarAturan) {
    for (var i = 0; i < daftarAturan.length; i++) {
      var pesan = daftarAturan[i](nilai);
      if (pesan) return pesan;
    }
    return null;
  }

  function tandaiGalat(input, pesan) {
    input.setAttribute('aria-invalid', 'true');
    var span = input.parentElement.querySelector('.field-error');
    if (!span) {
      span = document.createElement('span');
      span.className = 'field-error';
      input.parentElement.appendChild(span);
    }
    span.textContent = pesan;
  }

  function bersihkanGalat(input) {
    input.removeAttribute('aria-invalid');
    var span = input.parentElement.querySelector('.field-error');
    if (span) span.remove();
  }

  /* skema: { namaField: [aturan, ...] } — dicocokkan dengan atribut name. */
  function validateForm(formEl, skema) {
    var errors = {};
    Object.keys(skema).forEach(function (nama) {
      var input = formEl.querySelector('[name="' + nama + '"]');
      if (!input) return;
      var pesan = validate(input.value, skema[nama]);
      if (pesan) { errors[nama] = pesan; tandaiGalat(input, pesan); }
      else bersihkanGalat(input);
    });
    var daftar = Object.keys(errors);
    if (daftar.length) {
      var pertama = formEl.querySelector('[name="' + daftar[0] + '"]');
      if (pertama) pertama.focus();
    }
    return { valid: daftar.length === 0, errors: errors };
  }

  /* Memasang validasi saat blur agar pengguna tahu lebih awal,
     tanpa mengganggu saat masih mengetik. */
  function pasangValidasiBlur(formEl, skema) {
    Object.keys(skema).forEach(function (nama) {
      var input = formEl.querySelector('[name="' + nama + '"]');
      if (!input) return;
      input.addEventListener('blur', function () {
        var pesan = validate(input.value, skema[nama]);
        if (pesan) tandaiGalat(input, pesan); else bersihkanGalat(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          var pesan = validate(input.value, skema[nama]);
          if (!pesan) bersihkanGalat(input);
        }
      });
    });
  }

  /* --- Modal ----------------------------------------------------- */
  function modal(opsi) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', opsi.judul || 'Dialog');

    var tombolKonfirmasi = opsi.konfirmasi
      ? '<button type="button" data-aksi="konfirmasi" class="btn ' + (opsi.nada === 'bad' ? 'btn-danger' : 'btn-primary') + '">' + escapeHtml(opsi.konfirmasi) + '</button>'
      : '';
    var tombolBatal = opsi.batal === null ? '' :
      '<button type="button" data-aksi="batal" class="btn btn-ghost">' + escapeHtml(opsi.batal || 'Batal') + '</button>';

    overlay.innerHTML =
      '<div class="modal-box' + (opsi.lebar ? ' modal-lebar' : '') + '">' +
        '<h2 class="modal-judul">' + escapeHtml(opsi.judul || '') + '</h2>' +
        '<div class="modal-isi">' + (opsi.isiHtml || '') + '</div>' +
        '<div class="modal-aksi">' + tombolBatal + tombolKonfirmasi + '</div>' +
      '</div>';

    var fokusSebelumnya = document.activeElement;
    var dikonfirmasi = false;
    var sudahTutup = false;

    function tutup() {
      if (sudahTutup) return;
      sudahTutup = true;
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (fokusSebelumnya && fokusSebelumnya.focus) fokusSebelumnya.focus();
      if (opsi.onTutup) opsi.onTutup(dikonfirmasi);
    }
    function onKey(e) { if (e.key === 'Escape') tutup(); }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) return tutup();
      var aksi = e.target.getAttribute && e.target.getAttribute('data-aksi');
      if (aksi === 'batal') tutup();
      if (aksi === 'konfirmasi') {
        // onKonfirmasi boleh mengembalikan false untuk menahan modal tetap terbuka
        var hasil = opsi.onKonfirmasi ? opsi.onKonfirmasi(overlay) : true;
        if (hasil !== false) { dikonfirmasi = true; tutup(); }
      }
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);

    var fokusPertama = overlay.querySelector('input, select, textarea, button[data-aksi="konfirmasi"]');
    if (fokusPertama) fokusPertama.focus();
    return tutup;
  }

  /* Promise diselesaikan lewat callback onTutup milik modal, yang selalu
     terpanggil baik lewat tombol konfirmasi, tombol batal, Escape, maupun
     klik di luar kotak. */
  function konfirmasi(opsi) {
    return new Promise(function (resolve) {
      modal({
        judul: opsi.judul || 'Konfirmasi',
        isiHtml: '<p class="text-muted">' + escapeHtml(opsi.pesan || '') + '</p>',
        konfirmasi: opsi.konfirmasi || 'Ya, Lanjutkan',
        batal: 'Batal',
        nada: opsi.nada || 'bad',
        onKonfirmasi: function () { return true; },
        onTutup: function (dikonfirmasi) { resolve(dikonfirmasi); }
      });
    });
  }

  /* --- Toast ----------------------------------------------------- */
  function toast(pesan, nada) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast toast-' + (nada || 'ok');
    el.textContent = pesan;
    wrap.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-keluar');
      setTimeout(function () { el.remove(); }, 260);
    }, 2800);
  }

  return {
    formatRupiah: formatRupiah,
    formatTanggal: formatTanggal,
    formatTanggalPanjang: formatTanggalPanjang,
    inisial: inisial,
    escapeHtml: escapeHtml,
    rules: rules,
    validate: validate,
    validateForm: validateForm,
    pasangValidasiBlur: pasangValidasiBlur,
    tandaiGalat: tandaiGalat,
    bersihkanGalat: bersihkanGalat,
    modal: modal,
    konfirmasi: konfirmasi,
    toast: toast
  };
})();
```

- [ ] **Step 5: Jalankan tes untuk memastikan lulus**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: **45 / 45 lulus**.

- [ ] **Step 6: Periksa modal dan toast secara manual**

Di console pada `runner.html`:

```js
UI.toast('Data buku berhasil disimpan', 'ok');
UI.konfirmasi({ judul: 'Hapus Buku', pesan: 'Hapus "Bumi Manusia" dari koleksi?' }).then(console.log);
```

Yang harus terlihat: toast muncul di kanan bawah lalu hilang sendiri; modal muncul di tengah dengan latar buram, dapat ditutup dengan Escape maupun klik di luar kotak, dan console mencatat `true` atau `false` sesuai pilihan.

- [ ] **Step 7: Commit**

```bash
git add assets/js/ui.js assets/css/style.css tests/ui.test.js
git commit -m "feat: perkakas UI modal, toast, validator, dan formatter"
```

---

### Task 6: Mesin Tabel Generik

Dipakai ulang oleh halaman Data Buku, Data Anggota, dan Peminjaman. Menulisnya sekali adalah abstraksi paling berharga di proyek ini — tanpa ini, logika cari/saring/urut/paginasi akan tersalin tiga kali.

**Files:**
- Create: `assets/js/table.js`
- Create: `tests/table.test.js`
- Modify: `assets/css/style.css` (tambahkan blok tabel dan mode kartu di akhir berkas)

**Interfaces:**
- Consumes: `UI.escapeHtml` dari Task 5
- Produces:
  - Fungsi murni: `DataTable.saring(baris, opsi)`, `DataTable.urutkan(baris, kunci, arah, ambil)`, `DataTable.potong(baris, halaman, perHalaman)`
  - `DataTable.buat(opsi)` → instance `{ setBaris, setCari, setSaringan, render, barisTampil }`
  - Opsi: `{ mount, kolom, baris, cariPada, saringan, perHalaman, pesanKosong }`
  - `kolom`: `[{ kunci, label, urut, ambil(baris), render(baris), kelas }]`
  - `saringan`: `[{ kunci, cocok(baris, nilai) }]`

- [ ] **Step 1: Tambahkan gaya tabel ke akhir `assets/css/style.css`**

```css
/* --- Tabel --- */
.tabel-bungkus { width: 100%; }
.tabel { width: 100%; border-collapse: collapse; font-size: 14px; }
.tabel thead th {
  position: sticky; top: 0; z-index: 1;
  padding: 12px 16px; text-align: left; white-space: nowrap;
  font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
  color: var(--muted);
  background: var(--glass-strong);
  border-bottom: 1px solid var(--glass-border);
}
.tabel thead th[data-urut] { cursor: pointer; user-select: none; }
.tabel thead th[data-urut]:hover { color: var(--text); }
.tabel thead th .penanda-urut { margin-left: 6px; opacity: .5; }
.tabel thead th[aria-sort] .penanda-urut { opacity: 1; color: #6366F1; }
.tabel tbody td { padding: 14px 16px; border-bottom: 1px solid var(--glass-border); vertical-align: middle; }
.tabel tbody tr:last-child td { border-bottom: none; }
.tabel tbody tr { transition: background-color .15s; }
.tabel tbody tr:hover { background: var(--glass); }
.tabel .kol-aksi { width: 1%; white-space: nowrap; text-align: right; }
.tabel .kol-angka { text-align: right; font-variant-numeric: tabular-nums; }

.tabel-kosong { padding: 48px 16px; text-align: center; color: var(--muted); }
.tabel-kosong strong { display: block; color: var(--text); margin-bottom: 6px; font-size: 16px; }

.tabel-kaki {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
  padding: 14px 16px; border-top: 1px solid var(--glass-border);
  font-size: 13px; color: var(--muted);
}
.paginasi { display: flex; gap: 6px; }
.paginasi button {
  min-width: 34px; height: 34px; padding: 0 10px;
  border-radius: 10px; border: 1px solid var(--glass-border);
  background: transparent; color: var(--text); font: inherit; cursor: pointer;
}
.paginasi button:hover:not(:disabled) { background: var(--glass); }
.paginasi button[aria-current="page"] { background: #6366F1; border-color: #6366F1; color: #fff; font-weight: 600; }
.paginasi button:disabled { opacity: .4; cursor: not-allowed; }

/* --- Mode kartu di layar sempit ---
   Tabel TIDAK digulir ke samping. Tiap baris berubah menjadi kartu
   dengan pasangan label-nilai; label diambil dari atribut data-label. */
@media (max-width: 767px) {
  .tabel thead { display: none; }
  .tabel, .tabel tbody, .tabel tr, .tabel td { display: block; width: 100%; }
  .tabel tbody tr {
    margin-bottom: 12px; padding: 4px 0;
    border: 1px solid var(--glass-border); border-radius: 16px;
    background: var(--glass);
  }
  .tabel tbody td {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 16px; border-bottom: 1px solid var(--glass-border); text-align: right;
  }
  .tabel tbody td:last-child { border-bottom: none; }
  .tabel tbody td::before {
    content: attr(data-label);
    flex: none; font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .04em; color: var(--muted); text-align: left;
  }
  .tabel .kol-aksi, .tabel .kol-angka { text-align: right; width: auto; }
}
```

- [ ] **Step 2: Tulis tes yang gagal `tests/table.test.js`**

```js
var BARIS = [
  { id: 'A', judul: 'Algoritma dan Struktur Data', pengarang: 'Rinaldi', kategori: 'KT007', stok: 6 },
  { id: 'B', judul: 'Bumi Manusia',                pengarang: 'Pramoedya', kategori: 'KT008', stok: 9 },
  { id: 'C', judul: 'Kalkulus Dasar',              pengarang: 'Purcell',  kategori: 'KT006', stok: 0 },
  { id: 'D', judul: 'Basis Data Relasional',       pengarang: 'Fathansyah', kategori: 'KT007', stok: 5 }
];

test('saring tanpa kueri mengembalikan seluruh baris', function () {
  eq(DataTable.saring(BARIS, { kueri: '', cariPada: ['judul'] }).length, 4);
});

test('saring mencocokkan sebagian kata tanpa peduli huruf besar-kecil', function () {
  var h = DataTable.saring(BARIS, { kueri: 'data', cariPada: ['judul'] });
  eq(h.map(function (r) { return r.id; }), ['A', 'D']);
});

test('saring memeriksa seluruh field yang didaftarkan', function () {
  var h = DataTable.saring(BARIS, { kueri: 'pramoedya', cariPada: ['judul', 'pengarang'] });
  eq(h.map(function (r) { return r.id; }), ['B']);
});

test('saring mengabaikan spasi berlebih di kueri', function () {
  eq(DataTable.saring(BARIS, { kueri: '   bumi  ', cariPada: ['judul'] }).length, 1);
});

test('saring menerapkan saringan tambahan', function () {
  var saringan = [{ kunci: 'kategori', cocok: function (r, v) { return r.kategori === v; } }];
  var h = DataTable.saring(BARIS, { kueri: '', cariPada: ['judul'], saringan: saringan, nilaiSaringan: { kategori: 'KT007' } });
  eq(h.map(function (r) { return r.id; }), ['A', 'D']);
});

test('saringan bernilai kosong tidak menyaring apa pun', function () {
  var saringan = [{ kunci: 'kategori', cocok: function (r, v) { return r.kategori === v; } }];
  var h = DataTable.saring(BARIS, { kueri: '', cariPada: ['judul'], saringan: saringan, nilaiSaringan: { kategori: '' } });
  eq(h.length, 4);
});

test('urutkan menyusun teks secara alfabetis', function () {
  var h = DataTable.urutkan(BARIS, 'judul', 'naik');
  eq(h.map(function (r) { return r.id; }), ['A', 'D', 'B', 'C']);
});

test('urutkan mendukung arah menurun', function () {
  var h = DataTable.urutkan(BARIS, 'judul', 'turun');
  eq(h.map(function (r) { return r.id; }), ['C', 'B', 'D', 'A']);
});

test('urutkan membandingkan angka sebagai angka, bukan teks', function () {
  var h = DataTable.urutkan(BARIS, 'stok', 'naik');
  eq(h.map(function (r) { return r.stok; }), [0, 5, 6, 9]);
});

test('urutkan tidak mengubah array masukan', function () {
  var salinan = BARIS.slice();
  DataTable.urutkan(BARIS, 'judul', 'naik');
  eq(BARIS.map(function (r) { return r.id; }), salinan.map(function (r) { return r.id; }));
});

test('potong mengambil halaman yang diminta', function () {
  eq(DataTable.potong(BARIS, 1, 2).map(function (r) { return r.id; }), ['A', 'B']);
  eq(DataTable.potong(BARIS, 2, 2).map(function (r) { return r.id; }), ['C', 'D']);
});

test('potong mengembalikan array kosong untuk halaman di luar jangkauan', function () {
  eq(DataTable.potong(BARIS, 9, 2).length, 0);
});
```

- [ ] **Step 3: Jalankan tes untuk memastikan gagal**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: 45 tes sebelumnya lulus, 12 tes baru **GAGAL** dengan `DataTable is not defined`.

- [ ] **Step 4: Implementasi `assets/js/table.js`**

```js
/* Mesin tabel generik: cari, saring, urutkan, paginasi, dan render.
   Tidak tahu apa pun tentang domain perpustakaan — seluruh pengetahuan
   domain masuk lewat konfigurasi `kolom` dan `saringan`. */
var DataTable = (function () {

  /* --- Fungsi murni (diuji terpisah) ----------------------------- */

  function saring(baris, opsi) {
    var kueri = String(opsi.kueri || '').trim().toLowerCase();
    var cariPada = opsi.cariPada || [];
    var saringan = opsi.saringan || [];
    var nilai = opsi.nilaiSaringan || {};

    return baris.filter(function (r) {
      if (kueri) {
        var cocok = cariPada.some(function (f) {
          return String(r[f] === null || r[f] === undefined ? '' : r[f]).toLowerCase().indexOf(kueri) !== -1;
        });
        if (!cocok) return false;
      }
      for (var i = 0; i < saringan.length; i++) {
        var s = saringan[i];
        var v = nilai[s.kunci];
        if (v === '' || v === undefined || v === null) continue;   // "Semua"
        if (!s.cocok(r, v)) return false;
      }
      return true;
    });
  }

  function urutkan(baris, kunci, arah, ambil) {
    if (!kunci) return baris.slice();
    var faktor = arah === 'turun' ? -1 : 1;
    var nilaiDari = ambil || function (r) { return r[kunci]; };

    return baris.slice().sort(function (a, b) {
      var x = nilaiDari(a), y = nilaiDari(b);
      var xn = Number(x), yn = Number(y);
      var keduanyaAngka = x !== '' && y !== '' && !isNaN(xn) && !isNaN(yn);
      if (keduanyaAngka) return (xn - yn) * faktor;
      return String(x === null || x === undefined ? '' : x)
        .localeCompare(String(y === null || y === undefined ? '' : y), 'id', { sensitivity: 'base' }) * faktor;
    });
  }

  function potong(baris, halaman, perHalaman) {
    var mulai = (halaman - 1) * perHalaman;
    return baris.slice(mulai, mulai + perHalaman);
  }

  /* --- Komponen ---------------------------------------------------- */

  function buat(opsi) {
    var mount = opsi.mount;
    var kolom = opsi.kolom;
    var perHalaman = opsi.perHalaman || 8;
    var baris = opsi.baris || [];
    var kueri = '';
    var nilaiSaringan = {};
    var kunciUrut = opsi.urutAwal || null;
    var arahUrut = opsi.arahAwal || 'naik';
    var halaman = 1;
    var terlihat = [];

    function hitung() {
      var hasil = saring(baris, {
        kueri: kueri, cariPada: opsi.cariPada,
        saringan: opsi.saringan, nilaiSaringan: nilaiSaringan
      });
      var kol = kolom.find(function (k) { return k.kunci === kunciUrut; });
      hasil = urutkan(hasil, kunciUrut, arahUrut, kol && kol.ambil);
      terlihat = hasil;
      var maks = Math.max(1, Math.ceil(hasil.length / perHalaman));
      if (halaman > maks) halaman = maks;
      return hasil;
    }

    function htmlKepala() {
      return '<thead><tr>' + kolom.map(function (k) {
        var atribut = k.urut ? ' data-urut="' + k.kunci + '"' : '';
        var aria = (k.urut && kunciUrut === k.kunci)
          ? ' aria-sort="' + (arahUrut === 'naik' ? 'ascending' : 'descending') + '"' : '';
        var penanda = k.urut
          ? '<span class="penanda-urut">' + (kunciUrut === k.kunci ? (arahUrut === 'naik' ? '&uarr;' : '&darr;') : '&updownarrow;') + '</span>'
          : '';
        return '<th' + atribut + aria + ' class="' + (k.kelas || '') + '">' + UI.escapeHtml(k.label) + penanda + '</th>';
      }).join('') + '</tr></thead>';
    }

    function htmlIsi(data) {
      return '<tbody>' + data.map(function (r) {
        return '<tr data-id="' + UI.escapeHtml(r.id) + '">' + kolom.map(function (k) {
          var isi = k.render ? k.render(r) : UI.escapeHtml(k.ambil ? k.ambil(r) : r[k.kunci]);
          return '<td data-label="' + UI.escapeHtml(k.label) + '" class="' + (k.kelas || '') + '">' + isi + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
    }

    function htmlPaginasi(total) {
      var maks = Math.max(1, Math.ceil(total / perHalaman));
      var tombol = ['<button type="button" data-hal="' + (halaman - 1) + '"' + (halaman === 1 ? ' disabled' : '') + '>&larr;</button>'];
      for (var i = 1; i <= maks; i++) {
        tombol.push('<button type="button" data-hal="' + i + '"' + (i === halaman ? ' aria-current="page"' : '') + '>' + i + '</button>');
      }
      tombol.push('<button type="button" data-hal="' + (halaman + 1) + '"' + (halaman === maks ? ' disabled' : '') + '>&rarr;</button>');

      var dari = total === 0 ? 0 : (halaman - 1) * perHalaman + 1;
      var sampai = Math.min(total, halaman * perHalaman);
      return '<div class="tabel-kaki"><span>Menampilkan ' + dari + '&ndash;' + sampai + ' dari ' + total + ' data</span>' +
             '<div class="paginasi">' + tombol.join('') + '</div></div>';
    }

    function render() {
      var hasil = hitung();
      if (hasil.length === 0) {
        mount.innerHTML = '<div class="tabel-kosong"><strong>Tidak ada data yang cocok</strong>' +
          UI.escapeHtml(opsi.pesanKosong || 'Coba ubah kata kunci pencarian atau saringan.') + '</div>';
        return;
      }
      mount.innerHTML = '<div class="tabel-bungkus"><table class="tabel">' +
        htmlKepala() + htmlIsi(potong(hasil, halaman, perHalaman)) +
        '</table></div>' + htmlPaginasi(hasil.length);
    }

    /* Satu event listener untuk seluruh tabel (delegasi) — tetap bekerja
       setelah isi tabel dirender ulang. */
    mount.addEventListener('click', function (e) {
      var th = e.target.closest && e.target.closest('th[data-urut]');
      if (th && mount.contains(th)) {
        var kunci = th.getAttribute('data-urut');
        if (kunciUrut === kunci) arahUrut = (arahUrut === 'naik' ? 'turun' : 'naik');
        else { kunciUrut = kunci; arahUrut = 'naik'; }
        render();
        return;
      }
      var tombol = e.target.closest && e.target.closest('.paginasi button[data-hal]');
      if (tombol && !tombol.disabled) {
        halaman = parseInt(tombol.getAttribute('data-hal'), 10);
        render();
      }
    });

    return {
      render: render,
      setBaris: function (b) { baris = b; halaman = 1; render(); },
      setCari: function (q) { kueri = q; halaman = 1; render(); },
      setSaringan: function (kunci, nilai) { nilaiSaringan[kunci] = nilai; halaman = 1; render(); },
      barisTampil: function () { return terlihat.slice(); }
    };
  }

  return { saring: saring, urutkan: urutkan, potong: potong, buat: buat };
})();
```

- [ ] **Step 5: Jalankan tes untuk memastikan lulus**

Muat ulang `http://localhost:8080/tests/runner.html`.
Diharapkan: **57 / 57 lulus**, dan console tidak lagi mencatat 404 untuk `table.js`, `ui.js`, atau berkas tes mana pun.

- [ ] **Step 6: Commit**

```bash
git add assets/js/table.js assets/css/style.css tests/table.test.js
git commit -m "feat: mesin tabel generik dengan cari, urut, paginasi, dan mode kartu mobile"
```

---

### Task 7: Kerangka Layout dan Template Master

Keluaran Milestone 2. Satu-satunya tempat markup sidebar dan topbar didefinisikan — halaman lain menyalin kerangka `pages/layout.html` lalu mengisi `<main>`.

**Files:**
- Modify: `assets/js/layout.js` (tambahkan menu, sidebar, topbar, penjaga sesi)
- Modify: `assets/css/style.css` (tambahkan blok kerangka aplikasi di akhir berkas)
- Create: `pages/layout.html`

**Interfaces:**
- Consumes: `Layout.initTheme` dan `Layout.toggleTheme` dari Task 1; `Store.petugas`, `UI.inisial` dari Task 3 dan 5
- Produces:
  - `Layout.MENU` — array definisi menu, satu-satunya tempat menu ditambah atau diubah
  - `Layout.init({ halaman, judul, subjudul })` — merender sidebar, topbar, menandai menu aktif, dan memasang penjaga sesi
  - `Layout.keluar()` — menghapus sesi dan kembali ke `index.html`
  - `Layout.sesi()` → objek petugas yang sedang masuk, atau `null`
  - Kelas markup wajib: `.app-shell`, `.sidebar`, `#sidebar`, `.sidebar-overlay`, `.topbar`, `.konten`

- [ ] **Step 1: Tambahkan gaya kerangka ke akhir `assets/css/style.css`**

```css
/* --- Kerangka aplikasi --- */
.app-shell { display: flex; min-height: 100vh; }

.sidebar {
  position: fixed; inset: 0 auto 0 0; z-index: 50;
  display: flex; flex-direction: column; gap: 8px;
  width: 264px; padding: 20px 14px;
  background: var(--glass);
  border-right: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(32px) saturate(140%);
  backdrop-filter: blur(32px) saturate(140%);
  transition: transform .25s ease;
  overflow-y: auto;
}
.sidebar-merek { display: flex; align-items: center; gap: 12px; padding: 6px 10px 18px; }
.sidebar-logo {
  width: 40px; height: 40px; flex: none;
  display: grid; place-items: center;
  border-radius: 12px; background: #6366F1; color: #fff;
  font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700; font-size: 18px;
}
.sidebar-merek h1 { font-size: 15px; line-height: 1.25; }
.sidebar-merek p { margin: 2px 0 0; font-size: 11px; color: var(--muted); }

.nav-judul { padding: 16px 12px 6px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px;
  color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500;
  transition: background-color .18s, color .18s;
}
.nav-item svg { width: 18px; height: 18px; flex: none; }
.nav-item:hover { background: var(--glass-strong); color: var(--text); }
.nav-item.aktif { background: #6366F1; color: #fff; box-shadow: 0 6px 20px rgba(99, 102, 241, .35); }
.nav-pisah { height: 1px; margin: 12px 12px; background: var(--glass-border); }

.sidebar-overlay { position: fixed; inset: 0; z-index: 45; background: rgba(2, 6, 23, .5); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }

.area-utama { flex: 1; min-width: 0; margin-left: 264px; display: flex; flex-direction: column; }

.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 16px;
  padding: 14px 24px;
  background: var(--glass);
  border-bottom: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
}
.topbar h2 { font-size: 18px; }
.topbar p { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
.topbar-kanan { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 36px; height: 36px; display: grid; place-items: center;
  border-radius: 999px; background: #6366F1; color: #fff;
  font-size: 13px; font-weight: 600;
}
.tombol-menu { display: none; }

.konten { flex: 1; padding: 24px; }
.footer-app { padding: 18px 24px; font-size: 12px; color: var(--muted); border-top: 1px solid var(--glass-border); }

@media (max-width: 1023px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.terbuka { transform: none; }
  .area-utama { margin-left: 0; }
  .tombol-menu { display: inline-flex; }
  .konten { padding: 16px; }
  .topbar { padding: 12px 16px; }
}
```

- [ ] **Step 2: Lengkapi `assets/js/layout.js`**

Ganti isi IIFE `Layout` dengan versi lengkap berikut. Bagian tema dari Task 1 tetap dipertahankan apa adanya.

```js
/* Kerangka bersama seluruh halaman.
   initTheme() sengaja berdiri sendiri agar halaman di luar aplikasi
   (mis. design-system.html) bisa memakainya tanpa memicu penjaga sesi. */
var Layout = (function () {
  var KEY_TEMA = 'elibrary.theme';
  var KEY_SESI = 'elibrary.session';

  /* Satu-satunya definisi menu. Menambah halaman cukup di sini. */
  var IKON = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    buku:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    anggota:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    pinjam:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
    laporan:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
    atur:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.46.62.85.72H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    keluar:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>'
  };

  var MENU = [
    { grup: null, item: [{ id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', ikon: 'dashboard' }] },
    { grup: 'Master Data', item: [
      { id: 'buku',    label: 'Data Buku',    href: 'data-buku.html',    ikon: 'buku' },
      { id: 'anggota', label: 'Data Anggota', href: 'data-anggota.html', ikon: 'anggota' }
    ] },
    { grup: 'Transaksi', item: [
      { id: 'peminjaman',   label: 'Peminjaman',   href: 'peminjaman.html',         ikon: 'pinjam' },
      { id: 'pengembalian', label: 'Pengembalian', href: 'peminjaman.html#riwayat', ikon: 'pinjam' }
    ] },
    { grup: 'Laporan', item: [{ id: 'laporan', label: 'Laporan Sirkulasi', href: 'laporan.html', ikon: 'laporan' }] }
  ];

  /* --- Tema ----------------------------------------------------- */
  function terapkanTema(tema) {
    document.documentElement.classList.toggle('dark', tema === 'dark');
  }

  function initTheme() {
    var tersimpan = null;
    try { tersimpan = localStorage.getItem(KEY_TEMA); } catch (e) { /* mode privat */ }
    terapkanTema(tersimpan || 'dark');   // gelap adalah default
  }

  function toggleTema() {
    var jadiGelap = !document.documentElement.classList.contains('dark');
    terapkanTema(jadiGelap ? 'dark' : 'light');
    try { localStorage.setItem(KEY_TEMA, jadiGelap ? 'dark' : 'light'); } catch (e) { /* abaikan */ }
    document.dispatchEvent(new CustomEvent('temaberubah', { detail: { gelap: jadiGelap } }));
  }

  /* --- Sesi ------------------------------------------------------ */
  function sesi() {
    try { return JSON.parse(localStorage.getItem(KEY_SESI) || 'null'); }
    catch (e) { return null; }
  }

  function masuk(petugas) {
    try { localStorage.setItem(KEY_SESI, JSON.stringify(petugas)); } catch (e) { /* abaikan */ }
  }

  function keluar() {
    try { localStorage.removeItem(KEY_SESI); } catch (e) { /* abaikan */ }
    window.location.href = '../index.html';
  }

  function jagaSesi() {
    if (!sesi()) { window.location.href = '../index.html'; return false; }
    return true;
  }

  /* --- Render sidebar dan topbar --------------------------------- */
  function htmlSidebar(halamanAktif) {
    var grup = MENU.map(function (g) {
      var judul = g.grup ? '<p class="nav-judul">' + g.grup + '</p>' : '';
      var item = g.item.map(function (m) {
        var aktif = m.id === halamanAktif ? ' aktif' : '';
        return '<a class="nav-item' + aktif + '" href="' + m.href + '">' + IKON[m.ikon] + '<span>' + m.label + '</span></a>';
      }).join('');
      return judul + item;
    }).join('');

    return '<div class="sidebar-merek">' +
             '<div class="sidebar-logo">P</div>' +
             '<div><h1>Perpustakaan Digital</h1><p>Universitas Pamulang</p></div>' +
           '</div>' + grup +
           '<div class="nav-pisah"></div>' +
           '<a class="nav-item" href="#" id="menuPengaturan">' + IKON.atur + '<span>Pengaturan</span></a>' +
           '<a class="nav-item" href="#" id="menuKeluar">' + IKON.keluar + '<span>Keluar</span></a>';
  }

  function htmlTopbar(judul, subjudul, petugas) {
    return '<button class="btn-icon tombol-menu" id="tombolMenu" aria-label="Buka menu" aria-expanded="false">' +
             '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
           '</button>' +
           '<div><h2>' + UI.escapeHtml(judul) + '</h2><p>' + UI.escapeHtml(subjudul || '') + '</p></div>' +
           '<div class="topbar-kanan">' +
             '<button class="btn-icon" id="tombolTema" aria-label="Ganti mode terang atau gelap">' +
               '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
             '</button>' +
             '<div class="avatar" title="' + UI.escapeHtml(petugas.nama) + '">' + UI.inisial(petugas.nama) + '</div>' +
           '</div>';
  }

  function pasangSidebarMobile() {
    var sidebar = document.getElementById('sidebar');
    var tombol = document.getElementById('tombolMenu');
    var overlay = null;

    function tutup() {
      sidebar.classList.remove('terbuka');
      tombol.setAttribute('aria-expanded', 'false');
      if (overlay) { overlay.remove(); overlay = null; }
    }

    tombol.addEventListener('click', function () {
      var terbuka = sidebar.classList.toggle('terbuka');
      tombol.setAttribute('aria-expanded', String(terbuka));
      if (terbuka) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', tutup);
        document.body.appendChild(overlay);
      } else tutup();
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutup(); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024) tutup(); });
  }

  function init(opsi) {
    initTheme();
    if (!jagaSesi()) return null;

    Store.init();
    var petugas = sesi();

    document.getElementById('sidebar').innerHTML = htmlSidebar(opsi.halaman);
    document.getElementById('topbar').innerHTML = htmlTopbar(opsi.judul, opsi.subjudul, petugas);

    document.getElementById('tombolTema').addEventListener('click', toggleTema);
    document.getElementById('menuKeluar').addEventListener('click', function (e) {
      e.preventDefault();
      UI.konfirmasi({ judul: 'Keluar', pesan: 'Akhiri sesi dan kembali ke halaman masuk?', konfirmasi: 'Ya, Keluar' })
        .then(function (ya) { if (ya) keluar(); });
    });
    document.getElementById('menuPengaturan').addEventListener('click', function (e) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('bukapengaturan'));
    });

    pasangSidebarMobile();
    return petugas;
  }

  return {
    MENU: MENU,
    IKON: IKON,
    initTheme: initTheme,
    toggleTheme: toggleTema,
    sesi: sesi,
    masuk: masuk,
    keluar: keluar,
    init: init
  };
})();
```

- [ ] **Step 3: Buat `pages/layout.html` — template master**

Setiap halaman berikutnya menyalin berkas ini lalu mengganti isi `<main class="konten">`, nilai `halaman`/`judul`/`subjudul`, dan berkas `page-*.js` yang dimuat.

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Template Layout &mdash; E-Library Universitas Pamulang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="../assets/js/config.js"></script>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="app-bg">

<div class="app-shell">
  <aside class="sidebar" id="sidebar" aria-label="Navigasi utama"></aside>

  <div class="area-utama">
    <header class="topbar" id="topbar"></header>

    <main class="konten">
      <section class="glass-panel p-6">
        <h3 class="text-lg mb-2">Area Konten</h3>
        <p class="text-muted">Salin berkas ini lalu ganti bagian ini dengan isi halaman.</p>
      </section>
    </main>

    <footer class="footer-app">
      Sistem Informasi Perpustakaan Digital &mdash; Universitas Pamulang &copy; 2026
    </footer>
  </div>
</div>

<script src="../assets/js/data.js"></script>
<script src="../assets/js/store.js"></script>
<script src="../assets/js/ui.js"></script>
<script src="../assets/js/table.js"></script>
<script src="../assets/js/layout.js"></script>
<script>
  Layout.init({ halaman: 'dashboard', judul: 'Template Layout', subjudul: 'Kerangka dasar halaman' });
</script>
</body>
</html>
```

- [ ] **Step 4: Verifikasi kerangka di peramban**

Karena penjaga sesi akan mengalihkan ke `index.html` yang belum ada, buat sesi sementara lebih dulu. Buka `http://localhost:8080/tests/runner.html`, lalu di console:

```js
localStorage.setItem('elibrary.session', JSON.stringify({ id: 'PT001', nama: 'Abdul Rachman', role: 'Administrator' }));
```

Kemudian buka `http://localhost:8080/pages/layout.html` dan periksa:
- Sidebar glass di kiri dengan seluruh menu; "Dashboard" tersorot indigo
- Topbar lengket saat digulir; tombol tema membalik mode dan bertahan setelah muat ulang
- Pada lebar 375 px sidebar tersembunyi, tombol hamburger muncul, laci terbuka dengan lapisan gelap, dan tertutup oleh Escape maupun klik di luar
- Menu "Keluar" memunculkan modal konfirmasi
- Console bersih kecuali peringatan Tailwind CDN

- [ ] **Step 5: Commit**

```bash
git add assets/js/layout.js assets/css/style.css pages/layout.html
git commit -m "feat: kerangka layout responsif dan template master (Milestone 2)"
```

---

### Task 8: Halaman Login

**Files:**
- Create: `index.html`
- Create: `assets/js/page-login.js`
- Modify: `assets/css/style.css` (tambahkan blok halaman masuk di akhir berkas)

**Interfaces:**
- Consumes: `Store.petugas.all()`, `Layout.masuk()`, `Layout.initTheme()`, `UI.validateForm`, `UI.rules`, `UI.toast`
- Produces: sesi di `localStorage['elibrary.session']` berisi objek petugas, lalu mengalihkan ke `pages/dashboard.html`
- Kredensial demo: `admin@unpam.ac.id` / `admin123` dan `siti@unpam.ac.id` / `admin123`

- [ ] **Step 1: Tambahkan gaya halaman masuk ke akhir `assets/css/style.css`**

```css
/* --- Halaman masuk --- */
.masuk-layar { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
.masuk-kartu { width: 100%; max-width: 420px; padding: 32px; }
.masuk-logo {
  width: 56px; height: 56px; margin: 0 auto 16px;
  display: grid; place-items: center;
  border-radius: 16px; background: #6366F1; color: #fff;
  font-family: "Plus Jakarta Sans", sans-serif; font-weight: 700; font-size: 24px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, .45);
}
.masuk-demo {
  margin-top: 20px; padding: 14px 16px;
  border-radius: 12px; border: 1px dashed var(--glass-border);
  font-size: 12px; color: var(--muted); line-height: 1.7;
}
.masuk-demo code { color: var(--text); font-weight: 600; }
.input-sandi { position: relative; }
.input-sandi .glass-input { padding-right: 44px; }
.input-sandi button {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  padding: 6px; border: none; background: transparent; color: var(--muted); cursor: pointer;
}
.input-sandi button:hover { color: var(--text); }
```

- [ ] **Step 2: Buat `index.html`**

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Masuk &mdash; Perpustakaan Digital Universitas Pamulang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="assets/js/config.js"></script>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="app-bg">

<main class="masuk-layar">
  <div class="glass-panel masuk-kartu">

    <div class="masuk-logo">P</div>
    <h1 class="text-2xl text-center">Perpustakaan Digital</h1>
    <p class="text-muted text-center text-sm mt-1">Universitas Pamulang &mdash; Panel Administrator</p>

    <form id="formMasuk" class="mt-8 space-y-4" novalidate>
      <div>
        <label class="field-label" for="email">Alamat Surel</label>
        <input class="glass-input" type="email" id="email" name="email" placeholder="admin@unpam.ac.id" autocomplete="username">
      </div>

      <div>
        <label class="field-label" for="sandi">Kata Sandi</label>
        <div class="input-sandi">
          <input class="glass-input" type="password" id="sandi" name="sandi" placeholder="Masukkan kata sandi" autocomplete="current-password">
          <button type="button" id="lihatSandi" aria-label="Perlihatkan kata sandi">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
        <input type="checkbox" id="ingatSaya" class="w-4 h-4 accent-brand"> Ingat saya di perangkat ini
      </label>

      <button type="submit" class="btn btn-primary w-full">Masuk ke Panel</button>
    </form>

    <div class="masuk-demo">
      <strong class="block mb-1" style="color:var(--text)">Akun demo</strong>
      Administrator &mdash; <code>admin@unpam.ac.id</code> / <code>admin123</code><br>
      Pustakawan &mdash; <code>siti@unpam.ac.id</code> / <code>admin123</code>
    </div>

  </div>
</main>

<script src="assets/js/data.js"></script>
<script src="assets/js/store.js"></script>
<script src="assets/js/ui.js"></script>
<script src="assets/js/layout.js"></script>
<script src="assets/js/page-login.js"></script>
</body>
</html>
```

- [ ] **Step 3: Buat `assets/js/page-login.js`**

```js
/* Halaman masuk. Autentikasi disimulasikan sepenuhnya di sisi klien —
   kata sandi tidak disimpan di data, cukup dicocokkan dengan konstanta demo. */
(function () {
  var SANDI_DEMO = 'admin123';

  Layout.initTheme();
  Store.init();

  // Sudah punya sesi aktif? Langsung ke dashboard.
  if (Layout.sesi()) { window.location.href = 'pages/dashboard.html'; return; }

  var form = document.getElementById('formMasuk');
  var inputSandi = document.getElementById('sandi');

  var SKEMA = {
    email: [UI.rules.wajib('Alamat surel wajib diisi'), UI.rules.email('Format surel tidak valid')],
    sandi: [UI.rules.wajib('Kata sandi wajib diisi'), UI.rules.minLen(6, 'Kata sandi minimal 6 karakter')]
  };

  UI.pasangValidasiBlur(form, SKEMA);

  document.getElementById('lihatSandi').addEventListener('click', function () {
    var tampil = inputSandi.type === 'password';
    inputSandi.type = tampil ? 'text' : 'password';
    this.setAttribute('aria-label', tampil ? 'Sembunyikan kata sandi' : 'Perlihatkan kata sandi');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validateForm(form, SKEMA).valid) return;

    var email = form.email.value.trim().toLowerCase();
    var petugas = Store.petugas.all().find(function (p) { return p.email.toLowerCase() === email; });

    if (!petugas || form.sandi.value !== SANDI_DEMO) {
      UI.tandaiGalat(inputSandi, 'Surel atau kata sandi tidak cocok.');
      UI.toast('Gagal masuk. Periksa kembali kredensial Anda.', 'bad');
      return;
    }

    Layout.masuk(petugas);
    UI.toast('Selamat datang, ' + petugas.nama.split(' ')[0] + '!', 'ok');
    setTimeout(function () { window.location.href = 'pages/dashboard.html'; }, 500);
  });
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Bersihkan sesi lebih dulu di console: `localStorage.removeItem('elibrary.session')`.

Buka `http://localhost:8080/index.html` dan periksa:
- Kartu glass di tengah dengan latar gradien dan orb
- Submit kosong memunculkan dua pesan galat dan memfokuskan field pertama
- Surel benar dengan sandi salah memunculkan galat pada field sandi dan toast merah
- `admin@unpam.ac.id` / `admin123` mengalihkan ke dashboard (halaman ini belum ada pada tahap ini, sehingga wajar bila 404)
- Tombol mata menampilkan dan menyembunyikan kata sandi
- Pada lebar 375 px kartu tetap punya jarak tepi dan tidak ada gulir horizontal

- [ ] **Step 5: Commit**

```bash
git add index.html assets/js/page-login.js assets/css/style.css
git commit -m "feat: halaman masuk admin dengan validasi dan sesi"
```

---

### Task 9: Halaman Dashboard

**Files:**
- Create: `pages/dashboard.html`
- Create: `assets/js/page-dashboard.js`
- Modify: `assets/css/style.css` (tambahkan blok kartu statistik dan linimasa di akhir berkas)

**Interfaces:**
- Consumes: `Layout.init`, `Store.*`, `Store.rules.*`, `UI.*`, Chart.js 4.4.1
- Produces: `PageDashboard.render()` dipanggil ulang saat event `temaberubah` agar warna grafik ikut berganti

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

```css
/* --- Kartu statistik --- */
.stat-kartu { display: flex; align-items: flex-start; gap: 16px; padding: 20px; }
.stat-ikon {
  width: 44px; height: 44px; flex: none;
  display: grid; place-items: center; border-radius: 12px;
}
.stat-ikon svg { width: 22px; height: 22px; }
.stat-ikon-brand { background: rgba(99, 102, 241, .16); color: #6366F1; }
.stat-ikon-ok    { background: rgba(20, 184, 166, .16); color: #14B8A6; }
.stat-ikon-warn  { background: rgba(245, 158, 11, .16); color: #F59E0B; }
.stat-ikon-bad   { background: rgba(244, 63, 94, .16);  color: #F43F5E; }
.stat-label { font-size: 13px; color: var(--muted); }
.stat-catatan { font-size: 12px; color: var(--muted); margin-top: 4px; }

/* --- Linimasa aktivitas --- */
.linimasa { list-style: none; margin: 0; padding: 0; }
.linimasa li { position: relative; padding: 0 0 18px 24px; }
.linimasa li::before {
  content: ""; position: absolute; left: 4px; top: 6px;
  width: 9px; height: 9px; border-radius: 999px; background: #6366F1;
}
.linimasa li::after {
  content: ""; position: absolute; left: 8px; top: 18px; bottom: 0;
  width: 1px; background: var(--glass-border);
}
.linimasa li:last-child { padding-bottom: 0; }
.linimasa li:last-child::after { display: none; }
.linimasa .waktu { font-size: 12px; color: var(--muted); }

/* --- Daftar peringkat --- */
.peringkat { list-style: none; margin: 0; padding: 0; }
.peringkat li { padding: 10px 0; border-bottom: 1px solid var(--glass-border); }
.peringkat li:last-child { border-bottom: none; }
.peringkat-bar { height: 6px; margin-top: 8px; border-radius: 999px; background: var(--glass-border); overflow: hidden; }
.peringkat-bar span { display: block; height: 100%; border-radius: 999px; background: #6366F1; }

.grafik-bungkus { position: relative; height: 280px; }
@media (max-width: 767px) { .grafik-bungkus { height: 220px; } }
```

- [ ] **Step 2: Buat `pages/dashboard.html`**

Salin `pages/layout.html`, ganti `<title>`, isi `<main>`, dan blok skrip penutup.

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard &mdash; E-Library Universitas Pamulang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="../assets/js/config.js"></script>
<link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="app-bg">

<div class="app-shell">
  <aside class="sidebar" id="sidebar" aria-label="Navigasi utama"></aside>

  <div class="area-utama">
    <header class="topbar" id="topbar"></header>

    <main class="konten space-y-6">

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" id="kartuStatistik"></section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="glass-panel p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 class="text-lg">Tren Sirkulasi</h3>
              <p class="text-muted text-sm">Peminjaman 12 bulan terakhir</p>
            </div>
          </div>
          <div class="grafik-bungkus"><canvas id="grafikTren"></canvas></div>
        </div>

        <div class="glass-panel p-6">
          <h3 class="text-lg mb-1">Komposisi Koleksi</h3>
          <p class="text-muted text-sm mb-4">Jumlah judul per kategori</p>
          <div class="grafik-bungkus"><canvas id="grafikKategori"></canvas></div>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="glass-panel p-6">
          <h3 class="text-lg mb-4">Aktivitas Terbaru</h3>
          <ul class="linimasa" id="daftarAktivitas"></ul>
        </div>

        <div class="glass-panel p-6">
          <h3 class="text-lg mb-4">Buku Terpopuler</h3>
          <ul class="peringkat" id="daftarPopuler"></ul>
        </div>

        <div class="glass-panel p-6">
          <h3 class="text-lg mb-1">Jatuh Tempo</h3>
          <p class="text-muted text-sm mb-4">Hari ini dan yang sudah terlewat</p>
          <ul class="peringkat" id="daftarJatuhTempo"></ul>
        </div>
      </section>

    </main>

    <footer class="footer-app">
      Sistem Informasi Perpustakaan Digital &mdash; Universitas Pamulang &copy; 2026
    </footer>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="../assets/js/data.js"></script>
<script src="../assets/js/store.js"></script>
<script src="../assets/js/ui.js"></script>
<script src="../assets/js/table.js"></script>
<script src="../assets/js/layout.js"></script>
<script src="../assets/js/page-dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 3: Buat `assets/js/page-dashboard.js`**

```js
/* Dashboard: ringkasan angka, dua grafik, dan tiga panel daftar. */
(function () {
  if (!Layout.init({ halaman: 'dashboard', judul: 'Dashboard', subjudul: 'Ringkasan aktivitas perpustakaan' })) return;

  var R = Store.rules;
  var grafikTren = null, grafikKategori = null;

  var IKON = {
    buku:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    anggota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    pinjam:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>',
    telat:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
  };

  function warnaTeks() {
    return getComputedStyle(document.body).getPropertyValue('--muted').trim();
  }
  function warnaGaris() {
    return document.documentElement.classList.contains('dark')
      ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.10)';
  }

  function renderStatistik() {
    var buku = Store.buku.all();
    var anggota = Store.anggota.all();
    var pinjam = Store.peminjaman.all();
    var hari = R.hariIni();

    var aktif = pinjam.filter(function (p) { return !p.tglKembali; });
    var telat = aktif.filter(function (p) { return R.statusPinjam(p, hari) === 'Terlambat'; });
    var totalEksemplar = buku.reduce(function (s, b) { return s + b.jumlahTotal; }, 0);
    var anggotaAktif = anggota.filter(function (a) { return a.status === 'Aktif'; });

    var KARTU = [
      { label: 'Total Koleksi',   nilai: buku.length,          catatan: totalEksemplar + ' eksemplar', ikon: IKON.buku,    nada: 'brand' },
      { label: 'Anggota Aktif',   nilai: anggotaAktif.length,  catatan: 'dari ' + anggota.length + ' terdaftar', ikon: IKON.anggota, nada: 'ok' },
      { label: 'Sedang Dipinjam', nilai: aktif.length,         catatan: 'transaksi berjalan', ikon: IKON.pinjam,  nada: 'warn' },
      { label: 'Terlambat',       nilai: telat.length,         catatan: 'perlu ditindaklanjuti', ikon: IKON.telat, nada: 'bad' }
    ];

    document.getElementById('kartuStatistik').innerHTML = KARTU.map(function (k) {
      return '<article class="glass-card stat-kartu">' +
               '<div class="stat-ikon stat-ikon-' + k.nada + '">' + k.ikon + '</div>' +
               '<div><p class="stat-label">' + k.label + '</p>' +
               '<p class="stat-value">' + k.nilai.toLocaleString('id-ID') + '</p>' +
               '<p class="stat-catatan">' + UI.escapeHtml(k.catatan) + '</p></div>' +
             '</article>';
    }).join('');
  }

  function renderGrafikTren() {
    var tren = Store.tren();
    var ctx = document.getElementById('grafikTren').getContext('2d');
    var gradien = ctx.createLinearGradient(0, 0, 0, 280);
    gradien.addColorStop(0, 'rgba(99,102,241,.45)');
    gradien.addColorStop(1, 'rgba(99,102,241,0)');

    if (grafikTren) grafikTren.destroy();
    grafikTren = new Chart(ctx, {
      type: 'line',
      data: {
        labels: tren.map(function (t) { return t.bulan; }),
        datasets: [
          { label: 'Peminjaman', data: tren.map(function (t) { return t.peminjaman; }),
            borderColor: '#6366F1', backgroundColor: gradien, fill: true, tension: .35,
            pointRadius: 3, pointBackgroundColor: '#6366F1', borderWidth: 2 },
          { label: 'Pengembalian', data: tren.map(function (t) { return t.pengembalian; }),
            borderColor: '#14B8A6', backgroundColor: 'transparent', fill: false, tension: .35,
            pointRadius: 0, borderWidth: 2, borderDash: [5, 4] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: warnaTeks(), usePointStyle: true, boxWidth: 8 } } },
        scales: {
          x: { grid: { color: warnaGaris() }, ticks: { color: warnaTeks(), maxRotation: 0, autoSkipPadding: 12 } },
          y: { beginAtZero: true, grid: { color: warnaGaris() }, ticks: { color: warnaTeks() } }
        }
      }
    });
  }

  function renderGrafikKategori() {
    var buku = Store.buku.all();
    var kategori = Store.kategori.all();
    var jumlah = kategori.map(function (k) {
      return buku.filter(function (b) { return b.idKategori === k.id; }).length;
    });
    var PALET = ['#6366F1', '#14B8A6', '#F59E0B', '#F43F5E', '#818CF8', '#0EA5E9', '#A78BFA', '#34D399'];

    if (grafikKategori) grafikKategori.destroy();
    grafikKategori = new Chart(document.getElementById('grafikKategori'), {
      type: 'doughnut',
      data: {
        labels: kategori.map(function (k) { return k.nama; }),
        datasets: [{ data: jumlah, backgroundColor: PALET, borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { color: warnaTeks(), usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11 } } } }
      }
    });
  }

  function renderAktivitas() {
    var pinjam = Store.peminjaman.all()
      .slice()
      .sort(function (a, b) { return (b.tglKembali || b.tglPinjam).localeCompare(a.tglKembali || a.tglPinjam); })
      .slice(0, 8);

    document.getElementById('daftarAktivitas').innerHTML = pinjam.map(function (p) {
      var a = Store.anggota.find(p.idAnggota);
      var b = R.bukuDariPinjam(p.id);
      var dikembalikan = !!p.tglKembali;
      return '<li>' +
               '<p class="text-sm"><strong>' + UI.escapeHtml(a ? a.nama : 'Anggota') + '</strong> ' +
               (dikembalikan ? 'mengembalikan' : 'meminjam') + ' &ldquo;' + UI.escapeHtml(b ? b.judul : '-') + '&rdquo;</p>' +
               '<p class="waktu">' + UI.formatTanggal(p.tglKembali || p.tglPinjam) + '</p>' +
             '</li>';
    }).join('');
  }

  function renderPopuler() {
    var detail = Store.detail.all();
    var hitung = {};
    detail.forEach(function (d) { hitung[d.idBuku] = (hitung[d.idBuku] || 0) + 1; });

    var urut = Object.keys(hitung)
      .map(function (id) { return { buku: Store.buku.find(id), jumlah: hitung[id] }; })
      .filter(function (x) { return x.buku; })
      .sort(function (a, b) { return b.jumlah - a.jumlah; })
      .slice(0, 5);

    var maks = urut.length ? urut[0].jumlah : 1;
    document.getElementById('daftarPopuler').innerHTML = urut.map(function (x, i) {
      return '<li>' +
               '<div class="flex items-center justify-between gap-3">' +
                 '<span class="text-sm">' + (i + 1) + '. ' + UI.escapeHtml(x.buku.judul) + '</span>' +
                 '<span class="text-sm text-muted tabular">' + x.jumlah + 'x</span>' +
               '</div>' +
               '<div class="peringkat-bar"><span style="width:' + Math.round(x.jumlah / maks * 100) + '%"></span></div>' +
             '</li>';
    }).join('') || '<li class="text-muted text-sm">Belum ada data peminjaman.</li>';
  }

  function renderJatuhTempo() {
    var hari = R.hariIni();
    var daftar = Store.peminjaman.all()
      .filter(function (p) { return !p.tglKembali; })
      .map(function (p) { return { p: p, sisa: R.sisaHari(p.tglJatuhTempo, hari) }; })
      .filter(function (x) { return x.sisa <= 0; })
      .sort(function (a, b) { return a.sisa - b.sisa; })
      .slice(0, 6);

    document.getElementById('daftarJatuhTempo').innerHTML = daftar.map(function (x) {
      var a = Store.anggota.find(x.p.idAnggota);
      var b = R.bukuDariPinjam(x.p.id);
      var kelas = x.sisa < 0 ? 'badge-bad' : 'badge-warn';
      var teks = x.sisa < 0 ? 'Terlambat ' + Math.abs(x.sisa) + ' hari' : 'Jatuh tempo hari ini';
      return '<li>' +
               '<div class="flex items-start justify-between gap-3">' +
                 '<div><p class="text-sm">' + UI.escapeHtml(b ? b.judul : '-') + '</p>' +
                 '<p class="waktu">' + UI.escapeHtml(a ? a.nama : '-') + '</p></div>' +
                 '<span class="badge ' + kelas + '">' + teks + '</span>' +
               '</div>' +
             '</li>';
    }).join('') || '<li class="text-muted text-sm">Tidak ada yang jatuh tempo. Semua aman.</li>';
  }

  function render() {
    renderStatistik();
    renderGrafikTren();
    renderGrafikKategori();
    renderAktivitas();
    renderPopuler();
    renderJatuhTempo();
  }

  render();

  // Warna grafik tidak ikut berubah sendiri saat tema diganti — render ulang.
  document.addEventListener('temaberubah', function () { renderGrafikTren(); renderGrafikKategori(); });
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Masuk lewat `index.html`, lalu periksa `pages/dashboard.html`:
- Empat kartu statistik menampilkan angka yang masuk akal (24 koleksi, 11 sedang dipinjam)
- Grafik area menampilkan dua garis untuk 12 bulan; grafik doughnut menampilkan 8 kategori
- Mengganti tema membuat label dan garis grid grafik ikut berubah warna, bukan tetap gelap
- Panel "Jatuh Tempo" menampilkan lencana merah untuk yang terlambat
- Pada lebar 375 px kartu menumpuk satu kolom dan grafik tetap terbaca
- Console bersih kecuali peringatan Tailwind CDN

- [ ] **Step 5: Commit**

```bash
git add pages/dashboard.html assets/js/page-dashboard.js assets/css/style.css
git commit -m "feat: halaman dashboard dengan kartu statistik dan grafik Chart.js"
```

---

### Task 10: Halaman Data Buku

**Files:**
- Create: `pages/data-buku.html`
- Create: `assets/js/page-buku.js`
- Modify: `assets/css/style.css` (tambahkan blok toolbar dan sel buku di akhir berkas)

**Interfaces:**
- Consumes: `DataTable.buat`, `Store.buku`, `Store.kategori`, `UI.konfirmasi`, `UI.toast`
- Produces: tautan ke `form-buku.html` (tambah) dan `form-buku.html?id=BKxxx` (ubah) — dipakai Task 13

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

```css
/* --- Toolbar halaman data --- */
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--glass-border); }
.toolbar .cari { position: relative; flex: 1 1 240px; min-width: 200px; }
.toolbar .cari .glass-input { padding-left: 40px; }
.toolbar .cari svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--muted); pointer-events: none; }
.toolbar .glass-select { width: auto; min-width: 150px; }
.toolbar .pendorong { margin-left: auto; }
@media (max-width: 767px) {
  .toolbar .pendorong { margin-left: 0; width: 100%; }
  .toolbar .pendorong .btn { width: 100%; }
  .toolbar .glass-select { flex: 1 1 140px; min-width: 0; }
}

/* --- Sel judul buku --- */
.sel-buku { display: flex; align-items: center; gap: 12px; text-align: left; }
.sel-sampul {
  width: 36px; height: 48px; flex: none;
  display: grid; place-items: center;
  border-radius: 6px; background: linear-gradient(145deg, #6366F1, #4F46E5);
  color: #fff; font-size: 11px; font-weight: 700; overflow: hidden;
}
.sel-sampul img { width: 100%; height: 100%; object-fit: cover; }
.sel-buku .judul { font-weight: 600; line-height: 1.3; }
.sel-buku .pengarang { font-size: 12px; color: var(--muted); }
@media (max-width: 767px) { .sel-buku { justify-content: flex-end; } }
```

- [ ] **Step 2: Buat `pages/data-buku.html`**

Salin `pages/layout.html`; ganti `<title>` menjadi `Data Buku — E-Library Universitas Pamulang`, ganti `<main>` dengan blok berikut, dan ganti baris skrip terakhir menjadi `<script src="../assets/js/page-buku.js"></script>`.

```html
    <main class="konten">
      <section class="glass-strong overflow-hidden">

        <div class="toolbar">
          <div class="cari">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input class="glass-input" type="search" id="cariBuku" placeholder="Cari judul, pengarang, atau ISBN&hellip;" aria-label="Cari buku">
          </div>

          <select class="glass-select" id="saringKategori" aria-label="Saring berdasarkan kategori">
            <option value="">Semua Kategori</option>
          </select>

          <select class="glass-select" id="saringStatus" aria-label="Saring berdasarkan ketersediaan">
            <option value="">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="terbatas">Stok Terbatas</option>
            <option value="habis">Stok Habis</option>
          </select>

          <div class="pendorong">
            <a class="btn btn-primary" href="form-buku.html">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Tambah Buku
            </a>
          </div>
        </div>

        <div id="tabelBuku"></div>
      </section>
    </main>
```

- [ ] **Step 3: Buat `assets/js/page-buku.js`**

```js
/* Halaman Data Buku: pencarian, dua saringan, tabel, dan hapus dengan konfirmasi. */
(function () {
  if (!Layout.init({ halaman: 'buku', judul: 'Data Buku', subjudul: 'Kelola koleksi perpustakaan' })) return;

  var IKON_UBAH  = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var IKON_HAPUS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  function statusStok(b) {
    if (b.jumlahTersedia === 0) return { kelas: 'badge-bad',  teks: 'Stok Habis' };
    if (b.jumlahTersedia <= 2)  return { kelas: 'badge-warn', teks: 'Terbatas' };
    return { kelas: 'badge-ok', teks: 'Tersedia' };
  }

  /* Baris tabel diperkaya dengan field turunan agar bisa dicari dan
     diurutkan langsung, tanpa lookup berulang di dalam render. */
  function siapkanBaris() {
    return Store.buku.all().map(function (b) {
      var k = Store.kategori.find(b.idKategori);
      return Object.assign({}, b, { namaKategori: k ? k.nama : '-' });
    });
  }

  var KOLOM = [
    {
      kunci: 'judul', label: 'Judul Buku', urut: true,
      render: function (b) {
        var sampul = b.cover
          ? '<img src="' + UI.escapeHtml(b.cover) + '" alt="">'
          : UI.escapeHtml(b.judul.charAt(0).toUpperCase());
        return '<div class="sel-buku"><div class="sel-sampul">' + sampul + '</div>' +
               '<div><div class="judul">' + UI.escapeHtml(b.judul) + '</div>' +
               '<div class="pengarang">' + UI.escapeHtml(b.pengarang) + '</div></div></div>';
      }
    },
    { kunci: 'isbn', label: 'ISBN', urut: true, kelas: 'tabular' },
    { kunci: 'namaKategori', label: 'Kategori', urut: true,
      render: function (b) { return '<span class="chip">' + UI.escapeHtml(b.namaKategori) + '</span>'; } },
    { kunci: 'lokasiRak', label: 'Rak', urut: true, kelas: 'tabular' },
    { kunci: 'jumlahTersedia', label: 'Stok', urut: true, kelas: 'kol-angka',
      render: function (b) { return '<span class="tabular">' + b.jumlahTersedia + ' / ' + b.jumlahTotal + '</span>'; } },
    { kunci: 'status', label: 'Status', ambil: function (b) { return statusStok(b).teks; },
      render: function (b) { var s = statusStok(b); return '<span class="badge ' + s.kelas + '">' + s.teks + '</span>'; } },
    { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
      render: function (b) {
        return '<a class="btn-icon" href="form-buku.html?id=' + b.id + '" title="Ubah" aria-label="Ubah ' + UI.escapeHtml(b.judul) + '">' + IKON_UBAH + '</a>' +
               '<button class="btn-icon" data-hapus="' + b.id + '" title="Hapus" aria-label="Hapus ' + UI.escapeHtml(b.judul) + '">' + IKON_HAPUS + '</button>';
      } }
  ];

  var SARINGAN = [
    { kunci: 'kategori', cocok: function (b, v) { return b.idKategori === v; } },
    { kunci: 'status', cocok: function (b, v) {
        if (v === 'habis') return b.jumlahTersedia === 0;
        if (v === 'terbatas') return b.jumlahTersedia > 0 && b.jumlahTersedia <= 2;
        return b.jumlahTersedia > 2;
      } }
  ];

  var mount = document.getElementById('tabelBuku');
  var tabel = DataTable.buat({
    mount: mount,
    kolom: KOLOM,
    baris: siapkanBaris(),
    cariPada: ['judul', 'pengarang', 'isbn', 'penerbit', 'namaKategori', 'lokasiRak'],
    saringan: SARINGAN,
    perHalaman: 8,
    urutAwal: 'judul',
    pesanKosong: 'Coba ubah kata kunci pencarian atau saringan kategori.'
  });
  tabel.render();

  // Isi pilihan kategori dari data, bukan dari daftar yang ditulis tangan.
  var pilihKategori = document.getElementById('saringKategori');
  Store.kategori.all().forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.nama + ' (' + k.kodeDdc + ')';
    pilihKategori.appendChild(opt);
  });

  /* Debounce agar tabel tidak dirender ulang pada setiap ketukan tombol. */
  var timer = null;
  document.getElementById('cariBuku').addEventListener('input', function (e) {
    clearTimeout(timer);
    var nilai = e.target.value;
    timer = setTimeout(function () { tabel.setCari(nilai); }, 220);
  });

  pilihKategori.addEventListener('change', function (e) { tabel.setSaringan('kategori', e.target.value); });
  document.getElementById('saringStatus').addEventListener('change', function (e) { tabel.setSaringan('status', e.target.value); });

  mount.addEventListener('click', function (e) {
    var tombol = e.target.closest && e.target.closest('[data-hapus]');
    if (!tombol) return;
    var id = tombol.getAttribute('data-hapus');
    var buku = Store.buku.find(id);
    if (!buku) return;

    var sedangDipinjam = buku.jumlahTotal - buku.jumlahTersedia;
    if (sedangDipinjam > 0) {
      UI.toast('"' + buku.judul + '" masih dipinjam ' + sedangDipinjam + ' anggota dan tidak dapat dihapus.', 'bad');
      return;
    }

    UI.konfirmasi({
      judul: 'Hapus Buku',
      pesan: 'Hapus "' + buku.judul + '" karya ' + buku.pengarang + ' dari koleksi? Tindakan ini tidak dapat dibatalkan.',
      konfirmasi: 'Ya, Hapus'
    }).then(function (ya) {
      if (!ya) return;
      Store.buku.remove(id);
      tabel.setBaris(siapkanBaris());
      UI.toast('Buku "' + buku.judul + '" telah dihapus.', 'ok');
    });
  });
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Buka `pages/data-buku.html` dan periksa:
- Tabel menampilkan 8 baris pertama dari 24 buku, dengan paginasi tiga halaman
- Mengetik `bumi` menyisakan satu baris; mengosongkan kolom mengembalikan seluruhnya
- Saringan kategori "Teknologi" menyisakan 6 judul
- Mengklik kepala kolom "Stok" mengurutkan naik, klik kedua mengurutkan turun, dan penanda panah berubah
- Menghapus buku yang sedang dipinjam (`Pemrograman Web Modern`) ditolak dengan toast merah
- Menghapus `Ensiklopedia Umum Nusantara` memunculkan modal yang menyebut judulnya, lalu barisnya hilang dan toast hijau muncul
- Muat ulang halaman: buku tersebut tetap terhapus
- Pada lebar 375 px tabel berubah menjadi kartu berlabel, bukan tergulir ke samping

Jalankan `Store.reset()` di console untuk memulihkan data setelah pengujian.

- [ ] **Step 5: Commit**

```bash
git add pages/data-buku.html assets/js/page-buku.js assets/css/style.css
git commit -m "feat: halaman data buku dengan cari, saring, urut, dan hapus"
```

---

### Task 11: Halaman Data Anggota

**Files:**
- Create: `pages/data-anggota.html`
- Create: `assets/js/page-anggota.js`
- Modify: `assets/css/style.css` (tambahkan gaya sel anggota di akhir berkas)

**Interfaces:**
- Consumes: `DataTable.buat`, `Store.anggota`, `Store.rules.jumlahPinjamanAktif`, `UI.inisial`, `UI.konfirmasi`
- Produces: modal tambah/ubah anggota (tidak ada halaman form terpisah untuk anggota)

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

```css
/* --- Sel anggota --- */
.sel-anggota { display: flex; align-items: center; gap: 12px; text-align: left; }
.avatar-inisial {
  width: 38px; height: 38px; flex: none;
  display: grid; place-items: center; border-radius: 999px;
  color: #fff; font-size: 13px; font-weight: 600;
}
.sel-anggota .nama { font-weight: 600; line-height: 1.3; }
.sel-anggota .nim { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
@media (max-width: 767px) { .sel-anggota { justify-content: flex-end; } }
```

- [ ] **Step 2: Buat `pages/data-anggota.html`**

Salin `pages/layout.html`; `<title>` menjadi `Data Anggota — E-Library Universitas Pamulang`, skrip terakhir menjadi `page-anggota.js`, dan `<main>` diisi:

```html
    <main class="konten">
      <section class="glass-strong overflow-hidden">

        <div class="toolbar">
          <div class="cari">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input class="glass-input" type="search" id="cariAnggota" placeholder="Cari nama, NIM, atau surel&hellip;" aria-label="Cari anggota">
          </div>

          <select class="glass-select" id="saringJurusan" aria-label="Saring berdasarkan jurusan">
            <option value="">Semua Jurusan</option>
          </select>

          <select class="glass-select" id="saringStatusAnggota" aria-label="Saring berdasarkan status">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
            <option value="Diblokir">Diblokir</option>
          </select>

          <div class="pendorong">
            <button class="btn btn-primary" id="tombolTambahAnggota">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Tambah Anggota
            </button>
          </div>
        </div>

        <div id="tabelAnggota"></div>
      </section>
    </main>
```

- [ ] **Step 3: Buat `assets/js/page-anggota.js`**

```js
/* Halaman Data Anggota. Form tambah/ubah memakai modal, bukan halaman
   terpisah, karena jumlah fieldnya sedikit. */
(function () {
  if (!Layout.init({ halaman: 'anggota', judul: 'Data Anggota', subjudul: 'Kelola keanggotaan perpustakaan' })) return;

  var IKON_UBAH  = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var IKON_HAPUS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  var WARNA_AVATAR = ['#6366F1', '#14B8A6', '#F59E0B', '#F43F5E', '#0EA5E9', '#A78BFA'];

  /* Warna avatar dipilih deterministik dari id agar tidak berubah-ubah
     setiap kali tabel dirender ulang. */
  function warnaAvatar(id) {
    var n = 0;
    for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return WARNA_AVATAR[n % WARNA_AVATAR.length];
  }

  var LENCANA_STATUS = { 'Aktif': 'badge-ok', 'Nonaktif': 'badge-muted', 'Diblokir': 'badge-bad' };

  function siapkanBaris() {
    return Store.anggota.all().map(function (a) {
      return Object.assign({}, a, { pinjamanAktif: Store.rules.jumlahPinjamanAktif(a.id) });
    });
  }

  var KOLOM = [
    { kunci: 'nama', label: 'Anggota', urut: true,
      render: function (a) {
        return '<div class="sel-anggota">' +
                 '<div class="avatar-inisial" style="background:' + warnaAvatar(a.id) + '">' + UI.inisial(a.nama) + '</div>' +
                 '<div><div class="nama">' + UI.escapeHtml(a.nama) + '</div>' +
                 '<div class="nim">' + UI.escapeHtml(a.nim) + '</div></div>' +
               '</div>';
      } },
    { kunci: 'jurusan', label: 'Jurusan', urut: true,
      render: function (a) { return UI.escapeHtml(a.jurusan) + '<div class="text-muted" style="font-size:12px">Angkatan ' + a.angkatan + '</div>'; } },
    { kunci: 'email', label: 'Surel', urut: true },
    { kunci: 'pinjamanAktif', label: 'Pinjaman', urut: true, kelas: 'kol-angka',
      render: function (a) { return '<span class="tabular">' + a.pinjamanAktif + ' / ' + Store.rules.MAKS_PINJAM + '</span>'; } },
    { kunci: 'tglDaftar', label: 'Bergabung', urut: true,
      render: function (a) { return UI.formatTanggal(a.tglDaftar); } },
    { kunci: 'status', label: 'Status', urut: true,
      render: function (a) { return '<span class="badge ' + (LENCANA_STATUS[a.status] || 'badge-muted') + '">' + UI.escapeHtml(a.status) + '</span>'; } },
    { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
      render: function (a) {
        return '<button class="btn-icon" data-ubah="' + a.id + '" title="Ubah" aria-label="Ubah ' + UI.escapeHtml(a.nama) + '">' + IKON_UBAH + '</button>' +
               '<button class="btn-icon" data-hapus="' + a.id + '" title="Hapus" aria-label="Hapus ' + UI.escapeHtml(a.nama) + '">' + IKON_HAPUS + '</button>';
      } }
  ];

  var SARINGAN = [
    { kunci: 'jurusan', cocok: function (a, v) { return a.jurusan === v; } },
    { kunci: 'status',  cocok: function (a, v) { return a.status === v; } }
  ];

  var mount = document.getElementById('tabelAnggota');
  var tabel = DataTable.buat({
    mount: mount,
    kolom: KOLOM,
    baris: siapkanBaris(),
    cariPada: ['nama', 'nim', 'email', 'jurusan', 'telepon'],
    saringan: SARINGAN,
    perHalaman: 8,
    urutAwal: 'nama',
    pesanKosong: 'Tidak ada anggota yang cocok dengan pencarian atau saringan.'
  });
  tabel.render();

  var pilihJurusan = document.getElementById('saringJurusan');
  Store.anggota.all()
    .map(function (a) { return a.jurusan; })
    .filter(function (j, i, arr) { return arr.indexOf(j) === i; })
    .sort()
    .forEach(function (j) {
      var opt = document.createElement('option');
      opt.value = j; opt.textContent = j;
      pilihJurusan.appendChild(opt);
    });

  var timer = null;
  document.getElementById('cariAnggota').addEventListener('input', function (e) {
    clearTimeout(timer);
    var nilai = e.target.value;
    timer = setTimeout(function () { tabel.setCari(nilai); }, 220);
  });
  pilihJurusan.addEventListener('change', function (e) { tabel.setSaringan('jurusan', e.target.value); });
  document.getElementById('saringStatusAnggota').addEventListener('change', function (e) { tabel.setSaringan('status', e.target.value); });

  /* --- Modal tambah / ubah --- */
  var SKEMA = {
    nama:    [UI.rules.wajib('Nama wajib diisi'), UI.rules.minLen(3, 'Nama minimal 3 karakter')],
    nim:     [UI.rules.wajib('NIM wajib diisi'), UI.rules.custom(function (v) { return /^\d{9,15}$/.test(String(v).trim()); }, 'NIM harus 9 sampai 15 digit angka')],
    email:   [UI.rules.wajib('Surel wajib diisi'), UI.rules.email('Format surel tidak valid')],
    telepon: [UI.rules.wajib('Nomor telepon wajib diisi'), UI.rules.custom(function (v) { return /^08\d{8,12}$/.test(String(v).trim()); }, 'Nomor harus diawali 08 dan berisi 10 sampai 14 digit')],
    jurusan: [UI.rules.wajib('Jurusan wajib dipilih')],
    angkatan:[UI.rules.wajib('Angkatan wajib diisi'), UI.rules.rentang(2015, new Date().getFullYear(), 'Angkatan harus antara 2015 dan ' + new Date().getFullYear())]
  };

  var JURUSAN = ['Teknik Informatika', 'Manajemen', 'Akuntansi', 'Ilmu Hukum', 'Sastra Inggris', 'Teknik Industri'];

  function htmlForm(a) {
    function opsi(daftar, terpilih) {
      return daftar.map(function (x) {
        return '<option value="' + UI.escapeHtml(x) + '"' + (x === terpilih ? ' selected' : '') + '>' + UI.escapeHtml(x) + '</option>';
      }).join('');
    }
    return '<form id="formAnggota" class="space-y-4" novalidate>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
        '<div><label class="field-label" for="fNama">Nama Lengkap</label><input class="glass-input" id="fNama" name="nama" value="' + UI.escapeHtml(a.nama || '') + '"></div>' +
        '<div><label class="field-label" for="fNim">NIM</label><input class="glass-input" id="fNim" name="nim" inputmode="numeric" value="' + UI.escapeHtml(a.nim || '') + '"></div>' +
        '<div><label class="field-label" for="fEmail">Surel</label><input class="glass-input" id="fEmail" name="email" type="email" value="' + UI.escapeHtml(a.email || '') + '"></div>' +
        '<div><label class="field-label" for="fTelepon">Telepon</label><input class="glass-input" id="fTelepon" name="telepon" inputmode="tel" value="' + UI.escapeHtml(a.telepon || '') + '"></div>' +
        '<div><label class="field-label" for="fJurusan">Jurusan</label><select class="glass-select" id="fJurusan" name="jurusan"><option value="">Pilih jurusan</option>' + opsi(JURUSAN, a.jurusan) + '</select></div>' +
        '<div><label class="field-label" for="fAngkatan">Angkatan</label><input class="glass-input" id="fAngkatan" name="angkatan" inputmode="numeric" value="' + UI.escapeHtml(a.angkatan || '') + '"></div>' +
        '<div class="sm:col-span-2"><label class="field-label" for="fStatus">Status Keanggotaan</label><select class="glass-select" id="fStatus" name="status">' + opsi(['Aktif', 'Nonaktif', 'Diblokir'], a.status || 'Aktif') + '</select></div>' +
      '</div></form>';
  }

  function bukaForm(a) {
    var ubah = !!a.id;
    UI.modal({
      judul: ubah ? 'Ubah Data Anggota' : 'Tambah Anggota Baru',
      isiHtml: htmlForm(a),
      konfirmasi: ubah ? 'Simpan Perubahan' : 'Simpan Anggota',
      lebar: true,
      onKonfirmasi: function () {
        var form = document.getElementById('formAnggota');
        if (!UI.validateForm(form, SKEMA).valid) return false;   // tahan modal tetap terbuka

        var isi = {
          nama: form.nama.value.trim(),
          nim: form.nim.value.trim(),
          email: form.email.value.trim(),
          telepon: form.telepon.value.trim(),
          jurusan: form.jurusan.value,
          angkatan: parseInt(form.angkatan.value, 10),
          status: form.status.value
        };

        var bentrok = Store.anggota.all().find(function (x) { return x.nim === isi.nim && x.id !== a.id; });
        if (bentrok) { UI.tandaiGalat(form.nim, 'NIM ini sudah terdaftar atas nama ' + bentrok.nama + '.'); return false; }

        if (ubah) { Store.anggota.update(a.id, isi); UI.toast('Data ' + isi.nama + ' diperbarui.', 'ok'); }
        else { isi.tglDaftar = Store.rules.hariIni(); Store.anggota.create(isi); UI.toast('Anggota ' + isi.nama + ' ditambahkan.', 'ok'); }

        tabel.setBaris(siapkanBaris());
        return true;
      }
    });
    UI.pasangValidasiBlur(document.getElementById('formAnggota'), SKEMA);
  }

  document.getElementById('tombolTambahAnggota').addEventListener('click', function () { bukaForm({}); });

  mount.addEventListener('click', function (e) {
    var ubah = e.target.closest && e.target.closest('[data-ubah]');
    if (ubah) { bukaForm(Store.anggota.find(ubah.getAttribute('data-ubah')) || {}); return; }

    var hapus = e.target.closest && e.target.closest('[data-hapus]');
    if (!hapus) return;
    var id = hapus.getAttribute('data-hapus');
    var a = Store.anggota.find(id);
    if (!a) return;

    var aktif = Store.rules.jumlahPinjamanAktif(id);
    if (aktif > 0) {
      UI.toast(a.nama + ' masih memiliki ' + aktif + ' pinjaman aktif dan tidak dapat dihapus.', 'bad');
      return;
    }

    UI.konfirmasi({
      judul: 'Hapus Anggota',
      pesan: 'Hapus data ' + a.nama + ' (' + a.nim + ') dari daftar anggota? Tindakan ini tidak dapat dibatalkan.',
      konfirmasi: 'Ya, Hapus'
    }).then(function (ya) {
      if (!ya) return;
      Store.anggota.remove(id);
      tabel.setBaris(siapkanBaris());
      UI.toast('Anggota ' + a.nama + ' telah dihapus.', 'ok');
    });
  });
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Buka `pages/data-anggota.html` dan periksa:
- 18 anggota terbagi tiga halaman, avatar inisial berwarna konsisten setelah pengurutan ulang
- Saringan status "Diblokir" menyisakan satu baris (Maulana Hakim)
- "Tambah Anggota" membuka modal; submit kosong menahan modal tetap terbuka dan menandai setiap field
- Mengisi NIM yang sudah ada memunculkan galat yang menyebut nama pemiliknya
- Menghapus anggota yang punya pinjaman aktif ditolak lewat toast
- Anggota baru tetap ada setelah halaman dimuat ulang

- [ ] **Step 5: Commit**

```bash
git add pages/data-anggota.html assets/js/page-anggota.js assets/css/style.css
git commit -m "feat: halaman data anggota dengan modal tambah dan ubah"
```

---

### Task 12: Halaman Peminjaman dan Pengembalian

**Files:**
- Create: `pages/peminjaman.html`
- Create: `assets/js/page-peminjaman.js`
- Modify: `assets/css/style.css` (tambahkan gaya tab dan bar sisa waktu di akhir berkas)

**Interfaces:**
- Consumes: `Store.rules.bolehPinjam`, `.catatPeminjaman`, `.prosesPengembalian`, `.statusPinjam`, `.sisaHari`, `.hitungDenda`
- Produces: menghormati `location.hash === '#riwayat'` sehingga menu "Pengembalian" di sidebar membuka tab riwayat secara langsung

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

```css
/* --- Tab --- */
.tab-bar { display: flex; gap: 6px; padding: 14px 16px 0; }
.tab-tombol {
  padding: 10px 18px; border: none; border-radius: 12px 12px 0 0;
  background: transparent; color: var(--muted); font: inherit; font-weight: 600; cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tab-tombol:hover { color: var(--text); }
.tab-tombol[aria-selected="true"] { color: var(--text); background: var(--glass); border-bottom-color: #6366F1; }

/* --- Indikator sisa waktu --- */
.sisa-waktu { min-width: 130px; }
.sisa-bar { height: 6px; margin-top: 6px; border-radius: 999px; background: var(--glass-border); overflow: hidden; }
.sisa-bar span { display: block; height: 100%; border-radius: 999px; }
.sisa-aman span     { background: #14B8A6; }
.sisa-segera span   { background: #F59E0B; }
.sisa-terlambat span{ background: #F43F5E; }
.sisa-teks { font-size: 12px; font-weight: 600; }
@media (max-width: 767px) { .sisa-waktu { min-width: 0; width: 55%; } }

/* --- Rincian denda di modal --- */
.rincian { margin-top: 16px; border-top: 1px solid var(--glass-border); padding-top: 12px; font-size: 14px; }
.rincian div { display: flex; justify-content: space-between; padding: 5px 0; }
.rincian .total { font-weight: 700; font-size: 16px; border-top: 1px solid var(--glass-border); margin-top: 6px; padding-top: 10px; }
```

- [ ] **Step 2: Buat `pages/peminjaman.html`**

Salin `pages/layout.html`; `<title>` menjadi `Peminjaman — E-Library Universitas Pamulang`, skrip terakhir menjadi `page-peminjaman.js`, dan `<main>` diisi:

```html
    <main class="konten">
      <section class="glass-strong overflow-hidden">

        <div class="tab-bar" role="tablist" aria-label="Jenis transaksi">
          <button class="tab-tombol" id="tabAktif" role="tab" aria-selected="true" aria-controls="panelTransaksi">Peminjaman Aktif</button>
          <button class="tab-tombol" id="tabRiwayat" role="tab" aria-selected="false" aria-controls="panelTransaksi">Riwayat Pengembalian</button>
        </div>

        <div class="toolbar">
          <div class="cari">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input class="glass-input" type="search" id="cariTransaksi" placeholder="Cari anggota atau judul buku&hellip;" aria-label="Cari transaksi">
          </div>

          <select class="glass-select" id="saringKondisi" aria-label="Saring berdasarkan kondisi">
            <option value="">Semua Kondisi</option>
            <option value="Aman">Aman</option>
            <option value="Segera">Mendekati Jatuh Tempo</option>
            <option value="Terlambat">Terlambat</option>
          </select>

          <div class="pendorong">
            <button class="btn btn-primary" id="tombolPinjamBaru">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Peminjaman Baru
            </button>
          </div>
        </div>

        <div id="panelTransaksi" role="tabpanel"></div>
      </section>
    </main>
```

- [ ] **Step 3: Buat `assets/js/page-peminjaman.js`**

```js
/* Sirkulasi: peminjaman aktif dan riwayat pengembalian dalam satu halaman.
   Keduanya beroperasi pada entitas yang sama, sehingga memisahkannya ke dua
   halaman hanya memperlambat kerja pustakawan. */
(function () {
  if (!Layout.init({ halaman: 'peminjaman', judul: 'Transaksi Sirkulasi', subjudul: 'Peminjaman dan pengembalian buku' })) return;

  var R = Store.rules;
  var mount = document.getElementById('panelTransaksi');
  var tabAktif = document.getElementById('tabAktif');
  var tabRiwayat = document.getElementById('tabRiwayat');
  var saringKondisi = document.getElementById('saringKondisi');
  var modeRiwayat = location.hash === '#riwayat';
  var tabel = null;

  var LENCANA = { 'Aman': 'badge-ok', 'Segera': 'badge-warn', 'Terlambat': 'badge-bad', 'Dikembalikan': 'badge-muted' };

  function siapkanBaris() {
    var hari = R.hariIni();
    return Store.peminjaman.all()
      .filter(function (p) { return modeRiwayat ? !!p.tglKembali : !p.tglKembali; })
      .map(function (p) {
        var a = Store.anggota.find(p.idAnggota);
        var b = R.bukuDariPinjam(p.id);
        var d = Store.denda.all().find(function (x) { return x.idPinjam === p.id; });
        return Object.assign({}, p, {
          namaAnggota: a ? a.nama : '-',
          nimAnggota: a ? a.nim : '-',
          judulBuku: b ? b.judul : '-',
          kondisi: R.statusPinjam(p, hari),
          sisa: R.sisaHari(p.tglJatuhTempo, hari),
          nominalDenda: d ? d.nominal : 0
        });
      });
  }

  function selSisaWaktu(t) {
    if (t.kondisi === 'Terlambat') {
      return '<div class="sisa-waktu"><span class="sisa-teks" style="color:#F43F5E">Terlambat ' + Math.abs(t.sisa) + ' hari</span>' +
             '<div class="sisa-bar sisa-terlambat"><span style="width:100%"></span></div></div>';
    }
    var persen = Math.max(6, Math.round(t.sisa / R.MASA_PINJAM_HARI * 100));
    var kelas = t.kondisi === 'Segera' ? 'sisa-segera' : 'sisa-aman';
    var warna = t.kondisi === 'Segera' ? '#F59E0B' : '#14B8A6';
    var teks = t.sisa === 0 ? 'Jatuh tempo hari ini' : 'Sisa ' + t.sisa + ' hari';
    return '<div class="sisa-waktu"><span class="sisa-teks" style="color:' + warna + '">' + teks + '</span>' +
           '<div class="sisa-bar ' + kelas + '"><span style="width:' + persen + '%"></span></div></div>';
  }

  function kolomAktif() {
    return [
      { kunci: 'id', label: 'Kode', urut: true, kelas: 'tabular' },
      { kunci: 'namaAnggota', label: 'Peminjam', urut: true,
        render: function (t) { return '<div class="nama" style="font-weight:600">' + UI.escapeHtml(t.namaAnggota) + '</div><div class="nim text-muted" style="font-size:12px">' + UI.escapeHtml(t.nimAnggota) + '</div>'; } },
      { kunci: 'judulBuku', label: 'Buku', urut: true },
      { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.formatTanggal(t.tglPinjam); } },
      { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.formatTanggal(t.tglJatuhTempo); } },
      { kunci: 'sisa', label: 'Sisa Waktu', urut: true, render: selSisaWaktu },
      { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
        render: function (t) { return '<button class="btn btn-ghost" data-kembali="' + t.id + '">Kembalikan</button>'; } }
    ];
  }

  function kolomRiwayat() {
    return [
      { kunci: 'id', label: 'Kode', urut: true, kelas: 'tabular' },
      { kunci: 'namaAnggota', label: 'Peminjam', urut: true },
      { kunci: 'judulBuku', label: 'Buku', urut: true },
      { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.formatTanggal(t.tglPinjam); } },
      { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.formatTanggal(t.tglJatuhTempo); } },
      { kunci: 'tglKembali', label: 'Tgl Kembali', urut: true, render: function (t) { return UI.formatTanggal(t.tglKembali); } },
      { kunci: 'nominalDenda', label: 'Denda', urut: true, kelas: 'kol-angka',
        render: function (t) {
          return t.nominalDenda > 0
            ? '<span class="badge badge-bad">' + UI.formatRupiah(t.nominalDenda) + '</span>'
            : '<span class="text-muted">&mdash;</span>';
        } }
    ];
  }

  var SARINGAN = [{ kunci: 'kondisi', cocok: function (t, v) { return t.kondisi === v; } }];

  function bangunTabel() {
    mount.innerHTML = '';
    tabel = DataTable.buat({
      mount: mount,
      kolom: modeRiwayat ? kolomRiwayat() : kolomAktif(),
      baris: siapkanBaris(),
      cariPada: ['id', 'namaAnggota', 'nimAnggota', 'judulBuku'],
      saringan: modeRiwayat ? [] : SARINGAN,
      perHalaman: 8,
      urutAwal: modeRiwayat ? 'tglKembali' : 'sisa',
      pesanKosong: modeRiwayat ? 'Belum ada pengembalian yang tercatat.' : 'Tidak ada peminjaman aktif yang cocok.'
    });
    tabel.render();
  }

  function gantiTab(keRiwayat) {
    modeRiwayat = keRiwayat;
    tabAktif.setAttribute('aria-selected', String(!keRiwayat));
    tabRiwayat.setAttribute('aria-selected', String(keRiwayat));
    saringKondisi.style.display = keRiwayat ? 'none' : '';
    document.getElementById('cariTransaksi').value = '';
    bangunTabel();
  }

  tabAktif.addEventListener('click', function () { location.hash = ''; gantiTab(false); });
  tabRiwayat.addEventListener('click', function () { location.hash = 'riwayat'; gantiTab(true); });

  var timer = null;
  document.getElementById('cariTransaksi').addEventListener('input', function (e) {
    clearTimeout(timer);
    var nilai = e.target.value;
    timer = setTimeout(function () { tabel.setCari(nilai); }, 220);
  });
  saringKondisi.addEventListener('change', function (e) { tabel.setSaringan('kondisi', e.target.value); });

  /* --- Modal peminjaman baru --- */
  function htmlFormPinjam() {
    var anggota = Store.anggota.all().filter(function (a) { return a.status === 'Aktif'; })
      .sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    var buku = Store.buku.all().filter(function (b) { return b.jumlahTersedia > 0; })
      .sort(function (a, b) { return a.judul.localeCompare(b.judul, 'id'); });

    return '<form id="formPinjam" class="space-y-4" novalidate>' +
      '<div><label class="field-label" for="pAnggota">Anggota Peminjam</label>' +
        '<select class="glass-select" id="pAnggota" name="idAnggota"><option value="">Pilih anggota</option>' +
        anggota.map(function (a) { return '<option value="' + a.id + '">' + UI.escapeHtml(a.nama + ' — ' + a.nim) + '</option>'; }).join('') +
        '</select></div>' +
      '<div><label class="field-label" for="pBuku">Buku yang Dipinjam</label>' +
        '<select class="glass-select" id="pBuku" name="idBuku"><option value="">Pilih buku</option>' +
        buku.map(function (b) { return '<option value="' + b.id + '">' + UI.escapeHtml(b.judul) + ' (tersedia ' + b.jumlahTersedia + ')</option>'; }).join('') +
        '</select></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
        '<div><label class="field-label" for="pTanggal">Tanggal Pinjam</label>' +
          '<input class="glass-input" type="date" id="pTanggal" name="tglPinjam" value="' + R.hariIni() + '"></div>' +
        '<div><label class="field-label" for="pTempo">Jatuh Tempo (otomatis)</label>' +
          '<input class="glass-input" type="date" id="pTempo" value="' + R.jatuhTempo(R.hariIni()) + '" readonly tabindex="-1"></div>' +
      '</div>' +
      '<p class="text-muted" style="font-size:12px">Masa pinjam ' + R.MASA_PINJAM_HARI + ' hari. Keterlambatan dikenakan denda ' + UI.formatRupiah(R.DENDA_PER_HARI) + ' per hari.</p>' +
    '</form>';
  }

  document.getElementById('tombolPinjamBaru').addEventListener('click', function () {
    UI.modal({
      judul: 'Peminjaman Baru',
      isiHtml: htmlFormPinjam(),
      konfirmasi: 'Catat Peminjaman',
      lebar: true,
      onKonfirmasi: function () {
        var form = document.getElementById('formPinjam');
        var skema = {
          idAnggota: [UI.rules.wajib('Anggota wajib dipilih')],
          idBuku: [UI.rules.wajib('Buku wajib dipilih')],
          tglPinjam: [UI.rules.wajib('Tanggal pinjam wajib diisi')]
        };
        if (!UI.validateForm(form, skema).valid) return false;

        var cek = R.bolehPinjam(form.idAnggota.value, form.idBuku.value);
        if (!cek.boleh) { UI.tandaiGalat(form.idAnggota, cek.alasan); return false; }

        var p = R.catatPeminjaman({
          idAnggota: form.idAnggota.value,
          idBuku: form.idBuku.value,
          tglPinjam: form.tglPinjam.value,
          idPetugas: Layout.sesi().id
        });
        UI.toast('Peminjaman ' + p.id + ' tercatat. Jatuh tempo ' + UI.formatTanggal(p.tglJatuhTempo) + '.', 'ok');
        if (!modeRiwayat) tabel.setBaris(siapkanBaris());
        return true;
      }
    });

    // Jatuh tempo mengikuti tanggal pinjam secara langsung.
    var tanggal = document.getElementById('pTanggal');
    tanggal.addEventListener('change', function () {
      document.getElementById('pTempo').value = tanggal.value ? R.jatuhTempo(tanggal.value) : '';
    });
  });

  /* --- Modal pengembalian --- */
  mount.addEventListener('click', function (e) {
    var tombol = e.target.closest && e.target.closest('[data-kembali]');
    if (!tombol) return;

    var id = tombol.getAttribute('data-kembali');
    var p = Store.peminjaman.find(id);
    if (!p) return;
    var a = Store.anggota.find(p.idAnggota);
    var b = R.bukuDariPinjam(id);
    var hari = R.hariIni();
    var hitung = R.hitungDenda(p.tglJatuhTempo, hari);

    var rincian =
      '<div class="rincian">' +
        '<div><span class="text-muted">Peminjam</span><span>' + UI.escapeHtml(a ? a.nama : '-') + '</span></div>' +
        '<div><span class="text-muted">Buku</span><span>' + UI.escapeHtml(b ? b.judul : '-') + '</span></div>' +
        '<div><span class="text-muted">Jatuh tempo</span><span>' + UI.formatTanggal(p.tglJatuhTempo) + '</span></div>' +
        '<div><span class="text-muted">Tanggal kembali</span><span>' + UI.formatTanggal(hari) + '</span></div>' +
        '<div><span class="text-muted">Keterlambatan</span><span>' + hitung.hariTerlambat + ' hari</span></div>' +
        '<div class="total"><span>Total denda</span><span style="color:' + (hitung.nominal ? '#F43F5E' : 'inherit') + '">' + UI.formatRupiah(hitung.nominal) + '</span></div>' +
      '</div>';

    UI.modal({
      judul: 'Proses Pengembalian',
      isiHtml: '<p class="text-muted">Konfirmasi pengembalian untuk transaksi <strong>' + id + '</strong>.</p>' + rincian,
      konfirmasi: 'Konfirmasi Pengembalian',
      nada: hitung.nominal ? 'bad' : undefined,
      onKonfirmasi: function () {
        var hasil = R.prosesPengembalian(id, hari);
        tabel.setBaris(siapkanBaris());
        if (hasil.denda) UI.toast('Dikembalikan. Denda ' + UI.formatRupiah(hasil.denda.nominal) + ' tercatat sebagai belum lunas.', 'bad');
        else UI.toast('Buku dikembalikan tepat waktu. Terima kasih.', 'ok');
        return true;
      }
    });
  });

  gantiTab(modeRiwayat);
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Buka `pages/peminjaman.html` dan periksa:
- Tab "Peminjaman Aktif" menampilkan 11 transaksi dengan bar sisa waktu berwarna teal, amber, dan merah sesuai kondisi
- Saringan "Terlambat" menyisakan hanya transaksi yang lewat jatuh tempo
- "Peminjaman Baru" menolak anggota berstatus Diblokir — Maulana Hakim memang tidak muncul di pilihan, dan memilih anggota yang sudah punya tiga pinjaman memunculkan alasan penolakan
- Mengganti tanggal pinjam otomatis memperbarui jatuh tempo tujuh hari setelahnya
- "Kembalikan" pada transaksi terlambat menampilkan rincian denda yang benar, lalu memindahkan baris ke tab Riwayat dan mengembalikan stok buku
- Menu sidebar "Pengembalian" membuka halaman langsung pada tab Riwayat

Pulihkan data dengan `Store.reset()` setelah pengujian.

- [ ] **Step 5: Commit**

```bash
git add pages/peminjaman.html assets/js/page-peminjaman.js assets/css/style.css
git commit -m "feat: halaman sirkulasi peminjaman dan pengembalian dengan denda otomatis"
```

---

### Task 13: Halaman Form Buku

**Files:**
- Create: `pages/form-buku.html`
- Create: `assets/js/page-form-buku.js`
- Modify: `assets/css/style.css` (tambahkan gaya bagian form dan pratinjau sampul di akhir berkas)

**Interfaces:**
- Consumes: `Store.buku`, `Store.kategori`, `UI.validateForm`, `UI.pasangValidasiBlur`, `UI.rules`
- Produces: menerima parameter kueri `?id=BKxxx` untuk mode ubah; kembali ke `data-buku.html` setelah simpan

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

```css
/* --- Bagian form --- */
.form-bagian { padding: 24px; }
.form-bagian + .form-bagian { border-top: 1px solid var(--glass-border); }
.form-bagian h3 { font-size: 16px; margin-bottom: 4px; }
.form-bagian .keterangan { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
.form-aksi {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 18px 24px; border-top: 1px solid var(--glass-border);
}
@media (max-width: 767px) {
  .form-aksi { flex-direction: column-reverse; }
  .form-aksi .btn { width: 100%; }
  .form-bagian { padding: 18px 16px; }
}

/* --- Pratinjau sampul --- */
.sampul-area { display: flex; align-items: flex-start; gap: 18px; flex-wrap: wrap; }
.sampul-pratinjau {
  width: 108px; height: 150px; flex: none;
  display: grid; place-items: center; overflow: hidden;
  border-radius: 12px; border: 1px dashed var(--glass-border);
  background: var(--glass); color: var(--muted); font-size: 12px; text-align: center; padding: 8px;
}
.sampul-pratinjau img { width: 100%; height: 100%; object-fit: cover; }
```

- [ ] **Step 2: Buat `pages/form-buku.html`**

Salin `pages/layout.html`; `<title>` menjadi `Form Buku — E-Library Universitas Pamulang`, skrip terakhir menjadi `page-form-buku.js`, dan `<main>` diisi:

```html
    <main class="konten">
      <form id="formBuku" class="glass-strong overflow-hidden max-w-4xl" novalidate>

        <div class="form-bagian">
          <h3>Informasi Bibliografi</h3>
          <p class="keterangan">Identitas utama buku sesuai halaman judul dan halaman hak cipta.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="field-label" for="judul">Judul Buku</label>
              <input class="glass-input" id="judul" name="judul" placeholder="Contoh: Algoritma dan Struktur Data">
            </div>
            <div>
              <label class="field-label" for="pengarang">Pengarang</label>
              <input class="glass-input" id="pengarang" name="pengarang" placeholder="Nama penulis utama">
            </div>
            <div>
              <label class="field-label" for="penerbit">Penerbit</label>
              <input class="glass-input" id="penerbit" name="penerbit" placeholder="Nama penerbit">
            </div>
            <div>
              <label class="field-label" for="isbn">ISBN</label>
              <input class="glass-input" id="isbn" name="isbn" inputmode="numeric" placeholder="10 atau 13 digit">
            </div>
            <div>
              <label class="field-label" for="tahunTerbit">Tahun Terbit</label>
              <input class="glass-input" id="tahunTerbit" name="tahunTerbit" inputmode="numeric" placeholder="Contoh: 2022">
            </div>
            <div class="sm:col-span-2">
              <label class="field-label" for="sinopsis">Sinopsis Singkat <span class="text-muted">(opsional)</span></label>
              <textarea class="glass-textarea" id="sinopsis" name="sinopsis" rows="3" placeholder="Ringkasan isi buku dalam beberapa kalimat"></textarea>
            </div>
          </div>
        </div>

        <div class="form-bagian">
          <h3>Klasifikasi dan Lokasi</h3>
          <p class="keterangan">Penempatan buku menurut klasifikasi DDC dan posisi fisiknya di rak.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label" for="idKategori">Kategori</label>
              <select class="glass-select" id="idKategori" name="idKategori"><option value="">Pilih kategori</option></select>
            </div>
            <div>
              <label class="field-label" for="lokasiRak">Lokasi Rak</label>
              <input class="glass-input" id="lokasiRak" name="lokasiRak" placeholder="Contoh: R-07-A">
            </div>
          </div>
        </div>

        <div class="form-bagian">
          <h3>Ketersediaan Stok</h3>
          <p class="keterangan">Jumlah tersedia tidak boleh melebihi jumlah total eksemplar.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label" for="jumlahTotal">Jumlah Total Eksemplar</label>
              <input class="glass-input" id="jumlahTotal" name="jumlahTotal" inputmode="numeric" placeholder="Contoh: 5">
            </div>
            <div>
              <label class="field-label" for="jumlahTersedia">Jumlah Tersedia</label>
              <input class="glass-input" id="jumlahTersedia" name="jumlahTersedia" inputmode="numeric" placeholder="Contoh: 5">
            </div>
          </div>
        </div>

        <div class="form-bagian">
          <h3>Sampul Buku</h3>
          <p class="keterangan">Opsional. Gambar hanya dipratinjau di peramban, tidak diunggah ke server mana pun.</p>
          <div class="sampul-area">
            <div class="sampul-pratinjau" id="pratinjauSampul">Belum ada sampul</div>
            <div class="flex-1 min-w-[200px] space-y-3">
              <input class="glass-input" type="file" id="berkasSampul" accept="image/png,image/jpeg,image/webp">
              <button type="button" class="btn btn-ghost" id="hapusSampul">Hapus Sampul</button>
            </div>
          </div>
        </div>

        <div class="form-aksi">
          <a class="btn btn-ghost" href="data-buku.html">Batal</a>
          <button type="submit" class="btn btn-primary" id="tombolSimpan">Simpan Buku</button>
        </div>

      </form>
    </main>
```

- [ ] **Step 3: Buat `assets/js/page-form-buku.js`**

```js
/* Form tambah dan ubah buku. Mode ditentukan oleh parameter kueri ?id=BKxxx. */
(function () {
  var id = new URLSearchParams(location.search).get('id');
  var buku = id ? Store.init() && Store.buku.find(id) : null;
  var ubah = !!buku;

  if (!Layout.init({
    halaman: 'buku',
    judul: ubah ? 'Ubah Data Buku' : 'Tambah Buku Baru',
    subjudul: ubah ? buku.judul : 'Lengkapi seluruh informasi bibliografi'
  })) return;

  var form = document.getElementById('formBuku');
  var pratinjau = document.getElementById('pratinjauSampul');
  var sampulSaatIni = ubah ? (buku.cover || '') : '';
  var tahunIni = new Date().getFullYear();

  var SKEMA = {
    judul:          [UI.rules.wajib('Judul buku wajib diisi'), UI.rules.minLen(3, 'Judul minimal 3 karakter')],
    pengarang:      [UI.rules.wajib('Nama pengarang wajib diisi')],
    penerbit:       [UI.rules.wajib('Nama penerbit wajib diisi')],
    isbn:           [UI.rules.wajib('ISBN wajib diisi'), UI.rules.isbn('ISBN harus terdiri dari 10 atau 13 digit')],
    tahunTerbit:    [UI.rules.wajib('Tahun terbit wajib diisi'), UI.rules.rentang(1900, tahunIni, 'Tahun terbit harus antara 1900 dan ' + tahunIni)],
    idKategori:     [UI.rules.wajib('Kategori wajib dipilih')],
    lokasiRak:      [UI.rules.wajib('Lokasi rak wajib diisi'), UI.rules.custom(function (v) { return /^R-\d{2}-[A-Z]$/.test(String(v).trim().toUpperCase()); }, 'Format rak: R-00-A, contoh R-07-B')],
    jumlahTotal:    [UI.rules.wajib('Jumlah total wajib diisi'), UI.rules.angkaMin(1, 'Jumlah total minimal 1 eksemplar')],
    jumlahTersedia: [UI.rules.wajib('Jumlah tersedia wajib diisi'), UI.rules.angkaMin(0, 'Jumlah tersedia tidak boleh negatif')]
  };

  // Isi pilihan kategori dari data
  var pilihKategori = document.getElementById('idKategori');
  Store.kategori.all().forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.nama + ' (DDC ' + k.kodeDdc + ')';
    pilihKategori.appendChild(opt);
  });

  function gambarPratinjau(sumber) {
    pratinjau.innerHTML = sumber
      ? '<img src="' + UI.escapeHtml(sumber) + '" alt="Pratinjau sampul">'
      : 'Belum ada sampul';
  }

  // Isi form bila dalam mode ubah
  if (ubah) {
    ['judul', 'pengarang', 'penerbit', 'isbn', 'tahunTerbit', 'idKategori', 'lokasiRak', 'jumlahTotal', 'jumlahTersedia', 'sinopsis']
      .forEach(function (nama) { if (form[nama]) form[nama].value = buku[nama] === undefined ? '' : buku[nama]; });
    document.getElementById('tombolSimpan').textContent = 'Simpan Perubahan';
    gambarPratinjau(sampulSaatIni);
  } else {
    gambarPratinjau('');
    // Untuk buku baru, jumlah tersedia mengikuti jumlah total selama belum disentuh.
    var tersediaDisentuh = false;
    form.jumlahTersedia.addEventListener('input', function () { tersediaDisentuh = true; });
    form.jumlahTotal.addEventListener('input', function () {
      if (!tersediaDisentuh) form.jumlahTersedia.value = form.jumlahTotal.value;
    });
  }

  UI.pasangValidasiBlur(form, SKEMA);

  /* --- Sampul: pratinjau lokal lewat FileReader --- */
  document.getElementById('berkasSampul').addEventListener('change', function (e) {
    var berkas = e.target.files && e.target.files[0];
    if (!berkas) return;
    if (berkas.size > 1024 * 1024) {
      UI.toast('Ukuran gambar melebihi 1 MB. Pilih berkas yang lebih kecil.', 'bad');
      e.target.value = '';
      return;
    }
    var pembaca = new FileReader();
    pembaca.onload = function () { sampulSaatIni = pembaca.result; gambarPratinjau(sampulSaatIni); };
    pembaca.readAsDataURL(berkas);
  });

  document.getElementById('hapusSampul').addEventListener('click', function () {
    sampulSaatIni = '';
    document.getElementById('berkasSampul').value = '';
    gambarPratinjau('');
  });

  /* --- Simpan --- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validateForm(form, SKEMA).valid) return;

    var total = parseInt(form.jumlahTotal.value, 10);
    var tersedia = parseInt(form.jumlahTersedia.value, 10);
    if (tersedia > total) {
      UI.tandaiGalat(form.jumlahTersedia, 'Jumlah tersedia (' + tersedia + ') tidak boleh melebihi jumlah total (' + total + ').');
      form.jumlahTersedia.focus();
      return;
    }

    var isbnBersih = form.isbn.value.replace(/[-\s]/g, '');
    var bentrok = Store.buku.all().find(function (b) {
      return b.isbn.replace(/[-\s]/g, '') === isbnBersih && b.id !== id;
    });
    if (bentrok) {
      UI.tandaiGalat(form.isbn, 'ISBN ini sudah terdaftar untuk "' + bentrok.judul + '".');
      form.isbn.focus();
      return;
    }

    var isi = {
      judul: form.judul.value.trim(),
      pengarang: form.pengarang.value.trim(),
      penerbit: form.penerbit.value.trim(),
      isbn: isbnBersih,
      tahunTerbit: parseInt(form.tahunTerbit.value, 10),
      idKategori: form.idKategori.value,
      lokasiRak: form.lokasiRak.value.trim().toUpperCase(),
      jumlahTotal: total,
      jumlahTersedia: tersedia,
      sinopsis: form.sinopsis.value.trim(),
      cover: sampulSaatIni
    };

    if (ubah) { Store.buku.update(id, isi); UI.toast('Perubahan pada "' + isi.judul + '" tersimpan.', 'ok'); }
    else { Store.buku.create(isi); UI.toast('Buku "' + isi.judul + '" ditambahkan ke koleksi.', 'ok'); }

    setTimeout(function () { window.location.href = 'data-buku.html'; }, 700);
  });
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Buka `pages/form-buku.html` (mode tambah) dan periksa:
- Submit kosong memunculkan sembilan pesan galat sekaligus dan memfokuskan field Judul
- ISBN `123` ditolak; `9786020332123` diterima; `978-602-033-212-3` juga diterima
- Tahun `1899` dan `2030` ditolak; lokasi rak `xyz` ditolak sedangkan `r-09-a` diterima dan disimpan sebagai `R-09-A`
- Mengisi Jumlah Total otomatis mengisi Jumlah Tersedia, dan berhenti mengikuti setelah Jumlah Tersedia disunting sendiri
- Tersedia `9` dengan total `5` ditolak dengan pesan yang menyebut kedua angkanya
- ISBN yang sudah dipakai ditolak dengan menyebut judul pemiliknya
- Memilih gambar menampilkan pratinjau; "Hapus Sampul" mengosongkannya kembali
- Setelah tersimpan, halaman kembali ke Data Buku dan buku baru muncul di tabel

Lalu buka `pages/form-buku.html?id=BK001` (mode ubah) dan periksa bahwa seluruh field terisi, judul topbar berubah menjadi "Ubah Data Buku", dan tombol bertuliskan "Simpan Perubahan".

- [ ] **Step 5: Commit**

```bash
git add pages/form-buku.html assets/js/page-form-buku.js assets/css/style.css
git commit -m "feat: form tambah dan ubah buku dengan validasi dan pratinjau sampul"
```

---

### Task 14: Halaman Laporan dan Stylesheet Cetak

**Files:**
- Create: `pages/laporan.html`
- Create: `assets/js/page-laporan.js`
- Modify: `assets/css/style.css` (tambahkan blok kop laporan dan `@media print` di akhir berkas)

**Interfaces:**
- Consumes: `Store.peminjaman`, `Store.denda`, `Store.rules`, Chart.js
- Produces: keluaran cetak lewat `window.print()` dengan kop institusi

- [ ] **Step 1: Tambahkan gaya ke akhir `assets/css/style.css`**

Blok `@media print` harus berada di paling akhir berkas agar menang atas seluruh aturan sebelumnya.

```css
/* --- Kop laporan (hanya tampil saat dicetak) --- */
.kop-cetak { display: none; }

/* --- Ringkasan laporan --- */
.ringkas-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.ringkas-item { padding: 16px; border-radius: 12px; border: 1px solid var(--glass-border); }
.ringkas-item p:first-child { font-size: 13px; color: var(--muted); }
.ringkas-item p:last-child { font-family: "Plus Jakarta Sans", sans-serif; font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; margin-top: 4px; }

/* ============================================================
   CETAK — seluruh efek glass dimatikan, hasilnya hitam di atas
   putih agar terbaca rapi di kertas.
   ============================================================ */
@media print {
  @page { size: A4 portrait; margin: 16mm; }

  .sidebar, .topbar, .footer-app, .toolbar, .tabel-kaki,
  .btn, .btn-icon, .sidebar-overlay, .toast-wrap, .modal-overlay { display: none !important; }

  html, body, .app-bg, .area-utama, .konten {
    margin: 0 !important; padding: 0 !important;
    background: #fff !important; color: #000 !important;
  }
  .app-shell { display: block !important; }
  .area-utama { margin-left: 0 !important; }

  .glass-card, .glass-panel, .glass-strong, .ringkas-item {
    background: #fff !important;
    border: 1px solid #999 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    page-break-inside: avoid;
  }

  .kop-cetak {
    display: block !important;
    margin-bottom: 16px; padding-bottom: 10px;
    border-bottom: 2px solid #000; text-align: center;
  }
  .kop-cetak h1 { font-size: 16pt; margin: 0; }
  .kop-cetak p { font-size: 10pt; margin: 2px 0 0; color: #000; }

  .tabel { font-size: 9pt; }
  .tabel thead th { background: #eee !important; color: #000 !important; border-bottom: 1px solid #000 !important; }
  .tabel tbody td { border-bottom: 1px solid #ccc !important; color: #000 !important; }
  .tabel tbody tr { page-break-inside: avoid; }

  .badge { border: 1px solid #666 !important; background: transparent !important; color: #000 !important; }
  .badge::before { display: none !important; }
  .chip { background: transparent !important; color: #000 !important; border: 1px solid #999; }
  .text-muted, .stat-label, .stat-catatan { color: #333 !important; }

  /* Tabel tetap berbentuk tabel saat dicetak, bukan mode kartu. */
  .tabel, .tabel thead, .tabel tbody, .tabel tr, .tabel td, .tabel th { display: revert !important; }
  .tabel thead { display: table-header-group !important; }
  .tabel tbody td::before { display: none !important; }
  .tabel tbody td { text-align: left !important; }
}
```

- [ ] **Step 2: Buat `pages/laporan.html`**

Salin `pages/layout.html`; `<title>` menjadi `Laporan Sirkulasi — E-Library Universitas Pamulang`, tambahkan skrip Chart.js seperti pada dashboard, skrip terakhir menjadi `page-laporan.js`, dan `<main>` diisi:

```html
    <main class="konten space-y-6">

      <div class="kop-cetak">
        <h1>LAPORAN SIRKULASI PERPUSTAKAAN</h1>
        <p>Universitas Pamulang</p>
        <p id="kopPeriode"></p>
      </div>

      <section class="glass-panel p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label class="field-label" for="dariTgl">Periode Dari</label>
            <input class="glass-input" type="date" id="dariTgl">
          </div>
          <div>
            <label class="field-label" for="sampaiTgl">Sampai</label>
            <input class="glass-input" type="date" id="sampaiTgl">
          </div>
          <div>
            <label class="field-label" for="jenisLaporan">Jenis Laporan</label>
            <select class="glass-select" id="jenisLaporan">
              <option value="semua">Seluruh Transaksi</option>
              <option value="aktif">Masih Dipinjam</option>
              <option value="kembali">Sudah Dikembalikan</option>
              <option value="denda">Hanya yang Berdenda</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost flex-1" id="tombolSetelUlang">Setel Ulang</button>
            <button class="btn btn-primary flex-1" id="tombolCetak">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
              Cetak
            </button>
          </div>
        </div>
      </section>

      <section class="glass-panel p-6">
        <h3 class="text-lg mb-4">Ringkasan Periode</h3>
        <div class="ringkas-grid" id="ringkasan"></div>
      </section>

      <section class="glass-panel p-6">
        <h3 class="text-lg mb-1">Perbandingan Bulanan</h3>
        <p class="text-muted text-sm mb-4">Peminjaman dan pengembalian per bulan</p>
        <div class="grafik-bungkus"><canvas id="grafikLaporan"></canvas></div>
      </section>

      <section class="glass-strong overflow-hidden">
        <div class="p-6 pb-0"><h3 class="text-lg">Rincian Transaksi</h3></div>
        <div id="tabelLaporan" class="mt-4"></div>
      </section>

    </main>
```

- [ ] **Step 3: Buat `assets/js/page-laporan.js`**

```js
/* Laporan sirkulasi dengan penyaring periode dan keluaran cetak. */
(function () {
  if (!Layout.init({ halaman: 'laporan', judul: 'Laporan Sirkulasi', subjudul: 'Rekap peminjaman, pengembalian, dan denda' })) return;

  var R = Store.rules;
  var grafik = null;
  var dari = document.getElementById('dariTgl');
  var sampai = document.getElementById('sampaiTgl');
  var jenis = document.getElementById('jenisLaporan');

  // Periode baku: 90 hari terakhir sampai hari ini.
  var HARI_INI = R.hariIni();
  function setelUlang() {
    dari.value = R.tambahHari(HARI_INI, -90);
    sampai.value = HARI_INI;
    jenis.value = 'semua';
  }
  setelUlang();

  function dataTersaring() {
    var a = dari.value || '0000-01-01';
    var b = sampai.value || '9999-12-31';
    var pilihan = jenis.value;

    return Store.peminjaman.all()
      .filter(function (p) { return p.tglPinjam >= a && p.tglPinjam <= b; })
      .map(function (p) {
        var ang = Store.anggota.find(p.idAnggota);
        var buk = R.bukuDariPinjam(p.id);
        var den = Store.denda.all().find(function (d) { return d.idPinjam === p.id; });
        return Object.assign({}, p, {
          namaAnggota: ang ? ang.nama : '-',
          judulBuku: buk ? buk.judul : '-',
          nominalDenda: den ? den.nominal : 0,
          kondisi: R.statusPinjam(p, HARI_INI)
        });
      })
      .filter(function (t) {
        if (pilihan === 'aktif') return !t.tglKembali;
        if (pilihan === 'kembali') return !!t.tglKembali;
        if (pilihan === 'denda') return t.nominalDenda > 0;
        return true;
      });
  }

  function renderRingkasan(data) {
    var dikembalikan = data.filter(function (t) { return !!t.tglKembali; });
    var berdenda = data.filter(function (t) { return t.nominalDenda > 0; });
    var totalDenda = berdenda.reduce(function (s, t) { return s + t.nominalDenda; }, 0);

    var ITEM = [
      { label: 'Total Transaksi', nilai: data.length },
      { label: 'Sudah Dikembalikan', nilai: dikembalikan.length },
      { label: 'Masih Dipinjam', nilai: data.length - dikembalikan.length },
      { label: 'Transaksi Berdenda', nilai: berdenda.length },
      { label: 'Total Denda', nilai: UI.formatRupiah(totalDenda) }
    ];

    document.getElementById('ringkasan').innerHTML = ITEM.map(function (i) {
      return '<div class="ringkas-item"><p>' + i.label + '</p><p>' + (typeof i.nilai === 'number' ? i.nilai.toLocaleString('id-ID') : i.nilai) + '</p></div>';
    }).join('');
  }

  function renderGrafik() {
    var tren = Store.tren();
    var warnaTeks = getComputedStyle(document.body).getPropertyValue('--muted').trim();
    var warnaGaris = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.10)';

    if (grafik) grafik.destroy();
    grafik = new Chart(document.getElementById('grafikLaporan'), {
      type: 'bar',
      data: {
        labels: tren.map(function (t) { return t.bulan; }),
        datasets: [
          { label: 'Peminjaman', data: tren.map(function (t) { return t.peminjaman; }), backgroundColor: '#6366F1', borderRadius: 6 },
          { label: 'Pengembalian', data: tren.map(function (t) { return t.pengembalian; }), backgroundColor: '#14B8A6', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: warnaTeks, usePointStyle: true, boxWidth: 8 } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: warnaTeks, maxRotation: 0, autoSkipPadding: 10 } },
          y: { beginAtZero: true, grid: { color: warnaGaris }, ticks: { color: warnaTeks } }
        }
      }
    });
  }

  var KOLOM = [
    { kunci: 'id', label: 'Kode', urut: true, kelas: 'tabular' },
    { kunci: 'namaAnggota', label: 'Peminjam', urut: true },
    { kunci: 'judulBuku', label: 'Buku', urut: true },
    { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.formatTanggal(t.tglPinjam); } },
    { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.formatTanggal(t.tglJatuhTempo); } },
    { kunci: 'tglKembali', label: 'Tgl Kembali', urut: true,
      render: function (t) { return t.tglKembali ? UI.formatTanggal(t.tglKembali) : '<span class="text-muted">Belum kembali</span>'; } },
    { kunci: 'nominalDenda', label: 'Denda', urut: true, kelas: 'kol-angka',
      render: function (t) { return t.nominalDenda > 0 ? UI.formatRupiah(t.nominalDenda) : '<span class="text-muted">&mdash;</span>'; } }
  ];

  var tabel = DataTable.buat({
    mount: document.getElementById('tabelLaporan'),
    kolom: KOLOM,
    baris: [],
    cariPada: ['id', 'namaAnggota', 'judulBuku'],
    perHalaman: 10,
    urutAwal: 'tglPinjam',
    arahAwal: 'turun',
    pesanKosong: 'Tidak ada transaksi pada periode dan jenis laporan yang dipilih.'
  });

  function perbarui() {
    var data = dataTersaring();
    renderRingkasan(data);
    tabel.setBaris(data);
    document.getElementById('kopPeriode').textContent =
      'Periode ' + UI.formatTanggalPanjang(dari.value) + ' sampai ' + UI.formatTanggalPanjang(sampai.value) +
      ' · Dicetak ' + UI.formatTanggalPanjang(HARI_INI);
  }

  [dari, sampai, jenis].forEach(function (el) { el.addEventListener('change', perbarui); });

  document.getElementById('tombolSetelUlang').addEventListener('click', function () { setelUlang(); perbarui(); });
  document.getElementById('tombolCetak').addEventListener('click', function () { window.print(); });
  document.addEventListener('temaberubah', renderGrafik);

  perbarui();
  renderGrafik();
})();
```

- [ ] **Step 4: Verifikasi di peramban**

Buka `pages/laporan.html` dan periksa:
- Periode baku terisi 90 hari terakhir, dan ringkasan menampilkan lima angka yang konsisten satu sama lain
- Mengganti jenis laporan menjadi "Hanya yang Berdenda" menyisakan hanya transaksi dengan nominal denda
- Mempersempit periode mengurangi jumlah transaksi dan seluruh angka ringkasan ikut menyesuaikan
- Grafik batang menampilkan dua seri untuk 12 bulan

Lalu buka pratinjau cetak (Ctrl+P) dan pastikan:
- Sidebar, topbar, toolbar, footer, dan seluruh tombol hilang
- Kop "LAPORAN SIRKULASI PERPUSTAKAAN — Universitas Pamulang" muncul beserta baris periode
- Latar putih, teks hitam, tanpa efek glass
- Tabel tetap berbentuk tabel, bukan mode kartu, meski jendela pratinjau sempit

- [ ] **Step 5: Commit**

```bash
git add pages/laporan.html assets/js/page-laporan.js assets/css/style.css
git commit -m "feat: halaman laporan sirkulasi dengan filter periode dan stylesheet cetak"
```

---

### Task 15: Modal Pengaturan

Melengkapi menu sidebar agar setiap itemnya benar-benar berfungsi, dan memberi jalan memulihkan data demo saat presentasi.

**Files:**
- Create: `assets/js/page-pengaturan.js`
- Modify: `pages/dashboard.html`, `pages/data-buku.html`, `pages/data-anggota.html`, `pages/peminjaman.html`, `pages/form-buku.html`, `pages/laporan.html` — sisipkan `<script src="../assets/js/page-pengaturan.js"></script>` tepat SEBELUM baris `page-*.js` pada masing-masing halaman

**Interfaces:**
- Consumes: event `bukapengaturan` yang dipancarkan `Layout` (Task 7), `Layout.sesi()`, `Store.reset()`
- Produces: tidak ada; murni menanggapi event

- [ ] **Step 1: Buat `assets/js/page-pengaturan.js`**

```js
/* Modal Pengaturan. Dimuat di setiap halaman aplikasi dan hanya menunggu
   event 'bukapengaturan' dari sidebar — tidak perlu halaman tersendiri. */
(function () {
  document.addEventListener('bukapengaturan', function () {
    var petugas = Layout.sesi() || { nama: '-', email: '-', role: '-' };
    var gelap = document.documentElement.classList.contains('dark');

    var isi =
      '<div class="rincian" style="border-top:none;padding-top:0">' +
        '<div><span class="text-muted">Nama petugas</span><span>' + UI.escapeHtml(petugas.nama) + '</span></div>' +
        '<div><span class="text-muted">Surel</span><span>' + UI.escapeHtml(petugas.email) + '</span></div>' +
        '<div><span class="text-muted">Peran</span><span>' + UI.escapeHtml(petugas.role) + '</span></div>' +
      '</div>' +
      '<div style="margin-top:20px">' +
        '<label class="field-label">Mode Tampilan</label>' +
        '<button type="button" class="btn btn-ghost" id="aturTema" style="width:100%">' +
          'Beralih ke Mode ' + (gelap ? 'Terang' : 'Gelap') +
        '</button>' +
      '</div>' +
      '<div style="margin-top:16px">' +
        '<label class="field-label">Data Demo</label>' +
        '<button type="button" class="btn btn-danger" id="aturReset" style="width:100%">Setel Ulang ke Data Awal</button>' +
        '<p class="text-muted" style="font-size:12px;margin-top:8px">Seluruh perubahan yang Anda buat akan dihapus dan data kembali seperti saat aplikasi pertama dibuka.</p>' +
      '</div>';

    var tutup = UI.modal({ judul: 'Pengaturan', isiHtml: isi, batal: 'Tutup' });

    document.getElementById('aturTema').addEventListener('click', function () {
      Layout.toggleTheme();
      tutup();
    });

    document.getElementById('aturReset').addEventListener('click', function () {
      tutup();
      UI.konfirmasi({
        judul: 'Setel Ulang Data Demo',
        pesan: 'Seluruh buku, anggota, dan transaksi yang Anda ubah akan dikembalikan ke kondisi awal. Lanjutkan?',
        konfirmasi: 'Ya, Setel Ulang'
      }).then(function (ya) {
        if (!ya) return;
        Store.reset();
        UI.toast('Data demo telah dipulihkan.', 'ok');
        setTimeout(function () { location.reload(); }, 800);
      });
    });
  });
})();
```

- [ ] **Step 2: Sisipkan skrip di keenam halaman**

Pada setiap berkas di `pages/`, ubah blok skrip penutup menjadi berurutan seperti ini (contoh untuk `dashboard.html`):

```html
<script src="../assets/js/layout.js"></script>
<script src="../assets/js/page-pengaturan.js"></script>
<script src="../assets/js/page-dashboard.js"></script>
```

Urutannya penting: `page-pengaturan.js` hanya memasang listener, sedangkan `page-*.js` memanggil `Layout.init()` yang memasang tombol pemicunya.

- [ ] **Step 3: Verifikasi di peramban**

Pada setiap halaman aplikasi, klik "Pengaturan" di sidebar dan periksa:
- Modal menampilkan nama, surel, dan peran petugas yang sedang masuk
- Tombol mode tampilan membalik tema lalu menutup modal
- "Setel Ulang" memunculkan konfirmasi kedua; menyetujuinya memulihkan data dan memuat ulang halaman
- Setelah menghapus sebuah buku lalu menyetel ulang, buku tersebut kembali ada

- [ ] **Step 4: Commit**

```bash
git add assets/js/page-pengaturan.js pages/
git commit -m "feat: modal pengaturan dengan profil petugas dan setel ulang data demo"
```

---

### Task 16: Dokumentasi Milestone 1 dan README

**Files:**
- Create: `docs/perancangan.md`
- Create: `README.md`

**Interfaces:**
- Consumes: seluruh keputusan yang sudah terwujud di kode
- Produces: keluaran Milestone 1 yang dikumpulkan ke LMS Mentari

- [ ] **Step 1: Buat `docs/perancangan.md`**

Susun dengan urutan bagian berikut. Isi diagramnya disalin apa adanya dari spec agar dokumentasi dan kode tidak pernah berbeda.

1. **Judul dan identitas** — Perancangan Admin Panel Sistem Informasi Perpustakaan Digital, Universitas Pamulang, mata kuliah Pemrograman Web 2, Tugas Ke-1.
2. **Deskripsi sistem** — dua paragraf: apa yang dikelola sistem ini (koleksi, keanggotaan, sirkulasi, denda) dan batasannya (client-side penuh, mock data, tanpa backend).
3. **Hirarki menu** — salin blok kode hirarki dari spec Bagian 5.1, ditambah tabel tiga kolom: Menu · Berkas · Fungsi singkat, satu baris untuk tiap dari tujuh halaman.
4. **Entity Relationship Diagram** — salin blok ```mermaid erDiagram``` dari spec Bagian 5.2 secara utuh.
5. **Alur pengguna** — salin blok ```mermaid flowchart TD``` dari spec Bagian 5.3 secara utuh.
6. **Aturan bisnis** — masa pinjam 7 hari, denda Rp1.000 per hari, maksimal 3 buku per anggota, beserta alasan singkat tiap angka.
7. **Design System** — tabel token warna dari spec Bagian 4.1 (dua mode, lengkap dengan kode HEX), skala tipografi, radius, blur, dan bayangan. Tambahkan catatan bahwa nilai-nilai ini hidup di `assets/js/config.js` sehingga dokumentasi dan kode selalu sinkron.
8. **Komponen reusable** — daftar `.glass-card`, `.glass-panel`, `.glass-strong`, `.btn` beserta variannya, `.badge` beserta variannya, `.chip`, `.glass-input`, dan komponen `DataTable`, masing-masing satu kalimat.
9. **Wireframe** — sertakan ketiga blok berikut apa adanya.

````markdown
### Wireframe 1 — Dashboard (desktop, 1440px)

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ [P] Perpus   │ ☰  Dashboard                          [☀] [AR]           │
│     Digital  ├──────────────────────────────────────────────────────────┤
│     UNPAM    │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│              │ │ Total  │ │Anggota │ │Sedang  │ │Terlam- │              │
│ ▸ Dashboard  │ │Koleksi │ │ Aktif  │ │Dipinjam│ │  bat   │              │
│              │ │   24   │ │   15   │ │   11   │ │    4   │              │
│ MASTER DATA  │ └────────┘ └────────┘ └────────┘ └────────┘              │
│   Data Buku  │ ┌──────────────────────────────┐ ┌─────────────────────┐ │
│   Data Anggt │ │ Tren Sirkulasi (area chart)  │ │ Komposisi Koleksi   │ │
│              │ │                              │ │    (doughnut)       │ │
│ TRANSAKSI    │ │        ╱╲    ╱╲╱             │ │       ◜◝            │ │
│   Peminjaman │ │   ╱╲ ╱   ╲╱                  │ │      ◟  ◞           │ │
│   Pengembln  │ └──────────────────────────────┘ └─────────────────────┘ │
│              │ ┌────────────┐ ┌────────────┐ ┌────────────────────────┐ │
│ LAPORAN      │ │ Aktivitas  │ │ Buku       │ │ Jatuh Tempo            │ │
│   Lap. Sirkl │ │ Terbaru    │ │ Terpopuler │ │ ● Terlambat 5 hari     │ │
│ ───────────  │ │ ● ...      │ │ 1. ▇▇▇▇    │ │ ● Jatuh tempo hari ini │ │
│ Pengaturan   │ │ ● ...      │ │ 2. ▇▇▇     │ │                        │ │
│ Keluar       │ └────────────┘ └────────────┘ └────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Wireframe 2 — Halaman Data Master (Data Buku)

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│  SIDEBAR     │ ☰  Data Buku                          [☀] [AR]           │
│              ├──────────────────────────────────────────────────────────┤
│              │ ┌──────────────────────────────────────────────────────┐ │
│              │ │ 🔍 Cari judul…  │Kategori▾│ │Status▾│   [+ Tambah]   │ │
│              │ ├──────────────────────────────────────────────────────┤ │
│              │ │ JUDUL ↕    │ISBN ↕ │KATEGORI│RAK │STOK ↕│STATUS│AKSI │ │
│              │ ├────────────┼───────┼────────┼────┼──────┼──────┼─────┤ │
│              │ │ ▤ Algoritma│978602…│〈Tekno〉│R-07│ 6/6  │●Ada  │ ✎ 🗑│ │
│              │ │   Rinaldi  │       │        │    │      │      │     │ │
│              │ ├────────────┼───────┼────────┼────┼──────┼──────┼─────┤ │
│              │ │ ▤ Bumi Man.│978602…│〈Sastra〉│R-08│ 8/9 │●Ada  │ ✎ 🗑│ │
│              │ ├──────────────────────────────────────────────────────┤ │
│              │ │ Menampilkan 1–8 dari 24 data      [←][1][2][3][→]    │ │
│              │ └──────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Wireframe 3 — Halaman Form (Form Buku) & Mode Mobile

```
FORM (desktop)                          TABEL → KARTU (mobile, <768px)
┌────────────────────────────────┐      ┌──────────────────────┐
│ Informasi Bibliografi          │      │ ☰  Data Buku    [☀]  │
│ Identitas utama buku…          │      ├──────────────────────┤
│ ┌────────────────────────────┐ │      │ 🔍 Cari…             │
│ │ Judul Buku                 │ │      │ [Kategori▾][Status▾] │
│ └────────────────────────────┘ │      │ [   + Tambah Buku  ] │
│ ┌───────────┐ ┌──────────────┐ │      ├──────────────────────┤
│ │ Pengarang │ │ Penerbit     │ │      │ ╭──────────────────╮ │
│ └───────────┘ └──────────────┘ │      │ │ JUDUL  ▤ Algorit.│ │
│ ┌───────────┐ ┌──────────────┐ │      │ │ ISBN   978602331 │ │
│ │ ISBN      │ │ Tahun Terbit │ │      │ │ KATEG. 〈Teknologi〉│ │
│ └───────────┘ └──────────────┘ │      │ │ RAK    R-07-A    │ │
│ ⚠ ISBN harus 10 atau 13 digit  │      │ │ STOK   6 / 6     │ │
├────────────────────────────────┤      │ │ STATUS ● Tersedia│ │
│ Klasifikasi dan Lokasi         │      │ │ AKSI      ✎  🗑  │ │
│ ┌───────────┐ ┌──────────────┐ │      │ ╰──────────────────╯ │
│ │ Kategori ▾│ │ Lokasi Rak   │ │      │ ╭──────────────────╮ │
│ └───────────┘ └──────────────┘ │      │ │ JUDUL  ▤ Bumi Ma.│ │
├────────────────────────────────┤      │ │ …                │ │
│ Ketersediaan Stok              │      │ ╰──────────────────╯ │
│ ┌───────────┐ ┌──────────────┐ │      └──────────────────────┘
│ │ Total     │ │ Tersedia     │ │
│ └───────────┘ └──────────────┘ │      Tabel BERUBAH BENTUK jadi
├────────────────────────────────┤      kartu berlabel — bukan
│ Sampul Buku                    │      digulir ke samping.
│ ┌────┐  [Pilih berkas]         │
│ │ ▤  │  [Hapus Sampul]         │
│ └────┘                         │
├────────────────────────────────┤
│              [Batal] [Simpan]  │
└────────────────────────────────┘
```
````
10. **Tautan rancangan** — dua baris berikut, untuk diisi sendiri:

```markdown
- **Figma (Design System & High-Fidelity UI):** [LINK FIGMA ANDA]
- **Stitch by Google (Wireframe & User Flow):** [SCREENSHOT STITCH]
```

11. **Catatan design system hidup** — jelaskan bahwa `docs/design-system.html` dapat dibuka di peramban untuk melihat seluruh token dan komponen dalam keadaan jadi, dan dipakai sebagai sumber nilai saat menyusun Figma.

- [ ] **Step 2: Buat `README.md`**

```markdown
# Sistem Informasi Perpustakaan Digital (E-Library)

Admin Panel berbasis Client-Side untuk pengelolaan perpustakaan **Universitas Pamulang**.

Mata Kuliah Pemrograman Web 2 — Tugas Ke-1 (Project-Based Learning).

## Ringkasan

Aplikasi ini adalah back-office perpustakaan yang berjalan sepenuhnya di peramban:
tidak ada server, tidak ada basis data, dan tidak ada proses build. Data disimulasikan
dengan mock data JavaScript yang dipersistensi ke `localStorage`, sehingga operasi
tambah, ubah, dan hapus tetap bertahan setelah halaman dimuat ulang.

Tema visual yang diterapkan adalah **Glassmorphism**, dengan mode gelap sebagai
tampilan baku dan tombol untuk beralih ke mode terang.

## Menjalankan

Aplikasi cukup dibuka lewat server statis apa pun:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080/index.html`.

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
├── pages/                  Tujuh halaman aplikasi
└── tests/runner.html       Pengujian logika, buka di peramban
```

## Pengujian

Buka `http://localhost:8080/tests/runner.html`. Berkas ini menguji logika murni —
CRUD store, perhitungan denda, penyaringan tabel, dan validator — tanpa dependensi
apa pun. Seluruh tes harus berwarna hijau.

## Catatan

`cdn.tailwindcss.com` menampilkan peringatan "not for production" di console peramban.
Peringatan tersebut disengaja: Play CDN dipilih agar proyek dapat dijalankan dan
dikumpulkan tanpa Node.js maupun npm.

## Demo

- **Repositori:** [LINK GITHUB ANDA]
- **Demo langsung:** [LINK VERCEL ANDA]
```

- [ ] **Step 3: Verifikasi rendering Mermaid**

Dorong `docs/perancangan.md` ke GitHub lalu buka berkasnya di antarmuka web GitHub. Kedua diagram Mermaid harus tergambar sebagai diagram, bukan tampil sebagai teks mentah. Bila gagal, periksa bahwa blok kode diawali tepat dengan tiga backtick diikuti kata `mermaid` tanpa spasi.

- [ ] **Step 4: Commit**

```bash
git add docs/perancangan.md README.md
git commit -m "docs: perancangan Milestone 1 dan README proyek"
```

---

### Task 17: Verifikasi Menyeluruh dan Persiapan Pengumpulan

**Files:**
- Modify: berkas mana pun yang gagal pada pemeriksaan di bawah
- Create: `assets/img/favicon.svg`
- Modify: seluruh berkas HTML (tambahkan tautan favicon di `<head>`)

**Interfaces:**
- Consumes: seluruh task sebelumnya
- Produces: proyek yang siap diunggah ke GitHub dan Vercel

- [ ] **Step 1: Buat `assets/img/favicon.svg` dan tautkan di setiap halaman**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#6366F1"/>
  <path d="M20 16h18a6 6 0 0 1 6 6v26H26a6 6 0 0 0-6 6V16z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M20 48a6 6 0 0 1 6-6h18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>
```

Tambahkan pada `<head>` setiap berkas HTML — gunakan `assets/img/favicon.svg` untuk `index.html` dan `../assets/img/favicon.svg` untuk berkas di dalam `pages/` dan `docs/`:

```html
<link rel="icon" type="image/svg+xml" href="../assets/img/favicon.svg">
```

- [ ] **Step 2: Jalankan seluruh tes**

Buka `http://localhost:8080/tests/runner.html`.
Diharapkan: **57 / 57 lulus**. Bila ada yang merah, perbaiki dahulu sebelum melanjutkan.

- [ ] **Step 3: Periksa setiap halaman pada tiga lebar**

Untuk masing-masing dari delapan halaman (`index.html` dan enam berkas di `pages/`, ditambah `docs/design-system.html`), buka Chrome DevTools, aktifkan mode perangkat, lalu periksa pada **375 px**, **768 px**, dan **1440 px**:

- Tidak ada gulir horizontal pada `<body>` di lebar mana pun
- Jarak tepi kiri dan kanan tidak pernah kurang dari 16 px
- Sidebar menjadi laci geser di bawah 1024 px dan dapat ditutup
- Tabel menjadi kartu berlabel di bawah 768 px
- Tidak ada teks yang terpotong atau bertumpuk

Catat setiap kegagalan, perbaiki, lalu ulangi pemeriksaan halaman tersebut.

- [ ] **Step 4: Periksa console setiap halaman**

Buka tiap halaman dan pastikan tab Console hanya berisi peringatan
`cdn.tailwindcss.com should not be used in production`. Galat lain apa pun harus
diperbaiki — terutama 404 aset dan `is not defined` akibat urutan pemuatan skrip yang salah.

- [ ] **Step 5: Uji alur CRUD dari ujung ke ujung**

1. Masuk dengan `admin@unpam.ac.id` / `admin123`
2. Tambah buku baru lewat `form-buku.html`, isi seluruh field dengan benar, simpan
3. Muat ulang `data-buku.html` — buku baru harus masih ada
4. Ubah judulnya lewat tombol ubah, simpan, pastikan tabel menampilkan judul baru
5. Hapus buku tersebut, pastikan modal menyebut judulnya dan barisnya hilang
6. Muat ulang — buku tetap terhapus

- [ ] **Step 6: Uji alur sirkulasi dari ujung ke ujung**

1. Di `peminjaman.html`, catat peminjaman baru untuk anggota yang aktif
2. Periksa `data-buku.html` — stok tersedia buku tersebut berkurang satu
3. Kembali ke `peminjaman.html`, proses pengembalian transaksi `PJ003` (yang sudah terlambat)
4. Pastikan modal menampilkan jumlah hari keterlambatan dan nominal denda yang sesuai
   dengan tarif Rp1.000 per hari
5. Setelah dikonfirmasi, transaksi pindah ke tab Riwayat dengan lencana denda, dan stok
   buku kembali bertambah satu
6. Buka `laporan.html` dengan jenis "Hanya yang Berdenda" — transaksi tadi harus muncul

- [ ] **Step 7: Periksa kontras pada kedua mode**

Di DevTools, pakai pemilih warna pada elemen berikut dalam mode gelap maupun terang, dan
pastikan rasio kontrasnya minimal **4,5:1**:

- Teks isi tabel di atas `.glass-strong`
- Teks `.text-muted` di atas `.glass-panel`
- Teks di dalam `.badge-ok`, `.badge-warn`, dan `.badge-bad`
- Teks putih pada `.btn-primary`

Bila ada yang gagal, pekatkan permukaan glass terkait di `style.css` — jangan menerangkan
warna teksnya, karena itu akan merusak hierarki visual.

- [ ] **Step 8: Periksa navigasi keyboard**

Tekan Tab dari awal halaman dan pastikan seluruh elemen interaktif dapat dijangkau dengan
cincin fokus yang terlihat, modal dapat ditutup dengan Escape, dan fokus kembali ke tombol
pemicunya setelah modal tertutup.

- [ ] **Step 9: Periksa pratinjau cetak laporan**

Buka `laporan.html`, tekan Ctrl+P, dan pastikan keluarannya hitam di atas putih dengan kop
institusi serta tanpa sidebar, tombol, atau efek glass.

- [ ] **Step 10: Commit dan dorong ke GitHub**

```bash
git add -A
git commit -m "feat: favicon dan perbaikan hasil verifikasi menyeluruh"
git branch -M main
git remote add origin https://github.com/omangs007/Project_Pemrograman_web_2-E-Library-.git
git push -u origin main
```

Ganti URL remote dengan repositori Anda sendiri bila berbeda.

- [ ] **Step 11: Deploy ke Vercel**

Di dashboard Vercel, pilih **Add New → Project**, impor repositori tersebut, dan biarkan
seluruh pengaturan build kosong — proyek ini murni statis, jadi Framework Preset diatur ke
**Other** tanpa build command maupun output directory.

Setelah ter-deploy, buka URL-nya dan ulangi Step 5 pada versi daring untuk memastikan tidak
ada tautan aset yang rusak akibat perbedaan huruf besar-kecil pada nama berkas — Windows
tidak membedakannya, sedangkan server Vercel membedakannya.

- [ ] **Step 12: Lengkapi tautan di dokumentasi**

Isi `[LINK GITHUB ANDA]` dan `[LINK VERCEL ANDA]` di `README.md`, serta `[LINK FIGMA ANDA]`
dan `[SCREENSHOT STITCH]` di `docs/perancangan.md`, lalu commit:

```bash
git add README.md docs/perancangan.md
git commit -m "docs: lengkapi tautan repositori, demo, dan rancangan"
git push
```

---

## Catatan untuk Pelaksana

- **Urutan task tidak boleh diacak.** Task 9 sampai 15 bergantung pada `DataTable`, `UI`, dan `Layout` yang dibangun di Task 5 sampai 7.
- **Urutan `<script>` di setiap halaman bersifat wajib:** Chart.js (bila dipakai) → `data.js` → `store.js` → `ui.js` → `table.js` → `layout.js` → `page-pengaturan.js` → `page-*.js`. Menukar urutannya menghasilkan galat `is not defined`.
- **`style.css` selalu dimuat setelah skrip Tailwind CDN.** Bila dibalik, utility Tailwind akan menimpa kelas komponen dan seluruh efek glass hilang.
- **Blok `@media print` harus tetap berada di paling akhir `style.css`.**
- **Jangan menambahkan `@apply` ke `style.css`** dengan alasan apa pun — Play CDN tidak akan memprosesnya dan aturan tersebut diam-diam tidak berlaku.
- Bila data uji menjadi kacau saat pengembangan, jalankan `Store.reset()` di console.

