import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, TrendingUp, MapPin, Fish, FileText } from 'lucide-react';
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
  const [selectedTriwulan, setSelectedTriwulan] = useState('');
  const [stats, setStats] = useState({
    produksiPerKabupaten: [],
    trenBulanan: [],
    top5Kab: [],
    komposisiWadah: [],
    heatmapData: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear) params.append('tahun', selectedYear);
      if (selectedTriwulan) params.append('triwulan', selectedTriwulan);
      
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

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedTriwulan]);

  const columns = useMemo(() => [
    {
      header: 'Tahun',
      accessorKey: 'tahun'
    },
    {
      header: 'Bulan',
      accessorKey: 'bulan'
    },
    {
      header: 'Triwulan',
      accessorKey: 'triwulan',
      cell: info => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Kabupaten/Kota',
      accessorKey: 'kabupaten_kota',
      cell: info => <p className="font-medium text-foreground">{info.getValue()}</p>
    },
    {
      header: 'Jenis Wadah',
      accessorKey: 'jenis_wadah',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Produksi (Ton)',
      accessorKey: 'produksi_ton',
      cell: info => info.getValue().toLocaleString('id-ID')
    }
  ], []);

  // 1. Peta Choropleth Jawa Timur (Log Scale)
  const mapOption = useMemo(() => {
    const mapData = stats.produksiPerKabupaten.map(item => ({
      name: item.name,
      value: item.value
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
          return `${params.name}<br/>Total Produksi: <b>${val.toLocaleString('id-ID')} Ton</b>`;
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
    // Top 10 to fit in the chart
    const top10 = [...stats.produksiPerKabupaten].slice(0, 10).reverse();
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'category',
        data: top10.map(d => d.name),
        axisLabel: { color: '#cbd5e1', fontSize: 11 }
      },
      series: [
        {
          name: 'Produksi (Ton)',
          type: 'bar',
          data: top10.map(d => d.value),
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
  }, [stats.produksiPerKabupaten]);

  // 3. Line Chart Tren Bulanan
  const lineOption = useMemo(() => {
    const seriesData = stats.top5Kab.map(kab => ({
      name: kab,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: stats.trenBulanan.map(m => m[kab] || 0)
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
        data: [...stats.top5Kab, 'Lainnya'],
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
  }, [stats.trenBulanan, stats.top5Kab]);

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
          return `<b>${info.name}</b><br/>Total Produksi: ${val.toLocaleString('id-ID')} Ton`;
        }
      },
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, formatter: '{b}\n\n{c} Ton', color: '#fff', fontWeight: 'bold' },
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
          return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Produksi: ${rawValue.toLocaleString('id-ID')} Ton`;
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
          <p className="text-muted-foreground mt-1">
            Data produksi dan sebaran budidaya perikanan per wilayah dan waktu.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedTriwulan}
            onChange={(e) => setSelectedTriwulan(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer shadow-sm"
          >
            <option value="">Semua Triwulan</option>
            <option value="TW 1">TW 1 (Jan-Mar)</option>
            <option value="TW 2">TW 2 (Apr-Jun)</option>
            <option value="TW 3">TW 3 (Jul-Sep)</option>
            <option value="TW 4">TW 4 (Okt-Des)</option>
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
          {/* Top Visualizations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Peta Sebaran Produksi</h2>
              </div>
              <div className="h-[450px]">
                <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Top Kabupaten/Kota</h2>
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
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">Rincian Data Produksi Budidaya</h3>
              </div>
              <p className="text-sm text-muted-foreground">Tabel di bawah ini dapat dicari, diurutkan, dan diekspor ke Excel.</p>
            </div>
            <DataTable 
              columns={columns} 
              data={data}
              exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
              formatExportData={(exportData) => exportData.map(row => ({
                'Tahun': row.tahun,
                'Bulan': row.bulan,
                'Triwulan': row.triwulan,
                'Kabupaten/Kota': row.kabupaten_kota,
                'Jenis Wadah': row.jenis_wadah,
                'Produksi (Ton)': row.produksi_ton
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
