/* Sirkulasi: peminjaman aktif dan riwayat pengembalian dalam satu halaman.
   Keduanya beroperasi pada entitas yang sama, sehingga memisahkannya ke dua
   halaman hanya memperlambat kerja pustakawan. */
(function () {
  // Evaluasi aturan dan tes Node tidak membutuhkan DOM halaman.
  if (typeof document === 'undefined') return;
  if (!Layout.init({ halaman: 'peminjaman', judul: 'Transaksi Sirkulasi', subjudul: 'Peminjaman dan pengembalian buku' })) return;

  var R = Store.rules;
  var mount = document.getElementById('panelTransaksi');
  var tabAktif = document.getElementById('tabAktif');
  var tabRiwayat = document.getElementById('tabRiwayat');
  var saringKondisi = document.getElementById('saringKondisi');
  var modeRiwayat = location.hash === '#riwayat';
  var tabel = null;

  function siapkanBaris() {
    var hari = R.hariIni();
    return Store.peminjaman.all()
      .filter(function (p) { return modeRiwayat ? !!p.tglKembali : !p.tglKembali; })
      .map(function (p) {
        var a = Store.anggota.find(p.idAnggota);
        var b = R.bukuDariPinjam(p.id);
        var d = Store.denda.all().find(function (x) { return x.idPinjam === p.id; });
        return Object.assign({}, p, {
          namaAnggota: a ? a.nama : '-',
          nimAnggota: a ? a.nim : '-',
          judulBuku: b ? b.judul : '-',
          kondisi: R.statusPinjam(p, hari),
          sisa: R.sisaHari(p.tglJatuhTempo, hari),
          nominalDenda: d ? d.nominal : 0
        });
      });
  }

  function selSisaWaktu(t) {
    if (t.kondisi === 'Terlambat') {
      return '<div class="sisa-waktu"><span class="sisa-teks" style="color:#F43F5E">Terlambat ' + UI.escapeHtml(Math.abs(t.sisa)) + ' hari</span>' +
             '<div class="sisa-bar sisa-terlambat"><span style="width:100%"></span></div></div>';
    }
    var persen = Math.min(100, Math.max(6, Math.round(t.sisa / R.MASA_PINJAM_HARI * 100)));
    var kelas = t.kondisi === 'Segera' ? 'sisa-segera' : 'sisa-aman';
    var warna = t.kondisi === 'Segera' ? '#F59E0B' : '#14B8A6';
    var teks = t.sisa === 0 ? 'Jatuh tempo hari ini' : 'Sisa ' + t.sisa + ' hari';
    return '<div class="sisa-waktu"><span class="sisa-teks" style="color:' + UI.escapeHtml(warna) + '">' + UI.escapeHtml(teks) + '</span>' +
           '<div class="sisa-bar ' + UI.escapeHtml(kelas) + '"><span style="width:' + UI.escapeHtml(persen) + '%"></span></div></div>';
  }

  function kolomAktif() {
    return [
      { kunci: 'id', label: 'Kode', urut: true, kelas: 'tabular' },
      { kunci: 'namaAnggota', label: 'Peminjam', urut: true,
        render: function (t) { return '<div class="nama" style="font-weight:600">' + UI.escapeHtml(t.namaAnggota) + '</div><div class="nim text-muted" style="font-size:12px">' + UI.escapeHtml(t.nimAnggota) + '</div>'; } },
      { kunci: 'judulBuku', label: 'Buku', urut: true },
      { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglPinjam)); } },
      { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglJatuhTempo)); } },
      { kunci: 'sisa', label: 'Sisa Waktu', urut: true, render: selSisaWaktu },
      { kunci: 'aksi', label: 'Aksi', kelas: 'kol-aksi',
        render: function (t) { return '<button class="btn btn-ghost" data-kembali="' + UI.escapeHtml(t.id) + '">Kembalikan</button>'; } }
    ];
  }

  function kolomRiwayat() {
    return [
      { kunci: 'id', label: 'Kode', urut: true, kelas: 'tabular' },
      { kunci: 'namaAnggota', label: 'Peminjam', urut: true },
      { kunci: 'judulBuku', label: 'Buku', urut: true },
      { kunci: 'tglPinjam', label: 'Tgl Pinjam', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglPinjam)); } },
      { kunci: 'tglJatuhTempo', label: 'Jatuh Tempo', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglJatuhTempo)); } },
      { kunci: 'tglKembali', label: 'Tgl Kembali', urut: true, render: function (t) { return UI.escapeHtml(UI.formatTanggal(t.tglKembali)); } },
      { kunci: 'nominalDenda', label: 'Denda', urut: true, kelas: 'kol-angka',
        render: function (t) {
          return t.nominalDenda > 0
            ? '<span class="badge badge-bad">' + UI.escapeHtml(UI.formatRupiah(t.nominalDenda)) + '</span>'
            : '<span class="text-muted">&mdash;</span>';
        } }
    ];
  }

  var SARINGAN = [{ kunci: 'kondisi', cocok: function (t, v) { return t.kondisi === v; } }];

  function bangunTabel() {
    // Wadah baru membuang listener internal DataTable dari tabel sebelumnya.
    mount.innerHTML = '';
    var wadahTabel = document.createElement('div');
    mount.appendChild(wadahTabel);
    tabel = DataTable.buat({
      mount: wadahTabel,
      kolom: modeRiwayat ? kolomRiwayat() : kolomAktif(),
      baris: siapkanBaris(),
      cariPada: ['id', 'namaAnggota', 'nimAnggota', 'judulBuku'],
      saringan: modeRiwayat ? [] : SARINGAN,
      perHalaman: 8,
      urutAwal: modeRiwayat ? 'tglKembali' : 'sisa',
      arahAwal: modeRiwayat ? 'turun' : 'naik',
      pesanKosong: modeRiwayat ? 'Belum ada pengembalian yang tercatat.' : 'Tidak ada peminjaman aktif yang cocok.'
    });
    tabel.render();
  }

  function gantiTab(keRiwayat) {
    clearTimeout(timer);
    modeRiwayat = keRiwayat;
    tabAktif.setAttribute('aria-selected', String(!keRiwayat));
    tabRiwayat.setAttribute('aria-selected', String(keRiwayat));
    tabAktif.tabIndex = keRiwayat ? -1 : 0;
    tabRiwayat.tabIndex = keRiwayat ? 0 : -1;
    mount.setAttribute('aria-labelledby', keRiwayat ? 'tabRiwayat' : 'tabAktif');
    saringKondisi.value = '';
    saringKondisi.style.display = keRiwayat ? 'none' : '';
    document.getElementById('cariTransaksi').value = '';
    bangunTabel();
  }

  tabAktif.addEventListener('click', function () { location.hash = ''; gantiTab(false); });
  tabRiwayat.addEventListener('click', function () { location.hash = 'riwayat'; gantiTab(true); });
  window.addEventListener('hashchange', function () {
    var riwayat = location.hash === '#riwayat';
    if (riwayat !== modeRiwayat) gantiTab(riwayat);
  });
  [tabAktif, tabRiwayat].forEach(function (tab) {
    tab.addEventListener('keydown', function (e) {
      var tujuan;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') tujuan = tab === tabAktif ? tabRiwayat : tabAktif;
      else if (e.key === 'Home') tujuan = tabAktif;
      else if (e.key === 'End') tujuan = tabRiwayat;
      else return;
      e.preventDefault();
      tujuan.click();
      tujuan.focus();
    });
  });

  var timer = null;
  document.getElementById('cariTransaksi').addEventListener('input', function (e) {
    clearTimeout(timer);
    var nilai = e.target.value;
    timer = setTimeout(function () { tabel.setCari(nilai); }, 220);
  });
  saringKondisi.addEventListener('change', function (e) { tabel.setSaringan('kondisi', e.target.value); });

  /* --- Modal peminjaman baru --- */
  function htmlFormPinjam() {
    var anggota = Store.anggota.all().filter(function (a) { return a.status === 'Aktif'; })
      .sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    var buku = Store.buku.all().filter(function (b) { return b.jumlahTersedia > 0; })
      .sort(function (a, b) { return a.judul.localeCompare(b.judul, 'id'); });

    return '<form id="formPinjam" class="space-y-4" novalidate>' +
      '<div><label class="field-label" for="pAnggota">Anggota Peminjam</label>' +
        '<select class="glass-select" id="pAnggota" name="idAnggota"><option value="">Pilih anggota</option>' +
        anggota.map(function (a) { return '<option value="' + UI.escapeHtml(a.id) + '">' + UI.escapeHtml(a.nama + ' — ' + a.nim) + '</option>'; }).join('') +
        '</select></div>' +
      '<div><label class="field-label" for="pBuku">Buku yang Dipinjam</label>' +
        '<select class="glass-select" id="pBuku" name="idBuku"><option value="">Pilih buku</option>' +
        buku.map(function (b) { return '<option value="' + UI.escapeHtml(b.id) + '">' + UI.escapeHtml(b.judul) + ' (tersedia ' + UI.escapeHtml(b.jumlahTersedia) + ')</option>'; }).join('') +
        '</select></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
        '<div><label class="field-label" for="pTanggal">Tanggal Pinjam</label>' +
          '<input class="glass-input" type="date" id="pTanggal" name="tglPinjam" value="' + UI.escapeHtml(R.hariIni()) + '"></div>' +
        '<div><label class="field-label" for="pTempo">Jatuh Tempo (otomatis)</label>' +
          '<input class="glass-input" type="date" id="pTempo" value="' + UI.escapeHtml(R.jatuhTempo(R.hariIni())) + '" readonly tabindex="-1"></div>' +
      '</div>' +
      '<p class="text-muted" style="font-size:12px">Masa pinjam ' + UI.escapeHtml(R.MASA_PINJAM_HARI) + ' hari. Keterlambatan dikenakan denda ' + UI.escapeHtml(UI.formatRupiah(R.DENDA_PER_HARI)) + ' per hari.</p>' +
    '</form>';
  }

  document.getElementById('tombolPinjamBaru').addEventListener('click', function () {
    UI.modal({
      judul: 'Peminjaman Baru',
      isiHtml: htmlFormPinjam(),
      konfirmasi: 'Catat Peminjaman',
      lebar: true,
      onKonfirmasi: function () {
        var form = document.getElementById('formPinjam');
        var skema = {
          idAnggota: [UI.rules.wajib('Anggota wajib dipilih')],
          idBuku: [UI.rules.wajib('Buku wajib dipilih')],
          tglPinjam: [UI.rules.wajib('Tanggal pinjam wajib diisi')]
        };
        if (!UI.validateForm(form, skema).valid) return false;

        var cek = R.bolehPinjam(form.idAnggota.value, form.idBuku.value);
        if (!cek.boleh) { UI.tandaiGalat(cek.field === 'buku' ? form.idBuku : form.idAnggota, cek.alasan); return false; }

        var p = R.catatPeminjaman({
          idAnggota: form.idAnggota.value,
          idBuku: form.idBuku.value,
          tglPinjam: form.tglPinjam.value,
          idPetugas: Layout.sesi().id
        });
        if (!p) {
          UI.toast('Peminjaman gagal disimpan. Penyimpanan peramban tidak dapat ditulis. Silakan coba lagi.', 'bad');
          return false;
        }
        UI.toast('Peminjaman ' + p.id + ' tercatat. Jatuh tempo ' + UI.formatTanggal(p.tglJatuhTempo) + '.', 'ok');
        if (!modeRiwayat) tabel.setBaris(siapkanBaris());
        return true;
      }
    });

    // Jatuh tempo mengikuti tanggal pinjam secara langsung.
    var tanggal = document.getElementById('pTanggal');
    function perbaruiTempo() {
      document.getElementById('pTempo').value = tanggal.value ? R.jatuhTempo(tanggal.value) : '';
    }
    tanggal.addEventListener('input', perbaruiTempo);
    tanggal.addEventListener('change', perbaruiTempo);
    document.getElementById('formPinjam').addEventListener('submit', function (e) { e.preventDefault(); });
  });

  /* --- Modal pengembalian --- */
  mount.addEventListener('click', function (e) {
    var tombol = e.target.closest && e.target.closest('[data-kembali]');
    if (!tombol || !mount.contains(tombol)) return;

    var id = tombol.getAttribute('data-kembali');
    var p = Store.peminjaman.find(id);
    if (!p) return;
    var a = Store.anggota.find(p.idAnggota);
    var b = R.bukuDariPinjam(id);
    var hari = R.hariIni();
    var hitung = R.hitungDenda(p.tglJatuhTempo, hari);

    var rincian =
      '<div class="rincian">' +
        '<div><span class="text-muted">Peminjam</span><span>' + UI.escapeHtml(a ? a.nama : '-') + '</span></div>' +
        '<div><span class="text-muted">Buku</span><span>' + UI.escapeHtml(b ? b.judul : '-') + '</span></div>' +
        '<div><span class="text-muted">Jatuh tempo</span><span>' + UI.escapeHtml(UI.formatTanggal(p.tglJatuhTempo)) + '</span></div>' +
        '<div><span class="text-muted">Tanggal kembali</span><span>' + UI.escapeHtml(UI.formatTanggal(hari)) + '</span></div>' +
        '<div><span class="text-muted">Keterlambatan</span><span>' + UI.escapeHtml(hitung.hariTerlambat) + ' hari</span></div>' +
        '<div><span class="text-muted">Tarif per hari</span><span>' + UI.escapeHtml(UI.formatRupiah(R.DENDA_PER_HARI)) + '</span></div>' +
        '<div class="total"><span>Total denda</span><span style="color:' + (hitung.nominal ? '#F43F5E' : 'inherit') + '">' + UI.escapeHtml(UI.formatRupiah(hitung.nominal)) + '</span></div>' +
      '</div>';

    UI.modal({
      judul: 'Proses Pengembalian',
      isiHtml: '<p class="text-muted">Konfirmasi pengembalian untuk transaksi <strong>' + UI.escapeHtml(id) + '</strong>.</p>' + rincian,
      konfirmasi: 'Konfirmasi Pengembalian',
      nada: hitung.nominal ? 'bad' : undefined,
      onKonfirmasi: function () {
        var hasil = R.prosesPengembalian(id, hari);
        if (!hasil) {
          UI.toast('Pengembalian gagal disimpan. Penyimpanan peramban tidak dapat ditulis. Silakan coba lagi.', 'bad');
          return false;
        }
        if (hasil.sudahDikembalikan) {
          UI.toast('Transaksi ini sudah dikembalikan sebelumnya. Tidak ada perubahan baru.', 'info');
          return true;
        }
        if (!hasil.pinjam) {
          UI.toast('Transaksi tidak ditemukan. Pengembalian tidak diproses.', 'bad');
          return true;
        }
        tabel.setBaris(siapkanBaris());
        if (hasil.denda) UI.toast('Dikembalikan. Denda ' + UI.formatRupiah(hasil.denda.nominal) + ' tercatat sebagai belum lunas.', 'bad');
        else UI.toast('Buku dikembalikan tepat waktu. Terima kasih.', 'ok');
        return true;
      }
    });
  });

  gantiTab(modeRiwayat);
})();
