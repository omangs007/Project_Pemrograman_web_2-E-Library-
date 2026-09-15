/* Halaman Data Anggota. Form tambah/ubah memakai modal, bukan halaman
   terpisah, karena jumlah fieldnya sedikit. */
(function () {
  if (!Layout.init({ halaman: 'anggota', judul: 'Data Anggota', subjudul: 'Kelola keanggotaan perpustakaan' })) return;

  var IKON_UBAH  = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var IKON_HAPUS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  var WARNA_AVATAR = ['#6366F1', '#14B8A6', '#F59E0B', '#F43F5E', '#0EA5E9', '#A78BFA'];

  /* Warna avatar dipilih deterministik dari id agar tidak berubah-ubah
     setiap kali tabel dirender ulang. */
  function warnaAvatar(id) {
    var n = 0;
    for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return WARNA_AVATAR[n % WARNA_AVATAR.length];
  }

  var LENCANA_STATUS = { 'Aktif': 'badge-ok', 'Nonaktif': 'badge-muted', 'Diblokir': 'badge-bad' };

  function siapkanBaris() {
    return Store.anggota.all().map(function (a) {
      return Object.assign({}, a, { pinjamanAktif: Store.rules.jumlahPinjamanAktif(a.id) });
    });
  }

  var KOLOM = [
    { kunci: 'nama', label: 'Anggota', urut: true,
      render: function (a) {
        return '<div class="sel-anggota">' +
                 '<div class="avatar-inisial" style="background:' + warnaAvatar(a.id) + '">' + UI.escapeHtml(UI.inisial(a.nama)) + '</div>' +
                 '<div><div class="nama">' + UI.escapeHtml(a.nama) + '</div>' +
                 '<div class="nim">' + UI.escapeHtml(a.nim) + '</div></div>' +
               '</div>';
      } },
    { kunci: 'jurusan', label: 'Jurusan', urut: true,
      render: function (a) { return UI.escapeHtml(a.jurusan) + '<div class="text-muted" style="font-size:12px">Angkatan ' + UI.escapeHtml(a.angkatan) + '</div>'; } },
    { kunci: 'email', label: 'Surel', urut: true },
    { kunci: 'pinjamanAktif', label: 'Pinjaman', urut: true, kelas: 'kol-angka',
      render: function (a) { return '<span class="tabular">' + UI.escapeHtml(a.pinjamanAktif) + ' / ' + UI.escapeHtml(Store.rules.MAKS_PINJAM) + '</span>'; } },
    { kunci: 'tglDaftar', label: 'Bergabung', urut: true,
      render: function (a) { return UI.escapeHtml(UI.formatTanggal(a.tglDaftar)); } },
    { kunci: 'status', label: 'Status', urut: true,
      render: function (a) { return '<span class="badge ' + (LENCANA_STATUS[a.status] || 'badge-muted') + '">' + UI.escapeHtml(a.status) + '</span>'; } },
    { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
      render: function (a) {
        return '<button class="btn-icon" data-ubah="' + UI.escapeHtml(a.id) + '" title="Ubah" aria-label="Ubah ' + UI.escapeHtml(a.nama) + '">' + IKON_UBAH + '</button>' +
               '<button class="btn-icon" data-hapus="' + UI.escapeHtml(a.id) + '" title="Hapus" aria-label="Hapus ' + UI.escapeHtml(a.nama) + '">' + IKON_HAPUS + '</button>';
      } }
  ];

  var SARINGAN = [
    { kunci: 'jurusan', cocok: function (a, v) { return a.jurusan === v; } },
    { kunci: 'status',  cocok: function (a, v) { return a.status === v; } }
  ];

  var mount = document.getElementById('tabelAnggota');
  var tabel = DataTable.buat({
    mount: mount,
    kolom: KOLOM,
    baris: siapkanBaris(),
    cariPada: ['nama', 'nim', 'email', 'jurusan', 'telepon'],
    saringan: SARINGAN,
    perHalaman: 8,
    urutAwal: 'nama',
    pesanKosong: 'Tidak ada anggota yang cocok dengan pencarian atau saringan.'
  });
  tabel.render();

  var pilihJurusan = document.getElementById('saringJurusan');
  Store.anggota.all()
    .map(function (a) { return a.jurusan; })
    .filter(function (j, i, arr) { return arr.indexOf(j) === i; })
    .sort()
    .forEach(function (j) {
      var opt = document.createElement('option');
      opt.value = j; opt.textContent = j;
      pilihJurusan.appendChild(opt);
    });

  var timer = null;
  document.getElementById('cariAnggota').addEventListener('input', function (e) {
    clearTimeout(timer);
    var nilai = e.target.value;
    timer = setTimeout(function () { tabel.setCari(nilai); }, 220);
  });
  pilihJurusan.addEventListener('change', function (e) { tabel.setSaringan('jurusan', e.target.value); });
  document.getElementById('saringStatusAnggota').addEventListener('change', function (e) { tabel.setSaringan('status', e.target.value); });

  /* --- Modal tambah / ubah --- */
  var SKEMA = {
    nama:    [UI.rules.wajib('Nama wajib diisi'), UI.rules.minLen(3, 'Nama minimal 3 karakter')],
    nim:     [UI.rules.wajib('NIM wajib diisi'), UI.rules.custom(function (v) { return /^\d{9,15}$/.test(String(v).trim()); }, 'NIM harus 9 sampai 15 digit angka')],
    email:   [UI.rules.wajib('Surel wajib diisi'), UI.rules.email('Format surel tidak valid')],
    telepon: [UI.rules.wajib('Nomor telepon wajib diisi'), UI.rules.custom(function (v) { return /^08\d{8,12}$/.test(String(v).trim()); }, 'Nomor harus diawali 08 dan berisi 10 sampai 14 digit')],
    jurusan: [UI.rules.wajib('Jurusan wajib dipilih')],
    angkatan:[UI.rules.wajib('Angkatan wajib diisi'), UI.rules.rentang(2015, new Date().getFullYear(), 'Angkatan harus antara 2015 dan ' + new Date().getFullYear()), UI.rules.custom(function (v) {
      return /^\d+$/.test(String(v).trim()) && Number.isSafeInteger(Number(v));
    }, 'Masukkan bilangan bulat yang valid')]
  };

  var JURUSAN = ['Teknik Informatika', 'Manajemen', 'Akuntansi', 'Ilmu Hukum', 'Sastra Inggris', 'Teknik Industri'];

  function htmlForm(a) {
    function opsi(daftar, terpilih) {
      return daftar.map(function (x) {
        return '<option value="' + UI.escapeHtml(x) + '"' + (x === terpilih ? ' selected' : '') + '>' + UI.escapeHtml(x) + '</option>';
      }).join('');
    }
    return '<form id="formAnggota" class="space-y-4" novalidate>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
        '<div><label class="field-label" for="fNama">Nama Lengkap</label><input class="glass-input" id="fNama" name="nama" value="' + UI.escapeHtml(a.nama || '') + '"></div>' +
        '<div><label class="field-label" for="fNim">NIM</label><input class="glass-input" id="fNim" name="nim" inputmode="numeric" value="' + UI.escapeHtml(a.nim || '') + '"></div>' +
        '<div><label class="field-label" for="fEmail">Surel</label><input class="glass-input" id="fEmail" name="email" type="email" value="' + UI.escapeHtml(a.email || '') + '"></div>' +
        '<div><label class="field-label" for="fTelepon">Telepon</label><input class="glass-input" id="fTelepon" name="telepon" inputmode="tel" value="' + UI.escapeHtml(a.telepon || '') + '"></div>' +
        '<div><label class="field-label" for="fJurusan">Jurusan</label><select class="glass-select" id="fJurusan" name="jurusan"><option value="">Pilih jurusan</option>' + opsi(JURUSAN, a.jurusan) + '</select></div>' +
        '<div><label class="field-label" for="fAngkatan">Angkatan</label><input class="glass-input" id="fAngkatan" name="angkatan" inputmode="numeric" value="' + UI.escapeHtml(a.angkatan || '') + '"></div>' +
        '<div class="sm:col-span-2"><label class="field-label" for="fStatus">Status Keanggotaan</label><select class="glass-select" id="fStatus" name="status">' + opsi(['Aktif', 'Nonaktif', 'Diblokir'], a.status || 'Aktif') + '</select></div>' +
      '</div></form>';
  }

  function bukaForm(a) {
    var ubah = !!a.id;
    UI.modal({
      judul: ubah ? 'Ubah Data Anggota' : 'Tambah Anggota Baru',
      isiHtml: htmlForm(a),
      konfirmasi: ubah ? 'Simpan Perubahan' : 'Simpan Anggota',
      lebar: true,
      onKonfirmasi: function () {
        var form = document.getElementById('formAnggota');
        if (!UI.validateForm(form, SKEMA).valid) return false;   // tahan modal tetap terbuka

        var isi = {
          nama: form.nama.value.trim(),
          nim: form.nim.value.trim(),
          email: form.email.value.trim(),
          telepon: form.telepon.value.trim(),
          jurusan: form.jurusan.value,
          angkatan: Number(form.angkatan.value),
          status: form.status.value
        };

        var bentrok = Store.anggota.all().find(function (x) { return x.nim === isi.nim && x.id !== a.id; });
        if (bentrok) { UI.tandaiGalat(form.nim, 'NIM ini sudah terdaftar atas nama ' + bentrok.nama + '.'); return false; }

        if (!ubah) isi.tglDaftar = Store.rules.hariIni();
        var hasil = ubah ? Store.anggota.update(a.id, isi) : Store.anggota.create(isi);
        if (!hasil) {
          UI.toast('Data anggota gagal disimpan. Data mungkin sudah tidak tersedia atau penyimpanan peramban tidak dapat ditulis. Silakan coba lagi.', 'bad');
          return false;
        }
        if (ubah) UI.toast('Data ' + isi.nama + ' diperbarui.', 'ok');
        else UI.toast('Anggota ' + isi.nama + ' ditambahkan.', 'ok');

        tabel.setBaris(siapkanBaris());
        return true;
      }
    });
    UI.pasangValidasiBlur(document.getElementById('formAnggota'), SKEMA);
  }

  document.getElementById('tombolTambahAnggota').addEventListener('click', function () { bukaForm({}); });

  mount.addEventListener('click', function (e) {
    var ubah = e.target.closest && e.target.closest('[data-ubah]');
    if (ubah) { bukaForm(Store.anggota.find(ubah.getAttribute('data-ubah')) || {}); return; }

    var hapus = e.target.closest && e.target.closest('[data-hapus]');
    if (!hapus) return;
    var id = hapus.getAttribute('data-hapus');
    var a = Store.anggota.find(id);
    if (!a) return;

    var aktif = Store.rules.jumlahPinjamanAktif(id);
    if (aktif > 0) {
      UI.toast(a.nama + ' masih memiliki ' + aktif + ' pinjaman aktif dan tidak dapat dihapus.', 'bad');
      return;
    }

    var riwayat = Store.peminjaman.all().filter(function (p) { return p.idAnggota === id; }).length;
    if (riwayat > 0) {
      UI.toast(a.nama + ' masih tercatat pada ' + riwayat + ' transaksi riwayat sehingga tidak dapat dihapus.', 'bad');
      return;
    }

    UI.modal({
      judul: 'Hapus Anggota',
      isiHtml: '<p>' + UI.escapeHtml('Hapus data ' + a.nama + ' (' + a.nim + ') dari daftar anggota? Tindakan ini tidak dapat dibatalkan.') + '</p>',
      konfirmasi: 'Ya, Hapus',
      nada: 'bad',
      onKonfirmasi: function () {
        if (!Store.anggota.remove(id)) {
          UI.toast('Anggota gagal dihapus. Data mungkin sudah tidak tersedia atau penyimpanan peramban tidak dapat ditulis. Silakan coba lagi.', 'bad');
          return false;
        }
        tabel.setBaris(siapkanBaris());
        UI.toast('Anggota ' + a.nama + ' telah dihapus.', 'ok');
        return true;
      }
    });
  });
})();
