const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllData = async (req, res) => {
  try {
    const data = await prisma.ekspor.findMany({
      orderBy: { tanggal_ekspor: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createData = async (req, res) => {
  try {
    const { 
      bulan, tahun, tanggal_ekspor, nama_eksportir, 
      kategori_komoditas, nama_komoditas, volume, 
      satuan_volume, mata_uang, nilai, negara_tujuan 
    } = req.body;

    const data = await prisma.ekspor.create({
      data: {
        bulan,
        tahun,
        tanggal_ekspor: new Date(tanggal_ekspor),
        nama_eksportir,
        kategori_komoditas,
        nama_komoditas,
        volume: parseFloat(volume),
        satuan_volume,
        mata_uang,
        nilai: parseFloat(nilai),
        negara_tujuan
      }
    });

    res.status(201).json({ success: true, data, message: 'Data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      bulan, tahun, tanggal_ekspor, nama_eksportir, 
      kategori_komoditas, nama_komoditas, volume, 
      satuan_volume, mata_uang, nilai, negara_tujuan 
    } = req.body;

    const data = await prisma.ekspor.update({
      where: { id: parseInt(id) },
      data: {
        bulan,
        tahun,
        tanggal_ekspor: new Date(tanggal_ekspor),
        nama_eksportir,
        kategori_komoditas,
        nama_komoditas,
        volume: parseFloat(volume),
        satuan_volume,
        mata_uang,
        nilai: parseFloat(nilai),
        negara_tujuan
      }
    });

    res.json({ success: true, data, message: 'Data berhasil diupdate' });
  } catch (error) {
    console.error('Error updating ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ekspor.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting ekspor data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
