/* Kerangka bersama seluruh halaman.
   initTheme() sengaja berdiri sendiri agar halaman di luar aplikasi
   (mis. design-system.html) bisa memakainya tanpa memicu penjaga sesi. */
var Layout = (function () {
  var KEY_TEMA = 'elibrary.theme';

  function terapkanTema(tema) {
    document.documentElement.classList.toggle('dark', tema === 'dark');
  }

  function initTheme() {
    var tersimpan = null;
    try { tersimpan = localStorage.getItem(KEY_TEMA); } catch (e) { /* mode privat */ }
    terapkanTema(tersimpan || 'dark');   // gelap adalah default
  }

  function toggleTema() {
    var jadiGelap = !document.documentElement.classList.contains('dark');
    terapkanTema(jadiGelap ? 'dark' : 'light');
    try { localStorage.setItem(KEY_TEMA, jadiGelap ? 'dark' : 'light'); } catch (e) { /* abaikan */ }
    document.dispatchEvent(new CustomEvent('temaberubah', { detail: { gelap: jadiGelap } }));
  }

  return { initTheme: initTheme, toggleTheme: toggleTema };
})();
