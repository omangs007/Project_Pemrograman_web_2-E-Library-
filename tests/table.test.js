var BARIS = [
  { id: 'A', judul: 'Algoritma dan Struktur Data', pengarang: 'Rinaldi', kategori: 'KT007', stok: 6 },
  { id: 'B', judul: 'Bumi Manusia',                pengarang: 'Pramoedya', kategori: 'KT008', stok: 9 },
  { id: 'C', judul: 'Kalkulus Dasar',              pengarang: 'Purcell',  kategori: 'KT006', stok: 10 },
  { id: 'D', judul: 'Basis Data Relasional',       pengarang: 'Fathansyah', kategori: 'KT007', stok: 2 }
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
  eq(h.map(function (r) { return r.stok; }), [2, 6, 9, 10]);
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
