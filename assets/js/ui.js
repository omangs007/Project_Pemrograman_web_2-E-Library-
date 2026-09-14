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
    toast: toast
  };
})();
