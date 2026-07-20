import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import {
  Loader2, Waves, Anchor, FlaskConical, MapPin, Filter,
  TreePine, Landmark, Globe, Fish, Info, Clock
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

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

export default function KelautanPesisir() {
  const [loading, setLoading] = useState(true);
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensi, setDataPotensi] = useState([]);

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
        const [garamRes, potensiRes] = await Promise.all([
          api.get('/kelautan-pesisir/garam/public'),
          api.get('/kelautan-pesisir/potensi-perairan/public')
        ]);
        setDataGaram(garamRes.data.data || []);
        setDataPotensi(potensiRes.data.data || []);
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
    const set = new Set([...dataGaram, ...dataPotensi].map(d => d.kabupaten_kota).filter(Boolean));
    return [...set].sort();
  }, [dataGaram, dataPotensi]);

  const tahunOptions = useMemo(() => {
    const set = new Set([...dataGaram.map(d => d.tahun), ...dataPotensi.map(d => d.tahun_data)].filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [dataGaram, dataPotensi]);

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

  const handleExport = async (rows) => {
    if (!rows || rows.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const isGaram = activeTable === 'garam';
    const cols = isGaram ? columnsGaram : columnsPotensi;
    const yearField = isGaram ? 'tahun' : 'tahun_data';

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
        
        if (tableFilterKab && !tableFilterBulan) {
          buildSheet(`KAB ${tableFilterKab.substring(0, 15)}${yrSuffix}`, yrData);
          return;
        }
        if (tableFilterBulan) {
          buildSheet(`${tableFilterBulan.substring(0, 3)}${yrSuffix}`, yrData);
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

    const yearString = tableFilterTahun ? tableFilterTahun : (isMultiYear ? 'MultiTahun' : (availableYears[0] || new Date().getFullYear()));
    let filename = `Data_${isGaram ? 'Garam' : 'Potensi_Perairan'}_${yearString}`;
    if (tableFilterKab) filename += `_${tableFilterKab}`;
    if (tableFilterBulan && isGaram) filename += `_${tableFilterBulan}`;

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

  const allData = [...dataGaram, ...dataPotensi];
  const latestDate = allData.length > 0
    ? new Date(Math.max(...allData.map(d => new Date(d.updatedAt || d.createdAt || 0).getTime())))
    : null;
  const lastUpdated = latestDate && !isNaN(latestDate.getTime()) 
    ? latestDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
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
      
      {/* ── Placeholder Visualisasi Mangrove dkk ── */}
      <div className="bg-muted/30 border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center text-muted-foreground text-center">
        <Info className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-medium text-foreground">Visualisasi Mangrove, Terumbu Karang, dan Lamun</p>
        <p className="text-sm">Segera hadir pada pembaruan berikutnya.</p>
      </div>

      {/* ── Tabel Data + Filter ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto min-h-[600px] mt-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Data Kelautan dan Pesisir</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-6">
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTable('garam')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'garam' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <FlaskConical className="w-4 h-4 inline mr-1.5" /> Data Garam
            </button>
            <button
              onClick={() => setActiveTable('potensi')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTable === 'potensi' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <Anchor className="w-4 h-4 inline mr-1.5" /> Potensi Perairan
            </button>
          </div>
        </div>

        <DataTable
          columns={activeTable === 'garam' ? columnsGaram : columnsPotensi}
          data={activeTable === 'garam' ? filteredTableGaram : filteredTablePotensi}
          exportName={`Data_${activeTable === 'garam' ? 'Garam' : 'Potensi_Perairan'}`}
          onCustomExport={handleExport}
        />
      </div>
    </div>
  );
}