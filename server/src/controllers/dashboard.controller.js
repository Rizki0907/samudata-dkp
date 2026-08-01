const prisma = require('../utils/prisma');

const getOverviewStats = async (req, res) => {
  try {
    const { tahun, admin } = req.query;

    let isAdmin = false;
    if (admin === 'true') {
      isAdmin = true;
    } else if (admin === 'false') {
      isAdmin = false;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && (decoded.role === 'admin_pusat' || decoded.role === 'admin' || decoded.role)) {
            isAdmin = true;
          }
        } catch (err) {
          // Abaikan jika token tidak valid
        }
      }
    }

    const statusFilter = isAdmin ? {} : { status: 'VERIFIED' };

    // === 1. PERIKANAN TANGKAP ===
    const tangkapWhere = { ...statusFilter };
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

    const tangkapOverviewWhere = { category: 'OVERVIEW_TANGKAP' };
    if (tahun && tahun !== 'Semua') {
      tangkapOverviewWhere.value = String(tahun);
    }
    const tangkapOverview = await prisma.masterData.findFirst({
      where: tangkapOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const tangkap = {
      produksi: tangkapVolume._sum.volume || 0,
      kapal: tangkapOverview?.metadata?.kapal_perikanan !== undefined && tangkapOverview?.metadata?.kapal_perikanan !== '' ? Number(tangkapOverview.metadata.kapal_perikanan) : null,
      pelabuhan: tangkapOverview?.metadata?.pelabuhan !== undefined && tangkapOverview?.metadata?.pelabuhan !== '' ? Number(tangkapOverview.metadata.pelabuhan) : null,
      nelayan: tangkapOverview?.metadata?.nelayan !== undefined && tangkapOverview?.metadata?.nelayan !== '' ? Number(tangkapOverview.metadata.nelayan) : null
    };

    // === 2. PERIKANAN BUDIDAYA ===
    const budidayaWhere = { ...statusFilter };
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
    const pemasaranOverviewWhere = { category: 'OVERVIEW_PEMASARAN' };
    if (tahun && tahun !== 'Semua') {
      pemasaranOverviewWhere.value = String(tahun);
    }
    const pemasaranOverview = await prisma.masterData.findFirst({
      where: pemasaranOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const pemasaran = {
      unit_pengolahan: (pemasaranOverview && pemasaranOverview.metadata && pemasaranOverview.metadata.unit_pengolahan !== undefined && pemasaranOverview.metadata.unit_pengolahan !== "") ? Number(pemasaranOverview.metadata.unit_pengolahan) : null,
      unit_pemasaran: (pemasaranOverview && pemasaranOverview.metadata && pemasaranOverview.metadata.unit_pemasaran !== undefined && pemasaranOverview.metadata.unit_pemasaran !== "") ? Number(pemasaranOverview.metadata.unit_pemasaran) : null,
      produk_pengolahan_ton: (pemasaranOverview && pemasaranOverview.metadata && pemasaranOverview.metadata.produk_pengolahan_ton !== undefined && pemasaranOverview.metadata.produk_pengolahan_ton !== "") ? Number(pemasaranOverview.metadata.produk_pengolahan_ton) : null,
      produk_pemasaran_ton: (pemasaranOverview && pemasaranOverview.metadata && pemasaranOverview.metadata.produk_pemasaran_ton !== undefined && pemasaranOverview.metadata.produk_pemasaran_ton !== "") ? Number(pemasaranOverview.metadata.produk_pemasaran_ton) : null,
      tahun_overview: pemasaranOverview ? pemasaranOverview.value : null,
      // fallback lama
      total_unit_usaha: 0,
      total_produksi_kg: 0,
      total_nilai_produksi_rp: 0,
      total_pemasaran_kg: 0,
    };

    // === 4. GARAM (Kelautan & Pesisir) ===
    const garamWhere = { ...statusFilter };
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
      ...statusFilter,
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
    const kimOverviewWhere = { category: 'OVERVIEW_KIM' };
    if (tahun && tahun !== 'Semua') {
      kimOverviewWhere.value = String(tahun);
    }
    const kimOverview = await prisma.masterData.findFirst({
      where: kimOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const kim = {
      total_konsumsi: (kimOverview && kimOverview.metadata && kimOverview.metadata.total_konsumsi !== undefined && kimOverview.metadata.total_konsumsi !== "") ? Number(kimOverview.metadata.total_konsumsi) : null
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
