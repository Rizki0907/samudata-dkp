const prisma = require('../utils/prisma');

const toNumber = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '');

  if (!normalized) return 0;

  if (normalized.includes(',')) {
    normalized = normalized
      .replace(/\./g, '')
      .replace(',', '.');
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

const normalizeText = value =>
  String(value ?? '').trim();

const normalizeKabupaten = value =>
  normalizeText(value).toUpperCase();

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

const REKAP_FLOAT_FIELDS = [
  'hasil_kg',
  'hasil_rp',
  'modal_rp',
];

const buildPayload = body => {
  const payload = {
    tahun: toInt(body.tahun),

    kabupaten_kota: normalizeKabupaten(
      body.kabupaten_kota,
    ),

    kategori_kegiatan: normalizeKategori(
      body.kategori_kegiatan,
    ),

    jenis_kegiatan: normalizeText(
      body.jenis_kegiatan,
    ),

    skala_usaha: normalizeText(
      body.skala_usaha,
    ),
  };

  REKAP_INT_FIELDS.forEach(field => {
    payload[field] = Math.max(
      0,
      toInt(body[field]),
    );
  });

  REKAP_FLOAT_FIELDS.forEach(field => {
    payload[field] = Math.max(
      0,
      toFloat(body[field]),
    );
  });

  return payload;
};

const validatePayload = payload => {
  if (!payload.tahun) {
    return 'Tahun wajib diisi';
  }

  if (!payload.kabupaten_kota) {
    return 'Kabupaten/Kota wajib dipilih';
  }

  if (!payload.kategori_kegiatan) {
    return 'Kategori kegiatan wajib dipilih';
  }

  if (!payload.jenis_kegiatan) {
    return 'Jenis kegiatan wajib dipilih';
  }

  if (!payload.skala_usaha) {
    return 'Skala usaha wajib dipilih';
  }

  return null;
};

const buildDuplicateWhere = (
  payload,
  excludedId = null,
) => ({
  tahun: payload.tahun,

  kabupaten_kota: {
    equals: payload.kabupaten_kota,
    mode: 'insensitive',
  },

  kategori_kegiatan: {
    equals: payload.kategori_kegiatan,
    mode: 'insensitive',
  },

  jenis_kegiatan: {
    equals: payload.jenis_kegiatan,
    mode: 'insensitive',
  },

  skala_usaha: {
    equals: payload.skala_usaha,
    mode: 'insensitive',
  },

  ...(excludedId
    ? {
        id: {
          not: excludedId,
        },
      }
    : {}),
});

const buildPublicWhere = query => {
  const where = {
    status: 'VERIFIED',
  };

  if (query.tahun) {
    where.tahun = toInt(query.tahun);
  }

  if (query.kabupaten_kota) {
    where.kabupaten_kota =
      query.kabupaten_kota;
  }

  if (query.skala_usaha) {
    where.skala_usaha =
      query.skala_usaha;
  }

  if (query.kategori_kegiatan) {
    where.kategori_kegiatan =
      normalizeKategori(
        query.kategori_kegiatan,
      );
  }

  if (query.jenis_kegiatan) {
    const value = normalizeText(
      query.jenis_kegiatan,
    );

    if (
      /^(pengolahan|pemasaran)$/i.test(value)
    ) {
      where.kategori_kegiatan =
        normalizeKategori(value);
    } else {
      where.jenis_kegiatan = value;
    }
  }

  return where;
};

const getAllData = async (req, res) => {
  try {
    const data =
      await prisma.pengolahanPemasaranRekap.findMany({
        where: buildPublicWhere(req.query),

        orderBy: [
          {
            tahun: 'desc',
          },
          {
            kabupaten_kota: 'asc',
          },
          {
            jenis_kegiatan: 'asc',
          },
        ],
      });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      'Error fetching pengolahan pemasaran data:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data =
      await prisma.pengolahanPemasaranRekap.findMany({
        orderBy: [
          {
            created_at: 'desc',
          },
        ],
      });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      'Error fetching pengolahan pemasaran admin data:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const mapToSortedArray = map =>
  [...map.entries()]
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort(
      (a, b) => b.value - a.value,
    );

const getStats = async (req, res) => {
  try {
    const data =
      await prisma.pengolahanPemasaranRekap.findMany({
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
      const jumlahUnit = toInt(
        item.jumlah_unit_usaha,
      );

      const hasilKg = toFloat(
        item.hasil_kg,
      );

      const hasilRp = toFloat(
        item.hasil_rp,
      );

      const modalRp = toFloat(
        item.modal_rp,
      );

      const kategori = normalizeKategori(
        item.kategori_kegiatan,
      );

      kpi.total_unit_usaha += jumlahUnit;
      kpi.total_produksi_kg += hasilKg;
      kpi.total_nilai_produksi_rp +=
        hasilRp;
      kpi.total_modal_rp += modalRp;

      if (
        !kabupatenMap.has(
          item.kabupaten_kota,
        )
      ) {
        kabupatenMap.set(
          item.kabupaten_kota,
          {
            name: item.kabupaten_kota,
            jumlah_unit: 0,
            produksi_kg: 0,
            nilai_produksi_rp: 0,
            modal_rp: 0,
          },
        );
      }

      const wilayah = kabupatenMap.get(
        item.kabupaten_kota,
      );

      wilayah.jumlah_unit += jumlahUnit;
      wilayah.produksi_kg += hasilKg;
      wilayah.nilai_produksi_rp +=
        hasilRp;
      wilayah.modal_rp += modalRp;

      kategoriMap.set(
        kategori,
        (kategoriMap.get(kategori) || 0) +
          jumlahUnit,
      );

      skalaMap.set(
        item.skala_usaha,
        (skalaMap.get(
          item.skala_usaha,
        ) || 0) + jumlahUnit,
      );

      const targetMap =
        kategori === 'Pemasaran'
          ? pemasaranMap
          : pengolahanMap;

      targetMap.set(
        item.jenis_kegiatan,
        (targetMap.get(
          item.jenis_kegiatan,
        ) || 0) + jumlahUnit,
      );
    });

    return res.json({
      success: true,

      stats: {
        kpi,

        produksiPerKabupaten: [
          ...kabupatenMap.values(),
        ].sort(
          (a, b) =>
            b.produksi_kg -
            a.produksi_kg,
        ),

        komposisiJenisKegiatan:
          mapToSortedArray(
            kategoriMap,
          ),

        komposisiJenisPengolahan:
          mapToSortedArray(
            pengolahanMap,
          ),

        komposisiJenisPemasaran:
          mapToSortedArray(
            pemasaranMap,
          ),

        komposisiSkalaUsaha:
          mapToSortedArray(
            skalaMap,
          ),

        distribusiPemasaran: [],
        tenagaKerja: [],
      },
    });
  } catch (error) {
    console.error(
      'Error generating pengolahan pemasaran stats:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const getDashboardStats = async (
  req,
  res,
) => {
  try {
    const data =
      await prisma.pengolahanPemasaranRekap.findMany({
        where: buildPublicWhere(req.query),
      });

    const kabupatenMap = new Map();
    const kegiatanMap = new Map();

    let totalVolume = 0;
    let totalNilai = 0;
    let totalUnit = 0;

    data.forEach(item => {
      const hasilKg = toFloat(
        item.hasil_kg,
      );

      const hasilRp = toFloat(
        item.hasil_rp,
      );

      const jumlahUnit = toInt(
        item.jumlah_unit_usaha,
      );

      totalVolume += hasilKg;
      totalNilai += hasilRp;
      totalUnit += jumlahUnit;

      if (
        !kabupatenMap.has(
          item.kabupaten_kota,
        )
      ) {
        kabupatenMap.set(
          item.kabupaten_kota,
          {
            name: item.kabupaten_kota,
            produksi: 0,
            nilai: 0,
            upi: 0,
          },
        );
      }

      const wilayah = kabupatenMap.get(
        item.kabupaten_kota,
      );

      wilayah.produksi += hasilKg;
      wilayah.nilai += hasilRp;
      wilayah.upi += jumlahUnit;

      if (
        !kegiatanMap.has(
          item.jenis_kegiatan,
        )
      ) {
        kegiatanMap.set(
          item.jenis_kegiatan,
          {
            name: item.jenis_kegiatan,
            value: 0,
            produksi: 0,
            nilai: 0,
          },
        );
      }

      const kegiatan = kegiatanMap.get(
        item.jenis_kegiatan,
      );

      kegiatan.value += jumlahUnit;
      kegiatan.produksi += hasilKg;
      kegiatan.nilai += hasilRp;
    });

    const kegiatan = [
      ...kegiatanMap.values(),
    ].sort(
      (a, b) =>
        b.produksi - a.produksi,
    );

    const topKegiatan =
      kegiatan[0]?.name || '-';

    return res.json({
      success: true,

      stats: {
        kpi: {
          total_volume: totalVolume,
          top_jenis_produk:
            topKegiatan,
          total_nilai: totalNilai,
          total_upi: totalUnit,
        },

        produksiPerKabupaten: [
          ...kabupatenMap.values(),
        ].sort(
          (a, b) =>
            b.produksi - a.produksi,
        ),

        trenBulanan: [],

        top5Jenis: kegiatan
          .slice(0, 5)
          .map(item => item.name),

        komposisiKegiatan: kegiatan,

        heatmapData: [],
      },
    });
  } catch (error) {
    console.error(
      'Error generating pengolahan pemasaran dashboard stats:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const createData = async (req, res) => {
  try {
    const payload = buildPayload(
      req.body,
    );

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const duplicate =
      await prisma.pengolahanPemasaranRekap.findFirst({
        where: buildDuplicateWhere(
          payload,
        ),
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,

        message:
          'Data dengan tahun, kabupaten/kota, jenis kegiatan, dan skala usaha tersebut sudah tersedia.',
      });
    }

    const data =
      await prisma.pengolahanPemasaranRekap.create({
        data: {
          ...payload,

          status: 'PENDING',

          alasan_penolakan: null,
        },
      });

    return res.status(201).json({
      success: true,
      data,

      message:
        'Data berhasil ditambahkan dengan status PENDING',
    });
  } catch (error) {
    console.error(
      'Error creating pengolahan pemasaran data:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updateStatus = async (
  req,
  res,
) => {
  try {
    const id = parseInt(
      req.params.id,
      10,
    );

    const {
      status,
      alasan_penolakan,
    } = req.body;

    if (
      !req.user ||
      req.user.role !== 'admin_pusat'
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Hanya Admin Pusat yang dapat menyetujui atau menolak data',
      });
    }

    if (
      ![
        'APPROVED',
        'VERIFIED',
        'REJECTED',
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    const existing =
      await prisma.pengolahanPemasaranRekap.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    if (existing.status === 'REJECTED') {
      return res.status(400).json({
        success: false,

        message:
          'Data yang ditolak harus diperbaiki terlebih dahulu',
      });
    }

    if (
      status === 'APPROVED' &&
      existing.status !== 'PENDING'
    ) {
      return res.status(400).json({
        success: false,

        message:
          'APPROVED hanya bisa dilakukan pada data berstatus PENDING',
      });
    }

    if (
      status === 'VERIFIED' &&
      existing.status !== 'APPROVED'
    ) {
      return res.status(400).json({
        success: false,

        message:
          'VERIFIED hanya bisa dilakukan setelah data APPROVED',
      });
    }

    if (
      status === 'REJECTED' &&
      !normalizeText(
        alasan_penolakan,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Alasan penolakan wajib diisi',
      });
    }

    const data =
      await prisma.pengolahanPemasaranRekap.update({
        where: {
          id,
        },

        data: {
          status,

          alasan_penolakan:
            status === 'REJECTED'
              ? normalizeText(
                  alasan_penolakan,
                )
              : null,
        },
      });

    return res.json({
      success: true,

      message: `Status berhasil diubah menjadi ${status}`,

      data,
    });
  } catch (error) {
    console.error(
      'Error updating pengolahan pemasaran status:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const updateData = async (req, res) => {
  try {
    const id = parseInt(
      req.params.id,
      10,
    );

    const existing =
      await prisma.pengolahanPemasaranRekap.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    if (
      req.user?.role ===
        'admin_cabang' &&
      [
        'APPROVED',
        'VERIFIED',
      ].includes(existing.status)
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Admin Cabang tidak dapat mengubah data yang sudah divalidasi',
      });
    }

    const payload = buildPayload(
      req.body,
    );

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const duplicate =
      await prisma.pengolahanPemasaranRekap.findFirst({
        where: buildDuplicateWhere(
          payload,
          id,
        ),
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,

        message:
          'Kombinasi data tersebut sudah digunakan oleh data lain.',
      });
    }

    const isRejectedCorrection =
      existing.status === 'REJECTED';

    const data =
      await prisma.pengolahanPemasaranRekap.update({
        where: {
          id,
        },

        data: {
          ...payload,

          status:
            isRejectedCorrection
              ? 'PENDING'
              : existing.status,

          alasan_penolakan:
            isRejectedCorrection
              ? null
              : existing.alasan_penolakan,
        },
      });

    return res.json({
      success: true,
      data,

      message: isRejectedCorrection
        ? 'Data berhasil diperbaiki dan dikirim ulang dengan status PENDING'
        : 'Data berhasil diperbarui',
    });
  } catch (error) {
    console.error(
      'Error updating pengolahan pemasaran data:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const deleteData = async (req, res) => {
  try {
    const id = parseInt(
      req.params.id,
      10,
    );

    const existing =
      await prisma.pengolahanPemasaranRekap.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
    }

    if (
      req.user?.role ===
        'admin_cabang' &&
      [
        'APPROVED',
        'VERIFIED',
      ].includes(existing.status)
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Admin Cabang tidak dapat menghapus data yang sudah divalidasi atau diverifikasi',
      });
    }

    await prisma.pengolahanPemasaranRekap.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: 'Data berhasil dihapus',
    });
  } catch (error) {
    console.error(
      'Error deleting pengolahan pemasaran data:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const batchStatus = async (
  req,
  res,
) => {
  try {
    const {
      ids,
      status,
      alasan_penolakan,
    } = req.body;

    if (
      !req.user ||
      req.user.role !== 'admin_pusat'
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Hanya Admin Pusat yang dapat memvalidasi atau menolak data',
      });
    }

    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Tidak ada data yang dipilih',
      });
    }

    if (
      ![
        'APPROVED',
        'VERIFIED',
        'REJECTED',
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid',
      });
    }

    if (
      status === 'REJECTED' &&
      !normalizeText(
        alasan_penolakan,
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Alasan penolakan wajib diisi',
      });
    }

    const parsedIds = ids
      .map(id =>
        parseInt(id, 10),
      )
      .filter(Number.isInteger);

    if (parsedIds.length === 0) {
      return res.status(400).json({
        success: false,

        message:
          'ID data tidak valid',
      });
    }

    let statusFilter;

    if (status === 'APPROVED') {
      statusFilter = 'PENDING';
    }

    if (status === 'VERIFIED') {
      statusFilter = 'APPROVED';
    }

    const where = {
      id: {
        in: parsedIds,
      },

      ...(status === 'REJECTED'
        ? {
            status: {
              in: [
                'PENDING',
                'APPROVED',
                'VERIFIED',
              ],
            },
          }
        : {
            status: statusFilter,
          }),
    };

    const result =
      await prisma.pengolahanPemasaranRekap.updateMany({
        where,

        data: {
          status,

          alasan_penolakan:
            status === 'REJECTED'
              ? normalizeText(
                  alasan_penolakan,
                )
              : null,
        },
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,

        message:
          'Tidak ada data yang diperbarui. Pastikan status data sesuai tahap validasi.',

        count: 0,
      });
    }

    return res.json({
      success: true,

      message: `${result.count} data berhasil diproses`,

      count: result.count,
    });
  } catch (error) {
    console.error(
      'Error batch status pengolahan pemasaran:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const batchDelete = async (
  req,
  res,
) => {
  try {
    const { ids } = req.body;

    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Tidak ada data yang dipilih',
      });
    }

    const parsedIds = ids
      .map(id =>
        parseInt(id, 10),
      )
      .filter(Number.isInteger);

    if (parsedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID data tidak valid',
      });
    }

    const where = {
      id: {
        in: parsedIds,
      },
    };

    if (
      req.user?.role ===
      'admin_cabang'
    ) {
      where.status = {
        in: [
          'PENDING',
          'REJECTED',
        ],
      };
    }

    const result =
      await prisma.pengolahanPemasaranRekap.deleteMany({
        where,
      });

    return res.json({
      success: true,

      message: `${result.count} data berhasil dihapus`,

      count: result.count,
    });
  } catch (error) {
    console.error(
      'Error batch delete pengolahan pemasaran:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
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
  batchStatus,
  batchDelete,
};