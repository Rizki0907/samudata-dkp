import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, Ship, Anchor, Database, TrendingUp, Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatDate } from '@/utils/dateHelper';
import { KOMODITAS_OPTIONS, PELABUHAN_OPTIONS, KOMODITAS_PUD_OPTIONS } from '@/utils/constants';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function PerikananTangkap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // Super Filters State
  const [filterTahun, setFilterTahun] = useState(currentYear.toString());
  const [filterCabang, setFilterCabang] = useState(''); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');

  // Local Chart Filters
  const [chartGlobalTahun, setChartGlobalTahun] = useState(currentYear.toString());
  const [chartKomoditasWilayah, setChartKomoditasWilayah] = useState('');
  
  // Local Filter for Harga
  const [chartHargaKomoditas, setChartHargaKomoditas] = useState(KOMODITAS_OPTIONS[0]);
  const [chartHargaWilayah, setChartHargaWilayah] = useState([]);

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
        const [dataRes] = await Promise.all([
          api.get(`/bulanan-tangkap/publik`)
        ]);

        setData(dataRes.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Run once on mount

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchTahun = !filterTahun || (row.bulan && row.bulan.startsWith(filterTahun));
      const matchCabang = !filterCabang || row.sumber_data === filterCabang;
      const matchWilayah = !filterWilayah || row.pelabuhan === filterWilayah;
      const matchKomoditas = !filterKomoditas || row.komoditas === filterKomoditas;

      return matchTahun && matchCabang && matchWilayah && matchKomoditas;
    });
  }, [data, filterTahun, filterCabang, filterWilayah, filterKomoditas]);

  const aggregatedData = useMemo(() => {
    const map = {};
    filteredData.forEach(row => {
      const bln = row.bulan || 'Unknown';
      const pel = row.pelabuhan || 'Lainnya';
      const cabang = row.sumber_data || 'PELABUHAN';
      
      const key = `${bln}_${cabang}_${pel}`;
      if(!map[key]) {
        map[key] = { bulan: bln, pelabuhan: pel, sumber_data: cabang, volume: 0, nilai: 0, tangkapan: [] };
      }
      
      map[key].volume += Number(row.volume) || 0;
      map[key].nilai += Number(row.nilai) || 0;
      
      const existing = map[key].tangkapan.find(x => x.komoditas === row.komoditas);
      if (existing) {
         existing.volume += Number(row.volume) || 0;
         existing.nilai += Number(row.nilai) || 0;
      } else {
         map[key].tangkapan.push({
            komoditas: row.komoditas,
            volume: Number(row.volume) || 0,
            nilai: Number(row.nilai) || 0
         });
      }
    });
    return Object.values(map).sort((a, b) => b.bulan.localeCompare(a.bulan));
  }, [filteredData]);

  const columns = useMemo(() => [
    {
      header: 'Bulan / Tahun',
      accessorKey: 'bulan',
      cell: info => {
        const val = info.getValue();
        if(val === 'Unknown') return val;
        const [y, m] = val.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
      }
    },
    {
      header: 'Cabang',
      accessorKey: 'sumber_data',
      cell: info => {
        const val = info.getValue();
        if (val === 'PELABUHAN') return <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Pelabuhan</span>;
        if (val === 'PUD') return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">PUD</span>;
        return <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Non Pelabuhan</span>;
      }
    },
    {
      header: 'Wilayah / Lokasi',
      accessorKey: 'pelabuhan'
    },
    {
      header: 'Total Volume (Kg)',
      accessorKey: 'volume',
      cell: info => info.getValue().toLocaleString('id-ID')
    },
    {
      header: 'Total Nilai Produksi (Rp)',
      accessorKey: 'nilai',
      cell: info => formatRupiah(info.getValue())
    }
  ], []);

  const renderSubComponent = ({ row }) => {
    const tangkapan = row.original.tangkapan || [];
    if (tangkapan.length === 0) return <div className="p-4 text-center text-muted-foreground text-sm">Belum ada detail tangkapan</div>;
    
    return (
      <div className="p-4 bg-muted/10 border-l-4 border-primary">
        <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
          Rincian Komoditas (Agregat Bulanan)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Komoditas</th>
                <th className="px-4 py-2 font-medium">Total Volume (Kg)</th>
                <th className="px-4 py-2 font-medium text-right">Total Nilai Produksi (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {tangkapan.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{item.komoditas}</td>
                  <td className="px-4 py-2">{item.volume.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-right">{formatRupiah(item.nilai)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const localKpi = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    let total_trip = 0;
    data.forEach(row => {
      const matchTahun = !chartGlobalTahun || (row.bulan && row.bulan.startsWith(chartGlobalTahun));
      if (!matchTahun) return;
      
      total_trip++;
      total_volume += Number(row.volume) || 0;
      total_nilai += Number(row.nilai) || 0;
    });
    return {
      total_volume,
      total_nilai,
      total_trip,
      avg_volume_per_trip: total_trip ? total_volume / total_trip : 0
    };
  }, [data, chartGlobalTahun]);

  const localKomoditas = useMemo(() => {
    const map = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const rowWilayah = row.pelabuhan || '';
      
      const matchTahun = !chartGlobalTahun || rowTahun === chartGlobalTahun;
      const matchWilayah = !chartKomoditasWilayah || rowWilayah === chartKomoditasWilayah;
      
      if (matchTahun && matchWilayah) {
        if (!map[row.komoditas]) map[row.komoditas] = 0;
        map[row.komoditas] += Number(row.volume) || 0;
      }
    });
    return Object.entries(map).map(([k, v]) => ({ komoditas: k, volume: v })).sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [data, chartGlobalTahun, chartKomoditasWilayah]);

  const komoditasChartOption = useMemo(() => {
    const categories = localKomoditas.map(item => item.komoditas);
    const values = localKomoditas.map(item => item.volume);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [localKomoditas]);

  const localPelabuhan = useMemo(() => {
    const map = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const matchTahun = !chartGlobalTahun || rowTahun === chartGlobalTahun;
      
      if (matchTahun) {
        const pel = row.pelabuhan || 'Lainnya';
        if (!map[pel]) map[pel] = 0;
        map[pel] += Number(row.volume) || 0;
      }
    });
    return Object.entries(map).map(([p, v]) => ({ pelabuhan: p, volume: v })).sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [data, chartGlobalTahun]);

  const pelabuhanChartOption = useMemo(() => {
    const categories = localPelabuhan.map(item => item.pelabuhan);
    const values = localPelabuhan.map(item => item.volume);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontWeight: 'bold' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#ffffff', formatter: '{c} Kg' } }]
    };
  }, [localPelabuhan]);

  const trenChartOption = useMemo(() => {
    const localTrenMap = {};
    data.forEach(row => {
       const matchTahun = !chartGlobalTahun || (row.bulan && row.bulan.startsWith(chartGlobalTahun));
       if (!matchTahun) return;

       const date = row.bulan ? row.bulan : 'Unknown';
       if (!localTrenMap[date]) localTrenMap[date] = { volume: 0, nilai: 0 };
       localTrenMap[date].volume += Number(row.volume) || 0;
       localTrenMap[date].nilai += Number(row.nilai) || 0;
    });
    const localDates = Object.keys(localTrenMap).sort();
    const formattedDates = localDates.map(d => {
       if (d === 'Unknown') return '';
       const [y, m] = d.split('-');
       const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
       return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
    });
    const localVolumes = localDates.map(d => localTrenMap[d].volume);
    const localNilais = localDates.map(d => localTrenMap[d].nilai);

    return {
      volume: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID')} Kg` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', name: 'Volume (Kg)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Volume', type: 'line', data: localVolumes, smooth: true, symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] } } }]
      },
      nilai: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Nilai: Rp ${params[0].value.toLocaleString('id-ID')}` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#f8fafc' } },
        yAxis: { type: 'value', name: 'Nilai Produksi (Rp)', nameTextStyle: { color: '#f8fafc' }, axisLabel: { color: '#f8fafc', formatter: (v) => 'Rp ' + (v/1000000) + 'M' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Nilai', type: 'line', data: localNilais, smooth: true, symbolSize: 8, itemStyle: { color: '#10b981' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }] } } }]
      }
    };
  }, [data, chartGlobalTahun]);

  const hargaData = useMemo(() => {
    const pelMap = {};
    data.forEach(row => {
      const matchTahun = !chartGlobalTahun || (row.bulan && row.bulan.startsWith(chartGlobalTahun));
      if (!matchTahun) return;

      const pel = row.pelabuhan || 'Lainnya';
      if (!pelMap[pel]) pelMap[pel] = 0;
      pelMap[pel] += Number(row.volume) || 0;
    });
    
    let targetPelabuhan = chartHargaWilayah;
    
    // Jika user belum memilih wilayah spesifik, ambil Top 10 pelabuhan dengan volume tertinggi sebagai default
    if (targetPelabuhan.length === 0) {
      targetPelabuhan = Object.entries(pelMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10).map(x => x[0]);
    }

    const hMap = {};
    targetPelabuhan.forEach(p => {
       hMap[p] = { vol: 0, nilai: 0 };
    });
    
    data.forEach(row => {
       const matchTahun = !chartGlobalTahun || (row.bulan && row.bulan.startsWith(chartGlobalTahun));
       if (!matchTahun) return;

       const pel = row.pelabuhan || 'Lainnya';
       if (hMap[pel] && row.komoditas === chartHargaKomoditas) {
          hMap[pel].vol += Number(row.volume) || 0;
          hMap[pel].nilai += Number(row.nilai) || 0;
       }
    });

    const series = [{
       name: chartHargaKomoditas,
       type: 'bar',
       data: targetPelabuhan.map(pel => {
          const stat = hMap[pel];
          return stat.vol > 0 ? Math.round(stat.nilai / stat.vol) : 0;
       }),
       itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
       label: { show: true, position: 'top', color: '#ffffff', formatter: (p) => 'Rp ' + (p.value/1000) + 'k' }
    }];

    return { categories: targetPelabuhan, series };
  }, [data, chartHargaKomoditas, chartHargaWilayah, chartGlobalTahun]);

  const hargaChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: hargaData.categories,
        axisLabel: { color: '#f8fafc', interval: 0, width: 90, overflow: 'break' }
      },
      yAxis: { 
        type: 'value', 
        name: 'Harga Rata-rata (Rp)', 
        nameTextStyle: { color: '#f8fafc' }, 
        axisLabel: { color: '#f8fafc', formatter: (value) => 'Rp ' + (value/1000) + 'k' }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } 
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100, bottom: 0 }],
      series: hargaData.series
    };
  }, [hargaData]);

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

      {/* GLOBAL CHART FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
        <div>
          <h2 className="text-lg font-bold text-foreground">Visualisasi & Statistik</h2>
          <p className="text-sm text-muted-foreground">Pilih tahun untuk memfilter seluruh data metrik dan grafik di bawah.</p>
        </div>
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm">
          <Filter className="w-4 h-4 text-primary ml-2" />
          <select 
            value={chartGlobalTahun} 
            onChange={(e) => setChartGlobalTahun(e.target.value)} 
            className="bg-transparent border-none text-foreground text-sm font-medium outline-none pr-4 cursor-pointer focus:ring-0"
          >
            <option className="bg-background text-foreground" value="">Semua Tahun (All-Time)</option>
            {TAHUN_OPTIONS.map(opt => <option className="bg-background text-foreground" key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards (Now using localKpi filtered by chartGlobalTahun) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-primary/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Database className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Volume</p></div>
          <p className="text-3xl font-bold text-foreground">
            {localKpi.total_volume > 1000000 ? (localKpi.total_volume / 1000000).toFixed(1) + 'M' : localKpi.total_volume.toLocaleString('id-ID')} <span className="text-sm text-muted-foreground font-normal">Kg</span>
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Nilai Produksi</p></div>
          <p className="text-3xl font-bold text-foreground">
            Rp {(localKpi.total_nilai / 1000000000).toFixed(1)} <span className="text-sm text-muted-foreground font-normal">Milyar</span>
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-orange-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Ship className="w-5 h-5 text-orange-500" /><p className="text-sm font-medium text-muted-foreground">Total Trip / Laporan</p></div>
          <p className="text-3xl font-bold text-foreground">
            {localKpi.total_trip.toLocaleString('id-ID')} <span className="text-sm text-muted-foreground font-normal">Trip</span>
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-pink-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Anchor className="w-5 h-5 text-pink-500" /><p className="text-sm font-medium text-muted-foreground">Rata-rata Volume/Trip</p></div>
          <p className="text-3xl font-bold text-foreground">
            {Math.round(localKpi.avg_volume_per_trip).toLocaleString('id-ID')} <span className="text-sm text-muted-foreground font-normal">Kg/Trip</span>
          </p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Volume Berdasarkan Komoditas</h3>
            </div>
            <div className="flex items-center gap-2">
              <select value={chartKomoditasWilayah} onChange={(e) => setChartKomoditasWilayah(e.target.value)} className="rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/50">
                <option value="">Semua Wilayah</option>
                {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          {localKomoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data di tahun ini</div>}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold">Volume Berdasarkan Pelabuhan</h3>
            </div>
          </div>
          {localPelabuhan.length > 0 ? <ReactECharts option={pelabuhanChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data di tahun ini</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Volume Pendaratan</h3></div>
          {data.length > 0 ? <ReactECharts option={trenChartOption.volume} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><LineChart className="w-5 h-5 text-emerald-500" /><h3 className="text-lg font-semibold">Tren Nilai Produksi</h3></div>
          {data.length > 0 ? <ReactECharts option={trenChartOption.nilai} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
      </div>

      {/* PERBANDINGAN HARGA */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Perbandingan Harga Komoditas (Rp/Kg)</h3>
          </div>
          <div className="flex items-center gap-2">
            <select value={chartHargaKomoditas} onChange={(e) => setChartHargaKomoditas(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50">
              {[...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            <div className="relative group">
              <button className="px-3 py-2 border rounded-lg bg-background text-sm flex items-center gap-2 hover:bg-muted transition-colors">
                 Pilih Wilayah ({chartHargaWilayah.length > 0 ? chartHargaWilayah.length : 'Top 10'})
              </button>
              <div className="absolute top-full right-0 mt-1 w-64 bg-card border rounded-lg shadow-xl p-2 hidden group-hover:flex flex-col gap-1 max-h-64 overflow-y-auto z-50">
                 {PELABUHAN_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="rounded border-border text-primary focus:ring-primary"
                         checked={chartHargaWilayah.includes(opt)} 
                         onChange={(e) => {
                           if (e.target.checked) {
                              setChartHargaWilayah(prev => [...prev, opt]);
                           } else {
                              setChartHargaWilayah(prev => prev.filter(x => x !== opt));
                           }
                         }} 
                       />
                       <span className="text-sm truncate text-foreground">{opt}</span>
                    </label>
                 ))}
                 {chartHargaWilayah.length > 0 && (
                    <button 
                      onClick={() => setChartHargaWilayah([])}
                      className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-medium py-1 border-t"
                    >
                      Reset Wilayah (Kembali ke Top 10)
                    </button>
                 )}
              </div>
            </div>
          </div>
        </div>
        {hargaData.categories && hargaData.categories.length > 0 ? (
          <ReactECharts option={hargaChartOption} style={{ height: '400px', width: '100%' }} />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            Belum ada data pelabuhan untuk komoditas ini
          </div>
        )}
      </div>

      {/* Table Section with SUPER FILTERS */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-6 border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi (Eksplorasi Data)</h3>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cabang Sumber</label>
              <select value={filterCabang} onChange={(e) => setFilterCabang(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Cabang</option>
                <option value="PELABUHAN">Pelabuhan</option>
                <option value="PUD">PUD</option>
                <option value="KAB_KOTA">Non Pelabuhan</option>
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
                {[...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])].map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
          data={aggregatedData}
          exportName={`Rekap_Perikanan_Tangkap_${filterCabang || 'All'}_${filterTahun || 'All'}`}
          renderSubComponent={renderSubComponent}
          onCustomExport={async (rowsToExport) => {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Data Perikanan Tangkap');

            const row1 = ['Bulan / Tahun', 'Cabang Sumber', 'Wilayah / Lokasi', 'Total Volume (Kg)', 'Total Nilai Produksi (Rp)'];
            const row2 = ['', '', '', '', ''];

            const komoditasArray = [...new Set([...KOMODITAS_OPTIONS, ...KOMODITAS_PUD_OPTIONS])];
            komoditasArray.forEach(kom => {
              row1.push(kom, '');
              row2.push('Volume (Kg)', 'Nilai (Rp)');
            });

            sheet.addRow(row1);
            sheet.addRow(row2);

            sheet.mergeCells('A1:A2');
            sheet.mergeCells('B1:B2');
            sheet.mergeCells('C1:C2');
            sheet.mergeCells('D1:D2');
            sheet.mergeCells('E1:E2');

            let currentCol = 6;
            komoditasArray.forEach(() => {
              sheet.mergeCells(1, currentCol, 1, currentCol + 1);
              currentCol += 2;
            });

            for (let i = 1; i <= 2; i++) {
              const row = sheet.getRow(i);
              row.eachCell((cell, colNumber) => {
                // Kolom 1-5 (Main Headers) diberi warna Kuning
                // Kolom 6 ke atas (Komoditas) diberi warna Biru Muda
                const bgColor = colNumber <= 5 ? 'FFFFFF00' : 'FFD9E1F2'; 

                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.font = { bold: true };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                  top: { style: 'thin' }, left: { style: 'thin' },
                  bottom: { style: 'thin' }, right: { style: 'thin' }
                };
              });
            }

            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

            rowsToExport.forEach(row => {
              let formattedBulan = row.bulan;
              if (row.bulan !== 'Unknown') {
                 const [y, m] = row.bulan.split('-');
                 formattedBulan = `${monthNames[parseInt(m, 10) - 1]} ${y}`;
              }

              const rowData = [
                formattedBulan,
                row.sumber_data,
                row.pelabuhan,
                row.volume || 0,
                row.nilai || 0
              ];

              const tangkapanMap = {};
              if (row.tangkapan) {
                 row.tangkapan.forEach(t => { tangkapanMap[t.komoditas] = t; });
              }
              
              komoditasArray.forEach(kom => {
                 const komData = tangkapanMap[kom];
                 rowData.push(komData ? (komData.volume || 0) : 0);
                 rowData.push(komData ? (komData.nilai || 0) : 0);
              });

              const addedRow = sheet.addRow(rowData);
              addedRow.eachCell((cell, colNumber) => {
                cell.border = {
                  top: { style: 'thin' }, left: { style: 'thin' },
                  bottom: { style: 'thin' }, right: { style: 'thin' }
                };
                if (typeof cell.value === 'number') {
                  cell.alignment = { horizontal: 'right' };
                  if (colNumber === 5 || (colNumber > 5 && colNumber % 2 !== 0)) {
                    cell.numFmt = '#,##0.00';
                  } else {
                    cell.numFmt = '#,##0';
                  }
                }
              });
            });

            sheet.getColumn(1).width = 20;
            sheet.getColumn(2).width = 15;
            sheet.getColumn(3).width = 25;
            sheet.getColumn(4).width = 20;
            sheet.getColumn(5).width = 25;
            for(let i = 6; i < currentCol; i++){
               sheet.getColumn(i).width = 15;
            }

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Rekap_Perikanan_Tangkap_${filterCabang || 'All'}_${filterTahun || 'All'}.xlsx`);
          }}
        />
      </div>

    </div>
  );
}
