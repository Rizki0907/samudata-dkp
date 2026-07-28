import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataPublikTangkap } from '@/components/admin/DataPublikTangkap';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import { Loader2, Ship, Anchor, Database, TrendingUp, Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { formatDate } from '@/utils/dateHelper';
import { KOMODITAS_OPTIONS, PELABUHAN_OPTIONS, KOMODITAS_PUD_OPTIONS, KAB_KOTA_OPTIONS, PELABUHAN_TO_KABKOTA } from '@/utils/constants';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function PerikananTangkap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [logistikData, setLogistikData] = useState({});
  
  // Super Filters State
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterCabang, setFilterCabang] = useState([]); // PELABUHAN, PUD, KAB_KOTA
  const [filterKomoditas, setFilterKomoditas] = useState([]);
  const [filterWilayah, setFilterWilayah] = useState([]);

  // Local Chart Filters
  const [chartGlobalTahun, setChartGlobalTahun] = useState([]);
  const [chartKomoditasWilayah, setChartKomoditasWilayah] = useState([]);
  const [filterKabKotaChart, setFilterKabKotaChart] = useState([]);
  
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
        setLogistikData(dataRes.data.logistikBulanan || {});
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
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const matchTahun = filterTahun.length === 0 || filterTahun.includes(rowTahun);
      const matchCabang = filterCabang.length === 0 || filterCabang.includes(row.sumber_data || 'PELABUHAN');
      const matchWilayah = filterWilayah.length === 0 || filterWilayah.includes(row.pelabuhan || '');
      const matchKomoditas = filterKomoditas.length === 0 || filterKomoditas.includes(row.komoditas);

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
            nilai: Number(row.nilai) || 0,
              is_adjusted: row.is_adjusted,
              updated_at: row.updated_at
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
      header: 'Perairan',
      accessorKey: 'sumber_data',
      cell: info => {
        const val = info.getValue();
        if (val === 'PELABUHAN') return <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Perairan Pelabuhan</span>;
        if (val === 'PUD') return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Perairan PUD</span>;
        return <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Perairan Non Pelabuhan</span>;
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

  const lastUpdated = useMemo(() => {
    if (!data || data.length === 0) return null;
    let maxDate = new Date(0);
    data.forEach(row => {
      if (row.updated_at) {
        const dt = new Date(row.updated_at);
        if (dt > maxDate) maxDate = dt;
      }
    });
    if (maxDate.getTime() === 0) return null;
    
    return maxDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + maxDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }, [data]);
  
  const localKpi = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    let total_trip = 0;
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
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
      
      const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
      const matchWilayah = chartKomoditasWilayah.length === 0 || chartKomoditasWilayah.includes(rowWilayah);
      
      if (matchTahun && matchWilayah) {
        if (!map[row.komoditas]) map[row.komoditas] = 0;
        map[row.komoditas] += Number(row.volume) || 0;
      }
    });
    return Object.entries(map).map(([k, v]) => ({ komoditas: k, volume: v })).sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [data, chartGlobalTahun, chartKomoditasWilayah]);

  const lautVsPudData = useMemo(() => {
    let totalPelabuhan = 0;
    let totalPud = 0;
    let totalNonPelabuhan = 0;
    
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      if (chartGlobalTahun.length > 0 && !chartGlobalTahun.includes(rowTahun)) return;
      
      let kabKota = row.kabupaten_kota || row.pelabuhan || '';
      if (row.sumber_data === 'PELABUHAN') {
        kabKota = PELABUHAN_TO_KABKOTA[row.pelabuhan] || 'Lainnya';
      }
      
      if (filterKabKotaChart.length > 0 && !filterKabKotaChart.includes(kabKota)) return;
      
      const vol = Number(row.volume) || 0;
      if (row.sumber_data === 'PUD') {
        totalPud += vol;
      } else if (row.sumber_data === 'KAB_KOTA') {
        totalNonPelabuhan += vol;
      } else {
        totalPelabuhan += vol;
      }
    });
    
    return {
      pelabuhan: totalPelabuhan / 1000,
      pud: totalPud / 1000,
      nonPelabuhan: totalNonPelabuhan / 1000,
      total: (totalPelabuhan + totalPud + totalNonPelabuhan) / 1000
    };
  }, [data, chartGlobalTahun, filterKabKotaChart]);

  const lautVsPudChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => { return params.map(p => `${p.marker} <b>${p.name}</b>: ${p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton`).join('<br/>'); }
      },
      grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Pelabuhan', 'Non Pelabuhan', 'PUD', 'Total'],
        axisLabel: { color: '#64748b', fontWeight: 'bold', fontSize: 12, interval: 0 },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        name: 'Volume (Ton)',
        nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 20] },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { type: 'dashed', color: '#1e293b' } }
      },
      series: [
        {
          name: 'Volume Produksi',
          type: 'bar',
          barWidth: '50%',
          data: [
            {
              value: lautVsPudData.pelabuhan,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1e3a8a' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.nonPelabuhan,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#b45309' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.pud,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#064e3b' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.total,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#4c1d95' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            }
          ]
        }
      ]
    };
  }, [lautVsPudData]);

  const komoditasChartOption = useMemo(() => {
    const categories = localKomoditas.map(item => item.komoditas);
    const values = localKomoditas.map(item => item.volume / 1000);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#64748b', formatter: (p) => p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ton' } }]
    };
  }, [localKomoditas]);

  const topKomoditasUnggulan = useMemo(() => {
    const komoditasMap = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      if (chartGlobalTahun.length > 0 && !chartGlobalTahun.includes(rowTahun)) return;
      
      const kom = row.komoditas;
      const vol = Number(row.volume) || 0;
      if (!komoditasMap[kom]) komoditasMap[kom] = { total: 0, wilayahMap: {} };
      komoditasMap[kom].total += vol;
      
      let kabKota = row.pelabuhan || 'Lainnya';
      if (row.sumber_data === 'PELABUHAN') {
        kabKota = PELABUHAN_TO_KABKOTA[row.pelabuhan] || 'Lainnya';
      }
      
      if (!komoditasMap[kom].wilayahMap[kabKota]) komoditasMap[kom].wilayahMap[kabKota] = 0;
      komoditasMap[kom].wilayahMap[kabKota] += vol;
    });

    const sortedKomoditas = Object.entries(komoditasMap)
      .map(([k, v]) => ({ komoditas: k, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
      
    return sortedKomoditas.map(item => {
      const topWilayah = Object.entries(item.wilayahMap)
        .map(([w, vol]) => ({ wilayah: w, volume: vol }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);
        
      return {
        komoditas: item.komoditas,
        total: item.total,
        topWilayah
      };
    });
  }, [data, chartGlobalTahun]);

  const trenChartOption = useMemo(() => {
    const localTrenMap = {};
    data.forEach(row => {
       const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
       const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
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
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Volume', type: 'line', data: localVolumes, smooth: true, symbolSize: 8, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] } } }]
      },
      nilai: {
        tooltip: { trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Nilai: Rp ${params[0].value.toLocaleString('id-ID')}` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', name: 'Nilai Produksi (Rp)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b', formatter: (v) => 'Rp ' + (v/1000000) + 'M' }, splitLine: { lineStyle: { color: '#334155' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Nilai', type: 'line', data: localNilais, smooth: true, symbolSize: 8, itemStyle: { color: '#10b981' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }] } } }]
      }
    };
  }, [data, chartGlobalTahun]);

  const hargaData = useMemo(() => {
    const pelMap = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
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
       const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
       const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
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
        axisLabel: { color: '#64748b', interval: 0, width: 90, overflow: 'break' }
      },
      yAxis: { 
        type: 'value', 
        name: 'Harga Rata-rata (Rp)', 
        nameTextStyle: { color: '#64748b' }, 
        axisLabel: { color: '#64748b', formatter: (value) => 'Rp ' + (value/1000) + 'k' }, 
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
        </div>
      </div>

      {/* GLOBAL CHART FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
        <div>
          <h2 className="text-lg font-bold text-foreground">Visualisasi & Statistik</h2>
          <p className="text-sm text-muted-foreground">Pilih tahun untuk memfilter seluruh data metrik dan grafik di bawah.</p>
        </div>
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm min-w-[200px]">
          <Filter className="w-4 h-4 text-primary ml-2" />
          <div className="w-full">
            <SearchableMultiSelect 
              value={chartGlobalTahun} 
              onChange={setChartGlobalTahun} 
              options={TAHUN_OPTIONS}
              placeholder="Semua Tahun"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards (Now using localKpi filtered by chartGlobalTahun) */}
              <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-500/20 shadow-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            Terakhir Diperbarui: {lastUpdated || '-'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-primary/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Database className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Volume</p></div>
          <p className="text-3xl font-bold text-foreground">
            {(localKpi.total_volume / 1000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-muted-foreground font-normal">Ton</span>
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

      {/* Row 2: Charts (Laut vs PUD + Komoditas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laut vs PUD Comparison Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Perbandingan Produksi</h3>
                <p className="text-sm text-muted-foreground">Berdasarkan Jenis Perairan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48">
                <SearchableMultiSelect 
                  value={filterKabKotaChart} 
                  onChange={setFilterKabKotaChart} 
                  options={KAB_KOTA_OPTIONS}
                  placeholder="Semua Kab/Kota"
                />
              </div>
            </div>
          </div>
          
          {data.length > 0 ? (
            <ReactECharts option={lautVsPudChartOption} style={{ height: '350px', width: '100%' }} />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Fish className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Komoditas Terbanyak</h3>
                <p className="text-sm text-muted-foreground">Total Keseluruhan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48">
                <SearchableMultiSelect 
                  value={chartKomoditasWilayah} 
                  onChange={setChartKomoditasWilayah} 
                  options={PELABUHAN_OPTIONS}
                  placeholder="Semua Wilayah"
                />
              </div>
            </div>
          </div>
          {localKomoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
      </div>

      {/* Row 3: Komoditas Unggulan & Wilayah Penghasil */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Komoditas Unggulan & Top 5 Wilayah Penghasil</h3>
            <p className="text-sm text-muted-foreground mt-1">Distribusi kabupaten/kota dengan produksi tertinggi untuk masing-masing komoditas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topKomoditasUnggulan.map((item, idx) => (
            <div key={idx} className="bg-muted/10 border border-border rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-foreground">{item.komoditas}</h4>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Produksi</p>
                  <p className="text-xl font-black text-amber-500 mt-1">{Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.total / 1000)} <span className="text-sm font-normal">Ton</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Fish className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top 5 Wilayah</div>
                {item.topWilayah.map((w, i) => {
                  const percent = Math.min(100, Math.round((w.volume / item.topWilayah[0].volume) * 100));
                  return (
                    <div key={i} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate max-w-[60%]">{w.wilayah}</span>
                        <span className="text-muted-foreground">{Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(w.volume / 1000)} Ton</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {item.topWilayah.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">Belum ada wilayah</div>
                )}
              </div>
            </div>
          ))}
          {topKomoditasUnggulan.length === 0 && (
             <div className="col-span-3 text-center py-8 text-muted-foreground">Belum ada data komoditas</div>
          )}
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



      {/* Table Section with SUPER FILTERS */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-6 border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Filter Multidimensi</h3>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <SearchableMultiSelect 
                value={filterCabang} 
                onChange={(val) => {
                  setFilterCabang(val);
                  setFilterWilayah([]);
                  setFilterKomoditas([]);
                }} 
                options={[
                  { label: 'Pelabuhan', value: 'PELABUHAN' },
                  { label: 'PUD', value: 'PUD' },
                  { label: 'Non Pelabuhan', value: 'KAB_KOTA' }
                ]}
                placeholder="Semua Perairan"
              />
            </div>
            <div>
              <SearchableMultiSelect 
                value={filterTahun} 
                onChange={setFilterTahun} 
                options={TAHUN_OPTIONS}
                placeholder="Semua Tahun"
              />
            </div>
            {filterCabang.length > 0 && (
              <>
                <div>
                  <SearchableMultiSelect 
                    value={filterWilayah} 
                    onChange={setFilterWilayah} 
                    options={
                      [...new Set([
                        ...(filterCabang.includes('PELABUHAN') ? PELABUHAN_OPTIONS : []),
                        ...(filterCabang.includes('PUD') || filterCabang.includes('KAB_KOTA') ? KAB_KOTA_OPTIONS : [])
                      ])]
                    }
                    placeholder="Semua Wilayah"
                  />
                </div>
                <div>
                  <SearchableMultiSelect 
                    value={filterKomoditas} 
                    onChange={setFilterKomoditas} 
                    options={
                      [...new Set([
                        ...(filterCabang.includes('PELABUHAN') || filterCabang.includes('KAB_KOTA') ? KOMODITAS_OPTIONS : []),
                        ...(filterCabang.includes('PUD') ? KOMODITAS_PUD_OPTIONS : [])
                      ])]
                    }
                    placeholder="Semua Komoditas"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Data Pendaratan</h3>
          </div>
          <p className="text-sm text-muted-foreground">Tabel & Unduhan di bawah otomatis menyesuaikan Filter di atas.</p>
        </div>
        
                <div className="mt-8">
          <DataPublikTangkap 
            filterTahun={filterTahun}
            filterCabang={filterCabang}
            filterWilayah={filterWilayah}
            filterKomoditas={filterKomoditas}
            isPublic={true}
            publicData={data} 
            publicLogistik={logistikData}
          />
        </div>
      </div>

    </div>
  );
}
