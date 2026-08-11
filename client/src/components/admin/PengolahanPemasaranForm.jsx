import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useMasterDataStore } from '@/store/masterDataStore';

const TAB_ITEMS = [
  { id: 'produksi', label: 'Unit dan Produksi' },
  { id: 'modal', label: 'Modal' },
  { id: 'dokumen', label: 'Sertifikat dan Izin' },
];

const INPUT_CLASS = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15';

const FORM_NAV_SELECTOR = '[data-form-nav="true"]:not(:disabled)';

const isElementVisible = element => {
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

const getElementCenter = element => {
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
    .filter(element => element !== currentElement && isElementVisible(element))
    .map(getElementCenter);

  const horizontalDirection = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  const directionalCandidates = candidates.filter(candidate => {
    const primaryDelta = horizontalDirection
      ? candidate.x - current.x
      : candidate.y - current.y;

    return primaryDelta * sign > 4;
  });

  if (!directionalCandidates.length) return null;

  const sameLineTolerance = horizontalDirection
    ? Math.max(current.rect.height * 1.5, 48)
    : Math.max(current.rect.width * 0.6, 110);

  const sameLineCandidates = directionalCandidates.filter(candidate => {
    const secondaryDelta = horizontalDirection
      ? Math.abs(candidate.y - current.y)
      : Math.abs(candidate.x - current.x);

    return secondaryDelta <= sameLineTolerance;
  });

  const pool = sameLineCandidates.length
    ? sameLineCandidates
    : directionalCandidates;

  return pool
    .map(candidate => {
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

const toNumber = value => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let text = String(value ?? '').trim().replace(/\s/g, '');
  if (!text) return 0;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  text = text.replace(/[^0-9.-]/g, '');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatInputNumber = value => {
  const raw = String(value ?? '').replace(/\./g, '').replace(/[^0-9,]/g, '');
  if (!raw) return '';
  const [integer = '', decimal = ''] = raw.split(',');
  const grouped = (integer.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return raw.includes(',') ? `${grouped},${decimal.slice(0, 2)}` : grouped;
};

const normalizeNumericMap = (options, source = {}) => Object.fromEntries(
  [...new Set([...(options || []), ...Object.keys(source || {})])].map(option => [
    option,
    source?.[option] === undefined || source?.[option] === null ? '' : formatInputNumber(source[option]),
  ]),
);

const normalizeDocs = (options, source = {}) => ({
  sertifikat_produk: normalizeNumericMap(options.sertifikatProduk, source?.sertifikat_produk),
  izin_usaha: normalizeNumericMap(options.izinUsaha, source?.izin_usaha),
  sertifikat_lahan_bangunan: normalizeNumericMap(options.sertifikatLB, source?.sertifikat_lahan_bangunan),
});

const emptyDetail = () => ({
  kategori_kegiatan: '',
  jenis_kegiatan: '',
  skala_usaha: '',
  jumlah_unit_usaha: '',
  hasil_kg: '',
  hasil_rp: '',
});

function NumericInput({ value, onChange, placeholder = '0' }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      data-form-nav="true"
      value={value}
      onChange={event => onChange(formatInputNumber(event.target.value))}
      placeholder={placeholder}
      className={`${INPUT_CLASS} text-right tabular-nums`}
    />
  );
}

function SearchableSingleSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchable = true,
  emptyMessage = 'Data tidak ditemukan.',
}) {
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options || [];
    return (options || []).filter(option =>
      String(option).toLowerCase().includes(keyword)
    );
  }, [options, query]);

  useEffect(() => {
    const handleOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filteredOptions.findIndex(option => option === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);

    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  useEffect(() => {
    if (highlightedIndex > filteredOptions.length - 1) {
      setHighlightedIndex(Math.max(filteredOptions.length - 1, 0));
    }
  }, [filteredOptions.length, highlightedIndex]);

  useEffect(() => {
    if (!open) return;

    const activeOption = containerRef.current?.querySelector(
      `[data-option-index="${highlightedIndex}"]`
    );

    if (activeOption instanceof HTMLElement) {
      activeOption.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [highlightedIndex, open, filteredOptions.length]);

  const choose = option => {
    onChange(option);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = event => {
    const nextKeys = ['ArrowDown', 'ArrowRight'];
    const previousKeys = ['ArrowUp', 'ArrowLeft'];

    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();

      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex(previous => {
        if (!filteredOptions.length) return 0;
        return previous >= filteredOptions.length - 1 ? 0 : previous + 1;
      });
      return;
    }

    if (previousKeys.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();

      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex(previous => {
        if (!filteredOptions.length) return 0;
        return previous <= 0 ? filteredOptions.length - 1 : previous - 1;
      });
      return;
    }

    if (event.key === 'Enter' && open && filteredOptions.length) {
      event.preventDefault();
      event.stopPropagation();
      choose(filteredOptions[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-form-nav="true"
        onClick={() => setOpen(previous => !previous)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[150] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {searchable ? (
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari..."
                  className="w-full rounded-xl border-0 bg-transparent py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ) : null}

          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => {
                const selected = option === value;
                const highlighted = index === highlightedIndex;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    data-option-index={index}
                    aria-selected={selected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      highlighted || selected
                        ? 'bg-primary/10 text-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{option}</span>
                    {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-5 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AmountMatrix({ title, options, values, onChange, prefix = 'Rp' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {options.map(option => (
          <div key={option} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
            <span className="text-sm font-medium text-foreground">{option}</span>
            <div className="flex items-center gap-2">
              {prefix ? <span className="text-xs font-semibold text-muted-foreground">{prefix}</span> : null}
              <NumericInput value={values?.[option] ?? ''} onChange={value => onChange(option, value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const createEmptyProductionMatrix = (jenisOptions, scaleOptions) => Object.fromEntries(
  (jenisOptions || []).map(jenis => [
    jenis,
    Object.fromEntries(
      (scaleOptions || []).map(skala => [
        skala,
        {
          jumlah_unit_usaha: '',
          hasil_kg: '',
          hasil_rp: '',
        },
      ]),
    ),
  ]),
);

const hydrateProductionMatrix = ({
  jenisOptions,
  scaleOptions,
  details,
  kategori,
}) => {
  const matrix = createEmptyProductionMatrix(jenisOptions, scaleOptions);

  (details || [])
    .filter(item => item?.kategori_kegiatan === kategori)
    .forEach(item => {
      const jenis = item?.jenis_kegiatan;
      const skala = item?.skala_usaha;

      if (!jenis || !skala) return;

      if (!matrix[jenis]) matrix[jenis] = {};
      if (!matrix[jenis][skala]) {
        matrix[jenis][skala] = {
          jumlah_unit_usaha: '',
          hasil_kg: '',
          hasil_rp: '',
        };
      }

      matrix[jenis][skala] = {
        jumlah_unit_usaha: formatInputNumber(item.jumlah_unit_usaha),
        hasil_kg: formatInputNumber(item.hasil_kg),
        hasil_rp: formatInputNumber(item.hasil_rp),
      };
    });

  return matrix;
};

const syncProductionMatrix = (current, jenisOptions, scaleOptions) => {
  const next = createEmptyProductionMatrix(jenisOptions, scaleOptions);

  Object.entries(current || {}).forEach(([jenis, scaleMap]) => {
    if (!next[jenis]) next[jenis] = {};

    Object.entries(scaleMap || {}).forEach(([skala, values]) => {
      if (!next[jenis][skala]) {
        next[jenis][skala] = {
          jumlah_unit_usaha: '',
          hasil_kg: '',
          hasil_rp: '',
        };
      }

      next[jenis][skala] = {
        jumlah_unit_usaha: values?.jumlah_unit_usaha ?? '',
        hasil_kg: values?.hasil_kg ?? '',
        hasil_rp: values?.hasil_rp ?? '',
      };
    });
  });

  return next;
};

function ProductionMatrix({
  title,
  jenisOptions,
  scaleOptions,
  matrix,
  field,
  onChange,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="sticky left-0 z-10 min-w-[220px] border-r border-border bg-card px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Jenis Kegiatan
              </th>
              {scaleOptions.map(skala => (
                <th
                  key={skala}
                  className="min-w-[150px] border-r border-border px-3 py-3 text-center text-xs font-semibold text-muted-foreground last:border-r-0"
                >
                  {skala}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {jenisOptions.length ? (
              jenisOptions.map(jenis => (
                <tr key={jenis} className="border-b border-border last:border-b-0">
                  <td className="sticky left-0 z-10 border-r border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
                    {jenis}
                  </td>

                  {scaleOptions.map(skala => (
                    <td
                      key={`${jenis}-${skala}`}
                      className="border-r border-border px-3 py-2.5 last:border-r-0"
                    >
                      <NumericInput
                        value={matrix?.[jenis]?.[skala]?.[field] ?? ''}
                        onChange={value => onChange(jenis, skala, field, value)}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Math.max(scaleOptions.length + 1, 1)}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Data jenis kegiatan belum tersedia di Master Data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PengolahanPemasaranForm({ initialData, isLoading = false, onSubmit, onCancel }) {
  const formRef = useRef(null);
  const errorRef = useRef(null);
  const { data: masterData, fetchMasterData, getOptions } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState('produksi');
  const [error, setError] = useState('');
  const [productionCategory, setProductionCategory] = useState('Pengolahan');

  useEffect(() => {
    if (!masterData.length) fetchMasterData();
  }, [masterData.length, fetchMasterData]);

  const options = useMemo(() => ({
    kabupaten: getOptions('KABUPATEN_KOTA'),
    pengolahan: getOptions('JENIS_PENGOLAHAN'),
    pemasaran: getOptions('JENIS_PEMASARAN'),
    skala: getOptions('KATEGORI_SKALA_USAHA'),
    sertifikatProduk: getOptions('SERTIFIKAT_PRODUK'),
    izinUsaha: getOptions('IZIN_USAHA'),
    sertifikatLB: getOptions('SERTIFIKAT_LAHAN_BANGUNAN'),
  }), [masterData, getOptions]);

  const allJenis = useMemo(() => [...options.pengolahan, ...options.pemasaran], [options.pengolahan, options.pemasaran]);

  const [tahun, setTahun] = useState(initialData?.tahun ? String(initialData.tahun) : String(new Date().getFullYear()));
  const [kabupaten, setKabupaten] = useState(initialData?.kabupaten_kota || '');

  const [pengolahanMatrix, setPengolahanMatrix] = useState(() =>
    hydrateProductionMatrix({
      jenisOptions: options.pengolahan,
      scaleOptions: options.skala,
      details: initialData?.details || [],
      kategori: 'Pengolahan',
    })
  );

  const [pemasaranMatrix, setPemasaranMatrix] = useState(() =>
    hydrateProductionMatrix({
      jenisOptions: options.pemasaran,
      scaleOptions: options.skala,
      details: initialData?.details || [],
      kategori: 'Pemasaran',
    })
  );

  const [modalJenis, setModalJenis] = useState(() => normalizeNumericMap(allJenis, initialData?.modal_by_jenis));
  const [modalSkala, setModalSkala] = useState(() => normalizeNumericMap(options.skala, initialData?.modal_by_skala));
  const [dokumen, setDokumen] = useState(() => normalizeDocs(options, initialData?.dokumen));

  useEffect(() => {
    setPengolahanMatrix(previous =>
      syncProductionMatrix(previous, options.pengolahan, options.skala)
    );

    setPemasaranMatrix(previous =>
      syncProductionMatrix(previous, options.pemasaran, options.skala)
    );

    setModalJenis(previous => ({ ...normalizeNumericMap(allJenis), ...previous }));
    setModalSkala(previous => ({ ...normalizeNumericMap(options.skala), ...previous }));
    setDokumen(previous => ({
      sertifikat_produk: { ...normalizeNumericMap(options.sertifikatProduk), ...(previous?.sertifikat_produk || {}) },
      izin_usaha: { ...normalizeNumericMap(options.izinUsaha), ...(previous?.izin_usaha || {}) },
      sertifikat_lahan_bangunan: { ...normalizeNumericMap(options.sertifikatLB), ...(previous?.sertifikat_lahan_bangunan || {}) },
    }));
  }, [allJenis, options.pengolahan, options.pemasaran, options.skala, options.sertifikatProduk, options.izinUsaha, options.sertifikatLB]);

  const updateProductionMatrix = (kategori, jenis, skala, field, value) => {
    const setter = kategori === 'Pemasaran'
      ? setPemasaranMatrix
      : setPengolahanMatrix;

    setter(previous => ({
      ...previous,
      [jenis]: {
        ...(previous?.[jenis] || {}),
        [skala]: {
          ...(previous?.[jenis]?.[skala] || {
            jumlah_unit_usaha: '',
            hasil_kg: '',
            hasil_rp: '',
          }),
          [field]: value,
        },
      },
    }));
  };

  const matrixToDetails = (kategori, matrix, jenisOptions, scaleOptions) => {
    const result = [];

    (jenisOptions || []).forEach(jenis => {
      (scaleOptions || []).forEach(skala => {
        const values = matrix?.[jenis]?.[skala] || {};
        const unit = toNumber(values.jumlah_unit_usaha);
        const kg = toNumber(values.hasil_kg);
        const rp = toNumber(values.hasil_rp);

        if (unit === 0 && kg === 0 && rp === 0) return;

        result.push({
          kategori_kegiatan: kategori,
          jenis_kegiatan: jenis,
          skala_usaha: skala,
          jumlah_unit_usaha: unit,
          hasil_kg: kg,
          hasil_rp: rp,
        });
      });
    });

    return result;
  };

  const details = useMemo(() => ([
    ...matrixToDetails('Pengolahan', pengolahanMatrix, options.pengolahan, options.skala),
    ...matrixToDetails('Pemasaran', pemasaranMatrix, options.pemasaran, options.skala),
  ]), [pengolahanMatrix, pemasaranMatrix, options.pengolahan, options.pemasaran, options.skala]);

  const totals = useMemo(() => ({
    unit: details.reduce((sum, item) => sum + toNumber(item.jumlah_unit_usaha), 0),
    kg: details.reduce((sum, item) => sum + toNumber(item.hasil_kg), 0),
    rp: details.reduce((sum, item) => sum + toNumber(item.hasil_rp), 0),
    modalJenis: Object.values(modalJenis).reduce((sum, value) => sum + toNumber(value), 0),
    modalSkala: Object.values(modalSkala).reduce((sum, value) => sum + toNumber(value), 0),
  }), [details, modalJenis, modalSkala]);

  const validate = () => {
    if (!tahun || Number(tahun) < 1900) return 'Tahun wajib diisi dengan benar.';
    if (!kabupaten) return 'Kab/Kota wajib dipilih.';
    if (!details.length) return 'Isi minimal satu nilai pada matriks Unit dan Produksi.';
    return '';
  };

  const submit = () => {
    const validation = validate();
    if (validation) {
      setError(validation);

      if (validation.includes('matriks Unit dan Produksi')) {
        setActiveTab('produksi');
      }

      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });

      return;
    }

    setError('');

    if (typeof onSubmit !== 'function') {
      setError('Proses simpan tidak tersedia. Muat ulang halaman lalu coba kembali.');
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
      return;
    }

    onSubmit({
      tahun: Number(tahun),
      kabupaten_kota: kabupaten,
      details,
      modal_by_jenis: Object.fromEntries(Object.entries(modalJenis).map(([key, value]) => [key, toNumber(value)])),
      modal_by_skala: Object.fromEntries(Object.entries(modalSkala).map(([key, value]) => [key, toNumber(value)])),
      dokumen: Object.fromEntries(Object.entries(dokumen).map(([group, values]) => [group, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, toNumber(value)]))])),
    });
  };

  const currentIndex = TAB_ITEMS.findIndex(item => item.id === activeTab);
  const goNext = () => setActiveTab(TAB_ITEMS[Math.min(currentIndex + 1, TAB_ITEMS.length - 1)].id);
  const goPrev = () => setActiveTab(TAB_ITEMS[Math.max(currentIndex - 1, 0)].id);

  const handleArrowNavigation = event => {
    if (
      event.key === 'Enter' &&
      (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

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
      ['text', 'number'].includes(targetElement.type)
    ) {
      requestAnimationFrame(() => targetElement.select());
    }
  };

  return (
    <div
      ref={formRef}
      onKeyDown={handleArrowNavigation}
      className="space-y-6"
    >
      <div className="relative rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute right-5 top-5 z-10 inline-flex h-8 w-8 items-center justify-center text-slate-700 transition-opacity hover:opacity-60 dark:text-slate-200 disabled:opacity-40"
          title="Tutup form"
          aria-label="Tutup form"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="grid grid-cols-1 gap-4 pr-10 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tahun <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              data-form-nav="true"
              min="1900"
              max="2100"
              required
              value={tahun}
              onChange={event => setTahun(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Kab/Kota <span className="text-rose-500">*</span>
            </label>
            <SearchableSingleSelect
              value={kabupaten}
              onChange={setKabupaten}
              options={options.kabupaten}
              placeholder="Pilih Kab/Kota"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2">
        {TAB_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          ref={errorRef}
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600"
        >
          {error}
        </div>
      ) : null}

      {activeTab === 'produksi' ? (
        <div className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Unit Usaha dan Produksi</h2>
          </div>

          <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1">
            {['Pengolahan', 'Pemasaran'].map(kategori => (
              <button
                key={kategori}
                type="button"
                onClick={() => setProductionCategory(kategori)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  productionCategory === kategori
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {kategori}
              </button>
            ))}
          </div>

          <ProductionMatrix
            title="Jumlah Unit Usaha"
            jenisOptions={
              productionCategory === 'Pemasaran'
                ? options.pemasaran
                : options.pengolahan
            }
            scaleOptions={options.skala}
            matrix={
              productionCategory === 'Pemasaran'
                ? pemasaranMatrix
                : pengolahanMatrix
            }
            field="jumlah_unit_usaha"
            onChange={(jenis, skala, field, value) =>
              updateProductionMatrix(
                productionCategory,
                jenis,
                skala,
                field,
                value,
              )
            }
          />

          <ProductionMatrix
            title="Hasil Produksi (Kg)"
            jenisOptions={
              productionCategory === 'Pemasaran'
                ? options.pemasaran
                : options.pengolahan
            }
            scaleOptions={options.skala}
            matrix={
              productionCategory === 'Pemasaran'
                ? pemasaranMatrix
                : pengolahanMatrix
            }
            field="hasil_kg"
            onChange={(jenis, skala, field, value) =>
              updateProductionMatrix(
                productionCategory,
                jenis,
                skala,
                field,
                value,
              )
            }
          />

          <ProductionMatrix
            title="Nilai Produksi (Rp)"
            jenisOptions={
              productionCategory === 'Pemasaran'
                ? options.pemasaran
                : options.pengolahan
            }
            scaleOptions={options.skala}
            matrix={
              productionCategory === 'Pemasaran'
                ? pemasaranMatrix
                : pengolahanMatrix
            }
            field="hasil_rp"
            onChange={(jenis, skala, field, value) =>
              updateProductionMatrix(
                productionCategory,
                jenis,
                skala,
                field,
                value,
              )
            }
          />
        </div>
      ) : null}

      {activeTab === 'modal' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <AmountMatrix title="Investasi Modal berdasarkan Jenis Kegiatan" options={allJenis} values={modalJenis} onChange={(key, value) => setModalJenis(previous => ({ ...previous, [key]: value }))} />
            <AmountMatrix title="Investasi Modal berdasarkan Skala Usaha" options={options.skala} values={modalSkala} onChange={(key, value) => setModalSkala(previous => ({ ...previous, [key]: value }))} />
          </div>

          {totals.modalJenis > 0 && totals.modalSkala > 0 && totals.modalJenis !== totals.modalSkala ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Catatan: total modal menurut Jenis Kegiatan ({totals.modalJenis.toLocaleString('id-ID')}) berbeda dengan total menurut Skala ({totals.modalSkala.toLocaleString('id-ID')}). Data tetap bisa disimpan, tetapi sebaiknya dicek kembali bila keduanya merupakan dua distribusi dari total modal yang sama.
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'dokumen' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <AmountMatrix title="Sertifikat Produk" options={options.sertifikatProduk} values={dokumen.sertifikat_produk} prefix="Jumlah" onChange={(key, value) => setDokumen(previous => ({ ...previous, sertifikat_produk: { ...previous.sertifikat_produk, [key]: value } }))} />
            <AmountMatrix title="Izin Usaha" options={options.izinUsaha} values={dokumen.izin_usaha} prefix="Jumlah" onChange={(key, value) => setDokumen(previous => ({ ...previous, izin_usaha: { ...previous.izin_usaha, [key]: value } }))} />
            <AmountMatrix title="Sertifikat Lahan dan Bangunan" options={options.sertifikatLB} values={dokumen.sertifikat_lahan_bangunan} prefix="Jumlah" onChange={(key, value) => setDokumen(previous => ({ ...previous, sertifikat_lahan_bangunan: { ...previous.sertifikat_lahan_bangunan, [key]: value } }))} />
          </div>
        </div>
      ) : null}

      {activeTab === 'dokumen' && error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onCancel} disabled={isLoading} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">
          Batal
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">
          {currentIndex > 0 ? (
            <button type="button" onClick={goPrev} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Sebelumnya
            </button>
          ) : null}

          {currentIndex < TAB_ITEMS.length - 1 ? (
            <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Selanjutnya
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={() => submit()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initialData ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
