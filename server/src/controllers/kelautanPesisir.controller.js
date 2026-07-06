const prisma = require('../utils/prisma');

const getTriwulan = (bulan) => {
  const bulanLower = bulan.toLowerCase();
  if (['januari', 'februari', 'maret'].includes(bulanLower)) return 'TW 1';
  if (['april', 'mei', 'juni'].includes(bulanLower)) return 'TW 2';
  if (['juli', 'agustus', 'september'].includes(bulanLower)) return 'TW 3';
  if (['oktober', 'november', 'desember'].includes(bulanLower)) return 'TW 4';
  return '-';
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
    const where = { status: 'APPROVED' };
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
    const payload = req.body;
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
    const where = { status: 'APPROVED' };
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
    const updatedData = await prisma.potensiPerairan.update({
      where: { id: parseInt(id) },
      data: req.body
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
// STATS / AGGREGATION
// ==============================

const getKelautanPesisirStats = async (req, res) => {
  try {
    const { tahun } = req.query;
    
    // GARAM STATS
    const garamWhere = { status: 'APPROVED' };
    if (tahun) garamWhere.tahun = parseInt(tahun);
    const garamData = await prisma.garam.findMany({ where: garamWhere });

    let total_produksi_garam = 0;
    let total_petambak_garam = 0;
    let total_luas_lahan_garam = 0;
    
    const garamPerKota = {};

    garamData.forEach(item => {
      total_produksi_garam += item.total_produksi_ton;
      total_petambak_garam += item.jumlah_petambak;
      total_luas_lahan_garam += item.luas_total_ha;
      
      const k = item.kabupaten_kota;
      if (!garamPerKota[k]) garamPerKota[k] = { produksi: 0, luas_lahan: 0, petambak: 0, kelompok: 0 };
      garamPerKota[k].produksi += item.total_produksi_ton;
      garamPerKota[k].luas_lahan += item.luas_total_ha;
      garamPerKota[k].petambak += item.jumlah_petambak;
      garamPerKota[k].kelompok += item.jumlah_kelompok;
    });

    // POTENSI PERAIRAN STATS
    const potensiWhere = { status: 'APPROVED' };
    if (tahun) potensiWhere.tahun_data = parseInt(tahun);
    const potensiData = await prisma.potensiPerairan.findMany({ where: potensiWhere });
    
    const potensiPerKota = {};
    potensiData.forEach(item => {
      const k = item.kabupaten_kota;
      const totalPantai = item.panjang_pantai_utara_km + item.panjang_pantai_selatan_km + item.panjang_pantai_timur_km + item.panjang_pantai_barat_km;
      potensiPerKota[k] = {
        pulau_kecil: item.jumlah_pulau_kecil,
        garis_pantai: totalPantai,
        luas_laut: item.luas_wilayah_laut_km2,
        desa_pesisir: item.desa_pesisir
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_produksi_garam,
          total_petambak_garam,
          total_luas_lahan_garam
        },
        garamPerKota: Object.entries(garamPerKota).map(([name, stats]) => ({ name, ...stats })),
        potensiPerKota: Object.entries(potensiPerKota).map(([name, stats]) => ({ name, ...stats }))
      }
    });
  } catch (error) {
    console.error('Error fetching kelautan pesisir stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getGaramData, getGaramPublicData, createGaramData, updateGaramData, deleteGaramData, updateGaramStatus,
  getPotensiPerairanData, getPotensiPerairanPublicData, createPotensiPerairanData, updatePotensiPerairanData, deletePotensiPerairanData, updatePotensiPerairanStatus,
  getKelautanPesisirStats
};
