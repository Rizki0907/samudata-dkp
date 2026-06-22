import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Ship, Fish, Package, Droplets, Map, Globe, Loader2 } from 'lucide-react';

// Import Assets
import oceanBg from '@/assets/ocean_bg.png';
import logoDKP from '@/assets/logo_DKP.png';
import iconDKP from '@/assets/icon_DKP.png';
import imgFisherman from '@/assets/fisherman.png';
import imgTambak from '@/assets/tambak.png';

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tangkap: { produksi: 0 },
    budidaya: { produksi: 0, pembudidaya: 0 },
    pemasaran: { pemasar: 0, pengolahan: 0, produk: 0 },
    garam: { produksi: 0, petambak: 0 },
    kelautan: { konservasi: 0, pulau: 0 },
    ekspor: { volume: 0, nilai: 0 }
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

      {/* Main Data Section - 2 Column Clean Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Card 1: Perikanan Tangkap */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Ship className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Perikanan Tangkap</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Produksi (Kg)</p>
              <p className="text-3xl font-extrabold text-foreground">{stats.tangkap.produksi.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Kapal (Unit)</p>
              <p className="text-3xl font-extrabold text-foreground">52.211</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Pelabuhan</p>
              <p className="text-3xl font-extrabold text-foreground">22</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Nelayan (Orang)</p>
              <p className="text-3xl font-extrabold text-foreground">217.209</p>
            </div>
          </div>
        </div>

        {/* Card 2: Perikanan Budidaya */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Fish className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Perikanan Budidaya</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Produksi (Kg)</p>
              <p className="text-3xl font-extrabold text-foreground">{stats.budidaya.produksi.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Pembudidaya</p>
              <p className="text-3xl font-extrabold text-foreground">159.981</p>
            </div>
          </div>
        </div>

        {/* Card 3: Pengolahan & Pemasaran */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all xl:row-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pengolahan & Pemasaran</h2>
          </div>
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Unit Pengolahan</p>
              <p className="text-3xl font-extrabold text-foreground">10.841</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Produk Olahan (Ton)</p>
              <p className="text-3xl font-extrabold text-foreground">1.163.182</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Unit Pemasar</p>
              <p className="text-3xl font-extrabold text-foreground">21.579</p>
            </div>
          </div>
        </div>

        {/* Card 4: Garam */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-slate-500/50 hover:shadow-xl hover:shadow-slate-500/5 transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-500/10 text-slate-500 rounded-2xl">
              <Droplets className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Potensi Garam</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Produksi (Ton)</p>
              <p className="text-3xl font-extrabold text-foreground">329.102</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Petambak</p>
              <p className="text-3xl font-extrabold text-foreground">6.831</p>
            </div>
          </div>
        </div>

        {/* Card 5: Kelautan & Pesisir */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl">
              <Map className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kelautan & Pesisir</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Konservasi</p>
              <p className="text-3xl font-extrabold text-foreground">{stats.kelautan.konservasi}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Pulau Kecil</p>
              <p className="text-3xl font-extrabold text-foreground">504</p>
            </div>
          </div>
        </div>

        {/* Card 6: Ekspor */}
        <div className="bg-card border border-border rounded-3xl p-8 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all xl:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Kinerja Ekspor</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Volume (Ton)</p>
              <p className="text-3xl font-extrabold text-foreground">356.491</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Nilai Ekspor</p>
              <p className="text-3xl font-extrabold text-foreground">{stats.ekspor.nilai || 0}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Visual / Highlights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
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
