const prisma = require('../utils/prisma');
const ExcelJS = require('exceljs');

// Gunakan model rekap bila model lama dan model rekap sama-sama tersedia.
const pengolahanPemasaranDb =
  prisma.statistikPengolahanPemasaran ||
  prisma.pengolahanPemasaranRekap ||
  prisma.pengolahanPemasaran;

if (!pengolahanPemasaranDb) {
  throw new Error(
    'Model Prisma Pengolahan dan Pemasaran tidak ditemukan.',
  );
}

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

const toInt = value => Math.trunc(toNumber(value));
const toFloat = value => toNumber(value);

const normalizeKategori = value =>
  String(value ?? '').trim().toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

const normalizeText = value => String(value ?? '').trim();
const normalizeKabupaten = value => normalizeText(value).toUpperCase();

const REKAP_INT_FIELDS = [
  'jumlah_unit_usaha',
  'shm_count',
  'non_shm_count',
  'sertifikat_haccp',
  'sertifikat_sni',
  'sertifikat_halal',
  'sertifikat_skp',
  'sertifikat_pirt',
  'sertifikat_md',
  'sertifikat_lainnya',
  'izin_nib',
  'izin_npwp',
  'izin_kusuka',
  'izin_menkumham',
  'izin_akta_pendirian',
  'izin_imb',
  'izin_lokasi_domisili',
  'izin_siup_perikanan',
  'izin_siup_perdagangan',
  'izin_lainnya',
];

const REKAP_FLOAT_FIELDS = ['hasil_kg', 'hasil_rp', 'modal_rp'];

const buildPayload = body => {
  const payload = {
    tahun: toInt(body.tahun),
    kabupaten_kota: normalizeKabupaten(body.kabupaten_kota),
    kategori_kegiatan: normalizeKategori(body.kategori_kegiatan),
    jenis_kegiatan: normalizeText(body.jenis_kegiatan),
    skala_usaha: normalizeText(body.skala_usaha),
  };

  REKAP_INT_FIELDS.forEach(field => {
    payload[field] = Math.max(0, toInt(body[field]));
  });

  REKAP_FLOAT_FIELDS.forEach(field => {
    payload[field] = Math.max(0, toFloat(body[field]));
  });

  return payload;
};

const validatePayload = payload => {
  if (!payload.tahun) return 'Tahun wajib diisi';
  if (!payload.kabupaten_kota) return 'Kabupaten/Kota wajib dipilih';
  if (!payload.kategori_kegiatan) return 'Kategori kegiatan wajib dipilih';
  if (!payload.jenis_kegiatan) return 'Jenis kegiatan wajib dipilih';
  if (!payload.skala_usaha) return 'Skala usaha wajib dipilih';
  return null;
};

const buildDuplicateWhere = (
  payload,
  excludedId = null,
) => ({
  tahun: payload.tahun,
  kabupaten_kota: payload.kabupaten_kota,
  kategori_kegiatan: payload.kategori_kegiatan,
  jenis_kegiatan: payload.jenis_kegiatan,
  skala_usaha: payload.skala_usaha,

  ...(excludedId
    ? {
        id: {
          not: excludedId,
        },
      }
    : {}),
});

const buildPublicWhere = query => {
  const where = { status: 'VERIFIED' };

  if (query.tahun) where.tahun = toInt(query.tahun);
  if (query.kabupaten_kota) where.kabupaten_kota = query.kabupaten_kota;
  if (query.skala_usaha) where.skala_usaha = query.skala_usaha;

  if (query.kategori_kegiatan) {
    where.kategori_kegiatan = normalizeKategori(query.kategori_kegiatan);
  }

  if (query.jenis_kegiatan) {
    const value = normalizeText(query.jenis_kegiatan);
    if (['Pengolahan', 'Pemasaran'].includes(normalizeKategori(value)) && /^(pengolahan|pemasaran)$/i.test(value)) {
      where.kategori_kegiatan = normalizeKategori(value);
    } else {
      where.jenis_kegiatan = value;
    }
  }

  return where;
};

const getAllData = async (req, res) => {
  try {
    const data = await pengolahanPemasaranDb.findMany({
      where: buildPublicWhere(req.query),
      orderBy: [{ tahun: 'desc' }, { kabupaten_kota: 'asc' }, { jenis_kegiatan: 'asc' }],
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pengolahan pemasaran data:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data = await pengolahanPemasaranDb.findMany({
      orderBy: [{ created_at: 'desc' }],
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pengolahan pemasaran admin data:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const mapToSortedArray = map =>
  [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

const getStats = async (req, res) => {
  try {
    const data = await pengolahanPemasaranDb.findMany({
      where: buildPublicWhere(req.query),
    });

    const kpi = {
      total_unit_usaha: 0,
      total_produksi_kg: 0,
      total_nilai_produksi_rp: 0,
      total_modal_rp: 0,
    };

    const kabupatenMap = new Map();
    const kategoriMap = new Map();
    const pengolahanMap = new Map();
    const pemasaranMap = new Map();
    const skalaMap = new Map();

    data.forEach(item => {
      const jumlahUnit = toInt(item.jumlah_unit_usaha);
      const hasilKg = toFloat(item.hasil_kg);
      const hasilRp = toFloat(item.hasil_rp);
      const modalRp = toFloat(item.modal_rp);
      const kategori = normalizeKategori(item.kategori_kegiatan);

      kpi.total_unit_usaha += jumlahUnit;
      kpi.total_produksi_kg += hasilKg;
      kpi.total_nilai_produksi_rp += hasilRp;
      kpi.total_modal_rp += modalRp;

      if (!kabupatenMap.has(item.kabupaten_kota)) {
        kabupatenMap.set(item.kabupaten_kota, {
          name: item.kabupaten_kota,
          jumlah_unit: 0,
          produksi_kg: 0,
          nilai_produksi_rp: 0,
          modal_rp: 0,
        });
      }

      const wilayah = kabupatenMap.get(item.kabupaten_kota);
      wilayah.jumlah_unit += jumlahUnit;
      wilayah.produksi_kg += hasilKg;
      wilayah.nilai_produksi_rp += hasilRp;
      wilayah.modal_rp += modalRp;

      kategoriMap.set(kategori, (kategoriMap.get(kategori) || 0) + jumlahUnit);
      skalaMap.set(item.skala_usaha, (skalaMap.get(item.skala_usaha) || 0) + jumlahUnit);

      const targetMap = kategori === 'Pemasaran' ? pemasaranMap : pengolahanMap;
      targetMap.set(item.jenis_kegiatan, (targetMap.get(item.jenis_kegiatan) || 0) + jumlahUnit);
    });

    return res.json({
      success: true,
      stats: {
        kpi,
        produksiPerKabupaten: [...kabupatenMap.values()].sort(
          (a, b) => b.produksi_kg - a.produksi_kg,
        ),
        komposisiJenisKegiatan: mapToSortedArray(kategoriMap),
        komposisiJenisPengolahan: mapToSortedArray(pengolahanMap),
        komposisiJenisPemasaran: mapToSortedArray(pemasaranMap),
        komposisiSkalaUsaha: mapToSortedArray(skalaMap),
        distribusiPemasaran: [],
        tenagaKerja: [],
      },
    });
  } catch (error) {
    console.error('Error generating pengolahan pemasaran stats:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const data = await pengolahanPemasaranDb.findMany({
      where: buildPublicWhere(req.query),
    });

    const kabupatenMap = new Map();
    const kegiatanMap = new Map();
    let totalVolume = 0;
    let totalNilai = 0;
    let totalUnit = 0;

    data.forEach(item => {
      const hasilKg = toFloat(item.hasil_kg);
      const hasilRp = toFloat(item.hasil_rp);
      const jumlahUnit = toInt(item.jumlah_unit_usaha);

      totalVolume += hasilKg;
      totalNilai += hasilRp;
      totalUnit += jumlahUnit;

      if (!kabupatenMap.has(item.kabupaten_kota)) {
        kabupatenMap.set(item.kabupaten_kota, {
          name: item.kabupaten_kota,
          produksi: 0,
          nilai: 0,
          upi: 0,
        });
      }

      const wilayah = kabupatenMap.get(item.kabupaten_kota);
      wilayah.produksi += hasilKg;
      wilayah.nilai += hasilRp;
      wilayah.upi += jumlahUnit;

      if (!kegiatanMap.has(item.jenis_kegiatan)) {
        kegiatanMap.set(item.jenis_kegiatan, {
          name: item.jenis_kegiatan,
          value: 0,
          produksi: 0,
          nilai: 0,
        });
      }

      const kegiatan = kegiatanMap.get(item.jenis_kegiatan);
      kegiatan.value += jumlahUnit;
      kegiatan.produksi += hasilKg;
      kegiatan.nilai += hasilRp;
    });

    const kegiatan = [...kegiatanMap.values()].sort((a, b) => b.produksi - a.produksi);
    const topKegiatan = kegiatan[0]?.name || '-';

    return res.json({
      success: true,
      stats: {
        kpi: {
          total_volume: totalVolume,
          top_jenis_produk: topKegiatan,
          total_nilai: totalNilai,
          total_upi: totalUnit,
        },
        produksiPerKabupaten: [...kabupatenMap.values()].sort(
          (a, b) => b.produksi - a.produksi,
        ),
        trenBulanan: [],
        top5Jenis: kegiatan.slice(0, 5).map(item => item.name),
        komposisiKegiatan: kegiatan,
        heatmapData: [],
      },
    });
  } catch (error) {
    console.error('Error generating pengolahan pemasaran dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createData = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const duplicate = await pengolahanPemasaranDb.findFirst({
      where: buildDuplicateWhere(payload),
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          'Data dengan tahun, kabupaten/kota, jenis kegiatan, dan skala usaha tersebut sudah tersedia.',
      });
    }

    const data = await pengolahanPemasaranDb.create({
      data: {
        ...payload,
        status: 'APPROVED',
        alasan_penolakan: null,
      },
    });

    return res.status(201).json({
      success: true,
      data,
      message: 'Data berhasil ditambahkan dengan status APPROVED',
    });
  } catch (error) {
    console.error(
      'Error creating pengolahan pemasaran data:',
      error,
    );

    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message:
          'Data dengan tahun, kabupaten/kota, jenis kegiatan, dan skala usaha tersebut sudah tersedia.',
      });
    }

    if (error?.code === 'P2022') {
      return res.status(500).json({
        success: false,
        message:
          'Struktur database belum sesuai dengan Prisma Schema.',
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Gagal menyimpan data pengolahan dan pemasaran.',
      error: error?.message,
    });
  }
};


// ============================================================================
// EXPORT EXCEL PENGOLAHAN DAN PEMASARAN
// Generator workbook berada di backend menggunakan ExcelJS, sama seperti
// modul Budidaya. Warna, isi, format angka, dan struktur sheet mengikuti
// ekspor frontend sebelumnya.
// ============================================================================

const KABUPATEN_KOTA_EXPORT_OPTIONS = [
  'KAB. PACITAN',
  'KAB. PONOROGO',
  'KAB. TRENGGALEK',
  'KAB. TULUNGAGUNG',
  'KAB. BLITAR',
  'KAB. KEDIRI',
  'KAB. MALANG',
  'KAB. LUMAJANG',
  'KAB. JEMBER',
  'KAB. BANYUWANGI',
  'KAB. BONDOWOSO',
  'KAB. SITUBONDO',
  'KAB. PROBOLINGGO',
  'KAB. PASURUAN',
  'KAB. SIDOARJO',
  'KAB. MOJOKERTO',
  'KAB. JOMBANG',
  'KAB. NGANJUK',
  'KAB. MADIUN',
  'KAB. MAGETAN',
  'KAB. NGAWI',
  'KAB. BOJONEGORO',
  'KAB. TUBAN',
  'KAB. LAMONGAN',
  'KAB. GRESIK',
  'KAB. BANGKALAN',
  'KAB. SAMPANG',
  'KAB. PAMEKASAN',
  'KAB. SUMENEP',
  'KOTA KEDIRI',
  'KOTA BLITAR',
  'KOTA MALANG',
  'KOTA PROBOLINGGO',
  'KOTA PASURUAN',
  'KOTA MOJOKERTO',
  'KOTA MADIUN',
  'KOTA SURABAYA',
  'KOTA BATU',
];

const JENIS_PENGOLAHAN_EXPORT_OPTIONS = [
  'Fermentasi',
  'Pelumatan Daging Ikan',
  'Pembekuan',
  'Pengalengan',
  'Penanganan Produk Segar',
  'Pengasapan/Pemanggangan',
  'Penggaraman/Pengeringan',
  'Pemindangan',
  'Pereduksian/Ekstraksi',
  'Pengolahan Lainnya',
];

const JENIS_PEMASARAN_EXPORT_OPTIONS = [
  'Pengecer',
  'Pengumpul/ Pedagang Besar/ Distributor',
];

const SERTIFIKAT_PRODUK_FIELDS_EXPORT = [
  ['HACCP', 'sertifikat_haccp'],
  ['SNI', 'sertifikat_sni'],
  ['HALAL', 'sertifikat_halal'],
  ['SKP', 'sertifikat_skp'],
  ['PIRT', 'sertifikat_pirt'],
  ['MD', 'sertifikat_md'],
  ['Lain-lain', 'sertifikat_lainnya'],
];

const IZIN_USAHA_FIELDS_EXPORT = [
  ['NIB', 'izin_nib'],
  ['NPWP', 'izin_npwp'],
  ['KUSUKA', 'izin_kusuka'],
  ['Pengesahan MENKUMHAM', 'izin_menkumham'],
  ['Akta Pendirian Usaha', 'izin_akta_pendirian'],
  ['Lokasi/Domisili', 'izin_lokasi_domisili'],
  ['IMB', 'izin_imb'],
  ['SIUP Perikanan', 'izin_siup_perikanan'],
  ['SIUP Perdagangan', 'izin_siup_perdagangan'],
  ['Lain-lain', 'izin_lainnya'],
];

const SERTIFIKAT_LB_FIELDS_EXPORT = [
  ['SHM', 'shm_count'],
  ['Non-SHM', 'non_shm_count'],
];

const SKALA_EXPORT_OPTIONS = ['Mikro', 'Kecil', 'Menengah', 'Besar'];

const KEGIATAN_EXPORT_OPTIONS = [
  ...JENIS_PENGOLAHAN_EXPORT_OPTIONS,
  ...JENIS_PEMASARAN_EXPORT_OPTIONS,
];


// Sumber utama opsi rekap adalah Master Data. Konstanta di atas hanya fallback
// agar ekspor tetap dapat berjalan bila tabel master_data belum terisi.
const getMasterDataValues = async (category, fallback = []) => {
  try {
    const items = await prisma.masterData.findMany({
      where: { category },
      orderBy: { value: 'asc' },
      select: { value: true },
    });

    const values = items
      .map(item => normalizeText(item.value))
      .filter(Boolean);

    return values.length ? values : [...fallback];
  } catch (error) {
    console.warn(
      `Master Data ${category} tidak dapat dibaca, menggunakan fallback.`,
      error?.message || error,
    );
    return [...fallback];
  }
};

const compareRegionIdValues = (a, b) => {
  const aId = String(a?.id_wilayah ?? '').trim();
  const bId = String(b?.id_wilayah ?? '').trim();
  if (aId && bId) return aId.localeCompare(bId, 'id', { numeric: true, sensitivity: 'base' });
  if (aId) return -1;
  if (bId) return 1;
  return String(a?.value ?? '').localeCompare(String(b?.value ?? ''), 'id', { numeric: true, sensitivity: 'base' });
};

const getPengolahanPemasaranExportConfig = async () => {
  const [regionItems, pengolahan, pemasaran, scales] = await Promise.all([
    prisma.masterData.findMany({
      where: { category: 'KABUPATEN_KOTA' },
      orderBy: { value: 'asc' },
      select: { value: true, metadata: true },
    }).catch(() => []),
    getMasterDataValues('JENIS_PENGOLAHAN', JENIS_PENGOLAHAN_EXPORT_OPTIONS),
    getMasterDataValues('JENIS_PEMASARAN', JENIS_PEMASARAN_EXPORT_OPTIONS),
    getMasterDataValues('KATEGORI_SKALA_USAHA', SKALA_EXPORT_OPTIONS),
  ]);

  const regionItemsNormalized = regionItems
    .map(item => ({
      value: normalizeText(item.value),
      id_wilayah: String(item.metadata?.id_wilayah ?? '').trim(),
    }))
    .filter(item => item.value)
    .sort(compareRegionIdValues);

  const regions = regionItemsNormalized.length
    ? regionItemsNormalized.map(item => item.value)
    : [...KABUPATEN_KOTA_EXPORT_OPTIONS];

  const regionIds = new Map(
    regionItemsNormalized.map(item => [
      normalizeCategoryKey(item.value),
      item.id_wilayah || getRegionExportId(item.value),
    ]),
  );

  // Data lama yang belum memiliki metadata ID Wilayah tetap menggunakan
  // mapping legacy agar ekspor tidak rusak saat migrasi bertahap.
  regions.forEach(region => {
    const key = normalizeCategoryKey(region);
    if (!regionIds.get(key)) {
      regionIds.set(key, getRegionExportId(region));
    }
  });

  return {
    regions,
    regionIds,
    pengolahan,
    pemasaran,
    kegiatan: [...pengolahan, ...pemasaran],
    scales,
  };
};

// Palet yang sama dengan file Excel sebelumnya.
const EXPORT_THEME = {
  title: 'FFFFFF',
  header: '1F4E79',
  subHeader: '1F4E79',
  total: '1F4E79',
  border: '000000',
  titleFont: '000000',
  headerFont: 'FFFFFF',
  totalFont: 'FFFFFF',
};

const validatePackage = pkg => {
  if (!pkg.tahun) return 'Tahun wajib diisi.';
  if (!pkg.kabupaten_kota) return 'Kabupaten/Kota wajib dipilih.';
  if (!pkg.details.length) return 'Tambahkan minimal satu rincian Unit Usaha & Produksi.';
  const seen = new Set();
  for (let i = 0; i < pkg.details.length; i += 1) {
    const item = pkg.details[i];
    if (!item.jenis_kegiatan) return `Rincian ke-${i + 1}: Jenis kegiatan wajib dipilih.`;
    if (!item.skala_usaha) return `Rincian ke-${i + 1}: Skala usaha wajib dipilih.`;
    const key = `${item.kategori_kegiatan}|${item.jenis_kegiatan}|${item.skala_usaha}`.toLowerCase();
    if (seen.has(key)) return `Rincian ${item.jenis_kegiatan} - ${item.skala_usaha} tercantum lebih dari satu kali.`;
    seen.add(key);
  }
  const totalModalJenis = sumObject(pkg.modal_by_jenis);
  const totalModalSkala = sumObject(pkg.modal_by_skala);
  if (totalModalJenis > 0 && totalModalSkala > 0 && Math.abs(totalModalJenis - totalModalSkala) > 0.5) {
    return 'Total modal berdasarkan Jenis Kegiatan harus sama dengan total modal berdasarkan Skala Usaha.';
  }
  const unsupported = unsupportedDocumentLabels(pkg.dokumen);
  if (unsupported.length) {
    return `Dokumen ${unsupported.join(', ')} belum dapat disimpan tanpa perubahan struktur database. Gunakan jenis dokumen yang sudah tersedia.`;
  }
  return null;
};

const createPackageRows = (pkg, status = 'APPROVED', alasan = null) => {
  const details = pkg.details.map(item => ({
    tahun: pkg.tahun,
    kabupaten_kota: pkg.kabupaten_kota,
    kategori_kegiatan: item.kategori_kegiatan,
    jenis_kegiatan: item.jenis_kegiatan,
    skala_usaha: item.skala_usaha,
    jumlah_unit_usaha: item.jumlah_unit_usaha,
    hasil_kg: item.hasil_kg,
    hasil_rp: item.hasil_rp,
    modal_rp: 0,
    status,
    alasan_penolakan: alasan,
  }));

  const modalJenisRows = Object.entries(pkg.modal_by_jenis || {})
    .filter(([, value]) => toNumber(value) > 0)
    .map(([jenis, value]) => ({
      tahun: pkg.tahun,
      kabupaten_kota: pkg.kabupaten_kota,
      kategori_kegiatan: META_MODAL_JENIS,
      jenis_kegiatan: jenis,
      skala_usaha: META_PLACEHOLDER,
      jumlah_unit_usaha: 0,
      hasil_kg: 0,
      hasil_rp: 0,
      modal_rp: toNumber(value),
      status,
      alasan_penolakan: alasan,
    }));

  const modalSkalaRows = Object.entries(pkg.modal_by_skala || {})
    .filter(([, value]) => toNumber(value) > 0)
    .map(([skala, value]) => ({
      tahun: pkg.tahun,
      kabupaten_kota: pkg.kabupaten_kota,
      kategori_kegiatan: META_MODAL_SKALA,
      jenis_kegiatan: META_PLACEHOLDER,
      skala_usaha: skala,
      jumlah_unit_usaha: 0,
      hasil_kg: 0,
      hasil_rp: 0,
      modal_rp: toNumber(value),
      status,
      alasan_penolakan: alasan,
    }));

  const docColumns = docPayloadToColumns(pkg.dokumen);
  const hasDocs = Object.values(docColumns).some(value => toNumber(value) > 0);
  const docRows = hasDocs ? [{
    tahun: pkg.tahun,
    kabupaten_kota: pkg.kabupaten_kota,
    kategori_kegiatan: META_DOKUMEN,
    jenis_kegiatan: META_PLACEHOLDER,
    skala_usaha: META_PLACEHOLDER,
    jumlah_unit_usaha: 0,
    hasil_kg: 0,
    hasil_rp: 0,
    modal_rp: 0,
    ...docColumns,
    status,
    alasan_penolakan: alasan,
  }] : [];

  return [...details, ...modalJenisRows, ...modalSkalaRows, ...docRows];
};

const createBatchData = async (req, res) => {
  try {
    const pkg = parsePackageBody(req.body); const error = validatePackage(pkg);
    if (error) return res.status(400).json({ success: false, message: error });
    const exists = await db.findFirst({ where: { tahun: pkg.tahun, kabupaten_kota: pkg.kabupaten_kota } });
    if (exists) return res.status(409).json({ success: false, message: 'Data untuk Tahun dan Kabupaten/Kota tersebut sudah tersedia. Gunakan Edit Data.' });
    const created = await prisma.$transaction(createPackageRows(pkg).map(data => db.create({ data })));
    const result = groupRowsToPackages(created)[0];
    res.status(201).json({ success: true, data: result, message: 'Data berhasil disimpan dengan status APPROVED.' });
  } catch (error) { console.error('createBatchData:', error); res.status(500).json({ success: false, message: error.message || 'Gagal menyimpan data.' }); }
};

const formatTextRange = (
  worksheet,
  startRow,
  endRow,
  startCol,
  endCol,
) => {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      const cell = worksheet.getCell(row, col);
      cell.value = String(cell.value ?? '');
      cell.numFmt = '@';
    }
  }
};

const updateData = async (req, res) => {
  try {
    const found = await findPackageIdentity(req.params.id);
    if (!found) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    const pkg = parsePackageBody(req.body); const error = validatePackage(pkg);
    if (error) return res.status(400).json({ success: false, message: error });
    if (pkg.tahun !== found.row.tahun || pkg.kabupaten_kota !== found.row.kabupaten_kota) {
      const duplicate = await db.findFirst({ where: { tahun: pkg.tahun, kabupaten_kota: pkg.kabupaten_kota, NOT: found.where } });
      if (duplicate) return res.status(409).json({ success: false, message: 'Data Tahun dan Kabupaten/Kota tujuan sudah tersedia.' });
    }
    const oldRows = await db.findMany({ where: found.where });
    const oldStatus = oldRows[0]?.status || 'APPROVED';
    const newStatus = oldStatus === 'REJECTED' ? 'APPROVED' : oldStatus;
    const newAlasan = oldStatus === 'REJECTED' ? null : (oldRows.find(row => row.alasan_penolakan)?.alasan_penolakan || null);
    const rows = createPackageRows(pkg, newStatus, newAlasan);
    const resultRows = await prisma.$transaction(async tx => {
      await tx.pengolahanPemasaranRekap.deleteMany({ where: found.where });
      const created = [];
      for (const data of rows) created.push(await tx.pengolahanPemasaranRekap.create({ data }));
      return created;
    });
    res.json({ success: true, data: groupRowsToPackages(resultRows)[0], message: oldStatus === 'REJECTED' ? 'Data diperbaiki dan kembali menjadi APPROVED.' : 'Data berhasil diperbarui.' });
  } catch (error) { console.error('updateData:', error); res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui data.' }); }
};

const updateStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin_pusat') return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengubah status.' });
    const found = await findPackageIdentity(req.params.id); if (!found) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    const rows = await db.findMany({ where: found.where }); const current = rows[0]?.status;
    const status = clean(req.body?.status).toUpperCase(); const alasan = clean(req.body?.alasan_penolakan);
    if (!['APPROVED', 'VERIFIED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    if (current === 'REJECTED') return res.status(400).json({ success: false, message: 'Data REJECTED harus diperbaiki melalui Edit Data.' });
    if (status === 'VERIFIED' && current !== 'APPROVED') return res.status(400).json({ success: false, message: 'VERIFIED hanya dapat dilakukan dari status APPROVED.' });
    if (status === 'REJECTED' && !alasan) return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi.' });
    await db.updateMany({ where: found.where, data: { status, alasan_penolakan: status === 'REJECTED' ? alasan : null } });
    res.json({ success: true, message: `Status paket berhasil diubah menjadi ${status}.` });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Gagal mengubah status.' }); }
};

const resolvePackageWheresFromIds = async ids => {
  const rows = await db.findMany({ where: { id: { in: (ids || []).map(toInt).filter(Boolean) } }, select: { tahun: true, kabupaten_kota: true } });
  const unique = new Map(); rows.forEach(row => unique.set(packageKey(row), { tahun: row.tahun, kabupaten_kota: row.kabupaten_kota }));
  return [...unique.values()];
};

const batchStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin_pusat') return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengubah status.' });
    const wheres = await resolvePackageWheresFromIds(req.body?.ids); if (!wheres.length) return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih.' });
    const status = clean(req.body?.status).toUpperCase(); const alasan = clean(req.body?.alasan_penolakan);
    if (!['VERIFIED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Status batch tidak valid.' });
    if (status === 'REJECTED' && !alasan) return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi.' });
    let count = 0;
    for (const where of wheres) {
      const rows = await db.findMany({ where }); const current = rows[0]?.status;
      if (status === 'VERIFIED' && current !== 'APPROVED') continue;
      if (status === 'REJECTED' && current === 'REJECTED') continue;
      await db.updateMany({ where, data: { status, alasan_penolakan: status === 'REJECTED' ? alasan : null } }); count += 1;
    }
    res.json({ success: true, count, message: `${count} paket data berhasil diproses.` });
  } catch (error) { res.status(500).json({ success: false, message: error.message || 'Gagal memproses data.' }); }
};

const deleteData = async (req, res) => {
  try { const found = await findPackageIdentity(req.params.id); if (!found) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' }); await db.deleteMany({ where: found.where }); res.json({ success: true, message: 'Paket data berhasil dihapus.' }); }
  catch (error) { res.status(500).json({ success: false, message: error.message || 'Gagal menghapus data.' }); }
};

const batchDelete = async (req, res) => {
  try { const wheres = await resolvePackageWheresFromIds(req.body?.ids); let count = 0; for (const where of wheres) { await db.deleteMany({ where }); count += 1; } res.json({ success: true, count, message: `${count} paket data berhasil dihapus.` }); }
  catch (error) { res.status(500).json({ success: false, message: error.message || 'Gagal menghapus data.' }); }
};

// -------------------- Master data helpers --------------------
const FALLBACK = {
  KABUPATEN_KOTA: ['KAB. PACITAN','KAB. PONOROGO','KAB. TRENGGALEK','KAB. TULUNGAGUNG','KAB. BLITAR','KAB. KEDIRI','KAB. MALANG','KAB. LUMAJANG','KAB. JEMBER','KAB. BANYUWANGI','KAB. BONDOWOSO','KAB. SITUBONDO','KAB. PROBOLINGGO','KAB. PASURUAN','KAB. SIDOARJO','KAB. MOJOKERTO','KAB. JOMBANG','KAB. NGANJUK','KAB. MADIUN','KAB. MAGETAN','KAB. NGAWI','KAB. BOJONEGORO','KAB. TUBAN','KAB. LAMONGAN','KAB. GRESIK','KAB. BANGKALAN','KAB. SAMPANG','KAB. PAMEKASAN','KAB. SUMENEP','KOTA KEDIRI','KOTA BLITAR','KOTA MALANG','KOTA PROBOLINGGO','KOTA PASURUAN','KOTA MOJOKERTO','KOTA MADIUN','KOTA SURABAYA','KOTA BATU'],
  JENIS_PENGOLAHAN: ['Fermentasi','Pelumatan Daging Ikan','Pembekuan','Pemindangan','Penanganan Produk Segar','Pengalengan','Pengasapan/ Pemanggangan','Pereduksian/ Ekstraksi','Penggaraman/ Pengeringan','Pengolahan Lainnya'],
  JENIS_PEMASARAN: ['Pengecer','Pengumpul/ Pedagang Besar/ Distributor'],
  KATEGORI_SKALA_USAHA: ['Mikro','Kecil','Menengah','Besar'],
  SERTIFIKAT_PRODUK: ['HACCP','SNI','HALAL','SKP','PIRT','MD','Lain-lain'],
  IZIN_USAHA: ['NIB','NPWP','KUSUKA','Pengesahan MENKUMHAM','Akta Pendirian Usaha','SIUP Perikanan','SIUP Perdagangan','Lain-lain'],
  SERTIFIKAT_LAHAN_BANGUNAN: ['SHM','Non SHM'],
};
const masterItems = async category => {
  const rows = await prisma.masterData.findMany({ where: { category } });
  if (rows.length) return rows;
  return (FALLBACK[category] || []).map((value, index) => ({ value, metadata: category === 'KABUPATEN_KOTA' ? { id_wilayah: String(index + 1).padStart(2, '0') } : null }));
};
const masterValues = async category => (await masterItems(category)).map(item => item.value);
const regionInfo = async () => {
  const rows = await masterItems('KABUPATEN_KOTA');
  return rows.map((item, index) => ({ name: item.value, id: clean(item.metadata?.id_wilayah) || String(index + 1).padStart(2, '0') }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), 'id', { numeric: true }) || a.name.localeCompare(b.name, 'id'));
};

// -------------------- Excel helpers --------------------
const BLUE = '1F4E78'; const BLUE2 = '5B9BD5'; const WHITE = 'FFFFFF'; const BORDER = '7F8C8D';
const thinBorder = { top: { style: 'thin', color: { argb: BORDER } }, left: { style: 'thin', color: { argb: BORDER } }, bottom: { style: 'thin', color: { argb: BORDER } }, right: { style: 'thin', color: { argb: BORDER } } };
const styleTitle = cell => { cell.font = { bold: true, size: 12, color: { argb: '000000' } }; cell.alignment = { vertical: 'middle', horizontal: 'left' }; };
const styleHeader = cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }; cell.font = { bold: true, color: { argb: WHITE } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; cell.border = thinBorder; };
const styleSubHeader = cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE2 } }; cell.font = { bold: true, color: { argb: WHITE } }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; cell.border = thinBorder; };
const styleBody = cell => { cell.border = thinBorder; cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left', wrapText: true }; };
const autosize = sheet => sheet.columns.forEach((column, index) => { let width = index < 2 ? 14 : 12; column.eachCell({ includeEmpty: false }, cell => { width = Math.max(width, Math.min(28, String(cell.value ?? '').length + 2)); }); column.width = width; });

const addMatrixTable = ({ sheet, startRow, title, regions, columns, valueFor, unit = 'number', totalLabel = 'Jumlah Total' }) => {
  const startCol = 1; const endCol = 3 + columns.length;
  sheet.mergeCells(startRow, startCol, startRow, endCol); sheet.getCell(startRow, startCol).value = title; styleTitle(sheet.getCell(startRow, startCol));
  const h1 = startRow + 1; const h2 = startRow + 2;
  sheet.mergeCells(h1, 1, h2, 1); sheet.getCell(h1, 1).value = 'No'; styleHeader(sheet.getCell(h1, 1));
  sheet.mergeCells(h1, 2, h2, 2); sheet.getCell(h1, 2).value = 'ID Wilayah'; styleHeader(sheet.getCell(h1, 2));
  sheet.mergeCells(h1, 3, h2, 3); sheet.getCell(h1, 3).value = 'Kabupaten/Kota'; styleHeader(sheet.getCell(h1, 3));
  if (columns.length) { sheet.mergeCells(h1, 4, h1, 3 + columns.length); sheet.getCell(h1, 4).value = title.replace(/^.*?berdasarkan\s+/i, '').replace(/^.*?Berdasarkan\s+/i, ''); styleHeader(sheet.getCell(h1, 4)); }
  columns.forEach((name, i) => { const cell = sheet.getCell(h2, 4 + i); cell.value = name; styleSubHeader(cell); });
  const totalCol = 4 + columns.length; sheet.mergeCells(h1, totalCol, h2, totalCol); sheet.getCell(h1, totalCol).value = totalLabel; styleHeader(sheet.getCell(h1, totalCol));
  regions.forEach((region, rIndex) => {
    const rowNo = h2 + 1 + rIndex; const values = columns.map(col => toNumber(valueFor(region.name, col)));
    sheet.getCell(rowNo, 1).value = rIndex + 1; sheet.getCell(rowNo, 2).value = region.id; sheet.getCell(rowNo, 3).value = region.name;
    values.forEach((value, i) => { sheet.getCell(rowNo, 4 + i).value = value; if (unit === 'currency') sheet.getCell(rowNo, 4 + i).numFmt = 'Rp #,##0'; else sheet.getCell(rowNo, 4 + i).numFmt = '#,##0.##'; });
    const total = values.reduce((a, b) => a + b, 0); sheet.getCell(rowNo, totalCol).value = total; sheet.getCell(rowNo, totalCol).numFmt = unit === 'currency' ? 'Rp #,##0' : '#,##0.##';
    for (let c = 1; c <= totalCol; c += 1) styleBody(sheet.getCell(rowNo, c));
  });
  return h2 + regions.length + 2;
};

const selectPackagesForExport = async ({ ids, tahun, regions, admin }) => {
  const rows = await getRawRows({ verifiedOnly: !admin }); let packages = groupRowsToPackages(rows);
  if (Array.isArray(ids) && ids.length) { const set = new Set(ids.map(String)); packages = packages.filter(pkg => set.has(String(pkg.id))); }
  if (tahun) packages = packages.filter(pkg => Number(pkg.tahun) === toInt(tahun));
  if (Array.isArray(regions) && regions.length) { const set = new Set(regions); packages = packages.filter(pkg => set.has(pkg.kabupaten_kota)); }
  if (!admin) packages = packages.filter(pkg => pkg.status === 'VERIFIED');
  return packages;
};

const prepareSimpleExportSheet = (
  sheet,
  title,
  headers,
) => {
  const lastCol = headers.length;

  sheet.mergeCells(1, 1, 1, lastCol);
  sheet.getCell(1, 1).value = excelCleanText(title);
  styleExcelTitle(sheet.getCell(1, 1));

  sheet.mergeCells(2, 1, 2, lastCol);
  sheet.getCell(2, 1).value =
    `Tanggal ekspor: ${formatExcelDate()}`;
  styleExcelTitle(sheet.getCell(2, 1));

  headers.forEach((header, index) => {
    const cell = sheet.getCell(3, index + 1);
    cell.value = excelCleanText(header);
    styleExcelHeader(cell);
  });

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 32;
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
};

const styleSimpleDataRow = (
  row,
  {
    idColumn = 2,
    numericColumns = [],
    currencyColumns = [],
  } = {},
) => {
  row.eachCell({ includeEmpty: true }, styleExcelBody);

  if (idColumn) {
    setExcelRegionId(
      row.getCell(idColumn),
      row.getCell(idColumn).value,
    );
  }

  numericColumns.forEach(column => {
    setExcelMetricCell(
      row.getCell(column),
      row.getCell(column).value,
      'number',
    );
  });

  currencyColumns.forEach(column => {
    setExcelMetricCell(
      row.getCell(column),
      row.getCell(column).value,
      'currency',
    );
  });
};

const buildDataWorkbook = async packages => {
  const workbook = new ExcelJS.Workbook(); const regionMap = new Map((await regionInfo()).map(item => [item.name, item.id]));
  const prod = workbook.addWorksheet('Unit & Produksi');
  prod.addRow(['Status','Tahun','ID Wilayah','Kabupaten/Kota','Kategori','Jenis Kegiatan','Skala Usaha','Jumlah Unit Usaha','Hasil Produksi (Kg)','Nilai Produksi (Rp)']);
  packages.forEach(pkg => pkg.details.forEach(detail => prod.addRow([pkg.status,pkg.tahun,regionMap.get(pkg.kabupaten_kota)||'',pkg.kabupaten_kota,detail.kategori_kegiatan,detail.jenis_kegiatan,detail.skala_usaha,detail.jumlah_unit_usaha,detail.hasil_kg,detail.hasil_rp])));
  const modalJ = workbook.addWorksheet('Modal Jenis'); modalJ.addRow(['Status','Tahun','ID Wilayah','Kabupaten/Kota','Jenis Kegiatan','Investasi Modal (Rp)']);
  packages.forEach(pkg => Object.entries(pkg.modal_by_jenis || {}).filter(([,v])=>toNumber(v)>0).forEach(([k,v])=>modalJ.addRow([pkg.status,pkg.tahun,regionMap.get(pkg.kabupaten_kota)||'',pkg.kabupaten_kota,k,toNumber(v)])));
  const modalS = workbook.addWorksheet('Modal Skala'); modalS.addRow(['Status','Tahun','ID Wilayah','Kabupaten/Kota','Skala Usaha','Investasi Modal (Rp)']);
  packages.forEach(pkg => Object.entries(pkg.modal_by_skala || {}).filter(([,v])=>toNumber(v)>0).forEach(([k,v])=>modalS.addRow([pkg.status,pkg.tahun,regionMap.get(pkg.kabupaten_kota)||'',pkg.kabupaten_kota,k,toNumber(v)])));
  const docs = workbook.addWorksheet('Dokumen'); docs.addRow(['Status','Tahun','ID Wilayah','Kabupaten/Kota','Kelompok Dokumen','Jenis Dokumen','Jumlah']);
  packages.forEach(pkg => Object.entries(pkg.dokumen || {}).forEach(([group, entries]) => Object.entries(jsonObject(entries)).filter(([,v])=>toNumber(v)>0).forEach(([k,v])=>docs.addRow([pkg.status,pkg.tahun,regionMap.get(pkg.kabupaten_kota)||'',pkg.kabupaten_kota,group,k,toNumber(v)]))));
  workbook.worksheets.forEach(sheet => { sheet.getRow(1).eachCell(styleHeader); sheet.views = [{ state: 'frozen', ySplit: 1 }]; autosize(sheet); });
  return workbook;
};

const buildRekapWorkbook = async (packages, year) => {
  const workbook = new ExcelJS.Workbook(); const allRegions = await regionInfo(); const used = new Set(packages.map(pkg => pkg.kabupaten_kota)); const regions = allRegions.filter(r => used.has(r.name));
  const pengolahan = await masterValues('JENIS_PENGOLAHAN'); const pemasaran = await masterValues('JENIS_PEMASARAN'); const allTypes = [...pengolahan, ...pemasaran]; const scales = await masterValues('KATEGORI_SKALA_USAHA');
  const mapPkg = new Map(packages.map(pkg => [pkg.kabupaten_kota, pkg]));
  const metric = (region, type, field, category = null, scale = null) => {
    const pkg = mapPkg.get(region); if (!pkg) return 0;
    return pkg.details.filter(d => (!type || d.jenis_kegiatan === type) && (!category || d.kategori_kegiatan === category) && (!scale || d.skala_usaha === scale)).reduce((s,d)=>s+toNumber(d[field]),0);
  };
  const addMetricSheet = (name, field, label, unit) => {
    const sheet = workbook.addWorksheet(name); let row = 1;
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Jenis Kegiatan Tahun ${year}`, regions, columns: allTypes, valueFor: (r,c)=>metric(r,c,field), unit });
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Jenis Kegiatan Pengolahan Tahun ${year}`, regions, columns: pengolahan, valueFor:(r,c)=>metric(r,c,field,'Pengolahan'), unit });
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Jenis Kegiatan Pemasaran Tahun ${year}`, regions, columns: pemasaran, valueFor:(r,c)=>metric(r,c,field,'Pemasaran'), unit });
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Skala Usaha Tahun ${year}`, regions, columns: scales, valueFor:(r,c)=>{ const pkg=mapPkg.get(r); return pkg?pkg.details.filter(d=>d.skala_usaha===c).reduce((s,d)=>s+toNumber(d[field]),0):0; }, unit });
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Skala Usaha pada Kegiatan Pengolahan Tahun ${year}`, regions, columns: scales, valueFor:(r,c)=>{ const pkg=mapPkg.get(r); return pkg?pkg.details.filter(d=>d.kategori_kegiatan==='Pengolahan'&&d.skala_usaha===c).reduce((s,d)=>s+toNumber(d[field]),0):0; }, unit });
    row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Skala Usaha pada Kegiatan Pemasaran Tahun ${year}`, regions, columns: scales, valueFor:(r,c)=>{ const pkg=mapPkg.get(r); return pkg?pkg.details.filter(d=>d.kategori_kegiatan==='Pemasaran'&&d.skala_usaha===c).reduce((s,d)=>s+toNumber(d[field]),0):0; }, unit });
    allTypes.forEach(type => { row = addMatrixTable({ sheet, startRow: row, title: `${label} Berdasarkan Skala Usaha pada Jenis Kegiatan ${type} Tahun ${year}`, regions, columns: scales, valueFor:(r,c)=>metric(r,type,field,null,c), unit }); });
    autosize(sheet);
  };
  addMetricSheet('Unit Usaha','jumlah_unit_usaha','Jumlah Unit Usaha','number'); addMetricSheet('Hasil (Kg)','hasil_kg','Hasil Produksi (Kg)','number'); addMetricSheet('Hasil (Rp)','hasil_rp','Nilai Produksi (Rp)','currency');

  const modalSheet = workbook.addWorksheet('Modal'); let mr = 1;
  mr = addMatrixTable({ sheet: modalSheet, startRow: mr, title: `Jumlah Investasi Modal (Rp) Berdasarkan Jenis Kegiatan Tahun ${year}`, regions, columns: allTypes, valueFor:(r,c)=>toNumber(mapPkg.get(r)?.modal_by_jenis?.[c]), unit:'currency' });
  addMatrixTable({ sheet: modalSheet, startRow: mr, title: `Jumlah Investasi Modal (Rp) Berdasarkan Skala Usaha Tahun ${year}`, regions, columns: scales, valueFor:(r,c)=>toNumber(mapPkg.get(r)?.modal_by_skala?.[c]), unit:'currency' }); autosize(modalSheet);

  const docSheets = [
    ['Sertifikat Produk','SERTIFIKAT_PRODUK','sertifikat_produk','Jumlah Sertifikat Produk'],
    ['Ijin Usaha','IZIN_USAHA','izin_usaha','Jumlah Izin Usaha'],
    ['Sertifikat LB','SERTIFIKAT_LAHAN_BANGUNAN','sertifikat_lahan_bangunan','Jumlah Sertifikat Lahan & Bangunan'],
  ];
  for (const [sheetName, category, key, label] of docSheets) {
    const options = await masterValues(category); const sheet = workbook.addWorksheet(sheetName);
    addMatrixTable({ sheet, startRow: 1, title: `${label} per Kabupaten/Kota Tahun ${year}`, regions, columns: options, valueFor:(r,c)=>toNumber(mapPkg.get(r)?.dokumen?.[key]?.[c]), unit:'number' }); autosize(sheet);
  }
  return workbook;
};

const sendWorkbook = async (res, workbook, filename) => {
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition',`attachment; filename="${filename}"`); await workbook.xlsx.write(res); res.end();
};
const exportDataAdmin = async (req,res) => { try { const pkgs=await selectPackagesForExport({ids:req.body?.ids,admin:true}); if(!pkgs.length)return res.status(404).json({success:false,message:'Tidak ada data untuk diekspor.'}); await sendWorkbook(res,await buildDataWorkbook(pkgs),`Pengolahan_Pemasaran_${Date.now()}.xlsx`);} catch(e){console.error(e); if(!res.headersSent)res.status(500).json({success:false,message:e.message});} };
const exportDataPublic = async (req,res) => { try { const pkgs=await selectPackagesForExport({ids:req.body?.ids,admin:false}); if(!pkgs.length)return res.status(404).json({success:false,message:'Tidak ada data VERIFIED untuk diekspor.'}); await sendWorkbook(res,await buildDataWorkbook(pkgs),`Pengolahan_Pemasaran_${Date.now()}.xlsx`);} catch(e){console.error(e); if(!res.headersSent)res.status(500).json({success:false,message:e.message});} };
const exportRekapAdmin = async (req,res) => { try { const year=toInt(req.body?.tahun); if(!year)return res.status(400).json({success:false,message:'Tahun wajib dipilih.'}); const pkgs=await selectPackagesForExport({tahun:year,regions:req.body?.regions,admin:true}); const verified=pkgs.filter(p=>p.status==='VERIFIED'); if(!verified.length)return res.status(404).json({success:false,message:'Tidak ada data VERIFIED pada tahun tersebut.'}); await sendWorkbook(res,await buildRekapWorkbook(verified,year),`Rekap_Statistik_Pengolahan_Pemasaran_${year}.xlsx`);} catch(e){console.error(e); if(!res.headersSent)res.status(500).json({success:false,message:e.message});} };
const exportRekapPublic = async (req,res) => { try { const year=toInt(req.body?.tahun); if(!year)return res.status(400).json({success:false,message:'Tahun wajib dipilih.'}); const pkgs=await selectPackagesForExport({tahun:year,regions:req.body?.regions,admin:false}); if(!pkgs.length)return res.status(404).json({success:false,message:'Tidak ada data VERIFIED pada tahun tersebut.'}); await sendWorkbook(res,await buildRekapWorkbook(pkgs,year),`Rekap_Statistik_Pengolahan_Pemasaran_${year}.xlsx`);} catch(e){console.error(e); if(!res.headersSent)res.status(500).json({success:false,message:e.message});} };

module.exports = {
  getAllData,
  getAdminData,
  getStats,
  getDashboardStats,
  createData,
  createBatchData,
  updateData,
  deleteData,
  updateStatus,
  batchStatus,
  batchDelete,
  exportDataAdmin,
  exportDataPublic,
  exportRekapAdmin,
  exportRekapPublic,
};