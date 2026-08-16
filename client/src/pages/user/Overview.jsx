import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
// eslint-disable-next-line no-unused-vars
import { Ship, Fish, Package, Droplets, Loader2, Globe, Utensils, Filter, Waves } from 'lucide-react';
import { formatUangPendek } from '@/utils/formatRupiah';

// Import Assets
import oceanBg from '@/assets/ocean_bg.png';
import logoDKP from '@/assets/logo_DKP.png';
import iconDKP from '@/assets/icon_DKP.png';
import imgLaut from '@/assets/laut.jpg';
import imgKapal from '@/assets/kapal.jpg';



// Format angka: kosong/null/undefined/0 (angka atau string "0") -> "-"
const fmt = (value, opts = {}) => {
  if (value === null || value === undefined || value === '' || Number(value) === 0 || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toLocaleString('id-ID', opts);
};

export default function Overview() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [loading, setLoading] = useState(true);
  const [selectedTahun, setSelectedTahun] = useState(
    isAdminRoute ? new Date().getFullYear().toString() : (new Date().getFullYear() - 1).toString()
  );
  const [tahunOptions, setTahunOptions] = useState([]);
  const [stats, setStats] = useState({
    tangkap: { produksi: 0, kapal: 0, pelabuhan: 0, nelayan: 0 },
    budidaya: { produksi: 0, pembudidaya: null, top_komoditas: '-', luas_lahan: null },
    pemasaran: { unit_pengolahan: null, unit_pemasaran: null, produk_pengolahan_ton: null, produk_pemasaran_ton: null, total_unit_usaha: 0, total_produksi_kg: 0, total_nilai_produksi_rp: 0, total_pemasaran_kg: 0 },
    garam: { produksi: 0, petambak: 0, luas_lahan: 0 },
    ekspor: { volume_ton: 0, nilai_usd: 0 },
    kim: { total_konsumsi: null }
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/overview', {
          params: {
            tahun: selectedTahun === 'Semua' ? '' : selectedTahun,
            admin: isAdminRoute ? 'true' : 'false'
          }
        });
        if (res.data.success) {
          setStats(res.data.data);
          if (res.data.data.availableYears?.length > 0) {
            // Apply n-1 rule (only show years <= maxYear)
            const maxYearStr = (new Date().getFullYear() - 1).toString();
            const validYears = res.data.data.availableYears.filter(y => Number(y) <= Number(maxYearStr));
            
            setTahunOptions(validYears);
            if (validYears.length > 0 && !validYears.includes(selectedTahun)) {
              // If current selected year is not in available years, switch to the latest available year
              setSelectedTahun(validYears[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch overview stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTahun, location.pathname]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Dashboard Overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* Hero Section */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-border">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${oceanBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 to-cyan-900/80" />

        <div className="relative z-10 p-8 md:p-14 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-1 mb-5">
            <img src={iconDKP} alt="Icon DKP" className="h-24 drop-shadow-lg" />
            <div className="h-18 w-px bg-white/30" />
            <img src={logoDKP} alt="Logo DKP Jatim" className="h-16 drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6 tracking-tight">
            Potensi Kelautan dan Perikanan<br />
            <span className="text-cyan-300">Provinsi Jawa Timur</span>
          </h1>
          <p className="text-blue-100 max-w-4xl text-base md:text-lg leading-relaxed">
            Provinsi Jawa Timur dengan <b className="text-white">panjang garis pantai 3.543,54 km
              luas laut 5.202.579,34 Ha</b> memiliki potensi sumber daya kelautan dan perikanan melimpah
            yang tersebar di <b className="text-white">38 Kab/Kota</b>, pesisir, Pulau Madura, serta pulau-pulau kecil lainnya.
          </p>
        </div>
      </div>

      {/* Filter Tahun Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border p-4 px-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">Filter Data</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="filter-tahun-overview"
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="px-4 pr-10 py-2 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-[140px] appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
          >
            {tahunOptions.length > 0 ? (
              tahunOptions.map((th) => (
                <option key={th} value={th}>{th}</option>
              ))
            ) : (
              <option value={selectedTahun}>{selectedTahun}</option>
            )}
          </select>
        </div>
      </div>

      {/* Bento Grid 2-Column Layout (V1 Style with Inner Boxes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Perikanan Tangkap */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Ship className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Perikanan Tangkap</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Tangkap</p>
              <p className="text-2xl font-bold text-blue-600">
                {fmt(stats.tangkap.produksi)}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Kapal Perikanan</p>
              <p className="text-2xl font-bold text-blue-600">
                {fmt(stats.tangkap.kapal)}
                <span className="text-sm font-normal text-muted-foreground"> Unit</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Pelabuhan</p>
              <p className="text-2xl font-bold text-blue-600">
                {fmt(stats.tangkap.pelabuhan)}
                <span className="text-sm font-normal text-muted-foreground"> Unit</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Nelayan</p>
              <p className="text-2xl font-bold text-blue-600">
                {fmt(stats.tangkap.nelayan)}
                <span className="text-sm font-normal text-muted-foreground"> Orang</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Perikanan Budidaya */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Fish className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Perikanan Budidaya</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Budidaya</p>
              <p className="text-2xl font-bold text-emerald-600 truncate" title={fmt(stats.budidaya.produksi, { maximumFractionDigits: 2 })}>
                {fmt(stats.budidaya.produksi, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Komoditas Unggulan</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate" title={stats.budidaya.top_komoditas || '-'}>
                {stats.budidaya.top_komoditas || '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Pembudidaya</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate" title={fmt(stats.budidaya.pembudidaya)}>
                {fmt(stats.budidaya.pembudidaya)}
                <span className="text-sm font-normal text-muted-foreground"> Orang</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Luas Lahan</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate" title={fmt(stats.budidaya.luas_lahan, { maximumFractionDigits: 2 })}>
                {fmt(stats.budidaya.luas_lahan, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ha</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Pengolahan & Pemasaran */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pengolahan dan Pemasaran</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Unit Pengolahan</p>
              <p className="text-2xl font-bold text-orange-600">
                {fmt(stats.pemasaran?.unit_pengolahan)}
                <span className="text-sm font-normal text-muted-foreground"> Unit</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Unit Pemasaran</p>
              <p className="text-2xl font-bold text-orange-600">
                {fmt(stats.pemasaran?.unit_pemasaran)}
                <span className="text-sm font-normal text-muted-foreground"> Unit</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Produk Pengolahan</p>
              <p className="text-2xl font-bold text-orange-600">
                {fmt(stats.pemasaran?.produk_pengolahan_ton, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Produk Pemasaran</p>
              <p className="text-2xl font-bold text-orange-600">
                {fmt(stats.pemasaran?.produk_pemasaran_ton, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Garam */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <Waves className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Garam</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Garam</p>
              <p className="text-2xl font-bold text-red-600 truncate">
                {fmt(stats.garam?.produksi, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Petambak</p>
              <p className="text-2xl font-bold text-red-600 truncate">
                {fmt(stats.garam?.petambak)}
                <span className="text-sm font-normal text-muted-foreground"> Orang</span>
              </p>
            </div>
            <div className="col-span-2 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Luas Lahan Garam</p>
              <p className="text-2xl font-bold text-red-600 truncate">
                {fmt(stats.garam?.luas_lahan, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ha</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 5: Ekspor (Kiri Bawah) */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Ekspor</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-1">Volume Ekspor</p>
              <p className="text-2xl font-bold text-purple-600">
                {fmt(stats.ekspor?.volume_ton, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-1">Nilai Ekspor</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.ekspor?.nilai_usd && Number(stats.ekspor.nilai_usd) !== 0 ? (
                  (() => {
                    const formatted = formatUangPendek(stats.ekspor.nilai_usd);
                    const parts = formatted.split(' ');
                    return <>{`$${parts[0]}`} {parts.length > 1 && <span className="text-sm font-normal text-muted-foreground">{parts.slice(1).join(' ')}</span>}</>;
                  })()
                ) : '-'}
                <span className="text-sm font-normal text-muted-foreground"> USD</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 6: Konsumsi Ikan Masyarakat / KIM (Kanan Bawah) */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Konsumsi Ikan Masyarakat (KIM)</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-1">Total Konsumsi Ikan</p>
              <p className="text-2xl font-bold text-amber-600">
                {fmt(stats.kim?.total_konsumsi, { maximumFractionDigits: 2 })}
                <span className="text-sm font-normal text-muted-foreground"> Ton</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Visual / Highlights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
        {/* Special Card 1: Laut Jatim */}
        <div className="rounded-3xl overflow-hidden relative group border border-border min-h-[350px] shadow-lg">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgLaut})` }} />
          <div className="absolute bottom-0 left-0 p-8">
          </div>
        </div>

        {/* Special Card 2: Kapal */}
        <div className="rounded-3xl overflow-hidden relative group border border-border min-h-[350px] shadow-lg">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgKapal})` }} />
          <div className="absolute bottom-0 left-0 p-8">
          </div>
        </div>
      </div>

    </div>
  );
}