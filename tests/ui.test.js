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
