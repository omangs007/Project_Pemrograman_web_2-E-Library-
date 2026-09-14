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
  Store.buku.remove('BK025');
  Store.init();
  eq(Store.buku.create({ judul: 'Pengganti' }).id, 'BK026');
  Store.buku.all().forEach(function (b) { Store.buku.remove(b.id); });
  Store.init();
  eq(Store.buku.create({ judul: 'Koleksi Baru' }).id, 'BK027');
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
