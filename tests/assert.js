/* Test runner minimal tanpa dependensi. Berjalan di peramban,
   hasilnya dirender ke elemen #hasil oleh runner.html. */
var T = (function () {
  var daftar = [];
  var galat = [];

  function test(nama, fn) { daftar.push({ nama: nama, fn: fn }); }

  function eq(aktual, harapan, pesan) {
    var a = JSON.stringify(aktual), h = JSON.stringify(harapan);
    if (a !== h) throw new Error((pesan || 'Tidak sama') + ' — diharapkan ' + h + ', didapat ' + a);
  }

  function truthy(nilai, pesan) {
    if (!nilai) throw new Error((pesan || 'Diharapkan bernilai benar') + ' — didapat ' + JSON.stringify(nilai));
  }

  function throws(fn, pesan) {
    var terlempar = false;
    try { fn(); } catch (e) { terlempar = true; }
    if (!terlempar) throw new Error(pesan || 'Diharapkan melempar galat, tetapi tidak');
  }

  function run(mount) {
    var lolos = 0;
    galat = [];
    var baris = daftar.map(function (t) {
      try {
        t.fn();
        lolos++;
        return '<li style="color:#14B8A6">LULUS &mdash; ' + t.nama + '</li>';
      } catch (e) {
        galat.push(t.nama + ': ' + e.message);
        return '<li style="color:#F43F5E">GAGAL &mdash; ' + t.nama + '<br><small>' + e.message + '</small></li>';
      }
    });
    var ringkas = lolos + ' / ' + daftar.length + ' lulus';
    mount.innerHTML = '<h2>' + ringkas + '</h2><ul style="line-height:1.8">' + baris.join('') + '</ul>';
    console.log('[TES] ' + ringkas);
    galat.forEach(function (g) { console.error('[TES] ' + g); });
    return { total: daftar.length, lolos: lolos, gagal: galat };
  }

  return { test: test, run: run, eq: eq, truthy: truthy, throws: throws };
})();

var test = T.test, eq = T.eq, truthy = T.truthy, throws = T.throws;
