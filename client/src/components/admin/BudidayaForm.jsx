import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const KABUPATEN_KOTA_OPTIONS = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 
  'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan', 
  'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan', 
  'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 
  'Trenggalek', 'Tuban', 'Tulungagung',
  'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang', 
  'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya'
];

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

const JENIS_WADAH_OPTIONS = [
  'Laut/KJA Laut',
  'Tambak',
  'Kolam',
  'Mina Padi',
  'Karamba',
  'Japung/KJA Tawar'
];

export default function BudidayaForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    kabupaten_kota: '',
    tahun: '',
    bulan: '',
    jenis_wadah: 'Tambak',
    produksi_ton: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        kabupaten_kota: initialData.kabupaten_kota || '',
        tahun: initialData.tahun || '',
        bulan: initialData.bulan || '',
        jenis_wadah: initialData.jenis_wadah || 'Tambak',
        produksi_ton: initialData.produksi_ton || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.kabupaten_kota) newErrors.kabupaten_kota = 'Kabupaten/Kota wajib diisi';
    if (!formData.tahun) newErrors.tahun = 'Tahun wajib diisi';
    if (!formData.bulan) newErrors.bulan = 'Bulan wajib diisi';
    if (!formData.jenis_wadah) newErrors.jenis_wadah = 'Jenis Wadah wajib diisi';
    
    if (!formData.produksi_ton) {
      newErrors.produksi_ton = 'Produksi wajib diisi';
    } else if (isNaN(formData.produksi_ton) || parseFloat(formData.produksi_ton) < 0) {
      newErrors.produksi_ton = 'Produksi harus berupa angka valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {initialData ? 'Edit Data Budidaya' : 'Input Data Budidaya'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Isi formulir data produksi perikanan budidaya per Kabupaten/Kota.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Informasi Wilayah & Waktu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Kabupaten/Kota</label>
              <select 
                name="kabupaten_kota" 
                value={formData.kabupaten_kota} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.kabupaten_kota ? "border-destructive" : "border-input")}
              >
                <option value="">Pilih Kabupaten/Kota</option>
                {KABUPATEN_KOTA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {errors.kabupaten_kota && <p className="text-xs text-destructive mt-1">{errors.kabupaten_kota}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bulan</label>
              <select 
                name="bulan" 
                value={formData.bulan} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.bulan ? "border-destructive" : "border-input")}
              >
                <option value="">Pilih Bulan</option>
                {BULAN_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.bulan && <p className="text-xs text-destructive mt-1">{errors.bulan}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tahun</label>
              <select 
                name="tahun" 
                value={formData.tahun} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.tahun ? "border-destructive" : "border-input")}
              >
                <option value="">Pilih Tahun</option>
                {TAHUN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.tahun && <p className="text-xs text-destructive mt-1">{errors.tahun}</p>}
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Detail Produksi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div>
              <label className="block text-sm font-medium mb-2">Jenis Wadah</label>
              <select 
                name="jenis_wadah" 
                value={formData.jenis_wadah} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.jenis_wadah ? "border-destructive" : "border-input")}
              >
                {JENIS_WADAH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {errors.jenis_wadah && <p className="text-xs text-destructive mt-1">{errors.jenis_wadah}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Produksi (Ton)</label>
              <input 
                type="number" 
                step="0.01"
                name="produksi_ton" 
                value={formData.produksi_ton} 
                onChange={handleChange}
                placeholder="Misal: 15.5"
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.produksi_ton ? "border-destructive" : "border-input")}
              />
              {errors.produksi_ton && <p className="text-xs text-destructive mt-1">{errors.produksi_ton}</p>}
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
}
