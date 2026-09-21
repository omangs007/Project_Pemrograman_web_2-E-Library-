/* Regression evidence: production controllers and validation in Node VM.
   DOM, modal presentation, Chart canvas and browser storage are simulated. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tag = tag; this.listeners = {}; this.attrs = {}; this.children = []; this.value = ''; this.style = {}; this.classList = { contains: () => false }; }
  set innerHTML(v) { this.html = v; this.children = []; if (this.tag === 'textarea') this.value = v.replace(/&(amp|lt|gt|quot|#39);/g, (_, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[k]); }
  get innerHTML() { return this.html || ''; }
  appendChild(el) { el.parentElement = this; this.children.push(el); return el; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(k, fn) { (this.listeners[k] ||= []).push(fn); }
  dispatch(k, target = this) { (this.listeners[k] || []).forEach(fn => fn({ target, preventDefault() {} })); }
  querySelector(s) { if (s === '.field-error') return this.children.find(x => x.className === 'field-error') || null; return this.elements?.[s.match(/^\[name="(.+)"\]$/)?.[1]] || null; }
  contains(el) { return el === this || this.children.some(x => x.contains(el)); }
  focus() {}
  remove() { this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
}

function boot(page, edit = false) {
  const ids = {}, memory = {}, toasts = [], modals = [], timers = [], charts = [], warnings = [], tables = [], attempts = [];
  let writes = 0, failAt = Infinity, reloads = 0;
  const el = id => ids[id] ||= new Element();
  const document = new Element();
  document.getElementById = el; document.createElement = tag => new Element(tag);
  document.body = new Element(); document.documentElement = new Element();
  const location = { hash: '', search: edit ? '?id=BK001' : '', href: 'form-buku.html', reload() { reloads++; } };
  const window = new Element(); window.location = location;
  const ctx = vm.createContext({ console: { warn: (...v) => warnings.push(v), log: console.log, error: console.error }, document, window, location, URLSearchParams,
    localStorage: { getItem: k => memory[k] || null, setItem(k, v) { writes++; attempts.push(JSON.parse(v)); if (writes >= failAt) throw Error('QuotaExceededError'); memory[k] = String(v); } },
    Layout: { init: () => true, setAktif: () => {}, sesi: () => ({ id: 'PT001', nama: 'Petugas' }), toggleTheme() {} },
    setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
    getComputedStyle: () => ({ getPropertyValue: () => '#777' }),
    Chart: function (canvas, config) { this.config = config; this.destroy = function () {}; this.resize = function () { this.resized = true; }; charts.push(this); },
    DataTable: { buat(opts) { const t = { rows: opts.baris, changes: 0, render() {}, setBaris(rows) { this.rows = rows; this.changes++; }, setPerHalaman(n) { this.perHalaman = n; }, barisTampil() { return this.rows; }, setCari() {}, setSaringan() {} }; tables.push(t); return t; } }
  });
  function load(file) { vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file }); }
  ['data', 'store', 'ui'].forEach(n => load('assets/js/' + n + '.js'));
  ctx.Store.init();
  function form(id, values) { const f = el(id); f.elements = {}; Object.keys(values).forEach(k => { const input = el(k); input.value = values[k]; new Element().appendChild(input); f.elements[k] = f[k] = input; }); return f; }
  ctx.UI.toast = (message, tone) => toasts.push({ message, tone });
  ctx.UI.modal = opts => {
    const modal = { opts, closed: false, confirm() { const result = opts.onKonfirmasi?.(); if (result !== false) this.closed = true; return result; } }; modals.push(modal);
    const html = opts.isiHtml || '';
    const formId = html.match(/<form[^>]*id="([^"]+)"/)?.[1];
    const f = formId ? form(formId, {}) : null;
    for (const m of html.matchAll(/<(?:input|select|button)\b([^>]+)>/g)) {
      const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
      const input = attrs.id ? el(attrs.id) : new Element(); input.value = attrs.value || ''; new Element().appendChild(input);
      if (f && attrs.name) f.elements[attrs.name] = f[attrs.name] = input;
    }
    return () => { modal.closed = true; };
  };
  // Model existing confirmation closing before its promise callback.
  ctx.UI.konfirmasi = opts => ({ then(fn) { modals.push({ opts, closed: false, confirm() { this.closed = true; return fn(true); } }); } });
  if (page === 'form-buku') form('formBuku', { judul: 'Buku Uji', pengarang: 'Penulis', penerbit: 'Penerbit', isbn: '1234567890', tahunTerbit: '2021', idKategori: 'KT001', lokasiRak: 'R-07-B', jumlahTotal: '6', jumlahTersedia: '5', sinopsis: '' });
  if (page) load('assets/js/page-' + page + '.js');
  return { ctx, ids, el, memory, toasts, modals, timers, charts, tables, window, document, location, load, form, attempts,
    get writes() { return writes; }, get reloads() { return reloads; }, inject(n = 1) { writes = 0; failAt = n; }, heal() { writes = 0; failAt = Infinity; } };
}
function clickRow(app, mount, attr, id) { const target = new Element(); target.setAttribute(attr, id); target.closest = s => s === '[' + attr + ']' ? target : null; app.el(mount).appendChild(target); app.el(mount).dispatch('click', target); }
function state(app) { return JSON.stringify(app.ctx.Store.raw()); }
function bad(app, modal) { assert.equal(modal.confirm(), false); assert.equal(modal.closed, false); assert.equal(app.toasts.at(-1).tone, 'bad'); assert.equal(app.toasts.filter(t => t.tone === 'ok').length, 0); assert.equal(app.timers.length, 0); }
let passed = 0, failed = 0;
function check(name, fn) { try { fn(); passed++; console.log('PASS: ' + name); } catch (e) { failed++; console.log('FAIL: ' + name + ': ' + e.message.split('\n')[0]); } }

check('I1: stok aktif 1; 6/6 ditolak, 6/5 diterima; total di bawah 2 pinjaman ditolak', () => {
  const a = boot('form-buku', true), f = a.ids.formBuku;
  const before = state(a); f.jumlahTotal.value = '6'; f.jumlahTersedia.value = '6'; f.dispatch('submit');
  assert.equal(state(a), before, 'stok tidak sah harus ditolak'); assert.equal(a.timers.length, 0);
  assert.match(f.jumlahTersedia.parentElement.querySelector('.field-error').textContent, /6.*5.*6.*1/);
  f.jumlahTersedia.value = '5'; f.dispatch('submit'); assert.equal(a.toasts.at(-1).tone, 'ok');
  const b = boot('form-buku', true); b.ctx.Store.rules.catatPeminjaman({ idAnggota: 'AG014', idBuku: 'BK001' });
  b.ids.formBuku.jumlahTotal.value = '1'; b.ids.formBuku.jumlahTersedia.value = '0'; const snapshot = state(b); b.ids.formBuku.dispatch('submit');
  assert.equal(state(b), snapshot); assert.match(b.ids.formBuku.jumlahTotal.parentElement.querySelector('.field-error').textContent, /1.*2/);
});
check('I1: penjaga hapus memakai transaksi aktif meski stok 6/6; stok selisih tanpa transaksi boleh dihapus', () => {
  const a = boot('buku'); a.ctx.Store.buku.update('BK001', { jumlahTotal: 6, jumlahTersedia: 6 });
  clickRow(a, 'tabelBuku', 'data-hapus', 'BK001'); assert.equal(a.modals.length, 0); assert.match(a.toasts.at(-1).message, /1/);
  const book = a.ctx.Store.buku.create({ judul: 'Tanpa transaksi', pengarang: 'Uji', jumlahTotal: 6, jumlahTersedia: 0 });
  clickRow(a, 'tabelBuku', 'data-hapus', book.id); a.modals.at(-1).confirm(); assert.equal(a.ctx.Store.buku.find(book.id), null);
});
check('I2: buku BK002 dan anggota AG014 hanya punya riwayat; keduanya ditolak hapus', () => {
  for (const [page, collection, id, mount] of [['buku', 'buku', 'BK002', 'tabelBuku'], ['anggota', 'anggota', 'AG014', 'tabelAnggota']]) {
    const a = boot(page), S = a.ctx.Store;
    const loans = S.peminjaman.all().filter(p => collection === 'anggota' ? p.idAnggota === id : S.detail.all().some(d => d.idPinjam === p.id && d.idBuku === id));
    assert.ok(loans.length > 0 && loans.every(p => p.tglKembali));
    clickRow(a, mount, 'data-hapus', id); a.modals.at(-1)?.confirm();
    assert.ok(S[collection].find(id), id + ' harus tetap ada'); assert.equal(a.modals.length, 0); assert.match(a.toasts.at(-1).message, /transaksi.*riwayat/);
  }
});
check('I3: injeksi reviewer gagal mulai tulis kedua; pinjam kini sukses atomik dengan 1 tulis', () => {
  const a = boot(), S = a.ctx.Store, stock = S.buku.find('BK002').jumlahTersedia;
  a.inject(2); const p = S.rules.catatPeminjaman({ idAnggota: 'AG014', idBuku: 'BK002' });
  assert.ok(p); assert.equal(a.writes, 1, 'satu tindakan hanya satu tulis');
  const disk = JSON.parse(a.memory['elibrary.db.v1']); assert.ok(disk.detailPeminjaman.some(d => d.idPinjam === p.id)); assert.equal(disk.buku.find(b => b.id === 'BK002').jumlahTersedia, stock - 1);
});
check('I3: gagal di satu-satunya tulis pinjam => false, db/disk/ID/stok utuh; retry lengkap', () => {
  const a = boot(), S = a.ctx.Store, before = state(a), disk = a.memory['elibrary.db.v1'];
  a.inject(); assert.equal(S.rules.catatPeminjaman({ idAnggota: 'AG014', idBuku: 'BK002' }), false);
  // Storage throws after receiving the complete candidate: loan, detail and stock
  // have all been mutated in memory, so this exercises rollback at commit time.
  const candidate = a.attempts.at(-1);
  assert.equal(candidate.peminjaman.length, 21); assert.equal(candidate.detailPeminjaman.length, 21);
  assert.equal(candidate.buku.find(b => b.id === 'BK002').jumlahTersedia, 4);
  assert.equal(a.writes, 1); assert.equal(state(a), before); assert.equal(a.memory['elibrary.db.v1'], disk);
  a.heal(); const p = S.rules.catatPeminjaman({ idAnggota: 'AG014', idBuku: 'BK002' }); assert.equal(p.id, 'PJ021'); assert.equal(a.writes, 1); assert.ok(S.detail.all().some(d => d.idPinjam === p.id));
  console.log('I3 EVIDENCE: kandidat gagal = 21 transaksi/21 detail/stok BK002 4; rollback = 20/20/stok 5; retry = PJ021, 1 tulis.');
});
check('I3: CRUD/reset/kembali rollback penuh; kembali sukses 1 tulis dan idempoten', () => {
  for (const action of [S => S.buku.create({ judul: 'Uji' }), S => S.buku.update('BK002', { judul: 'Uji' }), S => S.buku.remove('BK002'), S => S.anggota.create({ nama: 'Uji' }), S => S.anggota.update('AG014', { nama: 'Uji' }), S => S.anggota.remove('AG014'), S => S.reset(), S => S.rules.prosesPengembalian('PJ001', '2099-01-01'), S => S.rules.prosesPengembalian('PJ001', '1900-01-01')]) {
    const a = boot(); a.ctx.Store.buku.update('BK001', { judul: 'Penanda sebelum reset' }); const before = state(a), disk = a.memory['elibrary.db.v1'];
    a.inject(); assert.equal(action(a.ctx.Store), false); assert.equal(a.writes, 1); assert.equal(state(a), before); assert.equal(a.memory['elibrary.db.v1'], disk);
  }
  const a = boot(), S = a.ctx.Store, b = S.rules.bukuDariPinjam('PJ001'); a.heal();
  const result = S.rules.prosesPengembalian('PJ001', '2099-01-01'); assert.ok(result.pinjam && result.denda); assert.equal(a.writes, 1); assert.equal(S.buku.find(b.id).jumlahTersedia, b.jumlahTersedia + 1);
  assert.equal(S.rules.prosesPengembalian('PJ001', '2099-01-01').sudahDikembalikan, true); assert.equal(a.writes, 1);
});
function memberForm(a, edit = false) {
  if (edit) clickRow(a, 'tabelAnggota', 'data-ubah', 'AG014'); else a.el('tombolTambahAnggota').dispatch('click');
  const f = a.ids.formAnggota;
  const values = { nama: 'Anggota Uji', nim: '123456789012345', email: 'uji@example.com', telepon: '081234567890', jurusan: 'Manajemen', angkatan: '2021', status: 'Aktif' };
  Object.keys(values).forEach(k => f[k].value = values[k]); return f;
}
check('I3: tambah/ubah anggota gagal menahan modal, data dan tabel; retry sukses', () => {
  for (const edit of [false, true]) { const a = boot('anggota'); memberForm(a, edit); const before = state(a), changes = a.tables[0].changes; a.inject(); const m = a.modals.at(-1); bad(a, m); assert.equal(state(a), before); assert.equal(a.tables[0].changes, changes); a.heal(); assert.equal(m.confirm(), true); assert.equal(a.toasts.at(-1).tone, 'ok'); }
});
check('I3: gagal hapus buku/anggota dan reset menahan konfirmasi, tanpa sukses/reload; retry sukses', () => {
  for (const page of ['buku', 'anggota', 'pengaturan']) {
    const a = boot(page), S = a.ctx.Store;
    if (page === 'pengaturan') { delete a.ids.aturTema; a.document.getElementById = id => id === 'aturTema' ? a.ids[id] : a.el(id); a.document.dispatch('bukapengaturan'); a.el('aturReset').dispatch('click'); }
    else { const record = S[page].create(page === 'buku' ? { judul: 'Uji', jumlahTotal: 1, jumlahTersedia: 1 } : { nama: 'Uji' }); clickRow(a, page === 'buku' ? 'tabelBuku' : 'tabelAnggota', 'data-hapus', record.id); }
    const before = state(a); a.inject(); const m = a.modals.at(-1); bad(a, m); assert.equal(state(a), before); assert.equal(a.reloads, 0); a.heal(); assert.equal(m.confirm(), true); assert.equal(a.toasts.at(-1).tone, 'ok');
  }
});
check('I3: pemanggil pinjam/kembali menerima gagal, modal terbuka, tabel utuh; retry sukses', () => {
  for (const returning of [false, true]) {
    const a = boot('peminjaman');
    if (returning) clickRow(a, 'panelTransaksi', 'data-kembali', 'PJ001');
    else { a.el('tombolPinjamBaru').dispatch('click'); const f = a.ids.formPinjam; f.idAnggota.value = 'AG014'; f.idBuku.value = 'BK002'; f.tglPinjam.value = '2026-09-15'; }
    const before = state(a), changes = a.tables.at(-1).changes; a.inject(); const m = a.modals.at(-1); bad(a, m); assert.equal(state(a), before); assert.equal(a.tables.at(-1).changes, changes); a.heal(); assert.equal(m.confirm(), true); assert.equal(a.writes, 1);
  }
});
check('I4: Januari 1900 semua nol; transaksi tersaring cocok per bulan/jenis; print lifecycle tetap', () => {
  const a = boot('laporan');
  a.ids.dariTgl.value = '1900-01-01'; a.ids.sampaiTgl.value = '1900-01-31'; a.ids.jenisLaporan.value = 'semua'; a.ids.dariTgl.dispatch('change');
  let data = a.charts.at(-1).config.data; assert.ok(data.labels.length > 0); assert.ok(data.datasets.every(s => s.data.every(n => n === 0)), 'periode kosong harus nol');
  const S = a.ctx.Store;
  S.peminjaman.create({ idAnggota: 'AG014', tglPinjam: '1900-01-05', tglKembali: '1900-02-02', tglJatuhTempo: '1900-01-12' });
  S.peminjaman.create({ idAnggota: 'AG014', tglPinjam: '1900-01-20', tglKembali: null, tglJatuhTempo: '1900-01-27' });
  S.peminjaman.create({ idAnggota: 'AG014', tglPinjam: '1899-12-20', tglKembali: '1900-01-02', tglJatuhTempo: '1899-12-27' });
  for (const [kind, loans, returns] of [['semua', 2, 1], ['aktif', 1, 0], ['kembali', 1, 1], ['denda', 0, 0]]) {
    a.ids.jenisLaporan.value = kind; a.ids.jenisLaporan.dispatch('change'); data = a.charts.at(-1).config.data;
    assert.equal(a.tables[0].rows.length, loans); assert.equal(data.datasets[0].data.reduce((x, y) => x + y, 0), loans); assert.equal(data.datasets[1].data.reduce((x, y) => x + y, 0), returns);
    if (kind === 'semua') { assert.deepEqual(Array.from(data.datasets[0].data), [2, 0]); assert.deepEqual(Array.from(data.datasets[1].data), [0, 1]); }
    console.log('I4 EVIDENCE: jenis=' + kind + ', tabel=' + loans + ', pinjam=' + JSON.stringify(data.datasets[0].data) + ', kembali=' + JSON.stringify(data.datasets[1].data));
  }
  a.window.dispatch('beforeprint'); assert.equal(a.charts.at(-1).resized, true); assert.equal(a.charts.at(-1).config.options.scales.y.ticks.color, '#333');
  a.window.dispatch('afterprint'); assert.equal(a.charts.at(-1).config.options.scales.y.ticks.color, '#777'); assert.equal(a.tables[0].perHalaman, 10);
});
check('I5: runner asli 60/60; storage aplikasi 0 baca/0 tulis/0 hapus, penanda utuh', () => {
  const a = boot(); let reads = 0, writes = 0, removes = 0; const real = { 'elibrary.db.v1': 'PENANDA-DATA-APLIKASI' };
  a.ctx.window = a.ctx;
  Object.defineProperty(a.ctx, 'localStorage', { configurable: true, get: () => ({ getItem(k) { reads++; return real[k]; }, setItem(k, v) { writes++; real[k] = v; }, removeItem(k) { removes++; delete real[k]; }, clear() { removes++; Object.keys(real).forEach(k => delete real[k]); } }) });
  const html = fs.readFileSync('tests/runner.html', 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = match[1].match(/src="([^"]+)"/)?.[1]; const filename = src ? path.join('tests', src) : 'tests/runner.html:inline';
    vm.runInContext(src ? fs.readFileSync(filename, 'utf8') : match[2], a.ctx, { filename });
  }
  assert.match(a.el('hasil').innerHTML, /60 \/ 60 lulus/); assert.equal(reads, 0); assert.equal(writes, 0); assert.equal(removes, 0); assert.equal(real['elibrary.db.v1'], 'PENANDA-DATA-APLIKASI');
});
check('I6: 2020.5, 2.021e3, 0x7e5 ditolak; 2021 disimpan sebagai 2021', () => {
  const a = boot('anggota'), f = memberForm(a), m = a.modals.at(-1), before = state(a);
  for (const value of ['2020.5', '2.021e3', '0x7e5']) { f.angkatan.value = value; assert.equal(m.confirm(), false, value + ' harus ditolak'); assert.equal(state(a), before); assert.equal(f.angkatan.getAttribute('aria-invalid'), 'true'); }
  f.angkatan.value = '2021'; assert.equal(m.confirm(), true); assert.equal(a.ctx.Store.anggota.all().find(x => x.nim === f.nim.value).angkatan, 2021);
});
console.log('REVIEW AKHIR: ' + passed + '/' + (passed + failed) + ' checks passed (Node VM; simulated DOM).');
if (failed) process.exitCode = 1;
