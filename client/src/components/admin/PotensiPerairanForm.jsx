import React, { useState } from 'react';
import { Save, Loader2, Anchor, X } from 'lucide-react';

const KAB_KOTA_JATIM = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember',
  'Jombang', 'Kediri', 'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun',
  'Kota Malang', 'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya',
  'Lamongan', 'Lumajang', 'Madiun', 'Magetan', 'Malang', 'Mojokerto', 'Nganjuk',
  'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 'Probolinggo',
  'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung'
];

const CURRENT_YEAR = new Date().getFullYear();

export const PotensiPerairanForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(initialData || {
    kabupaten_kota: '',
    tahun_data: CURRENT_YEAR,
    luas_wilayah_laut_km2: '',
    panjang_pantai_utara_km: '',
    panjang_pantai_selatan_km: '',
    panjang_pantai_timur_km: '',
    panjang_pantai_barat_km: '',
    luas_perairan_km2: '',
    jumlah_pulau_kecil: '',
    pulau_berpenghuni: '',
    pulau_tidak_berpenghuni: '',
    desa_pesisir: '',
    luas_kawasan_konservasi_ha: '',
    potensi_perikanan_ton_th: '',
    keterangan: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const totalPantai =
    (parseFloat(formData.panjang_pantai_utara_km) || 0) +
    (parseFloat(formData.panjang_pantai_selatan_km) || 0) +
    (parseFloat(formData.panjang_pantai_timur_km) || 0) +
    (parseFloat(formData.panjang_pantai_barat_km) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tahun_data: parseInt(formData.tahun_data),
      luas_wilayah_laut_km2: parseFloat(formData.luas_wilayah_laut_km2) || 0,
      panjang_pantai_utara_km: parseFloat(formData.panjang_pantai_utara_km) || 0,
      panjang_pantai_selatan_km: parseFloat(formData.panjang_pantai_selatan_km) || 0,
      panjang_pantai_timur_km: parseFloat(formData.panjang_pantai_timur_km) || 0,
      panjang_pantai_barat_km: parseFloat(formData.panjang_pantai_barat_km) || 0,
      luas_perairan_km2: parseFloat(formData.luas_perairan_km2) || 0,
      jumlah_pulau_kecil: parseInt(formData.jumlah_pulau_kecil) || 0,
      pulau_berpenghuni: parseInt(formData.pulau_berpenghuni) || 0,
      pulau_tidak_berpenghuni: parseInt(formData.pulau_tidak_berpenghuni) || 0,
      desa_pesisir: parseInt(formData.desa_pesisir) || 0,
      luas_kawasan_konservasi_ha: parseFloat(formData.luas_kawasan_konservasi_ha) || 0,
      potensi_perikanan_ton_th: parseFloat(formData.potensi_perikanan_ton_th) || 0,
    });
  };

  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-center outline-none focus:ring-2 focus:ring-primary/50 border-input";
  const labelClass = "block text-sm font-medium mb-2";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden text-card-foreground">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Anchor className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-bold">{initialData ? 'Edit' : 'Input'} Data Potensi Perairan</h2>
        </div>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Identitas */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Identitas Wilayah
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Kabupaten / Kota</label>
              <select name="kabupaten_kota" value={formData.kabupaten_kota} onChange={handleChange} className={inputClass + " pr-10"} required>
                <option value="" disabled>-- Pilih Kab/Kota --</option>
                {KAB_KOTA_JATIM.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tahun Data</label>
              <input type="number" name="tahun_data" value={formData.tahun_data} onChange={handleChange} min="2000" max={CURRENT_YEAR} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Desa Pesisir</label>
              <input type="number" min="0" name="desa_pesisir" value={formData.desa_pesisir} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
          </div>
        </section>

        <div className="h-px bg-border"></div>

        {/* Luas Wilayah */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Luas Wilayah Laut
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Luas Wilayah Laut (km²)</label>
              <input type="number" step="0.01" min="0" name="luas_wilayah_laut_km2" value={formData.luas_wilayah_laut_km2} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Luas Perairan (km²)</label>
              <input type="number" step="0.01" min="0" name="luas_perairan_km2" value={formData.luas_perairan_km2} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
          </div>
        </section>

        <div className="h-px bg-border"></div>

        {/* Garis Pantai */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
            Panjang Garis Pantai per Segmen (km)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            {[
              { name: 'panjang_pantai_utara_km', label: 'Utara' },
              { name: 'panjang_pantai_selatan_km', label: 'Selatan' },
              { name: 'panjang_pantai_timur_km', label: 'Timur' },
              { name: 'panjang_pantai_barat_km', label: 'Barat' },
            ].map(f => (
              <div key={f.name}>
                <label className={labelClass}>{f.label}</label>
                <input type="number" step="0.01" min="0" name={f.name} value={formData[f.name]} onChange={handleChange} className={inputClass} placeholder="0" />
              </div>
            ))}
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center flex flex-col justify-center min-h-[72px]">
              <span className="text-xs font-semibold text-primary/70 uppercase mb-1">Total Garis Pantai</span>
              <span className="font-bold text-primary">{totalPantai.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km</span>
            </div>
          </div>
        </section>

        <div className="h-px bg-border"></div>

        {/* Pulau Kecil */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
            Pulau Kecil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Jumlah Pulau Kecil</label>
              <input type="number" min="0" name="jumlah_pulau_kecil" value={formData.jumlah_pulau_kecil} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Pulau Berpenghuni</label>
              <input type="number" min="0" name="pulau_berpenghuni" value={formData.pulau_berpenghuni} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Pulau Tidak Berpenghuni</label>
              <input type="number" min="0" name="pulau_tidak_berpenghuni" value={formData.pulau_tidak_berpenghuni} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
          </div>
        </section>

        <div className="h-px bg-border"></div>

        {/* Konservasi & Potensi */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
            Konservasi & Potensi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Luas Kawasan Konservasi (Ha)</label>
              <input type="number" step="0.01" min="0" name="luas_kawasan_konservasi_ha" value={formData.luas_kawasan_konservasi_ha} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Potensi Perikanan (Ton/Tahun)</label>
              <input type="number" step="0.01" min="0" name="potensi_perikanan_ton_th" value={formData.potensi_perikanan_ton_th} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Keterangan</label>
            <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input resize-none" placeholder="Catatan tambahan (opsional)" />
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 font-medium rounded-lg hover:bg-muted transition-colors border border-border text-sm">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Data
          </button>
        </div>
      </form>
    </div>
  );
};
