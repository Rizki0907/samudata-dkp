const prisma = require('../utils/prisma');

const getOverviewStats = async (req, res) => {
  try {
    // === 1. PERIKANAN TANGKAP ===
    // Mengambil total volume produksi (dari DetailTangkapan) dan jumlah pendaratan unik (PerikananTangkap)
    const tangkapVolume = await prisma.detailTangkapan.aggregate({
      _sum: { volume: true },
      where: { perikananTangkap: { status: 'APPROVED' } }
    });

    const tangkapTrip = await prisma.perikananTangkap.aggregate({
      _count: { id: true },
      where: { status: 'APPROVED' }
    });

    // Menghitung jumlah pelabuhan unik yang sudah ada datanya
    const pelabuhanDistinct = await prisma.perikananTangkap.findMany({
      where: { status: 'APPROVED' },
      select: { pelabuhan: true },
      distinct: ['pelabuhan']
    });

    const tangkap = {
      produksi: tangkapVolume._sum.volume || 0,
      kapal: tangkapTrip._count.id || 0, // Asumsi 1 id/trip = 1 unit kapal untuk sementara
      pelabuhan: pelabuhanDistinct.length || 0,
      nelayan: 0 // Tidak ada data nelayan di skema saat ini
    };

    // === 2. PERIKANAN BUDIDAYA ===
    const budidayaStats = await prisma.budidaya.aggregate({
      where: { status: 'APPROVED' },
      _sum: { produksi_kg: true },
      _count: { id: true }
    });

    const budidaya = {
      produksi: budidayaStats._sum.produksi_kg || 0, // Dalam KG
      pembudidaya: budidayaStats._count.id || 0 // Asumsi jumlah titik/laporan
    };

    // === 3. EKSPOR (Pengolahan & Pemasaran) ===
    const eksporStats = await prisma.ekspor.aggregate({
      where: { status: 'APPROVED' },
      _sum: { volume: true, nilai_usd: true }
    });

    const negaraDistinct = await prisma.ekspor.findMany({
      where: { status: 'APPROVED' },
      select: { negara_tujuan: true },
      distinct: ['negara_tujuan']
    });

    const pemasaran = {
      ekspor_volume: eksporStats._sum.volume || 0,
      ekspor_nilai: eksporStats._sum.nilai_usd || 0,
      negara_tujuan: negaraDistinct.length || 0,
      pengolahan: 0,
      produk: 0
    };

    // === 4. GARAM (Kelautan & Pesisir) ===
    const garam = {
      produksi: 0,
      petambak: 0
    };

    res.status(200).json({
      success: true,
      data: {
        tangkap,
        budidaya,
        pemasaran,
        garam
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
