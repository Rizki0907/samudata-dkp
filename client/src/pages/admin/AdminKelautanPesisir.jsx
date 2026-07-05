import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Map, Waves, TreePine, Trash2, X, Save, FlaskConical, Layers, BarChart3, CheckCircle, XCircle, FileSpreadsheet, Leaf, Anchor, Globe } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

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
const NAMA_BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const formatBulan = (val) => {
  if (!val && val !== 0) return '-';
  if (typeof val === 'number') return NAMA_BULAN_LIST[val - 1] ?? String(val);
  const asNum = parseInt(val, 10);
  if (!isNaN(asNum) && String(asNum) === String(val)) return NAMA_BULAN_LIST[asNum - 1] ?? val;
  return val;
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
  "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember",
  "Jombang", "Kediri", "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang",
  "Mojokerto", "Nganjuk", "Ngawi", "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo",
  "Probolinggo", "Sampang", "Sidoarjo", "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung",
  "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", "Kota Malang", "Kota Mojokerto",
  "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya"
];

// ── DUMMY DATA ─────────────────────────────────────────────────────────────────
const DUMMY_GARAM = [
  {
    id: 99, status: 'APPROVED', alasan_penolakan: null,
    bulan: 'Desember', triwulan: 'TW 4', tahun: 2025, kabupaten_kota: "Sumenep",
    luas_total_ha: 1961.05, luas_produksi_ha: 1532.26, jumlah_kelompok: 161, jumlah_petambak: 1644,
    produksi_k1_ton: 7000, stok_k1_ton: 7913.70, harga_k1_rp: 2200,
    produksi_k2_ton: 2401.93, stok_k2_ton: 2117.00, harga_k2_rp: 1700,
    produksi_k3_ton: 0, stok_k3_ton: 0, harga_k3_rp: 0,
    total_produksi_ton: 9401.93, total_stok_ton: 10030.70, produktivitas: 6.136
  },
  {
    id: 100, status: 'PENDING', alasan_penolakan: null,
    bulan: 'November', triwulan: 'TW 4', tahun: 2025, kabupaten_kota: "Sampang",
    luas_total_ha: 800.0, luas_produksi_ha: 600.0, jumlah_kelompok: 45, jumlah_petambak: 320,
    produksi_k1_ton: 1200, stok_k1_ton: 900, harga_k1_rp: 2100,
    produksi_k2_ton: 800, stok_k2_ton: 400, harga_k2_rp: 1600,
    produksi_k3_ton: 100, stok_k3_ton: 50, harga_k3_rp: 900,
    total_produksi_ton: 2100, total_stok_ton: 1350, produktivitas: 3.5
  },
];

const DUMMY_MANGROVE = [
  { id: 1, status: 'APPROVED', kabupaten_kota: "Surabaya", kecamatan: "Gunung Anyar", luas_total_ha: 150.5, kondisi_baik_ha: 100.0, kondisi_sedang_ha: 40.5, kondisi_rusak_ha: 10.0, luas_rehabilitasi_ha: 5.0, jumlah_bibit_ditanam: 2500, tahun: 2025 },
  { id: 2, status: 'PENDING', kabupaten_kota: "Sidoarjo", kecamatan: "Sedati", luas_total_ha: 320.0, kondisi_baik_ha: 150.0, kondisi_sedang_ha: 100.0, kondisi_rusak_ha: 70.0, luas_rehabilitasi_ha: 15.5, jumlah_bibit_ditanam: 8000, tahun: 2025 }
];

const DUMMY_TERUMBU_KARANG = [
  { id: 1, status: 'APPROVED', kabupaten_kota: "Gresik", lokasi_perairan: "Pulau Bawean", kedalaman_meter: 5.0, tutupan_hidup_persen: 65.4, kategori_status: "Baik", ada_bleaching: false, keterangan_ancaman: "Aman, sedikit sampah plastik", tahun: 2025 },
  { id: 2, status: 'PENDING', kabupaten_kota: "Sumenep", lokasi_perairan: "Pulau Gili Labak", kedalaman_meter: 10.0, tutupan_hidup_persen: 82.1, kategori_status: "Sangat Baik", ada_bleaching: true, keterangan_ancaman: "Terpantau sedikit bleaching karena suhu naik", tahun: 2025 }
];

const DUMMY_LAMUN = [
  { id: 1, status: 'APPROVED', kabupaten_kota: "Sumenep", lokasi_perairan: "Kepulauan Kangean", luas_total_ha: 85.4, kondisi: "Baik", kerapatan_persen: 72.3, jenis_dominan: "Thalassia hemprichii", ancaman: "Sedimentasi", tahun: 2025 },
  { id: 2, status: 'PENDING', kabupaten_kota: "Gresik", lokasi_perairan: "Pulau Bawean", luas_total_ha: 42.1, kondisi: "Sedang", kerapatan_persen: 45.6, jenis_dominan: "Enhalus acoroides", ancaman: "Aktivitas nelayan", tahun: 2025 }
];

// Potensi Perairan — data statis per Kab/Kota (untuk dashboard)
// Variabel: luas wilayah laut, panjang garis pantai per segmen (dihitung → total), luas perairan, jumlah pulau kecil
// + variabel turunan: ZEE, perairan teritorial, kawasan konservasi
const DUMMY_POTENSI_PERAIRAN = [
  {
    id: 1, kabupaten_kota: "Sumenep",
    luas_wilayah_laut_km2: 50166.68,     // km²
    panjang_pantai_utara_km: 180.4,       // segmen utara
    panjang_pantai_selatan_km: 0,
    panjang_pantai_timur_km: 92.3,
    panjang_pantai_barat_km: 45.1,
    // total_panjang_garis_pantai_km: dihitung otomatis = sum segmen
    luas_perairan_km2: 49200.0,           // perairan dalam wilayah admin
    jumlah_pulau_kecil: 126,
    pulau_berpenghuni: 48,
    pulau_tidak_berpenghuni: 78,
    luas_kawasan_konservasi_ha: 12500.0,
    potensi_perikanan_ton_th: 285000,
    tahun_data: 2024,
    keterangan: 'Kab. terluar, banyak pulau kecil terpencil'
  },
  {
    id: 2, kabupaten_kota: "Gresik",
    luas_wilayah_laut_km2: 5765.38,
    panjang_pantai_utara_km: 98.2,
    panjang_pantai_selatan_km: 0,
    panjang_pantai_timur_km: 0,
    panjang_pantai_barat_km: 34.5,
    luas_perairan_km2: 5200.0,
    jumlah_pulau_kecil: 2,
    pulau_berpenghuni: 2,
    pulau_tidak_berpenghuni: 0,
    luas_kawasan_konservasi_ha: 3800.0,
    potensi_perikanan_ton_th: 125000,
    tahun_data: 2024,
    keterangan: 'Pulau Bawean sebagai kawasan konservasi utama'
  },
  {
    id: 3, kabupaten_kota: "Sidoarjo",
    luas_wilayah_laut_km2: 201.68,
    panjang_pantai_utara_km: 0,
    panjang_pantai_selatan_km: 0,
    panjang_pantai_timur_km: 47.5,
    panjang_pantai_barat_km: 0,
    luas_perairan_km2: 190.0,
    jumlah_pulau_kecil: 0,
    pulau_berpenghuni: 0,
    pulau_tidak_berpenghuni: 0,
    luas_kawasan_konservasi_ha: 0,
    potensi_perikanan_ton_th: 45000,
    tahun_data: 2024,
    keterangan: 'Kawasan pesisir padat, dominan budidaya tambak'
  },
];

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────
const StatusBadge = ({ status, alasan }) => {
  const styleMap = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    APPROVED_BIDANG: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    APPROVED_PROGRAM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  const cls = styleMap[status] ?? styleMap.PENDING;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${cls}`}>{status ?? 'PENDING'}</span>
      {status === 'REJECTED' && alasan && (
        <span className="text-xs text-rose-400 cursor-help" title={`Alasan: ${alasan}`}>(i)</span>
      )}
    </div>
  );
};

const TwBadge = ({ tw }) => {
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[tw] ?? 'bg-[#152d45] text-[#7fb5d5] border-[#1e3a52]';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{tw ?? '-'}</span>;
};

// ── DATA TABLE ─────────────────────────────────────────────────────────────────
const DataTable = ({ columns, data, onEdit, onDelete, onApprove, onReject, renderSubComponent, exportName, onCustomExport }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  return (
    <div className="rounded-xl border border-[#1e3a52] overflow-hidden">
      {/* Toolbar */}
      {exportName && onCustomExport && (
        <div className="flex justify-end px-4 py-2.5 bg-[#152d45] border-b border-[#1e3a52]">
          <button
            onClick={() => onCustomExport(data)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#152d45] text-[#7fb5d5] border-b border-[#1e3a52]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3.5 font-semibold whitespace-nowrap tracking-wider text-xs uppercase">{col.header}</th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3.5 font-semibold text-right tracking-wider text-xs uppercase">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a52]">
            {data.map((row, i) => (
              <React.Fragment key={i}>
                <tr
                  className={`cursor-pointer transition-colors hover:bg-[#152d45]/60 ${expandedRow === i ? 'bg-[#152d45]/40' : 'bg-[#0f2236]'}`}
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3 whitespace-nowrap text-[#c8dff0]">
                      {col.cell
                        ? col.cell({ getValue: () => col.accessorFn ? col.accessorFn(row) : row[col.accessorKey], row: { original: row } })
                        : row[col.accessorKey]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        {row.status === 'PENDING' && onApprove && (
                          <button onClick={(e) => { e.stopPropagation(); onApprove(row); }} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Setujui">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {row.status === 'PENDING' && onReject && (
                          <button onClick={(e) => { e.stopPropagation(); onReject(row); }} className="text-rose-400 hover:text-rose-300 transition-colors" title="Tolak">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="text-cyan-400 font-medium hover:text-cyan-200 transition-colors text-xs">Edit</button>}
                        {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(row); }} className="text-rose-400 font-medium hover:text-rose-300 transition-colors text-xs">Hapus</button>}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedRow === i && renderSubComponent && (
                  <tr className="bg-[#0b1929]/80">
                    <td colSpan={columns.length + 1} className="p-0 border-b border-[#1e3a52]">
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        {renderSubComponent({ row: { original: row } })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-16 text-center text-[#7fb5d5] bg-[#0f2236]">
                  <Waves className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Belum ada data tersedia.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── GARAM INPUT FORM ───────────────────────────────────────────────────────────
const GaramInputForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(initialData || {
    bulan: 'Januari', tahun: new Date().getFullYear(), kabupaten_kota: '',
    luas_total_ha: '', luas_produksi_ha: '', jumlah_kelompok: '', jumlah_petambak: '',
    produksi_k1_ton: '', stok_k1_ton: '', harga_k1_rp: '',
    produksi_k2_ton: '', stok_k2_ton: '', harga_k2_rp: '',
    produksi_k3_ton: '', stok_k3_ton: '', harga_k3_rp: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pk1 = parseFloat(formData.produksi_k1_ton) || 0;
  const pk2 = parseFloat(formData.produksi_k2_ton) || 0;
  const pk3 = parseFloat(formData.produksi_k3_ton) || 0;
  const totalProduksi = pk1 + pk2 + pk3;
  const sk1 = parseFloat(formData.stok_k1_ton) || 0;
  const sk2 = parseFloat(formData.stok_k2_ton) || 0;
  const sk3 = parseFloat(formData.stok_k3_ton) || 0;
  const totalStok = sk1 + sk2 + sk3;
  const lp = parseFloat(formData.luas_produksi_ha) || 0;
  const produktivitas = lp > 0 ? (totalProduksi / lp) : 0;
  const triwulan = getTriwulan(formData.bulan);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tahun: parseInt(formData.tahun), triwulan,
      luas_total_ha: parseFloat(formData.luas_total_ha) || 0,
      luas_produksi_ha: lp,
      jumlah_kelompok: parseInt(formData.jumlah_kelompok) || 0,
      jumlah_petambak: parseInt(formData.jumlah_petambak) || 0,
      produksi_k1_ton: pk1, produksi_k2_ton: pk2, produksi_k3_ton: pk3, total_produksi_ton: totalProduksi,
      stok_k1_ton: sk1, stok_k2_ton: sk2, stok_k3_ton: sk3, total_stok_ton: totalStok,
      harga_k1_rp: parseFloat(formData.harga_k1_rp) || 0,
      harga_k2_rp: parseFloat(formData.harga_k2_rp) || 0,
      harga_k3_rp: parseFloat(formData.harga_k3_rp) || 0,
      produktivitas
    });
  };

  const iCls = "w-full h-10 rounded-md border border-[#1e3a52] bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-[#3a5a72]";
  const lCls = "text-xs font-semibold text-[#7fb5d5] uppercase tracking-wider";

  return (
    <div className="bg-[#0f2236] border border-[#1e3a52] rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a52] bg-[#152d45]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-base font-bold text-[#c8dff0]">{initialData ? 'Edit' : 'Input'} Laporan Data Garam</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-[#0b1929] rounded-full transition-colors text-[#7fb5d5]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-2">
            <label className={lCls}>Bulan Laporan</label>
            <select name="bulan" value={formData.bulan} onChange={handleChange} className={iCls + " appearance-none"}>
              {NAMA_BULAN_LIST.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={lCls}>Triwulan</label>
            <div className="h-10 flex items-center"><TwBadge tw={triwulan} /></div>
          </div>
          <div className="space-y-2">
            <label className={lCls}>Tahun</label>
            <input type="number" name="tahun" value={formData.tahun} onChange={handleChange} className={iCls} required />
          </div>
          <div className="space-y-2">
            <label className={lCls}>Kabupaten / Kota</label>
            <select name="kabupaten_kota" value={formData.kabupaten_kota} onChange={handleChange} className={iCls + " appearance-none"} required>
              <option value="" disabled>-- Pilih Kab/Kota --</option>
              {KAB_KOTA_JATIM.map(kab => <option key={kab} value={kab}>{kab}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-[#0b1929] p-5 rounded-xl border border-[#1e3a52]">
          {[['luas_total_ha','Luas Lahan Total (Ha)'],['luas_produksi_ha','Luas Produksi (Ha)'],['jumlah_kelompok','Jumlah Kelompok'],['jumlah_petambak','Jumlah Petambak']].map(([name, label]) => (
            <div key={name} className="space-y-2">
              <label className={lCls}>{label}</label>
              <input type="number" step={name.includes('ha') ? '0.01' : '1'} name={name} value={formData[name]} onChange={handleChange} className={iCls} placeholder="0" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            { key:'k1', label:'Kualitas 1 — Tinggi', border:'border-cyan-500/30', bg:'bg-cyan-500/5', dot:'bg-cyan-400', head:'text-cyan-300', ring:'focus:ring-cyan-500', fieldBorder:'border-cyan-500/30', labelColor:'text-cyan-400/70' },
            { key:'k2', label:'Kualitas 2 — Menengah', border:'border-amber-500/30', bg:'bg-amber-500/5', dot:'bg-amber-400', head:'text-amber-300', ring:'focus:ring-amber-500', fieldBorder:'border-amber-500/30', labelColor:'text-amber-400/70' },
            { key:'k3', label:'Kualitas 3 — Rendah', border:'border-[#1e3a52]', bg:'bg-[#0b1929]/50', dot:'bg-[#7fb5d5]', head:'text-[#7fb5d5]', ring:'focus:ring-cyan-500', fieldBorder:'border-[#1e3a52]', labelColor:'text-[#7fb5d5]/70' },
          ].map(k => (
            <div key={k.key} className={`space-y-4 border ${k.border} ${k.bg} p-5 rounded-xl`}>
              <div className={`flex items-center gap-2 border-b ${k.border} pb-3`}>
                <span className={`w-2.5 h-2.5 rounded-full ${k.dot}`}></span>
                <h4 className={`font-bold ${k.head} text-sm`}>{k.label}</h4>
              </div>
              {[['produksi','Produksi (Ton)'],['stok','Sisa Stok (Ton)'],['harga','Harga Jual (Rp/Kg)']].map(([field, fl]) => (
                <div key={field} className="space-y-1.5">
                  <label className={`text-xs font-semibold ${k.labelColor} uppercase tracking-wider`}>{fl}</label>
                  <input type="number" step="0.01" name={`${field}_${k.key}_ton`} value={formData[`${field}_${k.key}_ton`] ?? formData[`${field}_${k.key}_rp`] ?? ''} onChange={handleChange}
                    className={`w-full h-10 rounded-md border ${k.fieldBorder} bg-[#0b1929] text-[#c8dff0] px-3 text-sm ${k.ring} focus:outline-none placeholder-[#3a5a72]`} placeholder="0" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Live Kalkulasi */}
        <div className="bg-[#0b1929] border border-[#1e3a52] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-[#7fb5d5] uppercase tracking-widest">Kalkulasi Otomatis</h4>
            <span className="text-xs text-[#3a5a72] ml-1">— real-time</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f2236] rounded-xl border border-emerald-500/20 p-4">
              <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-1">Total Produksi</p>
              <p className="text-2xl font-bold text-emerald-400">{totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-[#7fb5d5] mt-0.5">Ton (K1 + K2 + K3)</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="text-cyan-400">{pk1.toLocaleString('id-ID')}</span><span className="opacity-40">+</span>
                <span className="text-amber-400">{pk2.toLocaleString('id-ID')}</span><span className="opacity-40">+</span>
                <span className="text-[#7fb5d5]">{pk3.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="bg-[#0f2236] rounded-xl border border-amber-500/20 p-4">
              <p className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-1">Total Stok</p>
              <p className="text-2xl font-bold text-amber-400">{totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-[#7fb5d5] mt-0.5">Ton (K1 + K2 + K3)</p>
              <div className="mt-3 flex gap-3 text-xs">
                <span className="text-cyan-400">{sk1.toLocaleString('id-ID')}</span><span className="opacity-40">+</span>
                <span className="text-amber-400">{sk2.toLocaleString('id-ID')}</span><span className="opacity-40">+</span>
                <span className="text-[#7fb5d5]">{sk3.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className={`bg-[#0f2236] rounded-xl border p-4 transition-colors ${lp > 0 ? 'border-cyan-500/30' : 'border-[#1e3a52]'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${lp > 0 ? 'text-cyan-400/70' : 'text-[#7fb5d5]/50'}`}>Produktivitas Lahan</p>
              {lp > 0 ? (
                <>
                  <p className="text-2xl font-bold text-cyan-300">{produktivitas.toLocaleString('id-ID', { maximumFractionDigits: 3 })}</p>
                  <p className="text-xs text-[#7fb5d5] mt-0.5">Ton/Ha</p>
                  <p className="mt-3 text-xs text-[#7fb5d5]">
                    <span className="text-emerald-400">{totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                    <span className="opacity-40 mx-1">÷</span>
                    <span className="text-[#c8dff0]">{lp.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-[#3a5a72]">—</p>
                  <p className="text-xs text-[#3a5a72] mt-0.5">Isi Lahan Produksi dulu</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 font-medium rounded-lg text-[#7fb5d5] hover:bg-[#152d45] transition-colors border border-[#1e3a52] text-sm">Batal</button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-cyan-700/30 text-sm disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Laporan
          </button>
        </div>
      </form>
    </div>
  );
};

// ── EXCEL EXPORT HELPERS ───────────────────────────────────────────────────────
const borderThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

const cellStyle = (opts = {}) => ({
  font: { bold: opts.bold ?? false, sz: opts.sz ?? 11, color: opts.fontColor ? { rgb: opts.fontColor } : undefined },
  alignment: { horizontal: opts.align ?? 'center', vertical: 'center', wrapText: true },
  border: borderThin,
  fill: opts.fill ? { fgColor: { rgb: opts.fill } } : undefined,
});

const applyStyles = (ws, startRow, rows, defaultStyle) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = startRow; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = defaultStyle;
    }
  }
};

// Export Garam — sesuai format gambar: No | Kab/Kota | L Total | Σ Pok | Σ Petambak | K1 | K2 | K3 | Σ Prod | Σ Stok | Produktivitas
const exportGaramExcel = (data) => {
  const title = 'REKAPITULASI DATA PRODUKSI GARAM JAWA TIMUR';
  const subtitle = `Tahun Data: ${new Date().getFullYear()}`;

  // Header baris 1
  const h1 = ['No', 'Kab/Kota', 'L Total (Ha)', 'Σ Pok', 'Σ Petambak',
    'Produksi (Ton)', '', '', 'Σ Prod (Ton)',
    'Stok (Ton)', '', '', 'Σ Stok (Ton)',
    'Harga (Rp/Kg)', '', '',
    'Produktivitas\n(Ton/Ha)'];
  // Header baris 2
  const h2 = ['', '', '', '', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', ''];

  let totalProduksi = 0, totalStok = 0, totalLuas = 0, totalPok = 0, totalPetambak = 0;

  const dataRows = data.map((row, i) => {
    totalProduksi += row.total_produksi_ton || 0;
    totalStok += row.total_stok_ton || 0;
    totalLuas += row.luas_total_ha || 0;
    totalPok += row.jumlah_kelompok || 0;
    totalPetambak += row.jumlah_petambak || 0;
    return [
      i + 1,
      row.kabupaten_kota,
      row.luas_total_ha?.toLocaleString('id-ID') ?? 0,
      row.jumlah_kelompok ?? 0,
      row.jumlah_petambak ?? 0,
      row.produksi_k1_ton?.toLocaleString('id-ID') ?? 0,
      row.produksi_k2_ton?.toLocaleString('id-ID') ?? 0,
      row.produksi_k3_ton?.toLocaleString('id-ID') ?? 0,
      row.total_produksi_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k1_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k2_ton?.toLocaleString('id-ID') ?? 0,
      row.stok_k3_ton?.toLocaleString('id-ID') ?? 0,
      row.total_stok_ton?.toLocaleString('id-ID') ?? 0,
      row.harga_k1_rp?.toLocaleString('id-ID') ?? 0,
      row.harga_k2_rp?.toLocaleString('id-ID') ?? 0,
      row.harga_k3_rp?.toLocaleString('id-ID') ?? 0,
      row.produktivitas?.toLocaleString('id-ID', { maximumFractionDigits: 3 }) ?? 0,
    ];
  });

  const totalRow = [
    'TOTAL', '',
    totalLuas.toLocaleString('id-ID'),
    totalPok,
    totalPetambak,
    '', '', '',
    totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    '', '', '',
    totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    '', '', '', ''
  ];

  const aoa = [
    [title], [subtitle], [],
    h1, h2,
    ...dataRows,
    totalRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Style header judul
  const refTitle = XLSX.utils.encode_cell({ c: 0, r: 0 });
  ws[refTitle].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  const refSub = XLSX.utils.encode_cell({ c: 0, r: 1 });
  ws[refSub].s = { font: { bold: false, sz: 11 }, alignment: { horizontal: 'center' } };

  const hStyle1 = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF', align: 'center' });
  const hStyle2 = cellStyle({ bold: true, fill: '2E75B6', fontColor: 'FFFFFF', align: 'center' });
  const hProdStyle = cellStyle({ bold: true, fill: '375623', fontColor: 'FFFFFF', align: 'center' }); // header produksi hijau tua
  const hStokStyle = cellStyle({ bold: true, fill: 'BF8F00', fontColor: 'FFFFFF', align: 'center' }); // header stok emas
  const hProdukStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF', align: 'center' });
  const dataStyle = cellStyle({ align: 'center' });
  const dataLeftStyle = cellStyle({ align: 'left' });
  const totalStyle = cellStyle({ bold: true, fill: 'FFFF00', align: 'center' });
  const totalSumStyle = cellStyle({ bold: true, fill: 'F4B942', align: 'center' });

  // Terapkan style per cell header
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 });
    const r4 = XLSX.utils.encode_cell({ c: C, r: 4 });
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    if (!ws[r4]) ws[r4] = { t: 's', v: '' };
    // row 3 = h1, row 4 = h2
    if (C === 0 || C === 1 || C === 2 || C === 3 || C === 4) {
      ws[r3].s = hStyle1; ws[r4].s = hStyle1;
    } else if (C >= 5 && C <= 7) {
      ws[r3].s = hProdStyle; ws[r4].s = hProdStyle;
    } else if (C === 8) {
      ws[r3].s = hProdStyle; ws[r4].s = hProdStyle;
    } else if (C >= 9 && C <= 11) {
      ws[r3].s = hStokStyle; ws[r4].s = hStokStyle;
    } else if (C === 12) {
      ws[r3].s = hStokStyle; ws[r4].s = hStokStyle;
    } else if (C >= 13 && C <= 15) {
      ws[r3].s = hStyle2; ws[r4].s = hStyle2;
    } else {
      ws[r3].s = hProdukStyle; ws[r4].s = hProdukStyle;
    }
  }

  // Style data rows
  const dataStart = 5;
  const totalRowIdx = dataStart + dataRows.length;
  for (let R = dataStart; R < totalRowIdx; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = C === 1 ? dataLeftStyle : dataStyle;
    }
  }

  // Style total row
  for (let C = range.s.c; C <= range.e.c; C++) {
    const ref = XLSX.utils.encode_cell({ c: C, r: totalRowIdx });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = (C === 8 || C === 12) ? totalSumStyle : totalStyle;
  }

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // judul
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // subtitle
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },  // No
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },  // Kab/Kota
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },  // L Total
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },  // Σ Pok
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },  // Σ Petambak
    { s: { r: 3, c: 5 }, e: { r: 3, c: 7 } },  // Produksi (Ton) span
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },  // Σ Prod
    { s: { r: 3, c: 9 }, e: { r: 3, c: 11 } }, // Stok span
    { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } },// Σ Stok
    { s: { r: 3, c: 13 }, e: { r: 3, c: 15 } },// Harga span
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } },// Produktivitas
    { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 4 } }, // TOTAL label
  ];

  ws['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 16 }, { hpt: 8 }, { hpt: 40 }, { hpt: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produksi_Garam');
  XLSX.writeFile(wb, `Rekapitulasi_Garam_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export Potensi Perairan
const exportPotensiPerairanExcel = (data) => {
  const title = 'REKAPITULASI POTENSI PERAIRAN JAWA TIMUR';

  const h1 = [
    'No', 'Kabupaten/Kota',
    'Luas Wilayah\nLaut (km²)',
    'Panjang Garis Pantai (km)', '', '', '', 'Total Panjang\nGaris Pantai (km)',
    'Luas Perairan\n(km²)',
    'Pulau Kecil', '', '', 'Luas Kawasan\nKonservasi (Ha)',
    'Potensi Perikanan\n(Ton/Th)', 'Tahun\nData', 'Keterangan'
  ];
  const h2 = [
    '', '',
    '',
    'Utara', 'Selatan', 'Timur', 'Barat', '',
    '',
    'Jumlah', 'Berpenghuni', 'Tdk Berpenghuni', '',
    '', '', ''
  ];

  let totLaut = 0, totPantai = 0, totPerairan = 0, totPulau = 0, totKonservasi = 0, totPotensi = 0;

  const dataRows = data.map((row, i) => {
    const totalPantai = (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) +
      (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0);
    totLaut += row.luas_wilayah_laut_km2 || 0;
    totPantai += totalPantai;
    totPerairan += row.luas_perairan_km2 || 0;
    totPulau += row.jumlah_pulau_kecil || 0;
    totKonservasi += row.luas_kawasan_konservasi_ha || 0;
    totPotensi += row.potensi_perikanan_ton_th || 0;
    return [
      i + 1,
      row.kabupaten_kota,
      row.luas_wilayah_laut_km2?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_utara_km?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_selatan_km?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_timur_km?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_barat_km?.toLocaleString('id-ID') ?? 0,
      totalPantai.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
      row.luas_perairan_km2?.toLocaleString('id-ID') ?? 0,
      row.jumlah_pulau_kecil ?? 0,
      row.pulau_berpenghuni ?? 0,
      row.pulau_tidak_berpenghuni ?? 0,
      row.luas_kawasan_konservasi_ha?.toLocaleString('id-ID') ?? 0,
      row.potensi_perikanan_ton_th?.toLocaleString('id-ID') ?? 0,
      row.tahun_data,
      row.keterangan ?? '',
    ];
  });

  const totalRow = [
    'TOTAL', '',
    totLaut.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    '', '', '', '',
    totPantai.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    totPerairan.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
    totPulau, '', '', totKonservasi.toLocaleString('id-ID'),
    totPotensi.toLocaleString('id-ID'), '', ''
  ];

  const aoa = [[title], [], h1, h2, ...dataRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const range = XLSX.utils.decode_range(ws['!ref']);

  // Title style
  const tRef = XLSX.utils.encode_cell({ c: 0, r: 0 });
  ws[tRef].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };

  const hBlue = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF' });
  const hGreen = cellStyle({ bold: true, fill: '375623', fontColor: 'FFFFFF' });
  const hTeal = cellStyle({ bold: true, fill: '1F6B75', fontColor: 'FFFFFF' });
  const dStyle = cellStyle({ align: 'center' });
  const dLeftStyle = cellStyle({ align: 'left' });
  const totStyle = cellStyle({ bold: true, fill: 'FFFF00' });
  const totHighStyle = cellStyle({ bold: true, fill: 'F4B942' });

  for (let C = range.s.c; C <= range.e.c; C++) {
    const r2 = XLSX.utils.encode_cell({ c: C, r: 2 });
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 });
    if (!ws[r2]) ws[r2] = { t: 's', v: '' };
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    if (C <= 1) { ws[r2].s = hBlue; ws[r3].s = hBlue; }
    else if (C === 2) { ws[r2].s = hTeal; ws[r3].s = hTeal; }
    else if (C >= 3 && C <= 7) { ws[r2].s = hGreen; ws[r3].s = hGreen; }
    else if (C === 8) { ws[r2].s = hTeal; ws[r3].s = hTeal; }
    else if (C >= 9 && C <= 11) { ws[r2].s = hBlue; ws[r3].s = hBlue; }
    else { ws[r2].s = hBlue; ws[r3].s = hBlue; }
  }

  const dStart = 4, totalRowIdx = dStart + dataRows.length;
  for (let R = dStart; R < totalRowIdx; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = (C === 1 || C === 15) ? dLeftStyle : dStyle;
    }
  }
  for (let C = range.s.c; C <= range.e.c; C++) {
    const ref = XLSX.utils.encode_cell({ c: C, r: totalRowIdx });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = [2, 7, 8, 9, 12, 13].includes(C) ? totHighStyle : totStyle;
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 6 } },
    { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },
    { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
    { s: { r: 2, c: 9 }, e: { r: 2, c: 11 } },
    { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
    { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } },
    { s: { r: 2, c: 14 }, e: { r: 3, c: 14 } },
    { s: { r: 2, c: 15 }, e: { r: 3, c: 15 } },
    { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 1 } },
  ];

  ws['!cols'] = [
    { wch: 5 }, { wch: 18 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 10 }, { wch: 30 },
  ];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 8 }, { hpt: 45 }, { hpt: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Potensi_Perairan');
  XLSX.writeFile(wb, `Potensi_Perairan_Jatim_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Simple export untuk Mangrove, Karang, Lamun
const exportSimple = (data, config) => {
  const { title, filename, headers, mapper } = config;
  const h = Object.keys(headers);
  const dataRows = data.map(mapper);
  const totalRow = ['TOTAL', ...Array(h.length - 1).fill('')];
  const aoa = [[title], [], h, ...dataRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const range = XLSX.utils.decode_range(ws['!ref']);
  const hStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF' });
  const dStyle = cellStyle({ align: 'left' });
  const dCenterStyle = cellStyle({ align: 'center' });
  const totStyle = cellStyle({ bold: true, fill: 'FFFF00' });
  const tRef = XLSX.utils.encode_cell({ c: 0, r: 0 });
  ws[tRef].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  for (let C = range.s.c; C <= range.e.c; C++) {
    const ref = XLSX.utils.encode_cell({ c: C, r: 2 });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = hStyle;
  }
  for (let R = 3; R < 3 + dataRows.length; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = C <= 1 ? dStyle : dCenterStyle;
    }
  }
  for (let C = range.s.c; C <= range.e.c; C++) {
    const ref = XLSX.utils.encode_cell({ c: C, r: 3 + dataRows.length });
    if (!ws[ref]) ws[ref] = { t: 's', v: '' };
    ws[ref].s = totStyle;
  }
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: h.length - 1 } },
    { s: { r: 3 + dataRows.length, c: 0 }, e: { r: 3 + dataRows.length, c: 1 } },
  ];
  ws['!cols'] = h.map((_, i) => ({ wch: i === 0 ? 5 : i === 1 ? 18 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, filename);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AdminKelautanPesisir() {
  const TABS = [
    { key: 'garam',            label: 'Data Garam',       icon: <Map className="w-4 h-4" /> },
    { key: 'mangrove',         label: 'Data Mangrove',    icon: <TreePine className="w-4 h-4" /> },
    { key: 'terumbu_karang',   label: 'Terumbu Karang',   icon: <Waves className="w-4 h-4" /> },
    { key: 'lamun',            label: 'Padang Lamun',     icon: <Leaf className="w-4 h-4" /> },
    { key: 'potensi_perairan', label: 'Potensi Perairan', icon: <Globe className="w-4 h-4" /> },
  ];

  const [activeTab, setActiveTab] = useState('garam');
  const [dataGaram, setDataGaram] = useState(DUMMY_GARAM);
  const [dataMangrove, setDataMangrove] = useState(DUMMY_MANGROVE);
  const [dataTerumbuKarang, setDataTerumbuKarang] = useState(DUMMY_TERUMBU_KARANG);
  const [dataLamun, setDataLamun] = useState(DUMMY_LAMUN);
  const [dataPotensiPerairan, setDataPotensiPerairan] = useState(DUMMY_POTENSI_PERAIRAN);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleCreateOrUpdate = async (formData) => {
    setSubmitLoading(true);
    setTimeout(() => {
      if (activeTab === 'garam') {
        if (editingData) setDataGaram(prev => prev.map(i => i.id === editingData.id ? { ...i, ...formData } : i));
        else setDataGaram(prev => [{ ...formData, id: Date.now(), status: 'PENDING' }, ...prev]);
      }
      setSubmitLoading(false); setIsFormOpen(false); setEditingData(null);
    }, 700);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const setMap = { garam: setDataGaram, mangrove: setDataMangrove, terumbu_karang: setDataTerumbuKarang, lamun: setDataLamun, potensi_perairan: setDataPotensiPerairan };
    setMap[activeTab]?.(prev => prev.filter(i => i.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleApprove = async (row) => {
    if (!window.confirm(`Setujui data ${row.kabupaten_kota}?`)) return;
    const update = (setter) => setter(prev => prev.map(i => i.id === row.id ? { ...i, status: 'APPROVED', alasan_penolakan: null } : i));
    if (activeTab === 'garam') update(setDataGaram);
    else if (activeTab === 'mangrove') update(setDataMangrove);
    else if (activeTab === 'terumbu_karang') update(setDataTerumbuKarang);
    else if (activeTab === 'lamun') update(setDataLamun);
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (!alasan?.trim()) return;
    const update = (setter) => setter(prev => prev.map(i => i.id === row.id ? { ...i, status: 'REJECTED', alasan_penolakan: alasan } : i));
    if (activeTab === 'garam') update(setDataGaram);
    else if (activeTab === 'mangrove') update(setDataMangrove);
    else if (activeTab === 'terumbu_karang') update(setDataTerumbuKarang);
    else if (activeTab === 'lamun') update(setDataLamun);
  };

  // ── COLUMNS ────────────────────────────────────────────────────────────────
  const columnsGaram = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Bulan', accessorKey: 'bulan', cell: info => <span className="text-[#c8dff0]">{formatBulan(info.getValue())}</span> },
    { header: 'TW', accessorKey: 'triwulan', cell: info => <TwBadge tw={info.getValue()} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-bold text-[#c8dff0] bg-[#152d45] px-2.5 py-1 rounded-md text-xs">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Total Produksi', accessorKey: 'total_produksi_ton', cell: info => <span className="font-bold text-emerald-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Total Stok', accessorKey: 'total_stok_ton', cell: info => <span className="font-bold text-amber-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Produktivitas', accessorKey: 'produktivitas', cell: info => <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md text-xs">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha</span> },
  ], []);

  const columnsMangrove = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-semibold text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-emerald-400">{info.getValue()}</p> },
    { header: 'Kecamatan', accessorKey: 'kecamatan', cell: info => <span className="text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Luas Total (Ha)', accessorKey: 'luas_total_ha', cell: info => <span className="text-[#c8dff0]">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Kondisi Baik (Ha)', accessorKey: 'kondisi_baik_ha', cell: info => <span className="text-emerald-400 font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Rehab (Ha)', accessorKey: 'luas_rehabilitasi_ha', cell: info => <span className="text-cyan-400 font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
  ], []);

  const columnsKarang = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-semibold text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Lokasi Perairan', accessorKey: 'lokasi_perairan', cell: info => <span className="text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Tutupan Hidup', accessorKey: 'tutupan_hidup_persen', cell: info => <span className="font-medium text-[#c8dff0]">{info.getValue()}%</span> },
    { header: 'Kondisi', accessorKey: 'kategori_status', cell: info => { const v = info.getValue(); const c = (v === 'Sangat Baik' || v === 'Baik') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'; return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c}`}>{v}</span>; } },
  ], []);

  const columnsLamun = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => <StatusBadge status={info.getValue()} alasan={info.row.original.alasan_penolakan} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-semibold text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-emerald-400">{info.getValue()}</p> },
    { header: 'Lokasi Perairan', accessorKey: 'lokasi_perairan', cell: info => <span className="text-[#c8dff0]">{info.getValue()}</span> },
    { header: 'Luas (Ha)', accessorKey: 'luas_total_ha', cell: info => <span className="text-[#c8dff0] font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Kerapatan (%)', accessorKey: 'kerapatan_persen', cell: info => <span className="font-medium text-[#c8dff0]">{info.getValue()}%</span> },
    { header: 'Kondisi', accessorKey: 'kondisi', cell: info => { const v = info.getValue(); const c = v === 'Baik' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : v === 'Sedang' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'; return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c}`}>{v}</span>; } },
    { header: 'Spesies Dominan', accessorKey: 'jenis_dominan', cell: info => <span className="text-[#7fb5d5] italic text-xs">{info.getValue()}</span> },
  ], []);

  // Potensi Perairan — kalkulasi otomatis total_panjang_garis_pantai dari 4 segmen
  const columnsPotensi = useMemo(() => [
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'L. Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => <span className="text-[#c8dff0] font-medium">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> },
    {
      header: 'Total Garis Pantai (km)', accessorKey: 'total_garis_pantai',
      accessorFn: row => {
        const total = (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) +
          (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0);
        return total;
      },
      cell: info => <span className="font-bold text-cyan-400">{info.getValue().toLocaleString('id-ID', { maximumFractionDigits: 2 })} km</span>
    },
    { header: 'L. Perairan (km²)', accessorKey: 'luas_perairan_km2', cell: info => <span className="text-[#c8dff0] font-medium">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil', cell: info => <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs">{info.getValue()} pulau</span> },
    { header: 'Konservasi (Ha)', accessorKey: 'luas_kawasan_konservasi_ha', cell: info => <span className="text-emerald-400 font-medium">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Potensi (Ton/Th)', accessorKey: 'potensi_perikanan_ton_th', cell: info => <span className="text-[#c8dff0]">{(info.getValue() || 0).toLocaleString('id-ID')}</span> },
    { header: 'Tahun', accessorKey: 'tahun_data', cell: info => <span className="text-xs bg-[#152d45] px-2 py-1 rounded text-[#7fb5d5] font-semibold">{info.getValue()}</span> },
  ], []);

  // ── SUB-ROW: GARAM ─────────────────────────────────────────────────────────
  const renderSubGaram = ({ row }) => {
    const d = row.original;
    return (
      <div className="p-6 bg-[#0b1929]/70 border-l-4 border-cyan-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-[#1e3a52] text-sm">
          {[
            { label: 'Luas Produksi', value: `${(d.luas_produksi_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
            { label: 'Produktivitas Lahan', value: `${(d.produktivitas || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha`, cls: 'text-emerald-300', border: 'border-emerald-500/30' },
            { label: 'Jml Kelompok', value: `${d.jumlah_kelompok || 0} Pok`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
            { label: 'Jml Petambak', value: `${d.jumlah_petambak || 0} Org`, cls: 'text-[#c8dff0]', border: 'border-[#1e3a52]' },
          ].map(s => (
            <div key={s.label} className={`bg-[#0f2236] p-3.5 rounded-xl border ${s.border}`}>
              <span className="text-[#7fb5d5] text-xs font-semibold block mb-1 uppercase tracking-wider">{s.label}</span>
              <span className={`font-bold text-xl ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>
        <h4 className="text-xs font-bold text-[#7fb5d5] mb-4 tracking-widest uppercase flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Rincian per Kualitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'KUALITAS 1', badge: 'Tinggi', produksi: d.produksi_k1_ton, stok: d.stok_k1_ton, harga: d.harga_k1_rp, borderCls: 'border-cyan-500/20', accentCls: 'bg-cyan-500', stokCls: 'text-cyan-400', headCls: 'text-cyan-300', badgeCls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'KUALITAS 2', badge: 'Menengah', produksi: d.produksi_k2_ton, stok: d.stok_k2_ton, harga: d.harga_k2_rp, borderCls: 'border-amber-500/20', accentCls: 'bg-amber-500', stokCls: 'text-amber-400', headCls: 'text-amber-300', badgeCls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'KUALITAS 3', badge: 'Rendah', produksi: d.produksi_k3_ton, stok: d.stok_k3_ton, harga: d.harga_k3_rp, borderCls: 'border-[#1e3a52]', accentCls: 'bg-[#7fb5d5]/40', stokCls: 'text-[#c8dff0]', headCls: 'text-[#7fb5d5]', badgeCls: 'text-[#7fb5d5] bg-[#152d45] border-[#1e3a52]' },
          ].map(k => (
            <div key={k.label} className={`bg-[#0f2236] p-4 rounded-xl border ${k.borderCls} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${k.accentCls}`}></div>
              <h5 className={`font-bold ${k.headCls} mb-3 flex items-center justify-between`}>
                {k.label}
                <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${k.badgeCls}`}>{k.badge}</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-[#7fb5d5]"><span>Produksi:</span><span className="font-semibold text-[#c8dff0]">{(k.produksi || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between text-[#7fb5d5]"><span>Sisa Stok:</span><span className={`font-semibold ${k.stokCls}`}>{(k.stok || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between pt-2 border-t border-[#1e3a52] mt-2"><span className="text-[#7fb5d5] text-xs">Harga</span><span className="font-bold text-[#c8dff0]">{formatRupiah(k.harga)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-[#1e3a52]">
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

  // ── SUB-ROW: POTENSI PERAIRAN ──────────────────────────────────────────────
  const renderSubPotensi = ({ row }) => {
    const d = row.original;
    const totalPantai = (d.panjang_pantai_utara_km || 0) + (d.panjang_pantai_selatan_km || 0) +
      (d.panjang_pantai_timur_km || 0) + (d.panjang_pantai_barat_km || 0);
    return (
      <div className="p-6 bg-[#0b1929]/70 border-l-4 border-cyan-500">
        <h4 className="text-xs font-bold text-[#7fb5d5] mb-4 tracking-widest uppercase flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5" /> Rincian Garis Pantai per Segmen
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Pantai Utara', value: `${(d.panjang_pantai_utara_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Selatan', value: `${(d.panjang_pantai_selatan_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Timur', value: `${(d.panjang_pantai_timur_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Pantai Barat', value: `${(d.panjang_pantai_barat_km || 0).toLocaleString('id-ID')} km` },
            { label: 'Total Garis Pantai', value: `${totalPantai.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`, highlight: true },
          ].map(s => (
            <div key={s.label} className={`p-3.5 rounded-xl border ${s.highlight ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-[#1e3a52] bg-[#0f2236]'}`}>
              <span className={`text-xs font-semibold block mb-1 uppercase tracking-wider ${s.highlight ? 'text-cyan-400' : 'text-[#7fb5d5]'}`}>{s.label}</span>
              <span className={`font-bold text-lg ${s.highlight ? 'text-cyan-300' : 'text-[#c8dff0]'}`}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pulau Berpenghuni', value: `${d.pulau_berpenghuni || 0} pulau`, cls: 'text-emerald-400', border: 'border-emerald-500/20' },
            { label: 'Pulau Tdk Berpenghuni', value: `${d.pulau_tidak_berpenghuni || 0} pulau`, cls: 'text-[#7fb5d5]', border: 'border-[#1e3a52]' },
            { label: 'Kawasan Konservasi', value: `${(d.luas_kawasan_konservasi_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-emerald-400', border: 'border-emerald-500/20' },
            { label: 'Potensi Perikanan', value: `${(d.potensi_perikanan_ton_th || 0).toLocaleString('id-ID')} Ton/Th`, cls: 'text-amber-400', border: 'border-amber-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-[#0f2236] p-3.5 rounded-xl border ${s.border}`}>
              <span className="text-[#7fb5d5] text-xs font-semibold block mb-1 uppercase tracking-wider">{s.label}</span>
              <span className={`font-bold text-xl ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>
        {d.keterangan && (
          <div className="mt-4 p-3 bg-[#152d45] rounded-lg border border-[#1e3a52]">
            <span className="text-xs text-[#7fb5d5] font-semibold uppercase tracking-wider block mb-1">Keterangan</span>
            <p className="text-sm text-[#c8dff0]">{d.keterangan}</p>
          </div>
        )}
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const activeData = {
    garam: dataGaram, mangrove: dataMangrove,
    terumbu_karang: dataTerumbuKarang, lamun: dataLamun,
    potensi_perairan: dataPotensiPerairan
  }[activeTab] ?? [];

  const activeColumns = {
    garam: columnsGaram, mangrove: columnsMangrove,
    terumbu_karang: columnsKarang, lamun: columnsLamun,
    potensi_perairan: columnsPotensi
  }[activeTab] ?? [];

  const activeSubRow = {
    garam: renderSubGaram,
    potensi_perairan: renderSubPotensi,
  }[activeTab];

  const handleCustomExport = (data) => {
    if (activeTab === 'garam') return exportGaramExcel(data);
    if (activeTab === 'potensi_perairan') return exportPotensiPerairanExcel(data);
    if (activeTab === 'mangrove') return exportSimple(data, {
      title: 'REKAPITULASI DATA MANGROVE JAWA TIMUR',
      filename: 'Data_Mangrove',
      headers: { 'No': '', 'Kab/Kota': '', 'Kecamatan': '', 'Tahun': '', 'Luas Total (Ha)': '', 'Kondisi Baik (Ha)': '', 'Kondisi Sedang (Ha)': '', 'Kondisi Rusak (Ha)': '', 'Luas Rehab (Ha)': '', 'Jml Bibit': '', 'Status': '' },
      mapper: (row, i) => [i + 1, row.kabupaten_kota, row.kecamatan, row.tahun, row.luas_total_ha, row.kondisi_baik_ha, row.kondisi_sedang_ha, row.kondisi_rusak_ha, row.luas_rehabilitasi_ha, row.jumlah_bibit_ditanam, row.status],
    });
    if (activeTab === 'terumbu_karang') return exportSimple(data, {
      title: 'REKAPITULASI DATA TERUMBU KARANG JAWA TIMUR',
      filename: 'Data_Terumbu_Karang',
      headers: { 'No': '', 'Kab/Kota': '', 'Lokasi Perairan': '', 'Tahun': '', 'Kedalaman (m)': '', 'Tutupan Hidup (%)': '', 'Kategori': '', 'Ada Bleaching': '', 'Ancaman': '', 'Status': '' },
      mapper: (row, i) => [i + 1, row.kabupaten_kota, row.lokasi_perairan, row.tahun, row.kedalaman_meter, row.tutupan_hidup_persen, row.kategori_status, row.ada_bleaching ? 'Ya' : 'Tidak', row.keterangan_ancaman, row.status],
    });
    if (activeTab === 'lamun') return exportSimple(data, {
      title: 'REKAPITULASI DATA PADANG LAMUN JAWA TIMUR',
      filename: 'Data_Lamun',
      headers: { 'No': '', 'Kab/Kota': '', 'Lokasi Perairan': '', 'Tahun': '', 'Luas (Ha)': '', 'Kerapatan (%)': '', 'Kondisi': '', 'Spesies Dominan': '', 'Ancaman': '', 'Status': '' },
      mapper: (row, i) => [i + 1, row.kabupaten_kota, row.lokasi_perairan, row.tahun, row.luas_total_ha, row.kerapatan_persen, row.kondisi, row.jenis_dominan, row.ancaman, row.status],
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-[#0b1929] min-h-screen text-[#c8dff0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-cyan-400/70 uppercase tracking-widest mb-1.5">Dinas Kelautan &amp; Perikanan — Jawa Timur</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bidang Kelautan &amp; Pesisir</h1>
          <p className="text-[#7fb5d5] mt-1.5 text-sm">Kelola laporan Garam, Mangrove, Terumbu Karang, Lamun, dan Potensi Perairan.</p>
        </div>
        {!isFormOpen && activeTab !== 'potensi_perairan' && (
          <button
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-700/30 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah {TABS.find(t => t.key === activeTab)?.label}
          </button>
        )}
      </div>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f2236] border border-[#1e3a52] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-400"><Trash2 className="w-5 h-5" /><h3 className="text-lg font-bold">Konfirmasi Hapus</h3></div>
            <p className="text-[#7fb5d5] text-sm mb-6">Yakin ingin menghapus data <strong className="text-[#c8dff0]">{itemToDelete.kabupaten_kota}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg font-medium bg-[#152d45] text-[#7fb5d5] hover:bg-[#1e3a52] text-sm">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isFormOpen && (
        <div className="flex overflow-x-auto border-b border-[#1e3a52] gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-medium transition-colors text-sm whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
                  : 'border-transparent text-[#7fb5d5] hover:bg-[#152d45]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Potensi Perairan — info banner */}
      {!isFormOpen && activeTab === 'potensi_perairan' && (
        <div className="flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-5 py-4">
          <Globe className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-cyan-300 mb-1">Data untuk Tampilan Dashboard Publik</p>
            <p className="text-xs text-[#7fb5d5] leading-relaxed">
              Tabel ini berisi data statis potensi perairan per Kab/Kota yang ditampilkan di halaman dashboard publik.
              <strong className="text-cyan-300"> Total Panjang Garis Pantai</strong> dihitung otomatis dari penjumlahan segmen Utara + Selatan + Timur + Barat.
              Klik baris untuk melihat rincian segmen garis pantai dan pulau kecil.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isFormOpen ? (
        activeTab === 'garam' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <GaramInputForm
              initialData={editingData}
              isLoading={submitLoading}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
            />
          </div>
        ) : (
          <div className="bg-[#0f2236] border border-[#1e3a52] p-12 rounded-2xl text-center">
            <p className="text-[#7fb5d5] text-sm">Form untuk {TABS.find(t => t.key === activeTab)?.label} sedang disiapkan.</p>
            <button onClick={() => setIsFormOpen(false)} className="mt-4 px-6 py-2 border border-[#1e3a52] rounded-lg hover:bg-[#152d45] font-medium text-sm text-[#c8dff0]">Kembali</button>
          </div>
        )
      ) : (
        <div className="bg-[#0f2236] rounded-2xl border border-[#1e3a52] overflow-hidden shadow-xl shadow-black/20">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              <p className="text-[#7fb5d5] text-sm">Memuat data...</p>
            </div>
          ) : (
            <DataTable
              columns={activeColumns}
              data={activeData}
              onEdit={activeTab !== 'potensi_perairan' ? (row) => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } : undefined}
              onDelete={activeTab !== 'potensi_perairan' ? (row) => setItemToDelete(row) : undefined}
              onApprove={activeTab !== 'potensi_perairan' ? handleApprove : undefined}
              onReject={activeTab !== 'potensi_perairan' ? handleReject : undefined}
              renderSubComponent={activeSubRow}
              exportName={`Data_${activeTab}`}
              onCustomExport={handleCustomExport}
            />
          )}
        </div>
      )}
    </div>
  );
}