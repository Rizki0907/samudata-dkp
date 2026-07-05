import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Loader2, Plus, Save, MapPin, TrendingUp, Factory, Box, LineChart, Users, Filter } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';

// Registrasi peta Jawa Timur (aman dipanggil berkali-kali)
echarts.registerMap('jawa_timur', geoJsonData);

const KABUPATEN_KOTA_OPTIONS = [
  'KAB. PACITAN',
  'KAB. PONOROGO',
  'KAB. TRENGGALEK',
  'KAB. TULUNGAGUNG',
  'KAB. BLITAR',
  'KAB. KEDIRI',
  'KAB. MALANG',
  'KAB. LUMAJANG',
  'KAB. JEMBER',
  'KAB. BANYUWANGI',
  'KAB. BONDOWOSO',
  'KAB. SITUBONDO',
  'KAB. PROBOLINGGO',
  'KAB. PASURUAN',
  'KAB. SIDOARJO',
  'KAB. MOJOKERTO',
  'KAB. JOMBANG',
  'KAB. NGANJUK',
  'KAB. MADIUN',
  'KAB. MAGETAN',
  'KAB. NGAWI',
  'KAB. BOJONEGORO',
  'KAB. TUBAN',
  'KAB. LAMONGAN',
  'KAB. GRESIK',
  'KAB. BANGKALAN',
  'KAB. SAMPANG',
  'KAB. PAMEKASAN',
  'KAB. SUMENEP',
  'KOTA KEDIRI',
  'KOTA BLITAR',
  'KOTA MALANG',
  'KOTA PROBOLINGGO',
  'KOTA PASURUAN',
  'KOTA MOJOKERTO',
  'KOTA MADIUN',
  'KOTA SURABAYA',
  'KOTA BATU',
];

const JENIS_PENGOLAHAN_OPTIONS = [
  'Fermentasi',
  'Pelumatan Daging Ikan',
  'Pembekuan',
  'Pemindangan',
  'Penanganan Produk Segar',
  'Pengalengan',
  'Pengasapan/Pemanggangan',
  'Pereduksian/Ekstraksi',
  'Penggaraman/Pengeringan',
  'Pengolahan Lainnya',
];

const JENIS_PEMASARAN_OPTIONS = [
  'Pengecer',
  'Pengumpul/Pedagang Besar/Distributor',
];

const PERIZINAN_OPTIONS = [
  'NIB',
  'KUSUKA',
  'NPWP',
  'Pengesahan MENKUMHAM',
  'Akta Pendirian Usaha',
  'SIUP Perikanan',
  'SIUP Perdagangan',
  'Tidak Berizin',
];

const SERTIFIKAT_BANGUNAN_OPTIONS = ['IMB/PBG', 'Lokasi/Domisili', 'Tidak Ada'];
const SERTIFIKAT_PRODUK_OPTIONS = ['SKP', 'HALAL', 'SNI', 'HACCP', 'MD'];
const STATUS_COLD_STORAGE_OPTIONS = ['Milik Pribadi', 'Sewa', 'Tidak Ada'];
const PEMBERI_PINJAMAN_OPTIONS = ['Bank', 'Koperasi', 'Lainnya'];
const BULAN_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground';

const FILTER_SELECT_CLASS =
  'w-full rounded-full border border-border bg-card px-5 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10';

const NUMERIC_FIELDS = [
  'tahun',
  'tahun_berdiri',
  'nilai_aset_rp',
  'cold_storage_kg',
  'aset_cold_storage_rp',
  'luas_lahan_m2',
  'nilai_lahan_rp',
  'luas_bangunan_m2',
  'nilai_bangunan_rp',
  'biaya_sewa_per_tahun_rp',
  'jumlah_modal_sendiri_rp',
  'jumlah_laba_ditanam_rp',
  'jumlah_pinjaman_rp',
  'tenor_pinjaman_tahun',
  'biaya_produksi_per_periode_rp',
  'biaya_lain_lain_per_periode_rp',
  'hasil_produksi_per_periode_kg',
  'kapasitas_per_periode_kg',
  'harga_jual_rp_kg',
  'jumlah_total_bulan_produksi_per_tahun',
  'jumlah_hari_produksi_per_bulan',
  'total_bahan_baku_per_periode_kg',
  'total_pemasaran_per_tahun_kg',
  'pasar_dalam_kota_kab_per_tahun_kg',
  'pasar_kota_dalam_jatim_per_tahun_kg',
  'pasar_luar_jatim_per_tahun_kg',
  'pasar_luar_negeri_per_tahun_kg',
  'tenaga_kerja_tetap_laki_laki',
  'tenaga_kerja_tetap_perempuan',
  'tenaga_kerja_tidak_tetap_laki_laki',
  'tenaga_kerja_tidak_tetap_perempuan',
  'tenaga_kerja_keluarga_laki_laki',
  'tenaga_kerja_keluarga_perempuan',
  'tenaga_kerja_tetap_laki_laki_2',
  'tenaga_kerja_tetap_perempuan_2',
  'tenaga_kerja_tidak_tetap_laki_laki_2',
  'tenaga_kerja_tidak_tetap_perempuan_2',
];

const TENAGA_KERJA_FIELDS = [
  'tenaga_kerja_tetap_laki_laki',
  'tenaga_kerja_tetap_perempuan',
  'tenaga_kerja_tidak_tetap_laki_laki',
  'tenaga_kerja_tidak_tetap_perempuan',
  'tenaga_kerja_keluarga_laki_laki',
  'tenaga_kerja_keluarga_perempuan',
  'tenaga_kerja_tetap_laki_laki_2',
  'tenaga_kerja_tetap_perempuan_2',
  'tenaga_kerja_tidak_tetap_laki_laki_2',
  'tenaga_kerja_tidak_tetap_perempuan_2',
];

const GROUPED_NUMERIC_FIELDS = new Set(
  NUMERIC_FIELDS.filter(key => !['tahun', 'tahun_berdiri'].includes(key)),
);

const formatNumericInputValue = value => {
  const raw = String(value ?? '')
    .replace(/\./g, '')
    .replace(/[^0-9,]/g, '');

  if (!raw) return '';

  const [integerPart = '', ...decimalParts] = raw.split(',');
  const cleanInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const groupedInteger = cleanInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalParts.length === 0) return groupedInteger;

  const decimalPart = decimalParts.join('').slice(0, 2);
  return `${groupedInteger},${decimalPart}`;
};

const formatInitialNumericValue = value => {
  if (value === '' || value === null || value === undefined) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('id-ID', {
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  }

  const raw = String(value).trim();
  if (!raw) return '';

  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('id-ID', {
        maximumFractionDigits: 2,
        useGrouping: true,
      });
    }
  }

  return formatNumericInputValue(raw);
};

const toNumber = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let normalized = String(value ?? '').trim().replace(/\s/g, '');
  if (!normalized) return 0;

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }

  normalized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberOrNull = value => {
  if (value === '' || value === null || value === undefined) return null;
  return toNumber(value);
};

const toArray = value => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const normalizePinjaman = value => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (['YA', 'ADA'].includes(normalized)) return 'Ya';
  if (['TIDAK', 'TIDAK ADA'].includes(normalized)) return 'Tidak';
  return '';
};

const createInitialForm = initialData => {
  const form = {
  tahun: initialData?.tahun ?? '',
  jenis_kegiatan: initialData?.jenis_kegiatan ?? '',
  skala_usaha: initialData?.skala_usaha ?? '',
  jenis_kegiatan_pengolahan: initialData?.jenis_kegiatan_pengolahan ?? '',
  jenis_kegiatan_pemasaran: initialData?.jenis_kegiatan_pemasaran ?? '',

  nama_upi: initialData?.nama_upi ?? '',
  alamat: initialData?.alamat ?? '',
  desa: initialData?.desa ?? '',
  kecamatan: initialData?.kecamatan ?? '',
  kabupaten_kota: initialData?.kabupaten_kota ?? '',
  nomor_telepon: initialData?.nomor_telepon ?? '',
  tahun_berdiri: initialData?.tahun_berdiri ?? '',

  perizinan: toArray(initialData?.perizinan),
  nama_pemilik: initialData?.nama_pemilik ?? '',
  jenis_kelamin: initialData?.jenis_kelamin ?? '',
  alamat_2: initialData?.alamat_2 ?? '',
  desa_2: initialData?.desa_2 ?? '',
  kecamatan_2: initialData?.kecamatan_2 ?? '',
  kabupaten_kota_2: initialData?.kabupaten_kota_2 ?? '',
  nomor_telepon_2: initialData?.nomor_telepon_2 ?? '',

  nilai_aset_rp: initialData?.nilai_aset_rp ?? '',
  cold_storage_kg: initialData?.cold_storage_kg ?? '',
  status_cold_storage: initialData?.status_cold_storage ?? '',
  aset_cold_storage_rp: initialData?.aset_cold_storage_rp ?? '',
  status_lahan_usaha: initialData?.status_lahan_usaha ?? '',
  sertifikat_lahan: initialData?.sertifikat_lahan ?? '',
  luas_lahan_m2: initialData?.luas_lahan_m2 ?? '',
  nilai_lahan_rp: initialData?.nilai_lahan_rp ?? '',
  sertifikat_bangunan: toArray(initialData?.sertifikat_bangunan),
  luas_bangunan_m2: initialData?.luas_bangunan_m2 ?? '',
  nilai_bangunan_rp: initialData?.nilai_bangunan_rp ?? '',
  biaya_sewa_per_tahun_rp: initialData?.biaya_sewa_per_tahun_rp ?? '',

  jumlah_modal_sendiri_rp: initialData?.jumlah_modal_sendiri_rp ?? '',
  jumlah_laba_ditanam_rp: initialData?.jumlah_laba_ditanam_rp ?? '',
  pinjaman_modal: normalizePinjaman(initialData?.pinjaman_modal),
  jumlah_pinjaman_rp: initialData?.jumlah_pinjaman_rp ?? '',
  pemberi_pinjaman: initialData?.pemberi_pinjaman ?? '',
  tanggal_akad_pinjaman: initialData?.tanggal_akad_pinjaman
    ? String(initialData.tanggal_akad_pinjaman).slice(0, 10)
    : '',
  tenor_pinjaman_tahun: initialData?.tenor_pinjaman_tahun ?? '',

  nama_merek: initialData?.nama_merek ?? '',
  jenis_produk: initialData?.jenis_produk ?? '',
  sertifikat_umum: toArray(initialData?.sertifikat_umum ?? initialData?.sertifikat_produk),
  sertifikat_bpom: initialData?.sertifikat_bpom ?? '',
  periode_produksi: initialData?.periode_produksi ?? '',

  biaya_produksi_per_periode_rp: initialData?.biaya_produksi_per_periode_rp ?? '',
  biaya_lain_lain_per_periode_rp: initialData?.biaya_lain_lain_per_periode_rp ?? '',
  hasil_produksi_per_periode_kg: initialData?.hasil_produksi_per_periode_kg ?? '',
  kapasitas_per_periode_kg: initialData?.kapasitas_per_periode_kg ?? '',
  harga_jual_rp_kg: initialData?.harga_jual_rp_kg ?? '',
  bulan_produksi: toArray(initialData?.bulan_produksi),
  jumlah_total_bulan_produksi_per_tahun:
    initialData?.jumlah_total_bulan_produksi_per_tahun ?? '',
  jumlah_hari_produksi_per_bulan: initialData?.jumlah_hari_produksi_per_bulan ?? '',

  nama_bahan_baku: initialData?.nama_bahan_baku ?? '',
  total_bahan_baku_per_periode_kg: initialData?.total_bahan_baku_per_periode_kg ?? '',
  asal_bahan_baku_kabupaten_kota: initialData?.asal_bahan_baku_kabupaten_kota ?? '',
  provinsi_asal_bahan_baku: initialData?.provinsi_asal_bahan_baku ?? '',
  asal_negara_bahan_baku: initialData?.asal_negara_bahan_baku ?? '',
  total_pemasaran_per_tahun_kg: initialData?.total_pemasaran_per_tahun_kg ?? '',
  pasar_dalam_kota_kab_per_tahun_kg:
    initialData?.pasar_dalam_kota_kab_per_tahun_kg ?? '',
  pasar_kota_dalam_jatim_per_tahun_kg:
    initialData?.pasar_kota_dalam_jatim_per_tahun_kg ?? '',
  pasar_luar_jatim_per_tahun_kg: initialData?.pasar_luar_jatim_per_tahun_kg ?? '',
  pasar_luar_negeri_per_tahun_kg:
    initialData?.pasar_luar_negeri_per_tahun_kg ?? '',
  tujuan_pemasaran_kabupaten_kota:
    initialData?.tujuan_pemasaran_kabupaten_kota ?? '',
  provinsi_tujuan_pemasaran: initialData?.provinsi_tujuan_pemasaran ?? '',
  negara_tujuan_pemasaran: initialData?.negara_tujuan_pemasaran ?? '',

  tenaga_kerja_tetap_laki_laki: initialData?.tenaga_kerja_tetap_laki_laki ?? '',
  tenaga_kerja_tetap_perempuan: initialData?.tenaga_kerja_tetap_perempuan ?? '',
  tenaga_kerja_tidak_tetap_laki_laki:
    initialData?.tenaga_kerja_tidak_tetap_laki_laki ?? '',
  tenaga_kerja_tidak_tetap_perempuan:
    initialData?.tenaga_kerja_tidak_tetap_perempuan ?? '',
  tenaga_kerja_keluarga_laki_laki:
    initialData?.tenaga_kerja_keluarga_laki_laki ?? '',
  tenaga_kerja_keluarga_perempuan:
    initialData?.tenaga_kerja_keluarga_perempuan ?? '',
  tenaga_kerja_tetap_laki_laki_2:
    initialData?.tenaga_kerja_tetap_laki_laki_2 ?? '',
  tenaga_kerja_tetap_perempuan_2:
    initialData?.tenaga_kerja_tetap_perempuan_2 ?? '',
  tenaga_kerja_tidak_tetap_laki_laki_2:
    initialData?.tenaga_kerja_tidak_tetap_laki_laki_2 ?? '',
  tenaga_kerja_tidak_tetap_perempuan_2:
    initialData?.tenaga_kerja_tidak_tetap_perempuan_2 ?? '',
  };

  GROUPED_NUMERIC_FIELDS.forEach(key => {
    form[key] = formatInitialNumericValue(form[key]);
  });

  return form;
};

function StatusBadge({ status, alasan }) {
  let colorClass = 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600';
  let label = 'PENDING';

  if (status === 'APPROVED') {
    colorClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600';
    label = 'APPROVED (PROGRAM)';
  } else if (status === 'APPROVED_BIDANG') {
    colorClass = 'border-blue-500/20 bg-blue-500/10 text-blue-600';
    label = 'APPROVED (BIDANG)';
  } else if (status === 'REJECTED') {
    colorClass = 'border-rose-500/20 bg-rose-500/10 text-rose-600';
    label = 'REJECTED';
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
        {label}
      </span>
      {status === 'REJECTED' && alasan ? (
        <span className="cursor-help text-xs text-rose-500" title={`Alasan: ${alasan}`}>
          (?)
        </span>
      ) : null}
    </div>
  );
}

function SectionCard({ number, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/35 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          {number ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {number}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex min-h-8 items-center">
              <h2 className="font-heading text-base font-semibold leading-none text-foreground">
                {title}
              </h2>
            </div>
            {description ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required = true,
  disabled = false,
  readOnly = false,
  className = '',
  helpText,
  maxLength,
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required && !disabled && !readOnly}
        disabled={disabled}
        readOnly={readOnly}
        className={INPUT_CLASS}
      />
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  required = true,
  className = '',
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={onChange}
          required={required}
          className={`${INPUT_CLASS} appearance-none pr-10`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
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

function ChoiceButtons({ label, value, options, onChange, required = true, columns = 2 }) {
  const gridClass = columns === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2';

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </div>
      <div className={`grid grid-cols-1 gap-2 ${gridClass}`}>
        {options.map(option => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup({ label, values, options, onToggle, columns = 3, helpText, required = true }) {
  const gridClass =
    columns === 4
      ? 'sm:grid-cols-2 xl:grid-cols-4'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </div>
      <div className={`grid grid-cols-1 gap-2 ${gridClass}`}>
        {options.map(option => {
          const checked = values.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                checked
                  ? 'border-primary/50 bg-primary/5 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/30'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
    </div>
  );
}

function ReadOnlyMetric({ label, value, suffix = '' }) {
  const displayValue = `${Number(value || 0).toLocaleString('id-ID')}${suffix}`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        readOnly
        disabled
        className="w-full cursor-not-allowed rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-100"
      />
    </div>
  );
}

function PengolahanPemasaranForm({ initialData, isLoading, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => createInitialForm(initialData));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setForm(createInitialForm(initialData));
    setFormError('');
  }, [initialData]);

  const setValue = key => event => {
    const rawValue = event.target.value;

    const nextValue = GROUPED_NUMERIC_FIELDS.has(key)
      ? formatNumericInputValue(rawValue)
      : ['tahun', 'tahun_berdiri'].includes(key)
        ? rawValue.replace(/\D/g, '').slice(0, 4)
        : rawValue;

    setForm(previous => ({ ...previous, [key]: nextValue }));
  };

  const setUppercase = key => event => {
    setForm(previous => ({ ...previous, [key]: event.target.value.toUpperCase() }));
  };

  const setChoice = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const handleJenisKegiatan = value => {
    setForm(previous => ({
      ...previous,
      jenis_kegiatan: value,
      jenis_kegiatan_pengolahan:
        value === 'Pengolahan' ? previous.jenis_kegiatan_pengolahan : '',
      jenis_kegiatan_pemasaran:
        value === 'Pemasaran' ? previous.jenis_kegiatan_pemasaran : '',
    }));
  };

  const handlePinjamanModal = value => {
    setForm(previous => ({
      ...previous,
      pinjaman_modal: value,
      ...(value === 'Tidak'
        ? {
            jumlah_pinjaman_rp: '',
            pemberi_pinjaman: '',
            tanggal_akad_pinjaman: '',
            tenor_pinjaman_tahun: '',
          }
        : {}),
    }));
  };

  const toggleArrayValue = (key, option, exclusiveOption) => {
    setForm(previous => {
      const current = previous[key];
      const alreadySelected = current.includes(option);
      let next;

      if (option === exclusiveOption) {
        next = alreadySelected ? [] : [option];
      } else {
        next = alreadySelected
          ? current.filter(item => item !== option)
          : [...current.filter(item => item !== exclusiveOption), option];
      }

      return { ...previous, [key]: next };
    });
  };

  const productionMetrics = useMemo(() => {
    const totalBulan = toNumber(form.jumlah_total_bulan_produksi_per_tahun);
    const hariPerBulan = toNumber(form.jumlah_hari_produksi_per_bulan);
    const multiplier =
      form.periode_produksi === 'Harian'
        ? totalBulan * hariPerBulan
        : form.periode_produksi === 'Bulanan'
          ? totalBulan
          : 0;

    const biayaProduksiPerTahun =
      toNumber(form.biaya_produksi_per_periode_rp) * multiplier;
    const kapasitasPerTahun = toNumber(form.kapasitas_per_periode_kg) * multiplier;
    const hasilProduksiPerTahun =
      toNumber(form.hasil_produksi_per_periode_kg) * multiplier;
    const nilaiHasilProduksiPerTahun =
      hasilProduksiPerTahun * toNumber(form.harga_jual_rp_kg);

    return {
      multiplier,
      biaya_produksi_per_tahun_rp: biayaProduksiPerTahun,
      kapasitas_per_tahun_kg: kapasitasPerTahun,
      hasil_produksi_per_tahun_kg: hasilProduksiPerTahun,
      nilai_hasil_produksi_per_tahun_rp: nilaiHasilProduksiPerTahun,
    };
  }, [
    form.biaya_produksi_per_periode_rp,
    form.hasil_produksi_per_periode_kg,
    form.harga_jual_rp_kg,
    form.jumlah_hari_produksi_per_bulan,
    form.jumlah_total_bulan_produksi_per_tahun,
    form.kapasitas_per_periode_kg,
    form.periode_produksi,
  ]);

  const totalTenagaKerja = useMemo(
    () => TENAGA_KERJA_FIELDS.reduce((total, key) => total + toNumber(form[key]), 0),
    [form],
  );

  const validateRequiredFields = () => {
    const requiredTextFields = [
      ['Tahun', form.tahun],
      ['Kabupaten/Kota', form.kabupaten_kota],
      ['Kecamatan', form.kecamatan],
      ['Desa/Kelurahan', form.desa],
      ['Alamat Detail', form.alamat],
      ['Nama UPI', form.nama_upi],
      ['Nomor Telepon', form.nomor_telepon],
      ['Tahun Berdiri', form.tahun_berdiri],
      ['Nama Pemilik', form.nama_pemilik],
      ['Jenis Kelamin', form.jenis_kelamin],
      ['Nomor Telepon Pemilik', form.nomor_telepon_2],
      ['Kabupaten 2', form.kabupaten_kota_2],
      ['Kecamatan 2', form.kecamatan_2],
      ['Desa 2', form.desa_2],
      ['Alamat Detail 2', form.alamat_2],
      ['Nilai Aset', form.nilai_aset_rp],
      ['Cold Storage', form.cold_storage_kg],
      ['Status Cold Storage', form.status_cold_storage],
      ['Aset Cold Storage', form.aset_cold_storage_rp],
      ['Sertifikat Lahan', form.sertifikat_lahan],
      ['Status Lahan Usaha', form.status_lahan_usaha],
      ['Luas Lahan', form.luas_lahan_m2],
      ['Nilai Lahan', form.nilai_lahan_rp],
      ['Biaya Sewa Per Tahun', form.biaya_sewa_per_tahun_rp],
      ['Luas Bangunan', form.luas_bangunan_m2],
      ['Nilai Bangunan', form.nilai_bangunan_rp],
      ['Jumlah Modal Sendiri', form.jumlah_modal_sendiri_rp],
      ['Jumlah Laba Ditanam', form.jumlah_laba_ditanam_rp],
      ['Pinjaman Modal', form.pinjaman_modal],
      ['Nama Merek', form.nama_merek],
      ['Jenis Produk', form.jenis_produk],
      ['Sertifikat BPOM', form.sertifikat_bpom],
      ['Periode Produksi', form.periode_produksi],
      ['Biaya Produksi Per Periode', form.biaya_produksi_per_periode_rp],
      ['Biaya Lain-Lain Per Periode', form.biaya_lain_lain_per_periode_rp],
      ['Hasil Produksi Per Periode', form.hasil_produksi_per_periode_kg],
      ['Kapasitas Per Periode', form.kapasitas_per_periode_kg],
      ['Harga Jual', form.harga_jual_rp_kg],
      ['Jumlah Total Bulan Produksi Per Tahun', form.jumlah_total_bulan_produksi_per_tahun],
      ['Nama Bahan Baku', form.nama_bahan_baku],
      ['Total Bahan Baku Per Periode', form.total_bahan_baku_per_periode_kg],
      ['Asal Bahan Baku Kabupaten/Kota', form.asal_bahan_baku_kabupaten_kota],
      ['Provinsi Asal Bahan Baku', form.provinsi_asal_bahan_baku],
      ['Asal Negara Bahan Baku', form.asal_negara_bahan_baku],
      ['Total Pemasaran Per Tahun', form.total_pemasaran_per_tahun_kg],
      ['Pasar Dalam Kota/Kab Per Tahun', form.pasar_dalam_kota_kab_per_tahun_kg],
      ['Pasar Kota Dalam Jatim Per Tahun', form.pasar_kota_dalam_jatim_per_tahun_kg],
      ['Pasar Luar Jatim Per Tahun', form.pasar_luar_jatim_per_tahun_kg],
      ['Pasar Luar Negeri Per Tahun', form.pasar_luar_negeri_per_tahun_kg],
      ['Tujuan Pemasaran Kabupaten/Kota', form.tujuan_pemasaran_kabupaten_kota],
      ['Provinsi Tujuan Pemasaran', form.provinsi_tujuan_pemasaran],
      ['Negara Tujuan Pemasaran', form.negara_tujuan_pemasaran],
      ['Tenaga Kerja Tetap Laki-Laki', form.tenaga_kerja_tetap_laki_laki],
      ['Tenaga Kerja Tetap Perempuan', form.tenaga_kerja_tetap_perempuan],
      ['Tenaga Kerja Tidak Tetap Laki-Laki', form.tenaga_kerja_tidak_tetap_laki_laki],
      ['Tenaga Kerja Tidak Tetap Perempuan', form.tenaga_kerja_tidak_tetap_perempuan],
      ['Tenaga Kerja Keluarga Laki-Laki', form.tenaga_kerja_keluarga_laki_laki],
      ['Tenaga Kerja Keluarga Perempuan', form.tenaga_kerja_keluarga_perempuan],
      ['Tenaga Kerja Tetap 2 Laki-Laki', form.tenaga_kerja_tetap_laki_laki_2],
      ['Tenaga Kerja Tetap 2 Perempuan', form.tenaga_kerja_tetap_perempuan_2],
      ['Tenaga Kerja Tidak Tetap 2 Laki-Laki', form.tenaga_kerja_tidak_tetap_laki_laki_2],
      ['Tenaga Kerja Tidak Tetap 2 Perempuan', form.tenaga_kerja_tidak_tetap_perempuan_2],
    ];

    if (form.periode_produksi !== 'Bulanan') {
      requiredTextFields.push(['Jumlah Hari Produksi Per Bulan', form.jumlah_hari_produksi_per_bulan]);
    }

    if (form.pinjaman_modal === 'Ya') {
      requiredTextFields.push(
        ['Jumlah Pinjaman', form.jumlah_pinjaman_rp],
        ['Pemberi Pinjaman', form.pemberi_pinjaman],
        ['Tanggal Akad Pinjaman', form.tanggal_akad_pinjaman],
        ['Tenor Pinjaman', form.tenor_pinjaman_tahun],
      );
    }

    const emptyField = requiredTextFields.find(([, value]) => String(value ?? '').trim() === '');
    if (emptyField) return `${emptyField[0]} wajib diisi.`;

    if (!/^\d{4}$/.test(String(form.tahun))) {
      return 'Tahun wajib diisi 4 angka, contoh 2026.';
    }

    if (form.tahun_berdiri && !/^\d{4}$/.test(String(form.tahun_berdiri))) {
      return 'Tahun Berdiri wajib diisi 4 angka, contoh 2020.';
    }

    if (!form.perizinan.length) return 'Sertifikat Perizinan Usaha wajib dipilih.';
    if (!form.sertifikat_bangunan.length) return 'Sertifikat Bangunan wajib dipilih.';
    if (!form.sertifikat_umum.length) return 'Sertifikat Produk wajib dipilih.';
    if (!form.bulan_produksi.length) return 'Bulan Produksi wajib dipilih.';

    return '';
  };

  const handleSubmit = event => {
    event.preventDefault();

    const requiredMessage = validateRequiredFields();
    if (requiredMessage) {
      setFormError(requiredMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!form.jenis_kegiatan || !form.skala_usaha) {
      setFormError('Jenis kegiatan dan skala usaha wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      form.jenis_kegiatan === 'Pengolahan' &&
      !form.jenis_kegiatan_pengolahan
    ) {
      setFormError('Jenis pengolahan wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      form.jenis_kegiatan === 'Pemasaran' &&
      !form.jenis_kegiatan_pemasaran
    ) {
      setFormError('Jenis pemasaran wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormError('');

    const payload = {
      ...form,
      ...productionMetrics,
      total_seluruh_tenaga_kerja: totalTenagaKerja,
      perizinan: form.perizinan.join(', '),
      sertifikat_bangunan: form.sertifikat_bangunan.join(', '),
      sertifikat_umum: form.sertifikat_umum.join(', '),
      bulan_produksi: form.bulan_produksi.join(', '),
    };

    NUMERIC_FIELDS.forEach(key => {
      payload[key] = numberOrNull(form[key]);
    });

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {formError}
        </div>
      ) : null}

      <SectionCard
        title={initialData ? 'Edit Data Pengolahan & Pemasaran' : 'Tambah Data Pengolahan & Pemasaran'}
        description="Pilih jenis kegiatan terlebih dahulu, lalu isi formulir berikut dengan lengkap."
      >
        <div className="space-y-5">
          <ChoiceButtons
            label="Jenis Kegiatan"
            value={form.jenis_kegiatan}
            options={['Pengolahan', 'Pemasaran']}
            onChange={handleJenisKegiatan}
            required
          />

          <ChoiceButtons
            label="Skala Usaha"
            value={form.skala_usaha}
            options={['Mikro', 'Kecil', 'Menengah', 'Besar']}
            onChange={value => setChoice('skala_usaha', value)}
            columns={4}
            required
          />

          {form.jenis_kegiatan === 'Pengolahan' ? (
            <SelectField
              label="Jenis Pengolahan"
              value={form.jenis_kegiatan_pengolahan}
              onChange={setValue('jenis_kegiatan_pengolahan')}
              options={JENIS_PENGOLAHAN_OPTIONS}
              placeholder="Pilih jenis pengolahan"
              required
            />
          ) : null}

          {form.jenis_kegiatan === 'Pemasaran' ? (
            <SelectField
              label="Jenis Pemasaran"
              value={form.jenis_kegiatan_pemasaran}
              onChange={setValue('jenis_kegiatan_pemasaran')}
              options={JENIS_PEMASARAN_OPTIONS}
              placeholder="Pilih jenis pemasaran"
              required
            />
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="1" title="Lokasi Utama & Identitas UPI">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Tahun"
            value={form.tahun}
            onChange={setValue('tahun')}
            inputMode="numeric"
            placeholder="YYYY"
            maxLength={4}
            required
          />
          <SelectField
            label="Kabupaten/Kota"
            value={form.kabupaten_kota}
            onChange={setValue('kabupaten_kota')}
            options={KABUPATEN_KOTA_OPTIONS}
            placeholder="Pilih kabupaten/kota"
            required
          />
          <Field
            label="Kecamatan"
            value={form.kecamatan}
            onChange={setUppercase('kecamatan')}
            placeholder="NAMA KECAMATAN"
            required
          />
          <Field
            label="Desa/Kelurahan"
            value={form.desa}
            onChange={setUppercase('desa')}
            placeholder="NAMA DESA/KELURAHAN"
            required
          />
          <Field
            label="Alamat Detail"
            value={form.alamat}
            onChange={setUppercase('alamat')}
            placeholder="CTH: JL. IKAN TUNA NO. 10, RT 02/RW 03"
            helpText="Format disarankan: nama jalan, nomor bangunan, RT/RW."
            className="md:col-span-2"
            required
          />
          <Field
            label="Nama UPI"
            value={form.nama_upi}
            onChange={setUppercase('nama_upi')}
            placeholder="NAMA UNIT PENGOLAHAN IKAN"
            required
          />
          <Field
            label="Nomor Telepon"
            value={form.nomor_telepon}
            onChange={setValue('nomor_telepon')}
            inputMode="tel"
            placeholder="08XXXXXXXXXX"
          />
          <Field
            label="Tahun Berdiri"
            value={form.tahun_berdiri}
            onChange={setValue('tahun_berdiri')}
            inputMode="numeric"
            placeholder="YYYY"
          />
        </div>
      </SectionCard>

      <SectionCard number="2" title="Legalitas Usaha & Profil Pemilik">
        <div className="space-y-5">
          <CheckboxGroup
            label="Sertifikat Perizinan Usaha"
            values={form.perizinan}
            options={PERIZINAN_OPTIONS}
            onToggle={option => toggleArrayValue('perizinan', option, 'Tidak Berizin')}
            columns={4}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nama Pemilik"
              value={form.nama_pemilik}
              onChange={setUppercase('nama_pemilik')}
              placeholder="NAMA PEMILIK"
            />
            <SelectField
              label="Jenis Kelamin"
              value={form.jenis_kelamin}
              onChange={setValue('jenis_kelamin')}
              options={['Laki-Laki', 'Perempuan']}
              placeholder="Pilih jenis kelamin"
            />
            <Field
              label="Nomor Telepon Pemilik"
              value={form.nomor_telepon_2}
              onChange={setValue('nomor_telepon_2')}
              inputMode="tel"
              placeholder="08XXXXXXXXXX"
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 md:p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Alamat Domisili Pemilik</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Kabupaten 2"
                value={form.kabupaten_kota_2}
                onChange={setValue('kabupaten_kota_2')}
                options={KABUPATEN_KOTA_OPTIONS}
                placeholder="Pilih kabupaten/kota domisili"
              />
              <Field
                label="Kecamatan 2"
                value={form.kecamatan_2}
                onChange={setUppercase('kecamatan_2')}
                placeholder="NAMA KECAMATAN"
              />
              <Field
                label="Desa 2"
                value={form.desa_2}
                onChange={setUppercase('desa_2')}
                placeholder="NAMA DESA/KELURAHAN"
              />
              <Field
                label="Alamat Detail 2"
                value={form.alamat_2}
                onChange={setUppercase('alamat_2')}
                placeholder="CTH: JL. IKAN TUNA NO. 10, RT 02/RW 03"
                helpText="Format disarankan: nama jalan, nomor bangunan, RT/RW."
                className="md:col-span-2 xl:col-span-3"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard number="3" title="Aset, Lahan, & Bangunan">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nilai Aset (Rp)"
              value={form.nilai_aset_rp}
              onChange={setValue('nilai_aset_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Cold Storage (Kg)"
              value={form.cold_storage_kg}
              onChange={setValue('cold_storage_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <SelectField
              label="Status Cold Storage"
              value={form.status_cold_storage}
              onChange={setValue('status_cold_storage')}
              options={STATUS_COLD_STORAGE_OPTIONS}
              placeholder="Pilih status cold storage"
            />
            <Field
              label="Aset Cold Storage (Rp)"
              value={form.aset_cold_storage_rp}
              onChange={setValue('aset_cold_storage_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <SelectField
              label="Sertifikat Lahan"
              value={form.sertifikat_lahan}
              onChange={setValue('sertifikat_lahan')}
              options={['SHM', 'Non SHM']}
              placeholder="Pilih sertifikat lahan"
            />
            <SelectField
              label="Status Lahan Usaha"
              value={form.status_lahan_usaha}
              onChange={setValue('status_lahan_usaha')}
              options={['Sewa', 'Milik Sendiri']}
              placeholder="Pilih status lahan"
            />
            <Field
              label="Luas Lahan (m²)"
              value={form.luas_lahan_m2}
              onChange={setValue('luas_lahan_m2')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Nilai Lahan (Rp)"
              value={form.nilai_lahan_rp}
              onChange={setValue('nilai_lahan_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Biaya Sewa Per Tahun (Rp)"
              value={form.biaya_sewa_per_tahun_rp}
              onChange={setValue('biaya_sewa_per_tahun_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

          <CheckboxGroup
            label="Sertifikat Bangunan"
            values={form.sertifikat_bangunan}
            options={SERTIFIKAT_BANGUNAN_OPTIONS}
            onToggle={option =>
              toggleArrayValue('sertifikat_bangunan', option, 'Tidak Ada')
            }
            columns={3}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Luas Bangunan (m²)"
              value={form.luas_bangunan_m2}
              onChange={setValue('luas_bangunan_m2')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Nilai Bangunan (Rp)"
              value={form.nilai_bangunan_rp}
              onChange={setValue('nilai_bangunan_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard number="4" title="Permodalan & Finansial">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Jumlah Modal Sendiri (Rp)"
              value={form.jumlah_modal_sendiri_rp}
              onChange={setValue('jumlah_modal_sendiri_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Jumlah Laba Ditanam (Rp)"
              value={form.jumlah_laba_ditanam_rp}
              onChange={setValue('jumlah_laba_ditanam_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

          <ChoiceButtons
            label="Pinjaman Modal"
            value={form.pinjaman_modal}
            options={['Ya', 'Tidak']}
            onChange={handlePinjamanModal}
          />

          {form.pinjaman_modal === 'Ya' ? (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
              <Field
                label="Jumlah Pinjaman (Rp)"
                value={form.jumlah_pinjaman_rp}
                onChange={setValue('jumlah_pinjaman_rp')}
                inputMode="numeric"
                placeholder="0"
              />
              <SelectField
                label="Pemberi Pinjaman"
                value={form.pemberi_pinjaman}
                onChange={setValue('pemberi_pinjaman')}
                options={PEMBERI_PINJAMAN_OPTIONS}
                placeholder="Pilih pemberi pinjaman"
              />
              <Field
                label="Tanggal Akad Pinjaman"
                value={form.tanggal_akad_pinjaman}
                onChange={setValue('tanggal_akad_pinjaman')}
                type="date"
              />
              <Field
                label="Tenor Pinjaman (Tahun)"
                value={form.tenor_pinjaman_tahun}
                onChange={setValue('tenor_pinjaman_tahun')}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="5" title="Produk & Sertifikasi">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nama Merek"
              value={form.nama_merek}
              onChange={setUppercase('nama_merek')}
              placeholder="NAMA MEREK"
            />
            <Field
              label="Jenis Produk"
              value={form.jenis_produk}
              onChange={setUppercase('jenis_produk')}
              placeholder="JENIS PRODUK"
            />
            <SelectField
              label="Sertifikat BPOM"
              value={form.sertifikat_bpom}
              onChange={setValue('sertifikat_bpom')}
              options={['Tidak Ada', 'BPOM MD', 'PIRT']}
              placeholder="Pilih sertifikat BPOM"
            />
            <SelectField
              label="Periode Produksi"
              value={form.periode_produksi}
              onChange={setValue('periode_produksi')}
              options={['Harian', 'Bulanan']}
              placeholder="Pilih periode produksi"
            />
          </div>

          <CheckboxGroup
            label="Sertifikat Produk"
            values={form.sertifikat_umum}
            options={SERTIFIKAT_PRODUK_OPTIONS}
            onToggle={option => toggleArrayValue('sertifikat_umum', option)}
            columns={3}
            helpText="Kosongkan seluruh pilihan apabila belum memiliki sertifikat produk."
          />
        </div>
      </SectionCard>

      <SectionCard
        number="6"
        title="Metrik Produksi & Biaya"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Biaya Produksi Per Periode (Rp)"
              value={form.biaya_produksi_per_periode_rp}
              onChange={setValue('biaya_produksi_per_periode_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Biaya Lain-Lain Per Periode (Rp)"
              value={form.biaya_lain_lain_per_periode_rp}
              onChange={setValue('biaya_lain_lain_per_periode_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Hasil Produksi Per Periode (Kg)"
              value={form.hasil_produksi_per_periode_kg}
              onChange={setValue('hasil_produksi_per_periode_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Kapasitas Per Periode (Kg)"
              value={form.kapasitas_per_periode_kg}
              onChange={setValue('kapasitas_per_periode_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Harga Jual (Rp/Kg)"
              value={form.harga_jual_rp_kg}
              onChange={setValue('harga_jual_rp_kg')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Jumlah Total Bulan Produksi Per Tahun"
              value={form.jumlah_total_bulan_produksi_per_tahun}
              onChange={setValue('jumlah_total_bulan_produksi_per_tahun')}
              inputMode="numeric"
              placeholder="12"
            />
            <Field
              label="Jumlah Hari Produksi Per Bulan"
              value={form.jumlah_hari_produksi_per_bulan}
              onChange={setValue('jumlah_hari_produksi_per_bulan')}
              inputMode="numeric"
              placeholder="25"
              disabled={form.periode_produksi === 'Bulanan'}
              helpText={
                form.periode_produksi === 'Bulanan'
                  ? 'Tidak digunakan untuk periode produksi bulanan.'
                  : undefined
              }
            />
          </div>

          <CheckboxGroup
            label="Bulan Produksi"
            values={form.bulan_produksi}
            options={BULAN_OPTIONS}
            onToggle={option => toggleArrayValue('bulan_produksi', option)}
            columns={4}
          />

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
            <ReadOnlyMetric
              label="Biaya Produksi Per Tahun"
              value={productionMetrics.biaya_produksi_per_tahun_rp}
              suffix=" Rp"
            />
            <ReadOnlyMetric
              label="Kapasitas Per Tahun"
              value={productionMetrics.kapasitas_per_tahun_kg}
              suffix=" Kg"
            />
            <ReadOnlyMetric
              label="Hasil Produksi Per Tahun"
              value={productionMetrics.hasil_produksi_per_tahun_kg}
              suffix=" Kg"
            />
            <ReadOnlyMetric
              label="Nilai Hasil Produksi Per Tahun"
              value={productionMetrics.nilai_hasil_produksi_per_tahun_rp}
              suffix=" Rp"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard number="7" title="Bahan Baku & Distribusi Pemasaran">
        <div className="space-y-5">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Bahan Baku</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Nama Bahan Baku"
                value={form.nama_bahan_baku}
                onChange={setUppercase('nama_bahan_baku')}
                placeholder="NAMA BAHAN BAKU"
              />
              <Field
                label="Total Bahan Baku Per Periode (Kg)"
                value={form.total_bahan_baku_per_periode_kg}
                onChange={setValue('total_bahan_baku_per_periode_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Asal Bahan Baku (Kabupaten/Kota)"
                value={form.asal_bahan_baku_kabupaten_kota}
                onChange={setUppercase('asal_bahan_baku_kabupaten_kota')}
                placeholder="DAPAT DIISI LEBIH DARI SATU KABUPATEN/KOTA"
              />
              <Field
                label="Provinsi Asal Bahan Baku"
                value={form.provinsi_asal_bahan_baku}
                onChange={setUppercase('provinsi_asal_bahan_baku')}
                placeholder="NAMA PROVINSI"
              />
              <Field
                label="Asal Negara Bahan Baku"
                value={form.asal_negara_bahan_baku}
                onChange={setUppercase('asal_negara_bahan_baku')}
                placeholder="NAMA NEGARA"
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Distribusi Pemasaran</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Total Pemasaran Per Tahun (Kg)"
                value={form.total_pemasaran_per_tahun_kg}
                onChange={setValue('total_pemasaran_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Dalam Kota/Kab Per Tahun (Kg)"
                value={form.pasar_dalam_kota_kab_per_tahun_kg}
                onChange={setValue('pasar_dalam_kota_kab_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Kota Dalam Jatim Per Tahun (Kg)"
                value={form.pasar_kota_dalam_jatim_per_tahun_kg}
                onChange={setValue('pasar_kota_dalam_jatim_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Luar Jatim Per Tahun (Kg)"
                value={form.pasar_luar_jatim_per_tahun_kg}
                onChange={setValue('pasar_luar_jatim_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Luar Negeri Per Tahun (Kg)"
                value={form.pasar_luar_negeri_per_tahun_kg}
                onChange={setValue('pasar_luar_negeri_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Tujuan Pemasaran (Kabupaten/Kota)"
                value={form.tujuan_pemasaran_kabupaten_kota}
                onChange={setUppercase('tujuan_pemasaran_kabupaten_kota')}
                placeholder="DAPAT DIISI LEBIH DARI SATU KABUPATEN/KOTA"
              />
              <Field
                label="Provinsi Tujuan Pemasaran"
                value={form.provinsi_tujuan_pemasaran}
                onChange={setUppercase('provinsi_tujuan_pemasaran')}
                placeholder="NAMA PROVINSI"
              />
              <Field
                label="Negara Tujuan Pemasaran"
                value={form.negara_tujuan_pemasaran}
                onChange={setUppercase('negara_tujuan_pemasaran')}
                placeholder="NAMA NEGARA"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        number="8"
        title="Ketenagakerjaan"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Tenaga Kerja Tetap - Laki-Laki"
              value={form.tenaga_kerja_tetap_laki_laki}
              onChange={setValue('tenaga_kerja_tetap_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap - Perempuan"
              value={form.tenaga_kerja_tetap_perempuan}
              onChange={setValue('tenaga_kerja_tetap_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap - Laki-Laki"
              value={form.tenaga_kerja_tidak_tetap_laki_laki}
              onChange={setValue('tenaga_kerja_tidak_tetap_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap - Perempuan"
              value={form.tenaga_kerja_tidak_tetap_perempuan}
              onChange={setValue('tenaga_kerja_tidak_tetap_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Keluarga - Laki-Laki"
              value={form.tenaga_kerja_keluarga_laki_laki}
              onChange={setValue('tenaga_kerja_keluarga_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Keluarga - Perempuan"
              value={form.tenaga_kerja_keluarga_perempuan}
              onChange={setValue('tenaga_kerja_keluarga_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap 2 - Laki-Laki"
              value={form.tenaga_kerja_tetap_laki_laki_2}
              onChange={setValue('tenaga_kerja_tetap_laki_laki_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap 2 - Perempuan"
              value={form.tenaga_kerja_tetap_perempuan_2}
              onChange={setValue('tenaga_kerja_tetap_perempuan_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap 2 - Laki-Laki"
              value={form.tenaga_kerja_tidak_tetap_laki_laki_2}
              onChange={setValue('tenaga_kerja_tidak_tetap_laki_laki_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap 2 - Perempuan"
              value={form.tenaga_kerja_tidak_tetap_perempuan_2}
              onChange={setValue('tenaga_kerja_tidak_tetap_perempuan_2')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

        </div>
      </SectionCard>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 md:max-w-sm">
          <ReadOnlyMetric label="Total Seluruh Tenaga Kerja" value={totalTenagaKerja} suffix=" Orang" />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Data
          </button>
        </div>
      </div>
    </form>
  );
}

const getRowTotalTenagaKerja = row => {
  if (
    row?.total_seluruh_tenaga_kerja !== null &&
    row?.total_seluruh_tenaga_kerja !== undefined &&
    row?.total_seluruh_tenaga_kerja !== ''
  ) {
    return toNumber(row.total_seluruh_tenaga_kerja);
  }

  return TENAGA_KERJA_FIELDS.reduce(
    (total, key) => total + toNumber(row?.[key]),
    0,
  );
};

const getJenisDetail = row =>
  row.jenis_kegiatan === 'Pengolahan'
    ? row.jenis_kegiatan_pengolahan
    : row.jenis_kegiatan_pemasaran;

export default function AdminPengolahanPemasaran() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [filterTahun, setFilterTahun] = useState('');
  const [filterKabupaten, setFilterKabupaten] = useState('');
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState('');
  const [filterSkalaUsaha, setFilterSkalaUsaha] = useState('');

  // Tab aktif: 'table' (Tabel Data) atau 'visualisasi' (Visualisasi Statistik)
  const [activeTab, setActiveTab] = useState('table');

  // ==== Visualisasi Data (KPI, Peta, Bar Chart, Tren, Treemap, Heatmap) ====
  const [statsLoading, setStatsLoading] = useState(true);
  const [barFilter, setBarFilter] = useState('produksi');
  const [stats, setStats] = useState({
    produksiPerKabupaten: [],
    trenBulanan: [],
    top5Jenis: [],
    komposisiKegiatan: [],
    heatmapData: [],
    kpi: { total_volume: 0, top_jenis_produk: '-', total_nilai: 0, total_upi: 0 },
  });

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (filterTahun) params.append('tahun', filterTahun);
      if (filterKabupaten) params.append('kabupaten_kota', filterKabupaten);
      if (filterJenisKegiatan) params.append('jenis_kegiatan', filterJenisKegiatan);
      if (filterSkalaUsaha) params.append('skala_usaha', filterSkalaUsaha);

      const response = await api.get(`/pengolahan-pemasaran/dashboard-stats?${params.toString()}`);

      if (response.data?.success) {
        setStats({
          produksiPerKabupaten: [],
          trenBulanan: [],
          top5Jenis: [],
          komposisiKegiatan: [],
          heatmapData: [],
          kpi: { total_volume: 0, top_jenis_produk: '-', total_nilai: 0, total_upi: 0 },
          ...(response.data.stats || {}),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.response?.data || error.message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterTahun, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha]);

  // 1. Peta Choropleth Jawa Timur
  const mapOption = useMemo(() => {
    const mapData = stats.produksiPerKabupaten.map(item => ({
      name: item.name,
      value: barFilter === 'produksi' ? item.produksi : item.nilai,
    }));

    const maxVal = mapData.length > 0 ? Math.max(...mapData.map(d => d.value)) : 0;
    const isProduksi = barFilter === 'produksi';

    return {
      title: {
        text: 'Sebaran Hasil Pengolahan & Pemasaran per Kabupaten/Kota',
        textStyle: { color: '#e2e8f0', fontSize: 16, fontFamily: 'Inter' },
        left: 'center',
        top: 10,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const val = params.value || 0;
          const formatted = isProduksi
            ? `${val.toLocaleString('id-ID')} KG`
            : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
          return `${params.name}<br/>Total: <b>${formatted}</b>`;
        },
      },
      visualMap: {
        left: 'right',
        min: 1,
        max: maxVal || 100,
        inRange: {
          color: ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#34d399'],
        },
        text: ['Tinggi', 'Rendah'],
        textStyle: { color: '#94a3b8' },
        calculable: true,
        type: 'piecewise',
        splitNumber: 5,
      },
      series: [
        {
          name: 'Hasil Pengolahan & Pemasaran',
          type: 'map',
          map: 'jawa_timur',
          roam: true,
          label: { show: false, color: '#fff' },
          emphasis: {
            label: { show: true, color: '#fff' },
            itemStyle: { areaColor: '#f59e0b' },
          },
          itemStyle: {
            areaColor: '#1e293b',
            borderColor: '#334155',
          },
          data: mapData,
        },
      ],
    };
  }, [stats.produksiPerKabupaten, barFilter]);

  // 2. Bar Chart Top 10 Kab/Kota
  const barOption = useMemo(() => {
    const sortedData = [...stats.produksiPerKabupaten].sort((a, b) => b[barFilter] - a[barFilter]);
    const top10 = sortedData.slice(0, 10).reverse();

    const isProduksi = barFilter === 'produksi';
    const seriesName = isProduksi ? 'Hasil Produksi (KG)' : 'Nilai Hasil (Rp)';
    const formatter = isProduksi
      ? val => val.toLocaleString('id-ID') + ' KG'
      : val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const val = params[0].value || 0;
          return `${params[0].name}<br/>${seriesName}: <b>${formatter(val)}</b>`;
        },
      },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          formatter: (val) => {
            if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T';
            if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M';
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'rb';
            return val;
          },
        },
      },
      yAxis: {
        type: 'category',
        data: top10.map(d => d.name),
        axisLabel: { color: '#cbd5e1', fontSize: 11 },
      },
      series: [
        {
          name: seriesName,
          type: 'bar',
          data: top10.map(d => d[barFilter]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#f97316' },
              { offset: 1, color: '#ea580c' },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [stats.produksiPerKabupaten, barFilter]);

  // 3. Line Chart Tren Bulanan (per Jenis Produk, Top 5 + Lainnya)
  const lineOption = useMemo(() => {
    const seriesData = stats.top5Jenis.map(jenis => ({
      name: jenis,
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: stats.trenBulanan.map(m => m[jenis] || 0),
    }));

    seriesData.push({
      name: 'Lainnya',
      type: 'line',
      smooth: true,
      lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' },
      itemStyle: { color: '#94a3b8' },
      symbol: 'none',
      data: stats.trenBulanan.map(m => m.Lainnya || 0),
    });

    return {
      tooltip: { trigger: 'axis' },
      legend: {
        data: [...stats.top5Jenis, 'Lainnya'],
        textStyle: { color: '#cbd5e1' },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: BULAN_OPTIONS,
        axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: { color: '#94a3b8' },
      },
      series: seriesData,
    };
  }, [stats.trenBulanan, stats.top5Jenis]);

  // 4. Treemap Komposisi Jenis Kegiatan (Pengolahan & Pemasaran)
  const treemapOption = useMemo(() => {
    const treemapData = stats.komposisiKegiatan.map(w => ({
      name: w.name,
      value: w.value,
    }));

    return {
      tooltip: {
        formatter: (info) => {
          const val = info.value || 0;
          return `<b>${info.name}</b><br/>Total Hasil: ${val.toLocaleString('id-ID')} KG`;
        },
      },
      series: [{
        type: 'treemap',
        width: '100%',
        height: '100%',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, formatter: '{b}\n\n{c} KG', color: '#fff', fontWeight: 'bold' },
        itemStyle: { borderColor: '#0f172a', gapWidth: 2 },
        data: treemapData,
        colorMappingBy: 'value',
        visualMap: {
          show: false,
          inRange: {
            color: ['#7c2d12', '#c2410c', '#f97316', '#fb923c', '#fed7aa'],
          },
        },
      }],
    };
  }, [stats.komposisiKegiatan]);

  // 5. Heatmap Kabupaten x Bulan
  const heatmapOption = useMemo(() => {
    const yAxisData = [...new Set(stats.heatmapData.map(d => d.kabupaten))].sort();
    const xAxisData = BULAN_OPTIONS;

    const dataPairs = [];
    const tooltipRawData = {};

    stats.heatmapData.forEach(item => {
      const xIndex = xAxisData.indexOf(item.bulan);
      const yIndex = yAxisData.indexOf(item.kabupaten);
      if (xIndex !== -1 && yIndex !== -1) {
        dataPairs.push([xIndex, yIndex, item.normalized]);
        tooltipRawData[`${xIndex}-${yIndex}`] = item.produksi;
      }
    });

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const xIndex = params.data[0];
          const yIndex = params.data[1];
          const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0;
          return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Hasil: ${rawValue.toLocaleString('id-ID')} KG`;
        },
      },
      grid: { left: '15%', right: '2%', top: '5%', bottom: '15%' },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: { show: true },
        axisLabel: { color: '#cbd5e1', rotate: 45 },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: { show: true },
        axisLabel: { color: '#cbd5e1', fontSize: 10 },
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#0f172a', '#3b82f6', '#2dd4bf', '#fde047', '#f43f5e'],
        },
        textStyle: { color: '#cbd5e1' },
        formatter: (value) => value.toFixed(1),
      },
      series: [{
        name: 'Heatmap',
        type: 'heatmap',
        data: dataPairs,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
      }],
    };
  }, [stats.heatmapData]);
  // ==== Akhir Visualisasi Data ====

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pengolahan-pemasaran/admin');
      setData(response.data?.data ?? []);
    } catch (error) {
      console.error(
        'Error fetching pengolahan & pemasaran:',
        error.response?.data || error.message
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async formData => {
    try {
      setSubmitLoading(true);

      if (editingData) {
        await api.put(`/pengolahan-pemasaran/${editingData.id}`, formData);
      } else {
        await api.post('/pengolahan-pemasaran', formData);
      }

      setIsFormOpen(false);
      setEditingData(null);
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error(
        'Error saving pengolahan & pemasaran:',
        error.response?.data || error.message,
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = row => {
    setEditingData(row);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async row => {
    if (!window.confirm(`Yakin ingin menghapus data ${row.nama_upi || row.kabupaten_kota}?`)) {
      return;
    }

    try {
      await api.delete(`/pengolahan-pemasaran/${row.id}`);
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting pengolahan & pemasaran:', error);
      alert('Gagal menghapus data.');
    }
  };

  const handleApprove = async row => {
    if (row.status === 'APPROVED') {
      alert('Data sudah selesai divalidasi Program.');
      return;
    }

    if (row.status === 'REJECTED') {
      alert('Data yang ditolak harus diperbaiki dulu agar kembali ke status PENDING.');
      return;
    }

    let promptMsg = '';

    if (row.status === 'PENDING') {
      promptMsg = 'Data masih PENDING.\nKetik "1" untuk Validasi Bidang.\n\nCatatan: Validasi Program belum bisa dilakukan sebelum Validasi Bidang.';
    } else if (row.status === 'APPROVED_BIDANG') {
      promptMsg = 'Data sudah divalidasi Bidang.\nKetik "2" untuk Validasi Program.';
    } else {
      alert('Status data tidak valid.');
      return;
    }

    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';

    if (jenis === '1') {
      if (row.status !== 'PENDING') {
        alert('Validasi Bidang hanya bisa dilakukan pada data berstatus PENDING.');
        return;
      }

      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
    } else if (jenis === '2') {
      if (row.status !== 'APPROVED_BIDANG') {
        alert('Data harus divalidasi Bidang terlebih dahulu sebelum Validasi Program.');
        return;
      }

      targetStatus = 'APPROVED';
      namaValidasi = 'PROGRAM';
    } else {
      alert('Pilihan tidak valid. Ketik 1 atau 2.');
      return;
    }

    const confirmText = window.prompt(
      `Ketik "SETUJU" untuk menyelesaikan Validasi ${namaValidasi}:`
    );

    if (confirmText !== 'SETUJU') {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.put(`/pengolahan-pemasaran/${row.id}/status`, {
        status: targetStatus,
      });

      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error approving data:', error);
      alert(`Gagal menyetujui data: ${error?.response?.data?.message || error.message}`);
    }
  };


  const handleReject = async row => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    try {
      await api.put(`/pengolahan-pemasaran/${row.id}/status`, {
        status: 'REJECTED',
        alasan_penolakan: alasan.trim(),
      });
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error('Error rejecting data:', error);
      alert('Gagal menolak data.');
    }
  };

  const tahunOptions = useMemo(
    () =>
      [...new Set(data.map(item => String(item.tahun ?? '')).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [data],
  );

  const filteredData = useMemo(
    () =>
      data.filter(item => {
        if (filterTahun && String(item.tahun) !== filterTahun) return false;
        if (filterKabupaten && item.kabupaten_kota !== filterKabupaten) return false;
        if (filterJenisKegiatan && item.jenis_kegiatan !== filterJenisKegiatan) return false;
        if (filterSkalaUsaha && item.skala_usaha !== filterSkalaUsaha) return false;
        return true;
      }),
    [data, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha, filterTahun],
  );

  const columns = useMemo(
    () => [
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => (
          <StatusBadge
            status={info.getValue()}
            alasan={info.row.original.alasan_penolakan}
          />
        ),
      },
      { header: 'Tahun', accessorKey: 'tahun' },
      {
        header: 'Kabupaten/Kota',
        accessorKey: 'kabupaten_kota',
        cell: info => <span className="font-medium text-foreground">{info.getValue()}</span>,
      },
      { header: 'Nama UPI', accessorKey: 'nama_upi' },
      {
        header: 'Jenis Kegiatan',
        accessorKey: 'jenis_kegiatan',
        cell: info => (
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {info.getValue() || '-'}
          </span>
        ),
      },
      {
        header: 'Jenis Detail',
        id: 'jenis_detail',
        cell: info => getJenisDetail(info.row.original) || '-',
      },
      { header: 'Skala Usaha', accessorKey: 'skala_usaha' },
      { header: 'Jenis Produk', accessorKey: 'jenis_produk' },
      {
        header: 'Hasil/Tahun (Kg)',
        accessorKey: 'hasil_produksi_per_tahun_kg',
        cell: info => toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Total Tenaga Kerja',
        id: 'total_tenaga_kerja',
        cell: info => getRowTotalTenagaKerja(info.row.original).toLocaleString('id-ID'),
      },
    ],
    [],
  );

  const dataPreview = loading ? (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ) : (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select
          value={filterTahun}
          onChange={event => setFilterTahun(event.target.value)}
          className={FILTER_SELECT_CLASS}
        >
          <option value="">Semua Tahun</option>
          {tahunOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filterKabupaten}
          onChange={event => setFilterKabupaten(event.target.value)}
          className={FILTER_SELECT_CLASS}
        >
          <option value="">Semua Kabupaten/Kota</option>
          {KABUPATEN_KOTA_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filterJenisKegiatan}
          onChange={event => setFilterJenisKegiatan(event.target.value)}
          className={FILTER_SELECT_CLASS}
        >
          <option value="">Semua Jenis Kegiatan</option>
          <option value="Pengolahan">Pengolahan</option>
          <option value="Pemasaran">Pemasaran</option>
        </select>

        <select
          value={filterSkalaUsaha}
          onChange={event => setFilterSkalaUsaha(event.target.value)}
          className={FILTER_SELECT_CLASS}
        >
          <option value="">Semua Skala Usaha</option>
          <option value="Mikro">Mikro</option>
          <option value="Kecil">Kecil</option>
          <option value="Menengah">Menengah</option>
          <option value="Besar">Besar</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        exportName={`Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );

  // ==== Blok Visualisasi Data (ditampilkan di atas tabel, hanya saat form tertutup) ====
  const dataVisualization = (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume Hasil</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">KG</span>
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Top Jenis Produk</p>
            <p className="text-xl font-bold text-foreground leading-tight">
              {stats.kpi.top_jenis_produk}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Nilai Hasil</p>
            <p className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.kpi.total_nilai)}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Unit Usaha (UPI)</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_upi.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Peta & Bar Chart Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Peta Sebaran Hasil</h2>
          </div>
          <div className="h-[450px]">
            <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold">Top 10 Kab/Kota</h2>
            </div>
            <select
              value={barFilter}
              onChange={(e) => setBarFilter(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-orange-500 outline-none text-slate-200"
            >
              <option value="produksi">Hasil Produksi (KG)</option>
              <option value="nilai">Nilai Hasil (Rp)</option>
            </select>
          </div>
          <div className="h-[450px]">
            <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Tren Bulanan & Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold">Tren Hasil Bulanan</h2>
          </div>
          <div className="h-[350px]">
            <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Factory className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-semibold">Komposisi Jenis Kegiatan</h2>
          </div>
          <div className="h-[350px]">
            <ReactECharts option={treemapOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold">Pola Musiman per Wilayah</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Warna merepresentasikan intensitas hasil relatif terhadap titik tertinggi masing-masing kabupaten. Hover untuk melihat angka tonase.
        </p>
        <div className="h-[600px]">
          <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
  // ==== Akhir Blok Visualisasi Data ====

  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(false);
              setEditingData(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Kembali"
            aria-label="Kembali ke halaman utama"
            className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Kelola Data Pengolahan & Pemasaran
            </h1>
            <p className="mt-1 text-muted-foreground">
              Input dan kelola data statistik unit usaha pengolahan serta pemasaran hasil perikanan.
            </p>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <PengolahanPemasaranForm
            initialData={editingData}
            isLoading={submitLoading}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingData(null);
            }}
          />
        </div>

        {dataPreview}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Kelola Data Pengolahan & Pemasaran
          </h1>
          <p className="mt-1 text-muted-foreground">
            Input dan kelola data statistik unit usaha pengolahan serta pemasaran hasil perikanan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingData(null);
            setIsFormOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          Tambah Data Baru
        </button>
      </div>

      {/*
        FIX: Tab navigation, filter (khusus tab visualisasi), dan konten (tabel/visualisasi)
        sekarang digabung jadi SATU container card, bukan dua div terpisah.
        Sebelumnya ada dua <div className="bg-card ..."> yang berbeda sebagai sibling di
        dalam parent "space-y-6", sehingga Tailwind menambahkan margin-top di antara
        keduanya dan muncul jarak/gap kosong seperti pada screenshot.
      */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'table'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Tabel Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visualisasi')}
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'visualisasi'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Visualisasi Statistik
          </button>
        </div>

        {activeTab === 'visualisasi' && (
          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Semua Tahun</option>
                  {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kabupaten/Kota</label>
                <select
                  value={filterKabupaten}
                  onChange={(e) => setFilterKabupaten(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Semua Kabupaten/Kota</option>
                  {KABUPATEN_KOTA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Kegiatan</label>
                <select
                  value={filterJenisKegiatan}
                  onChange={(e) => setFilterJenisKegiatan(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Semua Jenis Kegiatan</option>
                  <option value="Pengolahan">Pengolahan</option>
                  <option value="Pemasaran">Pemasaran</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Skala Usaha</label>
                <select
                  value={filterSkalaUsaha}
                  onChange={(e) => setFilterSkalaUsaha(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Semua Skala Usaha</option>
                  <option value="Mikro">Mikro</option>
                  <option value="Kecil">Kecil</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Besar">Besar</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Konten Tab: tetap di dalam card yang sama, tanpa jarak kosong */}
        <div className="p-6">
          {activeTab === 'visualisasi' ? (
            statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              dataVisualization
            )
          ) : (
            dataPreview
          )}
        </div>
      </div>
    </div>
  );
}