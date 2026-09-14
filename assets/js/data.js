/* Seed mock data. Dipanggil sekali oleh Store saat localStorage masih kosong.
   Tanggal dihitung relatif terhadap hari pemanggilan agar status
   "jatuh tempo hari ini" dan "terlambat" selalu relevan kapan pun didemokan. */
var Data = (function () {

  function geser(hari) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + hari);
    return d.toISOString().slice(0, 10);
  }

  var KATEGORI = [
    { id: 'KT001', nama: 'Karya Umum',      kodeDdc: '000' },
    { id: 'KT002', nama: 'Filsafat',        kodeDdc: '100' },
    { id: 'KT003', nama: 'Agama',           kodeDdc: '200' },
    { id: 'KT004', nama: 'Ilmu Sosial',     kodeDdc: '300' },
    { id: 'KT005', nama: 'Bahasa',          kodeDdc: '400' },
    { id: 'KT006', nama: 'Sains Murni',     kodeDdc: '500' },
    { id: 'KT007', nama: 'Teknologi',       kodeDdc: '600' },
    { id: 'KT008', nama: 'Seni & Sastra',   kodeDdc: '700' }
  ];

  var PETUGAS = [
    { id: 'PT001', nama: 'Abdul Rachman', username: 'admin', email: 'admin@unpam.ac.id', role: 'Administrator' },
    { id: 'PT002', nama: 'Siti Nurhaliza', username: 'pustakawan', email: 'siti@unpam.ac.id', role: 'Pustakawan' }
  ];

  /* 24 judul. jumlahTersedia diselaraskan dengan peminjaman aktif di Step berikutnya. */
  var BUKU = [
    { id: 'BK001', isbn: '9786020332123', judul: 'Algoritma dan Struktur Data', pengarang: 'Rinaldi Munir', penerbit: 'Informatika', tahunTerbit: 2021, idKategori: 'KT007', jumlahTotal: 6, lokasiRak: 'R-07-A' },
    { id: 'BK002', isbn: '9789792248470', judul: 'Basis Data Relasional', pengarang: 'Fathansyah', penerbit: 'Informatika', tahunTerbit: 2020, idKategori: 'KT007', jumlahTotal: 5, lokasiRak: 'R-07-A' },
    { id: 'BK003', isbn: '9786020634562', judul: 'Pemrograman Web Modern', pengarang: 'Betha Sidik', penerbit: 'Informatika', tahunTerbit: 2022, idKategori: 'KT007', jumlahTotal: 8, lokasiRak: 'R-07-B' },
    { id: 'BK004', isbn: '9789794338872', judul: 'Jaringan Komputer Dasar', pengarang: 'Iwan Sofana', penerbit: 'Informatika', tahunTerbit: 2019, idKategori: 'KT007', jumlahTotal: 4, lokasiRak: 'R-07-B' },
    { id: 'BK005', isbn: '9786230012345', judul: 'Kecerdasan Buatan Terapan', pengarang: 'Suyanto', penerbit: 'Informatika', tahunTerbit: 2023, idKategori: 'KT007', jumlahTotal: 3, lokasiRak: 'R-07-C' },
    { id: 'BK006', isbn: '9789791234567', judul: 'Rekayasa Perangkat Lunak', pengarang: 'Rosa A. S.', penerbit: 'Informatika', tahunTerbit: 2021, idKategori: 'KT007', jumlahTotal: 5, lokasiRak: 'R-07-C' },
    { id: 'BK007', isbn: '9786020385471', judul: 'Kalkulus Dasar', pengarang: 'Edwin J. Purcell', penerbit: 'Erlangga', tahunTerbit: 2018, idKategori: 'KT006', jumlahTotal: 7, lokasiRak: 'R-05-A' },
    { id: 'BK008', isbn: '9789790335486', judul: 'Fisika untuk Universitas', pengarang: 'Halliday & Resnick', penerbit: 'Erlangga', tahunTerbit: 2020, idKategori: 'KT006', jumlahTotal: 4, lokasiRak: 'R-05-A' },
    { id: 'BK009', isbn: '9786020451237', judul: 'Kimia Organik Dasar', pengarang: 'Hardjono Sastrohamidjojo', penerbit: 'UGM Press', tahunTerbit: 2017, idKategori: 'KT006', jumlahTotal: 3, lokasiRak: 'R-05-B' },
    { id: 'BK010', isbn: '9789794613542', judul: 'Statistika Terapan', pengarang: 'Sugiyono', penerbit: 'Alfabeta', tahunTerbit: 2022, idKategori: 'KT006', jumlahTotal: 6, lokasiRak: 'R-05-B' },
    { id: 'BK011', isbn: '9786024225551', judul: 'Pengantar Ilmu Ekonomi', pengarang: 'Sadono Sukirno', penerbit: 'Rajawali Pers', tahunTerbit: 2019, idKategori: 'KT004', jumlahTotal: 8, lokasiRak: 'R-03-A' },
    { id: 'BK012', isbn: '9789790767829', judul: 'Manajemen Sumber Daya Manusia', pengarang: 'Malayu Hasibuan', penerbit: 'Bumi Aksara', tahunTerbit: 2021, idKategori: 'KT004', jumlahTotal: 5, lokasiRak: 'R-03-A' },
    { id: 'BK013', isbn: '9786020629934', judul: 'Sosiologi Perubahan Sosial', pengarang: 'Soerjono Soekanto', penerbit: 'Rajawali Pers', tahunTerbit: 2018, idKategori: 'KT004', jumlahTotal: 4, lokasiRak: 'R-03-B' },
    { id: 'BK014', isbn: '9789794611234', judul: 'Pengantar Hukum Indonesia', pengarang: 'Titik Triwulan', penerbit: 'Kencana', tahunTerbit: 2020, idKategori: 'KT004', jumlahTotal: 3, lokasiRak: 'R-03-B' },
    { id: 'BK015', isbn: '9786020332789', judul: 'Tata Bahasa Indonesia Baku', pengarang: 'Gorys Keraf', penerbit: 'Gramedia', tahunTerbit: 2016, idKategori: 'KT005', jumlahTotal: 6, lokasiRak: 'R-04-A' },
    { id: 'BK016', isbn: '9780194738767', judul: 'Academic English for Students', pengarang: 'Michael Swan', penerbit: 'Oxford', tahunTerbit: 2021, idKategori: 'KT005', jumlahTotal: 5, lokasiRak: 'R-04-A' },
    { id: 'BK017', isbn: '9786020332451', judul: 'Filsafat Ilmu Pengetahuan', pengarang: 'Jujun S. Suriasumantri', penerbit: 'Pustaka Sinar Harapan', tahunTerbit: 2015, idKategori: 'KT002', jumlahTotal: 3, lokasiRak: 'R-01-A' },
    { id: 'BK018', isbn: '9789794336677', judul: 'Logika dan Penalaran Kritis', pengarang: 'Alex Lanur', penerbit: 'Kanisius', tahunTerbit: 2017, idKategori: 'KT002', jumlahTotal: 2, lokasiRak: 'R-01-A' },
    { id: 'BK019', isbn: '9786024881122', judul: 'Pendidikan Agama dan Karakter', pengarang: 'Abdul Majid', penerbit: 'Remaja Rosdakarya', tahunTerbit: 2019, idKategori: 'KT003', jumlahTotal: 5, lokasiRak: 'R-02-A' },
    { id: 'BK020', isbn: '9789793067889', judul: 'Sejarah Peradaban Dunia', pengarang: 'Badri Yatim', penerbit: 'Rajawali Pers', tahunTerbit: 2018, idKategori: 'KT003', jumlahTotal: 4, lokasiRak: 'R-02-A' },
    { id: 'BK021', isbn: '9786020385129', judul: 'Bumi Manusia', pengarang: 'Pramoedya Ananta Toer', penerbit: 'Lentera Dipantara', tahunTerbit: 2011, idKategori: 'KT008', jumlahTotal: 9, lokasiRak: 'R-08-A' },
    { id: 'BK022', isbn: '9789794338833', judul: 'Laskar Pelangi', pengarang: 'Andrea Hirata', penerbit: 'Bentang Pustaka', tahunTerbit: 2008, idKategori: 'KT008', jumlahTotal: 7, lokasiRak: 'R-08-A' },
    { id: 'BK023', isbn: '9786020332000', judul: 'Sejarah Seni Rupa Indonesia', pengarang: 'Agus Sachari', penerbit: 'Erlangga', tahunTerbit: 2016, idKategori: 'KT008', jumlahTotal: 3, lokasiRak: 'R-08-B' },
    { id: 'BK024', isbn: '9789792201234', judul: 'Ensiklopedia Umum Nusantara', pengarang: 'Tim Redaksi', penerbit: 'Balai Pustaka', tahunTerbit: 2014, idKategori: 'KT001', jumlahTotal: 2, lokasiRak: 'R-00-A' }
  ];

  var JURUSAN = ['Teknik Informatika', 'Manajemen', 'Akuntansi', 'Ilmu Hukum', 'Sastra Inggris', 'Teknik Industri'];

  var ANGGOTA = [
    { id: 'AG001', nim: '211011400101', nama: 'Bagas Prasetyo',   jurusan: 'Teknik Informatika', angkatan: 2021, status: 'Aktif' },
    { id: 'AG002', nim: '211011400102', nama: 'Dewi Anggraini',   jurusan: 'Teknik Informatika', angkatan: 2021, status: 'Aktif' },
    { id: 'AG003', nim: '221011400203', nama: 'Rizki Ramadhan',   jurusan: 'Teknik Informatika', angkatan: 2022, status: 'Aktif' },
    { id: 'AG004', nim: '221011400204', nama: 'Nabila Syifa',     jurusan: 'Manajemen',          angkatan: 2022, status: 'Aktif' },
    { id: 'AG005', nim: '201011400305', nama: 'Fajar Nugroho',    jurusan: 'Manajemen',          angkatan: 2020, status: 'Nonaktif' },
    { id: 'AG006', nim: '231011400306', nama: 'Salsabila Putri',  jurusan: 'Akuntansi',          angkatan: 2023, status: 'Aktif' },
    { id: 'AG007', nim: '221011400207', nama: 'Andi Kurniawan',   jurusan: 'Akuntansi',          angkatan: 2022, status: 'Aktif' },
    { id: 'AG008', nim: '211011400108', nama: 'Maulana Hakim',    jurusan: 'Ilmu Hukum',         angkatan: 2021, status: 'Diblokir' },
    { id: 'AG009', nim: '231011400309', nama: 'Citra Amelia',     jurusan: 'Ilmu Hukum',         angkatan: 2023, status: 'Aktif' },
    { id: 'AG010', nim: '201011400310', nama: 'Yoga Pratama',     jurusan: 'Sastra Inggris',     angkatan: 2020, status: 'Aktif' },
    { id: 'AG011', nim: '221011400211', nama: 'Intan Permata',    jurusan: 'Sastra Inggris',     angkatan: 2022, status: 'Aktif' },
    { id: 'AG012', nim: '231011400312', nama: 'Hendra Wijaya',    jurusan: 'Teknik Industri',    angkatan: 2023, status: 'Aktif' },
    { id: 'AG013', nim: '211011400113', nama: 'Larasati Ayu',     jurusan: 'Teknik Industri',    angkatan: 2021, status: 'Aktif' },
    { id: 'AG014', nim: '221011400214', nama: 'Dimas Aryo',       jurusan: 'Teknik Informatika', angkatan: 2022, status: 'Aktif' },
    { id: 'AG015', nim: '231011400315', nama: 'Putri Maharani',   jurusan: 'Manajemen',          angkatan: 2023, status: 'Aktif' },
    { id: 'AG016', nim: '201011400316', nama: 'Reza Firmansyah',  jurusan: 'Akuntansi',          angkatan: 2020, status: 'Nonaktif' },
    { id: 'AG017', nim: '221011400217', nama: 'Alya Rahmadani',   jurusan: 'Ilmu Hukum',         angkatan: 2022, status: 'Aktif' },
    { id: 'AG018', nim: '231011400318', nama: 'Galih Saputra',    jurusan: 'Teknik Industri',    angkatan: 2023, status: 'Aktif' }
  ];

  /* Rencana 20 transaksi.
     pinjamHariKe = offset hari dari hari ini (negatif = masa lalu).
     kembaliHariKe = null bila masih dipinjam. */
  var RENCANA_PINJAM = [
    { anggota: 'AG001', buku: 'BK003', pinjamHariKe: -3,  kembaliHariKe: null },
    { anggota: 'AG002', buku: 'BK001', pinjamHariKe: -7,  kembaliHariKe: null },
    { anggota: 'AG003', buku: 'BK005', pinjamHariKe: -12, kembaliHariKe: null },
    { anggota: 'AG004', buku: 'BK011', pinjamHariKe: -6,  kembaliHariKe: null },
    { anggota: 'AG006', buku: 'BK021', pinjamHariKe: -1,  kembaliHariKe: null },
    { anggota: 'AG007', buku: 'BK010', pinjamHariKe: -15, kembaliHariKe: null },
    { anggota: 'AG009', buku: 'BK014', pinjamHariKe: -5,  kembaliHariKe: null },
    { anggota: 'AG010', buku: 'BK016', pinjamHariKe: -9,  kembaliHariKe: null },
    { anggota: 'AG011', buku: 'BK022', pinjamHariKe: -2,  kembaliHariKe: null },
    { anggota: 'AG012', buku: 'BK006', pinjamHariKe: -20, kembaliHariKe: null },
    { anggota: 'AG013', buku: 'BK007', pinjamHariKe: -4,  kembaliHariKe: null },
    { anggota: 'AG014', buku: 'BK002', pinjamHariKe: -30, kembaliHariKe: -25 },
    { anggota: 'AG015', buku: 'BK012', pinjamHariKe: -28, kembaliHariKe: -22 },
    { anggota: 'AG017', buku: 'BK019', pinjamHariKe: -45, kembaliHariKe: -36 },
    { anggota: 'AG018', buku: 'BK008', pinjamHariKe: -40, kembaliHariKe: -34 },
    { anggota: 'AG001', buku: 'BK015', pinjamHariKe: -60, kembaliHariKe: -52 },
    { anggota: 'AG003', buku: 'BK021', pinjamHariKe: -55, kembaliHariKe: -49 },
    { anggota: 'AG009', buku: 'BK004', pinjamHariKe: -50, kembaliHariKe: -41 },
    { anggota: 'AG012', buku: 'BK013', pinjamHariKe: -35, kembaliHariKe: -29 },
    { anggota: 'AG015', buku: 'BK022', pinjamHariKe: -70, kembaliHariKe: -63 }
  ];

  var MASA_PINJAM = 7;
  var DENDA_PER_HARI = 1000;

  function buatSeed() {
    var buku = BUKU.map(function (b) {
      return Object.assign({}, b, { jumlahTersedia: b.jumlahTotal, cover: '', sinopsis: '' });
    });

    var anggota = ANGGOTA.map(function (a, i) {
      return Object.assign({}, a, {
        email: a.nama.toLowerCase().replace(/\s+/g, '.') + '@student.unpam.ac.id',
        telepon: '08' + String(1234567890 + i * 137).slice(0, 10),
        tglDaftar: geser(-(400 - i * 13))
      });
    });

    var peminjaman = [];
    var detailPeminjaman = [];
    var denda = [];

    RENCANA_PINJAM.forEach(function (r, i) {
      var nomor = String(i + 1).padStart(3, '0');
      var tglPinjam = geser(r.pinjamHariKe);
      var tglJatuhTempo = geser(r.pinjamHariKe + MASA_PINJAM);
      var tglKembali = r.kembaliHariKe === null ? null : geser(r.kembaliHariKe);

      peminjaman.push({
        id: 'PJ' + nomor,
        idAnggota: r.anggota,
        idPetugas: i % 2 === 0 ? 'PT001' : 'PT002',
        tglPinjam: tglPinjam,
        tglJatuhTempo: tglJatuhTempo,
        tglKembali: tglKembali,
        status: tglKembali ? 'Dikembalikan' : 'Dipinjam'
      });

      detailPeminjaman.push({
        id: 'DT' + nomor,
        idPinjam: 'PJ' + nomor,
        idBuku: r.buku,
        kondisiKembali: tglKembali ? 'Baik' : null
      });

      // Kurangi stok untuk peminjaman yang masih berjalan
      if (!tglKembali) {
        var target = buku.find(function (b) { return b.id === r.buku; });
        if (target && target.jumlahTersedia > 0) target.jumlahTersedia -= 1;
      }

      // Denda untuk yang dikembalikan melewati jatuh tempo
      if (r.kembaliHariKe !== null) {
        var terlambat = r.kembaliHariKe - (r.pinjamHariKe + MASA_PINJAM);
        if (terlambat > 0) {
          denda.push({
            id: 'DN' + nomor,
            idPinjam: 'PJ' + nomor,
            hariTerlambat: terlambat,
            nominal: terlambat * DENDA_PER_HARI,
            statusBayar: 'Lunas'
          });
        }
      }
    });

    /* Tren 12 bulan terakhir untuk grafik dashboard. Indeks 11 = bulan ini. */
    var JUMLAH_TREN = [38, 45, 41, 52, 47, 58, 63, 55, 61, 72, 68, 74];
    var trenBulanan = JUMLAH_TREN.map(function (jml, i) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      return {
        bulan: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        peminjaman: jml,
        pengembalian: Math.max(0, jml - (i === 11 ? 12 : 3))
      };
    });

    return {
      petugas: PETUGAS,
      kategori: KATEGORI,
      buku: buku,
      anggota: anggota,
      peminjaman: peminjaman,
      detailPeminjaman: detailPeminjaman,
      denda: denda,
      trenBulanan: trenBulanan
    };
  }

  return { buatSeed: buatSeed, MASA_PINJAM: MASA_PINJAM, DENDA_PER_HARI: DENDA_PER_HARI };
})();
