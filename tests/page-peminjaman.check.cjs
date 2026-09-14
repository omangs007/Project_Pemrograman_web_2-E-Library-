/* Node integration checks: real Store, UI formatters/validation and DataTable;
   DOM, modal presentation and session are simulated, not browser-tested. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() { this.listeners = {}; this.attrs = {}; this.style = {}; this.children = []; this.value = ''; }
  set innerHTML(value) { this.html = value; this.children = []; }
  get innerHTML() { return (this.html || '') + this.children.map(x => x.innerHTML).join(''); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type, event = {}) {
    event.target ||= this;
    event.preventDefault ||= function () {};
    (this.listeners[type] || []).slice().forEach(fn => fn(event));
    if (this.parentElement) this.parentElement.dispatch(type, event);
  }
  contains(child) { return child === this || this.children.some(x => x.contains(child)); }
  querySelector(selector) {
    if (selector === '.field-error') return this.children.find(x => x.className === 'field-error') || null;
    const name = selector.match(/^\[name="(.+)"\]$/);
    return name ? this.elements[name[1]] : null;
  }
  focus() {}
  click() { this.dispatch('click'); }
  remove() { this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
}

function boot(hash = '') {
  const ids = {};
  ['panelTransaksi', 'tabAktif', 'tabRiwayat', 'saringKondisi', 'cariTransaksi', 'tombolPinjamBaru'].forEach(id => ids[id] = new Element());
  const memory = {};
  const timers = new Map();
  let nextTimer = 0;
  const window = new Element();
  const ctx = vm.createContext({
    console, window, location: { hash },
    document: { getElementById: id => ids[id], createElement: () => new Element() },
    localStorage: { getItem: k => memory[k] || null, setItem: (k, v) => memory[k] = String(v), removeItem: k => delete memory[k] },
    Layout: { init: () => true, sesi: () => ({ id: 'PT002' }) },
    setTimeout: fn => { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout: id => timers.delete(id)
  });
  ['data', 'store', 'ui', 'table'].forEach(name => vm.runInContext(fs.readFileSync('assets/js/' + name + '.js', 'utf8'), ctx));
  ctx.Store.init();
  const modals = [], toasts = [];
  ctx.UI.toast = (message, tone) => toasts.push({ message, tone });
  ctx.UI.modal = options => {
    modals.push(options);
    const form = new Element(); form.elements = {};
    ids.formPinjam = form;
    for (const match of options.isiHtml.matchAll(/<(?:input|select)\b([^>]+)>/g)) {
      const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
      const input = new Element(); input.value = attrs.value || '';
      new Element().appendChild(input);
      if (attrs.id) ids[attrs.id] = input;
      if (attrs.name) form.elements[attrs.name] = form[attrs.name] = input;
    }
  };
  const source = 'assets/js/page-peminjaman.js';
  assert.ok(fs.existsSync(source), 'Circulation page implementation must exist');
  vm.runInContext(fs.readFileSync(source, 'utf8'), ctx);
  return { ctx, ids, modals, toasts, timers, flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); } };
}

function returnClick(app, id) {
  const target = new Element();
  target.setAttribute('data-kembali', id);
  target.closest = selector => selector === '[data-kembali]' ? target : null;
  const panel = app.ids.panelTransaksi;
  (panel.children[0] || panel).appendChild(target);
  target.dispatch('click');
}

let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS: ' + name); }

check('seed: 11 active loans, 9 history loans; all three time conditions', () => {
  const app = boot(), S = app.ctx.Store;
  const active = S.peminjaman.all().filter(p => !p.tglKembali);
  assert.equal(active.length, 11);
  assert.equal(S.peminjaman.all().filter(p => p.tglKembali).length, 9);
  assert.deepEqual([...new Set(active.map(p => S.rules.statusPinjam(p)))].sort(), ['Aman', 'Segera', 'Terlambat']);
  assert.match(app.ids.panelTransaksi.innerHTML, /Sisa Waktu/);
  assert.match(app.ids.panelTransaksi.innerHTML, /dari 11 data/);
});

check('history hash, tab filters and cancelled pending search stay consistent', () => {
  const app = boot('#riwayat'), { ids } = app;
  assert.equal(ids.tabRiwayat.getAttribute('aria-selected'), 'true');
  assert.match(ids.panelTransaksi.innerHTML, /Tgl Kembali/);
  assert.doesNotMatch(ids.panelTransaksi.innerHTML, /data-kembali=/);
  ids.tabAktif.dispatch('click');
  ids.saringKondisi.value = 'Terlambat'; ids.saringKondisi.dispatch('change');
  assert.match(ids.panelTransaksi.innerHTML, /sisa-terlambat/);
  assert.doesNotMatch(ids.panelTransaksi.innerHTML, /sisa-aman|sisa-segera/);
  ids.cariTransaksi.value = 'no matches'; ids.cariTransaksi.dispatch('input');
  ids.tabRiwayat.dispatch('click'); ids.tabAktif.dispatch('click'); app.flush();
  assert.equal(ids.saringKondisi.value, '');
  assert.match(ids.panelTransaksi.innerHTML, /dari 11 data/);
  app.ctx.location.hash = '#riwayat'; app.ctx.window.dispatch('hashchange');
  assert.equal(ids.tabRiwayat.getAttribute('aria-selected'), 'true');
});

check('repeated tab switches: one return preview; fine shown before mutation; idempotent confirmation', () => {
  const app = boot(), S = app.ctx.Store, { ids } = app;
  for (let i = 0; i < 8; i++) { ids.tabRiwayat.dispatch('click'); ids.tabAktif.dispatch('click'); }
  const loan = S.peminjaman.all().find(p => !p.tglKembali);
  S.peminjaman.update(loan.id, { tglJatuhTempo: S.rules.tambahHari(S.rules.hariIni(), -3) });
  const book = S.rules.bukuDariPinjam(loan.id), oldFines = S.denda.all().length;
  returnClick(app, loan.id);
  assert.equal(app.modals.length, 1);
  const modal = app.modals[0];
  assert.match(modal.isiHtml, /Jatuh tempo/); assert.match(modal.isiHtml, /Tanggal kembali/);
  assert.match(modal.isiHtml, /3 hari/); assert.match(modal.isiHtml, /Rp3\.000/);
  assert.equal(S.peminjaman.find(loan.id).tglKembali, null);
  assert.equal(S.buku.find(book.id).jumlahTersedia, book.jumlahTersedia);
  modal.onKonfirmasi();
  assert.equal(S.buku.find(book.id).jumlahTersedia, book.jumlahTersedia + 1);
  assert.equal(S.denda.all().length, oldFines + 1);
  assert.equal(S.denda.all().find(d => d.idPinjam === loan.id).nominal, 3000);
  assert.doesNotMatch(ids.panelTransaksi.innerHTML, new RegExp('data-kembali="' + loan.id + '"'));
  modal.onKonfirmasi();
  assert.equal(app.toasts.at(-1).tone, 'info');
  assert.match(app.toasts.at(-1).message, /sudah dikembalikan/i);
  assert.equal(S.buku.find(book.id).jumlahTersedia, book.jumlahTersedia + 1);
  assert.equal(S.denda.all().length, oldFines + 1);
  ids.tabRiwayat.dispatch('click');
  assert.match(ids.panelTransaksi.innerHTML, new RegExp(loan.id));
});

check('sort and pagination remain attached to the current table after tab switches', () => {
  const app = boot(), { ids } = app;
  for (let i = 0; i < 5; i++) { ids.tabRiwayat.click(); ids.tabAktif.click(); }
  function tableClick(selector, attribute, value) {
    const target = new Element(); target.setAttribute(attribute, value);
    target.closest = wanted => wanted === selector ? target : null;
    ids.panelTransaksi.children[0].appendChild(target); target.click();
  }
  tableClick('th[data-urut]', 'data-urut', 'id');
  assert.match(ids.panelTransaksi.innerHTML, /data-urut="id" aria-sort="ascending"/);
  tableClick('th[data-urut]', 'data-urut', 'id');
  assert.match(ids.panelTransaksi.innerHTML, /data-urut="id" aria-sort="descending"/);
  tableClick('.paginasi button[data-hal]', 'data-hal', '2');
  assert.match(ids.panelTransaksi.innerHTML, /Menampilkan 9&ndash;11 dari 11 data/);
  ids.tabAktif.dispatch('keydown', { key: 'End' });
  assert.equal(ids.tabRiwayat.getAttribute('aria-selected'), 'true');
  ids.tabRiwayat.dispatch('keydown', { key: 'Home' });
  assert.equal(ids.tabAktif.getAttribute('aria-selected'), 'true');
});

check('new loan: live seven-day due date, required fields, blocked/limit/stock rejection, session staff', () => {
  const app = boot(), S = app.ctx.Store, { ids } = app;
  ids.tombolPinjamBaru.dispatch('click');
  const modal = app.modals.at(-1), form = ids.formPinjam;
  assert.doesNotMatch(modal.isiHtml, /value="AG008"/);
  assert.match(modal.isiHtml, /id="pTempo"[^>]*readonly/);
  ids.pTanggal.value = '2026-12-28'; ids.pTanggal.dispatch('input');
  assert.equal(ids.pTempo.value, '2027-01-04');
  ids.pTanggal.value = ''; ids.pTanggal.dispatch('input'); assert.equal(ids.pTempo.value, '');
  assert.equal(modal.onKonfirmasi(), false);
  form.tglPinjam.value = '2026-12-28';
  form.idAnggota.value = 'AG008'; form.idBuku.value = 'BK003';
  const count = S.peminjaman.all().length;
  assert.equal(modal.onKonfirmasi(), false); assert.equal(S.peminjaman.all().length, count);
  assert.match(form.idAnggota.parentElement.querySelector('.field-error').textContent, /Diblokir/);
  while (S.rules.jumlahPinjamanAktif('AG002') < 3) S.rules.catatPeminjaman({ idAnggota: 'AG002', idBuku: 'BK003' });
  form.idAnggota.value = 'AG002';
  assert.equal(modal.onKonfirmasi(), false);
  assert.match(form.idAnggota.parentElement.querySelector('.field-error').textContent, /batas maksimal/);
  form.idAnggota.value = 'AG014';
  S.buku.update('BK003', { jumlahTersedia: 0 });
  assert.equal(modal.onKonfirmasi(), false);
  assert.match(form.idAnggota.parentElement.querySelector('.field-error').textContent, /habis/);
  S.buku.update('BK003', { jumlahTersedia: 2 });
  assert.equal(modal.onKonfirmasi(), true);
  const loan = S.peminjaman.all().at(-1);
  assert.equal(loan.idPetugas, 'PT002'); assert.equal(loan.tglJatuhTempo, '2027-01-04');
  assert.equal(S.buku.find('BK003').jumlahTersedia, 1);
});

check('table and modal escape stored member/book HTML', () => {
  const app = boot(), S = app.ctx.Store;
  const loan = S.peminjaman.all().find(p => !p.tglKembali), book = S.rules.bukuDariPinjam(loan.id);
  S.anggota.update(loan.idAnggota, { nama: '<img src=x onerror=alert(1)>', nim: '<b>nim</b>' });
  S.buku.update(book.id, { judul: '<svg onload=alert(1)>' });
  app.ids.tabRiwayat.dispatch('click'); app.ids.tabAktif.dispatch('click');
  app.ids.cariTransaksi.value = loan.id; app.ids.cariTransaksi.dispatch('input'); app.flush();
  assert.match(app.ids.panelTransaksi.innerHTML, /&lt;img/);
  assert.match(app.ids.panelTransaksi.innerHTML, /&lt;svg/);
  assert.doesNotMatch(app.ids.panelTransaksi.innerHTML, /<img|<svg/);
  returnClick(app, loan.id);
  assert.match(app.modals.at(-1).isiHtml, /&lt;img/);
  assert.doesNotMatch(app.modals.at(-1).isiHtml, /<img|<svg/);
  S.reset();
});

console.log('CIRCULATION: ' + passed + '/' + passed + ' checks passed (simulated DOM; in-memory storage).');
