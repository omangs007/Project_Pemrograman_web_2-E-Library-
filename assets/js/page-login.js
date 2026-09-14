/* Halaman masuk. Autentikasi disimulasikan sepenuhnya di sisi klien —
   kata sandi tidak disimpan di data, cukup dicocokkan dengan konstanta demo. */
(function () {
  var SANDI_DEMO = 'admin123';

  Layout.initTheme();
  Store.init();

  // Sudah punya sesi aktif? Langsung ke dashboard.
  if (Layout.sesi()) { window.location.href = 'pages/dashboard.html'; return; }

  var form = document.getElementById('formMasuk');
  var inputSandi = document.getElementById('sandi');

  var SKEMA = {
    email: [UI.rules.wajib('Alamat surel wajib diisi'), UI.rules.email('Format surel tidak valid')],
    sandi: [UI.rules.wajib('Kata sandi wajib diisi'), UI.rules.minLen(6, 'Kata sandi minimal 6 karakter')]
  };

  UI.pasangValidasiBlur(form, SKEMA);

  document.getElementById('lihatSandi').addEventListener('click', function () {
    var tampil = inputSandi.type === 'password';
    inputSandi.type = tampil ? 'text' : 'password';
    this.setAttribute('aria-label', tampil ? 'Sembunyikan kata sandi' : 'Perlihatkan kata sandi');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validateForm(form, SKEMA).valid) return;

    var email = form.email.value.trim().toLowerCase();
    var petugas = Store.petugas.all().find(function (p) { return p.email.toLowerCase() === email; });

    if (!petugas || form.sandi.value !== SANDI_DEMO) {
      UI.tandaiGalat(inputSandi, 'Surel atau kata sandi tidak cocok.');
      UI.toast('Gagal masuk. Periksa kembali kredensial Anda.', 'bad');
      return;
    }

    Layout.masuk(petugas);
    UI.toast('Selamat datang, ' + petugas.nama.split(' ')[0] + '!', 'ok');
    setTimeout(function () { window.location.href = 'pages/dashboard.html'; }, 500);
  });
})();
