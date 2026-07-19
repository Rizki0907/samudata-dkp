import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, Globe, Box, Target, LineChart, TrendingUp, FileText } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export default function Ekspor() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [stats, setStats] = useState({
    kpi: { total_volume: 0, total_nilai: 0, total_transaksi: 0 },
    treemap: [],
    top5_names: [],
    monthly_data_raw: [],
    monthly_aggregate: [],
    ranking_komoditas: [],
    negara_tujuan: []
  });

  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterNegara, setFilterNegara] = useState('');
  const [agregatFilter, setAgregatFilter] = useState('Segar dan Olahan');
  const [satuanFilter, setSatuanFilter] = useState('KG');
  const [mataUangFilter, setMataUangFilter] = useState('USD');
  const mataUangKey = mataUangFilter === 'RP' ? 'nilai_rp' : 'nilai_usd';
  const mataUangPrefix = mataUangFilter === 'RP' ? 'Rp' : '$';

  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);
  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.nama_komoditas))].filter(Boolean).sort(), [data]);
  const negaraOptions = useMemo(() => [...new Set(data.map(d => d.negara_tujuan))].filter(Boolean).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterBulan && item.bulan !== filterBulan) return false;
      if (filterTahun && item.tahun !== filterTahun) return false;
      if (filterKomoditas && item.nama_komoditas !== filterKomoditas) return false;
      if (filterNegara && item.negara_tujuan !== filterNegara) return false;
      return true;
    });
  }, [data, filterBulan, filterTahun, filterKomoditas, filterNegara]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = selectedYear ? `?tahun=${selectedYear}` : '';
        const [dataRes, statsRes] = await Promise.all([
          api.get(`/ekspor${query}`),
          api.get(`/ekspor/stats${query}`)
        ]);

        if (dataRes.data.success) {
          setData(dataRes.data.data);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedYear]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue();
        const alasan = info.row.original.alasan_penolakan;
        let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        let label = 'PENDING';
        if (status === 'VERIFIED') {
          colorClass = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
          label = 'VERIFIED';
        } else if (status === 'APPROVED') {
          colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
          label = 'APPROVED (PROGRAM)';
        } else if (status === 'APPROVED_BIDANG') {
          colorClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          label = 'APPROVED (BIDANG)';
        } else if (status === 'REJECTED') {
          colorClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          label = 'REJECTED';
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
              {label}
            </span>
            {status === 'REJECTED' && alasan && (
              <span className="text-xs text-rose-500 cursor-help" title={`Alasan: ${alasan}`}>
                (?)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Bulan',
      accessorKey: 'bulan'
    },
    {
      header: 'Tahun',
      accessorKey: 'tahun'
    },
    {
      header: 'Kategori Komoditas',
      accessorKey: 'kategori_komoditas',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Nama Komoditas',
      accessorKey: 'nama_komoditas'
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: info => info.getValue().toLocaleString('id-ID')
    },
    {
      header: 'Satuan Volume',
      accessorKey: 'satuan_volume'
    },
    {
      header: 'Nilai (USD)',
      accessorKey: 'nilai_usd',
      cell: info => `$${(info.getValue() || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    },
    {
      header: 'Nilai (Rp)',
      accessorKey: 'nilai_rp',
      cell: info => `Rp ${(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
    },
    {
      header: 'Negara Tujuan',
      accessorKey: 'negara_tujuan'
    }
  ], []);

  const treemapOption = useMemo(() => {
    const blueGradient = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    const greenGradient = ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

    const segarOlahan = stats.treemap
      .filter(t => t.kategori_komoditas === 'Segar dan Olahan')
      .sort((a, b) => (b._sum[mataUangKey] || 0) - (a._sum[mataUangKey] || 0))
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum[mataUangKey] || 0,
        itemStyle: { color: blueGradient[index % blueGradient.length] }
      }));

    const hidup = stats.treemap
      .filter(t => t.kategori_komoditas === 'Hidup')
      .sort((a, b) => (b._sum[mataUangKey] || 0) - (a._sum[mataUangKey] || 0))
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum[mataUangKey] || 0,
        itemStyle: { color: greenGradient[index % greenGradient.length] }
      }));

    return {
      tooltip: {
        formatter: (info) => {
          const value = info.value;
          const treePath = info.treePathInfo;
          if (!treePath || treePath.length <= 1) return '';
          const pathStr = treePath.map(t => t.name).slice(1).join(' - ');
          return `<b>${pathStr}</b><br/>Nilai: ${mataUangPrefix}${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      series: [{
        type: 'treemap',
        roam: false,
        top: '2%', bottom: '10%', left: '0%', right: '0%',
        label: { show: true, formatter: '{b}', color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
        breadcrumb: {
          show: true,
          bottom: '2%',
          itemStyle: { color: '#f1f5f9', textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' } },
          textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' }
        },
        itemStyle: { borderColor: '#0f172a' },
        levels: [
          {
            itemStyle: { borderWidth: 0, gapWidth: 2 }
          },
          {
            itemStyle: { borderWidth: 2, gapWidth: 1, borderColorSaturation: 0.55 }
          }
        ],
        data: [
          { name: 'Segar dan Olahan', itemStyle: { color: 'transparent' }, children: segarOlahan },
          { name: 'Hidup', itemStyle: { color: 'transparent' }, children: hidup }
        ]
      }],
      tooltip: {
        formatter: function (info) {
          return info.name + '<br/>' + (info.value ? Number(info.value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0');
        }
      }
    };
  }, [stats.treemap, mataUangKey, mataUangPrefix]);

  const lineChartOption = useMemo(() => {
    const { top5_names, monthly_data_raw } = stats;
    const monthlyMap = {};
    MONTHS.forEach(m => {
      monthlyMap[m] = { 'Lainnya': 0 };
      top5_names.forEach(name => monthlyMap[m][name] = 0);
    });

    monthly_data_raw.forEach(item => {
      if (monthlyMap[item.bulan]) {
        if (top5_names.includes(item.nama_komoditas)) {
          monthlyMap[item.bulan][item.nama_komoditas] += item._sum[mataUangKey] || 0;
        } else {
          monthlyMap[item.bulan]['Lainnya'] += item._sum[mataUangKey] || 0;
        }
      }
    });

    const series = [];
    const legendData = [...top5_names, 'Lainnya'];
    legendData.forEach(name => {
      series.push({
        name: name,
        type: 'line',
        smooth: true,
        data: MONTHS.map(m => monthlyMap[m][name] || 0)
      });
    });

    return {
      tooltip: { trigger: 'axis', valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: legendData, bottom: 0, textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } },
      yAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
      series
    };
  }, [stats, mataUangKey, mataUangFilter]);

  const groupedBarOption = useMemo(() => {
    const volumeLabel = `Volume (${satuanFilter.toUpperCase()})`;

    const volumeData = MONTHS.map(m => {
      const filtered = stats.monthly_data_raw.filter(x => {
        if (x.bulan !== m || x.kategori_komoditas !== agregatFilter) return false;
        return (x.satuan_volume || '').toUpperCase() === satuanFilter.toUpperCase();
      });
      return filtered.reduce((acc, curr) => acc + (curr._sum.volume || 0), 0);
    });

    const valueData = MONTHS.map(m => {
      const filtered = stats.monthly_data_raw.filter(x => {
        if (x.bulan !== m || x.kategori_komoditas !== agregatFilter) return false;
        return (x.satuan_volume || '').toUpperCase() === satuanFilter.toUpperCase();
      });
      return filtered.reduce((acc, curr) => acc + (curr._sum[mataUangKey] || 0), 0);
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: [volumeLabel, `Nilai (${mataUangFilter})`], top: 0, right: '4%', textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', top: '15%', bottom: '2%', containLabel: true },
      xAxis: [{ type: 'category', data: MONTHS, axisPointer: { type: 'shadow' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } }],
      yAxis: [
        { type: 'value', name: volumeLabel, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: '{value}', color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
        { type: 'value', name: `Nilai (${mataUangPrefix})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: `${mataUangPrefix}{value}`, color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { show: false } }
      ],
      series: [
        { name: volumeLabel, type: 'bar', itemStyle: { color: '#8b5cf6' }, data: volumeData },
        { name: `Nilai (${mataUangFilter})`, type: 'bar', yAxisIndex: 1, itemStyle: { color: '#f59e0b' }, data: valueData }
      ]
    };
  }, [stats.monthly_aggregate, stats.monthly_data_raw, agregatFilter, satuanFilter, mataUangFilter, mataUangKey, mataUangPrefix]);

  const rankingOption = useMemo(() => {
    const sorted = [...stats.ranking_komoditas]
      .sort((a, b) => (a._sum[mataUangKey] || 0) - (b._sum[mataUangKey] || 0))
      .slice(-10);
    const categories = sorted.map(i => i.nama_komoditas);
    const values = sorted.map(i => i._sum[mataUangKey] || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', interval: 0, width: 100, overflow: 'truncate' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#ec4899', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  }, [stats.ranking_komoditas, mataUangKey, mataUangFilter, mataUangPrefix]);

  const negaraOption = useMemo(() => {
    const sorted = [...stats.negara_tujuan]
      .sort((a, b) => (a._sum[mataUangKey] || 0) - (b._sum[mataUangKey] || 0))
      .slice(-10);
    const categories = sorted.map(i => i.negara_tujuan);
    const values = sorted.map(i => i._sum[mataUangKey] || 0);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  }, [stats.negara_tujuan, mataUangKey, mataUangFilter, mataUangPrefix]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Visualisasi Data Ekspor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Ekspor Perikanan</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data kegiatan ekspor hasil kelautan dan perikanan Jawa Timur.
          </p>
        </div>
        <div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer shadow-sm"
          >
            <option value="">Semua Tahun</option>
            {TAHUN_OPTIONS.map(tahun => (
              <option key={tahun} value={tahun}>{tahun}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg/PCS</span>
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Nilai Ekspor</p>
            <p className="text-2xl font-bold text-foreground">
              {mataUangPrefix}{(stats.kpi[mataUangFilter === 'RP' ? 'total_nilai_rp' : 'total_nilai'] || stats.kpi.total_nilai || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Top Negara Tujuan</p>
            <p className="text-2xl font-bold text-foreground break-words line-clamp-2">
              {stats.negara_tujuan && stats.negara_tujuan.length > 0 ? stats.negara_tujuan[0].negara_tujuan : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Treemap & Bar Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Box className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Komposisi Nilai Ekspor per Komoditas</h3>
          </div>
          {stats.treemap && stats.treemap.length > 0 ? (
            <ReactECharts option={treemapOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-foreground">Ranking Komoditas Berdasarkan Nilai</h3>
          </div>
          {stats.ranking_komoditas && stats.ranking_komoditas.length > 0 ? (
            <ReactECharts option={rankingOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Line Chart Tren Top 5 */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-foreground">Top 5 Komoditas Dengan Tren Nilai Ekspor Bulanan</h3>
        </div>
        {stats.monthly_data_raw && stats.monthly_data_raw.length > 0 ? (
          <ReactECharts option={lineChartOption} style={{ height: '450px', width: '100%' }} />
        ) : (
          <div className="h-[450px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
            Belum ada data
          </div>
        )}
      </div>

      {/* Row 3: Grouped Bar & Negara Tujuan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-foreground">Agregat Nilai dan Volume</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={agregatFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setAgregatFilter(val);
                  setSatuanFilter(val === 'Segar dan Olahan' ? 'KG' : 'PCS');
                }}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Segar dan Olahan">Segar & Olahan</option>
                <option value="Hidup">Hidup</option>
              </select>
              {agregatFilter === 'Segar dan Olahan' && (
                <select
                  value={satuanFilter}
                  onChange={(e) => setSatuanFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="KG">KG</option>
                  <option value="LITER">Liter</option>
                </select>
              )}
              {agregatFilter === 'Hidup' && (
                <select
                  value={satuanFilter}
                  onChange={(e) => setSatuanFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="PCS">PCS</option>
                  <option value="EKOR">Ekor</option>
                  <option value="BATANG">Batang</option>
                </select>
              )}
            </div>
          </div>
          {stats.monthly_aggregate && stats.monthly_aggregate.length > 0 ? (
            <ReactECharts option={groupedBarOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-semibold text-foreground">Ranking Negara Tujuan</h3>
          </div>
          {stats.negara_tujuan && stats.negara_tujuan.length > 0 ? (
            <ReactECharts option={negaraOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Laporan Ekspor</h3>
          </div>
          <p className="text-sm text-muted-foreground">Tabel di bawah ini dapat dicari, diurutkan, dan diekspor ke Excel.</p>
        </div>
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="">Semua Tahun</option>
              {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="">Semua Bulan</option>
              {bulanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="">Semua Komoditas</option>
              {komoditasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={filterNegara} onChange={(e) => setFilterNegara(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="">Semua Negara Tujuan</option>
              {negaraOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={mataUangFilter} onChange={(e) => setMataUangFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
              <option value="USD">USD ($)</option>
              <option value="RP">Rupiah (Rp)</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
          exportName={`Ekspor_Samudera_${new Date().toISOString().split('T')[0]}`}
          formatExportData={(exportData) => exportData.map(row => ({
            'Status': row.status || '-',
            'Bulan': row.bulan || '-',
            'Tahun': row.tahun || '-',
            'Kategori Komoditas': row.kategori_komoditas || '-',
            'Nama Komoditas': row.nama_komoditas || '-',
            'Volume': row.volume || '-',
            'Satuan Volume': row.satuan_volume || '-',
            'Nilai (USD)': row.nilai_usd || '-',
            'Nilai (Rp)': row.nilai_rp || '-',
            'Negara Tujuan': row.negara_tujuan || '-'
          }))}
        />
      </div>
      </div>

    </div>
  );
}
