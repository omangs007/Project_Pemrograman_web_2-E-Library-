/* Mesin tabel generik: cari, saring, urutkan, paginasi, dan render.
   Tidak tahu apa pun tentang domain perpustakaan — seluruh pengetahuan
   domain masuk lewat konfigurasi `kolom` dan `saringan`. */
var DataTable = (function () {

  /* --- Fungsi murni (diuji terpisah) ----------------------------- */

  function saring(baris, opsi) {
    var kueri = String(opsi.kueri || '').trim().toLowerCase();
    var cariPada = opsi.cariPada || [];
    var saringan = opsi.saringan || [];
    var nilai = opsi.nilaiSaringan || {};

    return baris.filter(function (r) {
      if (kueri) {
        var cocok = cariPada.some(function (f) {
          return String(r[f] === null || r[f] === undefined ? '' : r[f]).toLowerCase().indexOf(kueri) !== -1;
        });
        if (!cocok) return false;
      }
      for (var i = 0; i < saringan.length; i++) {
        var s = saringan[i];
        var v = nilai[s.kunci];
        if (v === '' || v === undefined || v === null) continue;   // "Semua"
        if (!s.cocok(r, v)) return false;
      }
      return true;
    });
  }

  function urutkan(baris, kunci, arah, ambil) {
    if (!kunci) return baris.slice();
    var faktor = arah === 'turun' ? -1 : 1;
    var nilaiDari = ambil || function (r) { return r[kunci]; };

    return baris.slice().sort(function (a, b) {
      var x = nilaiDari(a), y = nilaiDari(b);
      var xn = Number(x), yn = Number(y);
      var keduanyaAngka = x !== '' && y !== '' && !isNaN(xn) && !isNaN(yn);
      if (keduanyaAngka) return (xn - yn) * faktor;
      return String(x === null || x === undefined ? '' : x)
        .localeCompare(String(y === null || y === undefined ? '' : y), 'id', { sensitivity: 'base' }) * faktor;
    });
  }

  function potong(baris, halaman, perHalaman) {
    var mulai = (halaman - 1) * perHalaman;
    return baris.slice(mulai, mulai + perHalaman);
  }

  /* --- Komponen ---------------------------------------------------- */

  function buat(opsi) {
    var mount = opsi.mount;
    var kolom = opsi.kolom;
    var perHalaman = opsi.perHalaman || 8;
    var baris = opsi.baris || [];
    var kueri = '';
    var nilaiSaringan = {};
    var kunciUrut = opsi.urutAwal || null;
    var arahUrut = opsi.arahAwal || 'naik';
    var halaman = 1;
    var terlihat = [];

    function hitung() {
      var hasil = saring(baris, {
        kueri: kueri, cariPada: opsi.cariPada,
        saringan: opsi.saringan, nilaiSaringan: nilaiSaringan
      });
      var kol = kolom.find(function (k) { return k.kunci === kunciUrut; });
      hasil = urutkan(hasil, kunciUrut, arahUrut, kol && kol.ambil);
      terlihat = hasil;
      var maks = Math.max(1, Math.ceil(hasil.length / perHalaman));
      if (halaman > maks) halaman = maks;
      return hasil;
    }

    function htmlKepala() {
      return '<thead><tr>' + kolom.map(function (k) {
        var atribut = k.urut ? ' tabindex="0" data-urut="' + UI.escapeHtml(k.kunci) + '"' : '';
        var aria = (k.urut && kunciUrut === k.kunci)
          ? ' aria-sort="' + (arahUrut === 'naik' ? 'ascending' : 'descending') + '"' : '';
        var penanda = k.urut
          ? '<span class="penanda-urut">' + (kunciUrut === k.kunci ? (arahUrut === 'naik' ? '&uarr;' : '&darr;') : '&updownarrow;') + '</span>'
          : '';
        return '<th' + atribut + aria + ' class="' + UI.escapeHtml(k.kelas || '') + '">' + UI.escapeHtml(k.label) + penanda + '</th>';
      }).join('') + '</tr></thead>';
    }

    function htmlIsi(data) {
      return '<tbody>' + data.map(function (r) {
        return '<tr data-id="' + UI.escapeHtml(r.id) + '">' + kolom.map(function (k) {
          // Renderer konfigurasi menghasilkan HTML tepercaya; escape nilai dinamis di callback.
          var isi = k.render ? k.render(r) : UI.escapeHtml(k.ambil ? k.ambil(r) : r[k.kunci]);
          return '<td data-label="' + UI.escapeHtml(k.label) + '" class="' + UI.escapeHtml(k.kelas || '') + '">' + isi + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
    }

    function htmlPaginasi(total) {
      var maks = Math.max(1, Math.ceil(total / perHalaman));
      var tombol = ['<button type="button" data-hal="' + (halaman - 1) + '"' + (halaman === 1 ? ' disabled' : '') + '>&larr;</button>'];
      for (var i = 1; i <= maks; i++) {
        tombol.push('<button type="button" data-hal="' + i + '"' + (i === halaman ? ' aria-current="page"' : '') + '>' + i + '</button>');
      }
      tombol.push('<button type="button" data-hal="' + (halaman + 1) + '"' + (halaman === maks ? ' disabled' : '') + '>&rarr;</button>');

      var dari = total === 0 ? 0 : (halaman - 1) * perHalaman + 1;
      var sampai = Math.min(total, halaman * perHalaman);
      return '<div class="tabel-kaki"><span>Menampilkan ' + dari + '&ndash;' + sampai + ' dari ' + total + ' data</span>' +
             '<div class="paginasi">' + tombol.join('') + '</div></div>';
    }

    function render() {
      var aktif = typeof document !== 'undefined' ? document.activeElement : null;
      var fokus = null;
      if (aktif && mount.contains(aktif)) {
        if (aktif.matches('th[data-urut]')) {
          fokus = { selektor: 'th[data-urut]', kunci: aktif.getAttribute('data-urut') };
        } else if (aktif.matches('.paginasi button[data-hal]')) {
          // Label nomor dan panah tetap; data-hal panah berubah saat berpindah halaman.
          fokus = { selektor: '.paginasi button[data-hal]', label: aktif.textContent };
        }
      }
      var hasil = hitung();
      if (hasil.length === 0) {
        mount.innerHTML = '<div class="tabel-kosong"><strong>Tidak ada data yang cocok</strong>' +
          UI.escapeHtml(opsi.pesanKosong || 'Coba ubah kata kunci pencarian atau saringan.') + '</div>';
        return;
      }
      mount.innerHTML = '<div class="tabel-bungkus"><table class="tabel">' +
        htmlKepala() + htmlIsi(potong(hasil, halaman, perHalaman)) +
        '</table></div>' + htmlPaginasi(hasil.length);
      if (fokus) {
        var calon = mount.querySelectorAll(fokus.selektor);
        for (var i = 0; i < calon.length; i++) {
          var cocok = fokus.kunci !== undefined
            ? calon[i].getAttribute('data-urut') === fokus.kunci
            : calon[i].textContent === fokus.label;
          if (cocok) {
            if (!calon[i].disabled) calon[i].focus();
            break;
          }
        }
      }
    }

    /* Listener pada mount untuk seluruh tabel (delegasi) — tetap bekerja
       setelah isi tabel dirender ulang. */
    mount.addEventListener('click', function (e) {
      var th = e.target.closest && e.target.closest('th[data-urut]');
      if (th && mount.contains(th)) {
        var kunci = th.getAttribute('data-urut');
        if (kunciUrut === kunci) arahUrut = (arahUrut === 'naik' ? 'turun' : 'naik');
        else { kunciUrut = kunci; arahUrut = 'naik'; }
        render();
        return;
      }
      var tombol = e.target.closest && e.target.closest('.paginasi button[data-hal]');
      if (tombol && mount.contains(tombol) && !tombol.disabled) {
        halaman = parseInt(tombol.getAttribute('data-hal'), 10);
        render();
      }
    });

    mount.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var th = e.target.closest && e.target.closest('th[data-urut]');
      if (th && mount.contains(th)) {
        e.preventDefault();
        th.click();
      }
    });

    return {
      render: render,
      setBaris: function (b) { baris = b; halaman = 1; render(); },
      setCari: function (q) { kueri = q; halaman = 1; render(); },
      setSaringan: function (kunci, nilai) { nilaiSaringan[kunci] = nilai; halaman = 1; render(); },
      setPerHalaman: function (n) { perHalaman = n > 0 ? n : perHalaman; halaman = 1; render(); },
      barisTampil: function () { return terlihat.slice(); }
    };
  }

  return { saring: saring, urutkan: urutkan, potong: potong, buat: buat };
})();
