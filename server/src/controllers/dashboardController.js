const prisma = require('../utils/prisma');

const getOverviewStats = async (req, res) => {
  try {
    // === 1. PERIKANAN TANGKAP ===
    // Mengambil total volume produksi dan jumlah pendaratan unik (sebagai pendekatan jumlah kapal)
    const tangkapStats = await prisma.perikananTangkap.aggregate({
      _sum: { volume: true },
      _count: { id: true }
    });

    // Menghitung jumlah pelabuhan unik yang sudah ada datanya
    const pelabuhanDistinct = await prisma.perikananTangkap.findMany({
      select: { pelabuhan: true },
      distinct: ['pelabuhan']
    });

    const tangkap = {
      produksi: tangkapStats._sum.volume || 0,
      kapal: tangkapStats._count.id || 0, // Asumsi 1 id/trip = 1 unit kapal untuk sementara
      pelabuhan: pelabuhanDistinct.length || 0,
      nelayan: 0 // Tidak ada data nelayan di skema saat ini
    };

    // === 2. PERIKANAN BUDIDAYA (Data Kosong Sementara) ===
    const budidaya = {
      produksi: 0,
      pembudidaya: 0
    };

    // === 3. PENGOLAHAN (Data Kosong Sementara) ===
    const pemasaran = {
      pemasar: 0,
      pengolahan: 0,
      produk: 0
    };

    // === 4. GARAM (Data Kosong Sementara) ===
    const garam = {
      produksi: 0,
      petambak: 0
    };

    // === 5. KELAUTAN & PESISIR (Data Kosong Sementara) ===
    const kelautan = {
      konservasi: 0,
      pulau: 0
    };

    // === 6. EKSPOR (Data Kosong Sementara) ===
    const ekspor = {
      volume: 0,
      nilai: 0
    };

    res.status(200).json({
      success: true,
      data: {
        tangkap,
        budidaya,
        pemasaran,
        garam,
        kelautan,
        ekspor
      }
    });
  } catch (error) {
    console.error('Error in getOverviewStats:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data overview' });
  }
};

module.exports = {
  getOverviewStats
};
