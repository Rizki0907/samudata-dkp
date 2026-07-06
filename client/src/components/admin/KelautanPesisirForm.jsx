import React, { useState } from 'react';
import { Save, Loader2, FlaskConical, X } from 'lucide-react';

const NAMA_BULAN_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const getTriwulan = (bulan) => {
  const b = bulan?.toLowerCase() ?? '';
  if (['januari', 'februari', 'maret'].includes(b)) return 'TW 1';
  if (['april', 'mei', 'juni'].includes(b)) return 'TW 2';
  if (['juli', 'agustus', 'september'].includes(b)) return 'TW 3';
  if (['oktober', 'november', 'desember'].includes(b)) return 'TW 4';
  return '-';
};

const KAB_KOTA_JATIM = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember',
  'Jombang', 'Kediri', 'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 
  'Kota Malang', 'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya',
  'Lamongan', 'Lumajang', 'Madiun', 'Magetan', 'Malang', 'Mojokerto', 'Nganjuk', 
  'Ngawi', 'PT. Garam', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 'Probolinggo', 
  'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung'
];

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
    const finalData = {
      ...formData,
      tahun: parseInt(formData.tahun),
      triwulan,
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

  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-center outline-none focus:ring-2 focus:ring-primary/50 border-input";
  const labelClass = "block text-sm font-medium mb-2 text-center";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-card-foreground">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-bold">{initialData ? 'Edit' : 'Input'} Laporan Data Garam</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className={labelClass}>Bulan Laporan</label>
              <select name="bulan" value={formData.bulan} onChange={handleChange} className={inputClass + " pr-10"}>
                {NAMA_BULAN_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Triwulan</label>
              <div className="h-10 flex items-center justify-center border border-border rounded-lg bg-muted/30 text-sm font-semibold">
                {triwulan}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tahun</label>
              <input type="number" name="tahun" value={formData.tahun} onChange={handleChange} min="2000" max={new Date().getFullYear()} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Kabupaten / Kota</label>
              <select name="kabupaten_kota" value={formData.kabupaten_kota} onChange={handleChange} className={inputClass + " pr-10"} required>
                <option value="" disabled>-- Pilih Kab/Kota --</option>
                {KAB_KOTA_JATIM.map(kab => <option key={kab} value={kab}>{kab}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Lahan & SDM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end">
            <div>
              <label className={labelClass}>Luas Lahan Total (Ha)</label>
              <input type="number" step="0.01" min="0" name="luas_total_ha" value={formData.luas_total_ha} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Luas Produksi (Ha)</label>
              <input type="number" step="0.01" min="0" name="luas_produksi_ha" value={formData.luas_produksi_ha} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Kelompok</label>
              <input type="number" min="0" name="jumlah_kelompok" value={formData.jumlah_kelompok} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Petambak</label>
              <input type="number" min="0" name="jumlah_petambak" value={formData.jumlah_petambak} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center flex flex-col justify-center h-full min-h-[72px]">
              <span className="text-xs font-semibold text-primary/70 uppercase mb-1">Produktivitas Lahan</span>
              {lp > 0 ? (
                <span className="font-bold text-primary">{produktivitas.toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha</span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Isi luas produksi terlebih dahulu</span>
              )}
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Kualitas Garam
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { key: 'k1', label: 'Kualitas 1 (Tinggi)' },
              { key: 'k2', label: 'Kualitas 2 (Menengah)' },
              { key: 'k3', label: 'Kualitas 3 (Rendah)' },
            ].map(k => {
              const p = parseFloat(formData[`produksi_${k.key}_ton`]) || 0;
              const h = parseFloat(formData[`harga_${k.key}_rp`]) || 0;
              return (
                <div key={k.key} className="space-y-4 border border-border bg-muted/10 p-5 rounded-xl">
                  <h4 className="font-bold text-center text-sm">{k.label}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Produksi (Ton)</label>
                      <input type="number" step="0.01" min="0" name={`produksi_${k.key}_ton`} value={formData[`produksi_${k.key}_ton`]} onChange={handleChange} className={inputClass} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Stok (Ton)</label>
                      <input type="number" step="0.01" min="0" name={`stok_${k.key}_ton`} value={formData[`stok_${k.key}_ton`]} onChange={handleChange} className={inputClass} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Harga (Rp/Kg)</label>
                      <input type="number" min="0" name={`harga_${k.key}_rp`} value={formData[`harga_${k.key}_rp`]} onChange={handleChange} className={inputClass} placeholder="0" />
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Nilai Produksi</span>
                      <span className="text-sm font-bold">Rp {(p * h).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 font-medium rounded-lg hover:bg-muted transition-colors border border-border text-sm">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Laporan
          </button>
        </div>
      </form>
    </div>
  );
};
