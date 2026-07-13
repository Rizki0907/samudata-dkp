const prisma = require('../utils/prisma');

const getAllMasterData = async (req, res) => {
  try {
    const data = await prisma.masterData.findMany({
      orderBy: [
        { category: 'asc' },
        { value: 'asc' }
      ]
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil master data' });
  }
};

const getMasterDataByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = await prisma.masterData.findMany({
      where: { category },
      orderBy: { value: 'asc' }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching master data by category:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil master data' });
  }
};

const createMasterData = async (req, res) => {
  try {
    const { category, value } = req.body;
    
    if (!category || !value) {
      return res.status(400).json({ success: false, message: 'Category dan value harus diisi' });
    }

    const existing = await prisma.masterData.findUnique({
      where: {
        category_value: { category, value }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Data ini sudah ada dalam kategori tersebut' });
    }

    const newData = await prisma.masterData.create({
      data: { category, value }
    });

    res.status(201).json({ success: true, data: newData, message: 'Master data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating master data:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah master data' });
  }
};

const deleteMasterData = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.masterData.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ success: true, message: 'Master data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting master data:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus master data' });
  }
};

module.exports = {
  getAllMasterData,
  getMasterDataByCategory,
  createMasterData,
  deleteMasterData
};
