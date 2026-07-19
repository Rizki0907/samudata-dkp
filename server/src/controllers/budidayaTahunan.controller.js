const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const data = await prisma.budidayaTahunan.findMany({
      orderBy: [
        { tahun: 'desc' },
        { kabupaten_kota: 'asc' },
      ],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createOrUpdate = async (req, res) => {
  try {
    const { tahun, kabupaten_kota, modul_id, data, status } = req.body;

    if (!tahun || !kabupaten_kota || !modul_id || !data) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const existingData = await prisma.budidayaTahunan.findFirst({
      where: {
        tahun: parseInt(tahun),
        kabupaten_kota,
        modul_id,
      },
    });

    let result;
    if (existingData) {
      result = await prisma.budidayaTahunan.update({
        where: { id: existingData.id },
        data: {
          data,
          status: status || existingData.status,
          alasan_penolakan: null, // reset penolakan if re-submitted
        },
      });
    } else {
      result = await prisma.budidayaTahunan.create({
        data: {
          tahun: parseInt(tahun),
          kabupaten_kota,
          modul_id,
          data,
          status: status || 'PENDING',
        },
      });
    }

    res.json({ success: true, data: result, message: 'Data berhasil disimpan' });
  } catch (error) {
    console.error('Error saving budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;

    const updatedData = await prisma.budidayaTahunan.update({
      where: { id: parseInt(id) },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null,
      },
    });

    res.json({ success: true, data: updatedData, message: `Status berhasil diubah menjadi ${status}` });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.budidayaTahunan.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    await prisma.budidayaTahunan.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status,
        alasan_penolakan: alasan_penolakan || null
      }
    });

    res.json({ success: true, message: `Berhasil mengupdate status ${ids.length} data` });
  } catch (error) {
    console.error('Error in batchUpdateStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    await prisma.budidayaTahunan.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error in batchDelete:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAll,
  createOrUpdate,
  updateStatus,
  deleteRecord,
  batchUpdateStatus,
  batchDelete
};
