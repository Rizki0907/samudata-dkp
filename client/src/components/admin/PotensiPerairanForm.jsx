import React, { useState } from 'react';
import { Save, Loader2, Anchor, X } from 'lucide-react';

const KAB_KOTA_JATIM = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik',
  'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan',
  'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan',
  'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep',
  'Trenggalek', 'Tuban', 'Tulungagung',
  'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang',
  'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya', 'PT.Garam'
];

const CURRENT_YEAR = new Date().getFullYear();

export const PotensiPerairanForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState(initialData || {
    kabupaten_kota: 'Jawa Timur',
    tahun_data: CURRENT_YEAR,
    luas_wilayah_laut_km2: '',
    total_panjang_garis_pantai_km: '',
    luas_perairan_km2: '',
    jumlah_pulau_kecil: '',
    desa_pesisir: '',
    keterangan: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tahun_data: parseInt(formData.tahun_data),
      luas_wilayah_laut_km2: parseFloat(formData.luas_wilayah_laut_km2) || 0,
      total_panjang_garis_pantai_km: parseFloat(formData.total_panjang_garis_pantai_km) || 0,
      luas_perairan_km2: parseFloat(formData.luas_perairan_km2) || 0,
      jumlah_pulau_kecil: parseInt(formData.jumlah_pulau_kecil) || 0,
      desa_pesisir: parseInt(formData.desa_pesisir) || 0,
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
          <h2 className="text-lg font-bold">{initialData ? 'Edit' : 'Tambah'} Data Potensi Perairan</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
            <div>
              <label className={labelClass}>Tahun Data</label>
              <input type="number" name="tahun_data" value={formData.tahun_data} onChange={handleChange} min="2000" max={CURRENT_YEAR} className={inputClass} required />
            </div>
          </div>
        </section>

        <div className="h-px bg-border"></div>

        {/* Data Potensi Perairan */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Data Potensi Perairan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Desa Pesisir</label>
              <input type="number" min="0" name="desa_pesisir" value={formData.desa_pesisir} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Luas Wilayah Laut (km²)</label>
              <input type="number" step="0.01" min="0" name="luas_wilayah_laut_km2" value={formData.luas_wilayah_laut_km2} onChange={handleChange} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Pulau-pulau Kecil</label>
              <input type="number" name="jumlah_pulau_kecil" value={formData.jumlah_pulau_kecil} onChange={handleChange} min="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Panjang Garis Pantai (Km)</label>
              <input type="number" step="0.01" name="total_panjang_garis_pantai_km" value={formData.total_panjang_garis_pantai_km} onChange={handleChange} min="0" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Keterangan Tambahan</label>
              <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows="2" className={`${inputClass} text-left resize-none`} placeholder="Opsional..."></textarea>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  );
};
