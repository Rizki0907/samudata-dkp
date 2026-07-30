const prisma = require('../utils/prisma');

const getOverviewStats = async (req, res) => {
  try {
    const { tahun } = req.query;

    // === 1. PERIKANAN TANGKAP ===
    const tangkapWhere = { status: 'VERIFIED' };
    if (tahun && tahun !== 'Semua') {
      tangkapWhere.tanggal = {
        gte: new Date(`${tahun}-01-01T00:00:00.000Z`),
        lte: new Date(`${tahun}-12-31T23:59:59.999Z`)
      };
    }

    const tangkapVolume = await prisma.detailTangkapan.aggregate({
      where: {
        perikananTangkap: tangkapWhere
      },
      _sum: { volume: true }
    });

    const tangkapTrip = await prisma.perikananTangkap.aggregate({
      _count: { id: true },
      where: tangkapWhere
    });

    const pelabuhanDistinct = await prisma.perikananTangkap.findMany({
      where: tangkapWhere,
      select: { pelabuhan: true },
      distinct: ['pelabuhan']
    });

    const tangkap = {
      produksi: tangkapVolume._sum.volume || 0,
      kapal: tangkapTrip._count.id || 0,
      pelabuhan: pelabuhanDistinct.length || 0,
      nelayan: 0
    };

    // === 2. PERIKANAN BUDIDAYA ===
    const budidayaWhere = { status: 'VERIFIED' };
    if (tahun && tahun !== 'Semua') {
      budidayaWhere.tahun = String(tahun);
    }

    const budidayaStats = await prisma.budidaya.aggregate({
      where: budidayaWhere,
      _sum: { produksi_kg: true },
      _count: { id: true }
    });

    const budidayaOverviewWhere = { category: 'OVERVIEW_BUDIDAYA' };
    if (tahun && tahun !== 'Semua') {
      budidayaOverviewWhere.value = String(tahun);
    }

    const budidayaOverview = await prisma.masterData.findFirst({
      where: budidayaOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const budidaya = {
      produksi: budidayaStats._sum.produksi_kg || 0, // Dalam KG
      pembudidaya: budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.jumlah_pembudidaya !== undefined && budidayaOverview.metadata.jumlah_pembudidaya !== "" ? Number(budidayaOverview.metadata.jumlah_pembudidaya) : null,
      top_komoditas: (budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.komoditas_unggulan) ? budidayaOverview.metadata.komoditas_unggulan : '-',
      luas_lahan: budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.luas_lahan !== undefined && budidayaOverview.metadata.luas_lahan !== "" ? Number(budidayaOverview.metadata.luas_lahan) : null,
      tahun_overview: budidayaOverview ? budidayaOverview.value : null
    };

    // === 3. PENGOLAHAN & PEMASARAN ===
    const pemasaranWhere = { status: 'VERIFIED' };
    if (tahun && tahun !== 'Semua') {
      pemasaranWhere.tahun = Number(tahun);
    }

    const pengolahanAgg = await prisma.pengolahanPemasaran.aggregate({
      where: pemasaranWhere,
      _count: { id: true },
      _sum: {
        hasil_produksi_per_tahun_kg: true,
        nilai_hasil_produksi_per_tahun_rp: true,
        total_pemasaran_per_tahun_kg: true
      }
    });

    const pemasaran = {
      total_unit_usaha: pengolahanAgg._count.id || 0,
      total_produksi_kg: pengolahanAgg._sum.hasil_produksi_per_tahun_kg || 0,
      total_nilai_produksi_rp: pengolahanAgg._sum.nilai_hasil_produksi_per_tahun_rp || 0,
      total_pemasaran_kg: pengolahanAgg._sum.total_pemasaran_per_tahun_kg || 0
    };

    // === 4. GARAM (Kelautan & Pesisir) ===
    const garamWhere = { status: 'VERIFIED' };
    if (tahun && tahun !== 'Semua') {
      garamWhere.tahun = Number(tahun);
    }

    const allGaram = await prisma.garam.findMany({
      where: garamWhere,
      orderBy: { created_at: 'desc' }
    });

    let totalGaramProduksi = 0;
    let totalGaramPetambak = 0;
    let totalGaramLuas = 0;
    const seenGaramKabKota = new Set();

    for (const g of allGaram) {
      totalGaramProduksi += g.total_produksi_ton || 0;
      if (!seenGaramKabKota.has(g.kabupaten_kota)) {
        seenGaramKabKota.add(g.kabupaten_kota);
        totalGaramPetambak += g.jumlah_petambak || 0;
        totalGaramLuas += g.luas_total_ha || 0;
      }
    }

    const garam = {
      produksi: totalGaramProduksi,
      petambak: totalGaramPetambak,
      luas_lahan: totalGaramLuas
    };

    // === 5. EKSPOR PERIKANAN ===
    const eksporWhere = {
      status: 'VERIFIED',
      satuan_volume: {
        in: ['Kilogram', 'KG', 'kg', 'Kg', 'KILOGRAM', 'kilogram']
      }
    };
    if (tahun && tahun !== 'Semua') {
      eksporWhere.tahun = String(tahun);
    }

    const eksporAgg = await prisma.ekspor.aggregate({
      where: eksporWhere,
      _sum: {
        volume: true,
        nilai_usd: true
      }
    });

    // Volume pada DB disimpan dalam KG, konversikan ke Ton maksimal 2 angka di belakang koma
    const eksporVolumeKg = eksporAgg._sum.volume || 0;
    const eksporVolumeTon = Number((eksporVolumeKg / 1000).toFixed(2));
    const eksporNilaiUsd = Number((eksporAgg._sum.nilai_usd || 0).toFixed(2));

    const ekspor = {
      volume_ton: eksporVolumeTon,
      nilai_usd: eksporNilaiUsd
    };

    // === 6. KONSUMSI IKAN MASYARAKAT (KIM) ===
    const kim = {
      total_konsumsi: '-'
    };

    res.status(200).json({
      success: true,
      data: {
        tangkap,
        budidaya,
        pemasaran,
        garam,
        ekspor,
        kim
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
