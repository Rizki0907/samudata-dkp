import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TreePine, Loader2, Save, X } from 'lucide-react';
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

// ==========================================
// ARROW NAVIGATION HELPERS
// ==========================================
const FORM_NAV_SELECTOR = 'input:not([type="hidden"]):not([type="range"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), [data-form-nav="true"]';

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

export function MangroveForm({ initialData, isLoading, onSubmit, onCancel }) {
  const formRef = useRef(null);

  const handleArrowNavigation = (event) => {
    if (event.key === 'Enter') {
      const tag = event.target.tagName;
      if (tag !== 'TEXTAREA' && tag !== 'BUTTON') {
        event.preventDefault();
      }
      return;
    }
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
    tahun: '',
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
    if (!form.kabupaten_kota) err.kabupaten_kota = 'Kab/Kota wajib dipilih';
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
    `w-full max-w-full bg-background border ${errors[field] ? 'border-destructive hover:border-destructive' : 'border-border hover:border-border'} rounded-xl px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`;

  // Class tambahan untuk menghilangkan spin button (panah atas/bawah) pada input number,
  // dipakai di semua input number KECUALI "Tahun"
  const noSpinnerCls = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  // Persen untuk warna track slider (fill hijau vs sisa abu-abu), full custom biar konsisten
  // di semua browser & tidak ikut warna default gelap saat light mode
  const persentaseValue = form.persentase_kondisi === '' ? 0 : Math.min(100, Math.max(0, Number(form.persentase_kondisi) || 0));
  const rangeTrackStyle = {
    background: `linear-gradient(to right, #10b981 0%, #10b981 ${persentaseValue}%, #e2e8f0 ${persentaseValue}%, #e2e8f0 100%)`,
  };
  const rangeSliderCls =
    'appearance-none w-full h-2 rounded-full cursor-pointer outline-none ' +
    '[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent ' +
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer ' +
    '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent ' +
    '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:cursor-pointer';

  return (
    <form ref={formRef} onKeyDown={handleArrowNavigation} onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {initialData ? 'Edit Data Mangrove' : 'Tambah Data Mangrove'}
            </h2>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Data Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
          <input
            onWheel={(e) => e.target.blur()}
            type="number"
            value={form.tahun}
            onChange={(e) => handleChange('tahun', e.target.value)}
            className={inputCls('tahun')}
            placeholder="YYYY"
          />
          {errors.tahun && <p className="text-xs text-destructive mt-1">{errors.tahun}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
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
            onWheel={(e) => e.target.blur()}
            type="number"
            step="0.01"
            min="0"
            value={form.luas_eksisting_ha}
            onChange={(e) => handleChange('luas_eksisting_ha', e.target.value)}
            className={`${inputCls('luas_eksisting_ha')} ${noSpinnerCls}`}
            placeholder="0.00"
          />
          {errors.luas_eksisting_ha && <p className="text-xs text-destructive mt-1">{errors.luas_eksisting_ha}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Luas Rehabilitasi (Ha)</label>
          <input
            onWheel={(e) => e.target.blur()}
            type="number"
            step="0.01"
            min="0"
            value={form.luas_rehabilitasi_ha}
            onChange={(e) => handleChange('luas_rehabilitasi_ha', e.target.value)}
            className={`${inputCls('luas_rehabilitasi_ha')} ${noSpinnerCls}`}
            placeholder="0.00"
          />
          {errors.luas_rehabilitasi_ha && <p className="text-xs text-destructive mt-1">{errors.luas_rehabilitasi_ha}</p>}
        </div>

        <div className="md:col-span-1">
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

        {/* Kondisi Mangrove */}
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Persentase Kondisi Mangrove (%)</label>
          <div className="flex flex-col gap-2 w-full max-w-full">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={persentaseValue}
                  onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
                  style={rangeTrackStyle}
                  className={rangeSliderCls}
                />
              </div>
              <input
                onWheel={(e) => e.target.blur()}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.persentase_kondisi}
                onChange={(e) => handleChange('persentase_kondisi', e.target.value)}
                className={`${inputCls('persentase_kondisi')} ${noSpinnerCls} !w-20 px-2 text-center shrink-0`}
                placeholder="0.00"
              />
              <span className="text-sm text-muted-foreground font-bold">%</span>
            </div>
            <div className="flex justify-start">
              <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border shrink-0 ${kondisiStyle(kondisiPreview)}`}>
                {kondisiPreview}
              </span>
            </div>
          </div>
          {errors.persentase_kondisi && <p className="text-xs text-destructive mt-1">{errors.persentase_kondisi}</p>}
        </div>
      </div>

      {/* Kategori Lahan */}
      <div className="bg-muted/30 border border-border rounded-xl p-4 mt-4">
        <h3 className="text-sm font-bold text-foreground mb-4">Luas Lahan per Kategori</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sangat Padat</label>
            <input
              onWheel={(e) => e.target.blur()}
              type="number" step="0.01" min="0"
              value={form.luas_sangat_padat}
              onChange={(e) => handleChange('luas_sangat_padat', e.target.value)}
              className={`${inputCls('luas_sangat_padat')} ${noSpinnerCls}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sedang</label>
            <input
              onWheel={(e) => e.target.blur()}
              type="number" step="0.01" min="0"
              value={form.luas_sedang}
              onChange={(e) => handleChange('luas_sedang', e.target.value)}
              className={`${inputCls('luas_sedang')} ${noSpinnerCls}`}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jarang</label>
            <input
              onWheel={(e) => e.target.blur()}
              type="number" step="0.01" min="0"
              value={form.luas_jarang}
              onChange={(e) => handleChange('luas_jarang', e.target.value)}
              className={`${inputCls('luas_jarang')} ${noSpinnerCls}`}
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