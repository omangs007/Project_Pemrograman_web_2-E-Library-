/* Form tambah dan ubah buku. Mode ditentukan oleh parameter kueri ?id=BKxxx. */
(function () {
  var id = new URLSearchParams(location.search).get('id');
  var buku = id ? Store.init() && Store.buku.find(id) : null;
  var ubah = !!buku;

  if (!Layout.init({
    halaman: 'buku',
    judul: ubah ? 'Ubah Data Buku' : 'Tambah Buku Baru',
    subjudul: ubah ? buku.judul : 'Lengkapi seluruh informasi bibliografi'
  })) return;

  var form = document.getElementById('formBuku');
  if (id !== null && !buku) {
    form.innerHTML = '<div class="form-bagian"><h3>Buku tidak ditemukan</h3>' +
      '<p class="keterangan">Data buku tidak tersedia. Kembali ke daftar untuk memilih buku.</p>' +
      '<a class="btn btn-primary" href="data-buku.html">Kembali ke Data Buku</a></div>';
    return;
  }
  var pratinjau = document.getElementById('pratinjauSampul');
  var sampulSaatIni = ubah ? (buku.cover || '') : '';
  var tahunIni = new Date().getFullYear();
  var pembacaAktif = null;
  var menyimpan = false;
  var tombolSimpan = document.getElementById('tombolSimpan');

  var SKEMA = {
    judul:          [UI.rules.wajib('Judul buku wajib diisi'), UI.rules.minLen(3, 'Judul minimal 3 karakter')],
    pengarang:      [UI.rules.wajib('Nama pengarang wajib diisi')],
    penerbit:       [UI.rules.wajib('Nama penerbit wajib diisi')],
    isbn:           [UI.rules.wajib('ISBN wajib diisi'), UI.rules.isbn('ISBN harus terdiri dari 10 atau 13 digit')],
    tahunTerbit:    [UI.rules.wajib('Tahun terbit wajib diisi'), UI.rules.rentang(1900, tahunIni, 'Tahun terbit harus antara 1900 dan ' + tahunIni)],
    idKategori:     [UI.rules.wajib('Kategori wajib dipilih')],
    lokasiRak:      [UI.rules.wajib('Lokasi rak wajib diisi'), UI.rules.custom(function (v) { return /^R-\d{2}-[A-Z]$/.test(String(v).trim().toUpperCase()); }, 'Format rak: R-00-A, contoh R-07-B')],
    jumlahTotal:    [UI.rules.wajib('Jumlah total wajib diisi'), UI.rules.angkaMin(1, 'Jumlah total minimal 1 eksemplar')],
    jumlahTersedia: [UI.rules.wajib('Jumlah tersedia wajib diisi'), UI.rules.angkaMin(0, 'Jumlah tersedia tidak boleh negatif')]
  };

  ['tahunTerbit', 'jumlahTotal', 'jumlahTersedia'].forEach(function (nama) {
    SKEMA[nama].push(UI.rules.custom(function (v) {
      return /^\d+$/.test(String(v).trim()) && Number.isSafeInteger(Number(v));
    }, 'Masukkan bilangan bulat yang valid'));
  });

  // Isi pilihan kategori dari data
  var pilihKategori = document.getElementById('idKategori');
  Store.kategori.all().forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = nilaiTersimpan(k.id);
    opt.textContent = nilaiTersimpan(k.nama + ' (DDC ' + k.kodeDdc + ')');
    pilihKategori.appendChild(opt);
  });

  // Escape before parsing; decode only into a value/text property so literal
  // ampersands and markup survive editing without becoming executable HTML.
  function nilaiTersimpan(nilai) {
    var teks = document.createElement('textarea');
    teks.innerHTML = UI.escapeHtml(nilai);
    return teks.value;
  }

  function gambarPratinjau(sumber) {
    pratinjau.innerHTML = sumber
      ? '<img src="' + UI.escapeHtml(sumber) + '" alt="Pratinjau sampul">'
      : 'Belum ada sampul';
  }

  // Isi form bila dalam mode ubah
  if (ubah) {
    ['judul', 'pengarang', 'penerbit', 'isbn', 'tahunTerbit', 'idKategori', 'lokasiRak', 'jumlahTotal', 'jumlahTersedia', 'sinopsis']
      .forEach(function (nama) { form.elements[nama].value = nilaiTersimpan(buku[nama]); });
    document.getElementById('tombolSimpan').textContent = 'Simpan Perubahan';
    gambarPratinjau(sampulSaatIni);
  } else {
    gambarPratinjau('');
    // Untuk buku baru, jumlah tersedia mengikuti jumlah total selama belum disentuh.
    var tersediaDisentuh = false;
    form.jumlahTersedia.addEventListener('input', function () { tersediaDisentuh = true; });
    form.jumlahTotal.addEventListener('input', function () {
      if (!tersediaDisentuh) form.jumlahTersedia.value = form.jumlahTotal.value;
    });
  }

  UI.pasangValidasiBlur(form, SKEMA);

  /* --- Sampul: pratinjau lokal lewat FileReader --- */
  document.getElementById('berkasSampul').addEventListener('change', function (e) {
    batalkanPembacaan();
    var berkas = e.target.files && e.target.files[0];
    if (!berkas) return;
    if (['image/png', 'image/jpeg', 'image/webp'].indexOf(berkas.type) === -1) {
      UI.toast('Pilih gambar PNG, JPEG, atau WebP.', 'bad');
      e.target.value = '';
      return;
    }
    if (berkas.size > 1024 * 1024) {
      UI.toast('Ukuran gambar melebihi 1 MB. Pilih berkas yang lebih kecil.', 'bad');
      e.target.value = '';
      return;
    }
    var pembaca = new FileReader();
    pembacaAktif = pembaca;
    tombolSimpan.disabled = true;
    pembaca.onload = function () {
      if (pembacaAktif !== pembaca) return;
      sampulSaatIni = pembaca.result;
      gambarPratinjau(sampulSaatIni);
      pembacaAktif = null;
      tombolSimpan.disabled = menyimpan;
    };
    pembaca.onerror = function () {
      if (pembacaAktif !== pembaca) return;
      pembacaAktif = null;
      tombolSimpan.disabled = menyimpan;
      e.target.value = '';
      UI.toast('Gambar gagal dibaca. Silakan pilih kembali.', 'bad');
    };
    pembaca.readAsDataURL(berkas);
  });

  function batalkanPembacaan() {
    var lama = pembacaAktif;
    pembacaAktif = null;
    if (lama && lama.readyState === 1) lama.abort();
    tombolSimpan.disabled = menyimpan;
  }

  document.getElementById('hapusSampul').addEventListener('click', function () {
    batalkanPembacaan();
    sampulSaatIni = '';
    document.getElementById('berkasSampul').value = '';
    gambarPratinjau('');
  });

  /* --- Simpan --- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (menyimpan || pembacaAktif) return;
    if (!UI.validateForm(form, SKEMA).valid) return;

    var total = parseInt(form.jumlahTotal.value, 10);
    var tersedia = parseInt(form.jumlahTersedia.value, 10);
    if (tersedia > total) {
      UI.tandaiGalat(form.jumlahTersedia, 'Jumlah tersedia (' + tersedia + ') tidak boleh melebihi jumlah total (' + total + ').');
      form.jumlahTersedia.focus();
      return;
    }

    var isbnBersih = form.isbn.value.replace(/[-\s]/g, '');
    var bentrok = Store.buku.all().find(function (b) {
      return String(b.isbn || '').replace(/[-\s]/g, '') === isbnBersih && b.id !== id;
    });
    if (bentrok) {
      UI.tandaiGalat(form.isbn, 'ISBN ini sudah terdaftar untuk "' + bentrok.judul + '".');
      form.isbn.focus();
      return;
    }

    var isi = {
      judul: form.judul.value.trim(),
      pengarang: form.pengarang.value.trim(),
      penerbit: form.penerbit.value.trim(),
      isbn: isbnBersih,
      tahunTerbit: parseInt(form.tahunTerbit.value, 10),
      idKategori: form.idKategori.value,
      lokasiRak: form.lokasiRak.value.trim().toUpperCase(),
      jumlahTotal: total,
      jumlahTersedia: tersedia,
      sinopsis: form.sinopsis.value.trim(),
      cover: sampulSaatIni
    };

    if (ubah && !Store.buku.find(id)) {
      UI.toast('Buku tidak ditemukan. Kembali ke Data Buku.', 'bad');
      return;
    }
    menyimpan = true;
    tombolSimpan.disabled = true;
    var bukuBaru;
    if (ubah) Store.buku.update(id, isi);
    else bukuBaru = Store.buku.create(isi);

    if (!Store.simpan()) {
      if (!ubah) Store.buku.remove(bukuBaru.id);
      UI.toast('Gagal menyimpan karena penyimpanan peramban penuh. Sampul berukuran besar kemungkinan penyebabnya. Hapus sampul lalu simpan ulang; biasanya ini menyelesaikan masalah.', 'bad');
      menyimpan = false;
      tombolSimpan.disabled = false;
      return;
    }
    if (ubah) UI.toast('Perubahan pada "' + isi.judul + '" tersimpan.', 'ok');
    else UI.toast('Buku "' + isi.judul + '" ditambahkan ke koleksi.', 'ok');

    setTimeout(function () { window.location.href = 'data-buku.html'; }, 700);
  });
})();
