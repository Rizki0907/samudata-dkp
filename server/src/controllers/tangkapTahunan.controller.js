const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
