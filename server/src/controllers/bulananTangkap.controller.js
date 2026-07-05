const prisma = require('../utils/prisma');

// Sinkronisasi otomatis data riil ke wadah bulanan
const syncDataBulananInternal = async () => {
  try {
    const dataRiil = await prisma.perikananTangkap.findMany({
      where: { status: 'APPROVED' },
      include: { tangkapan: true }
    });

    const aggregated = {};
    for (const row of dataRiil) {
      if (!row.tanggal) continue;
      
      const yyyyMM = row.tanggal.toISOString().substring(0, 7); // YYYY-MM
      const sumber = row.sumber_data || 'PELABUHAN';
      const pelabuhan = row.pelabuhan || row.kabupaten_kota || 'Lainnya';
      
      if (row.tangkapan) {
        for (const t of row.tangkapan) {
          const komoditas = t.komoditas;
          const key = `${yyyyMM}|${sumber}|${pelabuhan}|${komoditas}`;
          
          if (!aggregated[key]) {
            aggregated[key] = {
              bulan: yyyyMM,
              sumber_data: sumber,
              pelabuhan,
              komoditas,
              volume: 0,
              nilai: 0
            };
          }
          aggregated[key].volume += (Number(t.volume) || 0);
          aggregated[key].nilai += (Number(t.nilai) || 0);
        }
      }
    }

    // Reset volume & nilai = 0 untuk semua record yang belum di-adjust
    await prisma.dataBulananTangkap.updateMany({
      where: { is_adjusted: false },
      data: { volume: 0, nilai: 0 }
    });

    const aggrVals = Object.values(aggregated);
    for (const item of aggrVals) {
      const existing = await prisma.dataBulananTangkap.findUnique({
        where: {
          bulan_sumber_data_pelabuhan_komoditas: {
            bulan: item.bulan,
            sumber_data: item.sumber_data,
            pelabuhan: item.pelabuhan,
            komoditas: item.komoditas
          }
        }
      });

      if (!existing) {
        await prisma.dataBulananTangkap.create({ data: item });
      } else if (!existing.is_adjusted) {
        await prisma.dataBulananTangkap.update({
          where: { id: existing.id },
          data: {
            volume: item.volume,
            nilai: item.nilai
          }
        });
      }
    }
    return true;
  } catch (error) {
    console.error('Error syncing data bulanan:', error);
    return false;
  }
};

const triggerSync = async (req, res) => {
  const success = await syncDataBulananInternal();
  if (success) {
    res.status(200).json({ success: true, message: 'Sinkronisasi berhasil' });
  } else {
    res.status(500).json({ success: false, message: 'Sinkronisasi gagal' });
  }
};

const getPublikData = async (req, res) => {
  try {
    const data = await prisma.dataBulananTangkap.findMany({
      where: { volume: { gt: 0 } },
      orderBy: [{ bulan: 'desc' }, { pelabuhan: 'asc' }]
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data = await prisma.dataBulananTangkap.findMany({
      orderBy: [{ bulan: 'desc' }, { pelabuhan: 'asc' }]
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data admin' });
  }
};

const updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const { volume, nilai } = req.body;
    const data = await prisma.dataBulananTangkap.update({
      where: { id: Number(id) },
      data: {
        volume: Number(volume),
        nilai: Number(nilai),
        is_adjusted: true 
      }
    });
    res.status(200).json({ success: true, message: 'Data target diperbarui', data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update data target' });
  }
};

const resetTarget = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dataBulananTangkap.update({
      where: { id: Number(id) },
      data: { is_adjusted: false }
    });
    await syncDataBulananInternal();
    res.status(200).json({ success: true, message: 'Target dikembalikan ke nilai riil' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal reset data target' });
  }
};

module.exports = {
  syncDataBulananInternal,
  triggerSync,
  getPublikData,
  getAdminData,
  updateTarget,
  resetTarget
};
