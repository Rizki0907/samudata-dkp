import { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import ExcelJS from 'exceljs';
// eslint-disable-next-line no-unused-vars
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataPublikTangkap } from '@/components/admin/DataPublikTangkap';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
 
 
// eslint-disable-next-line no-unused-vars
import { Loader2, Ship, Anchor, Database, TrendingUp, Fish, MapPin, LineChart, FileText, Filter, BarChart3, AlertCircle, Clock } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatRupiah, formatUangPendek } from '@/utils/formatRupiah';
// eslint-disable-next-line no-unused-vars
import { formatDistanceToNow } from 'date-fns';
// eslint-disable-next-line no-unused-vars
import { id as idLocale } from 'date-fns/locale';
// eslint-disable-next-line no-unused-vars
import { formatDate } from '@/utils/dateHelper';
import { useThemeStore } from '@/store/themeStore';
import { useMasterDataStore } from '@/store/masterDataStore';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
// eslint-disable-next-line no-unused-vars
const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

import { PELABUHAN_TO_KABKOTA } from '@/utils/constants';

// Fungsi komponen/logika PerikananTangkap
export default function PerikananTangkap() {
  // eslint-disable-next-line no-unused-vars
  const { getKabKotaByPelabuhan, getOptions } = useMasterDataStore();
  const KOMODITAS_OPTIONS = getOptions('KOMODITAS_TANGKAP_LAUT');
  const KOMODITAS_PUD_OPTIONS = getOptions('KOMODITAS_TANGKAP_PUD');
  const PELABUHAN_OPTIONS = getOptions('PELABUHAN');
  const KAB_KOTA_OPTIONS = getOptions('KAB_KOTA');
  // eslint-disable-next-line no-unused-vars
  const PERAIRAN_OPTIONS = getOptions('JENIS_PERAIRAN');

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  // State indikator proses memuat data (loading)
  const [loading, setLoading] = useState(true);
  // State untuk menyimpan list data utama yang diambil dari server
  const [data, setData] = useState([]);
  // State untuk menyimpan data/nilai logistikData
  const [logistikData, setLogistikData] = useState({});
  
  // Super Filters State
  const [filterTahun, setFilterTahun] = useState([]);
  // State untuk filter data berdasarkan jenis cabang perairan
  const [filterCabang, setFilterCabang] = useState([]); // PELABUHAN, PUD, KAB_KOTA
  // State untuk menyimpan data/nilai filterJenisPerairan
  const [filterJenisPerairan, setFilterJenisPerairan] = useState([]);
  // State untuk menyimpan data/nilai filterKomoditas
  const [filterKomoditas, setFilterKomoditas] = useState([]);
  // State untuk menyimpan data/nilai filterWilayah
  const [filterWilayah, setFilterWilayah] = useState([]);

  // Local Chart Filters
  const [chartGlobalTahun, setChartGlobalTahun] = useState([]);
  // State untuk menyimpan data/nilai chartCabang
  const [chartCabang, setChartCabang] = useState([]); // Filter Cabang/Sumber untuk Chart
  // State untuk menyimpan data/nilai chartKomoditasWilayah
  const [chartKomoditasWilayah, setChartKomoditasWilayah] = useState([]);
  // State untuk menyimpan data/nilai filterKabKotaChart
  const [filterKabKotaChart, setFilterKabKotaChart] = useState([]);
  
  // Local Filter for Harga
  const [chartHargaKomoditas, setChartHargaKomoditas] = useState(KOMODITAS_OPTIONS[0]);
  // eslint-disable-next-line no-unused-vars
  const [chartHargaWilayah, setChartHargaWilayah] = useState([]);

   
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_trip: 0, avg_volume_per_trip: 0 },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  useEffect(() => {
    if (!chartHargaKomoditas && KOMODITAS_OPTIONS.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChartHargaKomoditas(KOMODITAS_OPTIONS[0]);
    }
  }, [KOMODITAS_OPTIONS, chartHargaKomoditas]);

  useEffect(() => {
    // Fungsi untuk mengambil data utama dari backend (API)
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
      const matchJenisPerairan = filterJenisPerairan.length === 0 || (row.jenis_perairan && filterJenisPerairan.includes(row.jenis_perairan));
      const matchWilayah = filterWilayah.length === 0 || filterWilayah.includes(row.pelabuhan || '');
      const matchKomoditas = filterKomoditas.length === 0 || filterKomoditas.includes(row.komoditas);

      return matchTahun && matchCabang && matchJenisPerairan && matchWilayah && matchKomoditas;
    });
  }, [data, filterTahun, filterCabang, filterJenisPerairan, filterWilayah, filterKomoditas]);

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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
      const matchCabang = chartCabang.length === 0 || chartCabang.includes(row.sumber_data || 'PELABUHAN');
      if (!matchTahun || !matchCabang) return;
      
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
  }, [data, chartGlobalTahun, chartCabang]);

  const localKomoditas = useMemo(() => {
    const map = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const rowWilayah = row.pelabuhan || '';
      
      const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
      const matchCabang = chartCabang.length === 0 || chartCabang.includes(row.sumber_data || 'PELABUHAN');
      const matchWilayah = chartKomoditasWilayah.length === 0 || chartKomoditasWilayah.includes(rowWilayah);
      
      if (matchTahun && matchCabang && matchWilayah) {
        if (!map[row.komoditas]) map[row.komoditas] = 0;
        map[row.komoditas] += Number(row.volume) || 0;
      }
    });
    return Object.entries(map).map(([k, v]) => ({ komoditas: k, volume: v })).sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [data, chartGlobalTahun, chartCabang, chartKomoditasWilayah]);

  const lautVsPudData = useMemo(() => {
    let totalPelabuhan = 0;
    let totalPud = 0;
    let totalNonPelabuhan = 0;
    
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      if (chartGlobalTahun.length > 0 && !chartGlobalTahun.includes(rowTahun)) return;
      if (chartCabang.length > 0 && !chartCabang.includes(row.sumber_data || 'PELABUHAN')) return;
      
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
  }, [data, chartGlobalTahun, chartCabang, filterKabKotaChart]);

  const lautVsPudChartOption = useMemo(() => {
    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => { return params.map(p => `${p.marker} <b>${p.name}</b>: ${p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton`).join('<br/>'); }
      },
      grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Pelabuhan', 'Non Pelabuhan', 'PUD', 'Total'],
        axisLabel: { color: '#64748b', fontWeight: 'bold', fontSize: 12, interval: 0 },
        axisLine: { lineStyle: { color: isDark ? '#334155' : 'rgba(148, 163, 184, 0.2)' } }
      },
      yAxis: {
        type: 'value',
        name: 'Volume (Ton)',
        nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 20] },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#1e293b' : 'rgba(148, 163, 184, 0.2)' } }
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
                  colorStops: isDark
                    ? [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1e3a8a' }]
                    : [{ offset: 0, color: '#023E8A' }, { offset: 1, color: '#0077B6' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.nonPelabuhan,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: isDark
                    ? [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#b45309' }]
                    : [{ offset: 0, color: '#0077B6' }, { offset: 1, color: '#0096C7' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.pud,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: isDark
                    ? [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#064e3b' }]
                    : [{ offset: 0, color: '#0096C7' }, { offset: 1, color: '#00B4D8' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            },
            {
              value: lautVsPudData.total,
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: isDark
                    ? [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#4c1d95' }]
                    : [{ offset: 0, color: '#03045E' }, { offset: 1, color: '#023E8A' }]
                },
                borderRadius: [8, 8, 0, 0]
              }
            }
          ]
        }
      ]
    };
  }, [lautVsPudData, isDark]);

  const komoditasChartOption = useMemo(() => {
    const categories = localKomoditas.map(item => item.komoditas);
    const values = localKomoditas.map(item => item.volume / 1000);

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '15%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#334155' : 'rgba(148, 163, 184, 0.2)' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b', fontWeight: 'bold', interval: 0, width: 120, overflow: 'truncate' } },
      series: [{ name: 'Volume', type: 'bar', data: values, itemStyle: { color: isDark ? '#3b82f6' : '#0077B6', borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: '#64748b', formatter: (p) => p.value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' Ton' } }]
    };
  }, [localKomoditas, isDark]);

  const topKomoditasUnggulan = useMemo(() => {
    const komoditasMap = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      if (chartGlobalTahun.length > 0 && !chartGlobalTahun.includes(rowTahun)) return;
      if (chartCabang.length > 0 && !chartCabang.includes(row.sumber_data || 'PELABUHAN')) return;
      
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
  }, [data, chartGlobalTahun, chartCabang]);

  const trenChartOption = useMemo(() => {
    const localTrenMap = {};
    data.forEach(row => {
       const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
       const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
       const matchCabang = chartCabang.length === 0 || chartCabang.includes(row.sumber_data || 'PELABUHAN');
       if (!matchTahun || !matchCabang) return;

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
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Volume: ${params[0].value.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Ton` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', name: 'Volume (Ton)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: isDark ? '#334155' : 'rgba(148, 163, 184, 0.2)' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Volume', type: 'line', data: localVolumes, smooth: true, symbolSize: 8, itemStyle: { color: isDark ? '#8b5cf6' : '#023E8A' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: isDark ? [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }] : [{ offset: 0, color: 'rgba(2, 62, 138, 0.5)' }, { offset: 1, color: 'rgba(2, 62, 138, 0.05)' }] } } }]
      },
      nilai: {
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', formatter: (params) => `<b>${params[0].name}</b><br/>Nilai: Rp ${params[0].value.toLocaleString('id-ID')}` },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: formattedDates, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', name: 'Nilai Produksi (Rp)', nameTextStyle: { color: '#64748b' }, axisLabel: { color: '#64748b', formatter: (v) => 'Rp ' + (v/1000000) + 'M' }, splitLine: { lineStyle: { color: isDark ? '#334155' : 'rgba(148, 163, 184, 0.2)' } } },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
        series: [{ name: 'Nilai', type: 'line', data: localNilais, smooth: true, symbolSize: 8, itemStyle: { color: isDark ? '#10b981' : '#0096C7' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: isDark ? [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }] : [{ offset: 0, color: 'rgba(0, 150, 199, 0.5)' }, { offset: 1, color: 'rgba(0, 150, 199, 0.05)' }] } } }]
      }
    };
  }, [data, chartGlobalTahun, chartCabang, isDark]);

  const hargaData = useMemo(() => {
    const pelMap = {};
    data.forEach(row => {
      const rowTahun = row.bulan ? row.bulan.substring(0, 4) : '';
      const matchTahun = chartGlobalTahun.length === 0 || chartGlobalTahun.includes(rowTahun);
      const matchCabang = chartCabang.length === 0 || chartCabang.includes(row.sumber_data || 'PELABUHAN');
      if (!matchTahun || !matchCabang) return;

      const pel = row.pelabuhan || 'Lainnya';
      if (!pelMap[pel]) pelMap[pel] = 0;
      pelMap[pel] += Number(row.volume) || 0;
    });
    
    let targetPelabuhan = chartHargaWilayah;
    
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
       const matchCabang = chartCabang.length === 0 || chartCabang.includes(row.sumber_data || 'PELABUHAN');
       if (!matchTahun || !matchCabang) return;

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
       itemStyle: { color: isDark ? '#f59e0b' : '#00B4D8', borderRadius: [4, 4, 0, 0] },
       label: { show: true, position: 'top', color: '#64748b', formatter: (p) => 'Rp ' + (p.value/1000) + 'k' }
    }];

    return { categories: targetPelabuhan, series };
  }, [data, chartHargaKomoditas, chartHargaWilayah, chartGlobalTahun, chartCabang, isDark]);

  // eslint-disable-next-line no-unused-vars
  const hargaChartOption = useMemo(() => {
    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', axisPointer: { type: 'shadow' } },
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
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#334155' : 'rgba(148, 163, 184, 0.2)' } } 
      },
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100, bottom: 0 }],
      series: hargaData.series
    };
  }, [hargaData, isDark]);

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
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Perikanan Tangkap</h1>
        </div>
        
        <div 
          className="
            inline-flex items-center gap-2
            whitespace-nowrap
            px-4 py-2
            bg-cyan-50 text-cyan-700
            dark:bg-cyan-500/10 dark:text-cyan-300
            rounded-full
            text-sm 
            font-medium
            border border-cyan-200
            dark:border-cyan-500/20
            shadow-sm"
        >
          <Clock className="w-4 h-4 flex-shrink-0 animate-pulse"/>
          <span className="opacity-80">
            Terakhir Diperbarui:
          </span>
          <span className="font-semibold">
            {lastUpdated || '-'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <SearchableMultiSelect 
            value={chartCabang} 
            onChange={setChartCabang} 
            options={[
              { label: 'Pelabuhan', value: 'PELABUHAN' },
              { label: 'PUD', value: 'PUD' },
              { label: 'Non Pelabuhan', value: 'KAB_KOTA' }
            ]}
            placeholder="Semua Sumber"
          />
          <SearchableMultiSelect 
            value={chartGlobalTahun} 
            onChange={setChartGlobalTahun} 
            options={TAHUN_OPTIONS.map(opt => ({ label: opt, value: opt }))}
            placeholder="Semua Tahun"
          />
          <SearchableMultiSelect 
            value={filterKabKotaChart} 
            onChange={setFilterKabKotaChart} 
            options={KAB_KOTA_OPTIONS}
            placeholder="Semua Kab/Kota"
          />
          <SearchableMultiSelect 
            value={chartKomoditasWilayah} 
            onChange={setChartKomoditasWilayah} 
            options={PELABUHAN_OPTIONS}
            placeholder="Semua Pelabuhan"
          />
        </div>
        {(chartGlobalTahun.length > 0 || chartCabang.length > 0 || filterKabKotaChart.length > 0 || chartKomoditasWilayah.length > 0) && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => {
                setChartGlobalTahun([]);
                setChartCabang([]);
                setFilterKabKotaChart([]);
                setChartKomoditasWilayah([]);
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500"><Database className="w-6 h-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">Total Volume</p>
            <p className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`${(localKpi.total_volume / 1000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ton`}>
              {(localKpi.total_volume / 1000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-muted-foreground font-normal">Ton</span>
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500"><TrendingUp className="w-6 h-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">Total Nilai Produksi</p>
            <p className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`Rp ${formatUangPendek(localKpi.total_nilai)}`}>
              {(() => {
                const formatted = formatUangPendek(localKpi.total_nilai);
                const match = formatted.match(/^(.*?)\s([a-zA-Z]+)$/);
                return match ? <>Rp {match[1]} <span className="text-sm text-muted-foreground font-normal">{match[2]}</span></> : `Rp ${formatted}`;
              })()}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500"><Ship className="w-6 h-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">Total Trip / Laporan</p>
            <p className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`${localKpi.total_trip.toLocaleString('id-ID')} Trip`}>
              {localKpi.total_trip.toLocaleString('id-ID')} <span className="text-sm text-muted-foreground font-normal">Trip</span>
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500"><Anchor className="w-6 h-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">Rata-rata Volume/Trip</p>
            <p className="text-xl xl:text-2xl font-bold text-foreground truncate" title={`${Math.round(localKpi.avg_volume_per_trip).toLocaleString('id-ID')} Kg/Trip`}>
              {Math.round(localKpi.avg_volume_per_trip).toLocaleString('id-ID')} <span className="text-sm text-muted-foreground font-normal">Kg/Trip</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Perbandingan Produksi</h3>
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
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Fish className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Komoditas Terbanyak</h3>
            </div>
          </div>
          {localKomoditas.length > 0 ? <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <div className={`p-2 ${isDark ? 'bg-amber-500/10' : 'bg-sky-600/10'} rounded-lg`}>
            <TrendingUp className={`w-6 h-6 ${isDark ? 'text-amber-500' : 'text-sky-600'}`} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Komoditas Unggulan dan Top 5 Wilayah Penghasil</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topKomoditasUnggulan.map((item, idx) => (
            <div key={idx} className="bg-muted/10 border border-border rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-foreground">{item.komoditas}</h4>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Produksi</p>
                  <p className={`text-xl font-black ${isDark ? 'text-amber-500' : 'text-sky-600'} mt-1`}>{Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.total / 1000)} <span className="text-sm font-normal">Ton</span></p>
                </div>
                <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-500' : 'bg-sky-600/20 text-sky-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
                        <div className={`h-full ${isDark ? 'bg-amber-500' : 'bg-sky-600'} rounded-full`} style={{ width: `${percent}%` }}></div>
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
             <div className="col-span-3 text-center py-8 text-muted-foreground">Belum ada data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Tren Volume Pendaratan</h3>
            </div>
          </div>
          {data.length > 0 ? <ReactECharts option={trenChartOption.volume} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <LineChart className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Tren Nilai Produksi</h3>
            </div>
          </div>
          {data.length > 0 ? <ReactECharts option={trenChartOption.nilai} style={{ height: '350px', width: '100%' }} /> : <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Perikanan Tangkap</h3>
          </div>
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
            filterNode={
              <div className="mb-6 border-b border-border pb-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <SearchableMultiSelect 
                      value={filterCabang} 
                      onChange={(val) => {
                        setFilterCabang(val);
                        setFilterWilayah([]);
                        setFilterKomoditas([]);
                        setFilterJenisPerairan([]);
                      }} 
                      options={[
                        { label: 'Pelabuhan', value: 'PELABUHAN' },
                        { label: 'PUD', value: 'PUD' },
                        { label: 'Non Pelabuhan', value: 'KAB_KOTA' }
                      ]}
                      placeholder="Semua Sumber"
                    />
                  </div>
                  
                  {filterCabang.includes('PUD') && (
                    <div>
                      <SearchableMultiSelect 
                        value={filterJenisPerairan} 
                        onChange={setFilterJenisPerairan} 
                        options={[{label: "Sungai", value: "Sungai"}, {label: "Danau", value: "Danau"}, {label: "Waduk", value: "Waduk"}, {label: "Rawa", value: "Rawa"}, {label: "Genangan Air", value: "Genangan Air"}]}
                        placeholder="Semua Perairan"
                      />
                    </div>
                  )}
                  
                  <div>
                    <SearchableMultiSelect 
                      value={filterTahun} 
                      onChange={setFilterTahun} 
                      options={TAHUN_OPTIONS.map(opt => ({ label: opt, value: opt }))}
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
                {(filterCabang.length > 0 || filterJenisPerairan.length > 0 || filterTahun.length > 0 || filterWilayah.length > 0 || filterKomoditas.length > 0) && (
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCabang([]);
                        setFilterJenisPerairan([]);
                        setFilterTahun([]);
                        setFilterWilayah([]);
                        setFilterKomoditas([]);
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
