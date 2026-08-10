const prisma = require('../utils/prisma');
const ExcelJS = require('exceljs');

const db = prisma.pengolahanPemasaranRekap;
if (!db) throw new Error('Model Prisma PengolahanPemasaranRekap tidak ditemukan.');

const META_MODAL_JENIS = '__MODAL_JENIS__';
const META_MODAL_SKALA = '__MODAL_SKALA__';
const META_DOKUMEN = '__DOKUMEN__';
const META_PLACEHOLDER = '__META__';

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

const FIXED_DOC_FIELDS = {
  sertifikat_produk: {
    HACCP: 'sertifikat_haccp', SNI: 'sertifikat_sni', HALAL: 'sertifikat_halal',
    SKP: 'sertifikat_skp', PIRT: 'sertifikat_pirt', MD: 'sertifikat_md', 'Lain-lain': 'sertifikat_lainnya',
  },
  izin_usaha: {
    NIB: 'izin_nib', NPWP: 'izin_npwp', KUSUKA: 'izin_kusuka',
    'Pengesahan MENKUMHAM': 'izin_menkumham', 'Akta Pendirian Usaha': 'izin_akta_pendirian',
    IMB: 'izin_imb', 'Lokasi/Domisili': 'izin_lokasi_domisili',
    'SIUP Perikanan': 'izin_siup_perikanan', 'SIUP Perdagangan': 'izin_siup_perdagangan', 'Lain-lain': 'izin_lainnya',
  },
  sertifikat_lahan_bangunan: { SHM: 'shm_count', 'Non SHM': 'non_shm_count' },
};

const buildLegacyDocs = rows => {
  const result = { sertifikat_produk: {}, izin_usaha: {}, sertifikat_lahan_bangunan: {} };
  Object.entries(FIXED_DOC_FIELDS).forEach(([group, map]) => {
    Object.entries(map).forEach(([label, field]) => {
      const value = rows.reduce((sum, row) => sum + toNumber(row?.[field]), 0);
      if (value) result[group][label] = value;
    });
  });
  return result;
};

const docPayloadToColumns = dokumen => {
  const result = {};
  Object.values(FIXED_DOC_FIELDS).forEach(map => {
    Object.values(map).forEach(field => { result[field] = 0; });
  });
  Object.entries(FIXED_DOC_FIELDS).forEach(([group, map]) => {
    const source = jsonObject(dokumen?.[group]);
    Object.entries(source).forEach(([label, amount]) => {
      const field = map[label];
      if (field) result[field] = Math.max(0, toInt(amount));
    });
  });
  return result;
};

const unsupportedDocumentLabels = dokumen => {
  const unsupported = [];
  Object.entries(FIXED_DOC_FIELDS).forEach(([group, map]) => {
    Object.keys(jsonObject(dokumen?.[group])).forEach(label => {
      if (!map[label] && toNumber(dokumen[group][label]) > 0) unsupported.push(label);
    });
  });
  return unsupported;
};

const isMetaRow = row => [META_MODAL_JENIS, META_MODAL_SKALA, META_DOKUMEN].includes(row?.kategori_kegiatan);

const sumObject = object => Object.values(jsonObject(object)).reduce((sum, value) => sum + toNumber(value), 0);
const packageKey = row => `${row.tahun}|${normalizeKab(row.kabupaten_kota)}`;

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

    const docs = docRow ? buildLegacyDocs([docRow]) : buildLegacyDocs(productionRows);
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

module.exports = { getAllData, getAdminData, getStats, getDashboardStats, createData, createBatchData, updateData, deleteData, updateStatus, batchStatus, batchDelete, exportDataAdmin, exportDataPublic, exportRekapAdmin, exportRekapPublic };
