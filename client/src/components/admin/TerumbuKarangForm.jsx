import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Waves, Loader2, Save, X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';

// ── DAFTAR KAB/KOTA JAWA TIMUR ─────────────────────────────────────────────
const KABUPATEN_KOTA_LIST = [
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik',
  'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan',
  'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan',
  'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep',
  'Trenggalek', 'Tuban', 'Tulungagung',
  'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang',
  'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya'
];

// ── HELPER KATEGORI KONDISI TERUMBU KARANG (0-100%) ────────────────────────
const getKondisiTerumbu = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 75) return 'Sangat Baik (75-100%)';
  if (p >= 50) return 'Baik (50-75%)';
  if (p >= 25) return 'Sedang (25-50%)';
  return 'Rusak (0-25%)';
};

const kondisiTerumbuStyle = (kondisi) => {
  const k = kondisi || '';
  if (k.startsWith('Sangat Baik')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (k.startsWith('Baik')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (k.startsWith('Sedang')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
};

const currentYear = new Date().getFullYear();

// ==========================================
// ARROW NAVIGATION HELPERS
// ==========================================
const FORM_NAV_SELECTOR = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), [data-form-nav="true"]';

const isElementVisible = (element) => {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    rect.width > 0 &&
    rect.height > 0
  );
};

const getElementCenter = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    element,
    rect,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

const findDirectionalTarget = (formElement, currentElement, direction) => {
  if (!formElement || !currentElement) return null;
  const current = getElementCenter(currentElement);
  const candidates = Array.from(formElement.querySelectorAll(FORM_NAV_SELECTOR))
    .filter((element) => element !== currentElement && isElementVisible(element))
    .map(getElementCenter);

  const horizontalDirection = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  const directionalCandidates = candidates.filter((candidate) => {
    const primaryDelta = horizontalDirection
      ? candidate.x - current.x
      : candidate.y - current.y;
    return primaryDelta * sign > 4;
  });

  if (!directionalCandidates.length) return null;

  const sameLineTolerance = horizontalDirection
    ? Math.max(current.rect.height * 1.5, 48)
    : Math.max(current.rect.width * 0.6, 110);

  const sameLineCandidates = directionalCandidates.filter((candidate) => {
    const secondaryDelta = horizontalDirection
      ? Math.abs(candidate.y - current.y)
      : Math.abs(candidate.x - current.x);
    return secondaryDelta <= sameLineTolerance;
  });

  const pool = sameLineCandidates.length ? sameLineCandidates : directionalCandidates;

  return pool
    .map((candidate) => {
      const primaryDistance = horizontalDirection
        ? Math.abs(candidate.x - current.x)
        : Math.abs(candidate.y - current.y);
      const secondaryDistance = horizontalDirection
        ? Math.abs(candidate.y - current.y)
        : Math.abs(candidate.x - current.x);
      return { ...candidate, score: primaryDistance + secondaryDistance * 3 };
    })
    .sort((a, b) => a.score - b.score)[0]?.element ?? null;
};
// ==========================================

export function TerumbuKarangForm({ initialData, isLoading, onSubmit, onCancel }) {
  const formRef = useRef(null);

  const handleArrowNavigation = (event) => {
    const directionByKey = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const direction = directionByKey[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    
    const currentElement = event.target.closest?.(FORM_NAV_SELECTOR);
    if (!currentElement || !formRef.current?.contains(currentElement)) return;
    
    const targetElement = findDirectionalTarget(formRef.current, currentElement, direction);
    if (!targetElement) return;
    
    event.preventDefault();
    targetElement.focus({ preventScroll: true });
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    
    if (targetElement instanceof HTMLInputElement && targetElement.type === 'text') {
      requestAnimationFrame(() => targetElement.select());
    }
  };
  const [form, setForm] = useState({
    tahun: currentYear,
    kabupaten_kota: '',
    luas_eksisting_ha: '',
    persentase_tutupan: '',
    persentase_kondisi: '',
    luas_sangat_baik: '',
    luas_baik: '',
    luas_sedang: '',
    luas_rusak: '',
    luas_rehabilitasi_ha: '',
  });
  const [errors, setErrors] = useState({});

  // ── SINKRONISASI DATA EDIT ──
  useEffect(() => {
    if (initialData) {
      setForm({
        tahun: initialData.tahun ?? currentYear,
        kabupaten_kota: initialData.kabupaten_kota ?? '',
        luas_eksisting_ha: initialData.luas_eksisting_ha ?? '',
        persentase_tutupan: initialData.persentase_tutupan ?? '',
        persentase_kondisi: initialData.persentase_kondisi ?? '',
        luas_sangat_baik: initialData.luas_sangat_baik ?? '',
        luas_baik: initialData.luas_baik ?? '',
        luas_sedang: initialData.luas_sedang ?? '',
        luas_rusak: initialData.luas_rusak ?? '',
        luas_rehabilitasi_ha: initialData.luas_rehabilitasi_ha ?? '',
      });
    }
  }, [initialData]);

  // ── KATEGORI OTOMATIS REAL-TIME ──
  const kondisiPreview = useMemo(() => getKondisiTerumbu(form.persentase_kondisi), [form.persentase_kondisi]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── VALIDASI ──
  const validate = () => {
    const err = {};
    if (!form.tahun) err.tahun = 'Tahun wajib diisi';
    if (!form.kabupaten_kota) err.kabupaten_kota = 'Kabupaten/Kota wajib dipilih';
    if (form.luas_eksisting_ha === '' || Number(form.luas_eksisting_ha) < 0) err.luas_eksisting_ha = 'Luas eksisting wajib diisi';
    if (form.persentase_tutupan === '' || Number(form.persentase_tutupan) < 0 || Number(form.persentase_tutupan) > 100) {
      err.persentase_tutupan = 'Persentase tutupan harus di antara 0 - 100';
    }
    if (form.persentase_kondisi === '' || Number(form.persentase_kondisi) < 0 || Number(form.persentase_kondisi) > 100) {
      err.persentase_kondisi = 'Persentase kondisi harus di antara 0 - 100';
    }
    if (form.luas_rehabilitasi_ha === '' || Number(form.luas_rehabilitasi_ha) < 0) err.luas_rehabilitasi_ha = 'Luas rehabilitasi wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ── SUBMIT FORM ──
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      tahun: parseInt(form.tahun, 10),
      kabupaten_kota: form.kabupaten_kota,
      luas_eksisting_ha: parseFloat(form.luas_eksisting_ha) || 0,
      persentase_tutupan: parseFloat(form.persentase_tutupan) || 0,
      persentase_kondisi: parseFloat(form.persentase_kondisi) || 0,
      luas_sangat_baik: parseFloat(form.luas_sangat_baik) || 0,
      luas_baik: parseFloat(form.luas_baik) || 0,
      luas_sedang: parseFloat(form.luas_sedang) || 0,
      luas_rusak: parseFloat(form.luas_rusak) || 0,
      kondisi: getKondisiTerumbu(form.persentase_kondisi), // Kategori langsung disimpan ke DB
      luas_rehabilitasi_ha: parseFloat(form.luas_rehabilitasi_ha) || 0,
    };
    onSubmit(payload);
  };

  const inputCls = (field) =>
    `w-full bg-background border ${errors[field] ? 'border-destructive hover:border-destructive' : 'border-border hover:border-border'} rounded-xl px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`;

  return (
    <form ref={formRef} onKeyDown={handleArrowNavigation} onSubmit={handleSubmit} className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Waves className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {initialData ? 'Edit Data Terumbu Karang' : 'Tambah Data Terumbu Karang'}
            </h2>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── GRID INPUT UTAMA ── */}
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
          <div
            data-form-nav="true"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.firstElementChild?.firstElementChild?.click();
              }
            }}
            className="outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
          >
            <SearchableSelect
              name="kabupaten_kota"
              value={form.kabupaten_kota}
              onChange={(e) => handleChange('kabupaten_kota', e.target.value)}
              className={inputCls('kabupaten_kota')}
              options={KABUPATEN_KOTA_LIST}
              placeholder="-- Pilih Kab/Kota --"
            />
          </div>
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

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Persentase Tutupan (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.persentase_tutupan}
            onChange={(e) => handleChange('persentase_tutupan', e.target.value)}
            className={inputCls('persentase_tutupan')}
            placeholder="0.00"
          />
          {errors.persentase_tutupan && <p className="text-xs text-destructive mt-1">{errors.persentase_tutupan}</p>}
        </div>

        {/* Kotak Kondisi */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Persentase Kondisi (%)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={form.persentase_kondisi === '' ? 0 : form.persentase_kondisi}
              onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
              className="flex-1 accent-cyan-500"
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.persentase_kondisi}
              onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
              className={`${inputCls('persentase_kondisi')} w-20`}
              placeholder="0-100"
            />
            <span className="text-sm text-muted-foreground font-bold">%</span>
            <span className={`px-4 py-2.5 rounded-xl text-xs font-bold border shrink-0 ${kondisiTerumbuStyle(kondisiPreview)}`}>
              {kondisiPreview}
            </span>
          </div>
          {errors.persentase_kondisi && <p className="text-xs text-destructive mt-1">{errors.persentase_kondisi}</p>}
        </div>
      </div>

      {/* Kategori Lahan */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 mt-4">
        <h3 className="text-sm font-bold text-foreground mb-4">Luas Lahan per Kategori</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sangat Baik</label>
            <input
              type="number" step="0.01" min="0"
              value={form.luas_sangat_baik}
              onChange={(e) => handleChange('luas_sangat_baik', e.target.value)}
              className={inputCls('luas_sangat_baik')}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Baik</label>
            <input
              type="number" step="0.01" min="0"
              value={form.luas_baik}
              onChange={(e) => handleChange('luas_baik', e.target.value)}
              className={inputCls('luas_baik')}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sedang</label>
            <input
              type="number" step="0.01" min="0"
              value={form.luas_sedang}
              onChange={(e) => handleChange('luas_sedang', e.target.value)}
              className={inputCls('luas_sedang')}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Rusak</label>
            <input
              type="number" step="0.01" min="0"
              value={form.luas_rusak}
              onChange={(e) => handleChange('luas_rusak', e.target.value)}
              className={inputCls('luas_rusak')}
              placeholder="0.00"
            />
          </div>
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
