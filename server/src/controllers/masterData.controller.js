const prisma = require('../utils/prisma');

const normalizeMasterMetadata = (category, metadata) => {
  if (category !== 'KABUPATEN_KOTA') {
    return metadata || null;
  }

  const idWilayah = String(metadata?.id_wilayah ?? '').trim();

  if (!idWilayah) {
    const error = new Error('ID Wilayah wajib diisi untuk Kabupaten/Kota');
    error.statusCode = 400;
    throw error;
  }

  return {
    ...(metadata && typeof metadata === 'object' ? metadata : {}),
    id_wilayah: idWilayah,
  };
};

const ensureUniqueRegionId = async (idWilayah, excludeId = null) => {
  if (!idWilayah) return;

  const items = await prisma.masterData.findMany({
    where: {
      category: 'KABUPATEN_KOTA',
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      value: true,
      metadata: true,
    },
  });

  const duplicate = items.find(
    item => String(item.metadata?.id_wilayah ?? '').trim() === String(idWilayah).trim(),
  );

  if (duplicate) {
    const error = new Error(
      `ID Wilayah ${idWilayah} sudah digunakan oleh ${duplicate.value}`,
    );
    error.statusCode = 400;
    throw error;
  }
};


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
    const { category, value, metadata } = req.body;
    
    if (!category || !value) {
      return res.status(400).json({ success: false, message: 'Category dan value harus diisi' });
    }

    const existing = await prisma.masterData.findUnique({
      where: {
        category_value: { category, value }
      }
    });

    if (existing) {
      if (category === 'OVERVIEW_BUDIDAYA') {
        const updated = await prisma.masterData.update({
          where: { id: existing.id },
          data: { metadata: metadata || null }
        });
        return res.status(200).json({ success: true, data: updated, message: 'Master data overview berhasil diperbarui' });
      }
      return res.status(400).json({ success: false, message: 'Data ini sudah ada dalam kategori tersebut' });
    }

    const normalizedMetadata = normalizeMasterMetadata(category, metadata);
    if (category === 'KABUPATEN_KOTA') {
      await ensureUniqueRegionId(normalizedMetadata.id_wilayah);
    }

    const newData = await prisma.masterData.create({
      data: { category, value, metadata: normalizedMetadata }
    });

    res.status(201).json({ success: true, data: newData, message: 'Master data berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating master data:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Gagal menambah master data' });
  }
};

const updateMasterData = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, value, metadata } = req.body;

    if (!category || !value) {
      return res.status(400).json({ success: false, message: 'Category dan value harus diisi' });
    }

    // Cek apakah ada konflik dengan data lain
    const existing = await prisma.masterData.findFirst({
      where: {
        category,
        value,
        id: { not: parseInt(id) }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Nilai ini sudah ada dalam kategori tersebut' });
    }

    const parsedId = parseInt(id);
    const normalizedMetadata = normalizeMasterMetadata(category, metadata);
    if (category === 'KABUPATEN_KOTA') {
      await ensureUniqueRegionId(normalizedMetadata.id_wilayah, parsedId);
    }

    const updatedData = await prisma.masterData.update({
      where: { id: parsedId },
      data: { category, value, metadata: normalizedMetadata }
    });

    res.status(200).json({ success: true, data: updatedData, message: 'Master data berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating master data:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Gagal memperbarui master data' });
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
  updateMasterData,
  deleteMasterData
};
