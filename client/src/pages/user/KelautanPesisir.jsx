import { useState, useEffect, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import {
  Loader2, Waves, Anchor, FlaskConical, MapPin, Filter,
  TreePine, Landmark, Globe, Fish, Info, Clock, Leaf,
  ChevronDown, Search
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useThemeStore } from '@/store/themeStore';

const NAMA_BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const formatBulan = (val) => {
  if (!val) return '';
  const num = parseInt(val, 10);
  if (num >= 1 && num <= 12) {
    return NAMA_BULAN_LIST[num - 1];
  }
  return val;
};

const numFmt = (v) => (Number(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

// ── MARITIME COLOR PALETTE ──
const CHART_PALETTE = [
  '#0891b2', // cyan-600
  '#0d9488', // teal-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#db2777', // pink-600
  '#2563eb', // blue-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
];

const hBarOption = (categories, values, color, unit, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const gridColor = isDark ? '#334155' : '#cbd5e1';
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID')} ${unit}` },
    grid: { left: 95, right: 85, top: 15, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { color: textColor, fontWeight: 'bold', fontSize: 12 }, splitLine: { lineStyle: { type: 'dashed', color: gridColor } } },
    yAxis: { type: 'category', data: categories, axisLabel: { color: textColor, fontSize: 13, fontWeight: 'bold' }, axisTick: { show: false }, inverse: true },
    series: [{
      data: values,
      type: 'bar',
      itemStyle: { color, borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 28,
      label: {
        show: true,
        position: 'right',
        formatter: (p) => `${Number(p.value).toLocaleString('id-ID')} ${unit}`,
        color: textColor,
        fontWeight: 'bold',
        fontSize: 12
      }
    }],
  };
};

// Urutkan kategori & value bar chart dari yang tertinggi ke terendah
const sortBarData = (categories, values) => {
  const paired = categories.map((c, i) => ({ c, v: values[i] }));
  paired.sort((a, b) => b.v - a.v);
  return { categories: paired.map(p => p.c), values: paired.map(p => p.v) };
};

const comboHBarOption = (categories, series, unit, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const gridColor = isDark ? '#334155' : '#cbd5e1';
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { color: textColor, fontWeight: 'bold', fontSize: 12 } },
    grid: { left: 95, right: 50, top: 15, bottom: 40 },
    xAxis: { type: 'value', axisLabel: { color: textColor, fontWeight: 'bold', fontSize: 12 }, splitLine: { lineStyle: { type: 'dashed', color: gridColor } } },
    yAxis: { type: 'category', data: categories, axisLabel: { color: textColor, fontSize: 13, fontWeight: 'bold' }, axisTick: { show: false } },
    series: series.map(s => ({ ...s, type: 'bar', barGap: '0%', barMaxWidth: 28, itemStyle: { ...s.itemStyle, borderRadius: [0, 4, 4, 0] } })),
  };
};

const pieOption = (title, data, nameField, valueField, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  return {
    color: CHART_PALETTE,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, bottom: 10, top: 'auto', maxHeight: 120, textStyle: { color: textColor, fontWeight: 'bold', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '78%'], center: ['40%', '44%'],
      data: data.map(d => ({ name: d[nameField], value: d[valueField] })).filter(d => d.value > 0),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
    }]
  };
};

const KONDISI_COLOR_MAP = {
  'Sangat Padat (70-100%)': '#10b981',
  'Sedang (30-70%)': '#f59e0b',
  'Jarang (0-30%)': '#f43f5e',
};
const kondisiPieOption = (data, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, bottom: 10, top: 'auto', textStyle: { color: textColor, fontWeight: 'bold', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '78%'], center: ['40%', '44%'],
      data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_COLOR_MAP[d.name] } })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
    }]
  };
};

const KONDISI_TERUMBU_COLOR_MAP = {
  'Sangat Baik (75-100%)': '#10b981',
  'Baik (50-75%)': '#3b82f6',
  'Sedang (25-50%)': '#f59e0b',
  'Rusak (0-25%)': '#f43f5e',
};
const kondisiTerumbuPieOption = (data, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, bottom: 10, top: 'auto', textStyle: { color: textColor, fontWeight: 'bold', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '78%'], center: ['40%', '44%'],
      data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_TERUMBU_COLOR_MAP[d.name] } })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
    }]
  };
};

const KONDISI_LAMUN_COLOR_MAP = {
  'Kaya (60-100%)': '#10b981',
  'Kurang Kaya (30-60%)': '#f59e0b',
  'Miskin (0-30%)': '#f43f5e',
};
const kondisiLamunPieOption = (data, isDark = false) => {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, bottom: 10, top: 'auto', textStyle: { color: textColor, fontWeight: 'bold', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '78%'], center: ['40%', '44%'],
      data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_LAMUN_COLOR_MAP[d.name] } })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
    }]
  };
};

export default function KelautanPesisir() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensi, setDataPotensi] = useState([]);
  const [dataMangrove, setDataMangrove] = useState([]);
  const [dataLamun, setDataLamun] = useState([]);
  const [dataTerumbuKarang, setDataTerumbuKarang] = useState([]);

  // Global Filters
  const [filterBulan, setFilterBulan] = useState([]);
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterKab, setFilterKab] = useState([]);

  // Table Filters
  const [activeTable, setActiveTable] = useState('garam');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [garamRes, potensiRes, mangroveRes, lamunRes, terumbuRes] = await Promise.all([
          api.get('/kelautan-pesisir/garam/public'),
          api.get('/kelautan-pesisir/potensi-perairan/public'),
          api.get('/kelautan-pesisir/mangrove/public'),
          api.get('/kelautan-pesisir/lamun/public'),
          api.get('/kelautan-pesisir/terumbu-karang/public')
        ]);
        setDataGaram(garamRes.data.data || []);
        setDataPotensi(potensiRes.data.data || []);
        setDataMangrove(mangroveRes.data.data || []);
        setDataLamun(lamunRes.data.data || []);
        setDataTerumbuKarang(terumbuRes.data.data || []);
      } catch (error) {
        console.error('Error fetching kelautan pesisir data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const bulanOptions = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  
  const kabupatenOptions = useMemo(() => {
    const set = new Set([...dataGaram, ...dataPotensi, ...dataMangrove, ...dataLamun, ...dataTerumbuKarang].map(d => d.kabupaten_kota).filter(Boolean));
    return [...set].sort();
  }, [dataGaram, dataPotensi, dataMangrove, dataLamun, dataTerumbuKarang]);

  const tahunOptions = useMemo(() => {
    const set = new Set([
      ...dataGaram.map(d => d.tahun), 
      ...dataPotensi.map(d => d.tahun_data),
      ...dataMangrove.map(d => d.tahun),
      ...dataLamun.map(d => d.tahun),
      ...dataTerumbuKarang.map(d => d.tahun)
    ].filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [dataGaram, dataPotensi, dataMangrove, dataLamun, dataTerumbuKarang]);

  // ── KPI Potensi Perairan ──
  const filteredVisPotensi = useMemo(() => dataPotensi.filter(d => 
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun_data))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataPotensi, filterTahun, filterKab]);

  const potensiPerKotaFrontend = useMemo(() => {
    const agg = {};
    filteredVisPotensi.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { ...d };
      else if ((d.tahun_data || 0) > (agg[kab].tahun_data || 0)) agg[kab] = { ...d };
    });
    return Object.values(agg);
  }, [filteredVisPotensi]);

  const kpiPotensi = useMemo(() => {
    return {
      pulau_kecil: potensiPerKotaFrontend.reduce((s, d) => s + (d.jumlah_pulau_kecil || 0), 0),
      garis_pantai: potensiPerKotaFrontend.reduce((s, d) => s + (d.total_panjang_garis_pantai_km || 0), 0),
      luas_laut: potensiPerKotaFrontend.reduce((s, d) => s + (d.luas_wilayah_laut_km2 || 0), 0),
      desa_pesisir: potensiPerKotaFrontend.reduce((s, d) => s + (d.desa_pesisir || 0), 0),
    };
  }, [potensiPerKotaFrontend]);

  // ── VISUALISASI GARAM ──
  const filteredVisGaram = useMemo(() => dataGaram.filter(d => 
    (filterBulan.length === 0 || filterBulan.includes(formatBulan(d.bulan))) &&
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataGaram, filterBulan, filterTahun, filterKab]);

  const visGaramPerKota = useMemo(() => {
    const agg = {};
    filteredVisGaram.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, produksi: 0, kelompok: 0, luas_lahan: 0, petambak: 0, _tahun: -1, _bulanIdx: -1 };
      agg[kab].produksi += (d.total_produksi_ton || 0);
      const bulanIdx = NAMA_BULAN_LIST.indexOf(formatBulan(d.bulan));
      const isTerbaru = (d.tahun || 0) > agg[kab]._tahun || ((d.tahun || 0) === agg[kab]._tahun && bulanIdx > agg[kab]._bulanIdx);
      if (isTerbaru) {
        agg[kab].kelompok = d.jumlah_kelompok || 0;
        agg[kab].luas_lahan = d.luas_total_ha || 0;
        agg[kab].petambak = d.jumlah_petambak || 0;
        agg[kab]._tahun = d.tahun || 0;
        agg[kab]._bulanIdx = bulanIdx;
      }
    });
    return Object.values(agg).sort((a, b) => b.produksi - a.produksi);
  }, [filteredVisGaram]);

  const kpiGaram = useMemo(() => {
    return {
      produksi: visGaramPerKota.reduce((s, d) => s + d.produksi, 0),
      petambak: visGaramPerKota.reduce((s, d) => s + d.petambak, 0),
      lahan: visGaramPerKota.reduce((s, d) => s + d.luas_lahan, 0),
    };
  }, [visGaramPerKota]);

  const garamKota = visGaramPerKota.map(d => d.name);
  const garamProduksi = visGaramPerKota.map(d => parseFloat(d.produksi.toFixed(2)));
  const garamLahan = visGaramPerKota.map(d => parseFloat(d.luas_lahan.toFixed(2)));
  const garamPetambak = visGaramPerKota.map(d => d.petambak);
  const garamKelompok = visGaramPerKota.map(d => d.kelompok);

  // ── TREN BULANAN PRODUKSI GARAM ──
  const garamTren = useMemo(() => {
    const agg = {};
    filteredVisGaram.forEach(d => {
      const bulanIdx = NAMA_BULAN_LIST.indexOf(formatBulan(d.bulan));
      if (bulanIdx === -1) return;
      const thn = d.tahun;
      const key = `${thn}-${bulanIdx}`;
      if (!agg[key]) agg[key] = { tahun: thn, bulanIdx, produksi: 0 };
      agg[key].produksi += (d.total_produksi_ton || 0);
    });
    return Object.values(agg).sort((a, b) => a.tahun - b.tahun || a.bulanIdx - b.bulanIdx);
  }, [filteredVisGaram]);

  const garamTrenLabels = garamTren.map(t => `${NAMA_BULAN_LIST[t.bulanIdx].slice(0, 3)} ${t.tahun}`);
  const garamTrenValues = garamTren.map(t => parseFloat(t.produksi.toFixed(2)));

  const garamTrenOption = useMemo(() => {
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const gridColor = isDark ? '#334155' : '#cbd5e1';
    return {
      tooltip: { trigger: 'axis', formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton` },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: garamTrenLabels, axisLabel: { color: textColor, fontWeight: 'bold' } },
      yAxis: { type: 'value', name: 'Produksi (Ton)', nameTextStyle: { color: textColor }, axisLabel: { color: textColor }, splitLine: { lineStyle: { type: 'dashed', color: gridColor } } },
      dataZoom: garamTrenLabels.length > 8 ? [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }] : [],
      series: [{
        name: 'Produksi',
        type: 'line',
        data: garamTrenValues,
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: isDark ? '#3b82f6' : '#0077b6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: isDark
              ? [{ offset: 0, color: 'rgba(59, 130, 246, 0.5)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }]
              : [{ offset: 0, color: 'rgba(0, 119, 182, 0.5)' }, { offset: 1, color: 'rgba(0, 119, 182, 0.05)' }]
          }
        }
      }]
    };
  }, [garamTrenLabels, garamTrenValues, isDark]);

  // ── VISUALISASI MANGROVE ──
  const filteredVisMangrove = useMemo(() => dataMangrove.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataMangrove, filterTahun, filterKab]);

  const visMangrovePerKota = useMemo(() => {
    const agg = {};
    filteredVisMangrove.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
    });
    return Object.values(agg).sort((a, b) => b.luas_eksisting - a.luas_eksisting);
  }, [filteredVisMangrove]);

  const kpiMangrove = useMemo(() => {
    return {
      luas_eksisting: visMangrovePerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visMangrovePerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisMangrove.length,
    };
  }, [visMangrovePerKota, filteredVisMangrove.length]);

  const mangroveKota = visMangrovePerKota.map(d => d.name);
  const mangroveEksisting = visMangrovePerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
  const mangroveRehab = visMangrovePerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

  const kondisiChartData = useMemo(() => {
    const agg = {};
    filteredVisMangrove.forEach(d => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
    });
    return [
      { name: 'Sangat Padat (70-100%)', value: agg['Sangat Padat (70-100%)'] || 0 },
      { name: 'Sedang (30-70%)', value: agg['Sedang (30-70%)'] || 0 },
      { name: 'Jarang (0-30%)', value: agg['Jarang (0-30%)'] || 0 },
    ];
  }, [filteredVisMangrove]);

  // ── VISUALISASI LAMUN ──
  const filteredVisLamun = useMemo(() => dataLamun.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataLamun, filterTahun, filterKab]);

  const visLamunPerKota = useMemo(() => {
    const agg = {};
    filteredVisLamun.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
    });
    return Object.values(agg).sort((a, b) => b.luas_eksisting - a.luas_eksisting);
  }, [filteredVisLamun]);

  const kpiLamun = useMemo(() => {
    return {
      luas_eksisting: visLamunPerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visLamunPerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisLamun.length,
    };
  }, [visLamunPerKota, filteredVisLamun.length]);

  const lamunKota = visLamunPerKota.map(d => d.name);
  const lamunEksisting = visLamunPerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
  const lamunRehab = visLamunPerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

  const kondisiLamunChartData = useMemo(() => {
    const agg = {};
    filteredVisLamun.forEach(d => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
    });
    return [
      { name: 'Kaya (60-100%)', value: agg['Kaya (60-100%)'] || 0 },
      { name: 'Kurang Kaya (30-60%)', value: agg['Kurang Kaya (30-60%)'] || 0 },
      { name: 'Miskin (0-30%)', value: agg['Miskin (0-30%)'] || 0 },
    ];
  }, [filteredVisLamun]);

  // ── VISUALISASI TERUMBU KARANG ──
  const filteredVisTerumbu = useMemo(() => dataTerumbuKarang.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataTerumbuKarang, filterTahun, filterKab]);

  const visTerumbuPerKota = useMemo(() => {
    const agg = {};
    filteredVisTerumbu.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
    });
    return Object.values(agg).sort((a, b) => b.luas_eksisting - a.luas_eksisting);
  }, [filteredVisTerumbu]);

  const kpiTerumbu = useMemo(() => {
    return {
      luas_eksisting: visTerumbuPerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visTerumbuPerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisTerumbu.length,
    };
  }, [visTerumbuPerKota, filteredVisTerumbu.length]);

  const terumbuKota = visTerumbuPerKota.map(d => d.name);
  const terumbuEksisting = visTerumbuPerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
  const terumbuRehab = visTerumbuPerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

  const kondisiTerumbuChartData = useMemo(() => {
    const agg = {};
    filteredVisTerumbu.forEach(d => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
    });
    return [
      { name: 'Sangat Baik (75-100%)', value: agg['Sangat Baik (75-100%)'] || 0 },
      { name: 'Baik (50-75%)', value: agg['Baik (50-75%)'] || 0 },
      { name: 'Sedang (25-50%)', value: agg['Sedang (25-50%)'] || 0 },
      { name: 'Rusak (0-25%)', value: agg['Rusak (0-25%)'] || 0 },
    ];
  }, [filteredVisTerumbu]);

  // ── TABEL DATA ──
  const filteredTableGaram = useMemo(() => dataGaram.filter(d =>
    (filterBulan.length === 0 || filterBulan.includes(formatBulan(d.bulan))) &&
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataGaram, filterBulan, filterTahun, filterKab]);

  const filteredTablePotensi = useMemo(() => dataPotensi.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun_data))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataPotensi, filterTahun, filterKab]);

  const filteredTableMangrove = useMemo(() => dataMangrove.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataMangrove, filterTahun, filterKab]);

  const filteredTableLamun = useMemo(() => dataLamun.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataLamun, filterTahun, filterKab]);

  const filteredTableTerumbu = useMemo(() => dataTerumbuKarang.filter(d =>
    (filterTahun.length === 0 || filterTahun.includes(String(d.tahun))) &&
    (filterKab.length === 0 || filterKab.includes(d.kabupaten_kota))
  ), [dataTerumbuKarang, filterTahun, filterKab]);

  const columnsGaram = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Lahan (Ha)', accessorKey: 'luas_total_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Petambak', accessorKey: 'jumlah_petambak' },
    { header: 'Kelompok', accessorKey: 'jumlah_kelompok' },
    { header: 'Total Produksi (Ton)', accessorKey: 'total_produksi_ton', cell: info => <span className="font-semibold">{numFmt(info.getValue())}</span> },
  ], []);

  const columnsPotensi = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun_data' },
    { header: 'Luas Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => numFmt(info.getValue()) },
    {
      header: 'Total Panjang Garis Pantai (Km)',
      accessorKey: 'total_panjang_garis_pantai_km',
      cell: info => <span className="font-semibold">{numFmt(info.getValue())}</span>,
    },
    { header: 'Jumlah Pulau-Pulau Kecil', accessorKey: 'jumlah_pulau_kecil' },
    { header: 'Desa Pesisir', accessorKey: 'desa_pesisir' },
  ], []);

  const columnsMangrove = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Eksisting (Ha)', accessorKey: 'luas_eksisting_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Spesies', accessorKey: 'spesies' },
    { header: 'Kondisi', accessorKey: 'kondisi' },
    { header: 'Persentase (%)', accessorKey: 'persentase_kondisi', cell: info => numFmt(info.getValue()) },
    { header: 'Luas Rehabilitasi (Ha)', accessorKey: 'luas_rehabilitasi_ha', cell: info => numFmt(info.getValue()) },
  ], []);

  const columnsLamun = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Eksisting (Ha)', accessorKey: 'luas_eksisting_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Tutupan (%)', accessorKey: 'persentase_tutupan', cell: info => numFmt(info.getValue()) },
    { header: 'Kondisi', accessorKey: 'kondisi' },
    { header: 'Luas Rehabilitasi (Ha)', accessorKey: 'luas_rehabilitasi_ha', cell: info => numFmt(info.getValue()) },
  ], []);

  const columnsTerumbuKarang = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Eksisting (Ha)', accessorKey: 'luas_eksisting_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Tutupan (%)', accessorKey: 'persentase_tutupan', cell: info => numFmt(info.getValue()) },
    { header: 'Kondisi', accessorKey: 'kondisi' },
    { header: 'Luas Rehabilitasi (Ha)', accessorKey: 'luas_rehabilitasi_ha', cell: info => numFmt(info.getValue()) },
  ], []);

  const handleExport = async (rows) => {
    if (!rows || rows.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const isGaram = activeTable === 'garam';
    let cols = columnsPotensi;
    let yearField = 'tahun';
    
    if (activeTable === 'garam') { cols = columnsGaram; yearField = 'tahun'; }
    else if (activeTable === 'potensi') { cols = columnsPotensi; yearField = 'tahun_data'; }
    else if (activeTable === 'mangrove') { cols = columnsMangrove; yearField = 'tahun'; }
    else if (activeTable === 'terumbu_karang') { cols = columnsTerumbuKarang; yearField = 'tahun'; }
    else if (activeTable === 'lamun') { cols = columnsLamun; yearField = 'tahun'; }

    const buildSheet = (sheetName, dataRows) => {
      const safeName = sheetName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
      const sheet = workbook.addWorksheet(safeName);

      sheet.addRow(cols.map(c => c.header));
      sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      dataRows.forEach(row => {
        const rowData = cols.map(c => c.accessorFn ? c.accessorFn(row) : (row[c.accessorKey] ?? ''));
        const addedRow = sheet.addRow(rowData);
        addedRow.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      sheet.columns.forEach(col => { col.width = 18; });
    };

    const availableYears = [...new Set(rows.map(r => r[yearField]))].sort((a, b) => a - b);
    const isMultiYear = availableYears.length > 1;

    if (!isGaram) {
      if (isMultiYear) {
        buildSheet('Rekap Semua Tahun', rows);
        availableYears.forEach(yr => buildSheet(`Potensi ${yr}`, rows.filter(r => r[yearField] === yr)));
      } else {
        buildSheet(`Potensi ${availableYears[0] || 'Data'}`, rows);
      }
    } else {
      const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      const normalizeBulan = (val) => {
        if (!val && val !== 0) return '';
        const b = String(val).trim().toLowerCase();
        const num = parseInt(b, 10);
        if (!isNaN(num) && num >= 1 && num <= 12) return NAMA_BULAN[num - 1].toLowerCase();
        return b;
      };

      const processForYear = (yrData, yr) => {
        const yrSuffix = isMultiYear ? ` ${yr}` : '';
        const hasKab = Array.isArray(filterKab) ? filterKab.length > 0 : !!filterKab;
        const hasBulan = Array.isArray(filterBulan) ? filterBulan.length > 0 : !!filterBulan;

        if (hasKab && !hasBulan) {
          const kabLabel = Array.isArray(filterKab) ? filterKab.join(', ') : filterKab;
          buildSheet(`KAB ${kabLabel.substring(0, 15)}${yrSuffix}`, yrData);
          return;
        }
        if (hasBulan) {
          const bulanLabel = Array.isArray(filterBulan) ? filterBulan.join('_') : filterBulan;
          buildSheet(`${bulanLabel.substring(0, 3)}${yrSuffix}`, yrData);
          return;
        }

        NAMA_BULAN.forEach(bln => {
          const dataBulan = yrData.filter(d => normalizeBulan(d.bulan) === bln.toLowerCase());
          if (dataBulan.length > 0) {
            buildSheet(`${bln.substring(0, 3)}${yrSuffix}`, dataBulan);
          }
        });
        buildSheet(`Rekap${yrSuffix}`, yrData);
      };

      if (isMultiYear) {
        buildSheet('Rekap Semua Tahun', rows);
        availableYears.forEach(yr => {
          const yrData = rows.filter(r => r[yearField] === yr);
          processForYear(yrData, yr);
        });
      } else {
        processForYear(rows, availableYears[0]);
      }
    }

    const hasTahunFilter = Array.isArray(filterTahun) ? filterTahun.length > 0 : !!filterTahun;
    const hasKabFilter = Array.isArray(filterKab) ? filterKab.length > 0 : !!filterKab;
    const hasBulanFilter = Array.isArray(filterBulan) ? filterBulan.length > 0 : !!filterBulan;

    const yearString = hasTahunFilter
      ? (Array.isArray(filterTahun) ? filterTahun.join('-') : filterTahun)
      : (isMultiYear ? 'MultiTahun' : (availableYears[0] || new Date().getFullYear()));
    let filename = `Data_${activeTable}_${yearString}`;
    if (hasKabFilter) filename += `_${Array.isArray(filterKab) ? filterKab.join('-') : filterKab}`;
    if (hasBulanFilter && isGaram) filename += `_${Array.isArray(filterBulan) ? filterBulan.join('-') : filterBulan}`;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename.replace(/\s+/g, '_')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Visualisasi Data...</p>
      </div>
    );
  }

  const allData = [...dataGaram, ...dataPotensi, ...dataMangrove, ...dataLamun, ...dataTerumbuKarang];

  const validDates = allData
    .map(d => new Date(d.updated_at || d.updatedAt || d.created_at || d.createdAt))
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.getTime());

  const latestDate = validDates.length > 0 ? new Date(Math.max(...validDates)) : null;
  const lastUpdated = latestDate 
    ? format(latestDate, "dd MMM yyyy HH:mm", { locale: idLocale })
    : '-';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Statistik Kelautan dan Pesisir
          </h1>
        </div>

        <div 
          className="
            inline-flex item-center gap-2
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

      {/* ── Filter Global ── */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <div>
            <SearchableMultiSelect value={filterTahun} onChange={setFilterTahun} placeholder="Semua Tahun" options={[...new Set((activeTable === 'garam' ? dataGaram : activeTable === 'mangrove' ? dataMangrove : activeTable === 'terumbu_karang' ? dataTerumbuKarang : activeTable === 'lamun' ? dataLamun : dataPotensi).map(d => String(d.tahun || d.tahun_data)))].filter(Boolean).sort()} />
          </div>
          <div>
            <SearchableMultiSelect value={filterBulan} onChange={setFilterBulan} placeholder="Semua Bulan" options={['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']} />
          </div>
          <div>
            <SearchableMultiSelect value={filterKab} onChange={setFilterKab} placeholder="Semua Kab/Kota" options={[...new Set((activeTable === 'garam' ? dataGaram : activeTable === 'mangrove' ? dataMangrove : activeTable === 'terumbu_karang' ? dataTerumbuKarang : activeTable === 'lamun' ? dataLamun : dataPotensi).map(d => d.kabupaten_kota))].filter(Boolean).sort()} />
          </div>
        </div>
        {(filterTahun.length > 0 || filterBulan.length > 0 || filterKab.length > 0) && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => { setFilterTahun([]); setFilterBulan([]); setFilterKab([]); }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* ── Potensi Perairan KPI (TOP) ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Anchor className="w-5 h-5 text-cyan-600" />
          <h2 className="text-xl font-bold text-foreground">Potensi Perairan</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-orange-500" /><p className="text-sm font-medium text-muted-foreground">Jumlah Pulau-Pulau Kecil</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.pulau_kecil)} <span className="text-sm text-muted-foreground font-normal">Pulau</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><Waves className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Panjang Total Garis Pantai</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.garis_pantai)} <span className="text-sm text-muted-foreground font-normal">Km</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><Anchor className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Luas Wilayah Laut</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.luas_laut)} <span className="text-sm text-muted-foreground font-normal">Km²</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-pink-500" /><p className="text-sm font-medium text-muted-foreground">Jumlah Desa Pesisir</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.desa_pesisir)} <span className="text-sm text-muted-foreground font-normal">Desa</span></p>
          </div>
        </div>
      </div>

      {/* ── Visualisasi Garam ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Produksi Garam</h2>
          </div>
        </div>
        
        {/* Garam KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><FlaskConical className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Produksi Garam</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.produksi)} <span className="text-sm text-muted-foreground font-normal">Ton</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><Fish className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Total Petambak Garam</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.petambak)} <span className="text-sm text-muted-foreground font-normal">Orang</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2"><Landmark className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Lahan Tambak</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.lahan)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
          </div>
        </div>

        {/* Garam Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Volume Produksi per Kab/Kota (Ton)</h3>
            {garamKota.length > 0
              ? (() => { const s = sortBarData(garamKota, garamProduksi); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, isDark ? '#3b82f6' : '#0077b6', 'Ton', isDark)} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Jumlah Kelompok per Kab/Kota</h3>
            {garamKota.length > 0
              ? (() => { const s = sortBarData(garamKota, garamKelompok); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, '#0ea5e9', 'Kelompok', isDark)} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Lahan per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={pieOption('Luas Lahan', visGaramPerKota, 'name', 'luas_lahan', isDark)} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Jumlah Petambak per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={pieOption('Jumlah Petambak', visGaramPerKota, 'name', 'petambak', isDark)} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Tren Bulanan Produksi Garam (Ton)</h3>
            {garamTrenLabels.length > 0
              ? <ReactECharts option={garamTrenOption} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>
      
      {/* ── Visualisasi Mangrove ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Mangrove</h2>
          </div>
        </div>

        {/* Mangrove Charts & KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Distribusi Kategori Kondisi Mangrove</h3>
            {kpiMangrove.jumlah_lokasi > 0
              ? <ReactECharts option={kondisiPieOption(kondisiChartData, isDark)} style={{ height: '240px', width: '100%' }} />
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          
          <div className="flex flex-col gap-3 justify-center h-full">
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><TreePine className="w-6 h-6 text-emerald-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Eksisting</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-cyan-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Rehabilitasi</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Eksisting per Kab/Kota (Ha)</h3>
            {mangroveKota.length > 0
              ? (() => { const s = sortBarData(mangroveKota, mangroveEksisting); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, isDark ? '#3b82f6' : '#0077b6', 'Ha', isDark)} style={{ height: Math.max(240, mangroveKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
            {mangroveKota.length > 0
              ? (() => { const s = sortBarData(mangroveKota, mangroveRehab); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, '#0ea5e9', 'Ha', isDark)} style={{ height: Math.max(240, mangroveKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Visualisasi Terumbu Karang ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-500" />
            <h2 className="text-xl font-bold text-foreground">Terumbu Karang</h2>
          </div>
        </div>

        {/* Terumbu Karang Charts & KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Distribusi Kategori Kondisi Terumbu Karang</h3>
            {kpiTerumbu.jumlah_lokasi > 0
              ? <ReactECharts option={kondisiTerumbuPieOption(kondisiTerumbuChartData, isDark)} style={{ height: '240px', width: '100%' }} />
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          
          <div className="flex flex-col gap-3 justify-center h-full">
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3"><Waves className="w-6 h-6 text-sky-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Eksisting</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiTerumbu.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-pink-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Rehabilitasi</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiTerumbu.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Eksisting per Kab/Kota (Ha)</h3>
            {terumbuKota.length > 0
              ? (() => { const s = sortBarData(terumbuKota, terumbuEksisting); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, isDark ? '#3b82f6' : '#0077b6', 'Ha', isDark)} style={{ height: Math.max(240, terumbuKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
            {terumbuKota.length > 0
              ? (() => { const s = sortBarData(terumbuKota, terumbuRehab); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, '#0ea5e9', 'Ha', isDark)} style={{ height: Math.max(240, terumbuKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Visualisasi Lamun ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Lamun</h2>
          </div>
        </div>

        {/* Lamun Charts & KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Distribusi Kategori Kondisi Lamun</h3>
            {kpiLamun.jumlah_lokasi > 0
              ? <ReactECharts option={kondisiLamunPieOption(kondisiLamunChartData, isDark)} style={{ height: '240px', width: '100%' }} />
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          
          <div className="flex flex-col gap-3 justify-center h-full">
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-emerald-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Eksisting</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
            <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3"><TreePine className="w-6 h-6 text-purple-500" /><p className="text-base font-bold text-slate-700 dark:text-slate-200">Total Luas Rehabilitasi</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Eksisting per Kab/Kota (Ha)</h3>
            {lamunKota.length > 0
              ? (() => { const s = sortBarData(lamunKota, lamunEksisting); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, isDark ? '#3b82f6' : '#0077b6', 'Ha', isDark)} style={{ height: Math.max(240, lamunKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 text-center tracking-wide">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
            {lamunKota.length > 0
              ? (() => { const s = sortBarData(lamunKota, lamunRehab); return (
                  <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                    <ReactECharts option={hBarOption(s.categories, s.values, '#0ea5e9', 'Ha', isDark)} style={{ height: Math.max(240, lamunKota.length * 32) + 'px' }} />
                  </div>
                ); })()
              : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Tabel Data + Filter ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto min-h-[600px] mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Data Kelautan dan Pesisir</h2>
        <div className="flex flex-col gap-4 mb-6 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTable('potensi')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'potensi' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Anchor className="w-6 h-6 inline mr-1.5" /> Potensi Perairan
            </button>
            <button
              onClick={() => setActiveTable('garam')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'garam' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <FlaskConical className="w-6 h-6 inline mr-1.5" /> Garam
            </button>
            <button
              onClick={() => setActiveTable('mangrove')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'mangrove' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <TreePine className="w-6 h-6 inline mr-1.5" /> Mangrove
            </button>
            <button
              onClick={() => setActiveTable('terumbu_karang')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'terumbu_karang' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Waves className="w-6 h-6 inline mr-1.5" /> Terumbu Karang
            </button>
            <button
              onClick={() => setActiveTable('lamun')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'lamun' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Leaf className="w-6 h-6 inline mr-1.5" /> Lamun
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="flex-1">
              <SearchableMultiSelect value={filterTahun} onChange={setFilterTahun} placeholder="Semua Tahun" options={[...new Set((activeTable === 'garam' ? dataGaram : activeTable === 'mangrove' ? dataMangrove : activeTable === 'terumbu_karang' ? dataTerumbuKarang : activeTable === 'lamun' ? dataLamun : dataPotensi).map(d => String(d.tahun || d.tahun_data)))].filter(Boolean).sort()} />
            </div>
            <div className="flex-1">
              <SearchableMultiSelect value={filterBulan} onChange={setFilterBulan} placeholder="Semua Bulan" options={['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']} />
            </div>
            <div className="flex-1">
              <SearchableMultiSelect value={filterKab} onChange={setFilterKab} placeholder="Semua Kab/Kota" options={[...new Set((activeTable === 'garam' ? dataGaram : activeTable === 'mangrove' ? dataMangrove : activeTable === 'terumbu_karang' ? dataTerumbuKarang : activeTable === 'lamun' ? dataLamun : dataPotensi).map(d => d.kabupaten_kota))].filter(Boolean).sort()} />
            </div>
          </div>
        </div>

        <DataTable
          columns={activeTable === 'garam' ? columnsGaram : activeTable === 'potensi' ? columnsPotensi : activeTable === 'mangrove' ? columnsMangrove : activeTable === 'terumbu_karang' ? columnsTerumbuKarang : columnsLamun}
          data={activeTable === 'garam' ? filteredTableGaram : activeTable === 'potensi' ? filteredTablePotensi : activeTable === 'mangrove' ? filteredTableMangrove : activeTable === 'terumbu_karang' ? filteredTableTerumbu : filteredTableLamun}
          exportName={`Data_${activeTable}`}
          onCustomExport={handleExport}
        />
      </div>
    </div>
  );
}