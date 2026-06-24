import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Ship, Fish, Package, Droplets, Loader2 } from 'lucide-react';


// Import Assets
import oceanBg from '@/assets/ocean_bg.png';
import logoDKP from '@/assets/logo_DKP.png';
import iconDKP from '@/assets/icon_DKP.png';
import imgFisherman from '@/assets/fisherman.png';
import imgTambak from '@/assets/tambak.png';

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tangkap: { produksi: 0, kapal: 0, pelabuhan: 0, nelayan: 0 },
    budidaya: { produksi: 0, pembudidaya: 0 },
    pemasaran: { ekspor_volume: 0, ekspor_nilai: 0, negara_tujuan: 0, pengolahan: 0, produk: 0 },
    garam: { produksi: 0, petambak: 0 }
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/dashboard/overview');
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
  }, []);

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
          <div className="flex items-center justify-center gap-6 mb-8">
            <img src={iconDKP} alt="Icon DKP" className="h-16 md:h-20 drop-shadow-lg" />
            <div className="h-12 w-px bg-white/30" />
            <img src={logoDKP} alt="Logo DKP Jatim" className="h-16 md:h-20 drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6 tracking-tight">
            Potensi Kelautan dan Perikanan<br/>
            <span className="text-cyan-300">Provinsi Jawa Timur</span>
          </h1>
          <p className="text-blue-100 max-w-4xl text-base md:text-lg leading-relaxed">
            Provinsi Jawa Timur dengan <b>panjang garis pantai 3.543,54 km</b> (No. 10 di Indonesia) 
            dan <b>luas laut 5.202.579,34 Ha</b> memiliki potensi sumber daya kelautan dan perikanan melimpah 
            yang tersebar di <b>38 kabupaten/kota</b>, pesisir, Pulau Madura, serta pulau-pulau kecil lainnya.
          </p>
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
            <h2 className="text-2xl font-bold text-foreground">Potensi Perikanan Tangkap</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Tangkap (Kg)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.tangkap.produksi.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Kapal Perikanan (Unit)</p>
              <p className="text-2xl font-bold text-blue-600">52.211</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Pelabuhan (Unit)</p>
              <p className="text-2xl font-bold text-blue-600">22</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Nelayan (Orang)</p>
              <p className="text-2xl font-bold text-blue-600">217.209</p>
            </div>
          </div>
        </div>

        {/* Card 2: Perikanan Budidaya */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Fish className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Potensi Perikanan Budidaya</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Budidaya (Ton)</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.budidaya.produksi.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Titik Budidaya (Laporan)</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.budidaya.pembudidaya.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Pengolahan & Pemasaran */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pengolahan & Pemasaran</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Volume Ekspor (Kg)</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pemasaran.ekspor_volume.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Nilai Ekspor (USD)</p>
              <p className="text-2xl font-bold text-orange-600">${stats.pemasaran.ekspor_nilai.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Negara Tujuan Ekspor</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pemasaran.negara_tujuan} <span className="text-base font-normal text-muted-foreground">Negara</span></p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Unit Pengolahan (UPK)</p>
              <p className="text-2xl font-bold text-orange-600">350 <span className="text-base font-normal text-muted-foreground">Unit</span></p>
            </div>
          </div>
        </div>

        {/* Card 4: Garam */}
        <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/5 border border-slate-200/50 rounded-3xl p-8 hover:shadow-lg transition-all group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-500 text-white rounded-xl shadow-lg shadow-slate-500/30 group-hover:scale-110 transition-transform">
              <Droplets className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kelautan & Pesisir</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Produksi Garam (Kg)</p>
              <p className="text-2xl font-bold text-slate-600">{stats.garam.produksi.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border">
              <p className="text-sm text-muted-foreground mb-1">Petambak Garam (Orang)</p>
              <p className="text-2xl font-bold text-slate-600">{stats.garam.petambak.toLocaleString('id-ID')}</p>
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
