const prisma = require('../utils/prisma');

// Sinkronisasi otomatis data riil ke wadah bulanan
const syncDataBulananInternal = async () => {
  try {
    const dataRiil = await prisma.perikananTangkap.findMany({
      where: { status: 'VERIFIED' },
      include: { tangkapan: true }
    });

    const aggregated = {};
    for (const row of dataRiil) {
      if (!row.tanggal) continue;
      
      const yyyyMM = row.tanggal.toISOString().substring(0, 7); // YYYY-MM
      const sumber = row.sumber_data || 'PELABUHAN';
      
      let pelabuhan = row.pelabuhan || 'Lainnya';
      let jenisPerairan = '-';
      if (sumber === 'PUD') {
        pelabuhan = row.kabupaten_kota || 'Lainnya';
        jenisPerairan = row.jenis_perairan || '-';
      } else if (sumber === 'KAB_KOTA') {
        pelabuhan = row.kabupaten_kota || 'Lainnya';
      }
      
      if (row.tangkapan) {
        for (const t of row.tangkapan) {
          const komoditas = t.komoditas;
          const key = `${yyyyMM}|${sumber}|${pelabuhan}|${jenisPerairan || 'none'}|${komoditas}`;
          
          if (!aggregated[key]) {
            aggregated[key] = {
              bulan: yyyyMM,
              sumber_data: sumber,
              pelabuhan,
              jenis_perairan: jenisPerairan,
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

    await prisma.$transaction(async (tx) => {
      // Reset original_volume & original_nilai = 0 untuk semua record (jaga-jaga jika data aslinya dihapus)
      await tx.dataBulananTangkap.updateMany({
        data: { original_volume: 0, original_nilai: 0 }
      });

      // Reset volume & nilai = 0 HANYA untuk record yang belum di-adjust (belum disentuh admin)
      await tx.dataBulananTangkap.updateMany({
        where: { is_adjusted: false },
        data: { volume: 0, nilai: 0 }
      });

      const aggrVals = Object.values(aggregated);
      for (const item of aggrVals) {
        const existing = await tx.dataBulananTangkap.findUnique({
          where: {
            bulan_sumber_data_pelabuhan_jenis_perairan_komoditas: {
              bulan: item.bulan,
              sumber_data: item.sumber_data,
              pelabuhan: item.pelabuhan,
              jenis_perairan: item.jenis_perairan,
              komoditas: item.komoditas
            }
          }
        });

        if (!existing) {
          await tx.dataBulananTangkap.create({ 
            data: {
              ...item,
              original_volume: item.volume,
              original_nilai: item.nilai
            }
          });
        } else {
          const updateData = {
            original_volume: item.volume,
            original_nilai: item.nilai
          };
          // Jika belum di-adjust admin, target volume & nilai ikut diperbarui sesuai data asli
          if (!existing.is_adjusted) {
            updateData.volume = item.volume;
            updateData.nilai = item.nilai;
          }
          await tx.dataBulananTangkap.update({
            where: { id: existing.id },
            data: updateData
          });
        }
      }

      // Cleanup: hapus baris yang kosong/yatim (tidak memiliki data mentah) bahkan jika sempat dimodifikasi admin
      await tx.dataBulananTangkap.deleteMany({
        where: {
          original_volume: 0,
          original_nilai: 0
        }
      });
    }, {
      maxWait: 10000,
      timeout: 30000
    });

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

const getLogistikMap = async () => {
  const dataRiil = await prisma.perikananTangkap.findMany({
    where: { status: 'VERIFIED', sumber_data: 'PELABUHAN' }
  });
  const map = {};
  dataRiil.forEach(row => {
    if (!row.tanggal || !row.logistik) return;
    const yyyyMM = row.tanggal.toISOString().substring(0, 7);
    const pelabuhan = row.pelabuhan || 'Lainnya';
    const key = `${yyyyMM}|PELABUHAN|${pelabuhan}`;
    if (!map[key]) map[key] = {};
    
    try {
      const parsed = JSON.parse(row.logistik);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!map[key][item.nama]) map[key][item.nama] = 0;
          map[key][item.nama] += (parseFloat(item.jumlah) || 0);
        });
      }
    } catch(e) {}
  });
  return map;
};

const getPublikData = async (req, res) => {
  try {
    const data = await prisma.dataBulananTangkap.findMany({
      where: { volume: { gt: 0 } },
      orderBy: [{ bulan: 'desc' }, { pelabuhan: 'asc' }]
    });
    const logistikBulanan = await getLogistikMap();
    res.status(200).json({ success: true, data, logistikBulanan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

const getAdminData = async (req, res) => {
  try {
    const data = await prisma.dataBulananTangkap.findMany({
      orderBy: [{ bulan: 'desc' }, { pelabuhan: 'asc' }]
    });
    const logistikBulanan = await getLogistikMap();
    res.status(200).json({ success: true, data, logistikBulanan });
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

const batchUpdateTarget = async (req, res) => {
  try {
    const { ids, volumePercentage, nilaiPercentage } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ success: false, message: 'Invalid IDs' });
    
    // Convert percentages to multipliers. e.g. +10% -> 1.10, -5% -> 0.95
    const volMultiplier = 1 + (Number(volumePercentage || 0) / 100);
    const nilaiMultiplier = 1 + (Number(nilaiPercentage || 0) / 100);

    const records = await prisma.dataBulananTangkap.findMany({
      where: { id: { in: ids.map(id => Number(id)) } }
    });

    for (const record of records) {
      await prisma.dataBulananTangkap.update({
        where: { id: record.id },
        data: {
          volume: record.volume * volMultiplier,
          nilai: record.nilai * nilaiMultiplier,
          is_adjusted: true
        }
      });
    }

    res.status(200).json({ success: true, message: 'Batch update target berhasil' });
  } catch (error) {
    console.error('Error batch update target:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan batch update' });
  }
};

module.exports = {
  syncDataBulananInternal,
  triggerSync,
  getPublikData,
  getAdminData,
  updateTarget,
  resetTarget,
  batchUpdateTarget
};
