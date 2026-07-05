const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const toStringValue = value => String(value ?? '').trim();

const toOptionalString = value => {
  if (Array.isArray(value)) {
    const text = value.map(item => String(item).trim()).filter(Boolean).join(', ');
    return text || null;
  }

  const text = String(value ?? '').trim();
  return text || null;
};

const toNumber = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let normalized = String(value ?? '').trim().replace(/\s/g, '');
  if (!normalized) return 0;

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }

  normalized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFloat = value => toNumber(value);
const toInt = value => Math.trunc(toNumber(value));

const toOptionalInt = value => {
  if (value === '' || value === null || value === undefined) return null;
  return toInt(value);
};

const toDateOrNull = value => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const TENAGA_KERJA_FIELDS = [
  'tenaga_kerja_tetap_laki_laki',
  'tenaga_kerja_tetap_perempuan',
  'tenaga_kerja_tidak_tetap_laki_laki',
  'tenaga_kerja_tidak_tetap_perempuan',
  'tenaga_kerja_keluarga_laki_laki',
  'tenaga_kerja_keluarga_perempuan',
  'tenaga_kerja_tetap_laki_laki_2',
  'tenaga_kerja_tetap_perempuan_2',
  'tenaga_kerja_tidak_tetap_laki_laki_2',
  'tenaga_kerja_tidak_tetap_perempuan_2',
];

const buildPayload = body => {
  const totalBulanProduksi = toFloat(body.jumlah_total_bulan_produksi_per_tahun);
  const hariProduksiPerBulan = toFloat(body.jumlah_hari_produksi_per_bulan);

  const multiplier =
    body.periode_produksi === 'Harian'
      ? totalBulanProduksi * hariProduksiPerBulan
      : body.periode_produksi === 'Bulanan'
        ? totalBulanProduksi
        : 0;

  const biayaProduksiPerTahun =
    toFloat(body.biaya_produksi_per_periode_rp) * multiplier;
  const kapasitasPerTahun =
    toFloat(body.kapasitas_per_periode_kg) * multiplier;
  const hasilProduksiPerTahun =
    toFloat(body.hasil_produksi_per_periode_kg) * multiplier;
  const nilaiHasilProduksiPerTahun =
    hasilProduksiPerTahun * toFloat(body.harga_jual_rp_kg);

  const totalTenagaKerja = TENAGA_KERJA_FIELDS.reduce(
    (total, key) => total + toInt(body[key]),
    0,
  );

  return {
    tahun: toInt(body.tahun),
    jenis_kegiatan: toStringValue(body.jenis_kegiatan),
    skala_usaha: toStringValue(body.skala_usaha),
    jenis_kegiatan_pengolahan:
      body.jenis_kegiatan === 'Pengolahan'
        ? toOptionalString(body.jenis_kegiatan_pengolahan)
        : null,
    jenis_kegiatan_pemasaran:
      body.jenis_kegiatan === 'Pemasaran'
        ? toOptionalString(body.jenis_kegiatan_pemasaran)
        : null,

    nama_upi: toStringValue(body.nama_upi),
    alamat: toStringValue(body.alamat),
    desa: toStringValue(body.desa),
    kecamatan: toStringValue(body.kecamatan),
    kabupaten_kota: toStringValue(body.kabupaten_kota),
    nomor_telepon: toStringValue(body.nomor_telepon),
    tahun_berdiri: toOptionalInt(body.tahun_berdiri),

    perizinan: toOptionalString(body.perizinan),
    nama_pemilik: toStringValue(body.nama_pemilik),
    jenis_kelamin: toStringValue(body.jenis_kelamin),
    alamat_2: toOptionalString(body.alamat_2),
    desa_2: toOptionalString(body.desa_2),
    kecamatan_2: toOptionalString(body.kecamatan_2),
    kabupaten_kota_2: toOptionalString(body.kabupaten_kota_2),
    nomor_telepon_2: toOptionalString(body.nomor_telepon_2),

    nilai_aset_rp: toFloat(body.nilai_aset_rp),
    cold_storage_kg: toFloat(body.cold_storage_kg),
    status_cold_storage: toOptionalString(body.status_cold_storage),
    aset_cold_storage_rp: toFloat(body.aset_cold_storage_rp),
    status_lahan_usaha: toOptionalString(body.status_lahan_usaha),
    sertifikat_lahan: toOptionalString(body.sertifikat_lahan),
    luas_lahan_m2: toFloat(body.luas_lahan_m2),
    nilai_lahan_rp: toFloat(body.nilai_lahan_rp),
    sertifikat_bangunan: toOptionalString(body.sertifikat_bangunan),
    luas_bangunan_m2: toFloat(body.luas_bangunan_m2),
    nilai_bangunan_rp: toFloat(body.nilai_bangunan_rp),
    biaya_sewa_per_tahun_rp: toFloat(body.biaya_sewa_per_tahun_rp),

    jumlah_modal_sendiri_rp: toFloat(body.jumlah_modal_sendiri_rp),
    jumlah_laba_ditanam_rp: toFloat(body.jumlah_laba_ditanam_rp),
    pinjaman_modal: toOptionalString(body.pinjaman_modal),
    jumlah_pinjaman_rp: toFloat(body.jumlah_pinjaman_rp),
    pemberi_pinjaman: toOptionalString(body.pemberi_pinjaman),
    tanggal_akad_pinjaman: toDateOrNull(body.tanggal_akad_pinjaman),
    tenor_pinjaman_tahun: toFloat(body.tenor_pinjaman_tahun),

    nama_merek: toOptionalString(body.nama_merek),
    jenis_produk: toOptionalString(body.jenis_produk),
    sertifikat_umum: toOptionalString(body.sertifikat_umum),
    sertifikat_bpom: toOptionalString(body.sertifikat_bpom),
    periode_produksi: toOptionalString(body.periode_produksi),

    biaya_produksi_per_periode_rp: toFloat(body.biaya_produksi_per_periode_rp),
    biaya_lain_lain_per_periode_rp: toFloat(body.biaya_lain_lain_per_periode_rp),
    hasil_produksi_per_periode_kg: toFloat(body.hasil_produksi_per_periode_kg),
    kapasitas_per_periode_kg: toFloat(body.kapasitas_per_periode_kg),
    harga_jual_rp_kg: toFloat(body.harga_jual_rp_kg),
    bulan_produksi: toOptionalString(body.bulan_produksi),
    jumlah_total_bulan_produksi_per_tahun: totalBulanProduksi,
    jumlah_hari_produksi_per_bulan: hariProduksiPerBulan,

    biaya_produksi_per_tahun_rp: biayaProduksiPerTahun,
    kapasitas_per_tahun_kg: kapasitasPerTahun,
    hasil_produksi_per_tahun_kg: hasilProduksiPerTahun,
    nilai_hasil_produksi_per_tahun_rp: nilaiHasilProduksiPerTahun,

    nama_bahan_baku: toOptionalString(body.nama_bahan_baku),
    total_bahan_baku_per_periode_kg: toFloat(body.total_bahan_baku_per_periode_kg),
    asal_bahan_baku_kabupaten_kota: toOptionalString(body.asal_bahan_baku_kabupaten_kota),
    provinsi_asal_bahan_baku: toOptionalString(body.provinsi_asal_bahan_baku),
    asal_negara_bahan_baku: toOptionalString(body.asal_negara_bahan_baku),

    total_pemasaran_per_tahun_kg: toFloat(body.total_pemasaran_per_tahun_kg),
    pasar_dalam_kota_kab_per_tahun_kg: toFloat(body.pasar_dalam_kota_kab_per_tahun_kg),
    pasar_kota_dalam_jatim_per_tahun_kg: toFloat(body.pasar_kota_dalam_jatim_per_tahun_kg),
    pasar_luar_jatim_per_tahun_kg: toFloat(body.pasar_luar_jatim_per_tahun_kg),
    pasar_luar_negeri_per_tahun_kg: toFloat(body.pasar_luar_negeri_per_tahun_kg),
    tujuan_pemasaran_kabupaten_kota: toOptionalString(body.tujuan_pemasaran_kabupaten_kota),
    provinsi_tujuan_pemasaran: toOptionalString(body.provinsi_tujuan_pemasaran),
    negara_tujuan_pemasaran: toOptionalString(body.negara_tujuan_pemasaran),

    tenaga_kerja_tetap_laki_laki: toInt(body.tenaga_kerja_tetap_laki_laki),
    tenaga_kerja_tetap_perempuan: toInt(body.tenaga_kerja_tetap_perempuan),
    tenaga_kerja_tidak_tetap_laki_laki: toInt(body.tenaga_kerja_tidak_tetap_laki_laki),
    tenaga_kerja_tidak_tetap_perempuan: toInt(body.tenaga_kerja_tidak_tetap_perempuan),
    tenaga_kerja_keluarga_laki_laki: toInt(body.tenaga_kerja_keluarga_laki_laki),
    tenaga_kerja_keluarga_perempuan: toInt(body.tenaga_kerja_keluarga_perempuan),
    tenaga_kerja_tetap_laki_laki_2: toInt(body.tenaga_kerja_tetap_laki_laki_2),
    tenaga_kerja_tetap_perempuan_2: toInt(body.tenaga_kerja_tetap_perempuan_2),
    tenaga_kerja_tidak_tetap_laki_laki_2: toInt(body.tenaga_kerja_tidak_tetap_laki_laki_2),
    tenaga_kerja_tidak_tetap_perempuan_2: toInt(body.tenaga_kerja_tidak_tetap_perempuan_2),
    total_seluruh_tenaga_kerja: totalTenagaKerja,
  };
};

const getAllData = async (req, res) => {
  try {
    const { tahun, kabupaten_kota, jenis_kegiatan, skala_usaha } = req.query;
    const where = { status: 'APPROVED' };

    if (tahun) where.tahun = toInt(tahun);
    if (kabupaten_kota) where.kabupaten_kota = kabupaten_kota;
    if (jenis_kegiatan) where.jenis_kegiatan = jenis_kegiatan;
    if (skala_usaha) where.skala_usaha = skala_usaha;

    const data = await prisma.pengolahanPemasaran.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pengolahan pemasaran data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data = await prisma.pengolahanPemasaran.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pengolahan pemasaran admin data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { tahun, kabupaten_kota, jenis_kegiatan, skala_usaha } = req.query;
    const where = { status: 'APPROVED' };

    if (tahun) where.tahun = toInt(tahun);
    if (kabupaten_kota) where.kabupaten_kota = kabupaten_kota;
    if (jenis_kegiatan) where.jenis_kegiatan = jenis_kegiatan;
    if (skala_usaha) where.skala_usaha = skala_usaha;

    const data = await prisma.pengolahanPemasaran.findMany({ where });

    const kpi = {
      total_unit_usaha: data.length,
      total_produksi_kg: 0,
      total_nilai_produksi_rp: 0,
      total_pemasaran_kg: 0,
      total_tenaga_kerja: 0,
    };

    const kabupatenMap = {};
    const jenisKegiatanMap = {};
    const jenisPengolahanMap = {};
    const jenisPemasaranMap = {};
    const skalaUsahaMap = {};

    const distribusiPemasaran = {
      dalam_kota_kab: 0,
      kota_dalam_jatim: 0,
      luar_jatim: 0,
      luar_negeri: 0,
    };

    const tenagaKerja = {
      tetap_laki_laki: 0,
      tetap_perempuan: 0,
      tidak_tetap_laki_laki: 0,
      tidak_tetap_perempuan: 0,
      keluarga_laki_laki: 0,
      keluarga_perempuan: 0,
      tetap_laki_laki_2: 0,
      tetap_perempuan_2: 0,
      tidak_tetap_laki_laki_2: 0,
      tidak_tetap_perempuan_2: 0,
    };

    data.forEach(item => {
      kpi.total_produksi_kg += item.hasil_produksi_per_tahun_kg || 0;
      kpi.total_nilai_produksi_rp += item.nilai_hasil_produksi_per_tahun_rp || 0;
      kpi.total_pemasaran_kg += item.total_pemasaran_per_tahun_kg || 0;
      kpi.total_tenaga_kerja += item.total_seluruh_tenaga_kerja || 0;

      if (!kabupatenMap[item.kabupaten_kota]) {
        kabupatenMap[item.kabupaten_kota] = {
          name: item.kabupaten_kota,
          jumlah_unit: 0,
          produksi_kg: 0,
          nilai_produksi_rp: 0,
          pemasaran_kg: 0,
          tenaga_kerja: 0,
        };
      }

      kabupatenMap[item.kabupaten_kota].jumlah_unit += 1;
      kabupatenMap[item.kabupaten_kota].produksi_kg += item.hasil_produksi_per_tahun_kg || 0;
      kabupatenMap[item.kabupaten_kota].nilai_produksi_rp += item.nilai_hasil_produksi_per_tahun_rp || 0;
      kabupatenMap[item.kabupaten_kota].pemasaran_kg += item.total_pemasaran_per_tahun_kg || 0;
      kabupatenMap[item.kabupaten_kota].tenaga_kerja += item.total_seluruh_tenaga_kerja || 0;

      if (item.jenis_kegiatan) {
        jenisKegiatanMap[item.jenis_kegiatan] =
          (jenisKegiatanMap[item.jenis_kegiatan] || 0) + 1;
      }

      if (item.jenis_kegiatan_pengolahan) {
        jenisPengolahanMap[item.jenis_kegiatan_pengolahan] =
          (jenisPengolahanMap[item.jenis_kegiatan_pengolahan] || 0) + 1;
      }

      if (item.jenis_kegiatan_pemasaran) {
        jenisPemasaranMap[item.jenis_kegiatan_pemasaran] =
          (jenisPemasaranMap[item.jenis_kegiatan_pemasaran] || 0) + 1;
      }

      if (item.skala_usaha) {
        skalaUsahaMap[item.skala_usaha] =
          (skalaUsahaMap[item.skala_usaha] || 0) + 1;
      }

      distribusiPemasaran.dalam_kota_kab += item.pasar_dalam_kota_kab_per_tahun_kg || 0;
      distribusiPemasaran.kota_dalam_jatim += item.pasar_kota_dalam_jatim_per_tahun_kg || 0;
      distribusiPemasaran.luar_jatim += item.pasar_luar_jatim_per_tahun_kg || 0;
      distribusiPemasaran.luar_negeri += item.pasar_luar_negeri_per_tahun_kg || 0;

      tenagaKerja.tetap_laki_laki += item.tenaga_kerja_tetap_laki_laki || 0;
      tenagaKerja.tetap_perempuan += item.tenaga_kerja_tetap_perempuan || 0;
      tenagaKerja.tidak_tetap_laki_laki += item.tenaga_kerja_tidak_tetap_laki_laki || 0;
      tenagaKerja.tidak_tetap_perempuan += item.tenaga_kerja_tidak_tetap_perempuan || 0;
      tenagaKerja.keluarga_laki_laki += item.tenaga_kerja_keluarga_laki_laki || 0;
      tenagaKerja.keluarga_perempuan += item.tenaga_kerja_keluarga_perempuan || 0;
      tenagaKerja.tetap_laki_laki_2 += item.tenaga_kerja_tetap_laki_laki_2 || 0;
      tenagaKerja.tetap_perempuan_2 += item.tenaga_kerja_tetap_perempuan_2 || 0;
      tenagaKerja.tidak_tetap_laki_laki_2 += item.tenaga_kerja_tidak_tetap_laki_laki_2 || 0;
      tenagaKerja.tidak_tetap_perempuan_2 += item.tenaga_kerja_tidak_tetap_perempuan_2 || 0;
    });

    const mapToArray = map =>
      Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      stats: {
        kpi,
        produksiPerKabupaten: Object.values(kabupatenMap).sort(
          (a, b) => b.produksi_kg - a.produksi_kg,
        ),
        komposisiJenisKegiatan: mapToArray(jenisKegiatanMap),
        komposisiJenisPengolahan: mapToArray(jenisPengolahanMap),
        komposisiJenisPemasaran: mapToArray(jenisPemasaranMap),
        komposisiSkalaUsaha: mapToArray(skalaUsahaMap),
        distribusiPemasaran: [
          { name: 'Dalam Kota/Kabupaten', value: distribusiPemasaran.dalam_kota_kab },
          { name: 'Kota Dalam Jawa Timur', value: distribusiPemasaran.kota_dalam_jatim },
          { name: 'Luar Jawa Timur', value: distribusiPemasaran.luar_jatim },
          { name: 'Luar Negeri', value: distribusiPemasaran.luar_negeri },
        ],
        tenagaKerja: [
          { name: 'Tetap Laki-Laki', value: tenagaKerja.tetap_laki_laki },
          { name: 'Tetap Perempuan', value: tenagaKerja.tetap_perempuan },
          { name: 'Tidak Tetap Laki-Laki', value: tenagaKerja.tidak_tetap_laki_laki },
          { name: 'Tidak Tetap Perempuan', value: tenagaKerja.tidak_tetap_perempuan },
          { name: 'Keluarga Laki-Laki', value: tenagaKerja.keluarga_laki_laki },
          { name: 'Keluarga Perempuan', value: tenagaKerja.keluarga_perempuan },
          { name: 'Tetap Laki-Laki 2', value: tenagaKerja.tetap_laki_laki_2 },
          { name: 'Tetap Perempuan 2', value: tenagaKerja.tetap_perempuan_2 },
          { name: 'Tidak Tetap Laki-Laki 2', value: tenagaKerja.tidak_tetap_laki_laki_2 },
          { name: 'Tidak Tetap Perempuan 2', value: tenagaKerja.tidak_tetap_perempuan_2 },
        ],
      },
    });
  } catch (error) {
    console.error('Error generating pengolahan pemasaran stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * Endpoint khusus untuk Dashboard Pengolahan & Pemasaran (peta, bar chart, tren bulanan,
 * treemap, dan heatmap). Dibuat terpisah dari getStats() supaya kontrak getStats() lama
 * yang mungkin sudah dipakai di halaman lain tidak berubah.
 *
 * Query params yang didukung: tahun, bulan, kabupaten_kota, jenis_kegiatan, skala_usaha
 */
const getDashboardStats = async (req, res) => {
  try {
    const { tahun, bulan, kabupaten_kota, jenis_kegiatan, skala_usaha } = req.query;
    const where = { status: 'APPROVED' };

    if (tahun) where.tahun = toInt(tahun);
    if (kabupaten_kota) where.kabupaten_kota = kabupaten_kota;
    if (jenis_kegiatan) where.jenis_kegiatan = jenis_kegiatan;
    if (skala_usaha) where.skala_usaha = skala_usaha;

    // Ambil data tahunan penuh (dipakai untuk tren bulanan & heatmap agar konteks 12 bulan tetap utuh)
    const data = await prisma.pengolahanPemasaran.findMany({ where });

    // Untuk KPI, peta, bar chart, dan treemap: bisa difilter tambahan per bulan produksi aktif
    const filteredByBulan = bulan
      ? data.filter(item =>
          (item.bulan_produksi || '')
            .split(',')
            .map(b => b.trim())
            .includes(bulan),
        )
      : data;

    // 1. KPI + agregasi jenis produk (dipakai juga untuk top5Jenis)
    let totalVolume = 0;
    let totalNilai = 0;
    const jenisProdukVolume = {};
    const upiSet = new Set();

    filteredByBulan.forEach(item => {
      totalVolume += item.hasil_produksi_per_tahun_kg || 0;
      totalNilai += item.nilai_hasil_produksi_per_tahun_rp || 0;

      if (item.jenis_produk) {
        jenisProdukVolume[item.jenis_produk] =
          (jenisProdukVolume[item.jenis_produk] || 0) + (item.hasil_produksi_per_tahun_kg || 0);
      }

      if (item.nama_upi) {
        upiSet.add(`${item.nama_upi}__${item.kabupaten_kota}`);
      }
    });

    const topJenisProdukEntry = Object.entries(jenisProdukVolume).sort((a, b) => b[1] - a[1])[0];

    const kpi = {
      total_volume: totalVolume,
      top_jenis_produk: topJenisProdukEntry ? topJenisProdukEntry[0] : '-',
      total_nilai: totalNilai,
      total_upi: upiSet.size,
    };

    // 2. Produksi & Nilai per Kabupaten/Kota -> untuk peta choropleth & bar chart Top 10
    const kabupatenMap = {};
    filteredByBulan.forEach(item => {
      if (!item.kabupaten_kota) return;
      if (!kabupatenMap[item.kabupaten_kota]) {
        kabupatenMap[item.kabupaten_kota] = { name: item.kabupaten_kota, produksi: 0, nilai: 0 };
      }
      kabupatenMap[item.kabupaten_kota].produksi += item.hasil_produksi_per_tahun_kg || 0;
      kabupatenMap[item.kabupaten_kota].nilai += item.nilai_hasil_produksi_per_tahun_rp || 0;
    });
    const produksiPerKabupaten = Object.values(kabupatenMap).sort((a, b) => b.produksi - a.produksi);

    // 3. Top 5 Jenis Produk (untuk legend tren bulanan)
    const top5Jenis = Object.entries(jenisProdukVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // 4. Tren Bulanan: hasil_produksi_per_tahun_kg didistribusikan rata ke setiap bulan_produksi yang aktif
    const trenBulananMap = {};
    MONTHS.forEach(bulanName => {
      trenBulananMap[bulanName] = { bulan: bulanName, Lainnya: 0 };
      top5Jenis.forEach(jenis => {
        trenBulananMap[bulanName][jenis] = 0;
      });
    });

    data.forEach(item => {
      const bulanAktif = (item.bulan_produksi || '')
        .split(',')
        .map(b => b.trim())
        .filter(b => MONTHS.includes(b));

      if (!bulanAktif.length) return;

      const volumePerBulan = (item.hasil_produksi_per_tahun_kg || 0) / bulanAktif.length;
      const targetKey =
        item.jenis_produk && top5Jenis.includes(item.jenis_produk) ? item.jenis_produk : 'Lainnya';

      bulanAktif.forEach(bulanName => {
        trenBulananMap[bulanName][targetKey] =
          (trenBulananMap[bulanName][targetKey] || 0) + volumePerBulan;
      });
    });

    const trenBulanan = MONTHS.map(bulanName => trenBulananMap[bulanName]);

    // 5. Komposisi Jenis Kegiatan (treemap): gabungan jenis_kegiatan_pengolahan & jenis_kegiatan_pemasaran
    const komposisiMap = {};
    filteredByBulan.forEach(item => {
      const label =
        item.jenis_kegiatan === 'Pengolahan'
          ? item.jenis_kegiatan_pengolahan
          : item.jenis_kegiatan_pemasaran;

      if (!label) return;

      const value =
        item.jenis_kegiatan === 'Pengolahan'
          ? item.hasil_produksi_per_tahun_kg || 0
          : item.total_pemasaran_per_tahun_kg || 0;

      komposisiMap[label] = (komposisiMap[label] || 0) + value;
    });

    const komposisiKegiatan = Object.entries(komposisiMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 6. Heatmap Kabupaten x Bulan (dinormalisasi per kabupaten terhadap titik tertinggi kabupaten itu sendiri)
    const heatmapRaw = {}; // { kabupaten: { bulan: totalKg } }

    data.forEach(item => {
      if (!item.kabupaten_kota) return;
      const bulanAktif = (item.bulan_produksi || '')
        .split(',')
        .map(b => b.trim())
        .filter(b => MONTHS.includes(b));

      if (!bulanAktif.length) return;

      const volumePerBulan = (item.hasil_produksi_per_tahun_kg || 0) / bulanAktif.length;

      if (!heatmapRaw[item.kabupaten_kota]) heatmapRaw[item.kabupaten_kota] = {};

      bulanAktif.forEach(bulanName => {
        heatmapRaw[item.kabupaten_kota][bulanName] =
          (heatmapRaw[item.kabupaten_kota][bulanName] || 0) + volumePerBulan;
      });
    });

    const heatmapData = [];
    Object.entries(heatmapRaw).forEach(([kabupaten, bulanValues]) => {
      const maxInKabupaten = Math.max(...Object.values(bulanValues), 0);
      MONTHS.forEach(bulanName => {
        const produksi = bulanValues[bulanName] || 0;
        heatmapData.push({
          kabupaten,
          bulan: bulanName,
          produksi,
          normalized: maxInKabupaten > 0 ? produksi / maxInKabupaten : 0,
        });
      });
    });

    res.json({
      success: true,
      stats: {
        kpi,
        produksiPerKabupaten,
        trenBulanan,
        top5Jenis,
        komposisiKegiatan,
        heatmapData,
      },
    });
  } catch (error) {
    console.error('Error generating pengolahan pemasaran dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createData = async (req, res) => {
  try {
    const data = await prisma.pengolahanPemasaran.create({
      data: {
        status: 'PENDING',
        ...buildPayload(req.body),
      },
    });

    res.status(201).json({
      success: true,
      data,
      message: 'Data berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating pengolahan pemasaran data:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;

    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Admin Pusat yang dapat menyetujui/menolak data',
      });
    }

    const allowedStatuses = ['APPROVED_BIDANG', 'APPROVED', 'REJECTED'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const existing = await prisma.pengolahanPemasaran.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    if (existing.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Data sudah selesai divalidasi Program',
      });
    }

    if (existing.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Data yang ditolak harus diperbaiki terlebih dahulu',
      });
    }

    if (status === 'APPROVED_BIDANG' && existing.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Validasi Bidang hanya bisa dilakukan pada data berstatus PENDING',
      });
    }

    if (status === 'APPROVED' && existing.status !== 'APPROVED_BIDANG') {
      return res.status(400).json({
        success: false,
        message: 'Data harus divalidasi Bidang terlebih dahulu sebelum Validasi Program',
      });
    }

    if (status === 'REJECTED' && !String(alasan_penolakan ?? '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan wajib diisi',
      });
    }

    const updated = await prisma.pengolahanPemasaran.update({
      where: { id: parseInt(id, 10) },
      data: {
        status,
        alasan_penolakan:
          status === 'REJECTED' ? String(alasan_penolakan).trim() : null,
      },
    });

    res.json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating pengolahan pemasaran status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const deleteData = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pengolahanPemasaran.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    if (existing.status === 'APPROVED' && req.user && req.user.role === 'admin_cabang') {
      return res.status(403).json({
        success: false,
        message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui Pusat',
      });
    }

    await prisma.pengolahanPemasaran.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting pengolahan pemasaran data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getAllData,
  getAdminData,
  getStats,
  getDashboardStats,
  createData,
  updateData,
  deleteData,
  updateStatus,
};