const prisma = require('../utils/prisma');

const getTriwulan = (bulan) => {
  if (!bulan) return '-';
  // Ubah paksa jadi string agar tidak crash saat menerima angka 1-12
  const b = String(bulan).toLowerCase().trim(); 
  
  if (['januari', 'februari', 'maret', '1', '2', '3'].includes(b)) return 'TW 1';
  if (['april', 'mei', 'juni', '4', '5', '6'].includes(b)) return 'TW 2';
  if (['juli', 'agustus', 'september', '7', '8', '9'].includes(b)) return 'TW 3';
  if (['oktober', 'november', 'desember', '10', '11', '12'].includes(b)) return 'TW 4';
  
  return '-';
};

// Auto-kategorisasi kondisi Mangrove berdasarkan persentase (0-100%)
const getKondisiMangrove = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 70) return 'Sangat Padat (70-100%)';
  if (p >= 30) return 'Sedang (30-70%)';
  return 'Jarang (0-30%)';
};

// Auto-kategorisasi kondisi Lamun berdasarkan persentase tutupan (0-100%)
const getKondisiLamun = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 60) return 'Kaya (60-100%)';
  if (p >= 30) return 'Kurang Kaya (30-60%)';
  return 'Miskin (0-30%)';
};

// ==============================
// GARAM
// ==============================

const getGaramData = async (req, res) => {
  try {
    const data = await prisma.garam.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching garam data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getGaramPublicData = async (req, res) => {
  try {
    const { tahun } = req.query;
    const where = { status: 'VERIFIED' };
    if (tahun) where.tahun = parseInt(tahun);
    
    const data = await prisma.garam.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching public garam data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createGaramData = async (req, res) => {
  try {
    const payload = req.body;
    payload.triwulan = getTriwulan(payload.bulan);
    payload.total_produksi_ton = (payload.produksi_k1_ton || 0) + (payload.produksi_k2_ton || 0) + (payload.produksi_k3_ton || 0);
    payload.total_stok_ton = (payload.stok_k1_ton || 0) + (payload.stok_k2_ton || 0) + (payload.stok_k3_ton || 0);
    payload.produktivitas = payload.luas_produksi_ha > 0 ? (payload.total_produksi_ton / payload.luas_produksi_ha) : 0;
    
    const newData = await prisma.garam.create({ data: payload });
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error creating garam data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateGaramData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.garam.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui' });
    }

    const payload = req.body;
    if (req.user?.role === 'admin_cabang' && existing.status === 'REJECTED') {
      payload.status = 'PENDING';
      payload.alasan_penolakan = null;
    }
    payload.triwulan = getTriwulan(payload.bulan);
    payload.total_produksi_ton = (payload.produksi_k1_ton || 0) + (payload.produksi_k2_ton || 0) + (payload.produksi_k3_ton || 0);
    payload.total_stok_ton = (payload.stok_k1_ton || 0) + (payload.stok_k2_ton || 0) + (payload.stok_k3_ton || 0);
    payload.produktivitas = payload.luas_produksi_ha > 0 ? (payload.total_produksi_ton / payload.luas_produksi_ha) : 0;
    
    const updatedData = await prisma.garam.update({
      where: { id: parseInt(id) },
      data: payload
    });
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating garam data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteGaramData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.garam.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui' });
    }
    await prisma.garam.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting garam data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateGaramStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;
    const updated = await prisma.garam.update({
      where: { id: parseInt(id) },
      data: { status, alasan_penolakan }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating garam status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==============================
// POTENSI PERAIRAN
// ==============================

const getPotensiPerairanData = async (req, res) => {
  try {
    const data = await prisma.potensiPerairan.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching potensi perairan data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getPotensiPerairanPublicData = async (req, res) => {
  try {
    const { tahun } = req.query;
    const where = { status: 'VERIFIED' };
    if (tahun) where.tahun_data = parseInt(tahun);
    
    const data = await prisma.potensiPerairan.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching public potensi perairan data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createPotensiPerairanData = async (req, res) => {
  try {
    const newData = await prisma.potensiPerairan.create({ data: req.body });
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error creating potensi perairan data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updatePotensiPerairanData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.potensiPerairan.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui' });
    }

    const payload = req.body;
    if (req.user?.role === 'admin_cabang' && existing.status === 'REJECTED') {
      payload.status = 'PENDING';
      payload.alasan_penolakan = null;
    }
    
    const updatedData = await prisma.potensiPerairan.update({
      where: { id: parseInt(id) },
      data: payload
    });
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating potensi perairan data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deletePotensiPerairanData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.potensiPerairan.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui' });
    }
    await prisma.potensiPerairan.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting potensi perairan data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updatePotensiPerairanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;
    const updated = await prisma.potensiPerairan.update({
      where: { id: parseInt(id) },
      data: { status, alasan_penolakan }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating potensi perairan status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==============================
// MANGROVE
// ==============================

const getMangroveData = async (req, res) => {
  try {
    const data = await prisma.mangrove.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching mangrove data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMangrovePublicData = async (req, res) => {
  try {
    const { tahun } = req.query;
    const where = { status: 'VERIFIED' };
    if (tahun) where.tahun = parseInt(tahun);

    const data = await prisma.mangrove.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching public mangrove data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createMangroveData = async (req, res) => {
  try {
    const payload = req.body;
    payload.persentase_kondisi = Number(payload.persentase_kondisi) || 0;
    payload.kondisi = getKondisiMangrove(payload.persentase_kondisi);

    const newData = await prisma.mangrove.create({ data: payload });
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error creating mangrove data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateMangroveData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.mangrove.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui' });
    }

    const payload = req.body;
    if (req.user?.role === 'admin_cabang' && existing.status === 'REJECTED') {
      payload.status = 'PENDING';
      payload.alasan_penolakan = null;
    }
    payload.persentase_kondisi = Number(payload.persentase_kondisi) || 0;
    payload.kondisi = getKondisiMangrove(payload.persentase_kondisi);

    const updatedData = await prisma.mangrove.update({
      where: { id: parseInt(id) },
      data: payload
    });
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating mangrove data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteMangroveData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.mangrove.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui' });
    }
    await prisma.mangrove.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting mangrove data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateMangroveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;
    const updated = await prisma.mangrove.update({
      where: { id: parseInt(id) },
      data: { status, alasan_penolakan }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating mangrove status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchMangroveStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.mangrove.updateMany({
      where: { id: { in: ids.map(id => parseInt(id)) } },
      data: { status, alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null }
    });
    res.json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error('Error batch mangrove status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDeleteMangrove = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.mangrove.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error batch delete mangrove:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==============================
// LAMUN
// ==============================

const getLamunData = async (req, res) => {
  try {
    const data = await prisma.lamun.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching lamun data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getLamunPublicData = async (req, res) => {
  try {
    const { tahun } = req.query;
    const where = { status: 'VERIFIED' };
    if (tahun) where.tahun = parseInt(tahun);

    const data = await prisma.lamun.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching public lamun data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createLamunData = async (req, res) => {
  try {
    const payload = req.body;
    payload.persentase_tutupan = Number(payload.persentase_tutupan) || 0;
    payload.kondisi = getKondisiLamun(payload.persentase_tutupan);

    const newData = await prisma.lamun.create({ data: payload });
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error creating lamun data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateLamunData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lamun.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui' });
    }

    const payload = req.body;
    if (req.user?.role === 'admin_cabang' && existing.status === 'REJECTED') {
      payload.status = 'PENDING';
      payload.alasan_penolakan = null;
    }
    payload.persentase_tutupan = Number(payload.persentase_tutupan) || 0;
    payload.kondisi = getKondisiLamun(payload.persentase_tutupan);

    const updatedData = await prisma.lamun.update({
      where: { id: parseInt(id) },
      data: payload
    });
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating lamun data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteLamunData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lamun.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui' });
    }
    await prisma.lamun.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting lamun data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateLamunStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;
    const updated = await prisma.lamun.update({
      where: { id: parseInt(id) },
      data: { status, alasan_penolakan }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating lamun status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchLamunStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.lamun.updateMany({
      where: { id: { in: ids.map(id => parseInt(id)) } },
      data: { status, alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null }
    });
    res.json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error('Error batch lamun status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDeleteLamun = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.lamun.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error batch delete lamun:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==============================
// STATS / AGGREGATION
// ==============================

const getKelautanPesisirStats = async (req, res) => {
  try {
    const { tahun, bulan } = req.query;
    
    // --- GARAM STATS ---
    const garamWhere = { status: 'VERIFIED' };
    if (tahun) garamWhere.tahun = parseInt(tahun);
    if (bulan) garamWhere.bulan = bulan;
    
    const garamData = await prisma.garam.findMany({ 
      where: garamWhere,
      orderBy: { created_at: 'desc' }
    });

    let total_produksi_garam = 0;
    
    const garamPerKota = {};

    garamData.forEach(item => {
      const k = item.kabupaten_kota || 'Tidak Diketahui';
      if (!garamPerKota[k]) {
        garamPerKota[k] = { produksi: 0, luas_lahan: 0, petambak: 0, kelompok: 0 };
      }
      
      // Hasil Panen selalu dijumlahkan (+)
      const produksi = item.total_produksi_ton || 0;
      total_produksi_garam += produksi;
      garamPerKota[k].produksi += produksi;

      // Data Fisik diambil nilai paling besar (Math.max) agar tidak ganda saat tarik data multi-bulan
      garamPerKota[k].luas_lahan = Math.max(garamPerKota[k].luas_lahan, item.luas_total_ha || 0);
      garamPerKota[k].petambak = Math.max(garamPerKota[k].petambak, item.jumlah_petambak || 0);
      garamPerKota[k].kelompok = Math.max(garamPerKota[k].kelompok, item.jumlah_kelompok || 0);
    });

    // Menghitung grand total fisik dari nilai yang sudah difilter
    const total_luas_lahan_garam = Object.values(garamPerKota).reduce((sum, k) => sum + k.luas_lahan, 0);
    const total_petambak_garam = Object.values(garamPerKota).reduce((sum, k) => sum + k.petambak, 0);

    // --- POTENSI PERAIRAN STATS ---
    const potensiWhere = { status: 'VERIFIED' };
    if (tahun) potensiWhere.tahun_data = parseInt(tahun);
    const potensiData = await prisma.potensiPerairan.findMany({ where: potensiWhere });
    
    const potensiPerKota = {};
    potensiData.forEach(item => {
      const k = item.kabupaten_kota || 'Tidak Diketahui';
      const totalPantai = item.total_panjang_garis_pantai_km || 0;
      potensiPerKota[k] = {
        pulau_kecil: item.jumlah_pulau_kecil || 0,
        garis_pantai: totalPantai,
        luas_laut: item.luas_wilayah_laut_km2 || 0,
        desa_pesisir: item.desa_pesisir || 0
      };
    });

    // --- MANGROVE STATS ---
    const mangroveWhere = { status: 'VERIFIED' };
    if (tahun) mangroveWhere.tahun = parseInt(tahun);
    const mangroveData = await prisma.mangrove.findMany({ where: mangroveWhere });

    const mangrovePerKota = {};
    const kondisiDistribution = { 'Sangat Padat (70-100%)': 0, 'Sedang (30-70%)': 0, 'Jarang (0-30%)': 0 };
    let total_luas_eksisting_mangrove = 0;
    let total_luas_rehabilitasi_mangrove = 0;

    mangroveData.forEach(item => {
      const k = item.kabupaten_kota || 'Tidak Diketahui';
      if (!mangrovePerKota[k]) {
        mangrovePerKota[k] = { luas_eksisting: 0, luas_rehabilitasi: 0, sumPersentase: 0, count: 0 };
      }
      const luasEksisting = item.luas_eksisting_ha || 0;
      const luasRehab = item.luas_rehabilitasi_ha || 0;

      mangrovePerKota[k].luas_eksisting += luasEksisting;
      mangrovePerKota[k].luas_rehabilitasi += luasRehab;
      mangrovePerKota[k].sumPersentase += item.persentase_kondisi || 0;
      mangrovePerKota[k].count += 1;

      total_luas_eksisting_mangrove += luasEksisting;
      total_luas_rehabilitasi_mangrove += luasRehab;

      if (kondisiDistribution[item.kondisi] !== undefined) {
        kondisiDistribution[item.kondisi] += 1;
      }
    });

    const mangrovePerKotaResult = Object.entries(mangrovePerKota).map(([name, stats]) => ({
      name,
      luas_eksisting: stats.luas_eksisting,
      luas_rehabilitasi: stats.luas_rehabilitasi,
      rata_persentase: stats.count > 0 ? stats.sumPersentase / stats.count : 0
    }));

    // --- LAMUN STATS ---
    const lamunWhere = { status: 'VERIFIED' };
    if (tahun) lamunWhere.tahun = parseInt(tahun);
    const lamunData = await prisma.lamun.findMany({ where: lamunWhere });

    const lamunPerKota = {};
    const lamunKondisiDistribution = { 'Kaya (60-100%)': 0, 'Kurang Kaya (30-60%)': 0, 'Miskin (0-30%)': 0 };
    let total_luas_eksisting_lamun = 0;
    let total_luas_rehabilitasi_lamun = 0;

    lamunData.forEach(item => {
      const k = item.kabupaten_kota || 'Tidak Diketahui';
      if (!lamunPerKota[k]) {
        lamunPerKota[k] = { luas_eksisting: 0, luas_rehabilitasi: 0, sumPersentase: 0, count: 0 };
      }
      const luasEksisting = item.luas_eksisting_ha || 0;
      const luasRehab = item.luas_rehabilitasi_ha || 0;

      lamunPerKota[k].luas_eksisting += luasEksisting;
      lamunPerKota[k].luas_rehabilitasi += luasRehab;
      lamunPerKota[k].sumPersentase += item.persentase_tutupan || 0;
      lamunPerKota[k].count += 1;

      total_luas_eksisting_lamun += luasEksisting;
      total_luas_rehabilitasi_lamun += luasRehab;

      if (lamunKondisiDistribution[item.kondisi] !== undefined) {
        lamunKondisiDistribution[item.kondisi] += 1;
      }
    });

    // --- TERUMBU KARANG STATS (RAW SQL) ---
    let tkQuery = `SELECT * FROM "terumbu_karang" WHERE "status" = 'VERIFIED'`;
    if (tahun) tkQuery += ` AND "tahun" = ${parseInt(tahun)}`;
    const terumbuData = await prisma.$queryRawUnsafe(tkQuery);

    const terumbuPerKota = {};
    const terumbuKondisiDistribution = { 'Sangat Baik (75-100%)': 0, 'Baik (50-75%)': 0, 'Rusak (0-50%)': 0 };
    let total_luas_eksisting_terumbu = 0;
    let total_luas_rehabilitasi_terumbu = 0;

    terumbuData.forEach(item => {
      const k = item.kabupaten_kota || 'Tidak Diketahui';
      if (!terumbuPerKota[k]) {
        terumbuPerKota[k] = { luas_eksisting: 0, luas_rehabilitasi: 0, sumPersentase: 0, count: 0 };
      }
      const luasEksisting = item.luas_eksisting_ha || 0;
      const luasRehab = item.luas_rehabilitasi_ha || 0;

      terumbuPerKota[k].luas_eksisting += luasEksisting;
      terumbuPerKota[k].luas_rehabilitasi += luasRehab;
      terumbuPerKota[k].sumPersentase += item.persentase_tutupan || 0;
      terumbuPerKota[k].count += 1;

      total_luas_eksisting_terumbu += luasEksisting;
      total_luas_rehabilitasi_terumbu += luasRehab;

      if (terumbuKondisiDistribution[item.kondisi] !== undefined) {
        terumbuKondisiDistribution[item.kondisi] += 1;
      }
    });

    const lamunPerKotaResult = Object.entries(lamunPerKota).map(([name, stats]) => ({
      name,
      luas_eksisting: stats.luas_eksisting,
      luas_rehabilitasi: stats.luas_rehabilitasi,
      rata_persentase: stats.count > 0 ? stats.sumPersentase / stats.count : 0
    }));

    const terumbuPerKotaResult = Object.entries(terumbuPerKota).map(([name, stats]) => ({
      name,
      luas_eksisting: stats.luas_eksisting,
      luas_rehabilitasi: stats.luas_rehabilitasi,
      rata_persentase: stats.count > 0 ? stats.sumPersentase / stats.count : 0
    }));

    res.json({
      success: true,
      data: {
        summary: {
          total_produksi_garam, total_petambak_garam, total_luas_lahan_garam,
          total_luas_eksisting_mangrove, total_luas_rehabilitasi_mangrove,
          total_luas_eksisting_lamun, total_luas_rehabilitasi_lamun,
          total_luas_eksisting_terumbu, total_luas_rehabilitasi_terumbu
        },
        garamPerKota: Object.entries(garamPerKota).map(([name, stats]) => ({ name, ...stats })),
        potensiPerKota: Object.entries(potensiPerKota).map(([name, stats]) => ({ name, ...stats })),
        mangrovePerKota: mangrovePerKotaResult,
        mangroveKondisiDistribution: Object.entries(kondisiDistribution).map(([kondisi, jumlah]) => ({ kondisi, jumlah })),
        lamunPerKota: lamunPerKotaResult,
        lamunKondisiDistribution: Object.entries(lamunKondisiDistribution).map(([kondisi, jumlah]) => ({ kondisi, jumlah })),
        terumbuPerKota: terumbuPerKotaResult,
        terumbuKondisiDistribution: Object.entries(terumbuKondisiDistribution).map(([kondisi, jumlah]) => ({ kondisi, jumlah }))
      }
    });
  } catch (error) {
    console.error('Error fetching kelautan pesisir stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchGaramStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.garam.updateMany({
      where: { id: { in: ids.map(id => parseInt(id)) } },
      data: { status, alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null }
    });
    res.json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error('Error batch garam status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDeleteGaram = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.garam.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error batch delete garam:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchPotensiPerairanStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.potensiPerairan.updateMany({
      where: { id: { in: ids.map(id => parseInt(id)) } },
      data: { status, alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null }
    });
    res.json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error('Error batch potensi status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDeletePotensiPerairan = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    await prisma.potensiPerairan.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error batch delete potensi:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// ==============================
// TERUMBU KARANG (RAW SQL BYPASS)
// ==============================

const getTerumbuKarangData = async (req, res) => {
  try {
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "terumbu_karang" ORDER BY "created_at" DESC`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching terumbu karang data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getTerumbuKarangPublicData = async (req, res) => {
  try {
    const { tahun } = req.query;
    let query = `SELECT * FROM "terumbu_karang" WHERE "status" = 'VERIFIED'`;
    if (tahun) query += ` AND "tahun" = ${parseInt(tahun)}`;
    query += ` ORDER BY "created_at" DESC`;
    const data = await prisma.$queryRawUnsafe(query);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching public terumbu karang data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const createTerumbuKarangData = async (req, res) => {
  try {
    const { tahun, kabupaten_kota, luas_eksisting_ha, persentase_tutupan, kondisi, luas_rehabilitasi_ha } = req.body;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "terumbu_karang" (
        "tahun", "kabupaten_kota", "luas_eksisting_ha", "persentase_tutupan", 
        "kondisi", "luas_rehabilitasi_ha", "status", "created_at", "updated_at"
      ) VALUES (
        ${tahun}, '${kabupaten_kota}', ${luas_eksisting_ha || 0}, ${persentase_tutupan || 0}, 
        '${kondisi}', ${luas_rehabilitasi_ha || 0}, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);
    res.json({ success: true, message: 'Berhasil membuat data terumbu karang' });
  } catch (error) {
    console.error('Error creating terumbu karang data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateTerumbuKarangData = async (req, res) => {
  try {
    const { id } = req.params;
    const { tahun, kabupaten_kota, luas_eksisting_ha, persentase_tutupan, kondisi, luas_rehabilitasi_ha } = req.body;
    const existingArr = await prisma.$queryRawUnsafe(`SELECT * FROM "terumbu_karang" WHERE "id" = ${parseInt(id)}`);
    if (!existingArr || existingArr.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const existing = existingArr[0];
    
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui' });
    }

    let statusUpdate = ``;
    if (req.user?.role === 'admin_cabang' && existing.status === 'REJECTED') {
      statusUpdate = `, "status" = 'PENDING', "alasan_penolakan" = NULL`;
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "terumbu_karang" 
      SET 
        "tahun" = ${tahun},
        "kabupaten_kota" = '${kabupaten_kota}',
        "luas_eksisting_ha" = ${luas_eksisting_ha || 0},
        "persentase_tutupan" = ${persentase_tutupan || 0},
        "kondisi" = '${kondisi}',
        "luas_rehabilitasi_ha" = ${luas_rehabilitasi_ha || 0},
        "updated_at" = CURRENT_TIMESTAMP
        ${statusUpdate}
      WHERE "id" = ${parseInt(id)}
    `);
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating terumbu karang data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteTerumbuKarangData = async (req, res) => {
  try {
    const { id } = req.params;
    const existingArr = await prisma.$queryRawUnsafe(`SELECT * FROM "terumbu_karang" WHERE "id" = ${parseInt(id)}`);
    if (!existingArr || existingArr.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const existing = existingArr[0];
    if (['APPROVED', 'VERIFIED'].includes(existing.status) && req.user?.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui' });
    }
    await prisma.$executeRawUnsafe(`DELETE FROM "terumbu_karang" WHERE "id" = ${parseInt(id)}`);
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting terumbu karang data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateTerumbuKarangStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;
    const alasan = alasan_penolakan ? `'${alasan_penolakan}'` : 'NULL';
    await prisma.$executeRawUnsafe(`UPDATE "terumbu_karang" SET "status" = '${status}', "alasan_penolakan" = ${alasan}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${parseInt(id)}`);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating terumbu karang status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchTerumbuKarangStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const idList = ids.map(id => parseInt(id)).join(',');
    const alasan = status === 'REJECTED' && alasan_penolakan ? `'${alasan_penolakan}'` : 'NULL';
    await prisma.$executeRawUnsafe(`UPDATE "terumbu_karang" SET "status" = '${status}', "alasan_penolakan" = ${alasan}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" IN (${idList})`);
    res.json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error('Error batch terumbu karang status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDeleteTerumbuKarang = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const idList = ids.map(id => parseInt(id)).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM "terumbu_karang" WHERE "id" IN (${idList})`);
    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error batch delete terumbu karang:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getGaramData,
  getGaramPublicData,
  createGaramData,
  updateGaramData,
  deleteGaramData,
  updateGaramStatus,
  batchGaramStatus,
  batchDeleteGaram,
  getPotensiPerairanData,
  getPotensiPerairanPublicData,
  createPotensiPerairanData,
  updatePotensiPerairanData,
  deletePotensiPerairanData,
  updatePotensiPerairanStatus,
  batchPotensiPerairanStatus,
  batchDeletePotensiPerairan,
  getMangroveData,
  getMangrovePublicData,
  createMangroveData,
  updateMangroveData,
  deleteMangroveData,
  updateMangroveStatus,
  batchMangroveStatus,
  batchDeleteMangrove,
  getLamunData,
  getLamunPublicData,
  createLamunData,
  updateLamunData,
  deleteLamunData,
  updateLamunStatus,
  batchLamunStatus,
  batchDeleteLamun,
  getKelautanPesisirStats,
  getTerumbuKarangData,
  getTerumbuKarangPublicData,
  createTerumbuKarangData,
  updateTerumbuKarangData,
  deleteTerumbuKarangData,
  updateTerumbuKarangStatus,
  batchTerumbuKarangStatus,
  batchDeleteTerumbuKarang
};