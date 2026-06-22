import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { Loader2, Ship, Anchor, Database, TrendingUp } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatDate } from '@/utils/dateHelper';

export default function PerikananTangkap() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    kpi: {
      total_volume: 0,
      total_nilai: 0,
      total_trip: 0,
      avg_volume_per_trip: 0
    },
    komoditas: [],
    pelabuhan: [],
    tren: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both raw data for table and stats for KPI/Charts concurrently
      const [dataRes, statsRes] = await Promise.all([
        api.get('/perikanan-tangkap'),
        api.get('/perikanan-tangkap/stats')
      ]);

      setData(dataRes.data.data);
      if (statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Columns for public DataTable
  const columns = useMemo(() => [
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      cell: info => formatDate(info.getValue())
    },
    {
      header: 'Kapal',
      accessorKey: 'nama_kapal',
      cell: info => (
        <div>
          <p className="font-medium text-foreground">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.gt_kapal}</p>
        </div>
      )
    },
    {
      header: 'Pelabuhan',
      accessorKey: 'pelabuhan'
    },
    {
      header: 'Alat Tangkap',
      accessorKey: 'alat_tangkap'
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
      header: 'Nilai Produksi',
      accessorKey: 'nilai',
      cell: info => formatRupiah(info.getValue())
    }
  ], []);

  // ECharts Option for Komoditas (Bar Chart)
  const komoditasChartOption = useMemo(() => {
    const categories = stats.komoditas.map(item => item.komoditas);
    const values = stats.komoditas.map(item => item._sum.volume || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'Volume (Kg)',
        nameTextStyle: { color: '#888' },
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#666', fontWeight: 500 }
      },
      series: [
        {
          name: 'Volume',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#3b82f6', // Tailwind blue-500
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c} Kg'
          }
        }
      ]
    };
  }, [stats.komoditas]);

  // ECharts Option for Pelabuhan (Bar Chart)
  const pelabuhanChartOption = useMemo(() => {
    const categories = stats.pelabuhan.map(item => item.pelabuhan);
    const values = stats.pelabuhan.map(item => item._sum.volume || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: 'Volume (Kg)' },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#666', fontWeight: 500 } },
      series: [
        {
          name: 'Volume',
          type: 'bar',
          data: values,
          itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', formatter: '{c} Kg' }
        }
      ]
    };
  }, [stats.pelabuhan]);

  // ECharts Option for Tren Harian (Line Chart with DataZoom)
  const trenChartOption = useMemo(() => {
    const dates = stats.tren.map(t => t.date);
    const volumes = stats.tren.map(t => t.volume);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = params[0].name;
          const vol = params[0].value.toLocaleString('id-ID');
          return `<b>${date}</b><br/>Volume: ${vol} Kg`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value', name: 'Volume (Kg)' },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { start: 0, end: 100 }
      ],
      series: [
        {
          name: 'Volume',
          type: 'line',
          data: volumes,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#8b5cf6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }]
            }
          }
        }
      ]
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
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Perikanan Tangkap</h1>
        <p className="text-muted-foreground mt-1">
          Visualisasi data produksi harian perikanan tangkap pelabuhan secara publik.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Volume */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Nilai */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Nilai Produksi</p>
            <p className="text-2xl font-bold text-foreground">
              {formatRupiah(stats.kpi.total_nilai)}
            </p>
          </div>
        </div>

        {/* Card 3: Jumlah Trip */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Pendaratan</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_trip.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Trip</span>
            </p>
          </div>
        </div>

        {/* Card 4: Rata-rata Volume */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rata-rata Volume</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.avg_volume_per_trip.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-muted-foreground">Kg/Trip</span>
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Komoditas */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Volume Berdasarkan Komoditas</h3>
          {stats.komoditas.length > 0 ? (
            <ReactECharts option={komoditasChartOption} style={{ height: '350px', width: '100%' }} />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Belum ada data
            </div>
          )}
        </div>

        {/* Chart Pelabuhan */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Volume Berdasarkan Pelabuhan</h3>
          {stats.pelabuhan.length > 0 ? (
            <ReactECharts option={pelabuhanChartOption} style={{ height: '350px', width: '100%' }} />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Line Chart Tren */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Tren Volume Pendaratan Harian</h3>
        <p className="text-sm text-muted-foreground mb-4">Anda dapat melakukan *scroll/zoom* pada grafik di bawah ini untuk data yang besar.</p>
        {stats.tren.length > 0 ? (
          <ReactECharts option={trenChartOption} style={{ height: '400px', width: '100%' }} />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            Belum ada tren data
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Rincian Data Pendaratan</h3>
          <p className="text-sm text-muted-foreground">Tabel di bawah ini dapat dicari, diurutkan, dan diekspor ke Excel.</p>
        </div>
        
        <DataTable 
          columns={columns} 
          data={data}
          // Perhatikan bahwa kita TIDAK MENGIRIM props onEdit dan onDelete ke sini,
          // sehingga tombol Aksi Admin tidak akan muncul di halaman publik ini.
        />
      </div>

    </div>
  );
}
