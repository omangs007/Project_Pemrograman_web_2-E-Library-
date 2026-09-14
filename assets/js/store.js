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
    if (!db) db = Data.buatSeed();
    catatUrutan();
    tulis();
    return db;
  }

  function pastikan() { if (!db) init(); return db; }

  function reset() { db = Data.buatSeed(); catatUrutan(); tulis(); return db; }

  /* Nomor urut berikutnya dihitung dari id tertinggi yang ada,
     bukan dari panjang array — menghapus baris tidak boleh
     menyebabkan id terpakai ulang. */
  function idTertinggi(koleksi, prefiks) {
    var tertinggi = 0;
    koleksi.forEach(function (r) {
      var n = parseInt(String(r.id).replace(prefiks, ''), 10);
      if (!isNaN(n) && n > tertinggi) tertinggi = n;
    });
    return tertinggi;
  }

  /* Simpan nomor tertinggi agar penghapusan id terakhir, termasuk
     seluruh koleksi, tidak mengulang id setelah pemuatan ulang.
     Reset sengaja memulai database baru dari seed. */
  function catatUrutan() {
    if (!db.urutanId) db.urutanId = {};
    Object.keys(PREFIKS).forEach(function (nama) {
      var prefiks = PREFIKS[nama];
      db.urutanId[prefiks] = Math.max(db.urutanId[prefiks] || 0, idTertinggi(db[nama], prefiks));
    });
  }

  function idBerikutnya(koleksi, prefiks) {
    var berikutnya = Math.max(db.urutanId[prefiks] || 0, idTertinggi(koleksi, prefiks)) + 1;
    db.urutanId[prefiks] = berikutnya;
    return prefiks + String(berikutnya).padStart(3, '0');
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
        catatUrutan();
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
