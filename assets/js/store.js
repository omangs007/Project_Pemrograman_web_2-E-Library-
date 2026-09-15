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
    try { localStorage.setItem(KUNCI, JSON.stringify(db)); return true; }
    catch (e) { console.warn('Gagal menyimpan ke localStorage:', e.message); return false; }
  }

  function init() {
    db = baca();
    if (!db) db = Data.buatSeed();
    catatUrutan();
    tulis();
    return db;
  }

  function pastikan() { if (!db) init(); return db; }

  /* Satu tindakan = satu penulisan. Gagal simpan mengembalikan seluruh
     state, termasuk penghitung ID, sehingga percobaan ulang tetap aman.
     Hasil sukses mengikuti mutasi; kegagalan persistensi selalu false. */
  function mutasiDanSimpan(mutasi) {
    var snapshot = JSON.parse(JSON.stringify(pastikan()));
    var hasil;
    try { hasil = mutasi(); }
    catch (e) { db = snapshot; throw e; }
    if (!tulis()) { db = snapshot; return false; }
    return hasil;
  }

  function reset() {
    return mutasiDanSimpan(function () {
      db = Data.buatSeed();
      catatUrutan();
      return db;
    });
  }

  // Mutasi internal tanpa persistensi untuk tindakan yang melibatkan
  // beberapa koleksi, seperti peminjaman dan pengembalian.
  function tambah(nama, obj) {
    var arr = db[nama];
    var baru = Object.assign({}, obj, { id: idBerikutnya(arr, PREFIKS[nama]) });
    arr.push(baru);
    return baru;
  }

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
    return {
      /* Pembacaan mengembalikan salinan agar pemanggil tidak dapat
         mengubah store tanpa melalui update(). */
      all: function () { return pastikan()[nama].map(function (r) { return Object.assign({}, r); }); },
      find: function (id) {
        var hasil = pastikan()[nama].find(function (r) { return r.id === id; });
        return hasil ? Object.assign({}, hasil) : null;
      },
      create: function (obj) {
        return mutasiDanSimpan(function () { return tambah(nama, obj); });
      },
      update: function (id, patch) {
        var arr = pastikan()[nama];
        var i = arr.findIndex(function (r) { return r.id === id; });
        if (i === -1) return null;
        return mutasiDanSimpan(function () {
          arr[i] = Object.assign({}, arr[i], patch, { id: id });
          return arr[i];
        });
      },
      remove: function (id) {
        var arr = pastikan()[nama];
        var i = arr.findIndex(function (r) { return r.id === id; });
        if (i === -1) return false;
        return mutasiDanSimpan(function () {
          catatUrutan();
          arr.splice(i, 1);
          return true;
        });
      }
    };
  }

  /* --- Aturan bisnis sirkulasi ---------------------------------- */
  var MASA_PINJAM_HARI = 7;
  var DENDA_PER_HARI = 1000;
  var MAKS_PINJAM = 3;
  var AMBANG_SEGERA = 2;   // sisa hari yang dianggap "mendekati jatuh tempo"

  function hariIni() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
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

  function jumlahBukuDipinjam(idBuku) {
    var data = pastikan();
    return data.detailPeminjaman.filter(function (d) {
      return d.idBuku === idBuku && data.peminjaman.some(function (p) {
        return p.id === d.idPinjam && !p.tglKembali;
      });
    }).length;
  }

  function bukuDariPinjam(idPinjam) {
    var d = pastikan().detailPeminjaman.find(function (x) { return x.idPinjam === idPinjam; });
    if (!d) return null;
    var b = pastikan().buku.find(function (x) { return x.id === d.idBuku; });
    // Salinan melindungi data buku dari perubahan oleh pemanggil publik.
    return b ? Object.assign({}, b) : null;
  }

  function bolehPinjam(idAnggota, idBuku) {
    var a = pastikan().anggota.find(function (x) { return x.id === idAnggota; });
    if (!a) return { boleh: false, alasan: 'Anggota tidak ditemukan.', field: 'anggota' };
    if (a.status !== 'Aktif') return { boleh: false, alasan: 'Keanggotaan ' + a.nama + ' berstatus ' + a.status + '.', field: 'anggota' };
    if (jumlahPinjamanAktif(idAnggota) >= MAKS_PINJAM) {
      return { boleh: false, alasan: a.nama + ' sudah meminjam ' + MAKS_PINJAM + ' buku (batas maksimal).', field: 'anggota' };
    }
    var b = pastikan().buku.find(function (x) { return x.id === idBuku; });
    if (!b) return { boleh: false, alasan: 'Buku tidak ditemukan.', field: 'buku' };
    if (b.jumlahTersedia < 1) return { boleh: false, alasan: 'Stok "' + b.judul + '" sedang habis.', field: 'buku' };
    return { boleh: true, alasan: '', field: null };
  }

  function catatPeminjaman(opsi) {
    return mutasiDanSimpan(function () {
      var tglPinjam = opsi.tglPinjam || hariIni();
      var pinjam = tambah('peminjaman', {
        idAnggota: opsi.idAnggota,
        idPetugas: opsi.idPetugas || 'PT001',
        tglPinjam: tglPinjam,
        tglJatuhTempo: jatuhTempo(tglPinjam),
        tglKembali: null,
        status: 'Dipinjam'
      });
      tambah('detailPeminjaman', { idPinjam: pinjam.id, idBuku: opsi.idBuku, kondisiKembali: null });
      var b = db.buku.find(function (x) { return x.id === opsi.idBuku; });
      if (b) b.jumlahTersedia = Math.max(0, b.jumlahTersedia - 1);
      return pinjam;
    });
  }

  function prosesPengembalian(idPinjam, tglKembali) {
    var pinjamLama = pastikan().peminjaman.find(function (x) { return x.id === idPinjam; });
    if (!pinjamLama) return { pinjam: null, denda: null };
    if (pinjamLama.tglKembali) {
      var dendaLama = pastikan().denda.find(function (x) { return x.idPinjam === idPinjam; });
      return {
        pinjam: Object.assign({}, pinjamLama),
        denda: dendaLama ? Object.assign({}, dendaLama) : null,
        sudahDikembalikan: true
      };
    }
    return mutasiDanSimpan(function () {
      var tgl = tglKembali || hariIni();
      var pinjam = pinjamLama;
      pinjam.tglKembali = tgl;
      pinjam.status = 'Dikembalikan';

      var d = pastikan().detailPeminjaman.find(function (x) { return x.idPinjam === idPinjam; });
      if (d) { d.kondisiKembali = 'Baik'; }

      // Jalur internal memakai baris asli agar pemulihan stok tersimpan di database.
      var bLive = d ? pastikan().buku.find(function (x) { return x.id === d.idBuku; }) : null;
      if (bLive) bLive.jumlahTersedia = Math.min(bLive.jumlahTotal, bLive.jumlahTersedia + 1);

      var hitung = hitungDenda(pinjam.tglJatuhTempo, tgl);
      if (hitung.hariTerlambat === 0) return { pinjam: pinjam, denda: null };

      var denda = tambah('denda', {
        idPinjam: idPinjam,
        hariTerlambat: hitung.hariTerlambat,
        nominal: hitung.nominal,
        statusBayar: 'Belum Lunas'
      });
      return { pinjam: pinjam, denda: denda };
    });
  }

  return {
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
      jumlahBukuDipinjam: jumlahBukuDipinjam,
      bolehPinjam: bolehPinjam,
      catatPeminjaman: catatPeminjaman,
      prosesPengembalian: prosesPengembalian,
      bukuDariPinjam: bukuDariPinjam
    },
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
      all: function () { return pastikan().kategori.map(function (r) { return Object.assign({}, r); }); },
      find: function (id) {
        var hasil = pastikan().kategori.find(function (r) { return r.id === id; });
        return hasil ? Object.assign({}, hasil) : null;
      }
    },
    petugas: {
      all: function () { return pastikan().petugas.map(function (r) { return Object.assign({}, r); }); },
      find: function (id) {
        var hasil = pastikan().petugas.find(function (r) { return r.id === id; });
        return hasil ? Object.assign({}, hasil) : null;
      }
    },
    tren: function () { return pastikan().trenBulanan.map(function (r) { return Object.assign({}, r); }); }
  };
})();
