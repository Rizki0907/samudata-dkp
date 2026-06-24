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
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, tangkapan } = req.body;
    
    if (!tangkapan || tangkapan.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tangkapan kosong' });
    }

    const records = tangkapan.map(t => {
      const vol = parseFloat(t.volume) || 0;
      const hrg = parseFloat(t.harga) || 0;
      return {
        sumber_data: sumber_data || 'PELABUHAN',
        tanggal: new Date(tanggal),
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        kabupaten_kota,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        komoditas: t.komoditas,
        volume: vol,
        harga: hrg,
        nilai: vol * hrg
      };
    });

    const newData = await prisma.perikananTangkap.createMany({
      data: records
    });

    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', count: newData.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan data' });
  }
};

// PUT update data [ADMIN]
const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, tangkapan } = req.body;
    
    // Fallback: If tangkapan array exists, pick the first one since Edit only targets one row
    const item = tangkapan && tangkapan.length > 0 ? tangkapan[0] : req.body;
    const kom = item.komoditas;
    const vol = item.volume ? parseFloat(item.volume) : undefined;
    const hrg = item.harga ? parseFloat(item.harga) : undefined;
    const nilai = (vol && hrg) ? vol * hrg : undefined;

    const updatedData = await prisma.perikananTangkap.update({
      where: { id: parseInt(id) },
      data: {
        sumber_data,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        kabupaten_kota,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        komoditas: kom,
        volume: vol,
        harga: hrg,
        nilai: nilai
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
