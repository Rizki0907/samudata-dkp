import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/services/api';
import { Ship, Fish, Package, Droplets, Loader2, Globe, Utensils, Filter, Waves } from 'lucide-react';

// Import Assets
import oceanBg from '@/assets/ocean_bg.png';
import logoDKP from '@/assets/logo_DKP.png';
import iconDKP from '@/assets/icon_DKP.png';
import imgFisherman from '@/assets/fisherman.png';
import imgTambak from '@/assets/tambak.png';

const currentYear = new Date().getFullYear();
const maxYear = currentYear - 1;
// Generate 10 years ending at maxYear
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (maxYear - 9 + i).toString());

export default function Overview() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [loading, setLoading] = useState(true);
  const [selectedTahun, setSelectedTahun] = useState(maxYear.toString());
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
        }
      } catch (error) {
        console.error('Failed to fetch overview stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
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
            <img src={iconDKP} alt="Icon DKP" className="h-22 md:h-32 drop-shadow-lg" />
            <div className="h-18 w-px bg-white/30" />
            <img src={logoDKP} alt="Logo DKP Jatim" className="h-16 md:h-20 drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6 tracking-tight">
            Potensi Kelautan dan Perikanan<br/>
            <span className="text-cyan-300">Provinsi Jawa Timur</span>
          </h1>
          <p className="text-blue-100 max-w-4xl text-base md:text-lg leading-relaxed">
            Provinsi Jawa Timur dengan <b className="text-white">panjang garis pantai 3.543,54 km
            luas laut 5.202.579,34 Ha</b> memiliki potensi sumber daya kelautan dan perikanan melimpah 
            yang tersebar di <b className="text-white">38 kabupaten/kota</b>, pesisir, Pulau Madura, serta pulau-pulau kecil lainnya.
          </p>
        </div>
      </div>

      {/* Filter Tahun Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border p-4 px-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">Filter Data Potensi Perikanan:</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="filter-tahun-overview"
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-[140px]"
          >
            {TAHUN_OPTIONS.map((th) => (
              <option key={th} value={th}>{th}</option>
            ))}
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
              <p className="text-sm text-muted-foreground mb-1">Produksi Tangkap (Ton)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.tangkap.produksi?.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Kapal Perikanan (Unit)</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.tangkap.kapal !== undefined && stats.tangkap.kapal !== null ? Number(stats.tangkap.kapal).toLocaleString('id-ID') : '52.211'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Pelabuhan (Unit)</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.tangkap.pelabuhan !== undefined && stats.tangkap.pelabuhan !== null ? Number(stats.tangkap.pelabuhan).toLocaleString('id-ID') : '22'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Nelayan (Orang)</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.tangkap.nelayan !== undefined && stats.tangkap.nelayan !== null ? Number(stats.tangkap.nelayan).toLocaleString('id-ID') : '217.209'}
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
              <p className="text-sm text-muted-foreground mb-1">Produksi Budidaya (Ton)</p>
              <p className="text-2xl font-bold text-emerald-600 truncate" title={((stats.budidaya.produksi || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}>
                {((stats.budidaya.produksi || 0) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
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
              <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate" title={stats.budidaya.pembudidaya !== null && stats.budidaya.pembudidaya !== undefined ? Number(stats.budidaya.pembudidaya).toLocaleString('id-ID') : '-'}>
                {stats.budidaya.pembudidaya !== null && stats.budidaya.pembudidaya !== undefined ? Number(stats.budidaya.pembudidaya).toLocaleString('id-ID') : '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Luas Lahan (Ha)</p>
              <p className="text-xl md:text-2xl font-bold text-emerald-600 truncate" title={stats.budidaya.luas_lahan !== null && stats.budidaya.luas_lahan !== undefined ? Number(stats.budidaya.luas_lahan).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}>
                {stats.budidaya.luas_lahan !== null && stats.budidaya.luas_lahan !== undefined ? Number(stats.budidaya.luas_lahan).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
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
              <p className="text-sm text-muted-foreground mb-1">Jumlah Unit Pengolahan (Unit)</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pemasaran?.unit_pengolahan !== null && stats.pemasaran?.unit_pengolahan !== undefined && stats.pemasaran?.unit_pengolahan !== '' ? Number(stats.pemasaran.unit_pengolahan).toLocaleString('id-ID') : '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Unit Pemasaran (Unit)</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pemasaran?.unit_pemasaran !== null && stats.pemasaran?.unit_pemasaran !== undefined && stats.pemasaran?.unit_pemasaran !== '' ? Number(stats.pemasaran.unit_pemasaran).toLocaleString('id-ID') : '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Produk Pengolahan (Ton)</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pemasaran?.produk_pengolahan_ton !== null && stats.pemasaran?.produk_pengolahan_ton !== undefined && stats.pemasaran?.produk_pengolahan_ton !== '' ? Number(stats.pemasaran.produk_pengolahan_ton).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Produk Pemasaran (Ton)</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pemasaran?.produk_pemasaran_ton !== null && stats.pemasaran?.produk_pemasaran_ton !== undefined && stats.pemasaran?.produk_pemasaran_ton !== '' ? Number(stats.pemasaran.produk_pemasaran_ton).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
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
              <p className="text-sm text-muted-foreground mb-1">Produksi Garam (Ton)</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.garam?.produksi !== null && stats.garam?.produksi !== undefined ? Number(stats.garam.produksi).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Jumlah Petambak (Orang)</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.garam?.petambak !== null && stats.garam?.petambak !== undefined ? Number(stats.garam.petambak).toLocaleString('id-ID') : '-'}
              </p>
            </div>
            <div className="col-span-2 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Luas Lahan Garam (Ha)</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.garam?.luas_lahan !== null && stats.garam?.luas_lahan !== undefined ? Number(stats.garam.luas_lahan).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}
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
              <p className="text-sm text-muted-foreground mb-1">Volume Ekspor (Ton)</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.ekspor?.volume_ton ? Number(stats.ekspor.volume_ton).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0'}
              </p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-1">Nilai Ekspor (USD)</p>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.ekspor?.nilai_usd ? Number(stats.ekspor.nilai_usd).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0'}
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
              <p className="text-sm text-muted-foreground mb-1">Total Konsumsi Ikan (Ton)</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.kim?.total_konsumsi !== null && stats.kim?.total_konsumsi !== undefined && stats.kim?.total_konsumsi !== '' && stats.kim?.total_konsumsi !== '-'
                  ? Number(stats.kim.total_konsumsi).toLocaleString('id-ID', { maximumFractionDigits: 2 })
                  : '-'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Visual / Highlights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
        {/* Special Card 1: Fisherman Illustration */}
        <div className="rounded-3xl overflow-hidden relative group border border-border min-h-[300px] shadow-lg">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgFisherman})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h3 className="text-white font-bold text-2xl mb-2">Mengoptimalkan Kekayaan Nusantara</h3>
            <p className="text-blue-200 text-base opacity-90 max-w-sm">Sinergi nelayan dan modernisasi data untuk memastikan hasil tangkapan yang maksimal.</p>
          </div>
        </div>

        {/* Special Card 2: Tambak Illustration */}
        <div className="rounded-3xl overflow-hidden relative group border border-border min-h-[300px] shadow-lg">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgTambak})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h3 className="text-white font-bold text-2xl mb-2">Budidaya Berkelanjutan</h3>
            <p className="text-emerald-200 text-base opacity-90 max-w-sm">Menjaga keseimbangan ekosistem pesisir demi ekonomi perikanan masa depan.</p>
          </div>
        </div>
      </div>

    </div>
  );
}