const prisma = require('../utils/prisma');

// GET all data (with filters)
const getAllData = async (req, res) => {
  try {
    const { startDate, endDate, komoditas, alat_tangkap, gt_kapal, pelabuhan } = req.query;
    
    // Build filter query
    const where = {};
    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (komoditas) where.komoditas = komoditas;
    if (alat_tangkap) where.alat_tangkap = alat_tangkap;
    if (gt_kapal) where.gt_kapal = gt_kapal;
    if (pelabuhan) where.pelabuhan = pelabuhan;

    const data = await prisma.perikananTangkap.findMany({
      where,
      orderBy: { tanggal: 'desc' }
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

// POST new data [ADMIN]
const createData = async (req, res) => {
  try {
    const { tanggal, jam_labuh, jam_bongkar, pelabuhan, nama_kapal, gt_kapal, alat_tangkap, komoditas, volume, harga } = req.body;
    
    // Calculate nilai automatically
    const nilai = parseFloat(volume) * parseFloat(harga);

    const newData = await prisma.perikananTangkap.create({
      data: {
        tanggal: new Date(tanggal),
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        komoditas,
        volume: parseFloat(volume),
        harga: parseFloat(harga),
        nilai
      }
    });

    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: newData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan data' });
  }
};

// PUT update data [ADMIN]
const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, jam_labuh, jam_bongkar, pelabuhan, nama_kapal, gt_kapal, alat_tangkap, komoditas, volume, harga } = req.body;
    
    const nilai = parseFloat(volume) * parseFloat(harga);

    const updatedData = await prisma.perikananTangkap.update({
      where: { id: parseInt(id) },
      data: {
        tanggal: tanggal ? new Date(tanggal) : undefined,
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        komoditas,
        volume: volume ? parseFloat(volume) : undefined,
        harga: harga ? parseFloat(harga) : undefined,
        nilai: (volume && harga) ? nilai : undefined
      }
    });

    res.status(200).json({ success: true, message: 'Data berhasil diupdate', data: updatedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate data' });
  }
};

// DELETE data [ADMIN]
const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.perikananTangkap.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
};

// GET stats/aggregate for charts
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Example aggregations
    const totalVolume = await prisma.perikananTangkap.aggregate({
      _sum: { volume: true, nilai: true },
      _count: { id: true },
      where
    });

    const byKomoditas = await prisma.perikananTangkap.groupBy({
      by: ['komoditas'],
      _sum: { volume: true },
      where,
      orderBy: { _sum: { volume: 'desc' } }
    });

    const byPelabuhan = await prisma.perikananTangkap.groupBy({
      by: ['pelabuhan'],
      _sum: { volume: true },
      where,
      orderBy: { _sum: { volume: 'desc' } }
    });

    // Aggregate by Date for trend
    const byTanggal = await prisma.perikananTangkap.groupBy({
      by: ['tanggal'],
      _sum: { volume: true, nilai: true },
      where,
      orderBy: { tanggal: 'asc' }
    });

    res.status(200).json({ 
      success: true, 
      data: {
        kpi: {
          total_volume: totalVolume._sum.volume || 0,
          total_nilai: totalVolume._sum.nilai || 0,
          total_trip: totalVolume._count.id || 0,
          avg_volume_per_trip: totalVolume._count.id > 0 ? (totalVolume._sum.volume / totalVolume._count.id) : 0
        },
        komoditas: byKomoditas,
        pelabuhan: byPelabuhan,
        tren: byTanggal.map(t => ({
          date: t.tanggal.toISOString().split('T')[0],
          volume: Number(t._sum.volume),
          nilai: Number(t._sum.nilai)
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
  }
};

// GET export
const exportData = async (req, res) => {
  // Can be implemented using xlsx to generate excel buffer and send to client
  // For now, we will return JSON and frontend can use SheetJS
  try {
    const data = await prisma.perikananTangkap.findMany({
      orderBy: { tanggal: 'desc' }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};

module.exports = {
  getAllData,
  createData,
  updateData,
  deleteData,
  getStats,
  exportData
};
