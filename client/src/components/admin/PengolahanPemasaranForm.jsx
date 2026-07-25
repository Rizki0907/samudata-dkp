import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

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

// Input angka memakai format Indonesia:
// - titik sebagai pemisah ribuan: 1000 -> "1.000"
// - koma sebagai pemisah desimal: 1000,65 -> "1.000,65"
// - maksimal dua angka di belakang koma.
const MAX_DECIMAL_DIGITS = 2;
const DECIMAL_AMOUNT_FIELDS = new Set(['modal_rp', 'hasil_kg', 'hasil_rp']);

const getDecimalDigits = (key) =>
  DECIMAL_AMOUNT_FIELDS.has(key) ? MAX_DECIMAL_DIGITS : 0;

const roundToDigits = (value, decimalDigits = MAX_DECIMAL_DIGITS) => {
  const factor = 10 ** decimalDigits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const formatIndonesianInput = (value, decimalDigits = MAX_DECIMAL_DIGITS) => {
  if (value === '' || value === null || value === undefined) return '';

  let raw = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/[^0-9.,]/g, '');

  if (!raw) return '';

  const hasDecimalSeparator = decimalDigits > 0 && raw.includes(',');
  const [rawInteger = '', ...rawDecimalParts] = raw.split(',');
  const integerDigits = rawInteger.replace(/\./g, '').replace(/\D/g, '');
  const cleanInteger = integerDigits.replace(/^0+(?=\d)/, '') || '0';
  const groupedInteger = cleanInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!hasDecimalSeparator) return groupedInteger;

  const decimalDigitsOnly = rawDecimalParts
    .join('')
    .replace(/\D/g, '')
    .slice(0, decimalDigits);

  return `${groupedInteger},${decimalDigitsOnly}`;
};

const formatInitialNumber = (value, decimalDigits = MAX_DECIMAL_DIGITS) => {
  if (value === '' || value === null || value === undefined) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('id-ID', {
      useGrouping: true,
      maximumFractionDigits: decimalDigits,
    });
  }

  const raw = String(value).trim();
  if (!raw) return '';

  // Nilai yang sudah berbentuk 1.000 atau 1.000.000 dianggap memakai
  // pemisah ribuan Indonesia, bukan titik desimal dari API.
  if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    return formatIndonesianInput(raw, decimalDigits);
  }

  // Nilai dari API umumnya memakai titik sebagai desimal, misalnya 1000.65.
  // Nilai yang sudah memakai koma dianggap sudah berformat Indonesia.
  if (!raw.includes(',') && /^-?\d+(?:\.\d+)?$/.test(raw)) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('id-ID', {
        useGrouping: true,
        maximumFractionDigits: decimalDigits,
      });
    }
  }

  return formatIndonesianInput(raw, decimalDigits);
};

// Ubah "1.000,65" menjadi 1000.65 untuk payload API.
const toRawNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0;

  const normalized = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSteppedNumber = (value, decimalDigits = MAX_DECIMAL_DIGITS) =>
  Math.max(0, roundToDigits(value, decimalDigits)).toLocaleString('id-ID', {
    useGrouping: true,
    maximumFractionDigits: decimalDigits,
  });


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
    jumlah_unit_usaha: formatInitialNumber(initialData.jumlah_unit_usaha ?? 0, 0),
    modal_rp: formatInitialNumber(initialData.modal_rp ?? 0, 2),
    hasil_kg: formatInitialNumber(initialData.hasil_kg ?? 0, 2),
    hasil_rp: formatInitialNumber(initialData.hasil_rp ?? 0, 2),
    sertifikat_produk: {
      haccp: formatInitialNumber(initialData.sertifikat_haccp ?? 0, 0),
      sni: formatInitialNumber(initialData.sertifikat_sni ?? 0, 0),
      halal: formatInitialNumber(initialData.sertifikat_halal ?? 0, 0),
      skp: formatInitialNumber(initialData.sertifikat_skp ?? 0, 0),
      pirt: formatInitialNumber(initialData.sertifikat_pirt ?? 0, 0),
      md: formatInitialNumber(initialData.sertifikat_md ?? 0, 0),
      lainnya: formatInitialNumber(initialData.sertifikat_lainnya ?? 0, 0),
    },
    izin_usaha: {
      nib: formatInitialNumber(initialData.izin_nib ?? 0, 0),
      npwp: formatInitialNumber(initialData.izin_npwp ?? 0, 0),
      kusuka: formatInitialNumber(initialData.izin_kusuka ?? 0, 0),
      menkumham: formatInitialNumber(initialData.izin_menkumham ?? 0, 0),
      akta_pendirian: formatInitialNumber(initialData.izin_akta_pendirian ?? 0, 0),
      lokasi_domisili: formatInitialNumber(initialData.izin_lokasi_domisili ?? 0, 0),
      imb: formatInitialNumber(initialData.izin_imb ?? 0, 0),
      siup_perikanan: formatInitialNumber(initialData.izin_siup_perikanan ?? 0, 0),
      siup_perdagangan: formatInitialNumber(initialData.izin_siup_perdagangan ?? 0, 0),
      lainnya: formatInitialNumber(initialData.izin_lainnya ?? 0, 0),
    },
    shm_count: formatInitialNumber(initialData.shm_count ?? 0, 0),
    non_shm_count: formatInitialNumber(initialData.non_shm_count ?? 0, 0),
  };
};

// Format nilai HANYA untuk tampilan/export rekap (mis. generate file Excel): 0/kosong -> "-".
// JANGAN pakai fungsi ini untuk payload yang dikirim ke API, karena kolom di database
// bertipe Int/Float dan akan ditolak Prisma kalau menerima string seperti "-" atau "15.000".

// Bentuk payload yang sama dipakai oleh simpan satu data dan batch entry.
// Seluruh angka dikirim sebagai Number agar tetap sesuai dengan tipe Prisma.
const buildApiPayload = (source) => {
  const payload = {
    tahun: toRawNumber(source.tahun),
    kabupaten_kota: source.kabupaten_kota,
    kategori_kegiatan: source.kategori_kegiatan,
    jenis_kegiatan: source.jenis_kegiatan,
    skala_usaha: source.skala_usaha,
    jumlah_unit_usaha: toRawNumber(source.jumlah_unit_usaha),
    modal_rp: toRawNumber(source.modal_rp),
    hasil_kg: toRawNumber(source.hasil_kg),
    hasil_rp: toRawNumber(source.hasil_rp),
    shm_count: toRawNumber(source.shm_count),
    non_shm_count: toRawNumber(source.non_shm_count),
  };

  Object.keys(source.sertifikat_produk).forEach((key) => {
    payload[`sertifikat_${key}`] = toRawNumber(
      source.sertifikat_produk[key],
    );
  });

  Object.keys(source.izin_usaha).forEach((key) => {
    payload[`izin_${key}`] = toRawNumber(
      source.izin_usaha[key],
    );
  });

  return payload;
};

// Setelah satu rincian masuk ke daftar, Tahun dan Kabupaten/Kota tetap.
// Kategori dan skala juga dipertahankan agar input berikutnya lebih cepat.
const createNextDetailForm = (current) => {
  const next = createEmptyFormData();

  return {
    ...next,
    tahun: current.tahun,
    kabupaten_kota: current.kabupaten_kota,
    kategori_kegiatan: current.kategori_kegiatan,
    skala_usaha: current.skala_usaha,
  };
};

const getBatchCombinationKey = (item) =>
  [
    normalizeKategori(item.kategori_kegiatan),
    normalizeOptionKey(item.jenis_kegiatan),
    normalizeOptionKey(item.skala_usaha),
  ].join('|');

const formatValueForDisplay = (value) => {
  if (value === '' || value === null || value === undefined) return '-';
  const parsed = toRawNumber(value);
  if (parsed === 0) return '-';
  return parsed.toLocaleString('id-ID', {
    useGrouping: true,
    maximumFractionDigits: MAX_DECIMAL_DIGITS,
  });
};

const FORM_NAV_SELECTOR = '[data-form-nav="true"]:not(:disabled)';

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

  const pool = sameLineCandidates.length
    ? sameLineCandidates
    : directionalCandidates;

  return pool
    .map((candidate) => {
      const primaryDistance = horizontalDirection
        ? Math.abs(candidate.x - current.x)
        : Math.abs(candidate.y - current.y);
      const secondaryDistance = horizontalDirection
        ? Math.abs(candidate.y - current.y)
        : Math.abs(candidate.x - current.x);

      return {
        ...candidate,
        score: primaryDistance + secondaryDistance * 3,
      };
    })
    .sort((a, b) => a.score - b.score)[0]?.element ?? null;
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
          data-form-nav="true"
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
        data-form-nav="true"
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

function NumericInputWithStepper({
  value,
  onChange,
  onStep,
  required = true,
  ariaLabel,
  decimalDigits = MAX_DECIMAL_DIGITS,
}) {
  const keepInputFocused = (event) => {
    event.preventDefault();
  };

  const stepLabel = decimalDigits > 0 ? '0,01' : '1';

  return (
    <div className="group relative">
      <input
        type="text"
        required={required}
        inputMode={decimalDigits > 0 ? 'decimal' : 'numeric'}
        value={value}
        onChange={onChange}
        data-form-nav="true"
        aria-label={ariaLabel}
        className={`${INPUT_CLASS} pr-12`}
      />

      {/* Spinner menyerupai input number native: tersembunyi saat normal,
          lalu muncul ketika kotak di-hover atau sedang fokus/disentuh.
          Input tetap bertipe text agar format Indonesia 1.000,65 tetap bisa digunakan. */}
      <div className="pointer-events-none absolute right-3 top-1/2 flex h-[26px] w-[18px] -translate-y-1/2 flex-col overflow-hidden rounded-[2px] border border-slate-300 bg-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Naikkan ${ariaLabel || 'nilai'} sebesar ${stepLabel}`}
          title={`Tambah ${stepLabel}`}
          onMouseDown={keepInputFocused}
          onClick={() => onStep(1)}
          className="flex min-h-0 flex-1 items-center justify-center bg-white transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <span
            aria-hidden="true"
            className="h-0 w-0 border-x-[3px] border-b-[5px] border-x-transparent border-b-slate-600"
          />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Turunkan ${ariaLabel || 'nilai'} sebesar ${stepLabel}`}
          title={`Kurangi ${stepLabel}`}
          onMouseDown={keepInputFocused}
          onClick={() => onStep(-1)}
          className="flex min-h-0 flex-1 items-center justify-center border-t border-slate-300 bg-white transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <span
            aria-hidden="true"
            className="h-0 w-0 border-x-[3px] border-t-[5px] border-x-transparent border-t-slate-600"
          />
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onStep,
  required = true,
  decimalDigits = MAX_DECIMAL_DIGITS,
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      <NumericInputWithStepper
        value={value}
        onChange={onChange}
        onStep={onStep}
        required={required}
        ariaLabel={label}
        decimalDigits={decimalDigits}
      />
    </div>
  );
}

// Grid input angka untuk daftar kategori (Sertifikat Produk / Izin Usaha)
function NestedAmountGrid({
  category,
  list,
  values,
  onChangeItem,
  onStepItem,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {list.map((item) => (
        <div key={item.key}>
          <label className="mb-1 block text-xs font-normal text-white">
            {item.label} <span className="text-rose-500">*</span>
          </label>
          <NumericInputWithStepper
            value={values[item.key] ?? '0'}
            onChange={(event) =>
              onChangeItem(category, item.key, event.target.value)
            }
            onStep={(direction) =>
              onStepItem(category, item.key, direction)
            }
            ariaLabel={item.label}
            decimalDigits={0}
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
  const formRef = useRef(null);
  const isBatchMode = !initialData;

  const [formData, setFormData] = useState(() => createFormData(initialData));
  const [batchItems, setBatchItems] = useState([]);
  const [editingBatchIndex, setEditingBatchIndex] = useState(null);
  const [batchError, setBatchError] = useState('');

  useEffect(() => {
    setFormData(createFormData(initialData));
    setBatchItems([]);
    setEditingBatchIndex(null);
    setBatchError('');
  }, [initialData]);

  const subJenisOptions = useMemo(
    () => (formData.kategori_kegiatan === 'Pengolahan' ? JENIS_KEGIATAN_PENGOLAHAN : JENIS_KEGIATAN_PEMASARAN),
    [formData.kategori_kegiatan],
  );

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setAmountField = (key, value) => {
    const decimalDigits = getDecimalDigits(key);
    setFormData((prev) => ({
      ...prev,
      [key]: formatIndonesianInput(value, decimalDigits),
    }));
  };

  const stepAmountField = (key, direction) => {
    const decimalDigits = getDecimalDigits(key);
    const step = decimalDigits > 0 ? 0.01 : 1;

    setFormData((prev) => ({
      ...prev,
      [key]: formatSteppedNumber(
        toRawNumber(prev[key]) + direction * step,
        decimalDigits,
      ),
    }));
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
        [key]: formatIndonesianInput(value, 0),
      },
    }));
  };

  const stepNestedAmount = (category, key, direction) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: formatSteppedNumber(
          toRawNumber(prev[category]?.[key]) + direction,
          0,
        ),
      },
    }));
  };

  const validateCurrentDetail = () => {
    if (!formData.tahun) return 'Tahun wajib dipilih.';
    if (!formData.kabupaten_kota) {
      return 'Kabupaten/Kota wajib dipilih.';
    }
    if (!formData.kategori_kegiatan) {
      return 'Kategori kegiatan wajib dipilih.';
    }
    if (!formData.jenis_kegiatan) {
      return 'Jenis kegiatan wajib dipilih.';
    }
    if (!formData.skala_usaha) {
      return 'Skala usaha wajib dipilih.';
    }

    return null;
  };

  const handleAddToBatch = () => {
    const validationError = validateCurrentDetail();

    if (validationError) {
      setBatchError(validationError);
      return;
    }

    const payload = buildApiPayload(formData);
    const combinationKey = getBatchCombinationKey(payload);

    const duplicateIndex = batchItems.findIndex(
      (item, index) =>
        index !== editingBatchIndex &&
        getBatchCombinationKey(item) === combinationKey,
    );

    if (duplicateIndex !== -1) {
      setBatchError(
        `${payload.jenis_kegiatan} dengan skala ${payload.skala_usaha} sudah ada dalam daftar. Gunakan tombol Edit pada rincian tersebut.`,
      );
      return;
    }

    setBatchItems((previous) => {
      if (editingBatchIndex === null) {
        return [...previous, payload];
      }

      return previous.map((item, index) =>
        index === editingBatchIndex ? payload : item,
      );
    });

    setFormData((previous) => createNextDetailForm(previous));
    setEditingBatchIndex(null);
    setBatchError('');
  };

  const handleEditBatchItem = (index) => {
    const item = batchItems[index];

    if (!item) return;

    setFormData((previous) => ({
      ...createFormData(item),
      tahun: previous.tahun,
      kabupaten_kota: previous.kabupaten_kota,
    }));

    setEditingBatchIndex(index);
    setBatchError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDeleteBatchItem = (index) => {
    setBatchItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index),
    );

    if (editingBatchIndex === index) {
      setFormData((previous) => createNextDetailForm(previous));
    }

    setEditingBatchIndex(null);
    setBatchError('');
  };

  const handleClearBatch = () => {
    if (
      batchItems.length > 0 &&
      !window.confirm(
        'Hapus seluruh rincian yang sudah ditambahkan ke daftar?',
      )
    ) {
      return;
    }

    setBatchItems([]);
    setEditingBatchIndex(null);
    setBatchError('');
    setFormData((previous) => createNextDetailForm(previous));
  };

  const handleSaveBatch = () => {
    if (!formData.tahun || !formData.kabupaten_kota) {
      setBatchError(
        'Tahun dan Kabupaten/Kota wajib dipilih sebelum menyimpan.',
      );
      return;
    }

    if (batchItems.length === 0) {
      setBatchError(
        'Tambahkan minimal satu rincian ke daftar sebelum menyimpan.',
      );
      return;
    }

    const details = batchItems.map((item) => {
      const {
        tahun: ignoredYear,
        kabupaten_kota: ignoredRegion,
        ...detail
      } = item;

      return detail;
    });

    onSubmit({
      tahun: toRawNumber(formData.tahun),
      kabupaten_kota: formData.kabupaten_kota,
      details,
    });
  };

  const handleArrowNavigation = (event) => {
    const directionByKey = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    };
    const direction = directionByKey[event.key];

    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;

    const currentElement = event.target.closest?.(FORM_NAV_SELECTOR);

    if (!currentElement || !formRef.current?.contains(currentElement)) return;

    const targetElement = findDirectionalTarget(
      formRef.current,
      currentElement,
      direction,
    );

    if (!targetElement) return;

    event.preventDefault();
    targetElement.focus({ preventScroll: true });
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });

    if (
      targetElement instanceof HTMLInputElement &&
      targetElement.type === 'text'
    ) {
      requestAnimationFrame(() => targetElement.select());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isBatchMode) {
      handleAddToBatch();
      return;
    }

    // Mode edit tetap menyimpan satu data seperti sebelumnya.
    onSubmit(buildApiPayload(formData));
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleArrowNavigation}
      className="mx-auto max-w-5xl space-y-6 p-4"
    >
      {/* Bagian 1 */}
      <SectionCard
        number="1"
        title="Tahun dan Wilayah"
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
        title="Klasifikasi Jenis Usaha dan Skala Usaha"
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
      <SectionCard number="3" title="Unit Usaha dan Modal Investasi">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Jumlah Unit Usaha (Unit)"
            value={formData.jumlah_unit_usaha}
            onChange={(e) => setAmountField('jumlah_unit_usaha', e.target.value)}
            onStep={(direction) => stepAmountField('jumlah_unit_usaha', direction)}
            decimalDigits={0}
          />
          <NumberField
            label="Modal Investasi (Rp)"
            value={formData.modal_rp}
            onChange={(e) => setAmountField('modal_rp', e.target.value)}
            onStep={(direction) => stepAmountField('modal_rp', direction)}
            decimalDigits={2}
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
            onStep={(direction) => stepAmountField('hasil_kg', direction)}
            decimalDigits={2}
          />
          <NumberField
            label="Hasil Produksi (Rp)"
            value={formData.hasil_rp}
            onChange={(e) => setAmountField('hasil_rp', e.target.value)}
            onStep={(direction) => stepAmountField('hasil_rp', direction)}
            decimalDigits={2}
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
          onStepItem={stepNestedAmount}
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
          onStepItem={stepNestedAmount}
        />
      </SectionCard>

      {/* Bagian 7 */}
      <SectionCard
        number="7"
        title="Rekapitulasi Sertifikat Lahan dan Bangunan"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Sertifikat Hak Milik (SHM)"
            value={formData.shm_count}
            onChange={(e) => setAmountField('shm_count', e.target.value)}
            onStep={(direction) => stepAmountField('shm_count', direction)}
            decimalDigits={0}
          />
          <NumberField
            label="Non SHM (Sewa / Girik / HGB / DLL)"
            value={formData.non_shm_count}
            onChange={(e) => setAmountField('non_shm_count', e.target.value)}
            onStep={(direction) => stepAmountField('non_shm_count', direction)}
            decimalDigits={0}
          />
        </div>
      </SectionCard>

      {isBatchMode ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {editingBatchIndex === null
                  ? 'Tambahkan rincian ke daftar'
                  : 'Perbarui rincian yang sedang diedit'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tahun dan Kabupaten/Kota akan digunakan untuk seluruh rincian.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToBatch}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {editingBatchIndex === null
                ? '+ Tambahkan ke Daftar'
                : 'Perbarui Rincian'}
            </button>
          </div>

          {batchError ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {batchError}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Daftar Rincian Sementara
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {batchItems.length} rincian siap disimpan
                </p>
              </div>

              {batchItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearBatch}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Hapus Semua
                </button>
              ) : null}
            </div>

            <div className="space-y-5 p-4 md:p-5">
              {batchItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Belum ada rincian. Isi Bagian 2 sampai 7, lalu tekan
                  “Tambahkan ke Daftar”.
                </div>
              ) : (
                ['Pengolahan', 'Pemasaran'].map((category) => {
                  const categoryItems = batchItems
                    .map((item, index) => ({
                      item,
                      index,
                    }))
                    .filter(
                      ({ item }) =>
                        normalizeKategori(item.kategori_kegiatan) ===
                        category,
                    );

                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {category}
                        </h3>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {categoryItems.length} rincian
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                              <th className="px-3 py-3">No</th>
                              <th className="px-3 py-3">Jenis Kegiatan</th>
                              <th className="px-3 py-3">Skala</th>
                              <th className="px-3 py-3 text-right">Unit</th>
                              <th className="px-3 py-3 text-right">Hasil Kg</th>
                              <th className="px-3 py-3 text-right">Nilai Rp</th>
                              <th className="px-3 py-3 text-center">Aksi</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border">
                            {categoryItems.map(({ item, index }, rowIndex) => (
                              <tr
                                key={`${getBatchCombinationKey(item)}-${index}`}
                                className={
                                  editingBatchIndex === index
                                    ? 'bg-primary/5'
                                    : ''
                                }
                              >
                                <td className="whitespace-nowrap px-3 py-3">
                                  {rowIndex + 1}
                                </td>
                                <td className="min-w-56 px-3 py-3 font-medium text-foreground">
                                  {item.jenis_kegiatan}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                  {item.skala_usaha}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-right">
                                  {Number(
                                    item.jumlah_unit_usaha || 0,
                                  ).toLocaleString('id-ID')}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-right">
                                  {Number(
                                    item.hasil_kg || 0,
                                  ).toLocaleString('id-ID')}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-right">
                                  {Number(
                                    item.hasil_rp || 0,
                                  ).toLocaleString('id-ID')}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-center">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleEditBatchItem(index)
                                      }
                                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteBatchItem(index)
                                      }
                                      className="rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      ) : null}

      {/* BUTTON FOOTER */}
      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Batal
        </button>

        {isBatchMode ? (
          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={isLoading || batchItems.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? 'Menyimpan Semua...'
              : `Simpan Semua Data (${batchItems.length})`}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        )}
      </div>
    </form>
  );
}