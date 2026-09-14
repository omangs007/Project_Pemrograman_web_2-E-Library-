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

test('bukuDariPinjam mengembalikan salinan yang tidak dapat mengubah stok store', function () {
  Store.reset();
  var sebelum = Store.buku.find('BK003').jumlahTersedia;
  var buku = R().bukuDariPinjam('PJ001');
  buku.jumlahTersedia = sebelum + 100;
  eq(Store.buku.find('BK003').jumlahTersedia, sebelum);
});
