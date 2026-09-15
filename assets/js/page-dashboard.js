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
               '<p class="stat-value">' + UI.escapeHtml(k.nilai.toLocaleString('id-ID')) + '</p>' +
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
               '<p class="waktu">' + UI.escapeHtml(UI.formatTanggal(p.tglKembali || p.tglPinjam)) + '</p>' +
             '</li>';
    }).join('') || '<li class="text-muted text-sm">Belum ada aktivitas peminjaman.</li>';
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
                 '<span class="text-sm text-muted tabular">' + UI.escapeHtml(x.jumlah) + 'x</span>' +
               '</div>' +
               '<div class="peringkat-bar"><span style="width:' + UI.escapeHtml(Math.round(x.jumlah / maks * 100)) + '%"></span></div>' +
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
                 '<span class="badge ' + kelas + '">' + UI.escapeHtml(teks) + '</span>' +
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

  window.PageDashboard = { render: render };

  render();

  // Warna grafik tidak ikut berubah sendiri saat tema diganti — render ulang.
  document.addEventListener('temaberubah', function () { renderGrafikTren(); renderGrafikKategori(); });
})();
