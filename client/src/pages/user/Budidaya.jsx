import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, TrendingUp, MapPin, Fish, FileText, Box, LineChart, Download, X } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';

// Register the East Java map
echarts.registerMap('jawa_timur', geoJsonData);

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export default function Budidaya() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [stats, setStats] = useState({
    produksiPerKabupaten: [],
    trenBulanan: [],
    top5Wadah: [],
    komposisiWadah: [],
    heatmapData: [],
    kpi: { total_volume: 0, top_komoditas: '-', total_nilai: 0 }
  });

  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterKabupaten, setFilterKabupaten] = useState('');
  const [filterWadah, setFilterWadah] = useState('');
  const [filterTw, setFilterTw] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [barFilter, setBarFilter] = useState('produksi');
  
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState(currentYear.toString());
  const [exportLoading, setExportLoading] = useState(false);

  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.komoditas))].filter(Boolean).sort(), [data]);
  const kabupatenOptions = useMemo(() => [...new Set(data.map(d => d.kabupaten_kota))].filter(Boolean).sort(), [data]);
  const wadahOptions = useMemo(() => [...new Set(data.map(d => d.jenis_wadah))].filter(Boolean).sort(), [data]);
  const twOptions = useMemo(() => [...new Set(data.map(d => d.triwulan))].filter(Boolean).sort(), [data]);
  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterKomoditas && item.komoditas !== filterKomoditas) return false;
      if (filterKabupaten && item.kabupaten_kota !== filterKabupaten) return false;
      if (filterWadah && item.jenis_wadah !== filterWadah) return false;
      if (filterTw && item.triwulan !== filterTw) return false;
      if (filterBulan && item.bulan !== filterBulan) return false;
      if (filterTahun && item.tahun !== filterTahun) return false;
      return true;
    });
  }, [data, filterKomoditas, filterKabupaten, filterWadah, filterTw, filterBulan, filterTahun]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedYear) params.append('tahun', selectedYear);
        if (selectedBulan) params.append('bulan', selectedBulan);

        const query = `?${params.toString()}`;

        const [dataRes, statsRes] = await Promise.all([
          api.get(`/budidaya${query}`),
          api.get(`/budidaya/stats${query}`)
        ]);

        if (dataRes.data.success) {
          setData(dataRes.data.data);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedBulan]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue();
        const alasan = info.row.original.alasan_penolakan;
        let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        let label = 'PENDING';
        if (status === 'APPROVED') {
          colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
          label = 'APPROVED';
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
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan', cell: info => (<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{info.getValue()}</span>) },
    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
    { header: 'Kategori Komoditas', accessorKey: 'kategori_komoditas' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    { header: 'Jenis Wadah', accessorKey: 'jenis_wadah', cell: info => (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{info.getValue()}</span>) },
    { header: 'Produksi (KG)', accessorKey: 'produksi_kg', cell: info => (info.getValue() || 0).toLocaleString('id-ID') },
    { header: 'Harga (Rp)', accessorKey: 'harga_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val); } },
    { header: 'Nilai Total (Rp)', accessorKey: 'nilai_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val); } }
  ], []);

  // 1. Peta Choropleth Jawa Timur (Log Scale)
  const mapOption = useMemo(() => {
    const mapData = stats.produksiPerKabupaten.map(item => ({
      name: item.name,
      value: item.produksi
    }));

    // Find max value to set visualMap (Sumenep dominates, so use log scale or piecewise)
    const maxVal = mapData.length > 0 ? Math.max(...mapData.map(d => d.value)) : 0;

    return {
      title: {
        text: 'Produksi Budidaya per Kabupaten/Kota',
        textStyle: { color: '#e2e8f0', fontSize: 16, fontFamily: 'Inter' },
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const val = params.value || 0;
          return `${params.name}<br/>Total Produksi: <b>${val.toLocaleString('id-ID')} KG</b>`;
        }
      },
      visualMap: {
        left: 'right',
        min: 1, // log mapping doesn't like 0
        max: maxVal || 100,
        inRange: {
          color: ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#34d399']
        },
        text: ['Tinggi', 'Rendah'],
        textStyle: { color: '#94a3b8' },
        calculable: true,
        type: 'piecewise',
        splitNumber: 5 // easier to see differences
      },
      series: [
        {
          name: 'Produksi Budidaya',
          type: 'map',
          map: 'jawa_timur',
          roam: true,
          label: {
            show: false,
            color: '#fff'
          },
          emphasis: {
            label: { show: true, color: '#fff' },
            itemStyle: { areaColor: '#f59e0b' }
          },
          itemStyle: {
            areaColor: '#1e293b',
            borderColor: '#334155'
          },
          data: mapData
        }
      ]
    };
  }, [stats.produksiPerKabupaten]);

  // 2. Bar Chart Top Kabupaten
  const barOption = useMemo(() => {
    // Sort based on barFilter and get Top 10
    const sortedData = [...stats.produksiPerKabupaten].sort((a, b) => b[barFilter] - a[barFilter]);
    const top10 = sortedData.slice(0, 10).reverse();

    const isProduksi = barFilter === 'produksi';
    const seriesName = isProduksi ? 'Produksi (KG)' : 'Nilai Total (Rp)';
    const formatter = isProduksi ?
      val => val.toLocaleString('id-ID') + ' KG' :
      val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const val = params[0].value || 0;
          return `${params[0].name}<br/>${seriesName}: <b>${formatter(val)}</b>`;
        }
      },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          formatter: (val) => {
            if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T';
            if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M';
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'rb';
            return val;
          }
        }
      },
      yAxis: {
        type: 'category',
        data: top10.map(d => d.name),
        axisLabel: { color: '#cbd5e1', fontSize: 11 }
      },
      series: [
        {
          name: seriesName,
          type: 'bar',
          data: top10.map(d => d[barFilter]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#0ea5e9' },
              { offset: 1, color: '#2563eb' }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };
  }, [stats.produksiPerKabupaten, barFilter]);

  // 3. Line Chart Tren Bulanan
  const lineOption = useMemo(() => {
    const seriesData = stats.top5Wadah.map(wadah => ({
      name: wadah,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: stats.trenBulanan.map(m => m[wadah] || 0)
    }));

    // Add Lainnya
    seriesData.push({
      name: 'Lainnya',
      type: 'line',
      smooth: true,
      lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' },
      itemStyle: { color: '#94a3b8' },
      symbol: 'none',
      data: stats.trenBulanan.map(m => m.Lainnya || 0)
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [...stats.top5Wadah, 'Lainnya'],
        textStyle: { color: '#cbd5e1' },
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: MONTHS,
        axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: seriesData
    };
  }, [stats.trenBulanan, stats.top5Wadah]);

  // 4. Treemap Komposisi Wadah
  const treemapOption = useMemo(() => {
    const data = stats.komposisiWadah.map(w => ({
      name: w.name,
      value: w.value
    }));

    return {
      tooltip: {
        formatter: (info) => {
          const val = info.value || 0;
          return `<b>${info.name}</b><br/>Total Produksi: ${val.toLocaleString('id-ID')} KG`;
        }
      },
      series: [{
        type: 'treemap',
        width: '100%',
        height: '100%',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, formatter: '{b}\n\n{c} KG', color: '#fff', fontWeight: 'bold' },
        itemStyle: { borderColor: '#0f172a', gapWidth: 2 },
        data: data,
        colorMappingBy: 'value',
        visualMap: {
          show: false,
          inRange: {
            color: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4']
          }
        }
      }]
    };
  }, [stats.komposisiWadah]);

  // 5. Heatmap Kabupaten x Bulan
  const heatmapOption = useMemo(() => {
    // ECharts heatmap requires data as [xIndex, yIndex, value]
    const yAxisData = [...new Set(stats.heatmapData.map(d => d.kabupaten))].sort();
    const xAxisData = MONTHS;

    const dataPairs = [];
    const tooltipRawData = {};

    stats.heatmapData.forEach(item => {
      const xIndex = xAxisData.indexOf(item.bulan);
      const yIndex = yAxisData.indexOf(item.kabupaten);
      if (xIndex !== -1 && yIndex !== -1) {
        dataPairs.push([xIndex, yIndex, item.normalized]);
        tooltipRawData[`${xIndex}-${yIndex}`] = item.produksi;
      }
    });

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const xIndex = params.data[0];
          const yIndex = params.data[1];
          const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0;
          return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Produksi: ${rawValue.toLocaleString('id-ID')} KG`;
        }
      },
      grid: { left: '15%', right: '2%', top: '5%', bottom: '15%' },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: { show: true },
        axisLabel: { color: '#cbd5e1', rotate: 45 }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: { show: true },
        axisLabel: { color: '#cbd5e1', fontSize: 10 }
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#0f172a', '#3b82f6', '#2dd4bf', '#fde047', '#f43f5e']
        },
        textStyle: { color: '#cbd5e1' },
        formatter: (value) => value.toFixed(1)
      },
      series: [{
        name: 'Heatmap',
        type: 'heatmap',
        data: dataPairs,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [stats.heatmapData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Budidaya Perikanan</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer shadow-sm"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer shadow-sm"
          >
            <option value="">Semua Tahun</option>
            {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">KG</span>
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Komoditas</p>
                <p className="text-xl font-bold text-foreground leading-tight">
                  {stats.kpi.top_komoditas}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Nilai Budidaya</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.kpi.total_nilai)}
                </p>
              </div>
            </div>
          </div>

          {/* Top Visualizations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Peta Sebaran Produksi</h2>
              </div>
              <div className="h-[450px]">
                <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Top 10 Kab/Kota</h2>
                </div>
                <select
                  value={barFilter}
                  onChange={(e) => setBarFilter(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200"
                >
                  <option value="produksi">Produksi (KG)</option>
                  <option value="nilai">Nilai Total (Rp)</option>
                </select>
              </div>
              <div className="h-[450px]">
                <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Middle Visualizations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <h2 className="text-lg font-semibold">Tren Produksi Bulanan</h2>
              </div>
              <div className="h-[350px]">
                <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Fish className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Komposisi Jenis Wadah</h2>
              </div>
              <div className="h-[350px]">
                <ReactECharts option={treemapOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Heatmap Row */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold">Pola Musiman per Wilayah </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Warna merepresentasikan intensitas produksi relatif terhadap titik tertinggi masing-masing kabupaten. Hover untuk melihat angka tonase.
            </p>
            <div className="h-[600px]">
              <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <h3 className="text-lg font-semibold text-foreground">Rincian Data Produksi Budidaya</h3>
                </div>
                <p className="text-sm text-muted-foreground">Tabel di bawah ini dapat dicari, diurutkan, dan diekspor ke Excel.</p>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Ekspor Ringkasan Wadah
              </button>
            </div>

            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Tahun</option>
                  {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filterTw} onChange={(e) => setFilterTw(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Triwulan</option>
                  {twOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Bulan</option>
                  {bulanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filterKabupaten} onChange={(e) => setFilterKabupaten(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Kab/Kota</option>
                  {kabupatenOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Komoditas</option>
                  {komoditasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={filterWadah} onChange={(e) => setFilterWadah(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm">
                  <option value="">Semua Wadah</option>
                  {wadahOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <DataTable
                columns={columns}
                data={filteredData}
                exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
                formatExportData={(exportData) => exportData.map(row => ({
                  'Status': row.status,
                  'Tahun': row.tahun,
                  'Bulan': row.bulan,
                  'Triwulan': row.triwulan,
                  'Kabupaten/Kota': row.kabupaten_kota,
                  'Kategori Komoditas': row.kategori_komoditas,
                  'Komoditas': row.komoditas,
                  'Jenis Wadah': row.jenis_wadah,
                  'Produksi (KG)': row.produksi_kg,
                  'Harga (Rp)': row.harga_rp,
                  'Nilai Total (Rp)': row.nilai_rp
                }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Ekspor Ringkasan Wadah</h3>
              <button onClick={() => setShowExportModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pilih Tahun Ekspor</label>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                >
                  {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                File Excel akan berisikan rekapitulasi jumlah produksi berdasarkan wadah untuk semua kabupaten/kota pada tahun yang dipilih.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  disabled={exportLoading}
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    try {
                      setExportLoading(true);
                      const response = await api.get(`/budidaya/export-wadah?tahun=${exportYear}`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `data_produksi_perikanan_${exportYear}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      setShowExportModal(false);
                    } catch (error) {
                      console.error(error);
                      alert('Gagal mengunduh file.');
                    } finally {
                      setExportLoading(false);
                    }
                  }}
                  disabled={exportLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exportLoading ? 'Mengunduh...' : 'Unduh Excel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
