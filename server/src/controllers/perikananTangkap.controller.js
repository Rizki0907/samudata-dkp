const prisma = require('../utils/prisma');
const { syncDataBulananInternal } = require('./bulananTangkap.controller');
const ExcelJS = require('exceljs');
const path = require('path');

// GET all data (with filters)
const getAllData = async (req, res) => {
  try {
    const { startDate, endDate, komoditas, alat_tangkap, gt_kapal, pelabuhan } = req.query;
    
    // Build filter query
    const where = { status: 'VERIFIED' };
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
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, logistik, tangkapan, jenis_perairan, pud_populasi_alat, pud_jumlah_sampel } = req.body;
    
    if (!tangkapan || tangkapan.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tangkapan kosong' });
    }

    const records = tangkapan.map(t => {
      const isPUD = sumber_data === 'PUD';
      const pudTangkapSampel = parseFloat(t.pud_tangkapan_sampel) || 0;
      let vol = parseFloat(t.volume) || 0;
      let hrg = parseFloat(t.harga) || 0;
      
      if (isPUD) {
         const popAlat = Number(pud_populasi_alat) || 0;
         const jmlSampel = Number(pud_jumlah_sampel) || 1;
         vol = (pudTangkapSampel / (jmlSampel || 1)) * popAlat;
      }

      return {
        komoditas: t.komoditas,
        pud_tangkapan_sampel: isPUD ? pudTangkapSampel : null,
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
        logistik: typeof logistik === 'object' ? JSON.stringify(logistik) : logistik,
        jenis_perairan,
        pud_populasi_alat: Number(pud_populasi_alat) || null,
        pud_jumlah_sampel: Number(pud_jumlah_sampel) || null,
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
    const { sumber_data, tanggal, jam_labuh, jam_bongkar, pelabuhan, kabupaten_kota, nama_kapal, gt_kapal, alat_tangkap, logistik, tangkapan, jenis_perairan, pud_populasi_alat, pud_jumlah_sampel } = req.body;
    
    // Check permission
    const existing = await prisma.perikananTangkap.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    
    const isCabang = req.user && req.user.role === 'admin_cabang';
    if (existing.status === 'APPROVED' && isCabang) {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui Pusat' });
    }

    let newStatus = existing.status;
    if (isCabang && existing.status === 'REJECTED') {
      newStatus = 'PENDING'; // reset ke pending setelah direvisi
    }

    // 1. Delete existing tangkapan for this trip
    await prisma.detailTangkapan.deleteMany({
      where: { perikanan_tangkap_id: parseInt(id) }
    });

    // 2. Format new tangkapan records
    const records = (tangkapan || []).map(t => {
      const isPUD = sumber_data === 'PUD';
      const pudTangkapSampel = parseFloat(t.pud_tangkapan_sampel) || 0;
      let vol = parseFloat(t.volume) || 0;
      let hrg = parseFloat(t.harga) || 0;
      
      if (isPUD) {
         const popAlat = Number(pud_populasi_alat) || 0;
         const jmlSampel = Number(pud_jumlah_sampel) || 1;
         vol = (pudTangkapSampel / (jmlSampel || 1)) * popAlat;
      }

      return {
        komoditas: t.komoditas,
        pud_tangkapan_sampel: isPUD ? pudTangkapSampel : null,
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
        logistik: typeof logistik === 'object' ? JSON.stringify(logistik) : logistik,
        jenis_perairan,
        pud_populasi_alat: Number(pud_populasi_alat) || null,
        pud_jumlah_sampel: Number(pud_jumlah_sampel) || null,
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

    const isCabang = req.user && req.user.role === 'admin_cabang';
    if (existing.status === 'APPROVED' && isCabang) {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui Pusat' });
    }

    // Prisma Cascade delete will automatically delete DetailTangkapan
    await prisma.perikananTangkap.delete({
      where: { id: parseInt(id) }
    });

    if (existing.status === 'APPROVED' || existing.status === 'VERIFIED') {
      await syncDataBulananInternal();
    }

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
    
    const where = { status: 'VERIFIED' };
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

      // Ambil format YYYY-MM untuk agregasi bulanan
      const fullDate = d.perikananTangkap.tanggal.toISOString().split('T')[0];
      const tgl = fullDate.substring(0, 7);
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
      where: { status: 'VERIFIED' },
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

    // Auto-sync ke wadah publik jika ada perubahan approval
    if (status === 'APPROVED' || status === 'REJECTED' || status === 'VERIFIED') {
      await syncDataBulananInternal();
    }

    res.status(200).json({ success: true, message: `Status berhasil diubah menjadi ${status}`, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status data' });
  }
};
// POST batch status [ADMIN PUSAT]
const batchStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat menyetujui/menolak data' });
    }
    await prisma.perikananTangkap.updateMany({
      where: { id: { in: ids.map(id => parseInt(id)) } },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null
      }
    });

    // Auto-sync ke wadah publik jika ada perubahan approval
    if (status === 'APPROVED' || status === 'REJECTED' || status === 'VERIFIED') {
      await syncDataBulananInternal();
    }

    res.status(200).json({ success: true, message: `Berhasil mengubah status ${ids.length} data` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status data secara massal' });
  }
};

// POST batch delete [ADMIN PUSAT]
const batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat menghapus data' });
    }
    
    // Hapus child table dulu (Tangkapan)
    await prisma.detailTangkapan.deleteMany({
      where: { perikanan_tangkap_id: { in: ids.map(id => parseInt(id)) } }
    });
    
    await prisma.perikananTangkap.deleteMany({
      where: { id: { in: ids.map(id => parseInt(id)) } }
    });
    
    await syncDataBulananInternal();

    res.status(200).json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus data secara massal' });
  }
};

  // POST export PUD
  const exportPUD = async (req, res) => {
    try {
      const { ids, tahun, bulan, wilayah } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data untuk diekspor' });
      }

      // Fetch the data to export
      const data = await prisma.perikananTangkap.findMany({
        where: { id: { in: ids } },
        include: { tangkapan: true }
      });

      // Load Template
      const templatePath = path.join(__dirname, '../../templates/PUHIT.xlsx');
      const XlsxPopulate = require('xlsx-populate');
      const wb = await XlsxPopulate.fromFileAsync(templatePath);

      // Fill ISIAN sheet
      const isianSheet = wb.sheet('ISIAN');
      if (isianSheet) {
        isianSheet.cell('C3').value('Jawa Timur');
        isianSheet.cell('C5').value(wilayah || '-');
        isianSheet.cell('C7').value('Darat / PUD');
        isianSheet.cell('C9').value(bulan ? `${bulan}` : '-');
        isianSheet.cell('C11').value(tahun || new Date().getFullYear());
      }

      // Fill DATA sheet
      const dataSheet = wb.sheet('DATA');
      if (dataSheet) {
        // Build fish map from row 3 (which contains the names Betok, Sidat, dll.)
        const fishMap = {}; // name -> colNumber
        for(let c=2; c<=80; c++) {
          const val = dataSheet.cell(3, c).value();
          if (val && typeof val === 'string') {
            fishMap[val.trim().toLowerCase()] = c;
          }
        }

        // Boat type to row mapping (based on PUD_JENIS_PERAHU_OPTIONS)
        // From observation, the rows are 4 to 15 corresponding to boat types.
        const boatRowMap = {
          'Tanpa Perahu': 4,
          'Perahu Tanpa Motor': 5,
          'Motor Tempel < 5 GT': 6,
          'Kapal Motor 5-10 GT': 12,
          'Kapal Motor 10-20 GT': 13,
          'Kapal Motor 20-30 GT': 14,
          'Kapal Motor >30 GT': 15
        };

        data.forEach(record => {
          console.log(`Processing record ID: ${record.id}, GT: ${record.gt_kapal}`);
          const rowNum = boatRowMap[record.gt_kapal];
          if (!rowNum) {
            console.log(`Unrecognized boat type: ${record.gt_kapal}`);
            return;
          }

          record.tangkapan.forEach(t => {
            const fishName = t.komoditas.trim().toLowerCase();
            let colNum = fishMap[fishName];
            
            // Fallback for "Ikan lainnya" if specific fish not found
            if (!colNum) colNum = fishMap['ikan lainnya'];
            
            if (colNum) {
              const cell = dataSheet.cell(rowNum, colNum);
              const currentVal = Number(cell.value()) || 0;
              cell.value(currentVal + Number(t.volume || 0));
              console.log(`Wrote ${t.volume} to row ${rowNum}, col ${colNum} for ${fishName}`);
            } else {
              console.log(`Could not find column for ${fishName} or 'ikan lainnya'`);
            }
          });
        });
      }

      console.log('Finished populating, generating buffer...');
      const buffer = await wb.outputAsync();
      console.log('Buffer generated, size:', buffer.length);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="PUHIT_${wilayah || 'Semua'}_${tahun || 'All'}.xlsx"`);
      
      res.send(buffer);
    } catch (error) {
      console.error('Export PUD Error:', error);
      res.status(500).json({ success: false, message: 'Gagal mengekspor laporan PUD' });
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
  updateStatus,
  batchStatus,
  batchDelete,
  exportPUD
};
