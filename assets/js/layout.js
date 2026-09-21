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
    { grup: 'Laporan', item: [{ id: 'laporan', label: 'Laporan Sirkulasi', href: 'laporan.html', ikon: 'laporan' }] },
    { grup: null, pisah: true, item: [
      { id: 'pengaturan', label: 'Pengaturan', href: '#', ikon: 'atur', elemen: 'menuPengaturan' },
      { id: 'keluar', label: 'Keluar', href: '#', ikon: 'keluar', elemen: 'menuKeluar' }
    ] }
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
    try {
      var v = JSON.parse(localStorage.getItem(KEY_SESI) || 'null');
      if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.nama !== 'string') return null;
      return v;
    } catch (e) {
      return null;
    }
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
      var judul = g.grup ? '<p class="nav-judul">' + UI.escapeHtml(g.grup) + '</p>' : '';
      if (g.pisah) judul = '<div class="nav-pisah"></div>' + judul;
      var item = g.item.map(function (m) {
        var aktif = m.id === halamanAktif ? ' aktif' : '';
        return '<a class="nav-item' + aktif + '" data-menu="' + UI.escapeHtml(m.id) + '"' +
          ' href="' + UI.escapeHtml(m.href) + '"' +
          (m.elemen ? ' id="' + UI.escapeHtml(m.elemen) + '"' : '') +
          (aktif ? ' aria-current="page"' : '') + '>' + IKON[m.ikon] +
          '<span>' + UI.escapeHtml(m.label) + '</span></a>';
      }).join('');
      return judul + item;
    }).join('');

    return '<div class="sidebar-merek">' +
             '<img class="sidebar-logo" src="../assets/img/logo-unpam.png" alt="Lambang Universitas Pamulang" width="40" height="40">' +
             '<div><h1>Perpustakaan Digital</h1><p>Universitas Pamulang</p></div>' +
           '</div><nav aria-label="Menu utama">' + grup + '</nav>';
  }

  function htmlTopbar(judul, subjudul, petugas) {
    return '<button type="button" class="btn-icon tombol-menu" id="tombolMenu" aria-label="Buka menu" aria-controls="sidebar" aria-expanded="false">' +
             '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
           '</button>' +
           '<div><h2>' + UI.escapeHtml(judul) + '</h2><p>' + UI.escapeHtml(subjudul || '') + '</p></div>' +
           '<div class="topbar-kanan">' +
             '<button type="button" class="btn-icon" id="tombolTema" aria-label="Ganti mode terang atau gelap">' +
               '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
             '</button>' +
             '<div class="avatar" title="' + UI.escapeHtml(petugas.nama) + '">' + UI.escapeHtml(UI.inisial(petugas.nama)) + '</div>' +
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

  /* Item aktif dapat berpindah tanpa pindah halaman: Sirkulasi memuat tab
     Peminjaman Aktif dan Riwayat Pengembalian, yang di sidebar berdiri sebagai
     dua entri terpisah. Tanpa ini, membuka Pengembalian menyorot Peminjaman. */
  function setAktif(halamanAktif) {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    Array.prototype.forEach.call(sidebar.querySelectorAll('.nav-item'), function (a) {
      var cocok = a.getAttribute('data-menu') === halamanAktif;
      a.classList.toggle('aktif', cocok);
      if (cocok) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
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
    init: init,
    setAktif: setAktif
  };
})();
