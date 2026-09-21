/* Perkakas tampilan generik. Tidak tahu apa pun tentang buku, anggota,
   atau peminjaman — sehingga bisa dipakai ulang di seluruh halaman. */
var UI = (function () {

  var BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /* --- Formatter ------------------------------------------------ */
  function formatRupiah(n) {
    var angka = Number(n) || 0;
    return 'Rp' + angka.toLocaleString('id-ID');
  }

  function pecahIso(iso) {
    if (!iso) return null;
    var b = String(iso).slice(0, 10).split('-');
    if (b.length !== 3) return null;
    return { th: b[0], bl: parseInt(b[1], 10) - 1, tg: b[2] };
  }

  function formatTanggal(iso) {
    var p = pecahIso(iso);
    return p ? p.tg + ' ' + BULAN_PENDEK[p.bl] + ' ' + p.th : '-';
  }

  function formatTanggalPanjang(iso) {
    var p = pecahIso(iso);
    return p ? parseInt(p.tg, 10) + ' ' + BULAN_PANJANG[p.bl] + ' ' + p.th : '-';
  }

  function inisial(nama) {
    return String(nama || '').trim().split(/\s+/).slice(0, 2)
      .map(function (k) { return k.charAt(0).toUpperCase(); }).join('');
  }

  function escapeHtml(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* --- Validasi -------------------------------------------------- */
  var rules = {
    wajib: function (pesan) {
      return function (v) { return String(v || '').trim() !== '' ? null : (pesan || 'Wajib diisi'); };
    },
    minLen: function (n, pesan) {
      return function (v) { return String(v || '').trim().length >= n ? null : (pesan || 'Minimal ' + n + ' karakter'); };
    },
    email: function (pesan) {
      return function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')) ? null : (pesan || 'Format surel tidak valid'); };
    },
    isbn: function (pesan) {
      return function (v) {
        var bersih = String(v || '').replace(/[-\s]/g, '');
        return /^\d{10}$|^\d{13}$/.test(bersih) ? null : (pesan || 'ISBN harus 10 atau 13 digit');
      };
    },
    angkaMin: function (n, pesan) {
      return function (v) {
        var x = Number(v);
        return (!isNaN(x) && x >= n) ? null : (pesan || 'Minimal ' + n);
      };
    },
    rentang: function (a, b, pesan) {
      return function (v) {
        var x = Number(v);
        return (!isNaN(x) && x >= a && x <= b) ? null : (pesan || 'Harus antara ' + a + ' dan ' + b);
      };
    },
    custom: function (fn, pesan) {
      return function (v) { return fn(v) ? null : (pesan || 'Nilai tidak valid'); };
    }
  };

  /* Mengembalikan pesan galat PERTAMA saja — menampilkan seluruh galat
     sekaligus pada satu field membingungkan pengguna. */
  function validate(nilai, daftarAturan) {
    for (var i = 0; i < daftarAturan.length; i++) {
      var pesan = daftarAturan[i](nilai);
      if (pesan) return pesan;
    }
    return null;
  }

  function tandaiGalat(input, pesan) {
    input.setAttribute('aria-invalid', 'true');
    var span = input.parentElement.querySelector('.field-error');
    if (!span) {
      span = document.createElement('span');
      span.className = 'field-error';
      input.parentElement.appendChild(span);
    }
    span.textContent = pesan;
  }

  function bersihkanGalat(input) {
    input.removeAttribute('aria-invalid');
    var span = input.parentElement.querySelector('.field-error');
    if (span) span.remove();
  }

  /* skema: { namaField: [aturan, ...] } — dicocokkan dengan atribut name. */
  function validateForm(formEl, skema) {
    var errors = {};
    Object.keys(skema).forEach(function (nama) {
      var input = formEl.querySelector('[name="' + nama + '"]');
      if (!input) return;
      var pesan = validate(input.value, skema[nama]);
      if (pesan) { errors[nama] = pesan; tandaiGalat(input, pesan); }
      else bersihkanGalat(input);
    });
    var daftar = Object.keys(errors);
    if (daftar.length) {
      var pertama = formEl.querySelector('[name="' + daftar[0] + '"]');
      if (pertama) pertama.focus();
    }
    return { valid: daftar.length === 0, errors: errors };
  }

  /* Memasang validasi saat blur agar pengguna tahu lebih awal,
     tanpa mengganggu saat masih mengetik. */
  function pasangValidasiBlur(formEl, skema) {
    Object.keys(skema).forEach(function (nama) {
      var input = formEl.querySelector('[name="' + nama + '"]');
      if (!input) return;
      input.addEventListener('blur', function () {
        var pesan = validate(input.value, skema[nama]);
        if (pesan) tandaiGalat(input, pesan); else bersihkanGalat(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          var pesan = validate(input.value, skema[nama]);
          if (!pesan) bersihkanGalat(input);
        }
      });
    });
  }

  /* --- Modal ----------------------------------------------------- */
  function modal(opsi) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', opsi.judul || 'Dialog');

    var tombolKonfirmasi = opsi.konfirmasi
      ? '<button type="button" data-aksi="konfirmasi" class="btn ' + (opsi.nada === 'bad' ? 'btn-danger' : 'btn-primary') + '">' + escapeHtml(opsi.konfirmasi) + '</button>'
      : '';
    var tombolBatal = opsi.batal === null ? '' :
      '<button type="button" data-aksi="batal" class="btn btn-ghost">' + escapeHtml(opsi.batal || 'Batal') + '</button>';

    overlay.innerHTML =
      '<div class="modal-box' + (opsi.lebar ? ' modal-lebar' : '') + '">' +
        '<h2 class="modal-judul">' + escapeHtml(opsi.judul || '') + '</h2>' +
        '<div class="modal-isi">' + (opsi.isiHtml || '') + '</div>' +
        '<div class="modal-aksi">' + tombolBatal + tombolKonfirmasi + '</div>' +
      '</div>';

    var fokusSebelumnya = document.activeElement;
    var dikonfirmasi = false;
    var sudahTutup = false;

    function tutup() {
      if (sudahTutup) return;
      sudahTutup = true;
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (fokusSebelumnya && fokusSebelumnya.focus) fokusSebelumnya.focus();
      if (opsi.onTutup) opsi.onTutup(dikonfirmasi);
    }
    // Jaga fokus pengguna keyboard di dalam dialog selama dialog terbuka.
    function fokusableDalamModal() {
      return Array.prototype.slice.call(
        overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return el.offsetParent !== null; });
    }

    function onKey(e) {
      if (e.key === 'Escape') return tutup();
      if (e.key !== 'Tab') return;
      var fokusable = fokusableDalamModal();
      if (!fokusable.length) { e.preventDefault(); return; }
      var pertama = fokusable[0];
      var terakhir = fokusable[fokusable.length - 1];
      if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir.focus(); }
      else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama.focus(); }
      else if (!overlay.contains(document.activeElement)) { e.preventDefault(); pertama.focus(); }
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) return tutup();
      var aksi = e.target.getAttribute && e.target.getAttribute('data-aksi');
      if (aksi === 'batal') tutup();
      if (aksi === 'konfirmasi') {
        // onKonfirmasi boleh mengembalikan false untuk menahan modal tetap terbuka
        var hasil = opsi.onKonfirmasi ? opsi.onKonfirmasi(overlay) : true;
        if (hasil !== false) { dikonfirmasi = true; tutup(); }
      }
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    // Modal menyuntikkan select dan input tanggalnya sendiri setelah halaman siap.
    pasangKontrol(overlay);

    var kotak = overlay.querySelector('.modal-box');
    kotak.setAttribute('tabindex', '-1');
    var fokusPertama = overlay.querySelector('input, select, textarea, button[data-aksi="konfirmasi"], button[data-aksi="batal"]') || kotak;
    fokusPertama.focus();
    return tutup;
  }

  /* Promise diselesaikan lewat callback onTutup milik modal, yang selalu
     terpanggil baik lewat tombol konfirmasi, tombol batal, Escape, maupun
     klik di luar kotak. */
  function konfirmasi(opsi) {
    return new Promise(function (resolve) {
      modal({
        judul: opsi.judul || 'Konfirmasi',
        isiHtml: '<p class="text-muted">' + escapeHtml(opsi.pesan || '') + '</p>',
        konfirmasi: opsi.konfirmasi || 'Ya, Lanjutkan',
        batal: 'Batal',
        nada: opsi.nada || 'bad',
        onKonfirmasi: function () { return true; },
        onTutup: function (dikonfirmasi) { resolve(dikonfirmasi); }
      });
    });
  }

  /* --- Toast ----------------------------------------------------- */
  function toast(pesan, nada) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast toast-' + (nada || 'ok');
    el.textContent = pesan;
    wrap.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-keluar');
      setTimeout(function () { el.remove(); }, 260);
    }, 2800);
  }

  /* --- Kontrol kustom: daftar pilihan dan kalender ------------------------
     Daftar <select> dan panel kalender <input type="date"> digambar peramban
     di luar alur halaman, sehingga CSS hanya menjangkau warnanya; radius,
     bayangan, jarak, dan gaya sorot tidak bisa disentuh sama sekali. Keduanya
     karena itu diganti popover milik sendiri agar seragam dengan permukaan
     glass. Elemen aslinya sengaja dibiarkan di DOM dan tetap menjadi sumber
     nilai: kode halaman terus membaca .value dan mendengarkan event change
     seperti sebelumnya, dan tanpa JavaScript kontrol bawaan tetap berfungsi. */

  var popover = null;

  function adaDom() {
    return typeof document !== 'undefined' && !!document.body && !!document.body.appendChild;
  }

  function tutupPopover() {
    if (!popover) return;
    var p = popover;
    popover = null;
    if (p.kotak && p.kotak.parentNode) p.kotak.parentNode.removeChild(p.kotak);
    document.removeEventListener('mousedown', p.onLuar, true);
    document.removeEventListener('keydown', p.onKey, true);
    window.removeEventListener('resize', p.onGeser);
    window.removeEventListener('scroll', p.onGeser, true);
    if (p.jangkar && p.jangkar.setAttribute) p.jangkar.setAttribute('aria-expanded', 'false');
    if (p.kembalikanFokus && p.jangkar && p.jangkar.focus) p.jangkar.focus();
  }

  /* Popover digantung di body, bukan di dalam panel, supaya tidak terpotong
     oleh overflow kartu dan tidak tertimpa elemen bertumpuk di sekitarnya. */
  function letakkanPopover(kotak, jangkar) {
    var r = jangkar.getBoundingClientRect();
    var tinggi = kotak.offsetHeight;
    var lebar = kotak.offsetWidth;
    var ruangBawah = window.innerHeight - r.bottom;
    var keAtas = ruangBawah < tinggi + 12 && r.top > tinggi + 12;
    var atas = keAtas ? r.top - tinggi - 6 : r.bottom + 6;
    var kiri = Math.min(r.left, window.innerWidth - lebar - 8);
    kotak.style.top = Math.max(8, atas + window.pageYOffset) + 'px';
    kotak.style.left = Math.max(8, kiri + window.pageXOffset) + 'px';
  }

  function bukaPopover(kotak, jangkar, onKeyKhusus) {
    tutupPopover();
    kotak.style.position = 'absolute';
    kotak.style.visibility = 'hidden';
    document.body.appendChild(kotak);
    letakkanPopover(kotak, jangkar);
    kotak.style.visibility = '';

    var p = {
      kotak: kotak,
      jangkar: jangkar,
      kembalikanFokus: false,
      onLuar: function (e) {
        if (kotak.contains(e.target) || jangkar === e.target || jangkar.contains(e.target)) return;
        tutupPopover();
      },
      onKey: function (e) {
        if (e.key === 'Escape') {
          // Ditahan agar Escape menutup popover saja, bukan sekaligus modal induknya.
          e.preventDefault(); e.stopPropagation();
          popover.kembalikanFokus = true; tutupPopover(); return;
        }
        if (e.key === 'Tab') { tutupPopover(); return; }
        if (onKeyKhusus) onKeyKhusus(e);
      },
      onGeser: function () { if (popover) letakkanPopover(kotak, jangkar); }
    };
    popover = p;
    document.addEventListener('mousedown', p.onLuar, true);
    document.addEventListener('keydown', p.onKey, true);
    window.addEventListener('resize', p.onGeser);
    window.addEventListener('scroll', p.onGeser, true);
    return p;
  }

  function picuPerubahan(el) {
    var ev;
    try { ev = new Event('change', { bubbles: true }); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('change', true, false); }
    el.dispatchEvent(ev);
  }

  /* --- Daftar pilihan ----------------------------------------------------- */

  var CENTANG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';

  function bukaDaftarPilihan(select) {
    if (select.disabled || !select.options.length) return;

    var kotak = document.createElement('div');
    kotak.className = 'pilih-daftar';
    kotak.setAttribute('role', 'listbox');
    var label = select.getAttribute('aria-label') ||
      (select.id && document.querySelector('label[for="' + select.id + '"]') ? document.querySelector('label[for="' + select.id + '"]').textContent : '');
    if (label) kotak.setAttribute('aria-label', label.trim());
    kotak.style.minWidth = select.getBoundingClientRect().width + 'px';

    var sorot = select.selectedIndex < 0 ? 0 : select.selectedIndex;
    var tombol = [];

    function gambarSorot() {
      for (var i = 0; i < tombol.length; i++) {
        var aktif = i === sorot;
        tombol[i].classList.toggle('disorot', aktif);
        if (aktif && tombol[i].scrollIntoView) tombol[i].scrollIntoView({ block: 'nearest' });
      }
    }

    function pilih(i) {
      if (select.options[i].disabled) return;
      var berubah = select.selectedIndex !== i;
      select.selectedIndex = i;
      if (popover) popover.kembalikanFokus = true;
      tutupPopover();
      if (berubah) picuPerubahan(select);
    }

    Array.prototype.forEach.call(select.options, function (opt, i) {
      var baris = document.createElement('div');
      baris.className = 'pilih-opsi';
      if (i === select.selectedIndex) baris.classList.add('terpilih');
      if (opt.disabled) baris.classList.add('nonaktif');
      baris.setAttribute('role', 'option');
      baris.setAttribute('aria-selected', String(i === select.selectedIndex));
      baris.innerHTML = '<span class="pilih-centang">' + CENTANG + '</span>' +
        '<span class="pilih-teks">' + escapeHtml(opt.text) + '</span>';
      baris.addEventListener('mousedown', function (e) { e.preventDefault(); });
      baris.addEventListener('click', function () { pilih(i); });
      baris.addEventListener('mousemove', function () { sorot = i; gambarSorot(); });
      kotak.appendChild(baris);
      tombol.push(baris);
    });

    bukaPopover(kotak, select, function (e) {
      var akhir = tombol.length - 1;
      if (e.key === 'ArrowDown') { e.preventDefault(); sorot = Math.min(akhir, sorot + 1); gambarSorot(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sorot = Math.max(0, sorot - 1); gambarSorot(); }
      else if (e.key === 'Home') { e.preventDefault(); sorot = 0; gambarSorot(); }
      else if (e.key === 'End') { e.preventDefault(); sorot = akhir; gambarSorot(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilih(sorot); }
    });
    select.setAttribute('aria-expanded', 'true');
    gambarSorot();
  }

  function pasangSelect(select) {
    if (select.dataset && select.dataset.kontrolKustom) return;
    if (select.dataset) select.dataset.kontrolKustom = '1';
    select.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || select.disabled) return;
      e.preventDefault();
      if (popover && popover.jangkar === select) { tutupPopover(); return; }
      select.focus();
      bukaDaftarPilihan(select);
    });
    // Alt+Panah bawah dan F4 adalah pintasan baku untuk membuka daftar.
    select.addEventListener('keydown', function (e) {
      if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4') {
        e.preventDefault();
        bukaDaftarPilihan(select);
      }
    });
  }

  /* --- Kalender ----------------------------------------------------------- */

  var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var IKON_KALENDER = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>';
  var PANAH_KIRI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  var PANAH_KANAN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dariIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function bukaKalender(input) {
    if (input.disabled || input.readOnly) return;

    var terpilih = dariIso(input.value);
    var hariIni = new Date();
    var kursor = new Date((terpilih || hariIni).getFullYear(), (terpilih || hariIni).getMonth(), 1);
    var batasBawah = dariIso(input.getAttribute('min'));
    var batasAtas = dariIso(input.getAttribute('max'));

    var kotak = document.createElement('div');
    kotak.className = 'kalender';
    kotak.setAttribute('role', 'dialog');
    kotak.setAttribute('aria-label', 'Pilih tanggal');

    function diluarBatas(d) {
      if (batasBawah && d < batasBawah) return true;
      if (batasAtas && d > batasAtas) return true;
      return false;
    }

    function setel(d) {
      input.value = iso(d);
      if (popover) popover.kembalikanFokus = true;
      tutupPopover();
      picuPerubahan(input);
    }

    function gambar() {
      var awal = new Date(kursor.getFullYear(), kursor.getMonth(), 1);
      var mulai = new Date(awal);
      mulai.setDate(1 - awal.getDay());

      var sel = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(mulai.getFullYear(), mulai.getMonth(), mulai.getDate() + i);
        var kelas = 'kalender-sel';
        if (d.getMonth() !== kursor.getMonth()) kelas += ' luar';
        if (iso(d) === iso(hariIni)) kelas += ' hari-ini';
        if (terpilih && iso(d) === iso(terpilih)) kelas += ' terpilih';
        if (diluarBatas(d)) kelas += ' nonaktif';
        sel += '<button type="button" class="' + kelas + '" data-tgl="' + iso(d) + '"' +
          (diluarBatas(d) ? ' disabled' : '') + '>' + d.getDate() + '</button>';
      }

      kotak.innerHTML =
        '<div class="kalender-kepala">' +
          '<button type="button" class="kalender-nav" data-geser="-1" aria-label="Bulan sebelumnya">' + PANAH_KIRI + '</button>' +
          '<span class="kalender-judul">' + BULAN_ID[kursor.getMonth()] + ' ' + kursor.getFullYear() + '</span>' +
          '<button type="button" class="kalender-nav" data-geser="1" aria-label="Bulan berikutnya">' + PANAH_KANAN + '</button>' +
        '</div>' +
        '<div class="kalender-hari">' + HARI_ID.map(function (h) { return '<span>' + h + '</span>'; }).join('') + '</div>' +
        '<div class="kalender-grid">' + sel + '</div>' +
        '<div class="kalender-kaki">' +
          '<button type="button" class="kalender-aksi" data-aksi="hapus">Hapus</button>' +
          '<button type="button" class="kalender-aksi utama" data-aksi="hari-ini">Hari ini</button>' +
        '</div>';
      if (popover) letakkanPopover(kotak, input);
    }

    kotak.addEventListener('mousedown', function (e) { e.preventDefault(); });
    kotak.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tgl], [data-geser], [data-aksi]') : null;
      if (!t) return;
      if (t.hasAttribute('data-geser')) {
        kursor = new Date(kursor.getFullYear(), kursor.getMonth() + Number(t.getAttribute('data-geser')), 1);
        gambar();
      } else if (t.hasAttribute('data-tgl')) {
        var d = dariIso(t.getAttribute('data-tgl'));
        if (d && !diluarBatas(d)) setel(d);
      } else if (t.getAttribute('data-aksi') === 'hapus') {
        input.value = '';
        if (popover) popover.kembalikanFokus = true;
        tutupPopover();
        picuPerubahan(input);
      } else if (t.getAttribute('data-aksi') === 'hari-ini') {
        if (!diluarBatas(hariIni)) setel(hariIni);
      }
    });

    gambar();
    bukaPopover(kotak, input, function (e) {
      if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        kursor = new Date(kursor.getFullYear(), kursor.getMonth() + (e.key === 'PageUp' ? -1 : 1), 1);
        gambar();
      }
    });
    gambar();
  }

  function pasangTanggal(input) {
    if (input.dataset && input.dataset.kontrolKustom) return;
    if (input.readOnly || input.disabled) return;
    if (input.dataset) input.dataset.kontrolKustom = '1';

    var induk = input.parentNode;
    if (!induk) return;
    var bungkus = document.createElement('span');
    bungkus.className = 'bidang-tanggal';
    induk.insertBefore(bungkus, input);
    bungkus.appendChild(input);

    var tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'tanggal-tombol';
    tombol.setAttribute('aria-label', 'Buka kalender');
    tombol.innerHTML = IKON_KALENDER;
    tombol.addEventListener('mousedown', function (e) { e.preventDefault(); });
    tombol.addEventListener('click', function () {
      if (popover && popover.jangkar === input) { tutupPopover(); return; }
      input.focus();
      bukaKalender(input);
    });
    bungkus.appendChild(tombol);

    input.addEventListener('keydown', function (e) {
      if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4') { e.preventDefault(); bukaKalender(input); }
    });
  }

  /* Dipanggil sekali saat halaman siap dan sekali lagi untuk tiap modal, karena
     modal menyuntikkan select dan input tanggalnya sendiri setelah itu. */
  function pasangKontrol(akar) {
    if (!adaDom()) return;
    var root = akar || document;
    if (!root.querySelectorAll) return;
    try {
      Array.prototype.forEach.call(root.querySelectorAll('select.glass-select'), pasangSelect);
      Array.prototype.forEach.call(root.querySelectorAll('input[type="date"]'), pasangTanggal);
    } catch (e) { /* DOM tiruan pada harness tidak menyediakan semuanya */ }
  }

  if (adaDom() && document.addEventListener) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { pasangKontrol(); });
    } else {
      pasangKontrol();
    }
  }

  return {
    formatRupiah: formatRupiah,
    formatTanggal: formatTanggal,
    formatTanggalPanjang: formatTanggalPanjang,
    inisial: inisial,
    escapeHtml: escapeHtml,
    rules: rules,
    validate: validate,
    validateForm: validateForm,
    pasangValidasiBlur: pasangValidasiBlur,
    tandaiGalat: tandaiGalat,
    bersihkanGalat: bersihkanGalat,
    modal: modal,
    konfirmasi: konfirmasi,
    toast: toast,
    pasangKontrol: pasangKontrol
  };
})();
