import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { FileText, TrendingUp, Download, BarChart3, Clock, Loader2, MapPin, Fish, Box, LineChart, X, ChevronDown } from 'lucide-react';
import { formatUangPendek } from '@/utils/formatRupiah';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';
import { useThemeStore } from '@/store/themeStore';

// Register the East Java map
echarts.registerMap('jawa_timur', geoJsonData);

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export default function Budidaya() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const chartText = isDark ? '#e2e8f0' : '#0f172a';
  const chartSubText = isDark ? '#cbd5e1' : '#1e293b';
  const chartAxisLabel = isDark ? '#94a3b8' : '#334155';
  const chartGridLine = isDark ? '#334155' : '#cbd5e1';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('-');

  const [filterKomoditas, setFilterKomoditas] = useState([]);
  const [filterKabupaten, setFilterKabupaten] = useState([]);
  const [filterWadah, setFilterWadah] = useState([]);
  const [filterBulan, setFilterBulan] = useState([]);
  const [filterTahun, setFilterTahun] = useState([]);

  const [filterTableKomoditas, setFilterTableKomoditas] = useState([]);
  const [filterTableKabupaten, setFilterTableKabupaten] = useState([]);
  const [filterTableWadah, setFilterTableWadah] = useState([]);
  const [filterTableBulan, setFilterTableBulan] = useState([]);
  const [filterTableTahun, setFilterTableTahun] = useState([]);

  const [visualisasiTipe, setVisualisasiTipe] = useState('produksi');
  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
  const [exportType, setExportType] = useState('wadah');
  const [exportLoading, setExportLoading] = useState(false);

  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.komoditas))].filter(Boolean).sort(), [data]);
  const kabupatenOptions = useMemo(() => [...new Set(data.map(d => d.kabupaten_kota))].filter(Boolean).sort(), [data]);
  const wadahOptions = useMemo(() => [...new Set(data.map(d => d.jenis_wadah))].filter(Boolean).sort(), [data]);
  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);

  const matchMultiFilter = (filterArr, val, isCaseInsensitive = false) => {
    if (!filterArr || (Array.isArray(filterArr) && filterArr.length === 0)) return true;
    if (!Array.isArray(filterArr)) {
      return isCaseInsensitive
        ? String(filterArr).toUpperCase() === String(val || '').toUpperCase()
        : String(filterArr) === String(val);
    }
    return isCaseInsensitive
      ? filterArr.some(f => String(f).toUpperCase() === String(val || '').toUpperCase())
      : filterArr.some(f => String(f) === String(val));
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!matchMultiFilter(filterKomoditas, item.komoditas)) return false;
      if (!matchMultiFilter(filterKabupaten, item.kabupaten_kota)) return false;
      if (!matchMultiFilter(filterWadah, item.jenis_wadah)) return false;
      if (!matchMultiFilter(filterBulan, item.bulan)) return false;
      if (!matchMultiFilter(filterTahun, item.tahun?.toString())) return false;
      return true;
    });
  }, [data, filterKomoditas, filterKabupaten, filterWadah, filterBulan, filterTahun]);

  const filteredTableData = useMemo(() => {
    return data.filter(item => {
      if (!matchMultiFilter(filterTableKomoditas, item.komoditas)) return false;
      if (!matchMultiFilter(filterTableKabupaten, item.kabupaten_kota)) return false;
      if (!matchMultiFilter(filterTableWadah, item.jenis_wadah)) return false;
      if (!matchMultiFilter(filterTableBulan, item.bulan)) return false;
      if (!matchMultiFilter(filterTableTahun, item.tahun?.toString())) return false;
      return true;
    });
  }, [data, filterTableKomoditas, filterTableKabupaten, filterTableWadah, filterTableBulan, filterTableTahun]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/budidaya');
        if (res.data.success) {
          const list = res.data.data || [];
          setData(list);
          if (list.length > 0) {
            const latest = list.reduce((a, b) =>
              new Date(a.updated_at || a.created_at || 0) > new Date(b.updated_at || b.created_at || 0) ? a : b
            );
            const updatedAt = new Date(latest.updated_at || latest.created_at);
            const datePart = updatedAt.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const timePart = updatedAt
              .toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
              .replace(':', '.');
            setLastUpdated(`${datePart} ${timePart}`);
          } else {
            setLastUpdated('-');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    const kabMap = {};
    const wadahMap = {};
    const heatmapRaw = {};

    filteredData.forEach(item => {
      const vol = Number(item.produksi_kg) || 0;
      const nilai = Number(item.nilai_rp) || 0;

      total_volume += vol;
      total_nilai += nilai;

      if (item.komoditas) {
        komoditasMap[item.komoditas] = (komoditasMap[item.komoditas] || 0) + vol;
      }

      const kab = item.kabupaten_kota || 'Tidak Diketahui';
      if (!kabMap[kab]) kabMap[kab] = { produksi: 0, nilai: 0 };
      kabMap[kab].produksi += vol;
      kabMap[kab].nilai += nilai;

      if (item.jenis_wadah) {
        if (!wadahMap[item.jenis_wadah]) wadahMap[item.jenis_wadah] = { produksi: 0, nilai: 0 };
          wadahMap[item.jenis_wadah].produksi += vol;
          wadahMap[item.jenis_wadah].nilai += nilai;
      }

      if (!heatmapRaw[kab]) {
        heatmapRaw[kab] = MONTHS.map(b => ({ bulan: b, produksi: 0, nilai: 0 }));
      }
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex !== -1) {
        heatmapRaw[kab][bIndex].produksi += vol;
        heatmapRaw[kab][bIndex].nilai += nilai;
      }
    });

    let top_komoditas = '-';
    let maxKomoditasProd = 0;
    for (const [kom, prod] of Object.entries(komoditasMap)) {
      if (prod > maxKomoditasProd) {
        maxKomoditasProd = prod;
        top_komoditas = kom;
      }
    }

    let top_kabupaten = '-';
    let maxKabupatenProd = 0;
    for (const [kab, s] of Object.entries(kabMap)) {
      if (s.produksi > maxKabupatenProd) {
        maxKabupatenProd = s.produksi;
        top_kabupaten = kab;
      }
    }

    const produksiPerKabupaten = Object.entries(kabMap)
      .map(([name, s]) => ({ name, produksi: s.produksi, nilai: s.nilai }))
      .sort((a, b) => b.produksi - a.produksi);

    const komposisiWadah = Object.entries(wadahMap)
      .map(([name, s]) => ({ name, produksi: s.produksi, nilai: s.nilai }));

    const top5Wadah = komposisiWadah.slice(0, 5).map(w => w.name);

    const trenBulanan = MONTHS.map(bulan => {
      const monthData = { bulan, Lainnya: { produksi: 0, nilai: 0 } };
      top5Wadah.forEach(w => monthData[w] = { produksi: 0, nilai: 0 });
      return monthData;
    });

    filteredData.forEach(item => {
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex === -1) return;

      const vol = Number(item.produksi_kg) || 0;
      const nilai = Number(item.nilai_rp) || 0;
      
      if (top5Wadah.includes(item.jenis_wadah)) {
        trenBulanan[bIndex][item.jenis_wadah].produksi += vol;
        trenBulanan[bIndex][item.jenis_wadah].nilai += nilai;
      } else {
        trenBulanan[bIndex].Lainnya.produksi += vol;
        trenBulanan[bIndex].Lainnya.nilai += nilai;
      }
    });

    const heatmapData = [];
    Object.keys(heatmapRaw).forEach(kab => {
      const bulanArr = heatmapRaw[kab];
      const maxProd = Math.max(...bulanArr.map(b => b.produksi));
      const minProd = Math.min(...bulanArr.map(b => b.produksi));
      const rangeProd = maxProd - minProd;

      const maxNilai = Math.max(...bulanArr.map(b => b.nilai));
      const minNilai = Math.min(...bulanArr.map(b => b.nilai));
      const rangeNilai = maxNilai - minNilai;

      bulanArr.forEach(b => {
        let normProd = 0;
        if (rangeProd > 0) normProd = (b.produksi - minProd) / rangeProd;
        else if (maxProd > 0) normProd = 1;

        let normNilai = 0;
        if (rangeNilai > 0) normNilai = (b.nilai - minNilai) / rangeNilai;
        else if (maxNilai > 0) normNilai = 1;

        heatmapData.push({
          kabupaten: kab,
          bulan: b.bulan,
          produksi: b.produksi,
          nilai: b.nilai,
          normalizedProduksi: parseFloat(normProd.toFixed(4)),
          normalizedNilai: parseFloat(normNilai.toFixed(4))
        });
      });
    });

    return {
      kpi: { total_volume, top_komoditas, top_kabupaten, total_nilai },
      produksiPerKabupaten,
      komposisiWadah,
      top5Wadah,
      trenBulanan,
      heatmapData
    };
  }, [filteredData]);

  const columns = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
    { header: 'Kategori Komoditas', accessorKey: 'kategori_komoditas' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    { header: 'Jenis Wadah', accessorKey: 'jenis_wadah' },
    { header: 'Produksi (Kg)', accessorKey: 'produksi_kg', cell: info => (info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
    { header: 'Harga (Rp)', accessorKey: 'harga_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } },
    { header: 'Nilai Total (Rp)', accessorKey: 'nilai_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } }
  ], []);

  const isProduksi = visualisasiTipe === 'produksi';
  const formatValue = React.useCallback((val) => {
    return isProduksi 
      ? Number(val).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' Kg'
      : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  }, [isProduksi]);
  const seriesName = isProduksi ? 'Produksi' : 'Nilai (Rp)';

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
        text: 'Produksi Budidaya per Kab/Kota',
        textStyle: { color: chartText, fontSize: 16, fontFamily: 'Inter' },
        left: 'center',
        top: 10
      },
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        trigger: 'item',
        formatter: (params) => `${params.name}<br/>Total ${seriesName}: <b>${formatValue(params.value || 0)}</b>`
      },
      visualMap: {
        left: 'right',
        min: 0,
        max: maxVal,
        inRange: {
          color: isDark
            ? ['#dc2626', '#f97316', '#facc15', '#a3e635', '#34d399']
            : ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e']
        },
        text: ['Tinggi', 'Rendah'],
        textStyle: { color: chartSubText },
        calculable: false
      },
      series: [
        {
          name: seriesName,
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
            areaColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? '#334155' : '#cbd5e1'
          },
          data: mapData
        }
      ]
    };
  }, [stats.produksiPerKabupaten, visualisasiTipe, formatValue, seriesName, chartText, chartSubText, chartGridLine, isDark]);

  // 2. Bar Chart Top Kabupaten
  const barOption = useMemo(() => {
    const sortedData = [...stats.produksiPerKabupaten]
      .filter(d => d[visualisasiTipe] > 0 && d.name && d.name.trim() !== '')
      .sort((a, b) => b[visualisasiTipe] - a[visualisasiTipe]);
    const top10 = sortedData.slice(0, 10).reverse();

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const val = params[0].value || 0;
          return `${params[0].name}<br/>${seriesName}: <b>${formatValue(val)}</b>`;
        }
      },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: chartGridLine, type: 'dashed' } },
        axisLabel: {
          color: chartAxisLabel,
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
        axisLabel: { color: chartSubText, fontSize: 11 }
      },
      series: [
        {
          name: seriesName,
          type: 'bar',
          barWidth: '75%',
          data: top10.map(d => d[visualisasiTipe]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: isDark ? '#0ea5e9' : '#0284c7' },
              { offset: 1, color: isDark ? '#2563eb' : '#1e40af' }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };
  }, [stats.produksiPerKabupaten, visualisasiTipe, formatValue, seriesName, chartGridLine, chartAxisLabel, chartSubText, isDark]);

  // 3. Line Chart Tren Bulanan
  const lineOption = useMemo(() => {
    const wadahColors = ['#0284c7', '#059669', '#d97706', '#ea580c', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5'];
    const seriesData = stats.top5Wadah.map(wadah => ({
      name: wadah,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      emphasis: { focus: 'series' },
      data: stats.trenBulanan.map(m => m[wadah]?.[visualisasiTipe] || 0)
    }));
    seriesData.push({
      name: 'Lainnya',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      lineStyle: { type: 'dashed', width: 2.5 },
      emphasis: { focus: 'series' },
      data: stats.trenBulanan.map(m => m.Lainnya?.[visualisasiTipe] || 0)
    });

    return {
      color: wadahColors,
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', 
          trigger: 'axis', 
          valueFormatter: (value) => formatValue(value || 0) 
      },
      legend: {
        data: [...stats.top5Wadah, 'Lainnya'],
        textStyle: { color: chartSubText },
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: MONTHS,
        axisLabel: { color: chartAxisLabel, fontSize: 11, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: chartGridLine, type: 'dashed' } },
        axisLabel: { color: chartAxisLabel, formatter: (val) => { if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T'; if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M'; if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt'; if (val >= 1000) return (val / 1000).toFixed(1) + 'rb'; return val; } }
      },
      series: seriesData
    };
  }, [stats.trenBulanan, stats.top5Wadah, visualisasiTipe, formatValue, chartAxisLabel, chartSubText, chartGridLine, isDark]);

  // 4. Treemap Komposisi Wadah
  const treemapOption = useMemo(() => {
    const data = stats.komposisiWadah.map(w => ({ name: w.name, value: w[visualisasiTipe] || 0 })).sort((a, b) => b.value - a.value);

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        formatter: (info) => {
          const val = info.value || 0;
          return `<b>${info.name}</b><br/>Total ${seriesName}: ${formatValue(val)}`;
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
        label: { 
          show: true, 
          formatter: (params) => `${params.name}\n\n${formatValue(params.value || 0)}`, 
          color: '#fff', 
          fontWeight: 'bold' 
        },
        itemStyle: {  gapWidth: 2 },
        data: data,
        colorMappingBy: 'value',
        visualMap: {
          show: false,
          inRange: {
            color: isDark
              ? ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4']
              : ['#134e4a', '#0f766e', '#0d9488', '#0369a1', '#1d4ed8']
          }
        }
      }]
    };
  }, [stats.komposisiWadah, visualisasiTipe, formatValue, seriesName, isDark]);

  // 5. Heatmap Kabupaten x Bulan
  const heatmapOption = useMemo(() => {
    const yAxisData = [...new Set(stats.heatmapData.map(d => d.kabupaten))].sort();
    const xAxisData = MONTHS;

    const dataPairs = [];
    const tooltipRawData = {};

    stats.heatmapData.forEach(item => {
      const xIndex = xAxisData.indexOf(item.bulan);
      const yIndex = yAxisData.indexOf(item.kabupaten);
      if (xIndex !== -1 && yIndex !== -1) {
        dataPairs.push([
          xIndex, 
          yIndex, 
          visualisasiTipe === 'produksi' ? item.normalizedProduksi : item.normalizedNilai
        ]);
        tooltipRawData[`${xIndex}-${yIndex}`] = item[visualisasiTipe];
      }
    });

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        position: 'top',
        formatter: (params) => {
          const xIndex = params.data[0];
          const yIndex = params.data[1];
          const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0;
          return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>${seriesName}: ${formatValue(rawValue)}`;
        }
      },
      grid: { left: '3%', right: '4%', top: '3%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: { show: true },
        axisLabel: { color: chartSubText, rotate: 45 }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: { show: true },
        axisLabel: { color: chartSubText, fontSize: 10 }
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: isDark
            ? ['#0f172a', '#2563eb', '#06b6d4', '#facc15', '#22c55e']
            : ['#f0f9ff', '#bae6fd', '#0284c7', '#0369a1', '#155e75']
        },
        textStyle: { color: chartSubText },
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
  }, [stats.heatmapData, visualisasiTipe, formatValue, seriesName, chartSubText, isDark]);

  const hasMapData = useMemo(() => stats.produksiPerKabupaten && stats.produksiPerKabupaten.some(x => (x.produksi || 0) > 0 || (x.nilai || 0) > 0 || (x.value || 0) > 0), [stats.produksiPerKabupaten]);
  const hasBarData = useMemo(() => stats.produksiPerKabupaten && stats.produksiPerKabupaten.some(x => (x.produksi || 0) > 0 || (x.nilai || 0) > 0 || (x[visualisasiTipe] || 0) > 0), [stats.produksiPerKabupaten, visualisasiTipe]);
  const hasLineData = useMemo(() => {
    if (!stats.trenBulanan || !Array.isArray(stats.trenBulanan)) return false;
    return stats.trenBulanan.some(x => {
      return Object.entries(x).some(([key, val]) => key !== 'bulan' && (Number(val?.produksi || 0) > 0 || Number(val?.nilai || 0) > 0));
    });
  }, [stats.trenBulanan]);
  const hasTreemapData = useMemo(() => stats.komposisiWadah && stats.komposisiWadah.some(x => (x.value || 0) > 0 || (x.produksi || 0) > 0 || (x.nilai || 0) > 0), [stats.komposisiWadah]);
  const hasHeatmapData = useMemo(() => {
    if (!stats.heatmapData || !Array.isArray(stats.heatmapData)) return false;
    return stats.heatmapData.some(item => (Number(item.produksi) || 0) > 0 || (Number(item.nilai) || 0) > 0);
  }, [stats.heatmapData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Perikanan Budidaya</h1>
        </div>
        {lastUpdated ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="opacity-80">Terakhir Diperbarui:</span>
            <span className="font-semibold">{lastUpdated}</span>
          </div>
        ) : null}
      </div>

      <div className="mb-6">

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SearchableMultiSelect
              options={tahunOptions}
              value={filterTahun}
              onChange={setFilterTahun}
              placeholder="Semua Tahun"
            />
            <SearchableMultiSelect
              options={bulanOptions}
              value={filterBulan}
              onChange={setFilterBulan}
              placeholder="Semua Bulan"
            />
            <SearchableMultiSelect
              options={kabupatenOptions}
              value={filterKabupaten}
              onChange={setFilterKabupaten}
              placeholder="Semua Kab/Kota"
            />
            <SearchableMultiSelect
              options={komoditasOptions}
              value={filterKomoditas}
              onChange={setFilterKomoditas}
              placeholder="Semua Komoditas"
            />
            <SearchableMultiSelect
              options={wadahOptions}
              value={filterWadah}
              onChange={setFilterWadah}
              placeholder="Semua Wadah"
            />
            <div className="relative">
              <select
                value={visualisasiTipe}
                onChange={(e) => setVisualisasiTipe(e.target.value)}
                className="appearance-none bg-background dark:bg-slate-900 border border-input rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:border-primary/50 h-[38px] w-full shadow-none"
              >
                <option value="produksi">Volume (Kg)</option>
                <option value="nilai">Nilai (Rp)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          {(filterKomoditas.length > 0 || filterKabupaten.length > 0 || filterWadah.length > 0 || filterBulan.length > 0 || filterTahun.length > 0) && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setFilterKomoditas([]);
                  setFilterKabupaten([]);
                  setFilterWadah([]);
                  setFilterBulan([]);
                  setFilterTahun([]);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.kpi.total_volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">Kg</span>
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
              <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Kab/Kota</p>
                <p className="text-2xl font-bold text-foreground leading-tight">
                  {stats.kpi.top_kabupaten}
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
                  Rp {formatUangPendek(stats.kpi.total_nilai).split(' ')[0]} <span className="text-sm font-normal text-muted-foreground">{formatUangPendek(stats.kpi.total_nilai).split(' ').slice(1).join(' ')}</span>
                </p>
              </div>
            </div>
          </div>



          {/* Top Visualizations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">Peta Sebaran Produksi</h2>
                </div>
              </div>
              <div className="h-[400px]">
                {hasMapData ? (
                  <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                    Belum ada data
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Ketuk salah satu Kab/Kota pada peta untuk melihat rinciannya.
              </p>
            </div>

            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-bold">Top 10 Kab/Kota</h2>
                  </div>
                </div>
              <div className="flex-1 min-h-[400px]">
                {hasBarData ? (
                  <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                    Belum ada data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Visualizations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-teal-500" />
                  </div>
                  <h2 className="text-lg font-bold">Tren Produksi Bulanan</h2>
                </div>
              </div>
              <div className="h-[350px]">
                {hasLineData ? (
                  <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                    Belum ada data
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Fish className="w-5 h-5 text-cyan-500" />
                    </div>
                    <h2 className="text-lg font-bold">Komposisi Jenis Wadah</h2>
                  </div>
                </div>
              <div className="h-[350px]">
                {hasTreemapData ? (
                  <ReactECharts option={treemapOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                    Belum ada data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Heatmap Row */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-lg font-bold">Pola Musiman per Wilayah </h2>
              </div>
            </div>
            <div className="h-[600px]">
              {hasHeatmapData ? (
                <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
                  Belum ada data
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-foreground">Rincian Data Produksi Budidaya</h3>
              </div>
              {(filterTableKomoditas.length > 0 || filterTableKabupaten.length > 0 || filterTableWadah.length > 0 || filterTableBulan.length > 0 || filterTableTahun.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterTableKomoditas([]);
                    setFilterTableKabupaten([]);
                    setFilterTableWadah([]);
                    setFilterTableBulan([]);
                    setFilterTableTahun([]);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Reset Filter Tabel
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <SearchableMultiSelect
                  options={tahunOptions}
                  value={filterTableTahun}
                  onChange={setFilterTableTahun}
                  placeholder="Semua Tahun"
                />
                <SearchableMultiSelect
                  options={bulanOptions}
                  value={filterTableBulan}
                  onChange={setFilterTableBulan}
                  placeholder="Semua Bulan"
                />
                <SearchableMultiSelect
                  options={kabupatenOptions}
                  value={filterTableKabupaten}
                  onChange={setFilterTableKabupaten}
                  placeholder="Semua Kab/Kota"
                />
                <SearchableMultiSelect
                  options={komoditasOptions}
                  value={filterTableKomoditas}
                  onChange={setFilterTableKomoditas}
                  placeholder="Semua Komoditas"
                />
                <SearchableMultiSelect
                  options={wadahOptions}
                  value={filterTableWadah}
                  onChange={setFilterTableWadah}
                  placeholder="Semua Wadah"
                />
              </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredTableData}
                exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
                customExportButton={
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:text-slate-900 rounded-xl transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Rekap Statistik
                  </button>
                }
                formatExportData={(exportData) => exportData.map(row => ({
                  'Tahun': row.tahun || '-',
                  'Bulan': row.bulan || '-',
                  'Triwulan': row.triwulan || '-',
                  'Kab/Kota': row.kabupaten_kota || '-',
                  'Kategori Komoditas': row.kategori_komoditas || '-',
                  'Komoditas': row.komoditas || '-',
                  'Jenis Wadah': row.jenis_wadah || '-',
                  'Produksi (Kg)': row.produksi_kg || '-',
                  'Harga (Rp)': row.harga_rp || '-',
                  'Nilai Total (Rp)': row.nilai_rp || '-'
                }))}
              />
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Rekap Statistik Budidaya</h3>
              <button onClick={() => setShowExportModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipe Laporan</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'wadah' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="exportType" value="wadah" checked={exportType === 'wadah'} onChange={() => setExportType('wadah')} className="hidden" />
                    Berdasarkan Wadah
                  </label>
                  <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'komoditas' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="exportType" value="komoditas" checked={exportType === 'komoditas'} onChange={() => setExportType('komoditas')} className="hidden" />
                    Berdasarkan Komoditas
                  </label>
                </div>
              </div>
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
                File Excel akan berisikan rekapitulasi jumlah produksi berdasarkan wadah/komoditas untuk semua Kab/Kota pada tahun yang dipilih.
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
                      const endpoint = exportType === 'wadah' ? '/budidaya/export-wadah' : '/budidaya/export-komoditas';
                      const response = await api.get(`${endpoint}?tahun=${exportYear}`, {
                        responseType: 'blob',
                        headers: {
                          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        }
                      });
                      
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Rekap_Budidaya_${exportType}_${exportYear}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      
                      setShowExportModal(false);
                    } catch (error) {
                      console.error('Export error:', error);
                      alert('Gagal mengunduh file Excel');
                    } finally {
                      setExportLoading(false);
                    }
                  }}
                  disabled={exportLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {exportLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Unduh Excel</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
