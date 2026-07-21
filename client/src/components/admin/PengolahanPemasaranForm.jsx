import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

// ============================================================================
// MASTER DATA & OPTIONS
// ============================================================================
export const KABUPATEN_KOTA_OPTIONS = [
  'KAB. PACITAN', 'KAB. PONOROGO', 'KAB. TRENGGALEK', 'KAB. TULUNGAGUNG',
  'KAB. BLITAR', 'KAB. KEDIRI', 'KAB. MALANG', 'KAB. LUMAJANG', 'KAB. JEMBER',
  'KAB. BANYUWANGI', 'KAB. BONDOWOSO', 'KAB. SITUBONDO', 'KAB. PROBOLINGGO',
  'KAB. PASURUAN', 'KAB. SIDOARJO', 'KAB. MOJOKERTO', 'KAB. JOMBANG',
  'KAB. NGANJUK', 'KAB. MADIUN', 'KAB. MAGETAN', 'KAB. NGAWI', 'KAB. BOJONEGORO',
  'KAB. TUBAN', 'KAB. LAMONGAN', 'KAB. GRESIK', 'KAB. BANGKALAN', 'KAB. SAMPANG',
  'KAB. PAMEKASAN', 'KAB. SUMENEP', 'KOTA KEDIRI', 'KOTA BLITAR', 'KOTA MALANG',
  'KOTA PROBOLINGGO', 'KOTA PASURUAN', 'KOTA MOJOKERTO', 'KOTA MADIUN',
  'KOTA SURABAYA', 'KOTA BATU',
];

// Dropdown Tahun: 1 tahun ke depan s.d. 6 tahun ke belakang, dihitung otomatis dari tahun berjalan.
const CURRENT_YEAR = new Date().getFullYear();
export const TAHUN_OPTIONS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR + 1 - i));

export const JENIS_KEGIATAN_PENGOLAHAN = [
  'Fermentasi',
  'Pelumatan Daging Ikan',
  'Pembekuan',
  'Pemindangan',
  'Penanganan Produk Segar',
  'Pengalengan',
  'Pengasapan/ Pemanggangan',
  'Pereduksian/ Ekstraksi',
  'Penggaraman/ Pengeringan',
  'Pengolahan Lainnya',
];

export const JENIS_KEGIATAN_PEMASARAN = [
  'Pengecer',
  'Pengumpul/ Pedagang Besar/ Distributor',
];

export const SKALA_USAHA_OPTIONS = ['Mikro', 'Kecil', 'Menengah', 'Besar'];

export const SERTIFIKAT_PRODUK_LIST = [
  { key: 'haccp', label: 'HACCP' },
  { key: 'sni', label: 'SNI' },
  { key: 'halal', label: 'HALAL' },
  { key: 'skp', label: 'SKP' },
  { key: 'pirt', label: 'PIRT' },
  { key: 'md', label: 'MD' },
  { key: 'lainnya', label: 'Lain-lain' },
];

export const IZIN_USAHA_LIST = [
  { key: 'nib', label: 'NIB' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'kusuka', label: 'KUSUKA' },
  { key: 'menkumham', label: 'Pengesahan MENKUMHAM' },
  { key: 'akta_pendirian', label: 'Akta Pendirian Usaha' },
  { key: 'lokasi_domisili', label: 'Lokasi / Domisili' },
  { key: 'imb', label: 'IMB' },
  { key: 'siup_perikanan', label: 'SIUP Perikanan' },
  { key: 'siup_perdagangan', label: 'SIUP Perdagangan' },
  { key: 'lainnya', label: 'Lain-lain' },
];

const INITIAL_FORM_DATA = {
  tahun: String(CURRENT_YEAR),
  kabupaten_kota: '',
  kategori_kegiatan: 'Pengolahan',
  jenis_kegiatan: '',
  skala_usaha: 'Mikro',
  jumlah_unit_usaha: '0',
  modal_rp: '0',
  hasil_kg: '0',
  hasil_rp: '0',
  sertifikat_produk: SERTIFIKAT_PRODUK_LIST.reduce((acc, item) => ({ ...acc, [item.key]: '0' }), {}),
  izin_usaha: IZIN_USAHA_LIST.reduce((acc, item) => ({ ...acc, [item.key]: '0' }), {}),
  shm_count: '0',
  non_shm_count: '0',
};

// ============================================================================
// STYLING
// ============================================================================
const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground';

const LABEL_CLASS = 'mb-1 block text-xs font-normal uppercase tracking-wide text-white';

// ============================================================================
// HELPERS
// ============================================================================

// Format angka dengan pemisah ribuan ala Indonesia saat diketik (mis. 15000 -> "15.000")
const formatThousand = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly).toLocaleString('id-ID') : '0';
};

// Ubah string berformat ribuan ("15.000") kembali jadi angka murni untuk dikirim ke API.
// PENTING: fungsi inilah yang dipakai untuk payload backend, BUKAN formatValueForExport.
const toRawNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const cleanVal = String(val).replace(/\./g, '').trim();
  const parsed = Number(cleanVal);
  return Number.isFinite(parsed) ? parsed : 0;
};


const normalizeKategori = (value) =>
  String(value ?? '').trim().toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

const normalizeOptionKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');

const findCanonicalOption = (value, options) => {
  const key = normalizeOptionKey(value);
  return options.find((option) => normalizeOptionKey(option) === key) || value || '';
};

const createEmptyFormData = () => ({
  ...INITIAL_FORM_DATA,
  sertifikat_produk: { ...INITIAL_FORM_DATA.sertifikat_produk },
  izin_usaha: { ...INITIAL_FORM_DATA.izin_usaha },
});

const createFormData = (initialData) => {
  if (!initialData) return createEmptyFormData();

  const kategori = normalizeKategori(initialData.kategori_kegiatan);
  const jenisOptions =
    kategori === 'Pengolahan'
      ? JENIS_KEGIATAN_PENGOLAHAN
      : JENIS_KEGIATAN_PEMASARAN;

  return {
    tahun: String(initialData.tahun ?? CURRENT_YEAR),
    kabupaten_kota: initialData.kabupaten_kota ?? '',
    kategori_kegiatan: kategori,
    jenis_kegiatan: findCanonicalOption(initialData.jenis_kegiatan, jenisOptions),
    skala_usaha: initialData.skala_usaha ?? 'Mikro',
    jumlah_unit_usaha: formatThousand(initialData.jumlah_unit_usaha ?? 0),
    modal_rp: formatThousand(initialData.modal_rp ?? 0),
    hasil_kg: formatThousand(initialData.hasil_kg ?? 0),
    hasil_rp: formatThousand(initialData.hasil_rp ?? 0),
    sertifikat_produk: {
      haccp: formatThousand(initialData.sertifikat_haccp ?? 0),
      sni: formatThousand(initialData.sertifikat_sni ?? 0),
      halal: formatThousand(initialData.sertifikat_halal ?? 0),
      skp: formatThousand(initialData.sertifikat_skp ?? 0),
      pirt: formatThousand(initialData.sertifikat_pirt ?? 0),
      md: formatThousand(initialData.sertifikat_md ?? 0),
      lainnya: formatThousand(initialData.sertifikat_lainnya ?? 0),
    },
    izin_usaha: {
      nib: formatThousand(initialData.izin_nib ?? 0),
      npwp: formatThousand(initialData.izin_npwp ?? 0),
      kusuka: formatThousand(initialData.izin_kusuka ?? 0),
      menkumham: formatThousand(initialData.izin_menkumham ?? 0),
      akta_pendirian: formatThousand(initialData.izin_akta_pendirian ?? 0),
      lokasi_domisili: formatThousand(initialData.izin_lokasi_domisili ?? 0),
      imb: formatThousand(initialData.izin_imb ?? 0),
      siup_perikanan: formatThousand(initialData.izin_siup_perikanan ?? 0),
      siup_perdagangan: formatThousand(initialData.izin_siup_perdagangan ?? 0),
      lainnya: formatThousand(initialData.izin_lainnya ?? 0),
    },
    shm_count: formatThousand(initialData.shm_count ?? 0),
    non_shm_count: formatThousand(initialData.non_shm_count ?? 0),
  };
};

// Format nilai HANYA untuk tampilan/export rekap (mis. generate file Excel): 0/kosong -> "-".
// JANGAN pakai fungsi ini untuk payload yang dikirim ke API, karena kolom di database
// bertipe Int/Float dan akan ditolak Prisma kalau menerima string seperti "-" atau "15.000".
const formatValueForDisplay = (val) => {
  if (val === '' || val === null || val === undefined) return '-';
  const cleanVal = String(val).replace(/\./g, '').trim();
  if (cleanVal === '0' || cleanVal === '') return '-';
  return Number(cleanVal).toLocaleString('id-ID');
};

// ============================================================================
// REUSABLE FIELDS
// ============================================================================
function SectionCard({ number, title, children }) {
  return (
    <section className="relative overflow-visible rounded-2xl border border-border bg-card shadow-sm">
      <div className="rounded-t-2xl border-b border-border bg-muted/35 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {number}
          </span>
          <h2 className="font-heading text-base font-semibold leading-tight text-foreground">
            {title}
          </h2>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function SelectField({ label, value, onChange, options, placeholder = '-- Pilih --', required = true, disabled = false }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      <div className="relative">
        <select
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={`${INPUT_CLASS} appearance-none pr-10`}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function SearchableSingleSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Pilih salah satu',
  required = true,
}) {
  const wrapperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const normalizedOptions = [...new Set((options || []).filter(Boolean))];
  const normalizedSearch = search.trim().toUpperCase();
  const filteredOptions = normalizedOptions.filter((option) =>
    String(option).toUpperCase().includes(normalizedSearch),
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${isOpen ? 'z-[90]' : 'z-0'}`}>
      <label className={LABEL_CLASS}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className={`${INPUT_CLASS} flex items-center justify-between gap-3 text-left`}
      >
        <span className={value ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ketik nama kabupaten/kota..."
              className={`${INPUT_CLASS} pl-9`}
              autoFocus
            />
          </div>

          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const selected = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {option}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Tidak ada kabupaten/kota yang cocok.
              </p>
            )}
          </div>

          {value ? (
            <div className="mt-3 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setSearch('');
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Bersihkan pilihan
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function NumberField({ label, value, onChange, required = true }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      <input
        type="text"
        required={required}
        inputMode="numeric"
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
      />
    </div>
  );
}

// Grid input angka untuk daftar kategori (Sertifikat Produk / Izin Usaha)
function NestedAmountGrid({ category, list, values, onChangeItem }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {list.map((item) => (
        <div key={item.key}>
          <label className="mb-1 block text-xs font-normal text-white">{item.label} <span className="text-rose-500">*</span></label>
          <input
            type="text"
            required
            inputMode="numeric"
            value={values[item.key] ?? '0'}
            onChange={(e) => onChangeItem(category, item.key, e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT (DIRECT REKAP MODE ONLY)
// ============================================================================
export default function PengolahanPemasaranForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(() => createFormData(initialData));

  useEffect(() => {
    setFormData(createFormData(initialData));
  }, [initialData]);

  const subJenisOptions = useMemo(
    () => (formData.kategori_kegiatan === 'Pengolahan' ? JENIS_KEGIATAN_PENGOLAHAN : JENIS_KEGIATAN_PEMASARAN),
    [formData.kategori_kegiatan],
  );

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setAmountField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: formatThousand(value) }));
  };

  const handleKategoriChange = (kategori) => {
    setFormData((prev) => ({
      ...prev,
      kategori_kegiatan: kategori,
      jenis_kegiatan: '', // reset karena daftar sub-jenis berubah (dependent dropdown)
    }));
  };

  const handleNestedAmountChange = (category, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: formatThousand(value),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Payload untuk API: angka murni (Int/Float), sesuai tipe kolom di Prisma.
    // Kolom nested (sertifikat_produk, izin_usaha) diratakan (flatten) jadi
    // sertifikat_<key> dan izin_<key> agar cocok dengan model PengolahanPemasaran.
    const payload = {
      tahun: toRawNumber(formData.tahun),
      kabupaten_kota: formData.kabupaten_kota,
      kategori_kegiatan: formData.kategori_kegiatan,
      jenis_kegiatan: formData.jenis_kegiatan,
      skala_usaha: formData.skala_usaha,
      jumlah_unit_usaha: toRawNumber(formData.jumlah_unit_usaha),
      modal_rp: toRawNumber(formData.modal_rp),
      hasil_kg: toRawNumber(formData.hasil_kg),
      hasil_rp: toRawNumber(formData.hasil_rp),
      shm_count: toRawNumber(formData.shm_count),
      non_shm_count: toRawNumber(formData.non_shm_count),
    };

    Object.keys(formData.sertifikat_produk).forEach((key) => {
      payload[`sertifikat_${key}`] = toRawNumber(formData.sertifikat_produk[key]);
    });

    Object.keys(formData.izin_usaha).forEach((key) => {
      payload[`izin_${key}`] = toRawNumber(formData.izin_usaha[key]);
    });

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Bagian 1 */}
      <SectionCard
        number="1"
        title="Tahun & Wilayah Kabupaten / Kota"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Tahun"
            value={formData.tahun}
            onChange={(e) => setField('tahun', e.target.value)}
            options={TAHUN_OPTIONS}
            placeholder={null}
          />
          <SearchableSingleSelect
            label="Kabupaten / Kota"
            value={formData.kabupaten_kota}
            onChange={(value) => setField('kabupaten_kota', value)}
            options={KABUPATEN_KOTA_OPTIONS}
            placeholder="Cari atau pilih kabupaten/kota"
          />
        </div>
      </SectionCard>

      {/* Bagian 2 */}
      <SectionCard
        number="2"
        title="Klasifikasi Jenis Usaha & Skala Usaha"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-normal uppercase tracking-wide text-white">
              Kategori Utama <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              {[
                { value: 'Pengolahan', label: 'Pengolahan' },
                { value: 'Pemasaran', label: 'Pemasaran' },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="radio"
                    name="kategori_kegiatan"
                    value={opt.value}
                    checked={formData.kategori_kegiatan === opt.value}
                    onChange={() => handleKategoriChange(opt.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label={`Jenis Kegiatan (${formData.kategori_kegiatan === 'Pengolahan' ? 'Pengolahan' : 'Pemasaran'})`}
              value={formData.jenis_kegiatan}
              onChange={(e) => setField('jenis_kegiatan', e.target.value)}
              options={subJenisOptions}
              placeholder="-- Pilih Jenis Kegiatan --"
            />
            <SelectField
              label="Skala Usaha"
              value={formData.skala_usaha}
              onChange={(e) => setField('skala_usaha', e.target.value)}
              options={SKALA_USAHA_OPTIONS}
              placeholder={null}
            />
          </div>
        </div>
      </SectionCard>

      {/* Bagian 3 */}
      <SectionCard number="3" title="Unit Usaha & Modal Investasi">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Jumlah Unit Usaha (Unit)"
            value={formData.jumlah_unit_usaha}
            onChange={(e) => setAmountField('jumlah_unit_usaha', e.target.value)}
          />
          <NumberField
            label="Modal Investasi (Rp)"
            value={formData.modal_rp}
            onChange={(e) => setAmountField('modal_rp', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* Bagian 4 */}
      <SectionCard number="4" title="Capaian Hasil Produksi / Penjualan">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Hasil Produksi (Kg)"
            value={formData.hasil_kg}
            onChange={(e) => setAmountField('hasil_kg', e.target.value)}
          />
          <NumberField
            label="Nilai Produksi (Rp)"
            value={formData.hasil_rp}
            onChange={(e) => setAmountField('hasil_rp', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* Bagian 5 */}
      <SectionCard
        number="5"
        title="Rekapitulasi Sertifikat Produk"
      >
        <NestedAmountGrid
          category="sertifikat_produk"
          list={SERTIFIKAT_PRODUK_LIST}
          values={formData.sertifikat_produk}
          onChangeItem={handleNestedAmountChange}
        />
      </SectionCard>

      {/* Bagian 6 */}
      <SectionCard
        number="6"
        title="Rekapitulasi Izin Usaha"
      >
        <NestedAmountGrid
          category="izin_usaha"
          list={IZIN_USAHA_LIST}
          values={formData.izin_usaha}
          onChangeItem={handleNestedAmountChange}
        />
      </SectionCard>

      {/* Bagian 7 */}
      <SectionCard
        number="7"
        title="Rekapitulasi Sertifikat Lahan & Bangunan"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Sertifikat Hak Milik (SHM)"
            value={formData.shm_count}
            onChange={(e) => setAmountField('shm_count', e.target.value)}
          />
          <NumberField
            label="Non SHM (Sewa / Girik / HGB / DLL)"
            value={formData.non_shm_count}
            onChange={(e) => setAmountField('non_shm_count', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* BUTTON FOOTER */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" /> Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Data'}
        </button>
      </div>
    </form>
  );
}