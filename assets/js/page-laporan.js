/* Laporan sirkulasi dengan penyaring periode dan keluaran cetak. */
(function () {
  if (!Layout.init({ halaman: 'laporan', judul: 'Laporan Sirkulasi', subjudul: 'Rekap peminjaman, pengembalian, dan denda' })) return;

  var R = Store.rules;
  var grafik = null;
  var dari = document.getElementById('dariTgl');
  var sampai = document.getElementById('sampaiTgl');
  var jenis = document.getElementById('jenisLaporan');
  var PER_HALAMAN = 10;

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
      var nilai = typeof i.nilai === 'number' ? i.nilai.toLocaleString('id-ID') : i.nilai;
      return '<div class="ringkas-item"><p>' + UI.escapeHtml(i.label) + '</p><p>' + UI.escapeHtml(nilai) + '</p></div>';
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
    { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglPinjam)); } },
    { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglJatuhTempo)); } },
    { kunci: 'tglKembali', label: 'Tgl Kembali', urut: true,
      render: function (t) { return t.tglKembali ? UI.escapeHtml(UI.formatTanggal(t.tglKembali)) : '<span class="text-muted">Belum kembali</span>'; } },
    { kunci: 'nominalDenda', label: 'Denda', urut: true, kelas: 'kol-angka',
      render: function (t) { return t.nominalDenda > 0 ? UI.escapeHtml(UI.formatRupiah(t.nominalDenda)) : '<span class="text-muted">&mdash;</span>'; } }
  ];

  var tabel = DataTable.buat({
    mount: document.getElementById('tabelLaporan'),
    kolom: KOLOM,
    baris: [],
    cariPada: ['id', 'namaAnggota', 'judulBuku'],
    perHalaman: PER_HALAMAN,
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
  window.addEventListener('beforeprint', function () { tabel.setPerHalaman(Math.max(1, tabel.barisTampil().length)); });
  window.addEventListener('afterprint', function () { tabel.setPerHalaman(PER_HALAMAN); });
  document.addEventListener('temaberubah', renderGrafik);

  perbarui();
  renderGrafik();
})();
