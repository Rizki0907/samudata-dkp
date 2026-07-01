import React, { useState } from 'react';
import { Save, Loader2, FlaskConical, X, BarChart3 } from 'lucide-react';

const NAMA_BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const getTriwulan = (bulan) => {
  const b = bulan?.toLowerCase() ?? '';
  if (['januari','februari','maret'].includes(b)) return 'TW 1';
  if (['april','mei','juni'].includes(b)) return 'TW 2';
  if (['juli','agustus','september'].includes(b)) return 'TW 3';
  if (['oktober','november','desember'].includes(b)) return 'TW 4';
  return '-';
};

const KAB_KOTA_JATIM = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember',
  'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan', 'Malang',
  'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo',
  'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung',
  'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang', 'Kota Mojokerto',
  'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya'
];

const TwBadge = ({ tw }) => {
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[tw] ?? 'bg-[#152d45] text-[#7fb5d5] border-[#1e3a52]';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{tw ?? '-'}</span>
  );
};

export const KelautanPesisirForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(initialData || {
    bulan: 'Januari',
    tahun: new Date().getFullYear(),
    kabupaten_kota: '',
    luas_total_ha: '',
    luas_produksi_ha: '',
    jumlah_kelompok: '',
    jumlah_petambak: '',
    produksi_k1_ton: '', stok_k1_ton: '', harga_k1_rp: '',
    produksi_k2_ton: '', stok_k2_ton: '', harga_k2_rp: '',
    produksi_k3_ton: '', stok_k3_ton: '', harga_k3_rp: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── LIVE KALKULASI ──────────────────────────────────────────────────────────
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

  // Triwulan otomatis dari nama bulan
  const triwulan = getTriwulan(formData.bulan);
  // ───────────────────────────────────────────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      tahun: parseInt(formData.tahun),
      triwulan,                               // dikirim ke server
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
    };
    onSubmit(finalData);
  };

  const inputCls = "w-full h-10 rounded-md border border-[#1e3a52] bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-[#3a5a72] transition-shadow";
  const labelCls = "text-xs font-semibold text-[#7fb5d5] uppercase tracking-wider";

  return (
    <div className="bg-[#0f2236] border border-[#1e3a52] rounded-2xl shadow-xl overflow-hidden">
      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a52] bg-[#152d45]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <h2 className="text-base font-bold text-[#c8dff0]">{initialData ? 'Edit' : 'Input'} Laporan Data Garam</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-[#0b1929] rounded-full transition-colors text-[#7fb5d5] hover:text-[#c8dff0]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Row 1: Periode & Lokasi */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-2">
            <label className={labelCls}>Bulan Laporan</label>
            <select name="bulan" value={formData.bulan} onChange={handleChange} className={inputCls + " appearance-none"}>
              {NAMA_BULAN_LIST.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Triwulan</label>
            {/* Read-only, otomatis dari bulan */}
            <div className="h-10 flex items-center">
              <TwBadge tw={triwulan} />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Tahun</label>
            <input type="number" name="tahun" value={formData.tahun} onChange={handleChange} className={inputCls} required />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Kabupaten / Kota</label>
            <select name="kabupaten_kota" value={formData.kabupaten_kota} onChange={handleChange} className={inputCls + " appearance-none"} required>
              <option value="" disabled>-- Pilih Kab/Kota --</option>
              {KAB_KOTA_JATIM.map(kab => <option key={kab} value={kab}>{kab}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Lahan & SDM */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-[#0b1929] p-5 rounded-xl border border-[#1e3a52]">
          <div className="space-y-2">
            <label className={labelCls}>Luas Lahan Total (Ha)</label>
            <input type="number" step="0.01" name="luas_total_ha" value={formData.luas_total_ha} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Luas Produksi (Ha)</label>
            <input type="number" step="0.01" name="luas_produksi_ha" value={formData.luas_produksi_ha} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Jumlah Kelompok</label>
            <input type="number" name="jumlah_kelompok" value={formData.jumlah_kelompok} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Jumlah Petambak</label>
            <input type="number" name="jumlah_petambak" value={formData.jumlah_petambak} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
        </div>

        {/* Row 3: Detail K1, K2, K3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* K1 */}
          <div className="space-y-4 border border-cyan-500/30 bg-cyan-500/5 p-5 rounded-xl">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_theme(colors.cyan.400)]"></span>
              <h4 className="font-bold text-cyan-300 text-sm">Kualitas 1 — Tinggi</h4>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Produksi (Ton)</label>
                <input type="number" step="0.01" name="produksi_k1_ton" value={formData.produksi_k1_ton} onChange={handleChange} className="w-full h-10 rounded-md border border-cyan-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-[#3a5a72]" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Sisa Stok (Ton)</label>
                <input type="number" step="0.01" name="stok_k1_ton" value={formData.stok_k1_ton} onChange={handleChange} className="w-full h-10 rounded-md border border-cyan-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-[#3a5a72]" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Harga Jual (Rp/Kg)</label>
                <input type="number" name="harga_k1_rp" value={formData.harga_k1_rp} onChange={handleChange} className="w-full h-10 rounded-md border border-cyan-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-[#3a5a72]" placeholder="Mis: 2200" />
              </div>
            </div>
          </div>

          {/* K2 */}
          <div className="space-y-4 border border-amber-500/30 bg-amber-500/5 p-5 rounded-xl">
            <div className="flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400)]"></span>
              <h4 className="font-bold text-amber-300 text-sm">Kualitas 2 — Menengah</h4>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Produksi (Ton)</label>
                <input type="number" step="0.01" name="produksi_k2_ton" value={formData.produksi_k2_ton} onChange={handleChange} className="w-full h-10 rounded-md border border-amber-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-[#3a5a72]" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Sisa Stok (Ton)</label>
                <input type="number" step="0.01" name="stok_k2_ton" value={formData.stok_k2_ton} onChange={handleChange} className="w-full h-10 rounded-md border border-amber-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-[#3a5a72]" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Harga Jual (Rp/Kg)</label>
                <input type="number" name="harga_k2_rp" value={formData.harga_k2_rp} onChange={handleChange} className="w-full h-10 rounded-md border border-amber-500/30 bg-[#0b1929] text-[#c8dff0] px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-[#3a5a72]" placeholder="Mis: 1700" />
              </div>
            </div>
          </div>

          {/* K3 */}
          <div className="space-y-4 border border-[#1e3a52] bg-[#0b1929]/50 p-5 rounded-xl">
            <div className="flex items-center gap-2 border-b border-[#1e3a52] pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7fb5d5]"></span>
              <h4 className="font-bold text-[#7fb5d5] text-sm">Kualitas 3 — Rendah</h4>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#7fb5d5]/70 uppercase tracking-wider">Produksi (Ton)</label>
                <input type="number" step="0.01" name="produksi_k3_ton" value={formData.produksi_k3_ton} onChange={handleChange} className={inputCls} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#7fb5d5]/70 uppercase tracking-wider">Sisa Stok (Ton)</label>
                <input type="number" step="0.01" name="stok_k3_ton" value={formData.stok_k3_ton} onChange={handleChange} className={inputCls} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#7fb5d5]/70 uppercase tracking-wider">Harga Jual (Rp/Kg)</label>
                <input type="number" name="harga_k3_rp" value={formData.harga_k3_rp} onChange={handleChange} className={inputCls} placeholder="Kosongkan jika tdk ada" />
              </div>
            </div>
          </div>
        </div>

        {/* ── LIVE KALKULASI PANEL ─────────────────────────────────────────── */}
        <div className="bg-[#0b1929] border border-[#1e3a52] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-[#7fb5d5] uppercase tracking-widest">Kalkulasi Otomatis</h4>
            <span className="text-xs text-[#3a5a72] ml-1">— dihitung real-time</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Produksi */}
            <div className="bg-[#0f2236] rounded-xl border border-emerald-500/20 p-4 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-4 -mb-4"></div>
              <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider mb-1">Total Produksi</p>
              <p className="text-2xl font-bold text-emerald-400">{totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-[#7fb5d5] mt-0.5">Ton (K1 + K2 + K3)</p>
              <div className="mt-3 flex gap-3 text-xs text-[#7fb5d5]">
                <span className="text-cyan-400">{pk1.toLocaleString('id-ID')}</span>
                <span className="opacity-40">+</span>
                <span className="text-amber-400">{pk2.toLocaleString('id-ID')}</span>
                <span className="opacity-40">+</span>
                <span>{pk3.toLocaleString('id-ID')}</span>
              </div>
            </div>
            {/* Total Stok */}
            <div className="bg-[#0f2236] rounded-xl border border-amber-500/20 p-4 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-4 -mb-4"></div>
              <p className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-1">Total Stok</p>
              <p className="text-2xl font-bold text-amber-400">{totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-[#7fb5d5] mt-0.5">Ton (K1 + K2 + K3)</p>
              <div className="mt-3 flex gap-3 text-xs text-[#7fb5d5]">
                <span className="text-cyan-400">{sk1.toLocaleString('id-ID')}</span>
                <span className="opacity-40">+</span>
                <span className="text-amber-400">{sk2.toLocaleString('id-ID')}</span>
                <span className="opacity-40">+</span>
                <span>{sk3.toLocaleString('id-ID')}</span>
              </div>
            </div>
            {/* Produktivitas */}
            <div className={`bg-[#0f2236] rounded-xl border p-4 relative overflow-hidden transition-colors ${lp > 0 ? 'border-cyan-500/30' : 'border-[#1e3a52]'}`}>
              <div className={`absolute bottom-0 right-0 w-16 h-16 rounded-full -mr-4 -mb-4 ${lp > 0 ? 'bg-cyan-500/5' : 'bg-[#152d45]/50'}`}></div>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 font-medium rounded-lg text-[#7fb5d5] hover:bg-[#152d45] transition-colors border border-[#1e3a52] text-sm">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-cyan-700/30 text-sm disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Laporan
          </button>
        </div>
      </form>
    </div>
  );
};

