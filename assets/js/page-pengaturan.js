/* Modal Pengaturan. Dimuat di setiap halaman aplikasi dan hanya menunggu
   event 'bukapengaturan' dari sidebar — tidak perlu halaman tersendiri. */
(function () {
  document.addEventListener('bukapengaturan', function () {
    if (document.getElementById('aturTema')) return;
    var petugas = Layout.sesi() || { nama: '-', email: '-', role: '-' };
    var gelap = document.documentElement.classList.contains('dark');

    var isi =
      '<div class="rincian" style="border-top:none;padding-top:0">' +
        '<div><span class="text-muted">Nama petugas</span><span>' + UI.escapeHtml(petugas.nama) + '</span></div>' +
        '<div><span class="text-muted">Surel</span><span>' + UI.escapeHtml(petugas.email) + '</span></div>' +
        '<div><span class="text-muted">Peran</span><span>' + UI.escapeHtml(petugas.role) + '</span></div>' +
      '</div>' +
      '<div style="margin-top:20px">' +
        '<label class="field-label">Mode Tampilan</label>' +
        '<button type="button" class="btn btn-ghost" id="aturTema" style="width:100%">' +
          'Beralih ke Mode ' + (gelap ? 'Terang' : 'Gelap') +
        '</button>' +
      '</div>' +
      '<div style="margin-top:16px">' +
        '<label class="field-label">Data Demo</label>' +
        '<button type="button" class="btn btn-danger" id="aturReset" style="width:100%">Setel Ulang ke Data Awal</button>' +
        '<p class="text-muted" style="font-size:12px;margin-top:8px">Seluruh perubahan yang Anda buat akan dihapus dan data kembali seperti saat aplikasi pertama dibuka.</p>' +
      '</div>';

    var tutup = UI.modal({ judul: 'Pengaturan', isiHtml: isi, batal: 'Tutup' });

    document.getElementById('aturTema').addEventListener('click', function () {
      Layout.toggleTheme();
      tutup();
    });

    document.getElementById('aturReset').addEventListener('click', function () {
      tutup();
      UI.konfirmasi({
        judul: 'Setel Ulang Data Demo',
        pesan: 'Seluruh buku, anggota, dan transaksi yang Anda ubah akan dikembalikan ke kondisi awal. Lanjutkan?',
        konfirmasi: 'Ya, Setel Ulang'
      }).then(function (ya) {
        if (!ya) return;
        Store.reset();
        UI.toast('Data demo telah dipulihkan.', 'ok');
        setTimeout(function () { location.reload(); }, 800);
      });
    });
  });
})();
