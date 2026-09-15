/* Integration: production Store, UI validation and page controller in a VM.
   Only DOM/presentation, FileReader, storage and timers are simulated. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tag = tag; this.listeners = {}; this.attrs = {}; this.children = []; this.value = ''; this.disabled = false; }
  set innerHTML(value) {
    this.html = value; this.children = [];
    if (this.tag === 'textarea') this.value = value.replace(/&(amp|lt|gt|quot|#39);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[key]);
  }
  get innerHTML() { return this.html || ''; }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type) { (this.listeners[type] || []).forEach(fn => fn({ target: this, preventDefault() {} })); }
  querySelector(selector) {
    if (selector === '.field-error') return this.children.find(x => x.className === 'field-error') || null;
    const name = selector.match(/^\[name="(.+)"\]$/);
    return name ? this.elements[name[1]] : null;
  }
  focus() {}
  remove() { this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
}

function boot(edit) {
  const ids = {}, memory = {}, timers = [], toasts = [], warnings = [], writes = [];
  let full = false;
  ['formBuku', 'pratinjauSampul', 'tombolSimpan', 'berkasSampul', 'hapusSampul'].forEach(id => ids[id] = new Element());
  const form = ids.formBuku;
  form.elements = {};
  const values = { judul: ' Buku Uji Persistensi ', pengarang: 'Penulis', penerbit: 'Penerbit', isbn: '1234567890', tahunTerbit: '2021', idKategori: 'KT001', lokasiRak: 'R-07-B', jumlahTotal: '3', jumlahTersedia: '2', sinopsis: ' Ketikan tetap utuh & lengkap ' };
  Object.keys(values).forEach(name => {
    const input = new Element();
    new Element().appendChild(input);
    ids[name] = form.elements[name] = form[name] = input;
  });
  const location = { search: edit ? '?id=BK001' : '', href: 'form-buku.html' };
  const ctx = vm.createContext({
    console: { warn: (...args) => warnings.push(args) }, URLSearchParams, location, window: { location },
    document: { getElementById: id => ids[id], createElement: tag => new Element(tag) },
    Layout: { init: () => true },
    localStorage: {
      getItem: key => memory[key] || null,
      setItem: (key, value) => {
        writes.push({ key, disabled: ids.tombolSimpan.disabled });
        if (full) throw new Error('QuotaExceededError');
        memory[key] = String(value);
      }
    },
    FileReader: class { readAsDataURL(file) { this.result = file.data; this.onload(); } },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }
  });
  ['data', 'store', 'ui'].forEach(name => vm.runInContext(fs.readFileSync('assets/js/' + name + '.js', 'utf8'), ctx));
  ctx.Store.init();
  ctx.UI.toast = (message, tone) => toasts.push({ message, tone });
  vm.runInContext(fs.readFileSync('assets/js/page-form-buku.js', 'utf8'), ctx);
  Object.keys(values).forEach(name => form[name].value = values[name]);
  ids.berkasSampul.files = [{ type: 'image/png', size: 20, data: 'data:image/png;base64,Y292ZXI=' }];
  ids.berkasSampul.dispatch('change');
  writes.length = 0; warnings.length = 0;
  return { ctx, ids, form, values, memory, timers, toasts, warnings, writes, location, setFull(value) { full = value; } };
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('PASS: ' + name); }
  catch (error) { failed++; console.log('FAIL: ' + name + ': ' + error.message); }
}

for (const edit of [false, true]) {
  const mode = edit ? 'ubah' : 'tambah';
  check(mode + ': kuota penuh tidak sukses/navigasi; tombol dan ketikan dipulihkan', () => {
    const app = boot(edit), before = app.memory['elibrary.db.v1'];
    const preview = app.ids.pratinjauSampul.innerHTML;
    app.setFull(true);
    app.form.dispatch('submit');
    assert.ok(app.writes.length > 0, 'Submit harus mencapai setItem, bukan berhenti pada validasi');
    assert.ok(app.writes.every(write => write.disabled), 'Tombol harus dikunci selama penyimpanan');
    assert.equal(app.toasts.filter(t => t.tone === 'ok').length, 0, 'Tidak boleh ada toast sukses saat kuota penuh');
    assert.equal(app.timers.length, 0, 'Tidak boleh menjadwalkan navigasi saat gagal');
    assert.equal(app.location.href, 'form-buku.html');
    assert.equal(app.ids.tombolSimpan.disabled, false);
    assert.equal(app.memory['elibrary.db.v1'], before);
    assert.equal(app.warnings.length, app.writes.length);
    assert.equal(app.toasts.length, 1);
    assert.equal(app.toasts[0].tone, 'bad');
    assert.match(app.toasts[0].message, /peramban penuh/i);
    assert.match(app.toasts[0].message, /sampul.*besar/i);
    assert.match(app.toasts[0].message, /hapus.*sampul.*simpan/i);
    Object.keys(app.values).forEach(name => assert.equal(app.form[name].value, app.values[name]));
    assert.equal(app.ids.pratinjauSampul.innerHTML, preview);
    // Edit mode retries by updating the same record.
    if (edit) {
      app.setFull(false);
      app.ids.hapusSampul.dispatch('click');
      app.form.dispatch('submit');
      assert.equal(app.toasts.at(-1).tone, 'ok', 'Guard menyimpan harus dilepas agar retry berjalan');
      assert.equal(app.timers.length, 1);
      assert.equal(JSON.parse(app.memory['elibrary.db.v1']).buku.find(b => b.id === 'BK001').cover, '');
    }
  });
  check(mode + ': penyimpanan normal sukses dan navigasi setelah 700 ms', () => {
    const app = boot(edit);
    app.form.dispatch('submit');
    assert.ok(app.writes.length > 0);
    assert.equal(app.toasts.length, 1);
    assert.equal(app.toasts[0].tone, 'ok');
    const saved = JSON.parse(app.memory['elibrary.db.v1']).buku.filter(b => b.isbn === '1234567890');
    assert.equal(saved.length, 1);
    assert.equal(saved[0].judul, 'Buku Uji Persistensi');
    assert.equal(saved[0].cover, 'data:image/png;base64,Y292ZXI=');
    if (edit) assert.equal(saved[0].id, 'BK001');
    assert.equal(app.ids.tombolSimpan.disabled, true);
    assert.equal(app.timers.length, 1);
    assert.equal(app.timers[0].delay, 700);
    assert.equal(app.location.href, 'form-buku.html');
    app.timers[0].fn();
    assert.equal(app.location.href, 'data-buku.html');
  });
}
check('tambah: retry ISBN sama berhasil dan jumlah buku bertambah tepat satu', () => {
  const app = boot(false), count = app.ctx.Store.buku.all().length;
  const before = app.memory['elibrary.db.v1'];
  const isbn = app.form.isbn.value;
  app.setFull(true);
  app.form.dispatch('submit');
  assert.ok(app.writes.length > 0, 'Percobaan pertama harus mencapai penyimpanan');
  assert.equal(app.toasts.at(-1).tone, 'bad');
  assert.equal(app.memory['elibrary.db.v1'], before);
  assert.equal(app.timers.length, 0);
  assert.equal(app.ids.tombolSimpan.disabled, false);

  app.setFull(false);
  app.form.dispatch('submit');
  assert.equal(app.form.isbn.value, isbn);
  assert.equal(app.toasts.at(-1).tone, 'ok', 'Percobaan ulang ISBN sama harus berhasil');
  assert.equal(app.toasts.filter(t => t.tone === 'ok').length, 1);
  assert.equal(app.form.isbn.parentElement.querySelector('.field-error'), null);
  assert.notEqual(app.form.isbn.getAttribute('aria-invalid'), 'true');
  assert.equal(app.timers.length, 1);
  assert.equal(app.timers[0].delay, 700);
  assert.equal(app.ctx.Store.buku.all().length, count + 1);
  const saved = JSON.parse(app.memory['elibrary.db.v1']).buku;
  assert.equal(saved.length, count + 1);
  assert.equal(saved.filter(b => b.isbn === isbn).length, 1);
  app.timers[0].fn();
  assert.equal(app.location.href, 'data-buku.html');
});

console.log('FORM BUKU: ' + passed + '/' + (passed + failed) + ' checks passed (simulated DOM; in-memory storage).');
if (failed) process.exitCode = 1;
