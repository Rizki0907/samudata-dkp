import { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import {
  Loader2, Waves, Anchor, FlaskConical, MapPin, Filter,
  TreePine, Landmark, Globe, Fish, TrendingUp
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

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

export default function KelautanPesisir() {
  const [loading, setLoading] = useState(true);
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensi, setDataPotensi] = useState([]);
  const [stats, setStats] = useState(null);

  const [activeTable, setActiveTable] = useState('garam');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKab, setFilterKab] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [garamRes, potensiRes, statsRes] = await Promise.all([
          api.get('/kelautan-pesisir/garam/public'),
          api.get('/kelautan-pesisir/potensi-perairan/public'),
          api.get('/kelautan-pesisir/stats'),
        ]);
        setDataGaram(garamRes.data.data || []);
        setDataPotensi(potensiRes.data.data || []);
        setStats(statsRes.data.data || null);
      } catch (error) {
        console.error('Error fetching kelautan pesisir data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── KPI (dari endpoint /stats, sudah teragregasi & APPROVED only) ──
  const kpi = useMemo(() => {
    if (!stats) return {
      total_produksi_garam: 0, total_petambak_garam: 0, total_luas_lahan_garam: 0,
      total_garis_pantai: 0, total_pulau_kecil: 0, total_desa_pesisir: 0,
    };
    const potensiPerKota = stats.potensiPerKota || [];
    return {
      total_produksi_garam: stats.summary?.total_produksi_garam || 0,
      total_petambak_garam: stats.summary?.total_petambak_garam || 0,
      total_luas_lahan_garam: stats.summary?.total_luas_lahan_garam || 0,
      total_garis_pantai: potensiPerKota.reduce((s, d) => s + (d.garis_pantai || 0), 0),
      total_pulau_kecil: potensiPerKota.reduce((s, d) => s + (d.pulau_kecil || 0), 0),
      total_desa_pesisir: potensiPerKota.reduce((s, d) => s + (d.desa_pesisir || 0), 0),
    };
  }, [stats]);

  // ── Chart data ──
  const garamPerKota = useMemo(() => [...(stats?.garamPerKota || [])].sort((a, b) => b.produksi - a.produksi), [stats]);
  const potensiPerKota = useMemo(() => [...(stats?.potensiPerKota || [])].sort((a, b) => b.garis_pantai - a.garis_pantai), [stats]);

  const garamKota = garamPerKota.map(d => d.name);
  const garamProduksi = garamPerKota.map(d => parseFloat((d.produksi || 0).toFixed(2)));
  const garamLahan = garamPerKota.map(d => parseFloat((d.luas_lahan || 0).toFixed(2)));
  const garamPetambak = garamPerKota.map(d => d.petambak || 0);

  const potensiKota = potensiPerKota.map(d => d.name);
  const potensiPantai = potensiPerKota.map(d => parseFloat((d.garis_pantai || 0).toFixed(2)));
  const potensiPulau = potensiPerKota.map(d => d.pulau_kecil || 0);
  const potensiDesa = potensiPerKota.map(d => d.desa_pesisir || 0);

  // ── Filter opsi & tabel bawah ──
  const kabupatenOptions = useMemo(() => {
    const set = new Set([...dataGaram, ...dataPotensi].map(d => d.kabupaten_kota).filter(Boolean));
    return [...set].sort();
  }, [dataGaram, dataPotensi]);

  const filteredGaram = useMemo(() => dataGaram.filter(d =>
    (!filterTahun || String(d.tahun) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataGaram, filterTahun, filterKab]);

  const filteredPotensi = useMemo(() => dataPotensi.filter(d =>
    (!filterTahun || String(d.tahun_data) === filterTahun) &&
    (!filterKab || d.kabupaten_kota === filterKab)
  ), [dataPotensi, filterTahun, filterKab]);

  const columnsGaram = useMemo(() => [
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan' },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
    { header: 'Luas Lahan (Ha)', accessorKey: 'luas_total_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Luas Produksi (Ha)', accessorKey: 'luas_produksi_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Petambak', accessorKey: 'jumlah_petambak' },
    { header: 'Kelompok', accessorKey: 'jumlah_kelompok' },
    { header: 'Total Produksi (Ton)', accessorKey: 'total_produksi_ton', cell: info => <span className="font-semibold text-emerald-600">{numFmt(info.getValue())}</span> },
    { header: 'Total Stok (Ton)', accessorKey: 'total_stok_ton', cell: info => <span className="font-semibold text-amber-600">{numFmt(info.getValue())}</span> },
    { header: 'Produktivitas (Ton/Ha)', accessorKey: 'produktivitas', cell: info => numFmt(info.getValue()) },
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
    { header: 'Luas Perairan (km²)', accessorKey: 'luas_perairan_km2', cell: info => numFmt(info.getValue()) },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil' },
    { header: 'Desa Pesisir', accessorKey: 'desa_pesisir' },
    { header: 'Konservasi (Ha)', accessorKey: 'luas_kawasan_konservasi_ha', cell: info => numFmt(info.getValue()) },
    { header: 'Potensi Perikanan (Ton/Th)', accessorKey: 'potensi_perikanan_ton_th', cell: info => numFmt(info.getValue()) },
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Statistik Kelautan &amp; Pesisir</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data produksi Garam dan Potensi Perairan Jawa Timur.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><FlaskConical className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Produksi Garam</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_produksi_garam)} <span className="text-sm text-muted-foreground font-normal">Ton</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-amber-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Fish className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Total Petambak Garam</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_petambak_garam)} <span className="text-sm text-muted-foreground font-normal">Orang</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Landmark className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Lahan Garam</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_luas_lahan_garam)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-cyan-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Waves className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Total Garis Pantai</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_garis_pantai)} <span className="text-sm text-muted-foreground font-normal">Km</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-orange-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-orange-500" /><p className="text-sm font-medium text-muted-foreground">Total Pulau Kecil</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_pulau_kecil)} <span className="text-sm text-muted-foreground font-normal">Pulau</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-pink-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-pink-500" /><p className="text-sm font-medium text-muted-foreground">Total Desa Pesisir</p></div>
          <p className="text-3xl font-bold text-foreground">{numFmt(kpi.total_desa_pesisir)} <span className="text-sm text-muted-foreground font-normal">Desa</span></p>
        </div>
      </div>

      {/* ── Charts: Garam ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-foreground">Produksi Garam</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Volume Produksi per Kab/Kota (Ton)</h3>
            {garamKota.length > 0
              ? <ReactECharts option={barOption(garamKota, garamProduksi, '#10b981', 'Ton')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Luas Lahan per Kab/Kota (Ha)</h3>
            {garamKota.length > 0
              ? <ReactECharts option={barOption(garamKota, garamLahan, '#3b82f6', 'Ha')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Petambak per Kab/Kota</h3>
            {garamKota.length > 0
              ? <ReactECharts option={hBarOption(garamKota, garamPetambak, '#f59e0b', 'Orang')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Charts: Potensi Perairan ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Anchor className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-bold text-foreground">Potensi Perairan</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Panjang Garis Pantai per Kab/Kota (km)</h3>
            {potensiKota.length > 0
              ? <ReactECharts option={barOption(potensiKota, potensiPantai, '#06b6d4', 'Km')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Pulau Kecil per Kab/Kota</h3>
            {potensiKota.length > 0
              ? <ReactECharts option={hBarOption(potensiKota, potensiPulau, '#f97316', 'Pulau')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Desa Pesisir per Kab/Kota</h3>
            {potensiKota.length > 0
              ? <ReactECharts option={barOption(potensiKota, potensiDesa, '#34d399', 'Desa')} style={{ height: '320px' }} />
              : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
          </div>
        </div>
      </div>

      {/* ── Tabel Data + Filter ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
            <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Tahun</option>
              {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterKab} onChange={(e) => setFilterKab(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Semua Kab/Kota</option>
              {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <DataTable
          columns={activeTable === 'garam' ? columnsGaram : columnsPotensi}
          data={activeTable === 'garam' ? filteredGaram : filteredPotensi}
          exportName={`Data_${activeTable === 'garam' ? 'Garam' : 'Potensi_Perairan'}`}
          onCustomExport={handleExport}
        />
      </div>
    </div>
  );
}