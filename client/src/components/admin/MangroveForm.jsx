import React, { useState, useEffect, useMemo } from 'react';
import { TreePine, Loader2, Save, X } from 'lucide-react';

// ── DAFTAR KAB/KOTA JAWA TIMUR ─────────────────────────────────────────────
const KABUPATEN_KOTA_LIST = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember',
  'Jombang', 'Kediri', 'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 
  'Kota Malang', 'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya',
  'Lamongan', 'Lumajang', 'Madiun', 'Magetan', 'Malang', 'Mojokerto', 'Nganjuk', 
  'Ngawi', 'PT. Garam', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 'Probolinggo', 
  'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung',
];

// ── HELPER KATEGORI KONDISI (0-100%) ───────────────────────────────────────
const getKondisiMangrove = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 70) return 'Sangat Padat (70-100%)';
  if (p >= 30) return 'Sedang (30-70%)';
  return 'Jarang (0-30%)';
};

const kondisiStyle = (kondisi) => {
  if (kondisi.startsWith('Sangat Padat')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (kondisi.startsWith('Sedang')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
};

const currentYear = new Date().getFullYear();

export function MangroveForm({ initialData, isLoading, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    tahun: currentYear,
    kabupaten_kota: '',
    luas_eksisting_ha: '',
    spesies: '',
    persentase_kondisi: '',
    luas_rehabilitasi_ha: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        tahun: initialData.tahun ?? currentYear,
        kabupaten_kota: initialData.kabupaten_kota ?? '',
        luas_eksisting_ha: initialData.luas_eksisting_ha ?? '',
        spesies: initialData.spesies ?? '',
        persentase_kondisi: initialData.persentase_kondisi ?? '',
        luas_rehabilitasi_ha: initialData.luas_rehabilitasi_ha ?? '',
      });
    }
  }, [initialData]);

  const kondisiPreview = useMemo(() => getKondisiMangrove(form.persentase_kondisi), [form.persentase_kondisi]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.tahun) err.tahun = 'Tahun wajib diisi';
    if (!form.kabupaten_kota) err.kabupaten_kota = 'Kabupaten/Kota wajib dipilih';
    if (form.luas_eksisting_ha === '' || Number(form.luas_eksisting_ha) < 0) err.luas_eksisting_ha = 'Luas eksisting wajib diisi';
    if (!form.spesies.trim()) err.spesies = 'Spesies wajib diisi';
    if (form.persentase_kondisi === '' || Number(form.persentase_kondisi) < 0 || Number(form.persentase_kondisi) > 100) {
      err.persentase_kondisi = 'Persentase kondisi harus di antara 0 - 100';
    }
    if (form.luas_rehabilitasi_ha === '' || Number(form.luas_rehabilitasi_ha) < 0) err.luas_rehabilitasi_ha = 'Luas rehabilitasi wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      tahun: parseInt(form.tahun, 10),
      kabupaten_kota: form.kabupaten_kota,
      luas_eksisting_ha: parseFloat(form.luas_eksisting_ha) || 0,
      spesies: form.spesies.trim(),
      persentase_kondisi: parseFloat(form.persentase_kondisi) || 0,
      kondisi: getKondisiMangrove(form.persentase_kondisi),
      luas_rehabilitasi_ha: parseFloat(form.luas_rehabilitasi_ha) || 0,
    };
    onSubmit(payload);
  };

  const inputCls = (field) =>
    `w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
      errors[field] ? 'border-destructive' : 'border-border'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <TreePine className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {initialData ? 'Edit Data Mangrove' : 'Tambah Data Mangrove'}
          </h2>
          <p className="text-sm text-muted-foreground">Isi data kondisi dan rehabilitasi mangrove sesuai standar DKP.</p>
        </div>
      </div>

      {/* Data Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
          <input
            type="number"
            value={form.tahun}
            onChange={(e) => handleChange('tahun', e.target.value)}
            className={inputCls('tahun')}
            placeholder="Contoh: 2026"
          />
          {errors.tahun && <p className="text-xs text-destructive mt-1">{errors.tahun}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kabupaten/Kota</label>
          <select
            value={form.kabupaten_kota}
            onChange={(e) => handleChange('kabupaten_kota', e.target.value)}
            className={inputCls('kabupaten_kota')}
          >
            <option value="">Pilih Kabupaten/Kota</option>
            {KABUPATEN_KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {errors.kabupaten_kota && <p className="text-xs text-destructive mt-1">{errors.kabupaten_kota}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Luas Eksisting (Ha)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.luas_eksisting_ha}
            onChange={(e) => handleChange('luas_eksisting_ha', e.target.value)}
            className={inputCls('luas_eksisting_ha')}
            placeholder="0.00"
          />
          {errors.luas_eksisting_ha && <p className="text-xs text-destructive mt-1">{errors.luas_eksisting_ha}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Luas Rehabilitasi (Ha)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.luas_rehabilitasi_ha}
            onChange={(e) => handleChange('luas_rehabilitasi_ha', e.target.value)}
            className={inputCls('luas_rehabilitasi_ha')}
            placeholder="0.00"
          />
          {errors.luas_rehabilitasi_ha && <p className="text-xs text-destructive mt-1">{errors.luas_rehabilitasi_ha}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Spesies</label>
          <textarea
            value={form.spesies}
            onChange={(e) => handleChange('spesies', e.target.value)}
            className={`${inputCls('spesies')} resize-none`}
            rows={3}
            placeholder="Tulis manual spesies mangrove yang ditemukan, contoh: Rhizophora mucronata, Avicennia marina, Sonneratia alba"
          />
          {errors.spesies && <p className="text-xs text-destructive mt-1">{errors.spesies}</p>}
        </div>
      </div>

      {/* Kondisi Mangrove */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
        <label className="block text-xs font-medium text-muted-foreground">Persentase Kondisi Tutupan Mangrove</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={form.persentase_kondisi === '' ? 0 : form.persentase_kondisi}
            onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
            className="flex-1 accent-emerald-500"
          />
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.persentase_kondisi}
            onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
            className={`${inputCls('persentase_kondisi')} w-24`}
            placeholder="0-100"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        {errors.persentase_kondisi && <p className="text-xs text-destructive">{errors.persentase_kondisi}</p>}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Kategori otomatis:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${kondisiStyle(kondisiPreview)}`}>
            {kondisiPreview}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Jarang (0-30%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Sedang (30-70%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Sangat Padat (70-100%)</span>
        </div>
      </div>

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
  );
}
