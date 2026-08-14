import { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { Save, Loader2, FlaskConical, X } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';

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
  'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik',
  'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan',
  'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan',
  'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep',
  'Trenggalek', 'Tuban', 'Tulungagung',
  'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang',
  'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya', 'PT.Garam'
];

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
 * Komponen GaramForm
 * Bertugas untuk menampilkan form input/edit data produksi garam rakyat.
 * Menangani perhitungan otomatis (produktivitas, total produksi, dan total stok)
 * serta mengirimkan data (payload) kembali ke komponen induk.
 */
export const GaramForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  // Dulu ini yang jadi pembeda utama dgn KelautanPesisirForm:
  // kalau caller kirim list sendiri (mis. utk data Kelautan & Pesisir), pakai itu.
  // Kalau tidak dikirim / kosong, fallback ke KAB_KOTA_JATIM (perilaku GaramForm asli).
  kabKotaKelautanOptions,
  // Judul header form, biar bisa dipakai utk konteks lain tanpa hardcode "Data Garam"
  formTitle = 'Data Garam',
}) => {
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
    bulan: 'Januari',
    tahun: '',
    kabupaten_kota: '',
    luas_total_ha: '',
    luas_produksi_ha: '',
    jumlah_kelompok: '',
    jumlah_petambak: '',
    produksi_k1_ton: '', stok_k1_ton: '', harga_k1_rp: '',
    produksi_k2_ton: '', stok_k2_ton: '', harga_k2_rp: '',
    produksi_k3_ton: '', stok_k3_ton: '', harga_k3_rp: ''
  });

  // Handle perubahan input
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

  const kabKotaList = (kabKotaKelautanOptions && kabKotaKelautanOptions.length > 0) ? kabKotaKelautanOptions : KAB_KOTA_KELAUTAN;

  // Validasi dan kirim data
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

  const inputClass = "w-full max-w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border transition-all outline-none";
  const noSpinnerCls = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  // ── Sistem heading & label (disamakan biar konsisten di semua section) ──
  const sectionTitleClass = "text-lg font-semibold flex items-center gap-2 mb-4";
  const sectionBadgeClass = "w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold";
  const metaLabelClass = "text-xs text-muted-foreground tracking-wide mb-1";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm max-w-4xl mx-auto overflow-hidden">
      <div className="bg-muted/35 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-foreground">
            {initialData ? `Edit ${formTitle}` : `Tambah ${formTitle}`}
          </h2>
        </div>
        <button type="button" onClick={onCancel} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form ref={formRef} onKeyDown={handleArrowNavigation} onSubmit={handleSubmit} className="p-6 space-y-6">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div>
              <label className={labelClass}>Bulan</label>
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
                <SearchableSelect name="bulan" value={formData.bulan} onChange={handleChange} className={inputClass} options={NAMA_BULAN_LIST} placeholder="-- Pilih Bulan --" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Triwulan</label>
              <div className="h-10 flex items-center justify-center border border-border rounded-lg bg-muted/30 text-sm font-semibold">
                {triwulan}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tahun</label>
              <input onWheel={(e) => e.target.blur()} type="number" name="tahun" value={formData.tahun} onChange={handleChange} min="2000" max={new Date().getFullYear()} className={inputClass} placeholder="YYYY" required />
            </div>
            <div>
              <label className={labelClass}>Kab/Kota</label>
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
                  value={formData.kabupaten_kota}
                  onChange={handleChange}
                  className={inputClass}
                  options={kabKotaList}
                  placeholder="-- Pilih Kab/Kota --"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        <section>
          <h3 className={sectionTitleClass}>
            <span className={sectionBadgeClass}>1</span>
            Lahan dan SDM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div>
              <label className={labelClass}>Luas Lahan Total (Ha)</label>
              <input onWheel={(e) => e.target.blur()} type="number" step="0.01" min="0" name="luas_total_ha" value={formData.luas_total_ha} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Luas Produksi (Ha)</label>
              <input onWheel={(e) => e.target.blur()} type="number" step="0.01" min="0" name="luas_produksi_ha" value={formData.luas_produksi_ha} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Kelompok</label>
              <input onWheel={(e) => e.target.blur()} type="number" min="0" name="jumlah_kelompok" value={formData.jumlah_kelompok} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Jumlah Petambak (Orang)</label>
              <input onWheel={(e) => e.target.blur()} type="number" min="0" name="jumlah_petambak" value={formData.jumlah_petambak} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        <section>
          <h3 className={sectionTitleClass}>
            <span className={sectionBadgeClass}>2</span>
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
                      <label className={metaLabelClass}>Produksi (Ton)</label>
                      <input onWheel={(e) => e.target.blur()} type="number" step="0.01" min="0" name={`produksi_${k.key}_ton`} value={formData[`produksi_${k.key}_ton`]} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={metaLabelClass}>Stok (Ton)</label>
                      <input onWheel={(e) => e.target.blur()} type="number" step="0.01" min="0" name={`stok_${k.key}_ton`} value={formData[`stok_${k.key}_ton`]} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={metaLabelClass}>Harga (Rp)</label>
                      <input onWheel={(e) => e.target.blur()} type="number" min="0" name={`harga_${k.key}_rp`} value={formData[`harga_${k.key}_rp`]} onChange={handleChange} className={`${inputClass} ${noSpinnerCls}`} placeholder="0.00" />
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className={metaLabelClass.replace(' mb-1', '')}>Nilai Produksi</span>
                      <span className="text-sm font-bold">{(p * h).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* ── LIVE KALKULASI PANEL ─────────────────────────────────────────── */}
        <section>
          <div className="bg-muted/10 border border-border rounded-xl p-5">
            <h3 className={sectionTitleClass}>
              <span className={sectionBadgeClass}>3</span>
              Kalkulasi Otomatis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-xl border border-border p-4">
                <p className={metaLabelClass}>Total Produksi</p>
                <p className="text-2xl font-bold text-primary">{totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">Ton</span></p>
              </div>
              <div className="bg-background rounded-xl border border-border p-4">
                <p className={metaLabelClass}>Total Stok</p>
                <p className="text-2xl font-bold text-primary">{totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">Ton</span></p>
              </div>
              <div className="bg-background rounded-xl border border-border p-4">
                <p className={metaLabelClass}>Produktivitas Lahan</p>
                <p className="text-2xl font-bold text-primary">
                  {lp > 0 ? (
                    <>{produktivitas.toLocaleString('id-ID', { maximumFractionDigits: 3 })} <span className="text-sm font-normal text-muted-foreground">Ton/Ha</span></>
                  ) : (
                    <span className="text-sm font-normal text-muted-foreground italic">Isi luas produksi terlebih dahulu</span>
                  )}
                </p>
              </div>
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