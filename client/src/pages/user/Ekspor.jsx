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
      cell: info => `$${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
      .sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd)
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum.nilai_usd,
        itemStyle: { color: blueGradient[index % blueGradient.length] }
      }));

    const hidup = stats.treemap
      .filter(t => t.kategori_komoditas === 'Hidup')
      .sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd)
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum.nilai_usd,
        itemStyle: { color: greenGradient[index % greenGradient.length] }
      }));

    return {
      tooltip: {
        formatter: (info) => {
          const value = info.value;
          const treePath = info.treePathInfo;
          if (!treePath || treePath.length <= 1) return '';
          const pathStr = treePath.map(t => t.name).slice(1).join(' - ');
          return `<b>${pathStr}</b><br/>Nilai: $${value.toLocaleString('en-US')}`;
        }
      },
      series: [{
        type: 'treemap',
        roam: false,
        label: { show: true, formatter: '{b}', color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
        breadcrumb: {
          show: true,
          itemStyle: { color: '#0f172a', textStyle: { color: '#06b6d4', fontSize: 13, fontWeight: 'bold' } },
          textStyle: { color: '#06b6d4', fontSize: 13, fontWeight: 'bold' }
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
      }]
    };
  }, [stats.treemap]);

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
          monthlyMap[item.bulan][item.nama_komoditas] += item._sum.nilai_usd || 0;
        } else {
          monthlyMap[item.bulan]['Lainnya'] += item._sum.nilai_usd || 0;
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
      tooltip: { trigger: 'axis' },
      legend: { data: legendData, bottom: 0, textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } },
      yAxis: { type: 'value', name: 'Nilai (USD)', nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
      series
    };
  }, [stats]);

  const groupedBarOption = useMemo(() => {
    const volumeData = MONTHS.map(m => {
      const found = stats.monthly_aggregate.find(x => x.bulan === m);
      return found ? found._sum.volume : 0;
    });
    const valueData = MONTHS.map(m => {
      const found = stats.monthly_aggregate.find(x => x.bulan === m);
      return found ? found._sum.nilai_usd : 0;
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Volume (Kg)', 'Nilai (USD)'], bottom: 0, textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: [{ type: 'category', data: MONTHS, axisPointer: { type: 'shadow' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } }],
      yAxis: [
        { type: 'value', name: 'Volume', nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: '{value}', color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
        { type: 'value', name: 'Nilai ($)', nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: '${value}', color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { show: false } }
      ],
      series: [
        { name: 'Volume (Kg)', type: 'bar', itemStyle: { color: '#8b5cf6' }, data: volumeData },
        { name: 'Nilai (USD)', type: 'bar', yAxisIndex: 1, itemStyle: { color: '#f59e0b' }, data: valueData }
      ]
    };
  }, [stats.monthly_aggregate]);

  const rankingOption = useMemo(() => {
    const sorted = [...stats.ranking_komoditas].sort((a, b) => a._sum.nilai_usd - b._sum.nilai_usd);
    const categories = sorted.map(i => i.nama_komoditas);
    const values = sorted.map(i => i._sum.nilai_usd);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '20%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Nilai (USD)', nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', interval: 0, width: 100, overflow: 'truncate' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#ec4899', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => `$${(params.value / 1000).toFixed(1)}k` }
        }
      ]
    };
  }, [stats.ranking_komoditas]);

  const negaraOption = useMemo(() => {
    const sorted = [...stats.negara_tujuan].sort((a, b) => a._sum.nilai_usd - b._sum.nilai_usd);
    const categories = sorted.map(i => i.negara_tujuan);
    const values = sorted.map(i => i._sum.nilai_usd);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '20%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', name: 'Nilai (USD)', nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => `$${(params.value / 1000).toFixed(1)}k` }
        }
      ]
    };
  }, [stats.negara_tujuan]);

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
              ${stats.kpi.total_nilai.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Top Negara Tujuan</p>
            <p className="text-2xl font-bold text-foreground truncate max-w-[150px]">
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
            <ReactECharts option={treemapOption} style={{ height: '400px', width: '100%' }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
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
            <ReactECharts option={rankingOption} style={{ height: '400px', width: '100%' }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-foreground">Agregat Bulanan: Nilai dan Volume</h3>
          </div>
          {stats.monthly_aggregate && stats.monthly_aggregate.length > 0 ? (
            <ReactECharts option={groupedBarOption} style={{ height: '400px', width: '100%' }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <h3 className="text-lg font-semibold text-foreground mb-4 mt-2">Ranking Negara Tujuan</h3>
          {stats.negara_tujuan && stats.negara_tujuan.length > 0 ? (
            <ReactECharts option={negaraOption} style={{ height: '400px', width: '100%' }} />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground/50 bg-transparent rounded-xl border border-dashed border-border/50">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
          exportName={`Ekspor_Samudera_${new Date().toISOString().split('T')[0]}`}
          formatExportData={(exportData) => exportData.map(row => ({
            'Bulan': row.bulan,
            'Tahun': row.tahun,
            'Kategori Komoditas': row.kategori_komoditas,
            'Nama Komoditas': row.nama_komoditas,
            'Volume': row.volume,
            'Satuan Volume': row.satuan_volume,
            'Nilai (USD)': row.nilai_usd,
            'Negara Tujuan': row.negara_tujuan
          }))}
        />
      </div>
      </div>

    </div>
  );
}
