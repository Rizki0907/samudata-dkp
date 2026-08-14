import { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { Save, Loader2, Anchor, X } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
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
      return { ...candidate, score: primaryDistance * 5 + secondaryDistance };
    })
    .sort((a, b) => a.score - b.score)[0]?.element ?? null;
};
// ==========================================

/**
 * Komponen PotensiPerairanForm
 * Bertugas untuk menampilkan form input/edit data potensi wilayah pesisir dan laut.
 * Berbeda dengan yang lain, data ini bersifat tahunan per kabupaten/kota.
 */
export const PotensiPerairanForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
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
  const [formData, setFormData] = useState(initialData || {
    tahun_data: '',
    luas_wilayah_laut_km2: '',
    total_panjang_garis_pantai_km: '',
    jumlah_pulau_kecil: '',
    desa_pesisir: '',
    keterangan: '',
  });

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validasi dan kirim data
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tahun_data: parseInt(formData.tahun_data),
      luas_wilayah_laut_km2: parseFloat(formData.luas_wilayah_laut_km2) || 0,
      total_panjang_garis_pantai_km: parseFloat(formData.total_panjang_garis_pantai_km) || 0,
      jumlah_pulau_kecil: parseInt(formData.jumlah_pulau_kecil) || 0,
      desa_pesisir: parseInt(formData.desa_pesisir) || 0,
    });
  };

  const inputClass = "w-full max-w-full rounded-lg border bg-background px-3 py-2 text-center outline-none focus:ring-2 focus:ring-primary/50 border-input";
  const labelClass = "block text-sm font-medium mb-2";
  const noSpinnerCls = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

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

      <form ref={formRef} onKeyDown={handleArrowNavigation} onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Identitas */}
        <section>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Waktu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Tahun Data</label>
              <select name="tahun_data" value={formData.tahun_data} onChange={handleChange} className={inputClass} required>
                <option value="">Tahun</option>
                {Array.from({ length: 11 }, (_, i) => String(CURRENT_YEAR - 5 + i)).sort((a,b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
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
              <input onWheel={(e) => e.target.blur()} type="number" min="0" name="desa_pesisir" value={formData.desa_pesisir} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Luas Wilayah Laut (Km²)</label>
              <input onWheel={(e) => e.target.blur()} type="number" step="0.01" min="0" name="luas_wilayah_laut_km2" value={formData.luas_wilayah_laut_km2} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Pulau-pulau Kecil</label>
              <input onWheel={(e) => e.target.blur()} type="number" name="jumlah_pulau_kecil" value={formData.jumlah_pulau_kecil} onChange={handleChange} min="0" className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Total Panjang Garis Pantai (Km)</label>
              <input onWheel={(e) => e.target.blur()} type="number" step="0.01" name="total_panjang_garis_pantai_km" value={formData.total_panjang_garis_pantai_km} onChange={handleChange} min="0" className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
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
