const prisma = require('../utils/prisma');

// GET all data (with filters)
const getAllData = async (req, res) => {
  try {
    const { startDate, endDate, komoditas, alat_tangkap, gt_kapal, pelabuhan } = req.query;
    
    // Build filter query
    const where = { status: 'APPROVED' };
    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (alat_tangkap) where.alat_tangkap = alat_tangkap;
    if (gt_kapal) where.gt_kapal = gt_kapal;
    if (pelabuhan) where.pelabuhan = pelabuhan;

    if (komoditas) {
      where.tangkapan = {
        some: { komoditas }
      };
    }

    const data = await prisma.perikananTangkap.findMany({
      where,
      include: {
        tangkapan: true
      },
      orderBy: { tanggal: 'desc' }
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

// GET all data [ADMIN] - no status filter
const getAdminData = async (req, res) => {
  try {
    const data = await prisma.perikananTangkap.findMany({
      include: {
        tangkapan: true
      },
      orderBy: { tanggal: 'desc' }
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data admin' });
  }
};

// POST new data [ADMIN]
const createData = async (req, res) => {
  try {
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, logistik, tangkapan } = req.body;
    
    if (!tangkapan || tangkapan.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tangkapan kosong' });
    }

    const records = tangkapan.map(t => {
      const vol = parseFloat(t.volume) || 0;
      const hrg = parseFloat(t.harga) || 0;
      return {
        komoditas: t.komoditas,
        volume: vol,
        harga: hrg,
        nilai: vol * hrg
      };
    });

    const statusData = req.user && req.user.role === 'admin_pusat' ? 'APPROVED' : 'PENDING';

    const newData = await prisma.perikananTangkap.create({
      data: {
        status: statusData,
        sumber_data: sumber_data || 'PELABUHAN',
        tanggal: new Date(tanggal),
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        kabupaten_kota,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        logistik,
        tangkapan: {
          create: records
        }
      },
      include: { tangkapan: true }
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
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, logistik, tangkapan } = req.body;
    
    // Check permission
    const existing = await prisma.perikananTangkap.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    
    if (existing.status === 'APPROVED' && req.user && req.user.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui Pusat' });
    }

    let newStatus = existing.status;
    if (req.user && req.user.role === 'admin_cabang' && existing.status === 'REJECTED') {
      newStatus = 'PENDING'; // reset ke pending setelah direvisi
    }

    // 1. Delete existing tangkapan for this trip
    await prisma.detailTangkapan.deleteMany({
      where: { perikanan_tangkap_id: parseInt(id) }
    });

    // 2. Format new tangkapan records
    const records = (tangkapan || []).map(t => {
      const vol = parseFloat(t.volume) || 0;
      const hrg = parseFloat(t.harga) || 0;
      return {
        komoditas: t.komoditas,
        volume: vol,
        harga: hrg,
        nilai: vol * hrg
      };
    });

    // 3. Update trip parent and insert new childs
    const updatedData = await prisma.perikananTangkap.update({
      where: { id: parseInt(id) },
      data: {
        status: newStatus,
        alasan_penolakan: newStatus === 'PENDING' ? null : existing.alasan_penolakan,
        sumber_data,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        jam_labuh,
        jam_bongkar,
        pelabuhan,
        kabupaten_kota,
        nama_kapal,
        gt_kapal,
        alat_tangkap,
        logistik,
        tangkapan: {
          create: records
        }
      },
      include: { tangkapan: true }
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
    const existing = await prisma.perikananTangkap.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    if (existing.status === 'APPROVED' && req.user && req.user.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui Pusat' });
    }

    // Prisma Cascade delete will automatically delete DetailTangkapan
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
    
    const where = { status: 'APPROVED' };
    if (startDate && endDate) {
      where.tanggal = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch details to compute stats in memory (since relation groupBy is tricky)
    const details = await prisma.detailTangkapan.findMany({
      include: {
        perikananTangkap: true
      },
      where: Object.keys(where).length ? { perikananTangkap: where } : {}
    });

    // KPI total
    let totalVolume = 0;
    let totalNilai = 0;
    const byKomoditasMap = {};
    const byPelabuhanMap = {};
    const byTanggalMap = {};
    const tripsSet = new Set();

    details.forEach(d => {
      totalVolume += d.volume;
      totalNilai += d.nilai;
      
      const tripId = d.perikanan_tangkap_id;
      tripsSet.add(tripId);

      const tgl = d.perikananTangkap.tanggal.toISOString().split('T')[0];
      const p = d.perikananTangkap.pelabuhan || d.perikananTangkap.kabupaten_kota || 'Lainnya';
      const k = d.komoditas;

      // Komoditas grouping
      if (!byKomoditasMap[k]) byKomoditasMap[k] = 0;
      byKomoditasMap[k] += d.volume;

      // Pelabuhan grouping
      if (!byPelabuhanMap[p]) byPelabuhanMap[p] = 0;
      byPelabuhanMap[p] += d.volume;

      // Tanggal grouping
      if (!byTanggalMap[tgl]) byTanggalMap[tgl] = { volume: 0, nilai: 0 };
      byTanggalMap[tgl].volume += d.volume;
      byTanggalMap[tgl].nilai += d.nilai;
    });

    // Format output
    const komoditasStats = Object.keys(byKomoditasMap)
      .map(k => ({ komoditas: k, _sum: { volume: byKomoditasMap[k] } }))
      .sort((a,b) => b._sum.volume - a._sum.volume);

    const pelabuhanStats = Object.keys(byPelabuhanMap)
      .map(p => ({ pelabuhan: p, _sum: { volume: byPelabuhanMap[p] } }))
      .sort((a,b) => b._sum.volume - a._sum.volume);

    const trenStats = Object.keys(byTanggalMap)
      .sort() // chronological
      .map(tgl => ({
        date: tgl,
        volume: byTanggalMap[tgl].volume,
        nilai: byTanggalMap[tgl].nilai
      }));

    res.status(200).json({ 
      success: true, 
      data: {
        kpi: {
          total_volume: totalVolume,
          total_nilai: totalNilai,
          total_trip: tripsSet.size,
          avg_volume_per_trip: tripsSet.size > 0 ? (totalVolume / tripsSet.size) : 0
        },
        komoditas: komoditasStats,
        pelabuhan: pelabuhanStats,
        tren: trenStats
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
      where: { status: 'APPROVED' },
      include: { tangkapan: true },
      orderBy: { tanggal: 'desc' }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};

// PUT status [ADMIN PUSAT]
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;

    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat menyetujui/menolak data' });
    }

    const updated = await prisma.perikananTangkap.update({
      where: { id: parseInt(id) },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null
      }
    });

    res.status(200).json({ success: true, message: `Status berhasil diubah menjadi ${status}`, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status data' });
  }
};

module.exports = {
  getAllData,
  getAdminData,
  createData,
  updateData,
  deleteData,
  getStats,
  exportData,
  updateStatus
};
