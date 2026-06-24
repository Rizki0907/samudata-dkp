const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to calculate Triwulan (TW) from Bulan
const getTriwulan = (bulan) => {
  const bulanLower = bulan.toLowerCase();
  if (['januari', 'februari', 'maret'].includes(bulanLower)) return 'TW 1';
  if (['april', 'mei', 'juni'].includes(bulanLower)) return 'TW 2';
  if (['juli', 'agustus', 'september'].includes(bulanLower)) return 'TW 3';
  if (['oktober', 'november', 'desember'].includes(bulanLower)) return 'TW 4';
  return '-';
};

const getAllData = async (req, res) => {
  try {
    const { tahun, triwulan } = req.query;
    const where = {};
    if (tahun) where.tahun = tahun;
    if (triwulan) where.triwulan = triwulan;
    
    const data = await prisma.budidaya.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getStats = async (req, res) => {
  try {
    const { tahun, triwulan } = req.query;
    const where = {};
    if (tahun) where.tahun = tahun;
    if (triwulan) where.triwulan = triwulan;

    const data = await prisma.budidaya.findMany({ where });

    // 1. Produksi per Kabupaten
    const kabMap = {};
    data.forEach(item => {
      kabMap[item.kabupaten_kota] = (kabMap[item.kabupaten_kota] || 0) + item.produksi_ton;
    });
    const produksiPerKabupaten = Object.entries(kabMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Get Top 5 Kabupaten for Tren Bulanan
    const top5Kab = produksiPerKabupaten.slice(0, 5).map(k => k.name);

    // 2. Tren Bulanan (Top 5 + Lainnya)
    const BULAN_ORDER = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const trenBulanan = BULAN_ORDER.map(bulan => {
      const monthData = { bulan, Lainnya: 0 };
      top5Kab.forEach(k => monthData[k] = 0);
      return monthData;
    });

    data.forEach(item => {
      const bIndex = BULAN_ORDER.indexOf(item.bulan);
      if (bIndex === -1) return;
      if (top5Kab.includes(item.kabupaten_kota)) {
        trenBulanan[bIndex][item.kabupaten_kota] += item.produksi_ton;
      } else {
        trenBulanan[bIndex].Lainnya += item.produksi_ton;
      }
    });

    // 3. Komposisi Wadah
    const wadahMap = {};
    data.forEach(item => {
      wadahMap[item.jenis_wadah] = (wadahMap[item.jenis_wadah] || 0) + item.produksi_ton;
    });
    const komposisiWadah = Object.entries(wadahMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Heatmap Kabupaten x Bulan (Normalisasi Min-Max per baris)
    const heatmapRaw = {};
    data.forEach(item => {
      if (!heatmapRaw[item.kabupaten_kota]) {
        heatmapRaw[item.kabupaten_kota] = BULAN_ORDER.map(b => ({ bulan: b, produksi: 0 }));
      }
      const bIndex = BULAN_ORDER.indexOf(item.bulan);
      if (bIndex !== -1) {
        heatmapRaw[item.kabupaten_kota][bIndex].produksi += item.produksi_ton;
      }
    });

    const heatmapData = [];
    Object.keys(heatmapRaw).forEach(kab => {
      const bulanArr = heatmapRaw[kab];
      const maxProd = Math.max(...bulanArr.map(b => b.produksi));
      const minProd = Math.min(...bulanArr.map(b => b.produksi));
      const range = maxProd - minProd;

      bulanArr.forEach(b => {
        let normalized = 0;
        if (range > 0) {
          normalized = (b.produksi - minProd) / range;
        } else if (maxProd > 0) {
          normalized = 1; // if all months have same >0 production
        }
        heatmapData.push({
          kabupaten: kab,
          bulan: b.bulan,
          produksi: b.produksi,
          normalized: parseFloat(normalized.toFixed(4))
        });
      });
    });

    res.json({
      success: true,
      stats: {
        produksiPerKabupaten,
        trenBulanan,
        top5Kab,
        komposisiWadah,
        heatmapData
      }
    });
  } catch (error) {
    console.error('Error generating budidaya stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


const createData = async (req, res) => {
  try {
    const { 
      kabupaten_kota, tahun, bulan, jenis_wadah, produksi_ton 
    } = req.body;

    const triwulan = getTriwulan(bulan);

    const data = await prisma.budidaya.create({
      data: {
        kabupaten_kota,
        tahun,
        bulan,
        triwulan,
        jenis_wadah,
        produksi_ton: parseFloat(produksi_ton)
      }
    });

    res.status(201).json({ success: true, data, message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      kabupaten_kota, tahun, bulan, jenis_wadah, produksi_ton 
    } = req.body;

    const triwulan = getTriwulan(bulan);

    const data = await prisma.budidaya.update({
      where: { id: parseInt(id) },
      data: {
        kabupaten_kota,
        tahun,
        bulan,
        triwulan,
        jenis_wadah,
        produksi_ton: parseFloat(produksi_ton)
      }
    });

    res.json({ success: true, data, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('Error updating budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.budidaya.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllData,
  getStats,
  createData,
  updateData,
  deleteData
};
