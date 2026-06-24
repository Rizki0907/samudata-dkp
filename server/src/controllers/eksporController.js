const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllData = async (req, res) => {
  try {
    const { tahun } = req.query;
    const where = tahun ? { tahun } : {};
    const data = await prisma.ekspor.findMany({
      where,
      orderBy: { tanggal_ekspor: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createData = async (req, res) => {
  try {
    const { 
      bulan, tahun, tanggal_ekspor, nama_eksportir, 
      kategori_komoditas, nama_komoditas, volume, 
      satuan_volume, nilai_usd, negara_tujuan 
    } = req.body;

    const data = await prisma.ekspor.create({
      data: {
        bulan,
        tahun,
        tanggal_ekspor: new Date(tanggal_ekspor),
        nama_eksportir,
        kategori_komoditas,
        nama_komoditas,
        volume: parseFloat(volume),
        satuan_volume,
        nilai_usd: parseFloat(nilai_usd),
        negara_tujuan
      }
    });

    res.status(201).json({ success: true, data, message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      bulan, tahun, tanggal_ekspor, nama_eksportir, 
      kategori_komoditas, nama_komoditas, volume, 
      satuan_volume, nilai_usd, negara_tujuan 
    } = req.body;

    const data = await prisma.ekspor.update({
      where: { id: parseInt(id) },
      data: {
        bulan,
        tahun,
        tanggal_ekspor: new Date(tanggal_ekspor),
        nama_eksportir,
        kategori_komoditas,
        nama_komoditas,
        volume: parseFloat(volume),
        satuan_volume,
        nilai_usd: parseFloat(nilai_usd),
        negara_tujuan
      }
    });

    res.json({ success: true, data, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('Error updating ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ekspor.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getStats = async (req, res) => {
  try {
    const { tahun } = req.query; 
    const where = tahun ? { tahun } : {};

    // 1. Treemap (komoditas by kategori)
    const komoditasGroup = await prisma.ekspor.groupBy({
      by: ['kategori_komoditas', 'nama_komoditas'],
      _sum: { nilai_usd: true },
      where
    });

    // 2. Line Chart (Top 5 Komoditas over months)
    const top5KomoditasAgg = await prisma.ekspor.groupBy({
      by: ['nama_komoditas'],
      _sum: { nilai_usd: true },
      where,
      orderBy: { _sum: { nilai_usd: 'desc' } },
      take: 5
    });
    const top5Names = top5KomoditasAgg.map(k => k.nama_komoditas);

    const monthlyDataRaw = await prisma.ekspor.groupBy({
      by: ['bulan', 'nama_komoditas'],
      _sum: { volume: true, nilai_usd: true },
      where
    });

    // 3. Grouped Bar Chart (Volume vs Value per month)
    const monthlyAggregate = await prisma.ekspor.groupBy({
      by: ['bulan'],
      _sum: { volume: true, nilai_usd: true },
      where
    });

    // 4. Ranking Komoditas
    const rankingKomoditas = await prisma.ekspor.groupBy({
      by: ['nama_komoditas'],
      _sum: { nilai_usd: true },
      where,
      orderBy: { _sum: { nilai_usd: 'desc' } }
    });

    // 5. Negara Tujuan
    const byNegara = await prisma.ekspor.groupBy({
      by: ['negara_tujuan'],
      _sum: { volume: true, nilai_usd: true },
      where,
      orderBy: { _sum: { nilai_usd: 'desc' } }
    });

    // KPIs
    const totalStats = await prisma.ekspor.aggregate({
      _sum: { volume: true, nilai_usd: true },
      _count: { id: true },
      where
    });

    res.json({
      success: true,
      data: {
        kpi: {
          total_volume: totalStats._sum.volume || 0,
          total_nilai: totalStats._sum.nilai_usd || 0,
          total_transaksi: totalStats._count.id || 0
        },
        treemap: komoditasGroup,
        top5_names: top5Names,
        monthly_data_raw: monthlyDataRaw,
        monthly_aggregate: monthlyAggregate,
        ranking_komoditas: rankingKomoditas,
        negara_tujuan: byNegara
      }
    });

  } catch (error) {
    console.error('Error fetching ekspor stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllData,
  createData,
  updateData,
  deleteData,
  getStats
};
