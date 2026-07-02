import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Map, Waves, TreePine, Trash2, X, Save, FlaskConical, Layers, BarChart3, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { KelautanPesisirForm } from '@/components/admin/KelautanPesisirForm';
import { DataTable } from '@/components/shared/DataTable';

// ─── MOCK DEPENDENCIES (hapus & ganti import asli saat deploy) ───────────────
const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const api = {
  get: async () => ({ data: { data: [] } }),
  post: async () => ({ data: {} }),
  put: async () => ({ data: {} }),
  delete: async () => ({ data: {} }),
};
// ─────────────────────────────────────────────────────────────────────────────

// ── KONSTANTA ──────────────────────────────────────────────────────────────────
const NAMA_BULAN_LIST = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

// Konversi angka/string-angka ke nama bulan
const formatBulan = (val) => {
  if (!val && val !== 0) return '-';
  if (typeof val === 'number') return NAMA_BULAN_LIST[val - 1] ?? String(val);
  const asNum = parseInt(val, 10);
  if (!isNaN(asNum) && String(asNum) === String(val)) return NAMA_BULAN_LIST[asNum - 1] ?? val;
  return val; // sudah nama bulan
};

const getTriwulan = (bulan) => {
  const b = bulan?.toLowerCase() ?? '';
  if (['januari','februari','maret'].includes(b)) return 'TW 1';
  if (['april','mei','juni'].includes(b)) return 'TW 2';
  if (['juli','agustus','september'].includes(b)) return 'TW 3';
  if (['oktober','november','desember'].includes(b)) return 'TW 4';
  return '-';
};

const KAB_KOTA_JATIM = [
  "Bangkalan", "Blitar", "Gresik", "Kota Pasuruan", "Lamongan",
  "PT. Garam", "Pamekasan", "Pasuruan", "Probolinggo", "Sampang",
  "Sidoarjo", "Situbondo", "Sumenep", "Surabaya", "Tuban"
];

const DUMMY_MANGROVE = [
  { id: 1, status: 'APPROVED_PROGRAM', kabupaten_kota: "Surabaya", kecamatan: "Gunung Anyar", luas_total_ha: 150.5, kondisi_baik_ha: 100.0, kondisi_sedang_ha: 40.5, kondisi_rusak_ha: 10.0, luas_rehabilitasi_ha: 5.0, jumlah_bibit_ditanam: 2500, tahun: 2025 },
  { id: 2, status: 'PENDING',  kabupaten_kota: "Sidoarjo",  kecamatan: "Sedati",       luas_total_ha: 320.0, kondisi_baik_ha: 150.0, kondisi_sedang_ha: 100.0, kondisi_rusak_ha: 70.0, luas_rehabilitasi_ha: 15.5, jumlah_bibit_ditanam: 8000, tahun: 2025 }
];

const DUMMY_TERUMBU_KARANG = [
  { id: 1, status: 'APPROVED_PROGRAM', kabupaten_kota: "Gresik",  lokasi_perairan: "Pulau Bawean",    kedalaman_meter: 5.0,  tutupan_hidup_persen: 65.4, kategori_status: "Baik",       ada_bleaching: false, keterangan_ancaman: "Aman, sedikit sampah plastik",             tahun: 2025 },
  { id: 2, status: 'PENDING',  kabupaten_kota: "Sumenep", lokasi_perairan: "Pulau Gili Labak", kedalaman_meter: 10.0, tutupan_hidup_persen: 82.1, kategori_status: "Sangat Baik", ada_bleaching: true,  keterangan_ancaman: "Terpantau sedikit bleaching karena suhu naik", tahun: 2025 }
];

// ── SHARED: STATUS LABEL & BADGE ───────────────────────────────────────────────
// Alur persetujuan 2 tingkat: Menunggu Persetujuan -> Disetujui oleh Bidang -> Disetujui oleh Program
const STATUS_LABELS = {
  PENDING:          'Menunggu Persetujuan',
  APPROVED_BIDANG:  'Disetujui oleh Bidang',
  APPROVED_PROGRAM: 'Disetujui oleh Program',
  REJECTED:         'Ditolak',
};

const StatusBadge = ({ status, alasan }) => {
  let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  let label = 'PENDING';
  if (status === 'APPROVED_PROGRAM' || status === 'APPROVED_BIDANG') {
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
};

// ── SHARED: TRIWULAN BADGE ─────────────────────────────────────────────────────
const TwBadge = ({ tw }) => {
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[tw] ?? 'bg-blue-100 text-blue-800 border-blue-200';
  return (
    <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${cls}`}>{tw ?? '-'}</span>
  );
};

// ── DATA TABLE (Imported from shared components) ─────────────────────────────────────────────────────────────────

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AdminKelautanPesisir() {
  const [activeTab, setActiveTab] = useState('garam');
  const [dataGaram, setDataGaram] = useState([]);
  const [dataMangrove, setDataMangrove] = useState(DUMMY_MANGROVE);
  const [dataTerumbuKarang, setDataTerumbuKarang] = useState(DUMMY_TERUMBU_KARANG);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const fetchGaramData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/garam/admin').catch(() => ({
        data: {
          data: [
            {
              id: 99, status: 'APPROVED_PROGRAM', alasan_penolakan: null,
              bulan: 'Desember', triwulan: 'TW 4', tahun: 2025,
              kabupaten_kota: "Sumenep",
              luas_total_ha: 1961.05, luas_produksi_ha: 1532.26,
              jumlah_kelompok: 161, jumlah_petambak: 1644,
              produksi_k1_ton: 7000, stok_k1_ton: 7913.70, harga_k1_rp: 2200,
              produksi_k2_ton: 2401.93, stok_k2_ton: 2117.00, harga_k2_rp: 1700,
              produksi_k3_ton: 0, stok_k3_ton: 0, harga_k3_rp: 0,
              total_produksi_ton: 9401.93, total_stok_ton: 10030.70, produktivitas: 6.136
            },
            {
              id: 100, status: 'PENDING', alasan_penolakan: null,
              bulan: 'November', triwulan: 'TW 4', tahun: 2025,
              kabupaten_kota: "Sampang",
              luas_total_ha: 800.0, luas_produksi_ha: 600.0,
              jumlah_kelompok: 45, jumlah_petambak: 320,
              produksi_k1_ton: 1200, stok_k1_ton: 900, harga_k1_rp: 2100,
              produksi_k2_ton: 800, stok_k2_ton: 400, harga_k2_rp: 1600,
              produksi_k3_ton: 100, stok_k3_ton: 50, harga_k3_rp: 900,
              total_produksi_ton: 2100, total_stok_ton: 1350, produktivitas: 3.5
            }
          ]
        }
      }));
      setDataGaram(res.data.data || []);
    } catch {
      setDataGaram([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'garam') fetchGaramData();
    else setLoading(false);
  }, [activeTab]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreateOrUpdate = async (formData) => {
    setSubmitLoading(true);
    setTimeout(() => {
      if (activeTab === 'garam') {
        if (editingData) {
          setDataGaram(prev => prev.map(item => item.id === editingData.id ? { ...item, ...formData } : item));
        } else {
          setDataGaram(prev => [{ ...formData, id: Date.now(), status: 'PENDING' }, ...prev]);
        }
      }
      setSubmitLoading(false);
      setIsFormOpen(false);
      setEditingData(null);
    }, 700);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (activeTab === 'garam') setDataGaram(prev => prev.filter(i => i.id !== itemToDelete.id));
    else if (activeTab === 'mangrove') setDataMangrove(prev => prev.filter(i => i.id !== itemToDelete.id));
    else setDataTerumbuKarang(prev => prev.filter(i => i.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  // ── APPROVE / REJECT ───────────────────────────────────────────────────────
  const handleApprove = async (row) => {
    // Alur 2 tingkat: Menunggu Persetujuan -> Disetujui oleh Bidang -> Disetujui oleh Program
    const nextStatus = row.status === 'PENDING' ? 'APPROVED_BIDANG' : 'APPROVED_PROGRAM';
    const nextLabel = STATUS_LABELS[nextStatus];
    if (!window.confirm(`Setujui data ${row.kabupaten_kota} (${row.bulan ?? ''} ${row.tahun})? Status akan menjadi "${nextLabel}".`)) return;
    try {
      await api.put(`/garam/${row.id}/status`, { status: nextStatus });
      // update lokal sementara (ganti fetchGaramData() saat pakai API asli)
      if (activeTab === 'garam') setDataGaram(prev => prev.map(i => i.id === row.id ? { ...i, status: nextStatus, alasan_penolakan: null } : i));
      else if (activeTab === 'mangrove') setDataMangrove(prev => prev.map(i => i.id === row.id ? { ...i, status: nextStatus } : i));
      else setDataTerumbuKarang(prev => prev.map(i => i.id === row.id ? { ...i, status: nextStatus } : i));
    } catch {
      alert('Gagal menyetujui data');
    }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan === null) return;
    if (!alasan.trim()) { alert('Alasan penolakan wajib diisi!'); return; }
    try {
      await api.put(`/garam/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
      if (activeTab === 'garam') setDataGaram(prev => prev.map(i => i.id === row.id ? { ...i, status: 'REJECTED', alasan_penolakan: alasan } : i));
      else if (activeTab === 'mangrove') setDataMangrove(prev => prev.map(i => i.id === row.id ? { ...i, status: 'REJECTED', alasan_penolakan: alasan } : i));
      else setDataTerumbuKarang(prev => prev.map(i => i.id === row.id ? { ...i, status: 'REJECTED', alasan_penolakan: alasan } : i));
    } catch {
      alert('Gagal menolak data');
    }
  };

  // ── EKSPOR EXCEL FORMATTER ───────────────────────────────────────────────────
  const handleFormatExport = (dataToExport) => {
    if (activeTab === 'garam') {
      return dataToExport.map(row => ({
        'Status': STATUS_LABELS[row.status] ?? row.status,
        'Bulan': formatBulan(row.bulan),
        'Triwulan': row.triwulan,
        'Tahun': row.tahun,
        'Kabupaten/Kota': row.kabupaten_kota,
        'Luas Total (Ha)': row.luas_total_ha,
        'Luas Produksi (Ha)': row.luas_produksi_ha,
        'Jumlah Kelompok': row.jumlah_kelompok,
        'Jumlah Petambak': row.jumlah_petambak,
        'Produksi K1 (Ton)': row.produksi_k1_ton,
        'Stok K1 (Ton)': row.stok_k1_ton,
        'Harga K1 (Rp)': row.harga_k1_rp,
        'Produksi K2 (Ton)': row.produksi_k2_ton,
        'Stok K2 (Ton)': row.stok_k2_ton,
        'Harga K2 (Rp)': row.harga_k2_rp,
        'Produksi K3 (Ton)': row.produksi_k3_ton,
        'Stok K3 (Ton)': row.stok_k3_ton,
        'Harga K3 (Rp)': row.harga_k3_rp,
        'Total Produksi (Ton)': row.total_produksi_ton,
        'Total Stok (Ton)': row.total_stok_ton,
        'Produktivitas (Ton/Ha)': row.produktivitas,
      }));
    } else if (activeTab === 'mangrove') {
      return dataToExport.map(row => ({
        'Status': STATUS_LABELS[row.status] ?? row.status,
        'Tahun': row.tahun,
        'Kabupaten/Kota': row.kabupaten_kota,
        'Kecamatan': row.kecamatan,
        'Luas Total (Ha)': row.luas_total_ha,
        'Kondisi Baik (Ha)': row.kondisi_baik_ha,
        'Kondisi Sedang (Ha)': row.kondisi_sedang_ha,
        'Kondisi Rusak (Ha)': row.kondisi_rusak_ha,
        'Luas Rehabilitasi (Ha)': row.luas_rehabilitasi_ha,
        'Jumlah Bibit Ditanam': row.jumlah_bibit_ditanam,
      }));
    } else {
      return dataToExport.map(row => ({
        'Status': STATUS_LABELS[row.status] ?? row.status,
        'Tahun': row.tahun,
        'Kabupaten/Kota': row.kabupaten_kota,
        'Lokasi Perairan': row.lokasi_perairan,
        'Kedalaman (m)': row.kedalaman_meter,
        'Tutupan Hidup (%)': row.tutupan_hidup_persen,
        'Kategori Status': row.kategori_status,
        'Ada Bleaching': row.ada_bleaching ? 'Ya' : 'Tidak',
        'Keterangan Ancaman': row.keterangan_ancaman,
      }));
    }
  };

  // ── COLUMNS ────────────────────────────────────────────────────────────────
  const columnsGaram = useMemo(() => [
    {
      header: 'Status', accessorKey: 'status',
      cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} />
    },
    {
      header: 'Bulan', accessorKey: 'bulan',
      cell: info => <span className="text-foreground">{formatBulan(info.getValue())}</span>
    },
    {
      header: <div className="text-center w-full">TW</div>, accessorKey: 'triwulan',
      cell: info => <div className="text-center w-full"><TwBadge tw={info.getValue()} /></div>
    },
    {
      header: 'Tahun', accessorKey: 'tahun',
      cell: info => <span className="font-bold text-foreground bg-muted px-2.5 py-1 rounded-md text-xs">{info.getValue()}</span>
    },
    {
      header: 'Kab/Kota', accessorKey: 'kabupaten_kota',
      cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p>
    },
    {
      header: 'Total Produksi', accessorKey: 'total_produksi_ton',
      cell: info => <span className="font-bold text-emerald-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
    },
    {
      header: 'Total Stok', accessorKey: 'total_stok_ton',
      cell: info => <span className="font-bold text-amber-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
    },
    {
      header: 'Produktivitas', accessorKey: 'produktivitas',
      cell: info => (
        <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md text-xs">
          {(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha
        </span>
      )
    }
  ], []);

  const columnsMangrove = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-semibold text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-emerald-400">{info.getValue()}</p> },
    { header: 'Kecamatan', accessorKey: 'kecamatan', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Luas Total (Ha)', accessorKey: 'luas_total_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Rehabilitasi (Ha)', accessorKey: 'luas_rehabilitasi_ha', cell: info => <span className="text-cyan-400 font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> }
  ], []);

  const columnsKarang = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-semibold text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Lokasi Perairan', accessorKey: 'lokasi_perairan', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Tutupan Hidup', accessorKey: 'tutupan_hidup_persen', cell: info => <span className="font-medium text-foreground">{info.getValue()}%</span> },
    {
      header: 'Kondisi', accessorKey: 'kategori_status',
      cell: info => {
        const val = info.getValue();
        const cls = (val === 'Sangat Baik' || val === 'Baik') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cls}`}>{val}</span>;
      }
    }
  ], []);

  // ── SUB-ROW RENDERERS ──────────────────────────────────────────────────────
  const renderSubGaram = ({ row }) => {
    const d = row.original;
    return (
      <div className="p-6 bg-card/70 border-l-4 border-cyan-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-border text-sm">
          <div className="bg-card p-3.5 rounded-xl border border-border">
            <span className="text-muted-foreground text-xs font-semibold block mb-1 uppercase tracking-wider">Luas Produksi</span>
            <span className="font-bold text-foreground text-xl">{(d.luas_produksi_ha || 0).toLocaleString('id-ID')} <span className="text-xs font-medium text-muted-foreground">Ha</span></span>
          </div>
          <div className="bg-card p-3.5 rounded-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full"></div>
            <span className="text-emerald-400 text-xs font-bold block mb-1 uppercase tracking-wider">Produktivitas Lahan</span>
            <span className="font-bold text-emerald-300 text-xl">{(d.produktivitas || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} <span className="text-xs font-medium text-emerald-400/70">Ton/Ha</span></span>
          </div>
          <div className="bg-card p-3.5 rounded-xl border border-border">
            <span className="text-muted-foreground text-xs font-semibold block mb-1 uppercase tracking-wider">Jml Kelompok</span>
            <span className="font-bold text-foreground text-xl">{d.jumlah_kelompok || 0} <span className="text-xs font-medium text-muted-foreground">Pok</span></span>
          </div>
          <div className="bg-card p-3.5 rounded-xl border border-border">
            <span className="text-muted-foreground text-xs font-semibold block mb-1 uppercase tracking-wider">Jml Petambak</span>
            <span className="font-bold text-foreground text-xl">{d.jumlah_petambak || 0} <span className="text-xs font-medium text-muted-foreground">Org</span></span>
          </div>
        </div>
        <h4 className="text-xs font-bold text-muted-foreground mb-4 tracking-widest uppercase flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Rincian Produksi, Stok &amp; Harga per Kualitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'KUALITAS 1', badge: 'Tinggi', color: 'cyan', produksi: d.produksi_k1_ton, stok: d.stok_k1_ton, harga: d.harga_k1_rp, borderCls: 'border-cyan-500/20', accentCls: 'bg-cyan-500', stokCls: 'text-cyan-400', headCls: 'text-cyan-300', badgeCls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'KUALITAS 2', badge: 'Menengah', color: 'amber', produksi: d.produksi_k2_ton, stok: d.stok_k2_ton, harga: d.harga_k2_rp, borderCls: 'border-amber-500/20', accentCls: 'bg-amber-500', stokCls: 'text-amber-400', headCls: 'text-amber-300', badgeCls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'KUALITAS 3', badge: 'Rendah', color: 'slate', produksi: d.produksi_k3_ton, stok: d.stok_k3_ton, harga: d.harga_k3_rp, borderCls: 'border-border', accentCls: 'bg-[#7fb5d5]/40', stokCls: 'text-foreground', headCls: 'text-muted-foreground', badgeCls: 'text-muted-foreground bg-muted border-border' },
          ].map(k => (
            <div key={k.label} className={`bg-card p-4 rounded-xl border ${k.borderCls} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${k.accentCls}`}></div>
              <h5 className={`font-bold ${k.headCls} mb-3 flex items-center justify-between`}>
                {k.label}
                <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${k.badgeCls}`}>{k.badge}</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Produksi:</span>
                  <span className="font-semibold text-foreground">{(k.produksi || 0).toLocaleString('id-ID')} Ton</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Stok:</span>
                  <span className={`font-semibold ${k.stokCls}`}>{(k.stok || 0).toLocaleString('id-ID')} Ton</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                  <span className="text-muted-foreground text-xs">Harga</span>
                  <span className="font-bold text-foreground">{formatRupiah(k.harga)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground text-xs">Nilai Produksi</span>
                  <span className="font-bold text-foreground">{((k.produksi || 0) * (k.harga || 0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-emerald-400/70 uppercase tracking-wider">Total Produksi</span>
            <span className="font-bold text-emerald-400">{(d.total_produksi_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-amber-400/70 uppercase tracking-wider">Total Stok</span>
            <span className="font-bold text-amber-400">{(d.total_stok_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSubMangrove = ({ row }) => (
    <div className="p-5 text-emerald-300 bg-card/70 border-l-4 border-emerald-500">
      Detail Mangrove {row.original.kabupaten_kota}...
    </div>
  );
  const renderSubKarang = ({ row }) => (
    <div className="p-5 text-cyan-300 bg-card/70 border-l-4 border-cyan-500">
      Detail Karang {row.original.kabupaten_kota}...
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Data Kelautan &amp; Pesisir</h1>
          <p className="text-muted-foreground mt-1">Kelola laporan produksi Garam, status Mangrove, dan Terumbu Karang.</p>
        </div>
        {!isFormOpen && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingData(null); setIsFormOpen(true); }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Data {activeTab === 'garam' ? 'Garam' : activeTab === 'mangrove' ? 'Mangrove' : 'Karang'}
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-lg font-bold">Konfirmasi Hapus</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Yakin ingin menghapus data <strong className="text-foreground">{itemToDelete.kabupaten_kota}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg font-medium bg-secondary text-secondary-foreground hover:opacity-80 text-sm transition-opacity">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm transition-colors shadow-lg">Ya, Hapus Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isFormOpen && (
        <div className="flex overflow-x-auto border-b border-border gap-1">
          {[
            { key: 'garam',          label: 'Data Garam',    icon: <Map className="w-4 h-4" />,      active: 'border-primary text-primary bg-primary/10',    inactive: 'text-muted-foreground hover:bg-muted/50' },
            { key: 'mangrove',       label: 'Data Mangrove', icon: <TreePine className="w-4 h-4" />, active: 'border-primary text-primary bg-primary/10', inactive: 'text-muted-foreground hover:bg-muted/50' },
            { key: 'terumbu_karang', label: 'Terumbu Karang',icon: <Waves className="w-4 h-4" />,   active: 'border-primary text-primary bg-primary/10',    inactive: 'text-muted-foreground hover:bg-muted/50' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-colors text-sm whitespace-nowrap border-b-2 ${activeTab === tab.key ? tab.active : 'border-transparent ' + tab.inactive}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {isFormOpen ? (
        activeTab === 'garam' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <KelautanPesisirForm
              initialData={editingData}
              isLoading={submitLoading}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
            />
          </div>
        ) : (
          <div className="bg-card border border-border p-12 rounded-2xl text-center shadow-sm">
            <p className="text-muted-foreground text-sm">Form untuk {activeTab} sedang disiapkan.</p>
            <button onClick={() => setIsFormOpen(false)} className="mt-4 px-6 py-2 border border-border rounded-lg hover:bg-muted/50 font-medium text-sm text-foreground transition-colors">Kembali</button>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Memuat data...</p>
            </div>
          ) : (
            <DataTable
              columns={activeTab === 'garam' ? columnsGaram : activeTab === 'mangrove' ? columnsMangrove : columnsKarang}
              data={activeTab === 'garam' ? dataGaram : activeTab === 'mangrove' ? dataMangrove : dataTerumbuKarang}
              onEdit={(row) => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onDelete={(row) => setItemToDelete(row)}
              onApprove={handleApprove}
              onReject={handleReject}
              renderSubComponent={activeTab === 'garam' ? renderSubGaram : activeTab === 'mangrove' ? renderSubMangrove : renderSubKarang}
              exportName={`Data_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`}
              formatExportData={handleFormatExport}
            />
          )}
        </div>
      )}
    </div>
  );
}