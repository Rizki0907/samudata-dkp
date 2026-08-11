const prisma = require('../utils/prisma');
const ExcelJS = require('exceljs');

const db = prisma.pengolahanPemasaranRekap;
if (!db) throw new Error('Model Prisma PengolahanPemasaranRekap tidak ditemukan.');

const META_MODAL_JENIS = '__MODAL_JENIS__';
const META_MODAL_SKALA = '__MODAL_SKALA__';
const META_DOKUMEN = '__DOKUMEN__';
const META_PLACEHOLDER = '__META__';

// ============================================================================
// Helpers dasar
// ============================================================================
const toNumber = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let text = String(value ?? '').trim().replace(/\s/g, '');
  if (!text) return 0;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  text = text.replace(/[^0-9.-]/g, '');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};
const toInt = value => Math.trunc(toNumber(value));
const clean = value => String(value ?? '').trim();
const normalizeKab = value => clean(value).toUpperCase();
const normalizeKategori = value => clean(value).toLowerCase() === 'pemasaran' ? 'Pemasaran' : 'Pengolahan';
const jsonObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const nonNegativeObject = value => Object.fromEntries(
  Object.entries(jsonObject(value))
    .map(([key, amount]) => [clean(key), Math.max(0, toNumber(amount))])
    .filter(([key]) => key),
);

const isMetaRow = row => [META_MODAL_JENIS, META_MODAL_SKALA, META_DOKUMEN].includes(row?.kategori_kegiatan);

const sumObject = object => Object.values(jsonObject(object)).reduce((sum, value) => sum + toNumber(value), 0);
const packageKey = row => `${row.tahun}|${normalizeKab(row.kabupaten_kota)}`;

// ============================================================================
// Pembentukan "paket" (per tahun + kabupaten/kota) dari row long-format
// ============================================================================
const groupRowsToPackages = rows => {
  const groups = new Map();
  (rows || []).forEach(row => {
    const key = packageKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  return [...groups.values()].map(group => {
    const productionRows = group.filter(row => !isMetaRow(row));
    const details = productionRows.map(row => ({
      id: row.id,
      kategori_kegiatan: normalizeKategori(row.kategori_kegiatan),
      jenis_kegiatan: row.jenis_kegiatan,
      skala_usaha: row.skala_usaha,
      jumlah_unit_usaha: toInt(row.jumlah_unit_usaha),
      hasil_kg: toNumber(row.hasil_kg),
      hasil_rp: toNumber(row.hasil_rp),
    }));

    const modalJenisRows = group.filter(row => row.kategori_kegiatan === META_MODAL_JENIS);
    const modalSkalaRows = group.filter(row => row.kategori_kegiatan === META_MODAL_SKALA);
    const docRow = group.find(row => row.kategori_kegiatan === META_DOKUMEN) || null;

    const modalByJenis = modalJenisRows.length
      ? Object.fromEntries(modalJenisRows.filter(row => clean(row.jenis_kegiatan) && toNumber(row.modal_rp) > 0).map(row => [row.jenis_kegiatan, toNumber(row.modal_rp)]))
      : productionRows.reduce((acc, row) => {
          if (toNumber(row.modal_rp) > 0 && clean(row.jenis_kegiatan)) acc[row.jenis_kegiatan] = (acc[row.jenis_kegiatan] || 0) + toNumber(row.modal_rp);
          return acc;
        }, {});

    const modalBySkala = modalSkalaRows.length
      ? Object.fromEntries(modalSkalaRows.filter(row => clean(row.skala_usaha) && toNumber(row.modal_rp) > 0).map(row => [row.skala_usaha, toNumber(row.modal_rp)]))
      : productionRows.reduce((acc, row) => {
          if (toNumber(row.modal_rp) > 0 && clean(row.skala_usaha)) acc[row.skala_usaha] = (acc[row.skala_usaha] || 0) + toNumber(row.modal_rp);
          return acc;
        }, {});

    const docs = {
      sertifikat_produk: nonNegativeObject(docRow?.dokumen_detail?.sertifikat_produk),
      izin_usaha: nonNegativeObject(docRow?.dokumen_detail?.izin_usaha),
      sertifikat_lahan_bangunan: nonNegativeObject(docRow?.dokumen_detail?.sertifikat_lahan_bangunan),
    };
    const totalModalJenis = sumObject(modalByJenis);
    const totalModalSkala = sumObject(modalBySkala);
    const totalModal = totalModalJenis || totalModalSkala;
    const updatedAt = group.reduce((latest, row) => {
      const date = new Date(row.updated_at || row.created_at || 0);
      return date > latest ? date : latest;
    }, new Date(0));
    const categories = [...new Set(details.map(item => item.kategori_kegiatan).filter(Boolean))];
    const types = [...new Set(details.map(item => item.jenis_kegiatan).filter(Boolean))];
    const scales = [...new Set(details.map(item => item.skala_usaha).filter(Boolean))];
    const statusSource = group[0] || {};

    return {
      id: productionRows[0]?.id || group[0]?.id,
      row_ids: group.map(row => row.id),
      tahun: group[0]?.tahun,
      kabupaten_kota: group[0]?.kabupaten_kota,
      status: statusSource.status || 'APPROVED',
      alasan_penolakan: group.find(row => row.alasan_penolakan)?.alasan_penolakan || null,
      details,
      modal_by_jenis: modalByJenis,
      modal_by_skala: modalBySkala,
      dokumen: docs,
      jumlah_rincian: details.length,
      jumlah_jenis_kegiatan: types.length,
      jumlah_skala: scales.length,
      kategori_kegiatan: categories.join(', '),
      jenis_kegiatan: types.join(', '),
      skala_usaha: scales.join(', '),
      jumlah_unit_usaha: details.reduce((sum, item) => sum + toNumber(item.jumlah_unit_usaha), 0),
      hasil_kg: details.reduce((sum, item) => sum + toNumber(item.hasil_kg), 0),
      hasil_rp: details.reduce((sum, item) => sum + toNumber(item.hasil_rp), 0),
      modal_rp: totalModal,
      modal_total_jenis: totalModalJenis,
      modal_total_skala: totalModalSkala,
      updated_at: updatedAt.getTime() ? updatedAt.toISOString() : null,
      created_at: group[0]?.created_at || null,
    };
  }).sort((a, b) => Number(b.tahun) - Number(a.tahun) || String(a.kabupaten_kota).localeCompare(String(b.kabupaten_kota), 'id'));
};

const packageMatchesQuery = (pkg, query = {}) => {
  if (query.tahun && Number(pkg.tahun) !== toInt(query.tahun)) return false;
  if (query.kabupaten_kota && pkg.kabupaten_kota !== query.kabupaten_kota) return false;
  if (query.kategori_kegiatan) {
    const wanted = normalizeKategori(query.kategori_kegiatan);
    if (!pkg.details.some(detail => detail.kategori_kegiatan === wanted)) return false;
  }
  if (query.jenis_kegiatan) {
    const wanted = clean(query.jenis_kegiatan);
    if (!pkg.details.some(detail => detail.jenis_kegiatan === wanted)) return false;
  }
  if (query.skala_usaha && !pkg.details.some(detail => detail.skala_usaha === query.skala_usaha)) return false;
  return true;
};

const getRawRows = async ({ verifiedOnly = false } = {}) => db.findMany({
  where: verifiedOnly ? { status: 'VERIFIED' } : undefined,
  orderBy: [{ tahun: 'desc' }, { kabupaten_kota: 'asc' }, { id: 'asc' }],
});

// ============================================================================
// CRUD & Statistik (endpoint API biasa)
// ============================================================================
const getAllData = async (req, res) => {
  try {
    // Samakan sumber data Statistik Publik dengan Visualisasi Statistik Pusat:
    // paket dibentuk dari seluruh row terlebih dahulu, lalu hanya paket VERIFIED
    // yang dikirim ke publik. Dengan begitu rincian dalam satu paket tidak
    // terpotong hanya karena status row internal/meta tidak identik.
    const packages = groupRowsToPackages(await getRawRows())
      .filter(pkg => pkg.status === 'VERIFIED')
      .filter(pkg => packageMatchesQuery(pkg, req.query));

    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('getAllData:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getAdminData = async (req, res) => {
  try {
    res.json({ success: true, data: groupRowsToPackages(await getRawRows()) });
  } catch (error) {
    console.error('getAdminData:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const flattenPackageDetails = packages => packages.flatMap(pkg => pkg.details.map(detail => ({ ...detail, tahun: pkg.tahun, kabupaten_kota: pkg.kabupaten_kota, status: pkg.status })));

const buildStats = packages => {
  const rows = flattenPackageDetails(packages);
  const kpi = {
    total_unit_usaha: rows.reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0),
    total_produksi_kg: rows.reduce((sum, row) => sum + toNumber(row.hasil_kg), 0),
    total_nilai_produksi_rp: rows.reduce((sum, row) => sum + toNumber(row.hasil_rp), 0),
    total_modal_rp: packages.reduce((sum, pkg) => sum + toNumber(pkg.modal_rp), 0),
  };
  const kabMap = new Map(); const kategoriMap = new Map(); const pengMap = new Map(); const pemMap = new Map(); const skalaMap = new Map();
  rows.forEach(row => {
    if (!kabMap.has(row.kabupaten_kota)) kabMap.set(row.kabupaten_kota, { name: row.kabupaten_kota, jumlah_unit: 0, produksi_kg: 0, nilai_produksi_rp: 0, modal_rp: 0 });
    const kab = kabMap.get(row.kabupaten_kota); kab.jumlah_unit += toNumber(row.jumlah_unit_usaha); kab.produksi_kg += toNumber(row.hasil_kg); kab.nilai_produksi_rp += toNumber(row.hasil_rp);
    kategoriMap.set(row.kategori_kegiatan, (kategoriMap.get(row.kategori_kegiatan) || 0) + toNumber(row.jumlah_unit_usaha));
    skalaMap.set(row.skala_usaha, (skalaMap.get(row.skala_usaha) || 0) + toNumber(row.jumlah_unit_usaha));
    const map = row.kategori_kegiatan === 'Pemasaran' ? pemMap : pengMap;
    map.set(row.jenis_kegiatan, (map.get(row.jenis_kegiatan) || 0) + toNumber(row.jumlah_unit_usaha));
  });
  packages.forEach(pkg => { const kab = kabMap.get(pkg.kabupaten_kota); if (kab) kab.modal_rp += toNumber(pkg.modal_rp); });
  const arr = map => [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return { kpi, produksiPerKabupaten: [...kabMap.values()].sort((a, b) => b.produksi_kg - a.produksi_kg), komposisiJenisKegiatan: arr(kategoriMap), komposisiJenisPengolahan: arr(pengMap), komposisiJenisPemasaran: arr(pemMap), komposisiSkalaUsaha: arr(skalaMap), distribusiPemasaran: [], tenagaKerja: [] };
};

const getStats = async (req, res) => {
  try {
    const packages = groupRowsToPackages(await getRawRows({ verifiedOnly: true })).filter(pkg => packageMatchesQuery(pkg, req.query));
    res.json({ success: true, stats: buildStats(packages) });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error', error: error.message }); }
};

const getDashboardStats = async (req, res) => {
  try {
    const packages = groupRowsToPackages(await getRawRows({ verifiedOnly: true })).filter(pkg => packageMatchesQuery(pkg, req.query));
    const rows = flattenPackageDetails(packages);
    const kabMap = new Map(); const jenisMap = new Map();
    rows.forEach(row => {
      if (!kabMap.has(row.kabupaten_kota)) kabMap.set(row.kabupaten_kota, { name: row.kabupaten_kota, produksi: 0, nilai: 0, upi: 0 });
      const kab = kabMap.get(row.kabupaten_kota); kab.produksi += toNumber(row.hasil_kg); kab.nilai += toNumber(row.hasil_rp); kab.upi += toNumber(row.jumlah_unit_usaha);
      if (!jenisMap.has(row.jenis_kegiatan)) jenisMap.set(row.jenis_kegiatan, { name: row.jenis_kegiatan, value: 0, produksi: 0, nilai: 0 });
      const jenis = jenisMap.get(row.jenis_kegiatan); jenis.value += toNumber(row.jumlah_unit_usaha); jenis.produksi += toNumber(row.hasil_kg); jenis.nilai += toNumber(row.hasil_rp);
    });
    const kegiatan = [...jenisMap.values()].sort((a, b) => b.produksi - a.produksi);
    res.json({ success: true, stats: {
      kpi: { total_produksi: rows.reduce((s, r) => s + toNumber(r.hasil_kg), 0), top_jenis_produk: kegiatan[0]?.name || '-', total_nilai: rows.reduce((s, r) => s + toNumber(r.hasil_rp), 0), total_upi: rows.reduce((s, r) => s + toNumber(r.jumlah_unit_usaha), 0) },
      produksiPerKabupaten: [...kabMap.values()].sort((a, b) => b.produksi - a.produksi), trenBulanan: [], top5Jenis: kegiatan.slice(0, 5).map(item => item.name), komposisiKegiatan: kegiatan, heatmapData: [],
    }});
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error', error: error.message }); }
};

// ============================================================================
// Simpan / update / hapus paket
// ============================================================================
const parsePackageBody = body => {
  const tahun = toInt(body?.tahun); const kabupaten_kota = normalizeKab(body?.kabupaten_kota);
  const details = Array.isArray(body?.details) ? body.details.map(item => ({
    kategori_kegiatan: normalizeKategori(item.kategori_kegiatan), jenis_kegiatan: clean(item.jenis_kegiatan), skala_usaha: clean(item.skala_usaha),
    jumlah_unit_usaha: Math.max(0, toInt(item.jumlah_unit_usaha)), hasil_kg: Math.max(0, toNumber(item.hasil_kg)), hasil_rp: Math.max(0, toNumber(item.hasil_rp)),
  })) : [];
  const modal_by_jenis = nonNegativeObject(body?.modal_by_jenis);
  const modal_by_skala = nonNegativeObject(body?.modal_by_skala);
  const sourceDocs = jsonObject(body?.dokumen);
  const dokumen = {
    sertifikat_produk: nonNegativeObject(sourceDocs.sertifikat_produk),
    izin_usaha: nonNegativeObject(sourceDocs.izin_usaha),
    sertifikat_lahan_bangunan: nonNegativeObject(sourceDocs.sertifikat_lahan_bangunan),
  };
  return { tahun, kabupaten_kota, details, modal_by_jenis, modal_by_skala, dokumen };
};

const validatePackage = pkg => {
  if (!pkg.tahun) return 'Tahun wajib diisi.';
  if (!pkg.kabupaten_kota) return 'Kabupaten/Kota wajib dipilih.';
  if (!pkg.details.length) return 'Tambahkan minimal satu rincian Unit Usaha & Produksi.';
  const seen = new Set();
  for (let i = 0; i < pkg.details.length; i += 1) {
    const item = pkg.details[i];
    if (!item.kategori_kegiatan) return `Rincian ke-${i + 1}: Kategori kegiatan wajib dipilih.`;
    if (!item.jenis_kegiatan) return `Rincian ke-${i + 1}: Jenis kegiatan wajib dipilih.`;
    if (!item.skala_usaha) return `Rincian ke-${i + 1}: Skala usaha wajib dipilih.`;
    const key = `${item.kategori_kegiatan}|${item.jenis_kegiatan}|${item.skala_usaha}`.toLowerCase();
    if (seen.has(key)) return `Rincian ${item.jenis_kegiatan} - ${item.skala_usaha} tercantum lebih dari satu kali.`;
    seen.add(key);
  }
  return null;
};

// Dokumen (sertifikat produk, izin usaha, sertifikat lahan & bangunan) disimpan
// sebagai JSON dinamis (dokumen_detail) pada satu baris meta '__DOKUMEN__'.
// Karena bentuknya JSON bebas -- bukan kolom fixed satu-satu -- menambah jenis
// dokumen baru di Master Data TIDAK memerlukan perubahan skema/kode di sini;
// otomatis ikut tersimpan apa adanya.
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

  const hasDocs = ['sertifikat_produk', 'izin_usaha', 'sertifikat_lahan_bangunan']
    .some(group => Object.keys(nonNegativeObject(pkg.dokumen?.[group])).length > 0);

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
    dokumen_detail: {
      sertifikat_produk: nonNegativeObject(pkg.dokumen?.sertifikat_produk),
      izin_usaha: nonNegativeObject(pkg.dokumen?.izin_usaha),
      sertifikat_lahan_bangunan: nonNegativeObject(pkg.dokumen?.sertifikat_lahan_bangunan),
    },
    status,
    alasan_penolakan: alasan,
  }] : [];

  return [...details, ...modalJenisRows, ...modalSkalaRows, ...docRows];
};

const createBatchData = async (req, res) => {
  try {
    const pkg = parsePackageBody(req.body);
    const error = validatePackage(pkg);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const exists = await db.findFirst({
      where: {
        tahun: pkg.tahun,
        kabupaten_kota: pkg.kabupaten_kota,
      },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Data untuk Tahun dan Kab/Kota tersebut sudah tersedia. Gunakan Edit Data.',
      });
    }

    const rows = createPackageRows(pkg);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data yang dapat disimpan.',
      });
    }

    const created = await prisma.$transaction(
      rows.map(data => db.create({ data })),
    );

    const result = groupRowsToPackages(created)[0];

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Data berhasil disimpan dengan status APPROVED.',
    });
  } catch (error) {
    console.error('createBatchData:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal menyimpan data.',
    });
  }
};

const createData = createBatchData;

const findPackageIdentity = async id => {
  const row = await db.findUnique({ where: { id: toInt(id) } });
  return row ? { row, where: { tahun: row.tahun, kabupaten_kota: row.kabupaten_kota } } : null;
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
    await prisma.$transaction(async tx => {
      await tx.pengolahanPemasaranRekap.deleteMany({
        where: found.where,
      });
      await tx.pengolahanPemasaranRekap.createMany({
        data: rows,
      });
    });
    
    const resultRows = await db.findMany({
      where: {
        tahun: pkg.tahun,
        kabupaten_kota: pkg.kabupaten_kota,
      },
      orderBy: {
        id: 'asc',
      },
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

// ============================================================================
// Master data helpers
// ----------------------------------------------------------------------------
// Semua daftar (kabupaten/kota, jenis pengolahan, jenis pemasaran, skala
// usaha, sertifikat produk, izin usaha, sertifikat lahan & bangunan) dibaca
// LANGSUNG dari tabel MasterData setiap kali export dijalankan. Ini kunci
// dari sinkronisasi otomatis: tambah item baru di Master Data -> otomatis
// muncul sebagai baris (kab/kota) atau kolom (jenis/skala/dokumen) baru di
// file export, tanpa perlu ubah kode apa pun.
//
// FALLBACK hanya dipakai kalau tabel MasterData untuk kategori tsb masih
// benar-benar kosong (mis. sebelum admin pernah mengisi Master Data-nya).
// ============================================================================
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

// ============================================================================
// Styling Excel
// ============================================================================
const EXCEL_BLUE = '1F4E79';
const EXCEL_SUB_BLUE = '1F4E79';
const EXCEL_WHITE = 'FFFFFF';
const EXCEL_BLACK = '000000';
const EXCEL_BORDER = '000000';

const excelBorder = {
  top: { style: 'thin', color: { argb: EXCEL_BORDER } },
  left: { style: 'thin', color: { argb: EXCEL_BORDER } },
  bottom: { style: 'thin', color: { argb: EXCEL_BORDER } },
  right: { style: 'thin', color: { argb: EXCEL_BORDER } },
};

const excelCleanText = value => {
  const text = clean(value);
  if (!text) return '-';
  return text.replace(/\s*&\s*/g, ' dan ');
};

const excelMetricValue = value => {
  const number = toNumber(value);
  return number === 0 ? '-' : number;
};

const styleExcelTitle = cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_WHITE } };
  cell.font = { bold: true, size: 12, color: { argb: EXCEL_BLACK } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
};

const styleExcelHeader = cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_BLUE } };
  cell.font = { bold: true, size: 10, color: { argb: EXCEL_WHITE } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = excelBorder;
};

const styleExcelSubHeader = cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_SUB_BLUE } };
  cell.font = { bold: true, size: 9, color: { argb: EXCEL_WHITE } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = excelBorder;
};

const styleExcelBody = cell => {
  cell.border = excelBorder;
  cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left', wrapText: true };
};

const styleExcelTotal = cell => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_BLUE } };
  cell.font = { bold: true, color: { argb: EXCEL_WHITE } };
  cell.border = excelBorder;
  cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'center', wrapText: true };
};

const setExcelMetricCell = (cell, value, unit = 'number') => {
  const number = toNumber(value);

  if (number === 0) {
    cell.value = '-';
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    return;
  }

  cell.value = number;
  cell.numFmt = unit === 'currency' ? '"Rp" #,##0' : '#,##0';
  cell.alignment = { vertical: 'middle', horizontal: 'right' };
};

const setExcelRegionId = (cell, value) => {
  const raw = clean(value);
  const numeric = Number(raw);

  if (raw && Number.isFinite(numeric)) {
    cell.value = numeric;
    cell.numFmt = '00';
  } else {
    cell.value = raw || '-';
  }

  cell.alignment = { vertical: 'middle', horizontal: 'center' };
};

const autoSizeExcel = sheet => {
  sheet.columns.forEach((column, index) => {
    let width = index === 0 ? 6 : 8;

    column.eachCell({ includeEmpty: false }, cell => {
      if (cell.row <= 2) return;
      const rawValue = cell.value?.text ?? cell.value;
      const textValue = String(rawValue ?? '');
      const measured = Math.min(textValue.length + 1.5, 22);
      width = Math.max(width, measured);
    });

    column.width = Math.min(Math.max(width, 6), 22);
  });
};

const formatExcelDate = () => new Date().toLocaleString('id-ID');

// ============================================================================
// Pemilihan paket untuk export
// ============================================================================
const selectPackagesForExport = async ({ ids, tahun, regions, admin }) => {
  // Ambil seluruh row dulu, bentuk package dulu, lalu filter.
  // Ini penting supaya meta row Modal/Dokumen tidak terpotong.
  let packages = groupRowsToPackages(await getRawRows());

  if (Array.isArray(ids) && ids.length) {
    const selected = new Set(ids.map(String));
    packages = packages.filter(
      pkg => selected.has(String(pkg.id)) || (pkg.row_ids || []).some(id => selected.has(String(id))),
    );
  }

  if (tahun) {
    packages = packages.filter(pkg => Number(pkg.tahun) === toInt(tahun));
  }

  if (Array.isArray(regions) && regions.length) {
    const selected = new Set(regions.map(region => normalizeKab(region)));
    packages = packages.filter(pkg => selected.has(normalizeKab(pkg.kabupaten_kota)));
  }

  if (!admin) {
    packages = packages.filter(pkg => pkg.status === 'VERIFIED');
  }

  return packages;
};

// ============================================================================
// Sheet sederhana (long-format): Unit dan Produksi / Modal / Sertifikat dan Izin
// Karena bentuknya baris-per-rincian, kolom tidak perlu didefinisikan ulang
// saat ada jenis/kategori baru -- otomatis ikut lewat data yang diloop.
// ============================================================================
const prepareSimpleExportSheet = (sheet, title, headers) => {
  const lastCol = headers.length;

  sheet.mergeCells(1, 1, 1, lastCol);
  sheet.getCell(1, 1).value = excelCleanText(title);
  styleExcelTitle(sheet.getCell(1, 1));

  sheet.mergeCells(2, 1, 2, lastCol);
  sheet.getCell(2, 1).value = `Tanggal ekspor: ${formatExcelDate()}`;
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

const styleSimpleDataRow = (row, { idColumn = 2, numericColumns = [], currencyColumns = [] } = {}) => {
  row.eachCell({ includeEmpty: true }, styleExcelBody);

  if (idColumn) {
    setExcelRegionId(row.getCell(idColumn), row.getCell(idColumn).value);
  }

  numericColumns.forEach(column => {
    setExcelMetricCell(row.getCell(column), row.getCell(column).value, 'number');
  });

  currencyColumns.forEach(column => {
    setExcelMetricCell(row.getCell(column), row.getCell(column).value, 'currency');
  });
};

const buildDataWorkbook = async packages => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dinas Kelautan dan Perikanan';
  workbook.created = new Date();

  const regionMap = new Map((await regionInfo()).map(item => [normalizeKab(item.name), item.id]));

  // ---------- 1. Unit dan Produksi ----------
  const produksi = workbook.addWorksheet('Unit dan Produksi');

  prepareSimpleExportSheet(
    produksi,
    'DATA UNIT DAN PRODUKSI PENGOLAHAN DAN PEMASARAN PRODUK KELAUTAN DAN PERIKANAN',
    ['No', 'ID Wilayah', 'Status', 'Tahun', 'Kab/Kota', 'Kategori Kegiatan', 'Jenis Kegiatan', 'Skala Usaha', 'Jumlah Unit Usaha', 'Hasil Produksi (Kg)', 'Nilai Produksi (Rp)'],
  );

  let noProduksi = 1;

  packages.forEach(pkg => {
    (pkg.details || []).forEach(detail => {
      const row = produksi.addRow([
        noProduksi,
        regionMap.get(normalizeKab(pkg.kabupaten_kota)) || '-',
        pkg.status || '-',
        pkg.tahun || '-',
        excelCleanText(pkg.kabupaten_kota),
        excelCleanText(detail.kategori_kegiatan),
        excelCleanText(detail.jenis_kegiatan),
        excelCleanText(detail.skala_usaha),
        toNumber(detail.jumlah_unit_usaha),
        toNumber(detail.hasil_kg),
        toNumber(detail.hasil_rp),
      ]);

      styleSimpleDataRow(row, { idColumn: 2, numericColumns: [9, 10], currencyColumns: [11] });
      noProduksi += 1;
    });
  });

  // ---------- 2. Modal ----------
  const modal = workbook.addWorksheet('Modal');

  prepareSimpleExportSheet(
    modal,
    'DATA MODAL PENGOLAHAN DAN PEMASARAN PRODUK KELAUTAN DAN PERIKANAN',
    ['No', 'ID Wilayah', 'Status', 'Tahun', 'Kab/Kota', 'Dasar Modal', 'Rincian', 'Investasi Modal (Rp)'],
  );

  let noModal = 1;

  packages.forEach(pkg => {
    Object.entries(pkg.modal_by_jenis || {}).forEach(([jenis, value]) => {
      const row = modal.addRow([
        noModal,
        regionMap.get(normalizeKab(pkg.kabupaten_kota)) || '-',
        pkg.status || '-',
        pkg.tahun || '-',
        excelCleanText(pkg.kabupaten_kota),
        'Jenis Kegiatan',
        excelCleanText(jenis),
        toNumber(value),
      ]);

      styleSimpleDataRow(row, { idColumn: 2, currencyColumns: [8] });
      noModal += 1;
    });

    Object.entries(pkg.modal_by_skala || {}).forEach(([skala, value]) => {
      const row = modal.addRow([
        noModal,
        regionMap.get(normalizeKab(pkg.kabupaten_kota)) || '-',
        pkg.status || '-',
        pkg.tahun || '-',
        excelCleanText(pkg.kabupaten_kota),
        'Skala Usaha',
        excelCleanText(skala),
        toNumber(value),
      ]);

      styleSimpleDataRow(row, { idColumn: 2, currencyColumns: [8] });
      noModal += 1;
    });
  });

  // ---------- 3. Sertifikat dan Izin ----------
  const dokumen = workbook.addWorksheet('Sertifikat dan Izin');

  prepareSimpleExportSheet(
    dokumen,
    'DATA SERTIFIKAT DAN IZIN PENGOLAHAN DAN PEMASARAN PRODUK KELAUTAN DAN PERIKANAN',
    ['No', 'ID Wilayah', 'Status', 'Tahun', 'Kab/Kota', 'Kelompok Dokumen', 'Jenis Dokumen', 'Jumlah'],
  );

  const groupLabels = {
    sertifikat_produk: 'Sertifikat Produk',
    izin_usaha: 'Izin Usaha',
    sertifikat_lahan_bangunan: 'Sertifikat Lahan dan Bangunan',
  };

  let noDokumen = 1;

  packages.forEach(pkg => {
    Object.entries(pkg.dokumen || {}).forEach(([group, entries]) => {
      Object.entries(jsonObject(entries)).forEach(([jenis, value]) => {
        const row = dokumen.addRow([
          noDokumen,
          regionMap.get(normalizeKab(pkg.kabupaten_kota)) || '-',
          pkg.status || '-',
          pkg.tahun || '-',
          excelCleanText(pkg.kabupaten_kota),
          groupLabels[group] || excelCleanText(group),
          excelCleanText(jenis),
          toNumber(value),
        ]);

        styleSimpleDataRow(row, { idColumn: 2, numericColumns: [8] });
        noDokumen += 1;
      });
    });
  });

  workbook.worksheets.forEach(autoSizeExcel);
  return workbook;
};

// ============================================================================
// REKAP STATISTIK
// Bentuk mengikuti HASIL ANALISIS:
// - banyak tabel putih dalam satu sheet
// - tabel berjajar ke kanan
// - subheader berwarna BIRU
// - nilai 0 / kosong = "-"
//
// Kolom & baris tabel di sini SELALU dihasilkan dari `regions` dan `config`
// yang datang dari masterValues()/regionInfo() -- bukan hardcode -- sehingga
// otomatis mengikuti Master Data terbaru setiap kali export dijalankan.
// ============================================================================
const buildAnalysisRegionRows = ({ regions, columns, valueFor }) => {
  const rows = regions.map(region => {
    const values = columns.map(column => toNumber(valueFor(region.name, column)));
    return { region, values, total: values.reduce((sum, value) => sum + value, 0) };
  });

  const totals = columns.map((_, index) => rows.reduce((sum, row) => sum + toNumber(row.values[index]), 0));

  return { rows, totals, grandTotal: totals.reduce((sum, value) => sum + value, 0) };
};

const writeAnalysisTable = ({ worksheet, startCol, title, groupLabel, columns, regions, valueFor, unit = 'number' }) => {
  const titleRow = 1;
  const groupRow = 2;
  const headerRow = 3;
  const dataStartRow = 4;

  const width = 3 + columns.length;
  const endCol = startCol + width - 1;

  worksheet.mergeCells(titleRow, startCol, titleRow, endCol);
  worksheet.getCell(titleRow, startCol).value = excelCleanText(title);
  styleExcelTitle(worksheet.getCell(titleRow, startCol));

  worksheet.mergeCells(groupRow, startCol, headerRow, startCol);
  worksheet.getCell(groupRow, startCol).value = 'No';
  styleExcelHeader(worksheet.getCell(groupRow, startCol));

  worksheet.mergeCells(groupRow, startCol + 1, headerRow, startCol + 1);
  worksheet.getCell(groupRow, startCol + 1).value = 'Kab/Kota';
  styleExcelHeader(worksheet.getCell(groupRow, startCol + 1));

  if (columns.length) {
    worksheet.mergeCells(groupRow, startCol + 2, groupRow, startCol + 1 + columns.length);
    worksheet.getCell(groupRow, startCol + 2).value = excelCleanText(groupLabel);
    styleExcelHeader(worksheet.getCell(groupRow, startCol + 2));
  }

  columns.forEach((column, index) => {
    const cell = worksheet.getCell(headerRow, startCol + 2 + index);
    cell.value = excelCleanText(column);
    styleExcelSubHeader(cell);
  });

  const totalCol = endCol;

  worksheet.mergeCells(groupRow, totalCol, headerRow, totalCol);
  worksheet.getCell(groupRow, totalCol).value = 'Jumlah Total';
  styleExcelHeader(worksheet.getCell(groupRow, totalCol));

  const summary = buildAnalysisRegionRows({ regions, columns, valueFor });

  summary.rows.forEach((rowInfo, index) => {
    const rowNo = dataStartRow + index;

    setExcelRegionId(worksheet.getCell(rowNo, startCol), rowInfo.region.id);
    worksheet.getCell(rowNo, startCol + 1).value = excelCleanText(rowInfo.region.name);

    rowInfo.values.forEach((value, valueIndex) => {
      setExcelMetricCell(worksheet.getCell(rowNo, startCol + 2 + valueIndex), value, unit);
    });

    setExcelMetricCell(worksheet.getCell(rowNo, totalCol), rowInfo.total, unit);

    for (let col = startCol; col <= endCol; col += 1) {
      styleExcelBody(worksheet.getCell(rowNo, col));
    }
  });

  const totalRow = dataStartRow + summary.rows.length;

  worksheet.getCell(totalRow, startCol).value = '';
  worksheet.getCell(totalRow, startCol + 1).value = 'JUMLAH JAWA TIMUR';

  summary.totals.forEach((value, index) => {
    const cell = worksheet.getCell(totalRow, startCol + 2 + index);
    setExcelMetricCell(cell, value, unit);
  });

  setExcelMetricCell(worksheet.getCell(totalRow, totalCol), summary.grandTotal, unit);

  for (let col = startCol; col <= endCol; col += 1) {
    styleExcelTotal(worksheet.getCell(totalRow, col));
  }

  worksheet.getColumn(startCol).width = 7;
  worksheet.getColumn(startCol + 1).width = 24;

  for (let col = startCol + 2; col <= endCol; col += 1) {
    worksheet.getColumn(col).width = 14;
  }

  worksheet.getRow(titleRow).height = 32;
  worksheet.getRow(groupRow).height = 28;
  worksheet.getRow(headerRow).height = 38;

  return { title, cell: worksheet.getCell(titleRow, startCol).address, width };
};

const createMetricAnalysisSheet = ({ workbook, packages, regions, config, sheetName, metricLabel, field, unit, tableCounter, daftarIsi }) => {
  const worksheet = workbook.addWorksheet(sheetName);
  let startCol = 1;

  const packageMap = new Map(packages.map(pkg => [normalizeKab(pkg.kabupaten_kota), pkg]));

  const metric = (region, { jenis = null, kategori = null, skala = null } = {}) => {
    const pkg = packageMap.get(normalizeKab(region));
    if (!pkg) return 0;

    return (pkg.details || [])
      .filter(detail =>
        (!jenis || normalizeKab(detail.jenis_kegiatan) === normalizeKab(jenis)) &&
        (!kategori || detail.kategori_kegiatan === kategori) &&
        (!skala || normalizeKab(detail.skala_usaha) === normalizeKab(skala))
      )
      .reduce((sum, detail) => sum + toNumber(detail[field]), 0);
  };

  const addTable = ({ suffix, groupLabel, columns, valueFor }) => {
    const tableNumber = tableCounter.value++;
    const title = `Tabel ${tableNumber} ${metricLabel} ${suffix} Pengolahan dan Pemasaran Produk Kelautan dan Perikanan`;

    const meta = writeAnalysisTable({ worksheet, startCol, title, groupLabel, columns, regions, valueFor, unit });

    daftarIsi.push({ title, sheetName, cell: meta.cell });
    startCol += meta.width + 2;
  };

  // Urutan mengikuti pola Hasil Analisis.
  addTable({
    suffix: 'berdasarkan Jenis Kegiatan',
    groupLabel: 'Jenis Kegiatan',
    columns: config.kegiatan,
    valueFor: (region, jenis) => metric(region, { jenis }),
  });

  addTable({
    suffix: 'berdasarkan Jenis Kegiatan Pengolahan',
    groupLabel: 'Jenis Kegiatan Pengolahan',
    columns: config.pengolahan,
    valueFor: (region, jenis) => metric(region, { jenis, kategori: 'Pengolahan' }),
  });

  addTable({
    suffix: 'berdasarkan Jenis Kegiatan Pemasaran',
    groupLabel: 'Jenis Kegiatan Pemasaran',
    columns: config.pemasaran,
    valueFor: (region, jenis) => metric(region, { jenis, kategori: 'Pemasaran' }),
  });

  addTable({
    suffix: 'berdasarkan Skala Usaha',
    groupLabel: 'Skala Usaha',
    columns: config.scales,
    valueFor: (region, skala) => metric(region, { skala }),
  });

  addTable({
    suffix: 'berdasarkan Skala Usaha pada Kegiatan Pengolahan',
    groupLabel: 'Skala Usaha',
    columns: config.scales,
    valueFor: (region, skala) => metric(region, { kategori: 'Pengolahan', skala }),
  });

  addTable({
    suffix: 'berdasarkan Skala Usaha pada Kegiatan Pemasaran',
    groupLabel: 'Skala Usaha',
    columns: config.scales,
    valueFor: (region, skala) => metric(region, { kategori: 'Pemasaran', skala }),
  });

  config.kegiatan.forEach(jenis => {
    addTable({
      suffix: `berdasarkan Skala Usaha pada Jenis Kegiatan ${excelCleanText(jenis)}`,
      groupLabel: 'Skala Usaha',
      columns: config.scales,
      valueFor: (region, skala) => metric(region, { jenis, skala }),
    });
  });

  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
  return worksheet;
};

const createModalAnalysisSheet = ({ workbook, packages, regions, config, tableCounter, daftarIsi }) => {
  const worksheet = workbook.addWorksheet('Modal');
  const packageMap = new Map(packages.map(pkg => [normalizeKab(pkg.kabupaten_kota), pkg]));

  let startCol = 1;

  const definitions = [
    {
      suffix: 'berdasarkan Jenis Kegiatan',
      groupLabel: 'Jenis Kegiatan',
      columns: config.kegiatan,
      valueFor: (region, jenis) => toNumber(packageMap.get(normalizeKab(region))?.modal_by_jenis?.[jenis]),
    },
    {
      suffix: 'berdasarkan Skala Usaha',
      groupLabel: 'Skala Usaha',
      columns: config.scales,
      valueFor: (region, skala) => toNumber(packageMap.get(normalizeKab(region))?.modal_by_skala?.[skala]),
    },
  ];

  definitions.forEach(definition => {
    const tableNumber = tableCounter.value++;
    const title = `Tabel ${tableNumber} Jumlah Investasi Modal (Rp) ${definition.suffix} Pengolahan dan Pemasaran Produk Kelautan dan Perikanan`;

    const meta = writeAnalysisTable({
      worksheet,
      startCol,
      title,
      groupLabel: definition.groupLabel,
      columns: definition.columns,
      regions,
      valueFor: definition.valueFor,
      unit: 'currency',
    });

    daftarIsi.push({ title, sheetName: 'Modal', cell: meta.cell });
    startCol += meta.width + 2;
  });

  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
  return worksheet;
};

const createDocumentAnalysisSheet = ({ workbook, packages, regions, sheetName, titleLabel, key, options, tableCounter, daftarIsi }) => {
  const worksheet = workbook.addWorksheet(sheetName);
  const packageMap = new Map(packages.map(pkg => [normalizeKab(pkg.kabupaten_kota), pkg]));

  let startCol = 1;

  const definitions = [
    {
      suffix: 'per Kab/Kota',
      groupLabel: 'Jenis Dokumen',
      columns: options,
      valueFor: (region, option) => toNumber(packageMap.get(normalizeKab(region))?.dokumen?.[key]?.[option]),
    },
  ];

  definitions.forEach(definition => {
    const tableNumber = tableCounter.value++;
    const title = `Tabel ${tableNumber} ${titleLabel} ${definition.suffix} Pengolahan dan Pemasaran Produk Kelautan dan Perikanan`;

    const meta = writeAnalysisTable({
      worksheet,
      startCol,
      title,
      groupLabel: definition.groupLabel,
      columns: definition.columns,
      regions,
      valueFor: definition.valueFor,
      unit: 'number',
    });

    daftarIsi.push({ title, sheetName, cell: meta.cell });
    startCol += meta.width + 2;
  });

  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
  return worksheet;
};

const createDynamicDaftarIsiSheet = (worksheet, year, entries) => {
  worksheet.mergeCells('A1:B1');
  worksheet.getCell('A1').value = 'DAFTAR ISI REKAP STATISTIK PENGOLAHAN DAN PEMASARAN';
  styleExcelTitle(worksheet.getCell('A1'));

  worksheet.mergeCells('A2:B2');
  worksheet.getCell('A2').value = `PRODUK KELAUTAN DAN PERIKANAN PROVINSI JAWA TIMUR TAHUN ${year}`;
  styleExcelTitle(worksheet.getCell('A2'));

  worksheet.getCell('A4').value = 'Daftar Tabel';
  worksheet.getCell('B4').value = 'Sheet';
  styleExcelHeader(worksheet.getCell('A4'));
  styleExcelHeader(worksheet.getCell('B4'));

  entries.forEach((entry, index) => {
    const row = index + 5;

    const linkCell = worksheet.getCell(row, 1);
    linkCell.value = {
      text: excelCleanText(entry.title),
      hyperlink: `#'${entry.sheetName.replace(/'/g, "''")}'!${entry.cell}`,
      tooltip: `Buka ${entry.sheetName}`,
    };

    linkCell.font = { color: { argb: '0563C1' }, underline: true };
    linkCell.border = excelBorder;
    linkCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

    const sheetCell = worksheet.getCell(row, 2);
    sheetCell.value = entry.sheetName;
    styleExcelBody(sheetCell);
  });

  worksheet.getColumn(1).width = 250;
  worksheet.getColumn(2).width = 18;

  worksheet.views = [{ state: 'frozen', ySplit: 4 }];
};

const buildRekapWorkbook = async (packages, year) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dinas Kelautan dan Perikanan';
  workbook.created = new Date();

  // Seluruh Master Data Kab/Kota ditampilkan, sehingga format rekap konsisten
  // dengan Hasil Analisis, dan otomatis bertambah saat admin menambah
  // kab/kota baru di Master Data.
  const regions = await regionInfo();

  const pengolahan = await masterValues('JENIS_PENGOLAHAN');
  const pemasaran = await masterValues('JENIS_PEMASARAN');
  const scales = await masterValues('KATEGORI_SKALA_USAHA');
  const sertifikatProduk = await masterValues('SERTIFIKAT_PRODUK');
  const izinUsaha = await masterValues('IZIN_USAHA');
  const sertifikatLb = await masterValues('SERTIFIKAT_LAHAN_BANGUNAN');

  const config = {
    pengolahan,
    pemasaran,
    kegiatan: [...pengolahan, ...pemasaran],
    scales,
  };

  const daftarIsiSheet = workbook.addWorksheet('Daftar Isi');
  const daftarIsi = [];
  const tableCounter = { value: 1 };

  createMetricAnalysisSheet({
    workbook, packages, regions, config,
    sheetName: 'Unit Usaha', metricLabel: 'Jumlah Unit Usaha Aktif', field: 'jumlah_unit_usaha', unit: 'number',
    tableCounter, daftarIsi,
  });

  createMetricAnalysisSheet({
    workbook, packages, regions, config,
    sheetName: 'Hasil (Kg)', metricLabel: 'Jumlah Hasil Produksi (Kg)', field: 'hasil_kg', unit: 'number',
    tableCounter, daftarIsi,
  });

  createMetricAnalysisSheet({
    workbook, packages, regions, config,
    sheetName: 'Hasil (Rp)', metricLabel: 'Jumlah Hasil Produksi (Rp)', field: 'hasil_rp', unit: 'currency',
    tableCounter, daftarIsi,
  });

  createModalAnalysisSheet({ workbook, packages, regions, config, tableCounter, daftarIsi });

  createDocumentAnalysisSheet({
    workbook, packages, regions,
    sheetName: 'Sertifikat Produk', titleLabel: 'Jumlah Kepemilikan Sertifikat Produk',
    key: 'sertifikat_produk', options: sertifikatProduk,
    tableCounter, daftarIsi,
  });

  createDocumentAnalysisSheet({
    workbook, packages, regions,
    sheetName: 'Izin Usaha', titleLabel: 'Jumlah Kepemilikan Izin Usaha',
    key: 'izin_usaha', options: izinUsaha,
    tableCounter, daftarIsi,
  });

  createDocumentAnalysisSheet({
    workbook, packages, regions,
    sheetName: 'Sertifikat LB', titleLabel: 'Jumlah Kepemilikan Sertifikat Lahan dan Bangunan',
    key: 'sertifikat_lahan_bangunan', options: sertifikatLb,
    tableCounter, daftarIsi,
  });

  createDynamicDaftarIsiSheet(daftarIsiSheet, year, daftarIsi);

  // Auto-size semua sheet selain Daftar Isi.
  workbook.worksheets.filter(sheet => sheet.name !== 'Daftar Isi').forEach(autoSizeExcel);

  // Paksa ukuran kolom Daftar Isi setelah proses auto-size,
  // supaya tidak ditimpa lagi oleh batas maksimum autoSizeExcel.
  daftarIsiSheet.getColumn(1).width = 150;
  daftarIsiSheet.getColumn(2).width = 18;
  daftarIsiSheet.orderNo = 0;

  return workbook;
};

const sendWorkbook = async (res, workbook, filename) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const exportDataAdmin = async (req, res) => {
  try {
    const packages = await selectPackagesForExport({ ids: req.body?.ids, admin: true });

    if (!packages.length) {
      return res.status(404).json({ success: false, message: 'Tidak ada data yang dapat diekspor.' });
    }

    return sendWorkbook(res, await buildDataWorkbook(packages), `Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error export data admin:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message || 'Gagal mengekspor data.' });
    }
    return undefined;
  }
};

const exportDataPublic = async (req, res) => {
  try {
    const packages = await selectPackagesForExport({ ids: req.body?.ids, admin: false });

    if (!packages.length) {
      return res.status(404).json({ success: false, message: 'Tidak ada data VERIFIED yang dapat diekspor.' });
    }

    return sendWorkbook(res, await buildDataWorkbook(packages), `Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error export data public:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message || 'Gagal mengekspor data.' });
    }
    return undefined;
  }
};

const exportRekapAdmin = async (req, res) => {
  try {
    const year = toInt(req.body?.tahun);

    if (!year) {
      return res.status(400).json({ success: false, message: 'Pilih tepat satu tahun sebelum mengekspor rekap statistik.' });
    }

    const packages = await selectPackagesForExport({ tahun: year, regions: req.body?.regions, admin: true });
    const verified = packages.filter(pkg => pkg.status === 'VERIFIED');

    if (!verified.length) {
      return res.status(404).json({ success: false, message: 'Tidak ada data VERIFIED pada tahun yang dipilih.' });
    }

    return sendWorkbook(res, await buildRekapWorkbook(verified, year), `Rekap_Statistik_Pengolahan_Pemasaran_${year}.xlsx`);
  } catch (error) {
    console.error('Error export rekap admin:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message || 'Gagal mengekspor rekap statistik.' });
    }
    return undefined;
  }
};

const exportRekapPublic = async (req, res) => {
  try {
    const year = toInt(req.body?.tahun);

    if (!year) {
      return res.status(400).json({ success: false, message: 'Pilih tepat satu tahun sebelum mengekspor rekap statistik.' });
    }

    const packages = await selectPackagesForExport({ tahun: year, regions: req.body?.regions, admin: false });

    if (!packages.length) {
      return res.status(404).json({ success: false, message: 'Tidak ada data VERIFIED pada tahun yang dipilih.' });
    }

    return sendWorkbook(res, await buildRekapWorkbook(packages, year), `Rekap_Statistik_Pengolahan_Pemasaran_${year}.xlsx`);
  } catch (error) {
    console.error('Error export rekap public:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message || 'Gagal mengekspor rekap statistik.' });
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