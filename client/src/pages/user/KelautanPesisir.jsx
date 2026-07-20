import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import {
  Loader2, Waves, Anchor, FlaskConical, MapPin, Filter,
  TreePine, Landmark, Globe, Fish, Info, Clock, Leaf
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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

const hBarOption = (categories, values, color, unit) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID')} ${unit}` },
  grid: { left: 140, right: 40, top: 10, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#475569', fontSize: 11, fontWeight: 500 }, axisTick: { show: false } },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 28 }],
});

const pieOption = (title, data, nameField, valueField) => ({
  color: CHART_PALETTE,
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.map(d => ({ name: d[nameField], value: d[valueField] })).filter(d => d.value > 0),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

const KONDISI_COLOR_MAP = {
  'Sangat Padat (70-100%)': '#10b981',
  'Sedang (30-70%)': '#f59e0b',
  'Jarang (0-30%)': '#f43f5e',
};
const kondisiPieOption = (data) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_COLOR_MAP[d.name] } })),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

const mangroveComboOption = (categories, eksisting, rehab) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['Luas Eksisting', 'Luas Rehabilitasi'], top: 0, textStyle: { color: '#475569', fontSize: 11 } },
  grid: { left: 140, right: 30, top: 40, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#475569', fontSize: 11, fontWeight: 500 }, axisTick: { show: false } },
  series: [
    { name: 'Luas Eksisting', data: eksisting, type: 'bar', itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14 },
    { name: 'Luas Rehabilitasi', data: rehab, type: 'bar', itemStyle: { color: '#06b6d4', borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14 },
  ],
});

const KONDISI_LAMUN_COLOR_MAP = {
  'Kaya (60-100%)': '#10b981',
  'Kurang Kaya (30-60%)': '#f59e0b',
  'Miskin (0-30%)': '#f43f5e',
};
const kondisiLamunPieOption = (data) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_LAMUN_COLOR_MAP[d.name] } })),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

const lamunComboOption = (categories, eksisting, rehab) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['Luas Eksisting', 'Luas Rehabilitasi'], top: 0, textStyle: { color: '#475569', fontSize: 11 } },
  grid: { left: 140, right: 30, top: 40, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#475569', fontSize: 11, fontWeight: 500 }, axisTick: { show: false } },
  series: [
    { name: 'Luas Eksisting', data: eksisting, type: 'bar', itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14 },
    { name: 'Luas Rehabilitasi', data: rehab, type: 'bar', itemStyle: { color: '#8b5cf6', borderRadius: [0, 4, 4, 0] }, barMaxWidth: 14 },
  ],
});

export default function KelautanPesisir() {
  const [loading, setLoading] = useState(true);
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensi, setDataPotensi] = useState([]);
  const [dataMangrove, setDataMangrove] = useState([]);
  const [dataLamun, setDataLamun] = useState([]);

  // Global Filters
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKab, setFilterKab] = useState('');

  // Table Filters
  const [activeTable, setActiveTable] = useState('garam');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [garamRes, potensiRes, mangroveRes, lamunRes] = await Promise.all([
          api.get('/kelautan-pesisir/garam/public'),
          api.get('/kelautan-pesisir/potensi-perairan/public'),
          api.get('/kelautan-pesisir/mangrove/public'),
          api.get('/kelautan-pesisir/lamun/public')
        ]);
        setDataGaram(garamRes.data.data || []);
        setDataPotensi(potensiRes.data.data || []);
        setDataMangrove(mangroveRes.data.data || []);
        setDataLamun(lamunRes.data.data || []);
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
    const set = new Set([...dataGaram, ...dataPotensi, ...dataMangrove, ...dataLamun].map(d => d.kabupaten_kota).filter(Boolean));
    return [...set].sort();
  }, [dataGaram, dataPotensi, dataMangrove, dataLamun]);

  const tahunOptions = useMemo(() => {
    const set = new Set([
      ...dataGaram.map(d => d.tahun), 
      ...dataPotensi.map(d => d.tahun_data),
      ...dataMangrove.map(d => d.tahun),
      ...dataLamun.map(d => d.tahun)
    ].filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [dataGaram, dataPotensi, dataMangrove, dataLamun]);

  // ── KPI Potensi Perairan ──
  const filteredVisPotensi = useMemo(() => dataPotensi.filter(d => 
    (!filterTahun || String(d.tahun_data) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataPotensi, filterTahun, filterKab]);

  const potensiPerKotaFrontend = useMemo(() => {
    const agg = {};
    filteredVisPotensi.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { ...d };
      else if ((d.tahun_data || 0) > (agg[kab].tahun_data || 0)) agg[kab] = { ...d };
    });
    return Object.values(agg);
  }, [dataPotensi]);

  const kpiPotensi = useMemo(() => {
    return {
      pulau_kecil: potensiPerKotaFrontend.reduce((s, d) => s + (d.jumlah_pulau_kecil || 0), 0),
      garis_pantai: potensiPerKotaFrontend.reduce((s, d) => s + (d.panjang_pantai_utara_km || 0) + (d.panjang_pantai_selatan_km || 0) + (d.panjang_pantai_timur_km || 0) + (d.panjang_pantai_barat_km || 0), 0),
      luas_laut: potensiPerKotaFrontend.reduce((s, d) => s + (d.luas_wilayah_laut_km2 || 0), 0),
      desa_pesisir: potensiPerKotaFrontend.reduce((s, d) => s + (d.desa_pesisir || 0), 0),
    };
  }, [potensiPerKotaFrontend]);

  // ── VISUALISASI GARAM ──
  const filteredVisGaram = useMemo(() => dataGaram.filter(d => 
    (!filterBulan || (d.bulan || '').toLowerCase() === filterBulan.toLowerCase()) &&
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataGaram, filterBulan, filterTahun, filterKab]);

  const visGaramPerKota = useMemo(() => {
    const agg = {};
    filteredVisGaram.forEach(d => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, produksi: 0, kelompok: 0, luas_lahan: 0, petambak: 0 };
      agg[kab].produksi += (d.total_produksi_ton || 0);
      agg[kab].kelompok = Math.max(agg[kab].kelompok, d.jumlah_kelompok || 0);
      agg[kab].luas_lahan = Math.max(agg[kab].luas_lahan, d.luas_total_ha || 0);
      agg[kab].petambak = Math.max(agg[kab].petambak, d.jumlah_petambak || 0);
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

  // ── VISUALISASI MANGROVE ──
  const filteredVisMangrove = useMemo(() => dataMangrove.filter(d =>
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
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
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
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

  // ── TABEL DATA ──
  const filteredTableGaram = useMemo(() => dataGaram.filter(d =>
    (!filterBulan || (d.bulan || '').toLowerCase() === filterBulan.toLowerCase()) &&
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataGaram, filterBulan, filterTahun, filterKab]);

  const filteredTablePotensi = useMemo(() => dataPotensi.filter(d =>
    (!filterTahun || String(d.tahun_data) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataPotensi, filterTahun, filterKab]);

  const filteredTableMangrove = useMemo(() => dataMangrove.filter(d =>
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataMangrove, filterTahun, filterKab]);

  const filteredTableLamun = useMemo(() => dataLamun.filter(d =>
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataLamun, filterTahun, filterKab]);

  const columnsGaram = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Lahan (Ha)', accessorKey: 'luas_total_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Petambak', accessorKey: 'jumlah_petambak' },
    { header: 'Kelompok', accessorKey: 'jumlah_kelompok' },
    { header: 'Total Produksi (Ton)', accessorKey: 'total_produksi_ton', cell: info => <span className="font-semibold text-emerald-600">{numFmt(info.getValue())}</span> },
  ], []);

  const columnsPotensi = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun_data' },
    { header: 'Luas Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => numFmt(info.getValue()) },
    {
      header: 'Total Garis Pantai (km)',
      accessorFn: (row) => (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) + (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0),
      cell: info => <span className="font-semibold text-cyan-600">{numFmt(info.getValue())}</span>,
    },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil' },
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
        
        if (filterKab && !filterBulan) {
          buildSheet(`KAB ${filterKab.substring(0, 15)}${yrSuffix}`, yrData);
          return;
        }
        if (filterBulan) {
          buildSheet(`${filterBulan.substring(0, 3)}${yrSuffix}`, yrData);
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

    const yearString = filterTahun ? filterTahun : (isMultiYear ? 'MultiTahun' : (availableYears[0] || new Date().getFullYear()));
    let filename = `Data_${activeTable}_${yearString}`;
    if (filterKab) filename += `_${filterKab}`;
    if (filterBulan && isGaram) filename += `_${filterBulan}`;

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

  const allData = [...dataGaram, ...dataPotensi, ...dataMangrove, ...dataLamun];

  const validDates = allData
    .map(d => new Date(d.updatedAt || d.createdAt))
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.getTime());

  const latestDate = validDates.length > 0 ? new Date(Math.max(...validDates)) : null;
  const lastUpdated = latestDate 
    ? formatDistanceToNow(latestDate, { addSuffix: true, locale: idLocale })
    : '-';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Kelautan dan Pesisir</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data Kelautan, Pesisir, dan Potensi Perairan Jawa Timur.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-500/20 shadow-sm shrink-0">
          <Clock className="w-4 h-4 animate-pulse" />
          Terakhir Diperbarui: {lastUpdated}
        </div>
      </div>

      {/* ── Filter Global ── */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end shadow-sm">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
          <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Semua Tahun</option>
            {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Semua Bulan</option>
            {bulanOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
          <select value={filterKab} onChange={(e) => setFilterKab(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">Semua Kab/Kota</option>
            {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        {(filterTahun || filterBulan || filterKab) && (
          <button onClick={() => { setFilterTahun(''); setFilterBulan(''); setFilterKab(''); }} className="w-full md:w-auto text-destructive hover:text-destructive/80 text-sm font-medium px-4 py-2.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 transition-colors">
            Reset Filter
          </button>
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
            <div className="absolute -right-4 -bottom-4 bg-orange-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-orange-500" /><p className="text-sm font-medium text-muted-foreground">Jml. Pulau-Pulau Kecil</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.pulau_kecil)} <span className="text-sm text-muted-foreground font-normal">Pulau</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-cyan-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Waves className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Total Garis Pantai</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.garis_pantai)} <span className="text-sm text-muted-foreground font-normal">Km</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Anchor className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Luas Wilayah Laut</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.luas_laut)} <span className="text-sm text-muted-foreground font-normal">Km²</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-pink-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
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
            <h2 className="text-xl font-bold text-foreground">Visualisasi Produksi Garam</h2>
          </div>
        </div>
        
        {/* Garam KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><FlaskConical className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Produksi Garam</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.produksi)} <span className="text-sm text-muted-foreground font-normal">Ton</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-amber-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Fish className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Total Petambak Garam</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.petambak)} <span className="text-sm text-muted-foreground font-normal">Orang</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Landmark className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Lahan Tambak</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.lahan)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
          </div>
        </div>

        {/* Garam Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Volume Produksi per Kab/Kota (Ton)</h3>
            {garamKota.length > 0
              ? <ReactECharts option={hBarOption(garamKota, garamProduksi, '#0891b2', 'Ton')} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Kelompok per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={hBarOption(garamKota, garamKelompok, '#7c3aed', 'Kelompok')} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Lahan per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={pieOption('Luas Lahan', visGaramPerKota, 'name', 'luas_lahan')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Petambak per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={pieOption('Jumlah Petambak', visGaramPerKota, 'name', 'petambak')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>
      
      {/* ── Visualisasi Mangrove ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Visualisasi Kondisi Mangrove</h2>
          </div>
        </div>

        {/* Mangrove KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><TreePine className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Eksisting</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_eksisting)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-cyan-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Leaf className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Rehabilitasi</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_rehabilitasi)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-amber-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Jumlah Titik Data</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.jumlah_lokasi)} <span className="text-sm text-muted-foreground font-normal">Lokasi</span></p>
          </div>
        </div>

        {/* Mangrove Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Eksisting per Kab/Kota (Ha)</h3>
            {mangroveKota.length > 0
              ? <ReactECharts option={hBarOption(mangroveKota, mangroveEksisting, '#10b981', 'Ha')} style={{ height: Math.max(320, mangroveKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
            {mangroveKota.length > 0
              ? <ReactECharts option={hBarOption(mangroveKota, mangroveRehab, '#06b6d4', 'Ha')} style={{ height: Math.max(320, mangroveKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Distribusi Kategori Kondisi Tutupan</h3>
            {kpiMangrove.jumlah_lokasi > 0
              ? <ReactECharts option={kondisiPieOption(kondisiChartData)} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Eksisting vs Rehabilitasi per Kab/Kota</h3>
            {mangroveKota.length > 0
              ? <ReactECharts option={mangroveComboOption(mangroveKota, mangroveEksisting, mangroveRehab)} style={{ height: Math.max(320, mangroveKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Placeholder Visualisasi Terumbu Karang ── */}
      <div className="bg-muted/30 border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center text-muted-foreground text-center">
        <Info className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-medium text-foreground">Visualisasi Terumbu Karang</p>
        <p className="text-sm">Segera hadir pada pembaruan berikutnya.</p>
      </div>

      {/* ── Visualisasi Lamun ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold text-foreground">Visualisasi Kondisi Lamun</h2>
          </div>
        </div>

        {/* Lamun KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><Leaf className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Eksisting</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_eksisting)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-cyan-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><TreePine className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Rehabilitasi</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_rehabilitasi)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-amber-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Jumlah Titik Data</p></div>
            <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.jumlah_lokasi)} <span className="text-sm text-muted-foreground font-normal">Lokasi</span></p>
          </div>
        </div>

        {/* Lamun Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Eksisting per Kab/Kota (Ha)</h3>
            {lamunKota.length > 0
              ? <ReactECharts option={hBarOption(lamunKota, lamunEksisting, '#10b981', 'Ha')} style={{ height: Math.max(320, lamunKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
            {lamunKota.length > 0
              ? <ReactECharts option={hBarOption(lamunKota, lamunRehab, '#8b5cf6', 'Ha')} style={{ height: Math.max(320, lamunKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Distribusi Kategori Kondisi Tutupan</h3>
            {kpiLamun.jumlah_lokasi > 0
              ? <ReactECharts option={kondisiLamunPieOption(kondisiLamunChartData)} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Eksisting vs Rehabilitasi per Kab/Kota</h3>
            {lamunKota.length > 0
              ? <ReactECharts option={lamunComboOption(lamunKota, lamunEksisting, lamunRehab)} style={{ height: Math.max(320, lamunKota.length * 38) + 'px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Tabel Data + Filter ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto min-h-[600px] mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Data Kelautan dan Pesisir</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTable('potensi')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'potensi' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Anchor className="w-4 h-4 inline mr-1.5" /> Potensi Perairan
            </button>
            <button
              onClick={() => setActiveTable('garam')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'garam' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <FlaskConical className="w-4 h-4 inline mr-1.5" /> Garam
            </button>
            <button
              onClick={() => setActiveTable('mangrove')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'mangrove' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <TreePine className="w-4 h-4 inline mr-1.5" /> Mangrove
            </button>
            <button
              onClick={() => setActiveTable('lamun')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'lamun' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Leaf className="w-4 h-4 inline mr-1.5" /> Lamun
            </button>
          </div>
        </div>

        <DataTable
          columns={activeTable === 'garam' ? columnsGaram : activeTable === 'potensi' ? columnsPotensi : activeTable === 'mangrove' ? columnsMangrove : columnsLamun}
          data={activeTable === 'garam' ? filteredTableGaram : activeTable === 'potensi' ? filteredTablePotensi : activeTable === 'mangrove' ? filteredTableMangrove : filteredTableLamun}
          exportName={`Data_${activeTable}`}
          onCustomExport={handleExport}
        />
      </div>
    </div>
  );
}