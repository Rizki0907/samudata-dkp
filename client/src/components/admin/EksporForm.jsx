import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TAHUN_OPTIONS = ['2024', '2025', '2026'];

const KOMODITAS_SEGAR_OLAHAN = [
  'Ikan Lainnya', 'Udang', 'Rumput Laut', 'Ikan Tuna', 'Ikan Sardine', 'Value Added', 
  'Pakan Ikan', 'Cumi-Cumi', 'Lain-Lain', 'Ikan Kakap', 'Ikan Mackerel', 'Kepiting/Rajungan', 
  'Ikan Bandeng Umpan', 'Ikan Kerapu', 'Minyak Ikan', 'Ikan Bandeng', 'Ikan Lele', 'Bekicot', 
  'Ikan Salmon', 'Kerang-Kerangan', 'Teri', 'Paha Katak', 'Tepung Ikan', 'Ikan Nila', 
  'Ikan Gurame', 'Ikan Patin', 'Tanaman Hias'
];

const KOMODITAS_HIDUP = [
  'Ikan Lainnya', 'Kepiting/Rajungan', 'Ikan Hias', 'Ikan Kerapu', 'Kerang-Kerangan', 
  'Koral', 'Udang', 'Benih Ikan/Udang', 'Ikan Bandeng', 'Ikan Kakap', 'Bekicot', 
  'Lain-Lain', 'Alga', 'Tanaman Hias', 'Value Added'
];

const NEGARA_OPTIONS = [
  'China', 'USA', 'Japan', 'Thailand', 'Vietnam', 'Malaysia', 'Singapore', 'Korea (South)', 
  'Bangladesh', 'Hong Kong', 'Senegal', 'Canada', 'Netherlands', 'Australia', 'Cameroon', 
  'Chile', 'France', 'Egypt', 'Taiwan', 'United Kingdom', 'Tanzania', 'Italy', 'Ghana', 
  'Mauritania', 'Congo', 'Sierra Leone', 'India', 'Benin', 'Congo DR', 'Syria', 'Togo', 
  'Greece', 'Puerto Rico', 'Gabon', 'Spain', 'Venezuela', 'Liberia', 'Kenya', 'Albania', 
  'Belgium', 'Germany', 'UAE', 'Equatorial Guinea', 'Gambia'
];

export function EksporForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    bulan: '',
    tahun: '',
    tanggal_ekspor: '',
    nama_eksportir: '',
    kategori_komoditas: 'Segar dan Olahan',
    nama_komoditas: '',
    volume: '',
    satuan_volume: 'KG', // default for Segar dan Olahan
    mata_uang: 'USD',
    nilai: '',
    negara_tujuan: '',
    negara_lainnya: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // Check if negara_tujuan is in the predefined list
      const isNegaraPredefined = NEGARA_OPTIONS.includes(initialData.negara_tujuan);
      
      setFormData({
        bulan: initialData.bulan || '',
        tahun: initialData.tahun || '',
        tanggal_ekspor: initialData.tanggal_ekspor ? new Date(initialData.tanggal_ekspor).toISOString().split('T')[0] : '',
        nama_eksportir: initialData.nama_eksportir || '',
        kategori_komoditas: initialData.kategori_komoditas || 'Segar dan Olahan',
        nama_komoditas: initialData.nama_komoditas || '',
        volume: initialData.volume || '',
        satuan_volume: initialData.satuan_volume || 'KG',
        mata_uang: initialData.mata_uang || 'USD',
        nilai: initialData.nilai || '',
        negara_tujuan: isNegaraPredefined ? initialData.negara_tujuan : 'Lainnya',
        negara_lainnya: !isNegaraPredefined ? initialData.negara_tujuan : ''
      });
    }
  }, [initialData]);

  // Handle kategori komoditas change logic
  useEffect(() => {
    // Determine possible units based on category
    if (formData.kategori_komoditas === 'Segar dan Olahan') {
      if (!['KG', 'Liter'].includes(formData.satuan_volume)) {
        setFormData(prev => ({ ...prev, satuan_volume: 'KG', nama_komoditas: '' }));
      }
    } else {
      if (!['Ekor', 'PCS', 'Batang'].includes(formData.satuan_volume)) {
        setFormData(prev => ({ ...prev, satuan_volume: 'Ekor', nama_komoditas: '' }));
      }
    }
  }, [formData.kategori_komoditas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.bulan) newErrors.bulan = 'Bulan wajib diisi';
    if (!formData.tahun) newErrors.tahun = 'Tahun wajib diisi';
    if (!formData.tanggal_ekspor) newErrors.tanggal_ekspor = 'Tanggal wajib diisi';
    if (!formData.nama_eksportir) newErrors.nama_eksportir = 'Nama Eksportir wajib diisi';
    if (!formData.nama_komoditas) newErrors.nama_komoditas = 'Komoditas wajib diisi';
    
    if (!formData.volume) {
      newErrors.volume = 'Volume wajib diisi';
    } else if (isNaN(formData.volume)) {
      newErrors.volume = 'Volume harus berupa angka';
    }

    if (!formData.nilai) {
      newErrors.nilai = 'Nilai wajib diisi';
    } else if (isNaN(formData.nilai)) {
      newErrors.nilai = 'Nilai harus berupa angka';
    }

    if (!formData.negara_tujuan) {
      newErrors.negara_tujuan = 'Negara Tujuan wajib diisi';
    } else if (formData.negara_tujuan === 'Lainnya' && !formData.negara_lainnya) {
      newErrors.negara_lainnya = 'Sebutkan negara lainnya';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const finalData = {
        ...formData,
        negara_tujuan: formData.negara_tujuan === 'Lainnya' ? formData.negara_lainnya : formData.negara_tujuan
      };
      delete finalData.negara_lainnya;
      onSubmit(finalData);
    }
  };

  const currentKomoditasList = formData.kategori_komoditas === 'Segar dan Olahan' 
    ? KOMODITAS_SEGAR_OLAHAN 
    : KOMODITAS_HIDUP;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">
          {initialData ? 'Edit Laporan Ekspor' : 'Input Laporan Ekspor'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Isi formulir laporan ekspor hasil kelautan dan perikanan.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bagian 1: Identitas Transaksi */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Identitas Transaksi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
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

            <div>
              <label className="block text-sm font-medium mb-2">Tanggal Ekspor</label>
              <input 
                type="date" 
                name="tanggal_ekspor" 
                value={formData.tanggal_ekspor} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.tanggal_ekspor ? "border-destructive" : "border-input")}
              />
              {errors.tanggal_ekspor && <p className="text-xs text-destructive mt-1">{errors.tanggal_ekspor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nama Eksportir</label>
              <input 
                type="text" 
                name="nama_eksportir" 
                value={formData.nama_eksportir} 
                onChange={handleChange}
                placeholder="Masukkan nama eksportir"
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.nama_eksportir ? "border-destructive" : "border-input")}
              />
              {errors.nama_eksportir && <p className="text-xs text-destructive mt-1">{errors.nama_eksportir}</p>}
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* Bagian 2: Komoditas */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
            Komoditas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Kategori Komoditas</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="kategori_komoditas" 
                    value="Segar dan Olahan"
                    checked={formData.kategori_komoditas === 'Segar dan Olahan'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Segar dan Olahan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="kategori_komoditas" 
                    value="Hidup"
                    checked={formData.kategori_komoditas === 'Hidup'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Hidup</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nama Komoditas</label>
              <select 
                name="nama_komoditas" 
                value={formData.nama_komoditas} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.nama_komoditas ? "border-destructive" : "border-input")}
              >
                <option value="">Pilih Komoditas</option>
                {currentKomoditasList.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              {errors.nama_komoditas && <p className="text-xs text-destructive mt-1">{errors.nama_komoditas}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Volume</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input 
                    type="text" 
                    name="volume" 
                    value={formData.volume} 
                    onChange={handleChange}
                    placeholder="Misal: 1500.5"
                    className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.volume ? "border-destructive" : "border-input")}
                  />
                  {errors.volume && <p className="text-xs text-destructive mt-1">{errors.volume}</p>}
                </div>
                <div className="w-32">
                  <select 
                    name="satuan_volume" 
                    value={formData.satuan_volume} 
                    onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-muted px-3 py-2 outline-none"
                  >
                    {formData.kategori_komoditas === 'Segar dan Olahan' ? (
                      <>
                        <option value="KG">KG</option>
                        <option value="Liter">Liter</option>
                      </>
                    ) : (
                      <>
                        <option value="Ekor">Ekor</option>
                        <option value="PCS">PCS</option>
                        <option value="Batang">Batang</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nilai</label>
              <div className="flex gap-2">
                <div className="w-28">
                  <select 
                    name="mata_uang" 
                    value={formData.mata_uang} 
                    onChange={handleChange}
                    className="w-full rounded-lg border border-input bg-muted px-3 py-2 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {formData.mata_uang === 'USD' ? '$' : 'Rp'}
                  </span>
                  <input 
                    type="text" 
                    name="nilai" 
                    value={formData.nilai} 
                    onChange={handleChange}
                    placeholder="Misal: 45000.50"
                    className={cn("w-full rounded-lg border bg-background pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.nilai ? "border-destructive" : "border-input")}
                  />
                </div>
              </div>
              {errors.nilai && <p className="text-xs text-destructive mt-1">{errors.nilai}</p>}
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* Bagian 3: Negara Tujuan */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
            Negara Tujuan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div>
              <label className="block text-sm font-medium mb-2">Negara Tujuan</label>
              <select 
                name="negara_tujuan" 
                value={formData.negara_tujuan} 
                onChange={handleChange}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.negara_tujuan ? "border-destructive" : "border-input")}
              >
                <option value="">Pilih Negara Tujuan</option>
                {NEGARA_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="Lainnya">Lainnya</option>
              </select>
              {errors.negara_tujuan && <p className="text-xs text-destructive mt-1">{errors.negara_tujuan}</p>}
            </div>

            {formData.negara_tujuan === 'Lainnya' && (
              <div>
                <label className="block text-sm font-medium mb-2">Sebutkan Negara Lainnya</label>
                <input 
                  type="text" 
                  name="negara_lainnya" 
                  value={formData.negara_lainnya} 
                  onChange={handleChange}
                  placeholder="Ketik nama negara"
                  className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.negara_lainnya ? "border-destructive" : "border-input")}
                />
                {errors.negara_lainnya && <p className="text-xs text-destructive mt-1">{errors.negara_lainnya}</p>}
              </div>
            )}
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
