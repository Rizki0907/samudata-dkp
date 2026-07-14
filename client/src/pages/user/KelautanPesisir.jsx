import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import {
  Loader2, Waves, Anchor, FlaskConical, MapPin, Filter,
  TreePine, Landmark, Globe, Fish, Info
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const numFmt = (v) => (Number(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

const barOption = (categories, values, color, unit) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID')} ${unit}` },
  grid: { left: '3%', right: '4%', bottom: 70, containLabel: true },
  xAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b', rotate: 35, fontSize: 11 } },
  yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [4, 4, 0, 0] } }],
});

const hBarOption = (categories, values, color, unit) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID')} ${unit}` },
  grid: { left: 120, right: 30, top: 20, bottom: 20 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b', fontSize: 11 } },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [0, 4, 4, 0] } }],
});

const pieOption = (title, data, nameField, valueField) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#64748b', fontSize: 10 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.map(d => ({ name: d[nameField], value: d[valueField] })).filter(d => d.value > 0),
    label: { show: false }
  }]
});

export default function KelautanPesisir() {
  const [loading, setLoading] = useState(true);
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensi, setDataPotensi] = useState([]);

  // Vis Garam Filters
  const [visGaramBulan, setVisGaramBulan] = useState('');
  const [visGaramTahun, setVisGaramTahun] = useState('');
  const [visGaramKab, setVisGaramKab] = useState('');

  // Table Filters
  const [activeTable, setActiveTable] = useState('garam');
  const [tableFilterBulan, setTableFilterBulan] = useState('');
  const [tableFilterTahun, setTableFilterTahun] = useState('');
  const [tableFilterKab, setTableFilterKab] = useState('');

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
  const potensiPerKotaFrontend = useMemo(() => {
    const agg = {};
    dataPotensi.forEach(d => {
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
    (!visGaramBulan || (d.bulan || '').toLowerCase() === visGaramBulan.toLowerCase()) &&
    (!visGaramTahun || String(d.tahun) === visGaramTahun) &&
    (!visGaramKab || d.kabupaten_kota === visGaramKab)
  ), [dataGaram, visGaramBulan, visGaramTahun, visGaramKab]);

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
    (!tableFilterBulan || (d.bulan || '').toLowerCase() === tableFilterBulan.toLowerCase()) &&
    (!tableFilterTahun || String(d.tahun) === tableFilterTahun) &&
    (!tableFilterKab || d.kabupaten_kota === tableFilterKab)
  ), [dataGaram, tableFilterBulan, tableFilterTahun, tableFilterKab]);

  const filteredTablePotensi = useMemo(() => dataPotensi.filter(d =>
    (!tableFilterTahun || String(d.tahun_data) === tableFilterTahun) &&
    (!tableFilterKab || d.kabupaten_kota === tableFilterKab)
  ), [dataPotensi, tableFilterTahun, tableFilterKab]);

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
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
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
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(activeTable === 'garam' ? 'Data Garam' : 'Potensi Perairan');
    const cols = activeTable === 'garam' ? columnsGaram : columnsPotensi;

    sheet.addRow(cols.map(c => c.header));
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    rows.forEach(row => {
      const rowData = cols.map(c => c.accessorFn ? c.accessorFn(row) : (row[c.accessorKey] ?? ''));
      const addedRow = sheet.addRow(rowData);
      addedRow.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    sheet.columns.forEach(col => { col.width = 18; });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Data_${activeTable === 'garam' ? 'Garam' : 'Potensi_Perairan'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menyiapkan Visualisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Kelautan Pesisir</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data Kelautan, Pesisir, dan Potensi Perairan Jawa Timur.
          </p>
        </div>
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
          {/* Garam Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select value={visGaramTahun} onChange={(e) => setVisGaramTahun(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Tahun</option>
              {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={visGaramBulan} onChange={(e) => setVisGaramBulan(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Bulan</option>
              {bulanOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={visGaramKab} onChange={(e) => setVisGaramKab(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Kab/Kota</option>
              {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
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
              ? <ReactECharts option={barOption(garamKota, garamProduksi, '#10b981', 'Ton')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Kelompok per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={hBarOption(garamKota, garamKelompok, '#8b5cf6', 'Kelompok')} style={{ height: '320px' }} />
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
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Data Kelautan Pesisir (Verified)</h2>
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select value={tableFilterTahun} onChange={(e) => setTableFilterTahun(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Tahun</option>
              {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {activeTable === 'garam' && (
              <select value={tableFilterBulan} onChange={(e) => setTableFilterBulan(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Semua Bulan</option>
                {bulanOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <select value={tableFilterKab} onChange={(e) => setTableFilterKab(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Kab/Kota</option>
              {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
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