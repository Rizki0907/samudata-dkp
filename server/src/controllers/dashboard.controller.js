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
    const currentYear = new Date().getFullYear();

    // Enforce N-1 logic for public users
    if (!isAdmin && tahun && tahun !== 'Semua' && parseInt(tahun) >= currentYear) {
      // If a public user tries to query the current year or later, return empty early
      return res.status(200).json({
        success: true,
        data: {
          tangkap: { produksi: null, kapal: null, pelabuhan: null, nelayan: null },
          budidaya: { produksi: null, pembudidaya: null, top_komoditas: '-', luas_lahan: null, tahun_overview: null },
          pemasaran: { unit_pengolahan: null, unit_pemasaran: null, produk_pengolahan_ton: null, produk_pemasaran_ton: null, tahun_overview: null, total_unit_usaha: 0, total_produksi_kg: 0, total_nilai_produksi_rp: 0, total_pemasaran_kg: 0 },
          garam: { produksi: null, petambak: null, luas_lahan: null },
          ekspor: { volume_ton: null, nilai_usd: null },
          kim: { total_konsumsi: null },
          availableYears: []
        }
      });
    }

    // Helper for non-admin requests when 'Semua' is selected to enforce < currentYear
    const getOverviewWhere = (category) => {
      const where = { category };
      if (tahun && tahun !== 'Semua') {
        where.value = String(tahun);
      } else if (!isAdmin) {
        where.value = { lt: String(currentYear) };
      }
      return where;
    };

    // === 1. PERIKANAN TANGKAP ===
    const tangkapOverviewWhere = getOverviewWhere('OVERVIEW_TANGKAP');
    const tangkapOverview = await prisma.masterData.findFirst({
      where: tangkapOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const tangkap = {
      produksi: tangkapOverview?.metadata?.produksi_tangkap !== undefined && tangkapOverview?.metadata?.produksi_tangkap !== '' ? Number(tangkapOverview.metadata.produksi_tangkap) : null,
      kapal: tangkapOverview?.metadata?.kapal_perikanan !== undefined && tangkapOverview?.metadata?.kapal_perikanan !== '' ? Number(tangkapOverview.metadata.kapal_perikanan) : null,
      pelabuhan: tangkapOverview?.metadata?.pelabuhan !== undefined && tangkapOverview?.metadata?.pelabuhan !== '' ? Number(tangkapOverview.metadata.pelabuhan) : null,
      nelayan: tangkapOverview?.metadata?.nelayan !== undefined && tangkapOverview?.metadata?.nelayan !== '' ? Number(tangkapOverview.metadata.nelayan) : null
    };

    // === 2. PERIKANAN BUDIDAYA ===
    // (Tidak ada agregasi otomatis)

    const budidayaOverviewWhere = getOverviewWhere('OVERVIEW_BUDIDAYA');

    const budidayaOverview = await prisma.masterData.findFirst({
      where: budidayaOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const budidaya = {
      produksi: budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.produksi_budidaya !== undefined && budidayaOverview.metadata.produksi_budidaya !== "" ? Number(budidayaOverview.metadata.produksi_budidaya) : null,
      pembudidaya: budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.jumlah_pembudidaya !== undefined && budidayaOverview.metadata.jumlah_pembudidaya !== "" ? Number(budidayaOverview.metadata.jumlah_pembudidaya) : null,
      top_komoditas: (budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.komoditas_unggulan) ? budidayaOverview.metadata.komoditas_unggulan : '-',
      luas_lahan: budidayaOverview && budidayaOverview.metadata && budidayaOverview.metadata.luas_lahan !== undefined && budidayaOverview.metadata.luas_lahan !== "" ? Number(budidayaOverview.metadata.luas_lahan) : null,
      tahun_overview: budidayaOverview ? budidayaOverview.value : null
    };

    // === 3. PENGOLAHAN & PEMASARAN ===
    const pemasaranOverviewWhere = getOverviewWhere('OVERVIEW_PEMASARAN');
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
    // (Tidak ada agregasi otomatis)

    const kelautanOverviewWhere = getOverviewWhere('OVERVIEW_KELAUTAN');
    const kelautanOverview = await prisma.masterData.findFirst({
      where: kelautanOverviewWhere,
      orderBy: { value: 'desc' }
    });



    const garam = {
      produksi: (kelautanOverview && kelautanOverview.metadata && kelautanOverview.metadata.produksi_garam !== undefined && kelautanOverview.metadata.produksi_garam !== "") 
        ? Number(kelautanOverview.metadata.produksi_garam) 
        : null,
      petambak: (kelautanOverview && kelautanOverview.metadata && kelautanOverview.metadata.jumlah_petambak !== undefined && kelautanOverview.metadata.jumlah_petambak !== "") 
        ? Number(kelautanOverview.metadata.jumlah_petambak) 
        : null,
      luas_lahan: (kelautanOverview && kelautanOverview.metadata && kelautanOverview.metadata.luas_lahan_garam !== undefined && kelautanOverview.metadata.luas_lahan_garam !== "") 
        ? Number(kelautanOverview.metadata.luas_lahan_garam) 
        : null
    };

    // === 5. EKSPOR PERIKANAN ===
    // (Tidak ada agregasi otomatis)

    const eksporOverviewWhere = getOverviewWhere('OVERVIEW_EKSPOR');
    const eksporOverview = await prisma.masterData.findFirst({
      where: eksporOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const ekspor = {
      volume_ton: (eksporOverview && eksporOverview.metadata && eksporOverview.metadata.volume_ton !== undefined && eksporOverview.metadata.volume_ton !== "") 
        ? Number(eksporOverview.metadata.volume_ton) 
        : null,
      nilai_usd: (eksporOverview && eksporOverview.metadata && eksporOverview.metadata.nilai_usd !== undefined && eksporOverview.metadata.nilai_usd !== "") 
        ? Number(eksporOverview.metadata.nilai_usd) 
        : null
    };

    // === 6. KONSUMSI IKAN MASYARAKAT (KIM) ===
    const kimOverviewWhere = getOverviewWhere('OVERVIEW_KIM');
    const kimOverview = await prisma.masterData.findFirst({
      where: kimOverviewWhere,
      orderBy: { value: 'desc' }
    });

    const kim = {
      total_konsumsi: (kimOverview && kimOverview.metadata && kimOverview.metadata.total_konsumsi !== undefined && kimOverview.metadata.total_konsumsi !== "") ? Number(kimOverview.metadata.total_konsumsi) : null
    };

    // === AVAILABLE YEARS ===
    const allOverview = await prisma.masterData.findMany({
      where: { category: { startsWith: 'OVERVIEW_' } },
      select: { value: true }
    });
    let uniqueYearsSet = new Set(allOverview.map(item => Number(item.value)));
    if (!isAdmin) {
      uniqueYearsSet = new Set([...uniqueYearsSet].filter(y => y < currentYear));
    }
    const availableYears = Array.from(uniqueYearsSet).sort((a, b) => b - a).map(String);

    res.status(200).json({
      success: true,
      data: {
        tangkap,
        budidaya,
        pemasaran,
        garam,
        ekspor,
        kim,
        availableYears
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
