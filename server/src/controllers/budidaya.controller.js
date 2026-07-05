const prisma = require('../utils/prisma');
const ExcelJS = require('exceljs');

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
    const where = { status: 'APPROVED' };
    if (tahun) where.tahun = tahun;
    if (triwulan) where.triwulan = triwulan;
    
    const data = await prisma.budidaya.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data = await prisma.budidaya.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budidaya admin data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { tahun, bulan } = req.query;
    const where = { status: 'APPROVED' };
    if (tahun) where.tahun = tahun;
    if (bulan) where.bulan = bulan;

    const data = await prisma.budidaya.findMany({ where });

    // KPI Calculation
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    data.forEach(item => {
      total_volume += item.produksi_kg;
      total_nilai += item.nilai_rp;
      komoditasMap[item.komoditas] = (komoditasMap[item.komoditas] || 0) + item.produksi_kg;
    });

    let top_komoditas = '-';
    let maxKomoditasProd = 0;
    for (const [kom, prod] of Object.entries(komoditasMap)) {
      if (prod > maxKomoditasProd) {
        maxKomoditasProd = prod;
        top_komoditas = kom;
      }
    }
    const kpi = { total_volume, top_komoditas, total_nilai };

    // 1. Produksi dan Nilai per Kabupaten
    const kabMap = {};
    data.forEach(item => {
      if (!kabMap[item.kabupaten_kota]) kabMap[item.kabupaten_kota] = { produksi: 0, nilai: 0 };
      kabMap[item.kabupaten_kota].produksi += item.produksi_kg;
      kabMap[item.kabupaten_kota].nilai += item.nilai_rp;
    });
    const produksiPerKabupaten = Object.entries(kabMap)
      .map(([name, stats]) => ({ name, produksi: stats.produksi, nilai: stats.nilai }))
      .sort((a, b) => b.produksi - a.produksi);

    // 2. Komposisi Wadah
    const wadahMap = {};
    data.forEach(item => {
      wadahMap[item.jenis_wadah] = (wadahMap[item.jenis_wadah] || 0) + item.produksi_kg;
    });
    const komposisiWadah = Object.entries(wadahMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Get Top 5 Wadah for Tren Bulanan
    const top5Wadah = komposisiWadah.slice(0, 5).map(w => w.name);

    // 3. Tren Bulanan (Top 5 Wadah + Lainnya)
    const BULAN_ORDER = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const trenBulanan = BULAN_ORDER.map(bulan => {
      const monthData = { bulan, Lainnya: 0 };
      top5Wadah.forEach(w => monthData[w] = 0);
      return monthData;
    });

    data.forEach(item => {
      const bIndex = BULAN_ORDER.indexOf(item.bulan);
      if (bIndex === -1) return;
      if (top5Wadah.includes(item.jenis_wadah)) {
        trenBulanan[bIndex][item.jenis_wadah] += item.produksi_kg;
      } else {
        trenBulanan[bIndex].Lainnya += item.produksi_kg;
      }
    });

    // 4. Heatmap Kabupaten x Bulan (Normalisasi Min-Max per baris)
    const heatmapRaw = {};
    data.forEach(item => {
      if (!heatmapRaw[item.kabupaten_kota]) {
        heatmapRaw[item.kabupaten_kota] = BULAN_ORDER.map(b => ({ bulan: b, produksi: 0 }));
      }
      const bIndex = BULAN_ORDER.indexOf(item.bulan);
      if (bIndex !== -1) {
        heatmapRaw[item.kabupaten_kota][bIndex].produksi += item.produksi_kg;
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
        kpi,
        produksiPerKabupaten,
        trenBulanan,
        top5Wadah,
        komposisiWadah,
        heatmapData
      }
    });
  } catch (error) {
    console.error('Error generating budidaya stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


const createData = async (req, res) => {
  try {
    const { kabupaten_kota, tahun, bulan, jenis_wadah, produksi_kg, kategori_komoditas, komoditas, harga_rp } = req.body;

    const triwulan = getTriwulan(bulan);
    const statusData = req.user && req.user.role === 'admin_pusat' ? 'APPROVED' : 'PENDING';

    const computedNilai = parseFloat(produksi_kg || 0) * parseFloat(harga_rp || 0);

    const data = await prisma.budidaya.create({
      data: {
        status: statusData,
        kabupaten_kota,
        tahun: tahun.toString(),
        bulan,
        triwulan,
        jenis_wadah,
        produksi_kg: parseFloat(produksi_kg || 0),
        harga_rp: parseFloat(harga_rp || 0),
        kategori_komoditas: kategori_komoditas || '-',
        komoditas: komoditas || '-',
        nilai_rp: computedNilai
      }
    });

    res.status(201).json({ success: true, data, message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { kabupaten_kota, tahun, bulan, jenis_wadah, produksi_kg, kategori_komoditas, komoditas, harga_rp } = req.body;

    const triwulan = getTriwulan(bulan);

    const existing = await prisma.budidaya.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    if (existing.status === 'APPROVED' && req.user && req.user.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat mengubah data yang sudah disetujui Pusat' });
    }

    let newStatus = existing.status;
    if (req.user && req.user.role === 'admin_cabang' && existing.status === 'REJECTED') {
      newStatus = 'PENDING';
    }

    const computedNilai = parseFloat(produksi_kg || 0) * parseFloat(harga_rp || 0);

    const data = await prisma.budidaya.update({
      where: { id: parseInt(id) },
      data: {
        status: newStatus,
        alasan_penolakan: newStatus === 'PENDING' ? null : existing.alasan_penolakan,
        kabupaten_kota,
        tahun: tahun.toString(),
        bulan,
        triwulan,
        jenis_wadah,
        produksi_kg: parseFloat(produksi_kg || 0),
        harga_rp: parseFloat(harga_rp || 0),
        kategori_komoditas: kategori_komoditas || '-',
        komoditas: komoditas || '-',
        nilai_rp: computedNilai
      }
    });

    res.json({ success: true, data, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('Error updating budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budidaya.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    if (existing.status === 'APPROVED' && req.user && req.user.role === 'admin_cabang') {
      return res.status(403).json({ success: false, message: 'Admin Cabang tidak dapat menghapus data yang sudah disetujui Pusat' });
    }

    await prisma.budidaya.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting budidaya data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;

    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat menyetujui/menolak data' });
    }

    const updated = await prisma.budidaya.update({
      where: { id: parseInt(id) },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null
      }
    });

    res.json({ success: true, message: `Status berhasil diubah menjadi ${status}`, data: updated });
  } catch (error) {
    console.error('Error updating budidaya status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!req.user || req.user.role !== 'admin_pusat') {
      return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat menyetujui/menolak data' });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Data ID tidak valid' });
    }
    
    await prisma.budidaya.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null
      }
    });

    res.json({ success: true, message: `${ids.length} data berhasil diubah statusnya menjadi ${status}` });
  } catch (error) {
    console.error('Error batch update status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Data ID tidak valid' });
    }
    
    // Optional: add logic here if you want to prevent 'admin_cabang' from deleting 'APPROVED' data in batch
    await prisma.budidaya.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({ success: true, message: `${ids.length} data berhasil dihapus` });
  } catch (error) {
    console.error('Error batch delete data:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const exportRingkasanWadah = async (req, res) => {
  try {
    const { tahun } = req.query;
    if (!tahun) {
      return res.status(400).json({ success: false, message: 'Parameter tahun diwajibkan' });
    }

    const data = await prisma.budidaya.findMany({
      where: { tahun: tahun, status: 'APPROVED' }
    });

    const distinctWadahData = await prisma.budidaya.groupBy({
      by: ['jenis_wadah'],
      where: { status: 'APPROVED' }
    });
    const uniqueWadah = distinctWadahData.map(d => d.jenis_wadah).filter(Boolean).sort();

    const kabMap = {};
    data.forEach(item => {
      const kab = item.kabupaten_kota.toUpperCase();
      if (!kabMap[kab]) {
        kabMap[kab] = { jumlah: 0 };
        uniqueWadah.forEach(w => kabMap[kab][w] = 0);
      }
      const wadahKey = item.jenis_wadah;
      const tonase = item.produksi_kg; // Keep as KG
      if (wadahKey && uniqueWadah.includes(wadahKey)) {
         kabMap[kab][wadahKey] += tonase;
      }
      kabMap[kab].jumlah += tonase;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Budidaya');
    const totalCols = uniqueWadah.length + 2;

    // Row 1-2: Judul
    sheet.mergeCells(1, 1, 1, totalCols);
    sheet.getCell(1, 1).value = `REKAPITULASI DATA PRODUKSI PERIKANAN BUDIDAYA PROVINSI JAWA TIMUR TAHUN ${tahun}`;
    sheet.getCell(1, 1).font = { bold: true, size: 14 };
    sheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells(2, 1, 2, totalCols);
    sheet.getCell(2, 1).value = `BERDASARKAN JENIS WADAH`;
    sheet.getCell(2, 1).font = { bold: true, size: 12 };
    sheet.getCell(2, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 3: Satuan
    sheet.getCell(3, totalCols).value = 'Satuan : KG';
    sheet.getCell(3, totalCols).font = { italic: true };
    sheet.getCell(3, totalCols).alignment = { horizontal: 'right' };

    // Row 4: Headers
    const headers = ['KABUPATEN/KOTA', 'JUMLAH', ...uniqueWadah.map(w => w.toUpperCase())];
    headers.forEach((h, i) => {
      const cell = sheet.getCell(4, i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    // Totals
    const totals = { jumlah: 0 };
    uniqueWadah.forEach(w => totals[w] = 0);

    const sortedKab = Object.keys(kabMap).sort();
    sortedKab.forEach(k => {
      totals.jumlah += kabMap[k].jumlah;
      uniqueWadah.forEach(w => totals[w] += kabMap[k][w]);
    });

    // Row 5: JUMLAH TOTAL
    const totalRowValues = ['JUMLAH TOTAL', totals.jumlah];
    uniqueWadah.forEach(w => totalRowValues.push(totals[w]));

    const totalRow = sheet.getRow(5);
    totalRow.values = totalRowValues;
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    // Row 6-dst: Data
    let currentRow = 6;
    sortedKab.forEach(k => {
      const v = kabMap[k];
      const rowValues = [k, v.jumlah];
      uniqueWadah.forEach(w => rowValues.push(v[w]));
      
      const row = sheet.getRow(currentRow);
      row.values = rowValues;
      row.eachCell((cell) => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      currentRow++;
    });

    sheet.getColumn(1).width = 25;
    for(let i=2; i<=totalCols; i++) sheet.getColumn(i).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=data_produksi_perikanan_${tahun}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting wadah:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const exportRingkasanKomoditas = async (req, res) => {
  try {
    const { tahun } = req.query;
    if (!tahun) return res.status(400).json({ success: false, message: 'Parameter tahun diwajibkan' });

    const data = await prisma.budidaya.findMany({
      where: { tahun: tahun, status: 'APPROVED' }
    });

    const wadahKomoditasMap = {};
    data.forEach(item => {
      const wadah = item.jenis_wadah || 'LAINNYA';
      const kom = item.komoditas || 'LAINNYA';
      if (!wadahKomoditasMap[wadah]) wadahKomoditasMap[wadah] = new Set();
      wadahKomoditasMap[wadah].add(kom);
    });

    const sortedWadah = Object.keys(wadahKomoditasMap).sort();
    const wadahStructure = sortedWadah.map(w => ({
      wadah: w,
      komoditasList: Array.from(wadahKomoditasMap[w]).sort()
    }));

    const kabMap = {};
    data.forEach(item => {
      const kab = item.kabupaten_kota.toUpperCase();
      if (!kabMap[kab]) {
        kabMap[kab] = { jumlah_total: 0 };
        wadahStructure.forEach(ws => {
          kabMap[kab][ws.wadah] = {};
          ws.komoditasList.forEach(k => {
            kabMap[kab][ws.wadah][k] = 0;
          });
        });
      }
      const wadah = item.jenis_wadah || 'LAINNYA';
      const kom = item.komoditas || 'LAINNYA';
      const tonase = item.produksi_kg || 0;
      
      if (kabMap[kab][wadah] && kabMap[kab][wadah][kom] !== undefined) {
        kabMap[kab][wadah][kom] += tonase;
      }
      kabMap[kab].jumlah_total += tonase;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Budidaya Komoditas');
    
    let totalKomoditasCols = 0;
    wadahStructure.forEach(ws => totalKomoditasCols += ws.komoditasList.length);
    const totalCols = totalKomoditasCols + 2; 

    sheet.mergeCells(1, 1, 1, totalCols);
    sheet.getCell(1, 1).value = `REKAPITULASI DATA PRODUKSI PERIKANAN BUDIDAYA PROVINSI JAWA TIMUR TAHUN ${tahun}`;
    sheet.getCell(1, 1).font = { bold: true, size: 14 };
    sheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells(2, 1, 2, totalCols);
    sheet.getCell(2, 1).value = `BERDASARKAN KOMODITAS`;
    sheet.getCell(2, 1).font = { bold: true, size: 12 };
    sheet.getCell(2, 1).alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell(3, totalCols).value = 'Satuan : KG';
    sheet.getCell(3, totalCols).font = { italic: true };
    sheet.getCell(3, totalCols).alignment = { horizontal: 'right' };

    sheet.getCell(4, 1).value = 'KABUPATEN/KOTA';
    sheet.getCell(4, 1).font = { bold: true };
    sheet.getCell(4, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells(4, 1, 5, 1);
    
    sheet.getCell(4, 2).value = 'JUMLAH';
    sheet.getCell(4, 2).font = { bold: true };
    sheet.getCell(4, 2).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells(4, 2, 5, 2);

    let currentCol = 3;
    wadahStructure.forEach(ws => {
      const startCol = currentCol;
      const endCol = startCol + ws.komoditasList.length - 1;
      
      sheet.getCell(4, startCol).value = ws.wadah.toUpperCase();
      sheet.getCell(4, startCol).font = { bold: true };
      sheet.getCell(4, startCol).alignment = { horizontal: 'center', vertical: 'middle' };
      
      if (endCol > startCol) {
        sheet.mergeCells(4, startCol, 4, endCol);
      }
      
      ws.komoditasList.forEach((kom, i) => {
        const cell = sheet.getCell(5, startCol + i);
        cell.value = kom;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      
      currentCol = endCol + 1;
    });

    for(let i=1; i<=totalCols; i++) {
      ['A'].forEach(() => { 
         const cell4 = sheet.getCell(4, i);
         cell4.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
         const cell5 = sheet.getCell(5, i);
         cell5.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
    }

    const sortedKab = Object.keys(kabMap).sort();
    
    const totals = { jumlah_total: 0, wadah: {} };
    wadahStructure.forEach(ws => {
      totals.wadah[ws.wadah] = {};
      ws.komoditasList.forEach(k => {
        totals.wadah[ws.wadah][k] = 0;
      });
    });

    sortedKab.forEach(k => {
      totals.jumlah_total += kabMap[k].jumlah_total;
      wadahStructure.forEach(ws => {
        ws.komoditasList.forEach(kom => {
          totals.wadah[ws.wadah][kom] += kabMap[k][ws.wadah][kom];
        });
      });
    });

    const totalRowValues = ['JUMLAH TOTAL', totals.jumlah_total];
    wadahStructure.forEach(ws => {
      ws.komoditasList.forEach(kom => {
        totalRowValues.push(totals.wadah[ws.wadah][kom]);
      });
    });
    
    const totalRow = sheet.getRow(6);
    totalRow.values = totalRowValues;
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    let currentRow = 7;
    sortedKab.forEach(k => {
      const v = kabMap[k];
      const rowValues = [k, v.jumlah_total];
      wadahStructure.forEach(ws => {
        ws.komoditasList.forEach(kom => {
          rowValues.push(v[ws.wadah][kom]);
        });
      });
      
      const row = sheet.getRow(currentRow);
      row.values = rowValues;
      row.eachCell((cell) => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      currentRow++;
    });

    sheet.getColumn(1).width = 25;
    for(let i=2; i<=totalCols; i++) sheet.getColumn(i).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=data_produksi_komoditas_${tahun}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting komoditas:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllData,
  getAdminData,
  getStats,
  createData,
  updateData,
  deleteData,
  updateStatus,
  batchStatus,
  batchDelete,
  exportRingkasanWadah,
  exportRingkasanKomoditas
};
