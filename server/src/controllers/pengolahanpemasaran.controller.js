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

const createBatchData = async (req, res) => {
  try {
    const year = toInt(req.body?.tahun);
    const region = normalizeKabupaten(
      req.body?.kabupaten_kota,
    );
    const details = Array.isArray(req.body?.details)
      ? req.body.details
      : [];

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Tahun wajib diisi',
      });
    }

    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Kabupaten/Kota wajib dipilih',
      });
    }

    if (details.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Tambahkan minimal satu rincian sebelum menyimpan.',
      });
    }

    if (details.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          'Maksimal 100 rincian dapat disimpan dalam satu proses.',
      });
    }

    const payloads = details.map(detail =>
      buildPayload({
        ...detail,
        tahun: year,
        kabupaten_kota: region,
      }),
    );

    for (
      let index = 0;
      index < payloads.length;
      index += 1
    ) {
      const validationError =
        validatePayload(payloads[index]);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            `Rincian ke-${index + 1}: ${validationError}`,
        });
      }
    }

    // Cegah kombinasi ganda di dalam daftar sementara.
    const combinationMap = new Map();

    for (
      let index = 0;
      index < payloads.length;
      index += 1
    ) {
      const payload = payloads[index];
      const key = [
        payload.tahun,
        payload.kabupaten_kota,
        payload.kategori_kegiatan,
        payload.jenis_kegiatan,
        payload.skala_usaha,
      ]
        .map(value =>
          String(value ?? '')
            .trim()
            .toLowerCase(),
        )
        .join('|');

      if (combinationMap.has(key)) {
        return res.status(409).json({
          success: false,
          message:
            `Rincian ${payload.jenis_kegiatan} dengan skala ${payload.skala_usaha} tercantum lebih dari satu kali.`,
        });
      }

      combinationMap.set(key, index);
    }

    // Cek apakah salah satu kombinasi sudah tersimpan di database.
    const existingRows =
      await pengolahanPemasaranDb.findMany({
        where: {
          OR: payloads.map(payload =>
            buildDuplicateWhere(payload),
          ),
        },
        select: {
          id: true,
          tahun: true,
          kabupaten_kota: true,
          kategori_kegiatan: true,
          jenis_kegiatan: true,
          skala_usaha: true,
        },
      });

    if (existingRows.length > 0) {
      const duplicateLabels = existingRows
        .slice(0, 5)
        .map(
          item =>
            `${item.jenis_kegiatan} (${item.skala_usaha})`,
        )
        .join(', ');

      return res.status(409).json({
        success: false,
        message:
          `Sebagian rincian sudah tersedia di database: ${duplicateLabels}.`,
        duplicates: existingRows,
      });
    }

    // Semua create dijalankan dalam satu transaksi.
    // Jika satu rincian gagal, seluruh penyimpanan dibatalkan.
    const data = await prisma.$transaction(
      payloads.map(payload =>
        pengolahanPemasaranDb.create({
          data: {
            ...payload,
            status: 'APPROVED',
            alasan_penolakan: null,
          },
        }),
      ),
    );

    return res.status(201).json({
      success: true,
      data,
      count: data.length,
      message:
        `${data.length} rincian berhasil disimpan dengan status APPROVED`,
    });
  } catch (error) {
    console.error(
      'Error creating batch pengolahan pemasaran data:',
      error,
    );

    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message:
          'Salah satu kombinasi tahun, wilayah, jenis kegiatan, dan skala usaha sudah tersedia.',
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
        'Gagal menyimpan data Pengolahan dan Pemasaran secara batch.',
      error: error?.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, alasan_penolakan } = req.body;

    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Admin Pusat yang dapat menyetujui atau menolak data',
      });
    }

    if (!['APPROVED', 'VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const existing = await pengolahanPemasaranDb.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    if (existing.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Data yang ditolak harus diperbaiki terlebih dahulu',
      });
    }

    if (status === 'VERIFIED' && existing.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'VERIFIED hanya bisa dilakukan setelah data APPROVED',
      });
    }

    if (status === 'REJECTED' && !normalizeText(alasan_penolakan)) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan wajib diisi',
      });
    }

    const data = await pengolahanPemasaranDb.update({
      where: { id },
      data: {
        status,
        alasan_penolakan:
          status === 'REJECTED' ? normalizeText(alasan_penolakan) : null,
      },
    });

    return res.json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}`,
      data,
    });
  } catch (error) {
    console.error('Error updating pengolahan pemasaran status:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateData = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await pengolahanPemasaranDb.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    if (
      req.user?.role === 'admin_cabang' &&
      ['APPROVED', 'VERIFIED'].includes(existing.status)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Admin Cabang tidak dapat mengubah data yang sudah divalidasi',
      });
    }

    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const duplicate = await pengolahanPemasaranDb.findFirst({
      where: buildDuplicateWhere(payload, id),
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Kombinasi data tersebut sudah digunakan oleh data lain.',
      });
    }

    const isRejectedCorrection = existing.status === 'REJECTED';

    const data = await pengolahanPemasaranDb.update({
      where: { id },
      data: {
        ...payload,
        status: isRejectedCorrection ? 'APPROVED' : existing.status,
        alasan_penolakan: isRejectedCorrection ? null : existing.alasan_penolakan,
      },
    });

    return res.json({
      success: true,
      data,
      message: isRejectedCorrection
        ? 'Data berhasil diperbaiki dan dikembalikan ke status APPROVED'
        : 'Data berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating pengolahan pemasaran data:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteData = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await pengolahanPemasaranDb.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    if (
      req.user?.role === 'admin_cabang' &&
      ['APPROVED', 'VERIFIED'].includes(existing.status)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Admin Cabang tidak dapat menghapus data yang sudah divalidasi atau diverifikasi',
      });
    }

    await pengolahanPemasaranDb.delete({ where: { id } });
    return res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting pengolahan pemasaran data:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;

    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Admin Pusat yang dapat memvalidasi atau menolak data',
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });
    }

    if (!['APPROVED', 'VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    if (status === 'REJECTED' && !normalizeText(alasan_penolakan)) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10)).filter(Number.isInteger);
    let statusFilter;

    if (status === 'APPROVED') statusFilter = 'APPROVED';
    if (status === 'VERIFIED') statusFilter = 'APPROVED';

    const where = {
      id: { in: parsedIds },
      ...(status === 'REJECTED'
        ? { status: { in: ['APPROVED', 'VERIFIED'] } }
        : { status: statusFilter }),
    };

    const result = await pengolahanPemasaranDb.updateMany({
      where,
      data: {
        status,
        alasan_penolakan:
          status === 'REJECTED' ? normalizeText(alasan_penolakan) : null,
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: 'Tidak ada data yang diperbarui. Pastikan status data sesuai tahap validasi.',
        count: 0,
      });
    }

    return res.json({
      success: true,
      message: `${result.count} data berhasil diproses`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error batch status pengolahan pemasaran:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10)).filter(Number.isInteger);
    const where = { id: { in: parsedIds } };

    if (req.user?.role === 'admin_cabang') {
      where.status = { in: ['PENDING', 'REJECTED'] };
    }

    const result = await pengolahanPemasaranDb.deleteMany({ where });
    return res.json({
      success: true,
      message: `${result.count} data berhasil dihapus`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error batch delete pengolahan pemasaran:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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

const STATUS_COLOR_MAP = {
  PENDING: {
    bgColor: 'FED7AA',
    fontColor: 'B45309',
  },
  APPROVED: {
    bgColor: 'BFDBFE',
    fontColor: '1E40AF',
  },
  REJECTED: {
    bgColor: 'FECACA',
    fontColor: 'DC2626',
  },
  VERIFIED: {
    bgColor: 'A7F3D0',
    fontColor: '065F46',
  },
};

const SHEET_TAB_COLOR_MAP = {
  Pengolahan: '93C5FD',
  Pemasaran: '1E3A8A',
};

const REKAP_GROUP_COLORS = {
  identity: '1F4E79',
  pengolahan: '1F4E79',
  pemasaran: '1F4E79',
  unitTotal: '1F4E79',
  skala: '1F4E79',
  skalaTotal: '1F4E79',
  category: '1F4E79',
  grandTotal: '1F4E79',
};

const INTEGER_NUMBER_FORMAT = '#,##0;-#,##0;-';
const DECIMAL_NUMBER_FORMAT = '#,##0;-#,##0;-';
const RUPIAH_NUMBER_FORMAT = '"Rp" #,##0;-"Rp" #,##0;-';

const toArgb = rgb => {
  const value = String(rgb ?? '')
    .replace(/^#/, '')
    .toUpperCase();

  return value.length === 8
    ? value
    : `FF${value}`;
};

const safeExcelText = value => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '-';
  }
  return String(value);
};

const safeExcelYear = value => {
  const yearText = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 4);

  if (!yearText) return '-';

  const year = Number(yearText);
  return Number.isFinite(year) ? year : '-';
};

const toExportWholeNumber = value => Math.round(toNumber(value));

const normalizeCategoryKey = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');

const normalizeRegionExportKey = value =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/^KABUPATEN\s+/i, '')
    .replace(/^KAB\.?\s+/i, '')
    .replace(/^KOTA\s+/i, '')
    .replace(/[^A-Z0-9]/g, '');

const getRegionExportId = region => {
  const raw = String(region ?? '').trim().toUpperCase();
  const key = normalizeRegionExportKey(raw);

  const cityIds = {
    KEDIRI: '71',
    BLITAR: '72',
    MALANG: '73',
    PROBOLINGGO: '74',
    PASURUAN: '75',
    MOJOKERTO: '76',
    MADIUN: '77',
    SURABAYA: '78',
    BATU: '79',
  };

  const regencyIds = {
    PACITAN: '01',
    PONOROGO: '02',
    TRENGGALEK: '03',
    TULUNGAGUNG: '04',
    BLITAR: '05',
    KEDIRI: '06',
    MALANG: '07',
    LUMAJANG: '08',
    JEMBER: '09',
    BANYUWANGI: '10',
    BONDOWOSO: '11',
    SITUBONDO: '12',
    PROBOLINGGO: '13',
    PASURUAN: '14',
    SIDOARJO: '15',
    MOJOKERTO: '16',
    JOMBANG: '17',
    NGANJUK: '18',
    MADIUN: '19',
    MAGETAN: '20',
    NGAWI: '21',
    BOJONEGORO: '22',
    TUBAN: '23',
    LAMONGAN: '24',
    GRESIK: '25',
    BANGKALAN: '26',
    SAMPANG: '27',
    PAMEKASAN: '28',
    SUMENEP: '29',
  };

  if (/^KOTA\b/.test(raw) && cityIds[key]) return cityIds[key];

  if (
    /^(KABUPATEN|KAB\.?)\b/.test(raw) &&
    regencyIds[key]
  ) {
    return regencyIds[key];
  }

  return regencyIds[key] || cityIds[key] || '';
};

const getRegionExportNumber = (region, regionIds) => {
  const key = normalizeCategoryKey(region);
  const regionId =
    regionIds instanceof Map
      ? regionIds.get(key) || getRegionExportId(region)
      : getRegionExportId(region);

  if (!regionId) return '-';

  const numericId = Number(regionId);
  return Number.isFinite(numericId)
    ? numericId
    : String(regionId);
};

const sumField = (rows, field) =>
  Math.round(
    rows.reduce((sum, row) => sum + toNumber(row?.[field]), 0),
  );

const sumByKegiatan = (rows, detail, field) => {
  const target = normalizeCategoryKey(detail);

  return Math.round(
    rows
      .filter(
        row =>
          normalizeCategoryKey(row.jenis_kegiatan) === target,
      )
      .reduce((sum, row) => sum + toNumber(row?.[field]), 0),
  );
};

const makeBorder = color => ({
  top: {
    style: 'thin',
    color: { argb: toArgb(color) },
  },
  bottom: {
    style: 'thin',
    color: { argb: toArgb(color) },
  },
  left: {
    style: 'thin',
    color: { argb: toArgb(color) },
  },
  right: {
    style: 'thin',
    color: { argb: toArgb(color) },
  },
});

const makeWorkbookStyles = theme => ({
  title: {
    font: {
      bold: true,
      color: { argb: toArgb(theme.titleFont || 'FFFFFF') },
      size: 14,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(theme.title) },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    },
    border: makeBorder(theme.border),
  },
  header: {
    font: {
      bold: true,
      color: { argb: toArgb(theme.headerFont || 'FFFFFF') },
      size: 10,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(theme.header) },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    },
    border: makeBorder(theme.border),
  },
  subHeader: {
    font: {
      bold: true,
      color: { argb: toArgb('FFFFFF') },
      size: 9,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(theme.subHeader) },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    },
    border: makeBorder(theme.border),
  },
  data: {
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    },
    border: makeBorder(theme.border),
  },
  total: {
    font: {
      bold: true,
      color: { argb: toArgb(theme.totalFont || 'FFFFFF') },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(theme.total) },
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    },
    border: makeBorder(theme.border),
  },
});

const makeGroupHeaderStyle = fillColor => ({
  font: {
    bold: true,
    color: { argb: toArgb('FFFFFF') },
    size: 9,
  },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: toArgb(fillColor) },
  },
  alignment: {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  },
  border: makeBorder(EXPORT_THEME.border),
});

const cloneStyle = style => ({
  font: style.font ? { ...style.font } : undefined,
  fill: style.fill ? { ...style.fill } : undefined,
  alignment: style.alignment ? { ...style.alignment } : undefined,
  border: style.border ? { ...style.border } : undefined,
  numFmt: style.numFmt,
});

const applyCellStyle = (cell, style) => {
  const cloned = cloneStyle(style);
  if (cloned.font) cell.font = cloned.font;
  if (cloned.fill) cell.fill = cloned.fill;
  if (cloned.alignment) cell.alignment = cloned.alignment;
  if (cloned.border) cell.border = cloned.border;
  if (cloned.numFmt) cell.numFmt = cloned.numFmt;
};

const styleRange = (
  worksheet,
  startRow,
  endRow,
  startCol,
  endCol,
  style,
) => {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      applyCellStyle(worksheet.getCell(row, col), style);
    }
  }
};

const formatNumericRange = (
  worksheet,
  startRow,
  endRow,
  startCol,
  endCol,
  format,
) => {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      worksheet.getCell(row, col).numFmt = format;
    }
  }
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

const addRowsFromAoa = (worksheet, aoa) => {
  aoa.forEach(values => {
    worksheet.addRow(values);
  });
};

const setWorksheetView = (
  worksheet,
  frozenRows,
  frozenColumns,
) => {
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: frozenColumns,
      ySplit: frozenRows,
      topLeftCell: worksheet.getCell(
        frozenRows + 1,
        frozenColumns + 1,
      ).address,
      activeCell: worksheet.getCell(
        frozenRows + 1,
        frozenColumns + 1,
      ).address,
    },
  ];
};

const setAutoFilter = (
  worksheet,
  headerRow,
  endRow,
  endCol,
) => {
  if (endRow < headerRow) return;

  worksheet.autoFilter = {
    from: {
      row: headerRow,
      column: 1,
    },
    to: {
      row: endRow,
      column: endCol,
    },
  };
};

const getDetailExportHeaders = includeStatus => {
  const identityHeaders = ['No', 'ID Wilayah'];

  if (includeStatus) {
    identityHeaders.push('Status');
  }

  return [
    ...identityHeaders,
    'Tahun',
    'Kabupaten/Kota',
    'Kategori Kegiatan',
    'Jenis Kegiatan',
    'Skala Usaha',
    'Jumlah Unit Usaha',
    'Hasil Produksi (Kg)',
    'Nilai Produksi (Rp)',
    'Investasi Modal (Rp)',
    'HACCP',
    'SNI',
    'HALAL',
    'SKP',
    'PIRT',
    'MD',
    'Sertifikat Lainnya',
    'NIB',
    'NPWP',
    'KUSUKA',
    'MENKUMHAM',
    'Akta Pendirian',
    'IMB',
    'Lokasi/Domisili',
    'SIUP Perikanan',
    'SIUP Perdagangan',
    'Izin Lainnya',
    'SHM',
    'Non-SHM',
  ];
};

const buildDetailExportRecords = (
  rows,
  includeStatus,
  regionIds,
) =>
  rows.map((row, index) => {
    const record = {
      No: index + 1,
      'ID Wilayah': getRegionExportNumber(row.kabupaten_kota, regionIds),
    };

    if (includeStatus) {
      record.Status = safeExcelText(row.status);
    }

    return {
      ...record,
      Tahun: safeExcelYear(row.tahun),
      'Kabupaten/Kota': safeExcelText(row.kabupaten_kota),
      'Kategori Kegiatan': normalizeKategori(row.kategori_kegiatan),
      'Jenis Kegiatan': safeExcelText(row.jenis_kegiatan),
      'Skala Usaha': safeExcelText(row.skala_usaha),
      'Jumlah Unit Usaha': toExportWholeNumber(row.jumlah_unit_usaha),
      'Hasil Produksi (Kg)': toExportWholeNumber(row.hasil_kg),
      'Nilai Produksi (Rp)': toExportWholeNumber(row.hasil_rp),
      'Investasi Modal (Rp)': toExportWholeNumber(row.modal_rp),
      HACCP: toExportWholeNumber(row.sertifikat_haccp),
      SNI: toExportWholeNumber(row.sertifikat_sni),
      HALAL: toExportWholeNumber(row.sertifikat_halal),
      SKP: toExportWholeNumber(row.sertifikat_skp),
      PIRT: toExportWholeNumber(row.sertifikat_pirt),
      MD: toExportWholeNumber(row.sertifikat_md),
      'Sertifikat Lainnya': toExportWholeNumber(row.sertifikat_lainnya),
      NIB: toExportWholeNumber(row.izin_nib),
      NPWP: toExportWholeNumber(row.izin_npwp),
      KUSUKA: toExportWholeNumber(row.izin_kusuka),
      MENKUMHAM: toExportWholeNumber(row.izin_menkumham),
      'Akta Pendirian': toExportWholeNumber(row.izin_akta_pendirian),
      IMB: toExportWholeNumber(row.izin_imb),
      'Lokasi/Domisili': toExportWholeNumber(row.izin_lokasi_domisili),
      'SIUP Perikanan': toExportWholeNumber(row.izin_siup_perikanan),
      'SIUP Perdagangan': toExportWholeNumber(row.izin_siup_perdagangan),
      'Izin Lainnya': toExportWholeNumber(row.izin_lainnya),
      SHM: toExportWholeNumber(row.shm_count),
      'Non-SHM': toExportWholeNumber(row.non_shm_count),
    };
  });

const INTEGER_DETAIL_HEADERS = [
  'No',
  'Jumlah Unit Usaha',
  'HACCP',
  'SNI',
  'HALAL',
  'SKP',
  'PIRT',
  'MD',
  'Sertifikat Lainnya',
  'NIB',
  'NPWP',
  'KUSUKA',
  'MENKUMHAM',
  'Akta Pendirian',
  'IMB',
  'Lokasi/Domisili',
  'SIUP Perikanan',
  'SIUP Perdagangan',
  'Izin Lainnya',
  'SHM',
  'Non-SHM',
];

const getDetailColumnWidth = header => {
  if (header === 'No') return 8;
  if (header === 'ID Wilayah') return 10;
  if (header === 'Kabupaten/Kota') return 24;

  if (
    [
      'Kategori Kegiatan',
      'Jenis Kegiatan',
      'Skala Usaha',
      'Akta Pendirian',
      'Lokasi/Domisili',
      'SIUP Perdagangan',
    ].includes(header)
  ) {
    return 22;
  }

  return 15;
};

const createDetailExportSheet = (
  workbook,
  rows,
  sheetName,
  includeStatus,
  regionIds,
) => {
  const tabColor = SHEET_TAB_COLOR_MAP[sheetName];

  const worksheet = workbook.addWorksheet(
    sheetName,
    tabColor
      ? {
          properties: {
            tabColor: {
              argb: toArgb(tabColor),
            },
          },
        }
      : undefined,
  );

  const styles = makeWorkbookStyles(EXPORT_THEME);
  const headers = getDetailExportHeaders(includeStatus);
  const records = buildDetailExportRecords(rows, includeStatus, regionIds);
  const title =
    `DATA PENGOLAHAN DAN PEMASARAN - ${sheetName.toUpperCase()}`;

  const aoa = [
    [title],
    [
      `Tanggal ekspor: ${new Date().toLocaleString(
        'id-ID',
      )}`,
    ],
    headers,
    ...records.map(record =>
      headers.map(header => record[header] ?? '-'),
    ),
  ];

  addRowsFromAoa(worksheet, aoa);

  const lastCol = headers.length;
  const headerRow = 3;
  const firstDataRow = 4;
  const lastDataRow = aoa.length;

  worksheet.mergeCells(1, 1, 1, lastCol);
  worksheet.mergeCells(2, 1, 2, lastCol);

  styleRange(
    worksheet,
    1,
    2,
    1,
    lastCol,
    styles.title,
  );
  styleRange(
    worksheet,
    headerRow,
    headerRow,
    1,
    lastCol,
    styles.header,
  );

  if (lastDataRow >= firstDataRow) {
    styleRange(
      worksheet,
      firstDataRow,
      lastDataRow,
      1,
      lastCol,
      styles.data,
    );
  }

  const headerIndex = new Map(
    headers.map((header, index) => [header, index + 1]),
  );

  const regionIdCol = headerIndex.get('ID Wilayah');

  if (
    regionIdCol &&
    lastDataRow >= firstDataRow
  ) {
    formatNumericRange(
      worksheet,
      firstDataRow,
      lastDataRow,
      regionIdCol,
      regionIdCol,
      '00',
    );
  }

  const yearCol = headerIndex.get('Tahun');

  if (
    yearCol &&
    lastDataRow >= firstDataRow
  ) {
    formatNumericRange(
      worksheet,
      firstDataRow,
      lastDataRow,
      yearCol,
      yearCol,
      '0',
    );
  }

  if (includeStatus && lastDataRow >= firstDataRow) {
    const statusCol = headerIndex.get('Status');

    for (
      let row = firstDataRow;
      row <= lastDataRow;
      row += 1
    ) {
      const cell = worksheet.getCell(row, statusCol);
      const status = String(cell.value ?? '')
        .trim()
        .toUpperCase();
      const statusColors = STATUS_COLOR_MAP[status];

      if (!statusColors) continue;

      applyCellStyle(cell, {
        ...styles.data,
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: toArgb(statusColors.bgColor),
          },
        },
        font: {
          bold: true,
          color: {
            argb: toArgb(statusColors.fontColor),
          },
        },
      });
    }
  }

  INTEGER_DETAIL_HEADERS.forEach(header => {
    const col = headerIndex.get(header);
    if (col && lastDataRow >= firstDataRow) {
      formatNumericRange(
        worksheet,
        firstDataRow,
        lastDataRow,
        col,
        col,
        INTEGER_NUMBER_FORMAT,
      );
    }
  });

  const kgCol = headerIndex.get('Hasil Produksi (Kg)');
  if (kgCol && lastDataRow >= firstDataRow) {
    formatNumericRange(
      worksheet,
      firstDataRow,
      lastDataRow,
      kgCol,
      kgCol,
      DECIMAL_NUMBER_FORMAT,
    );
  }

  [
    'Nilai Produksi (Rp)',
    'Investasi Modal (Rp)',
  ].forEach(header => {
    const col = headerIndex.get(header);
    if (col && lastDataRow >= firstDataRow) {
      formatNumericRange(
        worksheet,
        firstDataRow,
        lastDataRow,
        col,
        col,
        RUPIAH_NUMBER_FORMAT,
      );
    }
  });

  headers.forEach((header, index) => {
    worksheet.getColumn(index + 1).width =
      getDetailColumnWidth(header);
  });

  worksheet.getRow(1).height = 24;
  worksheet.getRow(2).height = 24;
  worksheet.getRow(headerRow).height = 34;

  for (
    let row = firstDataRow;
    row <= lastDataRow;
    row += 1
  ) {
    worksheet.getRow(row).height = 22;
  }

  setWorksheetView(worksheet, headerRow, 2);
  setAutoFilter(
    worksheet,
    headerRow,
    lastDataRow,
    lastCol,
  );

  return worksheet;
};

const getReportTotalLabel = regions =>
  regions.length === KABUPATEN_KOTA_EXPORT_OPTIONS.length
    ? 'JUMLAH JAWA TIMUR'
    : 'JUMLAH WILAYAH TERPILIH';

const applyRekapCommonSettings = (
  worksheet,
  rowCount,
  lastCol,
  headerRow,
  bodyStart,
) => {
  for (let col = 1; col <= lastCol; col += 1) {
    worksheet.getColumn(col).width =
      col === 1 ? 6 : col === 2 ? 25 : 15;
  }

  for (let row = 1; row <= rowCount; row += 1) {
    worksheet.getRow(row).height =
      row <= 2
        ? 24
        : row === headerRow
          ? 34
          : 22;
  }

  setWorksheetView(worksheet, bodyStart - 1, 2);
  setAutoFilter(worksheet, headerRow, rowCount, lastCol);
};

const createDaftarIsiSheet = (workbook, year) => {
  const styles = makeWorkbookStyles(EXPORT_THEME);
  const worksheet = workbook.addWorksheet('Daftar Isi');

  const items = [
    ['Unit Usaha', 'Rekap jumlah unit usaha dan skala usaha', 'Unit'],
    ['Hasil (Kg)', 'Rekap hasil produksi atau penjualan', 'Kg'],
    ['Hasil (Rp)', 'Rekap nilai produksi atau penjualan', 'Rp'],
    ['Investasi Modal', 'Rekap investasi modal', 'Rp'],
    ['Sertifikat Produk', 'Rekap sertifikat produk', 'Dokumen'],
    ['Izin Usaha', 'Rekap izin usaha', 'Dokumen'],
    ['Sertifikat Bangunan', 'Rekap SHM dan Non-SHM', 'Dokumen'],
  ];

  const aoa = [
    [
      'DAFTAR ISI REKAP STATISTIK PENGOLAHAN DAN PEMASARAN',
    ],
    [`PROVINSI JAWA TIMUR TAHUN ${year}`],
    ['No', 'Nama Sheet', 'Keterangan', 'Satuan'],
    ...items.map(([name, description, unit], index) => [
      index + 1,
      name,
      description,
      unit,
    ]),
  ];

  addRowsFromAoa(worksheet, aoa);

  const headerRow = 3;
  const bodyStart = 4;

  worksheet.mergeCells(1, 1, 1, 4);
  worksheet.mergeCells(2, 1, 2, 4);

  styleRange(
    worksheet,
    1,
    2,
    1,
    4,
    styles.title,
  );
  styleRange(
    worksheet,
    headerRow,
    headerRow,
    1,
    4,
    styles.header,
  );
  styleRange(
    worksheet,
    bodyStart,
    aoa.length,
    1,
    4,
    styles.data,
  );
  formatNumericRange(
    worksheet,
    bodyStart,
    aoa.length,
    1,
    1,
    INTEGER_NUMBER_FORMAT,
  );

  items.forEach(([name], index) => {
    const cell = worksheet.getCell(
      bodyStart + index,
      2,
    );
    cell.value = {
      text: name,
      hyperlink: `#'${name}'!A1`,
      tooltip: `Buka sheet ${name}`,
    };
    cell.font = {
      color: { argb: toArgb('0563C1') },
      underline: true,
      bold: true,
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.border = makeBorder(EXPORT_THEME.border);
  });

  [7, 25, 55, 14].forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  for (let row = 1; row <= aoa.length; row += 1) {
    worksheet.getRow(row).height =
      row <= 2
        ? 24
        : row === headerRow
          ? 30
          : 23;
  }

  setWorksheetView(worksheet, headerRow, 0);
  setAutoFilter(
    worksheet,
    headerRow,
    aoa.length,
    4,
  );

  return worksheet;
};

const createUnitUsahaSheet = (
  workbook,
  rows,
  year,
  regions,
) => {
  const styles = makeWorkbookStyles(EXPORT_THEME);
  const worksheet = workbook.addWorksheet('Unit Usaha');
  const lastCol = 20;

  const groupHeader = Array(lastCol).fill('');
  groupHeader[0] = 'No';
  groupHeader[1] = 'Kabupaten/Kota';
  groupHeader[2] = 'Pengolahan';
  groupHeader[12] = 'Pemasaran';
  groupHeader[14] = 'Jumlah Unit Usaha';
  groupHeader[15] = 'Skala Usaha';
  groupHeader[19] = 'Jumlah Skala';

  const aoa = [
    ['REKAP UNIT USAHA PENGOLAHAN DAN PEMASARAN'],
    [`PROVINSI JAWA TIMUR TAHUN ${year}`],
    groupHeader,
    [
      'No',
      'Kabupaten/Kota',
      ...JENIS_PENGOLAHAN_EXPORT_OPTIONS,
      ...JENIS_PEMASARAN_EXPORT_OPTIONS,
      'Jumlah Unit Usaha',
      ...SKALA_EXPORT_OPTIONS,
      'Jumlah Skala',
    ],
  ];

  const bodyStart = 5;

  regions.forEach(region => {
    const regionRows = rows.filter(
      row => row.kabupaten_kota === region,
    );

    const activityValues = KEGIATAN_EXPORT_OPTIONS.map(detail =>
      sumByKegiatan(
        regionRows,
        detail,
        'jumlah_unit_usaha',
      ),
    );

    const scaleValues = SKALA_EXPORT_OPTIONS.map(scale =>
      sumField(
        regionRows.filter(
          row => row.skala_usaha === scale,
        ),
        'jumlah_unit_usaha',
      ),
    );

    aoa.push([
      getRegionExportNumber(region),
      region,
      ...activityValues,
      activityValues.reduce(
        (sum, value) => sum + value,
        0,
      ),
      ...scaleValues,
      scaleValues.reduce(
        (sum, value) => sum + value,
        0,
      ),
    ]);
  });

  const totalRow = aoa.length + 1;
  const totals = Array(lastCol).fill(0);
  totals[0] = '';
  totals[1] = getReportTotalLabel(regions);

  for (let col = 2; col < lastCol; col += 1) {
    totals[col] = aoa
      .slice(bodyStart - 1)
      .reduce(
        (sum, row) => sum + toNumber(row[col]),
        0,
      );
  }

  aoa.push(totals);
  addRowsFromAoa(worksheet, aoa);

  worksheet.mergeCells(1, 1, 1, lastCol);
  worksheet.mergeCells(2, 1, 2, lastCol);
  worksheet.mergeCells(3, 1, 4, 1);
  worksheet.mergeCells(3, 2, 4, 2);
  worksheet.mergeCells(3, 3, 3, 12);
  worksheet.mergeCells(3, 13, 3, 14);
  worksheet.mergeCells(3, 15, 4, 15);
  worksheet.mergeCells(3, 16, 3, 19);
  worksheet.mergeCells(3, 20, 4, 20);

  styleRange(
    worksheet,
    1,
    2,
    1,
    lastCol,
    styles.title,
  );

  [
    [1, 2, REKAP_GROUP_COLORS.identity],
    [3, 12, REKAP_GROUP_COLORS.pengolahan],
    [13, 14, REKAP_GROUP_COLORS.pemasaran],
    [15, 15, REKAP_GROUP_COLORS.unitTotal],
    [16, 19, REKAP_GROUP_COLORS.skala],
    [20, 20, REKAP_GROUP_COLORS.skalaTotal],
  ].forEach(([startCol, endCol, fillColor]) => {
    styleRange(
      worksheet,
      3,
      4,
      startCol,
      endCol,
      makeGroupHeaderStyle(fillColor),
    );
  });

  if (totalRow > bodyStart) {
    styleRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      lastCol,
      styles.data,
    );
    formatNumericRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      1,
      '00',
    );
  }

  styleRange(
    worksheet,
    totalRow,
    totalRow,
    1,
    lastCol,
    styles.total,
  );

  formatNumericRange(
    worksheet,
    bodyStart,
    totalRow,
    3,
    lastCol,
    INTEGER_NUMBER_FORMAT,
  );

  applyRekapCommonSettings(
    worksheet,
    aoa.length,
    lastCol,
    4,
    bodyStart,
  );

  return worksheet;
};

const createActivityMetricSheet = (
  workbook,
  rows,
  year,
  regions,
  sheetName,
  title,
  field,
  numberFormat,
) => {
  const styles = makeWorkbookStyles(EXPORT_THEME);
  const worksheet = workbook.addWorksheet(sheetName);

  // Struktur kolom dibuat sama seperti sheet Unit Usaha:
  // 2 identitas + 10 pengolahan + 2 pemasaran
  // + 1 total kegiatan + 4 skala usaha + 1 total skala.
  const lastCol = 20;

  const groupHeader = Array(lastCol).fill('');
  groupHeader[0] = 'No';
  groupHeader[1] = 'Kabupaten/Kota';
  groupHeader[2] = 'Pengolahan';
  groupHeader[12] = 'Pemasaran';
  groupHeader[14] = 'Jumlah Total';
  groupHeader[15] = 'Skala Usaha';
  groupHeader[19] = 'Jumlah Skala';

  const aoa = [
    [title],
    [`PROVINSI JAWA TIMUR TAHUN ${year}`],
    groupHeader,
    [
      'No',
      'Kabupaten/Kota',
      ...JENIS_PENGOLAHAN_EXPORT_OPTIONS,
      ...JENIS_PEMASARAN_EXPORT_OPTIONS,
      'Jumlah Total',
      ...SKALA_EXPORT_OPTIONS,
      'Jumlah Skala',
    ],
  ];

  const bodyStart = 5;

  regions.forEach(region => {
    const regionRows = rows.filter(
      row => row.kabupaten_kota === region,
    );

    // Nilai berdasarkan jenis kegiatan.
    const activityValues =
      KEGIATAN_EXPORT_OPTIONS.map(detail =>
        sumByKegiatan(
          regionRows,
          detail,
          field,
        ),
      );

    // Nilai berdasarkan skala usaha untuk field yang sama:
    // hasil_kg, hasil_rp, atau modal_rp.
    const scaleValues =
      SKALA_EXPORT_OPTIONS.map(scale =>
        sumField(
          regionRows.filter(
            row => row.skala_usaha === scale,
          ),
          field,
        ),
      );

    aoa.push([
      getRegionExportNumber(region),
      region,
      ...activityValues,
      activityValues.reduce(
        (sum, value) => sum + value,
        0,
      ),
      ...scaleValues,
      scaleValues.reduce(
        (sum, value) => sum + value,
        0,
      ),
    ]);
  });

  const totalRow = aoa.length + 1;
  const totals = Array(lastCol).fill(0);

  totals[0] = '';
  totals[1] = getReportTotalLabel(regions);

  for (
    let col = 2;
    col < lastCol;
    col += 1
  ) {
    totals[col] = aoa
      .slice(bodyStart - 1)
      .reduce(
        (sum, row) =>
          sum + toNumber(row[col]),
        0,
      );
  }

  aoa.push(totals);
  addRowsFromAoa(worksheet, aoa);

  worksheet.mergeCells(1, 1, 1, lastCol);
  worksheet.mergeCells(2, 1, 2, lastCol);

  worksheet.mergeCells(3, 1, 4, 1);
  worksheet.mergeCells(3, 2, 4, 2);

  worksheet.mergeCells(3, 3, 3, 12);
  worksheet.mergeCells(3, 13, 3, 14);

  worksheet.mergeCells(3, 15, 4, 15);
  worksheet.mergeCells(3, 16, 3, 19);
  worksheet.mergeCells(3, 20, 4, 20);

  styleRange(
    worksheet,
    1,
    2,
    1,
    lastCol,
    styles.title,
  );

  [
    [
      1,
      2,
      REKAP_GROUP_COLORS.identity,
    ],
    [
      3,
      12,
      REKAP_GROUP_COLORS.pengolahan,
    ],
    [
      13,
      14,
      REKAP_GROUP_COLORS.pemasaran,
    ],
    [
      15,
      15,
      REKAP_GROUP_COLORS.grandTotal,
    ],
    [
      16,
      19,
      REKAP_GROUP_COLORS.skala,
    ],
    [
      20,
      20,
      REKAP_GROUP_COLORS.skalaTotal,
    ],
  ].forEach(
    ([startCol, endCol, fillColor]) => {
      styleRange(
        worksheet,
        3,
        4,
        startCol,
        endCol,
        makeGroupHeaderStyle(fillColor),
      );
    },
  );

  if (totalRow > bodyStart) {
    styleRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      lastCol,
      styles.data,
    );

    // Kode wilayah tetap tampil 01, 02, dst.
    formatNumericRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      1,
      '00',
    );
  }

  styleRange(
    worksheet,
    totalRow,
    totalRow,
    1,
    lastCol,
    styles.total,
  );

  // Format menyesuaikan sheet:
  // Kg menggunakan format angka,
  // Hasil Rp dan Modal menggunakan format Rupiah.
  formatNumericRange(
    worksheet,
    bodyStart,
    totalRow,
    3,
    lastCol,
    numberFormat,
  );

  applyRekapCommonSettings(
    worksheet,
    aoa.length,
    lastCol,
    4,
    bodyStart,
  );

  return worksheet;
};


const createFieldSummarySheet = (
  workbook,
  rows,
  year,
  regions,
  sheetName,
  title,
  fields,
) => {
  const styles = makeWorkbookStyles(EXPORT_THEME);
  const worksheet = workbook.addWorksheet(sheetName);

  const headers = [
    'No',
    'Kabupaten/Kota',
    ...fields.map(([label]) => label),
    'Jumlah Total',
  ];

  const lastCol = headers.length;

  const aoa = [
    [title],
    [`PROVINSI JAWA TIMUR TAHUN ${year}`],
    headers,
  ];

  const headerRow = 3;
  const bodyStart = 4;

  regions.forEach(region => {
    const regionRows = rows.filter(
      row => row.kabupaten_kota === region,
    );

    const values = fields.map(([, field]) =>
      sumField(regionRows, field),
    );

    aoa.push([
      getRegionExportNumber(region),
      region,
      ...values,
      values.reduce(
        (sum, value) => sum + value,
        0,
      ),
    ]);
  });

  const totalRow = aoa.length + 1;
  const totals = Array(lastCol).fill(0);
  totals[0] = '';
  totals[1] = getReportTotalLabel(regions);

  for (let col = 2; col < lastCol; col += 1) {
    totals[col] = aoa
      .slice(bodyStart - 1)
      .reduce(
        (sum, row) => sum + toNumber(row[col]),
        0,
      );
  }

  aoa.push(totals);
  addRowsFromAoa(worksheet, aoa);

  worksheet.mergeCells(1, 1, 1, lastCol);
  worksheet.mergeCells(2, 1, 2, lastCol);

  styleRange(
    worksheet,
    1,
    2,
    1,
    lastCol,
    styles.title,
  );

  styleRange(
    worksheet,
    headerRow,
    headerRow,
    1,
    2,
    makeGroupHeaderStyle(REKAP_GROUP_COLORS.identity),
  );

  if (lastCol > 3) {
    styleRange(
      worksheet,
      headerRow,
      headerRow,
      3,
      lastCol - 1,
      makeGroupHeaderStyle(REKAP_GROUP_COLORS.category),
    );
  }

  styleRange(
    worksheet,
    headerRow,
    headerRow,
    lastCol,
    lastCol,
    makeGroupHeaderStyle(REKAP_GROUP_COLORS.grandTotal),
  );

  if (totalRow > bodyStart) {
    styleRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      lastCol,
      styles.data,
    );
    formatNumericRange(
      worksheet,
      bodyStart,
      totalRow - 1,
      1,
      1,
      '00',
    );
  }

  styleRange(
    worksheet,
    totalRow,
    totalRow,
    1,
    lastCol,
    styles.total,
  );

  formatNumericRange(
    worksheet,
    bodyStart,
    totalRow,
    3,
    lastCol,
    INTEGER_NUMBER_FORMAT,
  );

  applyRekapCommonSettings(
    worksheet,
    aoa.length,
    lastCol,
    headerRow,
    bodyStart,
  );

  return worksheet;
};

const buildDetailWorkbook = (
  rows,
  includeStatus,
  exportConfig,
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dinas Kelautan dan Perikanan';
  workbook.created = new Date();

  const groups = [
    ['Semua Data', rows],
    [
      'Pengolahan',
      rows.filter(
        row =>
          normalizeKategori(row.kategori_kegiatan) === 'Pengolahan',
      ),
    ],
    [
      'Pemasaran',
      rows.filter(
        row =>
          normalizeKategori(row.kategori_kegiatan) === 'Pemasaran',
      ),
    ],
  ];

  groups.forEach(([sheetName, sheetRows]) => {
    createDetailExportSheet(
      workbook,
      sheetRows,
      sheetName,
      includeStatus,
      exportConfig?.regionIds,
    );
  });

  return workbook;
};

const WHITE_TABLE_STYLE = {
  title: { font: { bold: true, color: { argb: toArgb('000000') }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb('FFFFFF') } }, alignment: { horizontal: 'left', vertical: 'middle', wrapText: true } },
  header: { font: { bold: true, color: { argb: toArgb(EXPORT_THEME.headerFont) }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(EXPORT_THEME.header) } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: makeBorder(EXPORT_THEME.border) },
  subHeader: { font: { bold: true, color: { argb: toArgb('FFFFFF') }, size: 9 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(EXPORT_THEME.subHeader) } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: makeBorder(EXPORT_THEME.border) },
  data: { font: { color: { argb: toArgb('000000') } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb('FFFFFF') } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: makeBorder(EXPORT_THEME.border) },
};

const safeSheetNameForLink = name => String(name).replace(/'/g, "''");

const writeWhiteAnalysisTable = ({ worksheet, startRow, startCol, title, headers, dataRows, groupLabel, numberFormat = INTEGER_NUMBER_FORMAT, numericStartIndex = 2 }) => {
  const titleRow = startRow, headerRow = startRow + 1, subHeaderRow = startRow + 2, bodyStart = startRow + 3;
  const lastCol = startCol + headers.length - 1, dynamicHeaders = headers.slice(2, -1), groupStartCol = startCol + 2, groupEndCol = lastCol - 1;
  worksheet.getCell(titleRow, startCol).value = title; worksheet.mergeCells(titleRow, startCol, titleRow, lastCol); applyCellStyle(worksheet.getCell(titleRow, startCol), WHITE_TABLE_STYLE.title);
  [[startCol,headers[0]],[startCol+1,headers[1]],[lastCol,headers[headers.length-1]]].forEach(([col,value]) => { worksheet.mergeCells(headerRow,col,subHeaderRow,col); const cell=worksheet.getCell(headerRow,col); cell.value=value; applyCellStyle(cell,WHITE_TABLE_STYLE.header); applyCellStyle(worksheet.getCell(subHeaderRow,col),WHITE_TABLE_STYLE.header); });
  if (dynamicHeaders.length) { worksheet.mergeCells(headerRow,groupStartCol,headerRow,groupEndCol); const group=worksheet.getCell(headerRow,groupStartCol); group.value=groupLabel||'Rincian'; for(let col=groupStartCol;col<=groupEndCol;col++) applyCellStyle(worksheet.getCell(headerRow,col),WHITE_TABLE_STYLE.header); dynamicHeaders.forEach((header,index)=>{ const cell=worksheet.getCell(subHeaderRow,groupStartCol+index); cell.value=header; applyCellStyle(cell,WHITE_TABLE_STYLE.subHeader); }); }
  dataRows.forEach((row,rowIndex)=>row.forEach((value,colIndex)=>{ const cell=worksheet.getCell(bodyStart+rowIndex,startCol+colIndex); cell.value=value; applyCellStyle(cell,WHITE_TABLE_STYLE.data); if(colIndex>=numericStartIndex && typeof value==='number') cell.numFmt=numberFormat; }));
  for(let col=startCol;col<=lastCol;col++){ const relative=col-startCol; worksheet.getColumn(col).width=relative===0?7:relative===1?25:17; }
  worksheet.getRow(titleRow).height=22; worksheet.getRow(headerRow).height=24; worksheet.getRow(subHeaderRow).height=42;
  return { title, sheetName: worksheet.name, cell: worksheet.getCell(titleRow,startCol).address, width: headers.length, endRow: bodyStart+dataRows.length-1 };
};

const sumMetricField = (rows, field) =>
  rows.reduce((sum, row) => sum + toNumber(row?.[field]), 0);

const sumMetricByKegiatan = (rows, detail, field) => {
  const target = normalizeCategoryKey(detail);
  return rows
    .filter(row => normalizeCategoryKey(row.jenis_kegiatan) === target)
    .reduce((sum, row) => sum + toNumber(row?.[field]), 0);
};

const buildRegionPivotRows = ({
  rows,
  regions,
  columns,
  field,
  filterFn,
  regionIds,
}) => {
  const source = typeof filterFn === 'function' ? rows.filter(filterFn) : rows;
  const body = regions.map(region => {
    const regionRows = source.filter(row => row.kabupaten_kota === region);
    const values = columns.map(column =>
      sumMetricByKegiatan(regionRows, column, field),
    );
    return [
      getRegionExportNumber(region, regionIds),
      region,
      ...values,
      values.reduce((sum, value) => sum + value, 0),
    ];
  });

  const totalValues = columns.map((_, index) =>
    body.reduce((sum, row) => sum + toNumber(row[index + 2]), 0),
  );
  body.push([
    '',
    'Grand Total',
    ...totalValues,
    totalValues.reduce((sum, value) => sum + value, 0),
  ]);
  return body;
};

const buildScalePivotRows = ({
  rows,
  regions,
  scales,
  field,
  filterFn,
  regionIds,
}) => {
  const source = typeof filterFn === 'function' ? rows.filter(filterFn) : rows;
  const body = regions.map(region => {
    const regionRows = source.filter(row => row.kabupaten_kota === region);
    const values = scales.map(scale =>
      sumMetricField(
        regionRows.filter(
          row => normalizeCategoryKey(row.skala_usaha) === normalizeCategoryKey(scale),
        ),
        field,
      ),
    );
    return [
      getRegionExportNumber(region, regionIds),
      region,
      ...values,
      values.reduce((sum, value) => sum + value, 0),
    ];
  });

  const totalValues = scales.map((_, index) =>
    body.reduce((sum, row) => sum + toNumber(row[index + 2]), 0),
  );
  body.push([
    '',
    'Grand Total',
    ...totalValues,
    totalValues.reduce((sum, value) => sum + value, 0),
  ]);
  return body;
};

const createMetricAnalysisSheet = ({
  workbook, rows, regions, config, sheetName, metricLabel, field, numberFormat, tableCounter, daftarIsi,
}) => {
  const worksheet = workbook.addWorksheet(sheetName);
  let startCol = 1;
  const addTable = (titleSuffix, headers, dataRows, groupLabel) => {
    const tableNo = tableCounter.value++;
    const meta = writeWhiteAnalysisTable({ worksheet, startRow: 1, startCol, title: `Tabel ${tableNo} ${metricLabel} ${titleSuffix}`, headers, dataRows, groupLabel, numberFormat });
    daftarIsi.push(meta); startCol += meta.width + 2;
  };
  addTable('berdasarkan Jenis Kegiatan', ['No','Kabupaten/Kota',...config.kegiatan,'Jumlah Total'], buildRegionPivotRows({rows,regions,columns:config.kegiatan,field,regionIds:config.regionIds}), 'Jenis Kegiatan');
  addTable('berdasarkan Jenis Kegiatan Pengolahan', ['No','Kabupaten/Kota',...config.pengolahan,'Jumlah Total'], buildRegionPivotRows({rows,regions,columns:config.pengolahan,field,regionIds:config.regionIds,filterFn:row=>normalizeKategori(row.kategori_kegiatan)==='Pengolahan'}), 'Jenis Kegiatan');
  addTable('berdasarkan Jenis Kegiatan Pemasaran', ['No','Kabupaten/Kota',...config.pemasaran,'Jumlah Total'], buildRegionPivotRows({rows,regions,columns:config.pemasaran,field,regionIds:config.regionIds,filterFn:row=>normalizeKategori(row.kategori_kegiatan)==='Pemasaran'}), 'Jenis Kegiatan');
  addTable('berdasarkan Skala Usaha', ['No','Kabupaten/Kota',...config.scales,'Jumlah Total'], buildScalePivotRows({rows,regions,scales:config.scales,field,regionIds:config.regionIds}), 'Skala Usaha');
  addTable('berdasarkan Skala Usaha pada Kegiatan Pengolahan', ['No','Kabupaten/Kota',...config.scales,'Jumlah Total'], buildScalePivotRows({rows,regions,scales:config.scales,field,regionIds:config.regionIds,filterFn:row=>normalizeKategori(row.kategori_kegiatan)==='Pengolahan'}), 'Skala Usaha');
  addTable('berdasarkan Skala Usaha pada Kegiatan Pemasaran', ['No','Kabupaten/Kota',...config.scales,'Jumlah Total'], buildScalePivotRows({rows,regions,scales:config.scales,field,regionIds:config.regionIds,filterFn:row=>normalizeKategori(row.kategori_kegiatan)==='Pemasaran'}), 'Skala Usaha');
  config.kegiatan.forEach(kegiatan => addTable(`berdasarkan Skala Usaha pada Jenis Kegiatan ${kegiatan}`, ['No','Kabupaten/Kota',...config.scales,'Jumlah Total'], buildScalePivotRows({rows,regions,scales:config.scales,field,regionIds:config.regionIds,filterFn:row=>normalizeCategoryKey(row.jenis_kegiatan)===normalizeCategoryKey(kegiatan)}), 'Skala Usaha'));
  worksheet.views=[{state:'frozen',xSplit:2,ySplit:3}]; return worksheet;
};

const createModalAnalysisSheet = ({
  workbook,
  rows,
  regions,
  config,
  tableCounter,
  daftarIsi,
}) => {
  const worksheet = workbook.addWorksheet('Modal');
  let startCol = 1;

  const activityMeta = writeWhiteAnalysisTable({
    worksheet,
    startRow: 1,
    startCol,
    title: `Tabel ${tableCounter.value++} Jumlah Investasi Modal (Rp) Berdasarkan Jenis Kegiatan`,
    headers: ['No', 'Kabupaten/Kota', ...config.kegiatan, 'Jumlah Total'],
    dataRows: buildRegionPivotRows({
      rows,
      regions,
      columns: config.kegiatan,
      field: 'modal_rp',
      regionIds: config.regionIds,
    }),
    groupLabel: 'Jenis Kegiatan',
    numberFormat: RUPIAH_NUMBER_FORMAT,
  });
  daftarIsi.push(activityMeta);
  startCol += activityMeta.width + 2;

  const scaleMeta = writeWhiteAnalysisTable({
    worksheet,
    startRow: 1,
    startCol,
    title: `Tabel ${tableCounter.value++} Jumlah Investasi Modal (Rp) Berdasarkan Skala Usaha`,
    headers: ['No', 'Kabupaten/Kota', ...config.scales, 'Jumlah Total'],
    dataRows: buildScalePivotRows({
      rows,
      regions,
      scales: config.scales,
      field: 'modal_rp',
      regionIds: config.regionIds,
    }),
    groupLabel: 'Skala Usaha',
    numberFormat: RUPIAH_NUMBER_FORMAT,
  });
  daftarIsi.push(scaleMeta);

  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
};

const buildDimensionSummaryRows = ({ rows, dimensions, fields, fieldMode }) => {
  const body = dimensions.map((dimension, index) => {
    let matchedRows = rows;
    if (fieldMode === 'region') {
      matchedRows = rows.filter(row => row.kabupaten_kota === dimension);
    } else if (fieldMode === 'activity') {
      matchedRows = rows.filter(
        row => normalizeCategoryKey(row.jenis_kegiatan) === normalizeCategoryKey(dimension),
      );
    } else if (fieldMode === 'scale') {
      matchedRows = rows.filter(
        row => normalizeCategoryKey(row.skala_usaha) === normalizeCategoryKey(dimension),
      );
    }

    return [
      index + 1,
      dimension,
      ...fields.map(([, field]) => (field ? sumMetricField(matchedRows, field) : 0)),
    ];
  });

  const totals = fields.map((_, fieldIndex) =>
    body.reduce((sum, row) => sum + toNumber(row[fieldIndex + 2]), 0),
  );
  body.push(['', 'Grand Total', ...totals]);
  return body;
};

const createDocumentAnalysisSheet = ({
  workbook,
  rows,
  regions,
  config,
  sheetName,
  titleLabel,
  fields,
  tableCounter,
  daftarIsi,
}) => {
  const worksheet = workbook.addWorksheet(sheetName);
  let startCol = 1;
  const fieldHeaders = fields.map(([label]) => label);

  const definitions = [
    {
      suffix: 'per Kabupaten',
      dimensions: regions,
      dimensionHeader: 'Kabupaten/Kota',
      mode: 'region',
    },
    {
      suffix: 'Berdasarkan Jenis Kegiatan',
      dimensions: config.kegiatan,
      dimensionHeader: 'Jenis Kegiatan',
      mode: 'activity',
    },
    {
      suffix: 'Berdasarkan Skala Usaha',
      dimensions: config.scales,
      dimensionHeader: 'Skala Usaha',
      mode: 'scale',
    },
  ];

  definitions.forEach(definition => {
    const meta = writeWhiteAnalysisTable({
      worksheet,
      startRow: 1,
      startCol,
      title: `Tabel ${tableCounter.value++} ${titleLabel} ${definition.suffix}`,
      headers: ['No', definition.dimensionHeader, ...fieldHeaders, 'Jumlah Total'],
      groupLabel: 'Jenis Sertifikat',
      dataRows: buildDimensionSummaryRows({
        rows,
        dimensions: definition.dimensions,
        fields,
        fieldMode: definition.mode,
      }).map(row => [
        ...row,
        row.slice(2).reduce((sum, value) => sum + toNumber(value), 0),
      ]),
      numberFormat: INTEGER_NUMBER_FORMAT,
    });
    daftarIsi.push(meta);
    startCol += meta.width + 2;
  });

  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
};

const createDynamicDaftarIsiSheet = (worksheet, year, entries) => {
  worksheet.getCell('A1').value = 'Daftar Tabel';
  worksheet.getCell('B1').value = `Rekap Statistik Pengolahan dan Pemasaran Tahun ${year}`;
  applyCellStyle(worksheet.getCell('A1'), WHITE_TABLE_STYLE.header);
  applyCellStyle(worksheet.getCell('B1'), WHITE_TABLE_STYLE.header);

  entries.forEach((entry, index) => {
    const row = index + 3;
    const linkCell = worksheet.getCell(row, 1);
    linkCell.value = {
      text: entry.title,
      hyperlink: `#'${safeSheetNameForLink(entry.sheetName)}'!${entry.cell}`,
      tooltip: `Buka ${entry.sheetName}`,
    };
    linkCell.font = { color: { argb: toArgb('0563C1') }, underline: true };
    linkCell.alignment = { vertical: 'middle', wrapText: true };
    linkCell.border = makeBorder('000000');

    const sheetCell = worksheet.getCell(row, 2);
    sheetCell.value = entry.sheetName;
    applyCellStyle(sheetCell, WHITE_TABLE_STYLE.data);
  });

  worksheet.getColumn(1).width = 75;
  worksheet.getColumn(2).width = 24;
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  return worksheet;
};

const buildRekapWorkbook = (
  rows,
  year,
  regions,
  config,
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dinas Kelautan dan Perikanan';
  workbook.created = new Date();

  const daftarIsiSheet = workbook.addWorksheet('Daftar Isi');
  const daftarIsi = [];
  const tableCounter = { value: 1 };

  createMetricAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Unit Usaha',
    metricLabel: 'Jumlah Unit Usaha Aktif',
    field: 'jumlah_unit_usaha',
    numberFormat: INTEGER_NUMBER_FORMAT,
    tableCounter,
    daftarIsi,
  });

  createMetricAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Hasil (Kg)',
    metricLabel: 'Jumlah Hasil Produksi (Kg)',
    field: 'hasil_kg',
    numberFormat: DECIMAL_NUMBER_FORMAT,
    tableCounter,
    daftarIsi,
  });

  createMetricAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Hasil (Rp)',
    metricLabel: 'Jumlah Hasil Produksi (Rp)',
    field: 'hasil_rp',
    numberFormat: RUPIAH_NUMBER_FORMAT,
    tableCounter,
    daftarIsi,
  });

  createModalAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    tableCounter,
    daftarIsi,
  });

  createDocumentAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Sertifikat Produk',
    titleLabel: 'Jumlah Kepemilikan Sertifikat Produk',
    fields: SERTIFIKAT_PRODUK_FIELDS_EXPORT,
    tableCounter,
    daftarIsi,
  });

  createDocumentAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Ijin Usaha',
    titleLabel: 'Jumlah Kepemilikan Ijin Usaha',
    fields: IZIN_USAHA_FIELDS_EXPORT,
    tableCounter,
    daftarIsi,
  });

  createDocumentAnalysisSheet({
    workbook,
    rows,
    regions,
    config,
    sheetName: 'Sertifikat LB',
    titleLabel: 'Jumlah Kepemilikan Sertifikat Lahan dan Bangunan',
    fields: SERTIFIKAT_LB_FIELDS_EXPORT,
    tableCounter,
    daftarIsi,
  });

  createDynamicDaftarIsiSheet(daftarIsiSheet, year, daftarIsi);

  return workbook;
};

const parseIdList = value => {
  const source = Array.isArray(value)
    ? value
    : String(value ?? '').split(',');

  return source
    .map(item => parseInt(item, 10))
    .filter(Number.isInteger);
};

const parseRegionList = (value, regionOptions = KABUPATEN_KOTA_EXPORT_OPTIONS) => {
  const source = Array.isArray(value)
    ? value
    : String(value ?? '').split(',');

  const requested = source
    .map(item => String(item ?? '').trim())
    .filter(Boolean);

  if (!requested.length) {
    return [...regionOptions];
  }

  const availableMap = new Map(
    regionOptions.map(region => [normalizeCategoryKey(region), region]),
  );

  const requestedKeys = new Set(requested.map(region => normalizeCategoryKey(region)));
  return regionOptions.filter(region => requestedKeys.has(normalizeCategoryKey(region)));
};

const orderRowsByIds = (rows, ids) => {
  if (!ids.length) return rows;

  const rowMap = new Map(
    rows.map(row => [Number(row.id), row]),
  );

  return ids
    .map(id => rowMap.get(id))
    .filter(Boolean);
};

const getExportRows = async ({
  ids,
  publicOnly = false,
}) => {
  const parsedIds = parseIdList(ids);

  const where = {
    ...(publicOnly ? { status: 'VERIFIED' } : {}),
    ...(parsedIds.length
      ? { id: { in: parsedIds } }
      : {}),
  };

  const rows = await pengolahanPemasaranDb.findMany({
    where,
    orderBy: [
      { tahun: 'desc' },
      { kabupaten_kota: 'asc' },
      { jenis_kegiatan: 'asc' },
    ],
  });

  return orderRowsByIds(rows, parsedIds);
};

const getRekapRows = async ({
  tahun,
  regions,
}) => {
  const year = toInt(tahun);

  if (!year) {
    const error = new Error(
      'Pilih tepat satu tahun sebelum mengekspor rekap statistik.',
    );
    error.statusCode = 400;
    throw error;
  }

  const exportConfig = await getPengolahanPemasaranExportConfig();
  const selectedRegions = parseRegionList(regions, exportConfig.regions);

  if (!selectedRegions.length) {
    const error = new Error('Wilayah yang dipilih tidak ditemukan di Master Data.');
    error.statusCode = 400;
    throw error;
  }

  const rows = await pengolahanPemasaranDb.findMany({
    where: {
      status: 'VERIFIED',
      tahun: year,
      kabupaten_kota: {
        in: selectedRegions,
      },
    },
    orderBy: [
      { kabupaten_kota: 'asc' },
      { jenis_kegiatan: 'asc' },
    ],
  });

  return {
    rows,
    year: String(year),
    regions: selectedRegions,
    exportConfig,
  };
};

const sendExcelWorkbook = async (
  res,
  workbook,
  fileName,
) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"`,
  );

  await workbook.xlsx.write(res);
  res.end();
};

const exportDataAdmin = async (req, res) => {
  try {
    const rows = await getExportRows({
      ids: req.body?.ids,
      publicOnly: false,
    });

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data yang dapat diekspor.',
      });
    }

    const exportConfig = await getPengolahanPemasaranExportConfig();
    const workbook = buildDetailWorkbook(rows, true, exportConfig);

    return sendExcelWorkbook(
      res,
      workbook,
      `Pengolahan_Pemasaran_${new Date()
        .toISOString()
        .split('T')[0]}.xlsx`,
    );
  } catch (error) {
    console.error('Error exporting admin data:', error);

    if (!res.headersSent) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Gagal mengekspor data.',
      });
    }

    return undefined;
  }
};

const exportDataPublic = async (req, res) => {
  try {
    const rows = await getExportRows({
      ids: req.body?.ids,
      publicOnly: true,
    });

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada data yang dapat diekspor.',
      });
    }

    const exportConfig = await getPengolahanPemasaranExportConfig();
    const workbook = buildDetailWorkbook(rows, false, exportConfig);

    return sendExcelWorkbook(
      res,
      workbook,
      `Pengolahan_Pemasaran_${new Date()
        .toISOString()
        .split('T')[0]}.xlsx`,
    );
  } catch (error) {
    console.error('Error exporting public data:', error);

    if (!res.headersSent) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Gagal mengekspor data.',
      });
    }

    return undefined;
  }
};

const exportRekapAdmin = async (req, res) => {
  try {
    const result = await getRekapRows({
      tahun: req.body?.tahun,
      regions: req.body?.regions,
    });

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          'Tidak ada data VERIFIED pada tahun dan wilayah yang dipilih.',
      });
    }

    const workbook = buildRekapWorkbook(
      result.rows,
      result.year,
      result.regions,
      result.exportConfig,
    );

    return sendExcelWorkbook(
      res,
      workbook,
      `Rekap_Statistik_Pengolahan_Pemasaran_${result.year}.xlsx`,
    );
  } catch (error) {
    console.error('Error exporting admin recap:', error);

    if (!res.headersSent) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Gagal mengekspor rekap statistik.',
      });
    }

    return undefined;
  }
};

const exportRekapPublic = async (req, res) => {
  try {
    const result = await getRekapRows({
      tahun: req.body?.tahun,
      regions: req.body?.regions,
    });

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          'Tidak ada data pada tahun dan wilayah yang dipilih.',
      });
    }

    const workbook = buildRekapWorkbook(
      result.rows,
      result.year,
      result.regions,
      result.exportConfig,
    );

    return sendExcelWorkbook(
      res,
      workbook,
      `Rekap_Statistik_Pengolahan_Pemasaran_${result.year}.xlsx`,
    );
  } catch (error) {
    console.error('Error exporting public recap:', error);

    if (!res.headersSent) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Gagal mengekspor rekap statistik.',
      });
    }

    return undefined;
  }
};

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
