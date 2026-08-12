import { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
 
// eslint-disable-next-line no-unused-vars
import { Loader2, Globe, Box, Target, LineChart, TrendingUp, FileText, Clock, PieChart, BarChart3, ChevronDown } from 'lucide-react';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import ReactECharts from 'echarts-for-react';
import { useThemeStore } from '@/store/themeStore';
import { formatUangPendek } from '@/utils/formatRupiah';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();
// eslint-disable-next-line no-unused-vars
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

export default function Ekspor() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  // eslint-disable-next-line no-unused-vars
  const chartText = isDark ? '#e2e8f0' : '#0f172a';
  const chartSubText = isDark ? '#94a3b8' : '#334155';
  const chartAxisColor = isDark ? '#94a3b8' : '#334155';
  const chartGridColor = isDark ? '#334155' : '#e2e8f0';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('-');

  const [filterBulan, setFilterBulan] = useState([]);
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterKomoditas, setFilterKomoditas] = useState([]);
  const [filterNegara, setFilterNegara] = useState([]);

  const [filterTableBulan, setFilterTableBulan] = useState([]);
  const [filterTableTahun, setFilterTableTahun] = useState([]);
  const [filterTableKomoditas, setFilterTableKomoditas] = useState([]);
  const [filterTableNegara, setFilterTableNegara] = useState([]);

  const [agregatFilter, setAgregatFilter] = useState('Segar dan Olahan');
  const [satuanFilter, setSatuanFilter] = useState('KG');
  const [mataUangFilter, setMataUangFilter] = useState('');
  const mataUangKey = mataUangFilter === 'RP' ? 'nilai_rp' : 'nilai_usd';
  const mataUangPrefix = mataUangFilter === 'RP' ? 'Rp' : '$';

  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);
  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.nama_komoditas))].filter(Boolean).sort(), [data]);
  const negaraOptions = useMemo(() => [...new Set(data.map(d => d.negara_tujuan))].filter(Boolean).sort(), [data]);

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
      if (!matchMultiFilter(filterBulan, item.bulan)) return false;
      if (!matchMultiFilter(filterTahun, item.tahun)) return false;
      if (!matchMultiFilter(filterKomoditas, item.nama_komoditas)) return false;
      if (!matchMultiFilter(filterNegara, item.negara_tujuan)) return false;
      return true;
    });
  }, [data, filterBulan, filterTahun, filterKomoditas, filterNegara]);

  const filteredTableData = useMemo(() => {
    return data.filter(item => {
      if (!matchMultiFilter(filterTableBulan, item.bulan)) return false;
      if (!matchMultiFilter(filterTableTahun, item.tahun)) return false;
      if (!matchMultiFilter(filterTableKomoditas, item.nama_komoditas)) return false;
      if (!matchMultiFilter(filterTableNegara, item.negara_tujuan)) return false;
      return true;
    });
  }, [data, filterTableBulan, filterTableTahun, filterTableKomoditas, filterTableNegara]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ekspor');
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
    let total_nilai_usd = 0;
    let total_nilai_rp = 0;

    const komoditasMap = {};
    const monthlyRaw = {};
    const monthlyAgg = {};
    const negaraMap = {};

    MONTHS.forEach(m => {
      monthlyAgg[m] = { 
        'Semua': { volume: 0, nilai_usd: 0, nilai_rp: 0 },
        'Segar dan Olahan': { volume: 0, nilai_usd: 0, nilai_rp: 0 },
        'Hidup': { volume: 0, nilai_usd: 0, nilai_rp: 0 },
        'Satuan': {}
      };
    });

    filteredData.forEach(item => {
      const vol = Number(item.volume) || 0;
      const usd = Number(item.nilai_usd) || 0;
      const rp = Number(item.nilai_rp) || 0;

      total_volume += vol;
      total_nilai_usd += usd;
      total_nilai_rp += rp;

      const kat = item.kategori_komoditas || 'Lainnya';
      const kom = item.nama_komoditas || 'Lainnya';

      if (!komoditasMap[kat]) komoditasMap[kat] = {};
      if (!komoditasMap[kat][kom]) komoditasMap[kat][kom] = { usd: 0, rp: 0 };
      komoditasMap[kat][kom].usd += usd;
      komoditasMap[kat][kom].rp += rp;

      const negara = item.negara_tujuan || 'Lainnya';
      if (!negaraMap[negara]) negaraMap[negara] = { usd: 0, rp: 0 };
      negaraMap[negara].usd += usd;
      negaraMap[negara].rp += rp;

      if (item.bulan && MONTHS.includes(item.bulan)) {
        monthlyAgg[item.bulan]['Semua'].volume += vol;
        monthlyAgg[item.bulan]['Semua'].nilai_usd += usd;
        monthlyAgg[item.bulan]['Semua'].nilai_rp += rp;

        if (kat === 'Segar dan Olahan' || kat === 'Hidup') {
          monthlyAgg[item.bulan][kat].volume += vol;
          monthlyAgg[item.bulan][kat].nilai_usd += usd;
          monthlyAgg[item.bulan][kat].nilai_rp += rp;

          const satuan = (item.satuan_volume || '').toUpperCase();
          if (satuan) {
            if (!monthlyAgg[item.bulan]['Satuan'][kat]) monthlyAgg[item.bulan]['Satuan'][kat] = {};
            if (!monthlyAgg[item.bulan]['Satuan'][kat][satuan]) monthlyAgg[item.bulan]['Satuan'][kat][satuan] = { volume: 0, nilai_usd: 0, nilai_rp: 0 };
            monthlyAgg[item.bulan]['Satuan'][kat][satuan].volume += vol;
            monthlyAgg[item.bulan]['Satuan'][kat][satuan].nilai_usd += usd;
            monthlyAgg[item.bulan]['Satuan'][kat][satuan].nilai_rp += rp;
          }
        }

        if (!monthlyRaw[item.bulan]) monthlyRaw[item.bulan] = {};
        if (!monthlyRaw[item.bulan][kom]) monthlyRaw[item.bulan][kom] = { usd: 0, rp: 0 };
        monthlyRaw[item.bulan][kom].usd += usd;
        monthlyRaw[item.bulan][kom].rp += rp;
      }
    });

    const treemap = [];
    Object.keys(komoditasMap).forEach(kat => {
      Object.keys(komoditasMap[kat]).forEach(kom => {
        treemap.push({
          kategori_komoditas: kat,
          nama_komoditas: kom,
          _sum: { 
            nilai_usd: komoditasMap[kat][kom].usd,
            nilai_rp: komoditasMap[kat][kom].rp
          }
        });
      });
    });

    const komoditasFlat = {};
    treemap.forEach(t => {
      if (!komoditasFlat[t.nama_komoditas]) komoditasFlat[t.nama_komoditas] = { usd: 0, rp: 0 };
      komoditasFlat[t.nama_komoditas].usd += t._sum.nilai_usd;
      komoditasFlat[t.nama_komoditas].rp += t._sum.nilai_rp;
    });

    const ranking_komoditas = Object.keys(komoditasFlat).map(kom => ({
      nama_komoditas: kom,
      _sum: { 
        nilai_usd: komoditasFlat[kom].usd,
        nilai_rp: komoditasFlat[kom].rp
      }
    })).sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd);

    const top5_names = ranking_komoditas.slice(0, 5).map(k => k.nama_komoditas);

    const negara_tujuan = Object.keys(negaraMap).map(n => ({
      negara_tujuan: n,
      _sum: { 
        nilai_usd: negaraMap[n].usd,
        nilai_rp: negaraMap[n].rp
      }
    })).sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd);

    const monthly_aggregate = MONTHS.map(m => ({
      bulan: m,
      _sum: { 
        volume: monthlyAgg[m]['Semua'].volume, 
        nilai_usd: monthlyAgg[m]['Semua'].nilai_usd,
        nilai_rp: monthlyAgg[m]['Semua'].nilai_rp
      }
    }));

    const monthly_data_raw = [];
    Object.keys(monthlyRaw).forEach(m => {
      Object.keys(monthlyRaw[m]).forEach(kom => {
        monthly_data_raw.push({
          bulan: m,
          nama_komoditas: kom,
          _sum: { 
            nilai_usd: monthlyRaw[m][kom].usd,
            nilai_rp: monthlyRaw[m][kom].rp
          }
        });
      });
    });

    return {
      kpi: { 
        total_volume, 
        total_nilai: total_nilai_usd,
        total_nilai_rp: total_nilai_rp,
        total_transaksi: filteredData.length
      },
      treemap,
      top5_names,
      monthly_data_raw,
      monthly_aggregate,
      monthlyAgg,
      ranking_komoditas,
      negara_tujuan
    };
  }, [filteredData]);

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
      accessorKey: 'kategori_komoditas'
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
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;',
        
        
        
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
          itemStyle: { color: isDark ? '#f1f5f9' : '#0f172a', textStyle: { color: isDark ? '#0f172a' : '#ffffff', fontSize: 14, fontWeight: 'bold' } },
          textStyle: { color: isDark ? '#0f172a' : '#ffffff', fontSize: 14, fontWeight: 'bold' }
        },
        itemStyle: { borderColor: isDark ? '#0f172a' : '#ffffff' },
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
  }, [stats.treemap, mataUangKey, mataUangPrefix, isDark]);

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
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: legendData, bottom: 0, textStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: chartAxisColor, fontSize: 12, fontWeight: '500' } },
      yAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' }, axisLabel: { color: chartAxisColor, fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: chartGridColor } } },
      series
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, mataUangKey, mataUangFilter, chartSubText, chartAxisColor, chartGridColor]);

  const groupedBarOption = useMemo(() => {
    const volumeLabel = `Volume (${satuanFilter.toUpperCase()})`;

    const volumeData = MONTHS.map(m => {
      return stats.monthlyAgg[m]?.['Satuan']?.[agregatFilter]?.[satuanFilter]?.volume || 0;
    });

    const valueData = MONTHS.map(m => {
      const cell = stats.monthlyAgg[m]?.['Satuan']?.[agregatFilter]?.[satuanFilter];
      if (!cell) return 0;
      return cell.nilai_usd || 0;
    });

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: [volumeLabel, `Nilai (${mataUangFilter})`], top: 0, right: '4%', textStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', top: '15%', bottom: '2%', containLabel: true },
      xAxis: [{ type: 'category', data: MONTHS, axisPointer: { type: 'shadow' }, axisLabel: { color: chartAxisColor, fontSize: 12, fontWeight: '500' } }],
      yAxis: [
        { type: 'value', name: volumeLabel, nameTextStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: '{value}', color: chartAxisColor, fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: chartGridColor } } },
        { type: 'value', name: `Nilai (${mataUangPrefix})`, nameTextStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: `${mataUangPrefix}{value}`, color: chartAxisColor, fontSize: 12, fontWeight: '500' }, splitLine: { show: false } }
      ],
      series: [
        { name: volumeLabel, type: 'bar', itemStyle: { color: '#0ea5e9' }, data: volumeData },
        { name: `Nilai (${mataUangFilter})`, type: 'bar', yAxisIndex: 1, itemStyle: { color: '#f59e0b' }, data: valueData }
      ]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.monthly_aggregate, stats.monthly_data_raw, stats.monthlyAgg, agregatFilter, satuanFilter, mataUangFilter, mataUangPrefix, chartSubText, chartAxisColor, chartGridColor]);

  const rankingOption = useMemo(() => {
    const sorted = [...stats.ranking_komoditas]
      .sort((a, b) => (a._sum.nilai_usd || 0) - (b._sum.nilai_usd || 0))
      .slice(-10);
    const categories = sorted.map(i => i.nama_komoditas);
    const values = sorted.map(i => i._sum.nilai_usd || 0);

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' }, axisLabel: { color: chartAxisColor, fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: chartGridColor } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: chartSubText, fontSize: 14, fontWeight: 'bold', interval: 0, width: 100, overflow: 'truncate' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: chartSubText, fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.ranking_komoditas, mataUangFilter, mataUangPrefix, chartSubText, chartAxisColor, chartGridColor]);

  const negaraOption = useMemo(() => {
    const sorted = [...stats.negara_tujuan]
      .sort((a, b) => (a._sum.nilai_usd || 0) - (b._sum.nilai_usd || 0))
      .slice(-10);
    const categories = sorted.map(i => i.negara_tujuan);
    const values = sorted.map(i => i._sum.nilai_usd || 0);

    return {
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
          extraCssText: isDark ? 'color: #f8fafc !important;' : 'color: #0f172a !important;', trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: chartSubText, fontSize: 13, fontWeight: '500' }, axisLabel: { color: chartAxisColor, fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: chartGridColor } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: chartSubText, fontSize: 14, fontWeight: 'bold' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#f43f5e', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: chartSubText, fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.negara_tujuan, mataUangFilter, mataUangPrefix, chartSubText, chartAxisColor, chartGridColor]);

  const hasTreemapData = useMemo(() => stats.treemap && stats.treemap.some(x => ((x.value || 0) > 0 || (x._sum?.nilai_usd || 0) > 0 || (x._sum?.nilai_rp || 0) > 0)), [stats.treemap]);
  const hasRankingData = useMemo(() => stats.ranking_komoditas && stats.ranking_komoditas.some(x => ((x.value || 0) > 0 || (x._sum?.nilai_usd || 0) > 0 || (x._sum?.nilai_rp || 0) > 0)), [stats.ranking_komoditas]);
  const hasLineData = useMemo(() => stats.monthly_data_raw && stats.monthly_data_raw.some(x => ((x._sum?.nilai_usd || 0) > 0 || (x._sum?.nilai_rp || 0) > 0)), [stats.monthly_data_raw]);
  const hasGroupedBarData = useMemo(() => {
    if (!stats.monthlyAgg) return false;
    return MONTHS.some(m => {
      const cell = stats.monthlyAgg[m]?.['Satuan']?.[agregatFilter]?.[satuanFilter];
      return cell && ((cell.volume || 0) > 0 || (cell.nilai_usd || 0) > 0 || (cell.nilai_rp || 0) > 0);
    });
  }, [stats.monthlyAgg, agregatFilter, satuanFilter]);
  const hasNegaraData = useMemo(() => stats.negara_tujuan && stats.negara_tujuan.some(x => ((x.value || 0) > 0 || (x._sum?.nilai_usd || 0) > 0 || (x._sum?.nilai_rp || 0) > 0)), [stats.negara_tujuan]);

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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Ekspor Perikanan</h1>
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
            {lastUpdated}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
            options={komoditasOptions}
            value={filterKomoditas}
            onChange={setFilterKomoditas}
            placeholder="Semua Komoditas"
          />
          <SearchableMultiSelect
            options={negaraOptions}
            value={filterNegara}
            onChange={setFilterNegara}
            placeholder="Semua Negara Tujuan"
          />
          <div className="relative">
            <select value={mataUangFilter} onChange={(e) => setMataUangFilter(e.target.value)} className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/50 transition-colors cursor-pointer select-none">
              <option value="" disabled hidden>Nilai</option>
              <option value="USD">USD ($)</option>
              <option value="RP">Rupiah (Rp)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        {(filterTahun.length > 0 || filterBulan.length > 0 || filterKomoditas.length > 0 || filterNegara.length > 0) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterTahun([]);
                setFilterBulan([]);
                setFilterKomoditas([]);
                setFilterNegara([]);
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
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
              {stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg</span>
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
              {mataUangPrefix}{(() => {
                const val = stats.kpi[mataUangFilter === 'RP' ? 'total_nilai_rp' : 'total_nilai'] || stats.kpi.total_nilai || 0;
                const formatted = formatUangPendek(val);
                const parts = formatted.split(' ');
                return <>{parts[0]} {parts.length > 1 && <span className="text-sm font-normal text-muted-foreground">{parts.slice(1).join(' ')}</span>}</>;
              })()}
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
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <Box className="w-5 h-5 text-cyan-500" />
                    </div>
                    <h2 className="text-lg font-bold">Komposisi Ekspor per Komoditas</h2>
                  </div>
                </div>
          {hasTreemapData ? (
            <ReactECharts option={treemapOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-bold">Top 10 Komoditas Berdasarkan Nilai</h2>
                  </div>
                </div>
          {hasRankingData ? (
            <ReactECharts option={rankingOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Line Chart Tren Top 5 */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg">
                      <LineChart className="w-5 h-5 text-teal-500" />
                    </div>
                    <h2 className="text-lg font-bold">Top 5 Komoditas Dengan Tren Nilai Ekspor Bulanan</h2>
                  </div>
                </div>
        {hasLineData ? (
          <ReactECharts option={lineChartOption} style={{ height: '450px', width: '100%' }} />
        ) : (
          <div className="h-[450px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
            Belum ada data
          </div>
        )}
      </div>

      {/* Row 3: Grouped Bar & Negara Tujuan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">Agregat Nilai dan Volume</h2>
                  </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={agregatFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAgregatFilter(val);
                    setSatuanFilter(val === 'Segar dan Olahan' ? 'KG' : 'PCS');
                  }}
                  className="appearance-none bg-background dark:bg-slate-900 border border-input rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:border-primary/50 h-[38px] w-full shadow-none"
                >
                  <option value="Segar dan Olahan">Segar & Olahan</option>
                  <option value="Hidup">Hidup</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {agregatFilter === 'Segar dan Olahan' && (
                <div className="relative">
                  <select
                    value={satuanFilter}
                    onChange={(e) => setSatuanFilter(e.target.value)}
                    className="appearance-none bg-background dark:bg-slate-900 border border-input rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:border-primary/50 h-[38px] w-full shadow-none"
                  >
                    <option value="KG">Kg</option>
                    <option value="LITER">Liter</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              )}
              {agregatFilter === 'Hidup' && (
                <div className="relative">
                  <select
                    value={satuanFilter}
                    onChange={(e) => setSatuanFilter(e.target.value)}
                    className="appearance-none bg-background dark:bg-slate-900 border border-input rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:border-primary/50 h-[38px] w-full shadow-none"
                  >
                    <option value="PCS">Pcs</option>
                    <option value="EKOR">Ekor</option>
                    <option value="BATANG">Batang</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>
          </div>
          {hasGroupedBarData ? (
            <ReactECharts option={groupedBarOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
              Belum ada data
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                      <Globe className="w-5 h-5 text-rose-500" />
                    </div>
                    <h2 className="text-lg font-bold">Top Negara Tujuan</h2>
                  </div>
                </div>
          {hasNegaraData ? (
            <ReactECharts option={negaraOption} style={{ height: '500px', width: '100%' }} />
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border font-medium">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-foreground">Rincian Data Ekspor</h3>
          </div>
          {(filterTableTahun.length > 0 || filterTableBulan.length > 0 || filterTableKomoditas.length > 0 || filterTableNegara.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setFilterTableTahun([]);
                setFilterTableBulan([]);
                setFilterTableKomoditas([]);
                setFilterTableNegara([]);
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Reset Filter Tabel
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
              options={komoditasOptions}
              value={filterTableKomoditas}
              onChange={setFilterTableKomoditas}
              placeholder="Semua Komoditas"
            />
            <SearchableMultiSelect
              options={negaraOptions}
              value={filterTableNegara}
              onChange={setFilterTableNegara}
              placeholder="Semua Negara Tujuan"
            />
          </div>
        </div>

          <DataTable
            columns={columns}
            data={filteredTableData}
          exportName={`Ekspor_Samudera_${new Date().toISOString().split('T')[0]}`}
          formatExportData={(exportData) => exportData.map(row => ({
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
  );
}
