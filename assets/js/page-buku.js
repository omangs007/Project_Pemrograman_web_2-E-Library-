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
      render: function (b) { return '<span class="tabular">' + UI.escapeHtml(b.jumlahTersedia) + ' / ' + UI.escapeHtml(b.jumlahTotal) + '</span>'; } },
    { kunci: 'status', label: 'Status', ambil: function (b) { return statusStok(b).teks; },
      render: function (b) { var s = statusStok(b); return '<span class="badge ' + s.kelas + '">' + s.teks + '</span>'; } },
    { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
      render: function (b) {
        return '<a class="btn-icon" href="form-buku.html?id=' + UI.escapeHtml(b.id) + '" title="Ubah" aria-label="Ubah ' + UI.escapeHtml(b.judul) + '">' + IKON_UBAH + '</a>' +
               '<button class="btn-icon" data-hapus="' + UI.escapeHtml(b.id) + '" title="Hapus" aria-label="Hapus ' + UI.escapeHtml(b.judul) + '">' + IKON_HAPUS + '</button>';
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

    var sedangDipinjam = Store.rules.jumlahBukuDipinjam(id);
    if (sedangDipinjam > 0) {
      UI.toast('"' + buku.judul + '" masih dipinjam sebanyak ' + sedangDipinjam + ' eksemplar dan tidak dapat dihapus.', 'bad');
      return;
    }

    var detail = Store.detail.all();
    var riwayat = Store.peminjaman.all().filter(function (p) {
      return detail.some(function (d) { return d.idPinjam === p.id && d.idBuku === id; });
    }).length;
    if (riwayat > 0) {
      UI.toast('"' + buku.judul + '" masih tercatat pada ' + riwayat + ' transaksi riwayat sehingga tidak dapat dihapus.', 'bad');
      return;
    }

    UI.modal({
      judul: 'Hapus Buku',
      isiHtml: '<p>' + UI.escapeHtml('Hapus "' + buku.judul + '" karya ' + buku.pengarang + ' dari koleksi? Tindakan ini tidak dapat dibatalkan.') + '</p>',
      konfirmasi: 'Ya, Hapus',
      nada: 'bad',
      onKonfirmasi: function () {
        if (!Store.buku.remove(id)) {
          UI.toast('Buku gagal dihapus. Data mungkin sudah tidak tersedia atau penyimpanan peramban tidak dapat ditulis. Silakan coba lagi.', 'bad');
          return false;
        }
        tabel.setBaris(siapkanBaris());
        UI.toast('Buku "' + buku.judul + '" telah dihapus.', 'ok');
        return true;
      }
    });
  });
})();
