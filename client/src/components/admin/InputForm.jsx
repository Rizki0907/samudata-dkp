import { useState, useEffect } from 'react';
import { GT_KAPAL_OPTIONS, ALAT_TANGKAP_OPTIONS, KOMODITAS_OPTIONS, PELABUHAN_OPTIONS } from '@/utils/constants';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InputForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    tanggal: '',
    jam_labuh: '',
    jam_bongkar: '',
    nama_kapal: '',
    pelabuhan: PELABUHAN_OPTIONS[0],
    gt_kapal: GT_KAPAL_OPTIONS[0],
    alat_tangkap: ALAT_TANGKAP_OPTIONS[0],
    komoditas: KOMODITAS_OPTIONS[0],
    volume: '',
    harga: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggal: initialData.tanggal ? initialData.tanggal.split('T')[0] : '',
        jam_labuh: initialData.jam_labuh || '',
        jam_bongkar: initialData.jam_bongkar || '',
        nama_kapal: initialData.nama_kapal || '',
        pelabuhan: initialData.pelabuhan || PELABUHAN_OPTIONS[0],
        gt_kapal: initialData.gt_kapal || GT_KAPAL_OPTIONS[0],
        alat_tangkap: initialData.alat_tangkap || ALAT_TANGKAP_OPTIONS[0],
        komoditas: initialData.komoditas || KOMODITAS_OPTIONS[0],
        volume: initialData.volume || '',
        harga: initialData.harga || ''
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
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    if (!formData.jam_labuh) newErrors.jam_labuh = 'Jam labuh wajib diisi';
    if (!formData.jam_bongkar) newErrors.jam_bongkar = 'Jam bongkar wajib diisi';
    if (!formData.nama_kapal) newErrors.nama_kapal = 'Nama kapal wajib diisi';
    if (!formData.volume || isNaN(formData.volume)) newErrors.volume = 'Volume tidak valid';
    if (!formData.harga || isNaN(formData.harga)) newErrors.harga = 'Harga tidak valid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const volumeVal = parseFloat(formData.volume) || 0;
  const hargaVal = parseFloat(formData.harga) || 0;
  const nilaiTotal = volumeVal * hargaVal;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {initialData ? 'Edit Data Tangkapan' : 'Input Data Tangkapan Baru'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Isi formulir pendaratan ikan harian di pelabuhan secara lengkap.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1 */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Informasi Waktu & Lokasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Pendaratan</label>
              <input 
                type="date" 
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.tanggal ? "border-destructive" : "border-input")}
              />
              {errors.tanggal && <p className="text-xs text-destructive mt-1">{errors.tanggal}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pelabuhan Pendaratan</label>
              <select 
                name="pelabuhan"
                value={formData.pelabuhan}
                onChange={handleChange}
                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Jam Labuh</label>
              <input 
                type="time" 
                name="jam_labuh"
                value={formData.jam_labuh}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.jam_labuh ? "border-destructive" : "border-input")}
              />
              {errors.jam_labuh && <p className="text-xs text-destructive mt-1">{errors.jam_labuh}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Jam Bongkar</label>
              <input 
                type="time" 
                name="jam_bongkar"
                value={formData.jam_bongkar}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.jam_bongkar ? "border-destructive" : "border-input")}
              />
              {errors.jam_bongkar && <p className="text-xs text-destructive mt-1">{errors.jam_bongkar}</p>}
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* SECTION 2 */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Informasi Kapal & Alat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Nama Kapal</label>
              <input 
                type="text" 
                name="nama_kapal"
                placeholder="Cth: KM Berkah Laut"
                value={formData.nama_kapal}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.nama_kapal ? "border-destructive" : "border-input")}
              />
              {errors.nama_kapal && <p className="text-xs text-destructive mt-1">{errors.nama_kapal}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">GT Kapal</label>
              <select 
                name="gt_kapal"
                value={formData.gt_kapal}
                onChange={handleChange}
                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                {GT_KAPAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Alat Tangkap</label>
              <select 
                name="alat_tangkap"
                value={formData.alat_tangkap}
                onChange={handleChange}
                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                {ALAT_TANGKAP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* SECTION 3 */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
            Detail Tangkapan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Komoditas</label>
              <select 
                name="komoditas"
                value={formData.komoditas}
                onChange={handleChange}
                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                {KOMODITAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Volume (Kg)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                name="volume"
                placeholder="Misal: 105.5"
                value={formData.volume}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.volume ? "border-destructive" : "border-input")}
              />
              {errors.volume && <p className="text-xs text-destructive mt-1">{errors.volume}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Harga (Rp / Kg)</label>
              <input 
                type="number" 
                min="0"
                name="harga"
                placeholder="Cth: 15000"
                value={formData.harga}
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.harga ? "border-destructive" : "border-input")}
              />
              {errors.harga && <p className="text-xs text-destructive mt-1">{errors.harga}</p>}
            </div>
          </div>
        </section>

        {/* Actions & Summary */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 min-w-[250px]">
            <p className="text-xs text-muted-foreground font-medium mb-1">Estimasi Total Nilai (Otomatis)</p>
            <p className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nilaiTotal)}
            </p>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
