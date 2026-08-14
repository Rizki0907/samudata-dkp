const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi Controller: getAllTahunan
exports.getAllTahunan = async (req, res) => {
  try {
    const data = await prisma.tangkapTahunan.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getAllTahunan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: getPublikData
exports.getPublikData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const data = await prisma.tangkapTahunan.findMany({
      where: {
        status: 'VERIFIED',
        tahun: { lt: currentYear }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getPublikData:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: getTahunanById
exports.getTahunanById = async (req, res) => {
  try {
    const data = await prisma.tangkapTahunan.findUnique({
      where: { id: req.params.id }
    });
    if (!data) return res.status(404).json({ success: false, message: 'Data not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getTahunanById:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: createTahunan
exports.createTahunan = async (req, res) => {
  try {
    const { 
      tahun, sumber_data, pelabuhan, kabupaten_kota, jenis_perairan,
      status, rtp, nelayan, kapal, alat_tangkap 
    } = req.body;

    const newData = await prisma.tangkapTahunan.create({
      data: {
        tahun,
        sumber_data,
        pelabuhan,
        kabupaten_kota,
        jenis_perairan,
        status: status || 'PENDING',
        rtp: rtp || {},
        nelayan: nelayan || {},
        kapal: kapal || {},
        alat_tangkap: alat_tangkap || {}
      }
    });

    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    console.error('Error in createTahunan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: updateTahunan
exports.updateTahunan = async (req, res) => {
  try {
    const { 
      tahun, sumber_data, pelabuhan, kabupaten_kota, jenis_perairan,
      status, rtp, nelayan, kapal, alat_tangkap 
    } = req.body;

    const updatedData = await prisma.tangkapTahunan.update({
      where: { id: req.params.id },
      data: {
        tahun,
        sumber_data,
        pelabuhan,
        kabupaten_kota,
        jenis_perairan,
        status,
        rtp,
        nelayan,
        kapal,
        alat_tangkap,
      }
    });

    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error in updateTahunan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: deleteTahunan
exports.deleteTahunan = async (req, res) => {
  try {
    await prisma.tangkapTahunan.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ success: true, message: 'Data deleted' });
  } catch (error) {
    console.error('Error in deleteTahunan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: updateStatus
exports.updateStatus = async (req, res) => {
  try {
    const { status, alasan_penolakan } = req.body;
    const updatedData = await prisma.tangkapTahunan.update({
      where: { id: req.params.id },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null
      }
    });
    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error in updateStatus:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: batchUpdateStatus
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });
    }
    await prisma.tangkapTahunan.updateMany({
      where: { id: { in: ids } },
      data: { status, alasan_penolakan: alasan_penolakan || null }
    });
    res.status(200).json({ success: true, message: 'Status berhasil diupdate' });
  } catch (error) {
    console.error('Error in batchUpdateStatus:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fungsi Controller: batchDelete
exports.batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang dipilih' });
    }
    await prisma.tangkapTahunan.deleteMany({
      where: { id: { in: ids } }
    });
    res.status(200).json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error in batchDelete:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
