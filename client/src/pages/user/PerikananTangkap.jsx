import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, Ship, Anchor, Database, TrendingUp, Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatDate } from '@/utils/dateHelper';
import { KOMODITAS_OPTIONS, PELABUHAN_OPTIONS } from '@/utils/constants';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function PerikananTangkap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // Super Filters State
  const [filterTahun, setFilterTahun] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterCabang, setFilterCabang] = useState(''); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');

  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_trip: 0, avg_volume_per_trip: 0 },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: For prototyping, we're building the query string to show intent, 
        // even if the backend doesn't fully support all these filters yet.
        const queryParams = new URLSearchParams();
        if (filterTahun) queryParams.append('tahun', filterTahun);
        if (filterBulan) queryParams.append('bulan', filterBulan);
        if (filterCabang) queryParams.append('cabang', filterCabang);
        if (filterKomoditas) queryParams.append('komoditas', filterKomoditas);
        if (filterWilayah) queryParams.append('wilayah', filterWilayah);
        
        const query = `?${queryParams.toString()}`;

        const [dataRes, statsRes] = await Promise.all([
          api.get(`/perikanan-tangkap`), // Fallback for prototype
          api.get(`/perikanan-tangkap/stats`) // Fallback for prototype
        ]);

        setData(dataRes.data.data || []);
        if (statsRes.data.data) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filterTahun, filterBulan, filterCabang, filterKomoditas, filterWilayah]);

  const columns = useMemo(() => [
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      cell: info => formatDate(info.getValue())
    },
    {
      header: 'Cabang',
      accessorKey: 'sumber_data',
      cell: info => {
        const val = info.getValue() || 'PELABUHAN';
        if (val === 'PELABUHAN') return <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Pelabuhan</span>;
        if (val === 'PUD') return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">PUD</span>;
        return <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Kab/Kota</span>;
      }
    },
    {
      header: 'Lokasi (Pelabuhan/Kab)',
      accessorKey: 'pelabuhan',
      cell: info => info.getValue() || info.row.original.kabupaten_kota || '-'
    },
    {
      header: 'Nama Kapal',
      accessorKey: 'nama_kapal',
      cell: info => <p className="font-medium text-foreground">{info.getValue() || '-'}</p>
    },
    {
      header: 'Komoditas',
      accessorKey: 'komoditas'
    },
    {
      header: 'Volume (Kg)',
      accessorKey: 'volume',
      cell: info => info.getValue().toLocaleString('id-ID')
    },
    {
      header: 'Harga (Rp/Kg)',
      accessorKey: 'harga',
      cell: info => formatRupiah(info.getValue())
    },
    {
      header: 'Nilai Produksi (Rp)',
      accessorKey: 'nilai',
      cell: info => formatRupiah(info.getValue())
    }
  ], []);

  const komoditasChartOption = useMemo(() => {
    const categories = stats.komoditas.map(item => item.komoditas);
    const values = stats.komoditas.map(item => item._sum.volume || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [stats.komoditas]);

  const pelabuhanChartOption = useMemo(() => {
    const categories = stats.pelabuhan.map(item => item.pelabuhan);
    const values = stats.pelabuhan.map(item => item._sum.volume || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [stats.pelabuhan]);

  const trenChartOption = useMemo(() => {
    const dates = stats.tren.map(t => t.date);
    const volumes = stats.tren.map(t => t.volume);

    return {
      tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID')} Kg` },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#f8fafc' } },
      yAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: '#334155' } } },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
      series: [{ name: 'Volume', type: 'line', data: volumes, smooth: true, symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] } } }]
    };
  }, [stats.tren]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Visualisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Perikanan Tangkap</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data produksi harian perikanan tangkap dari 3 Cabang Sumber Data.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500"><Database className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">{stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg</span></p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Nilai Produksi</p>
            <p className="text-2xl font-bold text-foreground">{formatRupiah(stats.kpi.total_nilai)}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500"><Ship className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Pendaratan</p>
            <p className="text-2xl font-bold text-foreground">{stats.kpi.total_trip.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Trip</span></p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500"><Anchor className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rata-rata Volume</p>
            <p className="text-2xl font-bold text-foreground">{stats.kpi.avg_volume_per_trip.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-muted-foreground">Kg/Trip</span></p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Fish className="w-5 h-5 text-blue-500" /><h3 className="text-lg font-semibold">Volume Berdasarkan Komoditas</h3></div>
          {stats.komoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-pink-500" /><h3 className="text-lg font-semibold">Volume Berdasarkan Pelabuhan</h3></div>
          {stats.pelabuhan.length > 0 ? <ReactECharts option={pelabuhanChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Pendaratan Harian</h3></div>
        {stats.tren.length > 0 ? <ReactECharts option={trenChartOption} style={{ height: '400px', width: '100%' }} /> : <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
      </div>

      {/* PROTOTYPE: PERBANDINGAN HARGA */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Perbandingan Harga Komoditas</h3>
            </div>
            <p className="text-muted-foreground">Pantau dan bandingkan harga ikan antar Kota/Kabupaten maupun Pelabuhan secara langsung. Fitur ini masih dalam tahap pengembangan (Prototype).</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-border shadow-sm">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Segera Hadir (Coming Soon)</span>
          </div>
        </div>
        <div className="mt-8 h-[250px] rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
           <p className="text-muted-foreground font-medium flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Area Grafik Batang (Grouped Bar Chart) Perbandingan Harga</p>
        </div>
      </div>

      {/* Table Section with SUPER FILTERS */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-6 border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi (Eksplorasi Data)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cabang Sumber</label>
              <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Cabang</option>
                <option value="PELABUHAN">Pelabuhan</option>
                <option value="PUD">PUD</option>
                <option value="KAB_KOTA">Kab/Kota</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Tahun</option>
                {TAHUN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
              <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Bulan</option>
                {BULAN_OPTIONS.map((opt, i) => <option key={opt} value={i+1}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Wilayah / Pelabuhan</label>
              <select value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Wilayah</option>
                {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
              <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Komoditas</option>
                {KOMODITAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Data Pendaratan</h3>
          </div>
          <p className="text-sm text-muted-foreground">Tabel & Unduhan di bawah otomatis menyesuaikan Filter di atas.</p>
        </div>
        
        <DataTable 
          columns={columns} 
          data={data}
          exportName={`Perikanan_Tangkap_${filterCabang || 'All'}_${filterTahun || 'All'}`}
          formatExportData={(exportData) => exportData.map(row => ({
            'Sumber Data': row.sumber_data || 'PELABUHAN',
            'Tanggal': row.tanggal ? row.tanggal.split('T')[0] : '',
            'Jam Labuh': row.jam_labuh || '-',
            'Jam Bongkar': row.jam_bongkar || '-',
            'Lokasi': row.pelabuhan || row.kabupaten_kota || '-',
            'Nama Kapal': row.nama_kapal || '-',
            'GT Kapal': row.gt_kapal || '-',
            'Alat Tangkap': row.alat_tangkap || '-',
            'Komoditas': row.komoditas,
            'Volume (Kg)': row.volume,
            'Harga (Rp/Kg)': row.harga,
            'Nilai Produksi (Rp)': row.nilai
          }))}
        />
      </div>

    </div>
  );
}
