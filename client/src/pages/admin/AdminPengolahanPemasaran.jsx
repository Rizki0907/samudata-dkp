// File ini digunakan sebagai halaman utama Pengolahan dan Pemasaran untuk Admin.
// Halaman ini menangani tampilan tabel data, tambah dan edit data, perubahan status,
// verifikasi dan penolakan oleh Admin Pusat, filter, pencarian, ekspor data,
// Rekap Statistik, serta Visualisasi Statistik dari data yang telah diverifikasi.

 
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
 
import { Loader2, Plus, MapPin, TrendingUp, Factory, Box, LineChart, Users, Filter, ChevronDown, Search, X, AlertTriangle, Info, Pencil, Clock, Download, CheckCircle, XCircle, Trash2, } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useMasterDataStore } from '@/store/masterDataStore';
import { DataTable } from '@/components/shared/DataTable';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import PengolahanPemasaranForm from '@/components/admin/PengolahanPemasaranForm';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';

const normalizeRegionKey = value => {
  let text = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  if (text.startsWith('KABUPATEN ')) {
    text = `KAB ${text.replace(/^KABUPATEN\s+/, '')}`;
  }

  return text;
};

const GEO_REGION_NAME_MAP = new Map(
  (geoJsonData.features || []).map(feature => {
    const properties = feature?.properties || {};

    const geoName =
      properties.name ||
      properties.NAME_2 ||
      '';

    const regionType = String(
      properties.TYPE_2 || '',
    ).toUpperCase();

    const baseName = String(geoName)
      .replace(/^KOTA\s+/i, '')
      .trim();

    const databaseStyleName =
      regionType === 'KOTA'
        ? `KOTA ${baseName}`
        : `KAB ${baseName}`;

    return [
      normalizeRegionKey(databaseStyleName),
      geoName,
    ];
  }),
);

const getGeoRegionName = databaseName => {
  return (
    GEO_REGION_NAME_MAP.get(
      normalizeRegionKey(databaseName),
    ) || databaseName
  );
};

// Registrasi peta Jawa Timur (aman dipanggil berkali-kali)
echarts.registerMap('jawa_timur', geoJsonData);

 
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
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20';

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

// ==== Util Waktu Relatif (untuk kolom "Terakhir Diperbarui") ====
// Mengambil waktu perubahan terakhir untuk menampilkan informasi "Terakhir Diperbarui" dan mengurutkan data.
const getRowUpdatedAt = row =>
  row?.updated_at ??
  row?.updatedAt ??
  row?.updated_At ??
  row?.created_at ??
  row?.createdAt ??
  null;

 
const formatRelativeTime = dateValue => {
  if (!dateValue) return '-';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Baru saja';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Baru saja';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari yang lalu`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} tahun yang lalu`;
};

// ==== Util agregasi (untuk visualisasi berbasis data status VERIFIED) ====
 
const groupSum = (rows, keyFn, valueFn) => {
  const map = new Map();
  rows.forEach(row => {
    const key = keyFn(row);
    if (!key) return;
    const val = valueFn(row);
    map.set(key, (map.get(key) || 0) + val);
  });
  return map;
};

const formatRupiah = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));


const displayNumber = value => {
  const number = toNumber(value);
  return number === 0 ? '-' : number.toLocaleString('id-ID');
};

const displayCurrency = value => {
  const number = toNumber(value);
  return number === 0 ? '-' : formatRupiah(number);
};

const formatCompactRupiah = value => {
  const number = Math.abs(toNumber(value));
  const sign = toNumber(value) < 0 ? '-' : '';
  const scales = [
    { value: 1e15, label: 'Kuadriliun' },
    { value: 1e12, label: 'Triliun' },
    { value: 1e9, label: 'Miliar' },
    { value: 1e6, label: 'Juta' },
  ];
  const scale = scales.find(item => number >= item.value);
  if (!scale) return formatRupiah(value);
  const compact = number / scale.value;
  const digits = compact >= 100 ? 0 : compact >= 10 ? 1 : 2;
  return `${sign}Rp ${compact.toLocaleString('id-ID', { maximumFractionDigits: digits })} ${scale.label}`;
};

const splitCompactRupiah = value => {
  const formatted = formatCompactRupiah(value);
  const match = formatted.match(/^(.*)\s(Kuadriliun|Biliar|Triliun|Miliar|Juta)$/);
  if (!match) return { amount: formatted, unit: '' };
  return { amount: match[1], unit: match[2] };
};

function ChartSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="w-full appearance-none rounded-full border border-border bg-background py-2 pl-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-auto"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

// Dialog konfirmasi untuk proses verifikasi, penolakan, penghapusan, dan penyampaian informasi.
function ActionDialog({ dialog, value, setValue, onClose, onSubmit }) {
  if (!dialog?.open) return null;
  const themes = {
    APPROVED: { border: 'border-blue-500/30', bg: 'bg-blue-500', soft: 'bg-blue-500/10', text: 'text-blue-600', icon: CheckCircle },
    VERIFIED: { border: 'border-emerald-500/30', bg: 'bg-emerald-500', soft: 'bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle },
    REJECTED: { border: 'border-rose-500/30', bg: 'bg-rose-500', soft: 'bg-rose-500/10', text: 'text-rose-600', icon: XCircle },
    DELETE: { border: 'border-rose-500/30', bg: 'bg-rose-500', soft: 'bg-rose-500/10', text: 'text-rose-600', icon: Trash2 },
    INFO: { border: 'border-primary/30', bg: 'bg-primary', soft: 'bg-primary/10', text: 'text-primary', icon: Info },
  };
  const theme = themes[dialog.theme] || themes.INFO;
  const Icon = theme.icon;
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
      <div className={`w-full max-w-lg overflow-hidden rounded-3xl border ${theme.border} bg-card shadow-2xl`} onClick={event => event.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.soft} ${theme.text}`}><Icon className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-foreground">{dialog.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{dialog.message}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          {dialog.input ? (
            <div className="mt-5">
              {dialog.multiline ? (
                <textarea autoFocus rows={4} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              ) : (
                <input autoFocus type="text" value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') onSubmit(); }} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              )}
            </div>
          ) : null}
          {dialog.error ? <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{dialog.error}</div> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          {dialog.showCancel !== false ? <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Batal</button> : null}
          <button type="button" onClick={onSubmit} disabled={dialog.loading} className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${theme.bg} disabled:opacity-50`}>
            {dialog.loading ? 'Memproses...' : (dialog.confirmLabel || 'OK')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

 
const getUpiKey = row => {
  if (row?.id_upi) return String(row.id_upi);
  if (row?.upi_id) return String(row.upi_id);

  const nama = String(row?.nama_upi ?? '').trim().toLowerCase();
  const kabupaten = String(row?.kabupaten_kota ?? '').trim().toLowerCase();

  if (!nama && !kabupaten) return null;
  return `${nama}|${kabupaten}`;
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


// Menampilkan status data. Khusus data REJECTED, pengguna dapat melihat alasan dan membuka perbaikan data.
function StatusBadge({ row, onEdit }) {
  const [showModal, setShowModal] = useState(false);

  const status = row?.status;
  const alasan = row?.alasan_penolakan;
  const isRejected = status === 'REJECTED';

  let colorClass = 'border-blue-500/20 bg-blue-500/10 text-blue-600';
  let label = 'APPROVED';

  if (status === 'APPROVED') {
    colorClass = 'border-blue-500/20 bg-blue-500/10 text-blue-600';
    label = 'APPROVED';
  } else if (status === 'VERIFIED') {
    colorClass = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600';
    label = 'VERIFIED';
  } else if (status === 'REJECTED') {
    colorClass = 'border-rose-500/30 bg-rose-500/10 text-rose-600';
    label = 'REJECTED';
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
      >
        {isRejected ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
        {label}
      </span>

      {isRejected ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 underline decoration-dotted underline-offset-2 transition-colors hover:text-rose-600"
        >
          <Info className="h-3.5 w-3.5" />
          Lihat dan Perbaiki
        </button>
      ) : null}

      {isRejected && showModal && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-rose-500/30 bg-card shadow-2xl animate-in fade-in zoom-in-95"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto p-7">
              {/* Header modal */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground">Data Ini Ditolak</h3>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">
                    {row?.kabupaten_kota || '-'} &middot; {row?.jenis_kegiatan || '-'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Konteks data */}
              <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Kategori</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.kategori_kegiatan || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Jenis Kegiatan</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.jenis_kegiatan || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Skala Usaha</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.skala_usaha || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Kab/Kota</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.kabupaten_kota || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Tahun</dt>
                  <dd className="break-words font-semibold text-foreground">{row?.tahun || '-'}</dd>
                </div>
              </dl>

              {/* Alasan penolakan */}
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  Alasan Penolakan dari Pusat
                </p>
                <p className="mt-2 break-words text-sm leading-relaxed text-foreground">
                  {alasan || 'Tidak ada alasan yang dicantumkan oleh Pusat.'}
                </p>
              </div>

              {/* Panduan singkat */}
              <div className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground break-words whitespace-normal">
                Silakan perbaiki data sesuai alasan di atas. Setelah diperbaiki dan disimpan,
                status data akan otomatis kembali menjadi <b>APPROVED</b> dan dapat diverifikasi
                ulang oleh Pusat.
              </div>
            </div>

            {/* Aksi */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  onEdit?.(row);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-opacity hover:opacity-90"
              >
                <Pencil className="h-4 w-4" />
                Perbaiki Data Sekarang
              </button>
            </div>
          </div>
        </div>
      ,
        document.body
      ) : null}
    </div>
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

// Skema baru: row.jenis_kegiatan sudah berisi sub-jenis kegiatan langsung
// (mis. "Fermentasi", "Pengecer"), sedangkan kategorinya ada di row.kategori_kegiatan.
 
const getJenisDetail = row => row?.jenis_kegiatan || '';
 
const STATUS_OPTIONS = ['APPROVED', 'VERIFIED', 'REJECTED'];

const getSearchNumberVariants = (value) => {
  if (value === null || value === undefined || value === '') return [];

  const raw = String(value).trim();
  const number = toNumber(value);

  return [
    raw,
    raw.replace(/\s/g, ''),
    raw.replace(/\./g, ''),
    Number.isFinite(number)
      ? number.toLocaleString('id-ID', { maximumFractionDigits: 2 })
      : '',
    Number.isFinite(number) ? String(number) : '',
  ].filter(Boolean);
};

const flattenPackageDetails = packages =>
  (packages || []).flatMap(pkg =>
    (pkg.details || []).map(detail => ({
      ...detail,
      tahun: pkg.tahun,
      kabupaten_kota: pkg.kabupaten_kota,
      status: pkg.status,
      updated_at: pkg.updated_at,
    })),
  );

const packageMatchesDetailFilters = (item, filterJenisKegiatan, filterSkalaUsaha) => {
  const details = Array.isArray(item?.details) ? item.details : [];
  if (
    filterJenisKegiatan.length &&
    !details.some(detail => filterJenisKegiatan.includes(normalizeKategori(detail.kategori_kegiatan)))
  ) return false;
  if (
    filterSkalaUsaha.length &&
    !details.some(detail => filterSkalaUsaha.includes(detail.skala_usaha))
  ) return false;
  return true;
};

// Menggabungkan isi satu paket menjadi teks pencarian agar seluruh informasi penting dapat dicari dari tabel.
const buildTableSearchText = (row, includeStatus = false) => {
  const parts = [];
  if (includeStatus) parts.push(row?.status);
  parts.push(row?.tahun, row?.kabupaten_kota);

  (row?.details || []).forEach(detail => {
    parts.push(detail?.kategori_kegiatan, detail?.jenis_kegiatan, detail?.skala_usaha);
    [detail?.jumlah_unit_usaha, detail?.hasil_kg, detail?.hasil_rp].forEach(value => {
      parts.push(...getSearchNumberVariants(value));
    });
  });

  [row?.jumlah_unit_usaha, row?.hasil_kg, row?.hasil_rp, row?.modal_rp].forEach(value => {
    parts.push(...getSearchNumberVariants(value));
  });

  Object.entries(row?.modal_by_jenis || {}).forEach(([key, value]) => {
    parts.push(key, ...getSearchNumberVariants(value));
  });
  Object.entries(row?.modal_by_skala || {}).forEach(([key, value]) => {
    parts.push(key, ...getSearchNumberVariants(value));
  });

  return parts.filter(value => value !== null && value !== undefined && String(value).trim() !== '').join(' ');
};

const normalizeKategori = value =>
  String(value ?? '').trim().toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

const downloadExcelFromApi = async (
  endpoint,
  payload,
  fileName,
) => {
  try {
    const response = await api.post(
      endpoint,
      payload,
      {
        responseType: 'blob',
      },
    );

    const blob = new Blob(
      [response.data],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    );

    const downloadUrl =
      window.URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(
      'Gagal mengunduh file Excel:',
      error,
    );

    let message =
      'Gagal mengunduh file Excel.';

    const responseData =
      error?.response?.data;

    if (responseData instanceof Blob) {
      try {
        const errorText =
          await responseData.text();
        const errorJson =
          JSON.parse(errorText);

        message =
          errorJson.message || message;
      } catch {
        // Gunakan pesan default bila response error bukan JSON.
      }
    } else if (responseData?.message) {
      message = responseData.message;
    }

    throw new Error(message);
  }
};

// Halaman Admin Pengolahan dan Pemasaran untuk input, pengelolaan, verifikasi, tabel data, dan visualisasi statistik.
export default function AdminPengolahanPemasaran() {
  const { user } = useAuthStore();
  const isAdminPusat = user?.role === 'admin_pusat';

  // Menggunakan sumber tema yang sama dengan halaman user publik.
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // Master data dinamis: menambah/menghapus data di halaman Master Data
  // (kategori KABUPATEN_KOTA & KATEGORI_SKALA_USAHA) otomatis mengubah
  // opsi filter di sini, sama seperti pola di AdminPerikananTangkap.
  const { getOptions } = useMasterDataStore();
  const KABUPATEN_KOTA_OPTIONS = getOptions('KABUPATEN_KOTA');
  const SKALA_USAHA_OPTIONS = getOptions('KATEGORI_SKALA_USAHA');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState(null);
  const [dialogValue, setDialogValue] = useState('');
  const [rekapDialogOpen, setRekapDialogOpen] = useState(false);
  const [rekapTahun, setRekapTahun] = useState('');
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapError, setRekapError] = useState('');

  const closeActionDialog = () => {
    if (actionDialog?.loading) return;
    setActionDialog(null);
    setDialogValue('');
  };

  const showNotice = (message, theme = 'INFO', title = 'Informasi') => {
    setDialogValue('');
    setActionDialog({ open: true, kind: 'notice', title, message, theme, showCancel: false, confirmLabel: 'OK' });
  };

  const [filterTahun, setFilterTahun] = useState([]);
  const [filterKabupaten, setFilterKabupaten] = useState([]);
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState([]);
  const [filterSkalaUsaha, setFilterSkalaUsaha] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  // Tab aktif: 'table' (Tabel Data) atau 'visualisasi' (Visualisasi Statistik)
  const [activeTab, setActiveTab] = useState('table');

  // Bar chart toggle: produksi (KG) atau nilai (Rp)
  const [barFilter, setBarFilter] = useState('produksi');
  const [topKabFilter, setTopKabFilter] = useState('produksi');
  const [detailKegiatanFilter, setDetailKegiatanFilter] =
    useState('Pengolahan');
  const [trendPengolahanFilter, setTrendPengolahanFilter] = useState('produksi');
  const [trendPemasaranFilter, setTrendPemasaranFilter] = useState('produksi');

   
  const [selectedMapRegion, setSelectedMapRegion] = useState(null);
  const [isMobileMap, setIsMobileMap] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);

  // Light mode memakai teks slate yang lebih gelap agar mudah dibaca.
  const chartTheme = useMemo(
    () => ({
      strongText: isDark ? '#e2e8f0' : '#1e293b',
      text: isDark ? '#e2e8f0' : '#1e293b',
      mutedText: isDark ? '#94a3b8' : '#64748b',

      grid: isDark ? '#334155' : '#cbd5e1',
      axisLine: isDark ? '#475569' : '#94a3b8',

      surface: isDark ? '#0f172a' : '#ffffff',
      pieBorder: isDark ? '#0f172a' : '#ffffff',

      tooltipBackground: isDark
        ? 'rgba(15, 23, 42, 0.96)'
        : 'rgba(255, 255, 255, 0.98)',
      tooltipBorder: isDark ? '#334155' : '#e2e8f0',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',

      // Peta mengikuti warna Budidaya dan halaman user publik.
      mapArea: isDark ? '#1e293b' : '#f8fafc',
      mapBorder: isDark ? '#334155' : '#cbd5e1',

      // Nama wilayah hitam di light mode dan putih di dark mode.
      mapLabel: isDark ? '#ffffff' : '#0f172a',
      mapEmphasisBorder: isDark ? '#ffffff' : '#0f172a',
      mapHoverArea: isDark ? '#38bdf8' : '#f59e0b',
      mapSelectedArea: isDark ? '#0284c7' : '#f59e0b',

      mapInRange: isDark
        ? ['#dc2626', '#f97316', '#facc15', '#a3e635', '#34d399']
        : ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e'],

      // Gradasi bar Top 10 sama dengan halaman user dan Budidaya.
      barGradientStart: isDark ? '#0ea5e9' : '#0284c7',
      barGradientEnd: isDark ? '#2563eb' : '#1e40af',

      // Palet kategori Pengolahan dan Pemasaran.
      categoryPengolahan: '#0096C7',
      categoryPemasaran: isDark ? '#34D399' : '#10B981',
    }),
    [isDark],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const updateMobileState = event => {
      setIsMobileMap(event.matches);
      if (!event.matches) {
        setMapInteractionEnabled(true);
      } else {
        setMapInteractionEnabled(false);
      }
    };
    updateMobileState(mediaQuery);
    mediaQuery.addEventListener(
      'change',
      updateMobileState,
    );
    
    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateMobileState,
      );
    };
  }, []);

  // Tick untuk memaksa re-render label waktu relatif ("Terakhir Diperbarui") setiap menit
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => setTimeTick(tick => tick + 1), 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Mengambil seluruh paket data Pengolahan dan Pemasaran untuk kebutuhan halaman admin.
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pengolahan-pemasaran/admin');
      setData(response.data?.data ?? []);
    } catch (error) {
      console.error(
        'Error fetching pengolahan dan pemasaran:',
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

  // Menyimpan data baru atau perubahan data dari formulir tanpa mengubah alur status yang berlaku.
  const handleCreateOrUpdate = async formData => {
    try {
      setSubmitLoading(true);
      const wasEditing = Boolean(editingData);
      let response;

      if (editingData) {
        response = await api.put(`/pengolahan-pemasaran/${editingData.id}`, formData);
      } else {
        // Payload form sekarang berbentuk satu paket + details.
        // Route lama project menggunakan /batch untuk payload seperti ini.
        // Kalau pada branch server tertentu route /batch tidak tersedia,
        // baru fallback ke endpoint utama.
        try {
          response = await api.post('/pengolahan-pemasaran/batch', formData);
        } catch (batchError) {
          const status = batchError?.response?.status;
          if (status !== 404 && status !== 405) throw batchError;
          response = await api.post('/pengolahan-pemasaran', formData);
        }
      }

      setIsFormOpen(false);
      setEditingData(null);
      await fetchData();

      const apiMessage = response?.data?.message;
      const apiWarning = response?.data?.warning;
      showNotice(
        apiWarning
          ? `${apiMessage || 'Data berhasil disimpan.'} ${apiWarning}`
          : (apiMessage || (wasEditing ? 'Perubahan data berhasil disimpan.' : 'Data berhasil disimpan.')),
        apiWarning ? 'INFO' : (wasEditing ? 'INFO' : 'APPROVED'),
        wasEditing ? 'Perubahan Berhasil' : 'Penyimpanan Berhasil',
      );
    } catch (error) {
      console.error('Error saving pengolahan dan pemasaran:', error.response?.data || error.message);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Gagal menyimpan data pengolahan dan pemasaran.';

      showNotice(message, 'REJECTED', 'Penyimpanan Gagal');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = row => {
    setEditingData(row);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Membuka dialog tindakan untuk verifikasi atau penolakan data, baik satu data maupun beberapa data sekaligus.
  const openValidationDialog = (rows, isBatch = false) => {
    const targetRows = Array.isArray(rows) ? rows : [rows];
    if (!isAdminPusat) {
      showNotice('Hanya Pusat yang dapat melakukan validasi data.', 'INFO');
      return;
    }
    if (!targetRows.length) {
      showNotice('Tidak ada data yang dipilih.', 'INFO');
      return;
    }
    if (targetRows.some(row => row.status === 'REJECTED')) {
      showNotice('Data yang ditolak harus diperbaiki terlebih dahulu agar kembali ke status APPROVED.', 'INFO');
      return;
    }
    if (targetRows.some(row => row.status === 'VERIFIED')) {
      showNotice(isBatch ? 'Ada data yang sudah VERIFIED. Hapus data tersebut dari pilihan.' : 'Data ini sudah VERIFIED.', 'INFO');
      return;
    }
    if (targetRows.some(row => row.status !== 'APPROVED')) {
      showNotice('Status data tidak valid untuk proses verifikasi.', 'INFO');
      return;
    }
    setDialogValue('');
    setActionDialog({
      open: true,
      kind: 'validation-choice',
      title: 'Verifikasi Data',
      message: isBatch
        ? `Data yang dipilih sudah APPROVED (${targetRows.length} data).\nKetik "2" untuk VERIFIED.`
        : 'Data sudah APPROVED.\nKetik "2" untuk VERIFIED.',
      theme: 'VERIFIED',
      input: true,
      rows: targetRows,
      isBatch,
      targetStatus: 'VERIFIED',
      expected: '2',
      confirmLabel: 'OK',
    });
  };

  const handleApprove = row => openValidationDialog(row, false);

  const handleReject = row => {
    if (!isAdminPusat) {
      showNotice('Hanya Pusat yang dapat menolak data.', 'INFO');
      return;
    }
    if (row.status === 'REJECTED') {
      showNotice('Data ini sudah ditolak.', 'INFO');
      return;
    }
    setDialogValue('');
    setActionDialog({
      open: true,
      kind: 'reject',
      title: 'Tolak Data',
      message: `Masukkan alasan penolakan untuk ${row.jenis_kegiatan || '-'} - ${row.kabupaten_kota || '-'} (${row.tahun || '-'}):`,
      theme: 'REJECTED',
      rows: [row],
      input: true,
      multiline: true,
      confirmLabel: 'Tolak',
    });
  };

  const handleDelete = row => {
    setActionDialog({
      open: true,
      kind: 'delete',
      title: 'Hapus Data',
      message: `Yakin ingin menghapus data ${row.kabupaten_kota} - ${row.jenis_kegiatan} (${row.tahun})?`,
      theme: 'DELETE',
      rows: [row],
      confirmLabel: 'Hapus',
    });
  };

  const getSelectedRows = ids => {
    const selectedIdSet = new Set((ids || []).map(id => String(id)));
    return data.filter(row => selectedIdSet.has(String(row.id)));
  };

  const handleBatchApprove = ids => openValidationDialog(getSelectedRows(ids), true);

  const handleBatchReject = ids => {
    const rows = getSelectedRows(ids);
    if (!rows.length) {
      showNotice('Tidak ada data yang dipilih.', 'INFO');
      return;
    }
    if (rows.some(row => row.status === 'REJECTED')) {
      showNotice('Ada data yang sudah REJECTED. Pilih data lain.', 'INFO');
      return;
    }
    setDialogValue('');
    setActionDialog({
      open: true,
      kind: 'reject',
      title: 'Tolak Data Terpilih',
      message: `Masukkan alasan penolakan untuk ${rows.length} data:`,
      theme: 'REJECTED',
      rows,
      input: true,
      multiline: true,
      confirmLabel: 'Tolak',
    });
  };

  const handleBatchDelete = ids => {
    const rows = getSelectedRows(ids);
    if (!rows.length) {
      showNotice('Tidak ada data yang dipilih.', 'INFO');
      return;
    }
    setActionDialog({
      open: true,
      kind: 'delete',
      title: 'Hapus Data Terpilih',
      message: `Yakin ingin menghapus ${rows.length} data terpilih?`,
      theme: 'DELETE',
      rows,
      confirmLabel: 'Hapus',
    });
  };

  // Menjalankan tindakan yang sudah dikonfirmasi pada dialog, termasuk perubahan status dan penghapusan.
  const submitActionDialog = async () => {
    if (!actionDialog) return;
    if (actionDialog.kind === 'notice') {
      closeActionDialog();
      return;
    }
    if (actionDialog.kind === 'validation-choice') {
      if (dialogValue !== actionDialog.expected) {
        setActionDialog(previous => ({ ...previous, error: 'Pilihan tidak valid. Ketik 2.' }));
        return;
      }
      const countText = actionDialog.isBatch ? ` pada ${actionDialog.rows.length} data` : '';
      setDialogValue('');
      setActionDialog(previous => ({
        ...previous,
        kind: 'validation-confirm',
        message: `Ketik "SETUJU" untuk menyelesaikan ${previous.targetStatus}${countText}:`,
        expected: 'SETUJU',
        error: '',
      }));
      return;
    }
    if (actionDialog.kind === 'validation-confirm' && dialogValue !== 'SETUJU') {
      setActionDialog(previous => ({ ...previous, error: 'Konfirmasi dibatalkan atau kata kunci tidak sesuai.' }));
      return;
    }
    if (actionDialog.kind === 'reject' && !dialogValue.trim()) {
      setActionDialog(previous => ({ ...previous, error: 'Alasan penolakan wajib diisi.' }));
      return;
    }
    setActionDialog(previous => ({ ...previous, loading: true, error: '' }));
    const rows = actionDialog.rows || [];
    try {
      if (actionDialog.kind === 'delete') {
        if (rows.length === 1) await api.delete(`/pengolahan-pemasaran/${rows[0].id}`);
        else await api.post('/pengolahan-pemasaran/batch-delete', { ids: rows.map(row => row.id) });
        setActionDialog(null);
        setDialogValue('');
        await fetchData();
        showNotice(rows.length === 1 ? 'Data berhasil dihapus.' : `${rows.length} data berhasil dihapus.`, 'DELETE', 'Penghapusan Berhasil');
        return;
      }
      if (actionDialog.kind === 'reject') {
        if (rows.length === 1) {
          await api.put(`/pengolahan-pemasaran/${rows[0].id}/status`, { status: 'REJECTED', alasan_penolakan: dialogValue.trim() });
        } else {
          await api.post('/pengolahan-pemasaran/batch-status', { ids: rows.map(row => row.id), status: 'REJECTED', alasan_penolakan: dialogValue.trim() });
        }
        setActionDialog(null);
        setDialogValue('');
        await fetchData();
        showNotice('Data berhasil ditolak.', 'REJECTED', 'Penolakan Berhasil');
        return;
      }
      if (actionDialog.kind === 'validation-confirm') {
        let response;
        if (rows.length === 1) response = await api.put(`/pengolahan-pemasaran/${rows[0].id}/status`, { status: 'VERIFIED' });
        else response = await api.post('/pengolahan-pemasaran/batch-status', { ids: rows.map(row => row.id), status: 'VERIFIED' });
        const message = response.data?.message || (rows.length === 1 ? 'Data berhasil diubah statusnya menjadi VERIFIED.' : `${rows.length} data berhasil diubah menjadi VERIFIED.`);
        setActionDialog(null);
        setDialogValue('');
        await fetchData();
        showNotice(message, 'VERIFIED', 'VERIFIED Berhasil');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error.message;
      setActionDialog(null);
      setDialogValue('');
      showNotice(message, 'REJECTED', 'Proses Gagal');
    }
  };

  const tahunOptions = useMemo(
    () =>
      [...new Set(data.map(item => String(item.tahun ?? '')).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [data],
  );

  // Menyaring tabel sesuai filter aktif dan mengurutkan data berdasarkan aktivitas terbaru.
  const filteredData = useMemo(
    () =>
      data
        .filter(item => {
          if (filterTahun.length && !filterTahun.includes(String(item.tahun))) return false;
          if (filterKabupaten.length && !filterKabupaten.includes(item.kabupaten_kota)) return false;
          if (!packageMatchesDetailFilters(item, filterJenisKegiatan, filterSkalaUsaha)) return false;
          if (filterStatus.length && !filterStatus.includes(item.status)) return false;
          return true;
        })
        .sort((a, b) => {
          const timeA = new Date(getRowUpdatedAt(a) || 0).getTime();
          const timeB = new Date(getRowUpdatedAt(b) || 0).getTime();
          return timeB - timeA;
        }),
    [data, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha, filterTahun, filterStatus],
  );

  // Menangani ekspor data tabel Admin ke file Excel.
  const handleExportData = async rows => {
    const exportRows = Array.isArray(rows) ? rows : [];

    if (!exportRows.length) {
      showNotice('Tidak ada data yang dapat diekspor.', 'INFO', 'Ekspor Data');
      return;
    }

    try {
      await downloadExcelFromApi(
        '/pengolahan-pemasaran/admin/export-data',
        {
          ids: exportRows
            .map(row => row.id)
            .filter(Boolean),
        },
        `Pengolahan_Pemasaran_${
          new Date().toISOString().split('T')[0]
        }.xlsx`,
      );
    } catch (error) {
      showNotice(error.message || 'Gagal mengunduh file Excel.', 'REJECTED', 'Ekspor Gagal');
    }
  };

  // Membuka pilihan tahun untuk pembuatan Rekap Statistik.
  const openRekapDialog = () => {
    setRekapTahun('');
    setRekapError('');
    setRekapDialogOpen(true);
  };

  const exportRekapForYear = async (year, closeDialogAfterSuccess = false) => {
    const selectedYear = String(year || '').trim();
    if (!selectedYear) {
      setRekapError('Pilih tahun terlebih dahulu.');
      return;
    }

    const selectedRegions =
      filterKabupaten.length
        ? KABUPATEN_KOTA_OPTIONS.filter(region => filterKabupaten.includes(region))
        : KABUPATEN_KOTA_OPTIONS;

    const reportRows = data.filter(
      row =>
        row.status === 'VERIFIED' &&
        String(row.tahun) === selectedYear &&
        selectedRegions.includes(row.kabupaten_kota),
    );

    if (!reportRows.length) {
      setRekapError(
        filterKabupaten.length
          ? 'Tidak ada data VERIFIED pada tahun dan wilayah yang sedang dipilih.'
          : 'Tidak ada data VERIFIED pada tahun tersebut.',
      );
      return;
    }

    try {
      setRekapLoading(true);
      setRekapError('');
      await downloadExcelFromApi(
        '/pengolahan-pemasaran/admin/export-rekap',
        { tahun: selectedYear, regions: selectedRegions, ids: reportRows.map(row => row.id).filter(Boolean) },
        `Rekap_Statistik_Pengolahan_Pemasaran_${selectedYear}.xlsx`,
      );
      if (closeDialogAfterSuccess) setRekapDialogOpen(false);
    } catch (error) {
      setRekapError(error.message || 'Gagal mengunduh rekap statistik.');
      if (!closeDialogAfterSuccess) showNotice(error.message || 'Gagal mengunduh rekap statistik.', 'REJECTED', 'Ekspor Gagal');
    } finally {
      setRekapLoading(false);
    }
  };

  const handleExportRekap = () => exportRekapForYear(rekapTahun, true);

  const handleRekapButtonClick = () => {
    if (filterTahun.length === 1) {
      exportRekapForYear(String(filterTahun[0]), false);
      return;
    }
    openRekapDialog();
  };

  const lastUpdated = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return null;
        let maxDate = new Date(0);
        filteredData.forEach(row => {
          if (row.updated_at) {
            const dt = new Date(row.updated_at);
            if (dt > maxDate) maxDate = dt;
          }
        });
        if (maxDate.getTime() === 0) return null;
        
        return maxDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + maxDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }, [filteredData]);

  // Data sumber visualisasi hanya VERIFIED. Tabel utama tetap satu baris per paket Tahun + Kab/Kota.
  // Menyiapkan hanya paket berstatus VERIFIED sebagai sumber perhitungan Visualisasi Statistik.
  const verifiedPackages = useMemo(
    () =>
      data.filter(item => {
        if (item.status !== 'VERIFIED') return false;
        if (filterTahun.length && !filterTahun.includes(String(item.tahun))) return false;
        if (filterKabupaten.length && !filterKabupaten.includes(item.kabupaten_kota)) return false;
        if (!packageMatchesDetailFilters(item, filterJenisKegiatan, filterSkalaUsaha)) return false;
        return true;
      }),
    [data, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha, filterTahun],
  );

  const verifiedData = useMemo(
    () => flattenPackageDetails(verifiedPackages),
    [verifiedPackages],
  );

  // Mengolah data VERIFIED menjadi KPI dan data sumber seluruh grafik.
  const stats = useMemo(() => {
    const rows = verifiedData;

    const total_volume = rows.reduce(
      (sum, row) => sum + toNumber(row.hasil_kg),
      0,
    );
    const total_nilai = rows.reduce(
      (sum, row) => sum + toNumber(row.hasil_rp),
      0,
    );
    const total_upi = rows.reduce(
      (sum, row) => sum + toNumber(row.jumlah_unit_usaha),
      0,
    );

    const kegiatanMap = new Map();
    rows.forEach(row => {
      const name = String(row.jenis_kegiatan || 'Tidak diketahui').trim();
      if (!kegiatanMap.has(name)) {
        kegiatanMap.set(name, { name, produksi: 0, nilai: 0, upi: 0 });
      }
      const current = kegiatanMap.get(name);
      current.produksi += toNumber(row.hasil_kg);
      current.nilai += toNumber(row.hasil_rp);
      current.upi += toNumber(row.jumlah_unit_usaha);
    });

    const produkData = [...kegiatanMap.values()].sort(
      (a, b) => b.produksi - a.produksi,
    );
    const topProduk = produkData[0] || {
      name: '-',
      produksi: 0,
      nilai: 0,
      upi: 0,
    };

    const kabupatenMap = new Map();
    KABUPATEN_KOTA_OPTIONS.forEach(name => {
      kabupatenMap.set(name, { name, produksi: 0, nilai: 0, upi: 0 });
    });

    rows.forEach(row => {
      const name = row.kabupaten_kota;
      if (!name) return;
      if (!kabupatenMap.has(name)) {
        kabupatenMap.set(name, { name, produksi: 0, nilai: 0, upi: 0 });
      }
      const current = kabupatenMap.get(name);
      current.produksi += toNumber(row.hasil_kg);
      current.nilai += toNumber(row.hasil_rp);
      current.upi += toNumber(row.jumlah_unit_usaha);
    });

    const produksiPerKabupaten = [...kabupatenMap.values()];
    const detailKegiatanMaps = {
      Pengolahan: new Map(),
      Pemasaran: new Map(),
    };

    rows.forEach(row => {
      const kelompok = normalizeKategori(row.kategori_kegiatan);
      const detail = String(row.jenis_kegiatan ?? '').trim();
      if (!detail) return;
      const targetMap = detailKegiatanMaps[kelompok];
      targetMap.set(
        detail,
        (targetMap.get(detail) || 0) + toNumber(row.jumlah_unit_usaha),
      );
    });

    const detailKegiatan = {
      Pengolahan: [...detailKegiatanMaps.Pengolahan.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      Pemasaran: [...detailKegiatanMaps.Pemasaran.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };

    const rasioKegiatan = ['Pengolahan', 'Pemasaran'].map(name => ({
      name,
      value: rows
        .filter(row => normalizeKategori(row.kategori_kegiatan) === name)
        .reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0),
    }));

    const yearlyMap = new Map();
    rows.forEach(row => {
      const tahun = String(row.tahun ?? '').trim();
      if (!tahun) return;
      if (!yearlyMap.has(tahun)) {
        yearlyMap.set(tahun, {
          tahun,
          pengolahan_produksi: 0,
          pemasaran_produksi: 0,
          pengolahan_nilai: 0,
          pemasaran_nilai: 0,
        });
      }

      const current = yearlyMap.get(tahun);
      const kategori = normalizeKategori(row.kategori_kegiatan);
      const produksi = toNumber(row.hasil_kg);
      const nilai = toNumber(row.hasil_rp);

      if (kategori === 'Pengolahan') {
        current.pengolahan_produksi += produksi;
        current.pengolahan_nilai += nilai;
      } else {
        current.pemasaran_produksi += produksi;
        current.pemasaran_nilai += nilai;
      }
    });

    return {
      produksiPerKabupaten,
      produkData,
      detailKegiatan,
      rasioKegiatan,
      trenTahunan: [...yearlyMap.values()].sort(
        (a, b) => Number(a.tahun) - Number(b.tahun),
      ),
      kpi: {
        total_volume,
        total_nilai,
        total_upi,
        top_produk: topProduk,
      },
    };
  }, [verifiedData, KABUPATEN_KOTA_OPTIONS]);

  const activeDetailKegiatan =
    filterJenisKegiatan.length === 1 &&
    ['Pengolahan', 'Pemasaran'].includes(
      filterJenisKegiatan[0],
    )
      ? filterJenisKegiatan[0]
      : detailKegiatanFilter;

  const showDetailKegiatanToggle =
    filterJenisKegiatan.length !== 1;

  const mapOption = useMemo(() => {
    const mapData = stats.produksiPerKabupaten.map(item => ({
      name: getGeoRegionName(item.name),
      dbName: item.name,
      value:
        barFilter === 'produksi'
          ? toNumber(item.produksi)
          : toNumber(item.nilai),

      produksi: toNumber(item.produksi),
      nilai: toNumber(item.nilai),
      upi: toNumber(item.upi),
    }));

    const maxValue = mapData.length
      ? Math.max(...mapData.map(item => item.value))
      : 0;

    const isProduksi = barFilter === 'produksi';

    const allowRoam =
      !isMobileMap || mapInteractionEnabled;

    return {
      animationDuration: 400,

      tooltip: {
        trigger: 'item',

      // HP memakai tap, desktop bisa hover dan klik.
        triggerOn: isMobileMap
          ? 'click'
          : 'mousemove|click',

        confine: true,

        
        
        borderWidth: 1,
        
        
        formatter: params => {
          const item = params.data || {};

          const regionName =
            item.dbName ||
            params.name ||
            'Wilayah';

          const produksi = toNumber(item.produksi);
          const nilai = toNumber(item.nilai);
          const upi = toNumber(item.upi);

          return [
            `<b>${regionName}</b>`,
            `Total Unit Usaha: <b>${upi.toLocaleString('id-ID')}</b>`,
            `Hasil: <b>${produksi.toLocaleString('id-ID')} KG</b>`,
            `Nilai: <b>${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(nilai)}</b>`,
          ].join('<br/>');
        },
      },

      visualMap: {
        type: 'continuous',
        min: 0,
        max: maxValue || 1,

        orient: isMobileMap
          ? 'horizontal'
          : 'vertical',

        left: isMobileMap
          ? 'center'
          : 'right',

        right: isMobileMap
          ? 'auto'
          : 5,

        top: isMobileMap
          ? 'auto'
          : 'middle',

        bottom: isMobileMap
          ? 4
          : 'auto',

        itemWidth: isMobileMap
          ? 150
          : 14,

        itemHeight: isMobileMap
          ? 10
          : 120,

        calculable: false,

        text: ['Tinggi', 'Rendah'],

        textStyle: {
          color: chartTheme.mutedText,
          fontSize: 10,
        },

        inRange: {
          color: chartTheme.mapInRange,
        },  
      },

      series: [
        {
          name: isProduksi
            ? 'Hasil Produksi'
            : 'Nilai Produksi',

          type: 'map',
          map: 'jawa_timur',

          roam: allowRoam,

        // Sedikit diperbesar supaya lebih nyaman dilihat.
          zoom: isMobileMap ? 1.08 : 1.12,

          layoutCenter: [
            isMobileMap ? '50%' : '47%',
            isMobileMap ? '44%' : '50%',
          ],

          layoutSize: isMobileMap
            ? '100%'
            : '108%',

          selectedMode: 'single',

          label: {
            show: false,
            color: chartTheme.mapLabel,
            fontSize: 10,
          },

          itemStyle: {
            areaColor: chartTheme.mapArea,
            borderColor: chartTheme.mapBorder,
            borderWidth: 0.8,
          },

          emphasis: {
            label: {
              show: !isMobileMap,
              color: chartTheme.mapLabel,
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: chartTheme.mapHoverArea,
              borderColor: chartTheme.mapEmphasisBorder,
              borderWidth: 1.5,
            },
          },

          select: {
            label: {
              show: true,
              color: chartTheme.mapLabel,
              fontSize: 10,
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: chartTheme.mapSelectedArea,
              borderColor: chartTheme.mapEmphasisBorder,
              borderWidth: 2,
            },
          },

          data: mapData,
        },
      ],
    };
  }, [
    stats.produksiPerKabupaten,
    barFilter,
    isMobileMap,
    mapInteractionEnabled,
    chartTheme,
  ]);

  const mapEvents = useMemo(
    () => ({
      click: params => {
        if (params.seriesType !== 'map') {
          return;
        }

        const item = params.data || {};

        setSelectedMapRegion({
          name:
            item.dbName ||
            params.name ||
            'Wilayah',

          upi: toNumber(item.upi),
          produksi: toNumber(item.produksi),
          nilai: toNumber(item.nilai),
        });
      },
    }),
    [],
  );

  // 2. Bar Chart Top 10 Kab/Kota
  const barOption = useMemo(() => {
    const top10 = [...stats.produksiPerKabupaten]
      .filter(item => item[topKabFilter] > 0)
      .sort((a, b) => b[topKabFilter] - a[topKabFilter])
      .slice(0, 10)
      .reverse();

    const isProduksi = topKabFilter === 'produksi';
    const seriesName = isProduksi
      ? 'Hasil Produksi (Kg)'
      : 'Nilai Produksi(Rp)';

    return {
      tooltip: {
        trigger: 'axis',
        
        
        
        axisPointer: { type: 'shadow' },
        formatter: params => {
          const value = toNumber(params[0]?.value);

          return `${params[0]?.name}<br/>${
            isProduksi
              ? `Hasil: <b>${value.toLocaleString('id-ID')} Kg</b>`
              : `Nilai: <b>${formatRupiah(value)}</b>`
          }`;
        },
      },
      grid: {
        left: '3%',
        // Ruang kanan diperbesar agar angka di ujung batang tetap terlihat.
        right: isProduksi ? '18%' : '28%',
        top: '5%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: chartTheme.grid,
            type: 'dashed',
          },
        },
        axisLabel: {
          color: chartTheme.mutedText,
          formatter: val => {
            if (val >= 1_000_000_000_000) return `${(val / 1_000_000_000_000).toFixed(1)}T`;
            if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
            if (val >= 1_000) return `${(val / 1_000).toFixed(1)}rb`;
            return val;
          },
        },
      },
      yAxis: {
        type: 'category',
        data: top10.map(item => item.name),
        axisLabel: {
          color: chartTheme.text,
          fontSize: 11,
        },
      },
      series: [
        {
          name: seriesName,
          type: 'bar',
          data: top10.map(item => item[topKabFilter]),
          barMaxWidth: 28,
          label: {
            show: true,
            position: 'right',
            distance: 8,
            color: chartTheme.text,
            fontSize: 10,
            fontWeight: 600,
            formatter: params => {
              const value = toNumber(params.value);

              return isProduksi
                ? `${value.toLocaleString('id-ID')} Kg`
                : formatRupiah(value);
            },
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              {
                offset: 0,
                color: chartTheme.barGradientStart,
              },
              {
                offset: 1,
                color: chartTheme.barGradientEnd,
              },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [stats.produksiPerKabupaten, topKabFilter, chartTheme]);

  // 3. Donut Jumlah UPI Pengolahan vs Pemasaran
  const pieOption = useMemo(() => {
    const total = stats.rasioKegiatan.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    return {
      title: {
        text: total.toLocaleString('id-ID'),
        subtext: 'Unit',
        left: 'center',
        top: '36%',
        textStyle: {
          color: chartTheme.strongText,
          fontSize: 26,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: chartTheme.mutedText,
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: 'item',
        
        
        
        formatter: params => {
          const pct = total > 0
            ? ((params.value / total) * 100).toFixed(1)
            : '0.0';

          return `${params.name}<br/>Jumlah: <b>${params.value.toLocaleString(
            'id-ID',
          )} Unit</b><br/>Persentase: <b>${pct}%</b>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: chartTheme.text },
      },
      series: [
        {
          name: 'Jumlah Unit',
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: chartTheme.pieBorder,
            borderWidth: 2,
          },
          label: {
            show: true,
            color: chartTheme.strongText,
            formatter: params => {
              const pct = total > 0
                ? ((params.value / total) * 100).toFixed(1)
                : '0.0';

              return `${params.name}\n${params.value} Unit\n${pct}%`;
            },
          },
          labelLine: {
            lineStyle: { color: chartTheme.axisLine },
          },
          data: [
            {
              ...stats.rasioKegiatan.find(
                item => item.name === 'Pengolahan',
              ),
              itemStyle: {
                color: chartTheme.categoryPengolahan,
              },
            },
            {
              ...stats.rasioKegiatan.find(
                item => item.name === 'Pemasaran',
              ),
              itemStyle: {
                color: chartTheme.categoryPemasaran,
              },
            },
          ],
        },
      ],
    };
  }, [stats.rasioKegiatan, chartTheme]);

  // 4. Bar chart Jenis Detail Kegiatan


  const detailKegiatanOption = useMemo(() => {
    const chartData = [
      ...(stats.detailKegiatan?.[
        activeDetailKegiatan
      ] || []),
    ]
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .reverse();

    const isPengolahan =
      activeDetailKegiatan === 'Pengolahan';

    return {
      animationDuration: 400,

      tooltip: {
        trigger: 'axis',
        
        
        
        axisPointer: {
          type: 'shadow',
        },
        formatter: params => {
          const item = params?.[0];
          const value = toNumber(item?.value);

          return [
            `<b>${item?.name || '-'}</b>`,
            `Jumlah: <b>${value.toLocaleString(
              'id-ID',
            )} Unit</b>`,
          ].join('<br/>');
        },
      },

      grid: {
        left: '3%',
        right: '6%',
        top: '5%',
        bottom: '3%',
        containLabel: true,
      },

      xAxis: {
        type: 'value',
        minInterval: 1,

        splitLine: {
          lineStyle: {
            color: chartTheme.grid,
            type: 'dashed',
          },
        },

        axisLabel: {
          color: chartTheme.mutedText,
          formatter: value =>
            Number(value).toLocaleString('id-ID'),
        },
      },

      yAxis: {
        type: 'category',
        data: chartData.map(item => item.name),

        axisLabel: {
          color: chartTheme.text,
          fontSize: 11,
          width: 190,
          overflow: 'break',
          lineHeight: 15,
        },
      },

      series: [
        {
          name: `Detail ${activeDetailKegiatan}`,
          type: 'bar',

          data: chartData.map(item => item.value),

          barMaxWidth: 28,

          label: {
            show: true,
            position: 'right',
            color: chartTheme.text,
            formatter: params =>
              `${toNumber(params.value).toLocaleString(
                'id-ID',
              )} Unit`,
          },

          itemStyle: {
            color: isPengolahan
              ? chartTheme.categoryPengolahan
              : chartTheme.categoryPemasaran,

            borderRadius: [0, 6, 6, 0],
          },  
        },
      ],

      graphic:
        chartData.length === 0
          ? [
              {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: `Belum ada data`,
                  fill: chartTheme.mutedText,
                  fontSize: 13,
                },
              },
            ]
          : [],
      };
    }, [
      activeDetailKegiatan,
      stats.detailKegiatan,
      chartTheme,
    ]);

  // 5. Tren Tahunan dipisah menjadi dua grafik:
  // Pengolahan berwarna biru dan Pemasaran berwarna hijau.
  const trendOptions = useMemo(() => {
    const formatAxisValue = value => {
      if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}rb`;
      return value;
    };

    const createTrendOption = ({ category, metric, color, areaStart, areaEnd }) => {
      const isProduksi = metric === 'produksi';
      const dataKey = `${category.toLowerCase()}_${isProduksi ? 'produksi' : 'nilai'}`;

      return {
        tooltip: {
          trigger: 'axis',
          backgroundColor: chartTheme.tooltipBackground,
          borderColor: chartTheme.tooltipBorder,
          textStyle: { color: chartTheme.tooltipText },
          axisPointer: { type: 'line' },
          valueFormatter: value =>
            isProduksi
              ? `${toNumber(value).toLocaleString('id-ID')} KG`
              : formatRupiah(value),
        },
        grid: { left: '3%', right: '4%', top: '8%', bottom: '4%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: stats.trenTahunan.map(item => item.tahun),
          axisLabel: { color: chartTheme.mutedText, fontSize: 12 },
          axisLine: { lineStyle: { color: chartTheme.axisLine } },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: chartTheme.grid, type: 'dashed' } },
          axisLabel: { color: chartTheme.mutedText, formatter: formatAxisValue },
        },
        series: [{
          name: category,
          type: 'line',
          data: stats.trenTahunan.map(item => item[dataKey]),
          smooth: true,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color },
          itemStyle: { color, borderColor: chartTheme.surface, borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: areaStart },
                { offset: 1, color: areaEnd },
              ],
            },
          },
          emphasis: { focus: 'series' },
        }],
        graphic: stats.trenTahunan.length === 0 ? [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: 'Belum ada data', fill: chartTheme.mutedText, fontSize: 13 },
        }] : [],
      };
    };

    return {
      pengolahan: createTrendOption({
        category: 'Pengolahan',
        metric: trendPengolahanFilter,
        color: chartTheme.categoryPengolahan,
        areaStart: 'rgba(0, 150, 199, 0.48)',
        areaEnd: 'rgba(0, 150, 199, 0.04)',
      }),
      pemasaran: createTrendOption({
        category: 'Pemasaran',
        metric: trendPemasaranFilter,
        color: chartTheme.categoryPemasaran,
        areaStart: isDark ? 'rgba(52, 211, 153, 0.38)' : 'rgba(16, 185, 129, 0.30)',
        areaEnd: isDark ? 'rgba(52, 211, 153, 0.03)' : 'rgba(16, 185, 129, 0.03)',
      }),
    };
  }, [stats.trenTahunan, trendPengolahanFilter, trendPemasaranFilter, chartTheme]);

  // ==== Akhir Visualisasi Data ====

  // Menampilkan rincian isi paket ketika baris pada tabel dibuka.
  const renderPackageDetail = ({ row }) => {
    const pkg = row.original;
    const details = Array.isArray(pkg.details) ? pkg.details : [];
    const modalJenis = Object.entries(pkg.modal_by_jenis || {}).filter(([, value]) => toNumber(value) > 0);
    const modalSkala = Object.entries(pkg.modal_by_skala || {}).filter(([, value]) => toNumber(value) > 0);

    return (
      <div className="space-y-5 bg-muted/20 p-5 md:p-6">
        <div>
          <h4 className="mb-3 text-sm font-bold text-foreground">Unit Usaha dan Produksi</h4>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Kategori Kegiatan</th>
                  <th className="px-4 py-3 text-left">Jenis Kegiatan</th>
                  <th className="px-4 py-3 text-left">Skala Usaha</th>
                  <th className="px-4 py-3 text-right">Unit Usaha</th>
                  <th className="px-4 py-3 text-right">Hasil Produksi (Kg)</th>
                  <th className="px-4 py-3 text-right">Nilai Produksi (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {details.map((detail, index) => (
                  <tr key={`${detail.id || index}-${detail.jenis_kegiatan}-${detail.skala_usaha}`}>
                    <td className="px-4 py-3">{detail.kategori_kegiatan || '-'}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{detail.jenis_kegiatan || '-'}</td>
                    <td className="px-4 py-3">{detail.skala_usaha || '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{displayNumber(detail.jumlah_unit_usaha)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{displayNumber(detail.hasil_kg)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{displayCurrency(detail.hasil_rp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 text-sm font-bold text-foreground">Modal berdasarkan Jenis Kegiatan</h4>
            {modalJenis.length ? (
              <div className="space-y-2">
                {modalJenis.map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold tabular-nums text-foreground">{displayCurrency(value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Belum ada modal yang diisi.</p>}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 text-sm font-bold text-foreground">Modal berdasarkan Skala Usaha</h4>
            {modalSkala.length ? (
              <div className="space-y-2">
                {modalSkala.map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold tabular-nums text-foreground">{displayCurrency(value)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Belum ada modal yang diisi.</p>}
          </div>
        </div>
      </div>
    );
  };

  // Mendefinisikan kolom tabel Admin, termasuk Status, Terakhir Diperbarui, dan Aksi.
  const columns = useMemo(
    () => [
      {
        header: 'Status', accessorKey: 'status',
        cell: info => <StatusBadge row={info.row.original} onEdit={handleEdit} />,
      },
      { header: 'Tahun', accessorKey: 'tahun' },
      { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <span className="font-medium text-foreground">{info.getValue()}</span> },
      {
        header: 'Isi Rekap', id: 'isi_rekap',
        cell: info => {
          const row = info.row.original;
          return <span className="text-muted-foreground"><b className="text-foreground">{row.jumlah_rincian || 0} rincian</b> • {row.jumlah_skala || 0} skala</span>;
        },
      },
      { header: 'Total Unit', accessorKey: 'jumlah_unit_usaha', cell: info => displayNumber(info.getValue()) },
      { header: 'Hasil Produksi (Kg)', accessorKey: 'hasil_kg', cell: info => displayNumber(info.getValue()) },
      { header: 'Nilai Produksi (Rp)', accessorKey: 'hasil_rp', cell: info => displayCurrency(info.getValue()) },
      { header: 'Total Modal (Rp)', accessorKey: 'modal_rp', cell: info => displayCurrency(info.getValue()) },
    ],
    [],
  );

  // Bagian Tabel Data yang memuat pencarian, filter, ekspor, dan tindakan pengelolaan data.
  const dataPreview = (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <DataTable
        columns={columns}
        data={filteredData}
        getSearchText={(row) => buildTableSearchText(row, true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={isAdminPusat ? handleApprove : undefined}
        onReject={isAdminPusat ? handleReject : undefined}
        onBatchApprove={isAdminPusat ? handleBatchApprove : undefined}
        onBatchReject={isAdminPusat ? handleBatchReject : undefined}
        onBatchDelete={isAdminPusat ? handleBatchDelete : undefined}
        selectRowOnClick
        renderSubComponent={renderPackageDetail}
        customExportButton={
          <button
            type="button"
            onClick={handleRekapButtonClick}
            disabled={!filteredData.length}
            title="Pilih tahun melalui pop-up. Rekap hanya menghitung data VERIFIED dan wilayah yang dipilih."
            className="order-first inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Rekap Statistik
          </button>
        }
        onCustomExport={handleExportData}
        exportName={`Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );

  // ==== Blok Visualisasi Data (ditampilkan di atas tabel, hanya saat form tertutup) ====
  // Bagian Visualisasi Statistik yang menggunakan data berstatus VERIFIED.
  const dataVisualization = (
    <div className="space-y-6">
      {/* Baris 1 — KPI */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-xl bg-purple-500/10 p-4 text-purple-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Unit Usaha
            </p>
            <p className="text-xl font-bold text-foreground xl:text-2xl">
              {stats.kpi.total_upi.toLocaleString('id-ID')}
              <span className="text-sm font-normal text-muted-foreground"> Unit </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-xl bg-blue-500/10 p-4 text-blue-500">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Hasil Produksi
            </p>
            <p className="text-xl font-bold text-foreground xl:text-2xl">
              {stats.kpi.total_volume.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                Kg
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-500">
            <LineChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Nilai Produksi
            </p>
            {(() => {
              const compactNilai = splitCompactRupiah(stats.kpi.total_nilai);
              return (
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-bold leading-tight text-foreground xl:text-2xl">
                    {compactNilai.amount}
                  </span>
                  {compactNilai.unit ? (
                    <span className="pb-[1px] text-sm font-normal leading-none text-muted-foreground">
                      {compactNilai.unit}
                    </span>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-xl bg-orange-500/10 p-4 text-orange-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Top Jenis Kegiatan
            </p>
            <p
              className="truncate text-xl font-bold text-foreground"
              title={stats.kpi.top_produk.name}
            >
              {stats.kpi.top_produk.name}
            </p>
          </div>
        </div>
      </div>

      {/* Baris 2 — Peta dan Top 10 Kab/Kota */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:col-span-3">
          <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-500"><MapPin className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold text-foreground">
                  Peta Sebaran
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex">
              <ChartSelect
                value={barFilter}
                onChange={event => {
                  setBarFilter(event.target.value);
                  setSelectedMapRegion(null);
                }}
                ariaLabel="Filter peta"
                options={[{ value: 'produksi', label: 'Hasil (Kg)' }, { value: 'nilai', label: 'Nilai (Rp)' }]}
              />

              {isMobileMap ? (
                <button
                  type="button"
                  onClick={() => {
                    setMapInteractionEnabled(previous => !previous);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    mapInteractionEnabled
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {mapInteractionEnabled ? 'Kunci Peta' : 'Geser dan Zoom'}
                </button>
              ) : null}
            </div>
          </div>

          {isMobileMap && mapInteractionEnabled ? (
            <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              Mode peta aktif. Gunakan dua jari untuk memperbesar atau menggeser.
              Tekan “Kunci Peta” agar halaman kembali mudah di-scroll.
            </div>
          ) : null}

          <div className="h-[330px] overflow-hidden rounded-xl sm:h-[420px] lg:h-[450px]">
            <ReactECharts
              option={mapOption}
              onEvents={mapEvents}
              notMerge
              lazyUpdate
              style={{
                height: '100%',
                width: '100%',
                touchAction:
                  isMobileMap && !mapInteractionEnabled ? 'pan-y' : 'none',
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500"><TrendingUp className="h-5 w-5" /></div>
              <h2 className="text-xl font-bold text-foreground">
                Top 10 Kab/Kota
              </h2>
            </div>

            <ChartSelect
              value={topKabFilter}
              onChange={event => setTopKabFilter(event.target.value)}
              ariaLabel="Filter Top 10 Kab/Kota"
              options={[{ value: 'produksi', label: 'Hasil (Kg)' }, { value: 'nilai', label: 'Nilai (Rp)' }]}
            />
          </div>

          <div className="h-[380px] sm:h-[450px]">
            <ReactECharts
              option={barOption}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Baris 3 — Donut UPI dan Jenis Detail Kegiatan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500"><Users className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Perbandingan Jumlah Unit Usaha Berdasarkan Kategori Kegiatan
              </h2>
            </div>
          </div>

          <div className="h-[380px]">
            <ReactECharts
              option={pieOption}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
        </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 ${
                    activeDetailKegiatan === 'Pengolahan'
                      ? 'bg-[#0096C7]/10 text-[#0096C7]'
                      : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400'
                  }`}>
                  <Factory
                    className={`h-5 w-5 ${
                      activeDetailKegiatan === 'Pengolahan'
                        ? 'text-[#0096C7]'
                        : 'text-emerald-500 dark:text-emerald-400'
                    }`}
                  />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Jenis Detail Kegiatan
                    </h2>

                  </div>
                </div>

                {showDetailKegiatanToggle ? (
                  <div className="grid grid-cols-2 rounded-xl border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailKegiatanFilter('Pengolahan')
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeDetailKegiatan === 'Pengolahan'
                          ? 'bg-[#0096C7] text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      Pengolahan
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDetailKegiatanFilter('Pemasaran')
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeDetailKegiatan === 'Pemasaran'
                          ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      Pemasaran
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="h-[380px]">
                <ReactECharts
                  option={detailKegiatanOption}
                  notMerge
                  lazyUpdate
                  style={{
                    height: '100%',
                    width: '100%',
                  }}
                />
              </div>
            </div>
      </div>

          {/* Baris 4 — Tren Tahunan terpisah */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#0096C7]/20 bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#0096C7]/10 p-2.5 text-[#0096C7]">
                      <TrendingUp className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Tren Produksi Pengolahan
                      </h3>
                    </div>
                  </div>

                  <ChartSelect
                    value={trendPengolahanFilter}
                    onChange={event => setTrendPengolahanFilter(event.target.value)}
                    ariaLabel="Filter tren pengolahan"
                    options={[
                      { value: 'produksi', label: 'Hasil (Kg)' },
                      { value: 'nilai', label: 'Nilai (Rp)' },
                    ]}
                  />
                </div>

                <div className="h-[340px]">
                  <ReactECharts
                    option={
                      trendOptions.pengolahan
                    }
                    notMerge
                    lazyUpdate
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Tren Produksi Pemasaran
                      </h3>
                    </div>
                  </div>

                  <ChartSelect
                    value={trendPemasaranFilter}
                    onChange={event => setTrendPemasaranFilter(event.target.value)}
                    ariaLabel="Filter tren pemasaran"
                    options={[{ value: 'produksi', label: 'Hasil (Kg)' }, { value: 'nilai', label: 'Nilai (Rp)' }]}
                  />
                </div>

                <div className="h-[340px]">
                  <ReactECharts
                    option={
                      trendOptions.pemasaran
                    }
                    notMerge
                    lazyUpdate
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
    </div>
  );
  // ==== Akhir Blok Visualisasi Data ====

  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Kelola Data Pengolahan dan Pemasaran Produk Kelautan dan Perikanan
          </h1>
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

        {/* Penting: error penyimpanan harus tetap terlihat saat form masih terbuka. */}
        <ActionDialog
          dialog={actionDialog}
          value={dialogValue}
          setValue={setDialogValue}
          onClose={closeActionDialog}
          onSubmit={submitActionDialog}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Kelola Data Pengolahan dan Pemasaran Produk Kelautan dan Perikanan
          </h1>
        </div>

        {activeTab !== 'visualisasi' ? (
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
        ) : null}
      </div>


      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Box tab dan filter */}
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'table'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Tabel Data
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visualisasi')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'visualisasi'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Visualisasi Statistik
              </button>
            </div>

            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Filter Multidimensi
                  </h3>
                </div>

                {activeTab !== 'table' ? (
                  <div className="inline-flex items-center gap-2 self-start whitespace-nowrap rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 sm:self-auto">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span className="opacity-80">Terakhir Diperbarui:</span>
                    <span className="font-semibold">{lastUpdated}</span>
                  </div>
                ) : null}
              </div>

              <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${activeTab === 'table' ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                {activeTab === 'table' ? (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                    <SearchableMultiSelect
                      values={filterStatus}
                      options={[
                        { label: 'Verified', value: 'VERIFIED' },
                        { label: 'Approved', value: 'APPROVED' },
                        { label: 'Rejected', value: 'REJECTED' }
                      ]}
                      onChange={setFilterStatus}
                      placeholder="Semua Status"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                  <SearchableMultiSelect
                    values={filterTahun}
                    options={tahunOptions}
                    onChange={setFilterTahun}
                    placeholder="Semua Tahun"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                  <SearchableMultiSelect
                    values={filterKabupaten}
                    options={KABUPATEN_KOTA_OPTIONS}
                    onChange={setFilterKabupaten}
                    placeholder="Semua Kab/Kota"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori Kegiatan</label>
                  <SearchableMultiSelect
                    values={filterJenisKegiatan}
                    options={['Pengolahan', 'Pemasaran']}
                    onChange={setFilterJenisKegiatan}
                    placeholder="Semua Kategori Kegiatan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Skala Usaha</label>
                  <SearchableMultiSelect
                    values={filterSkalaUsaha}
                    options={SKALA_USAHA_OPTIONS}
                    onChange={setFilterSkalaUsaha}
                    placeholder="Semua Skala Usaha"
                  />
                </div>
              </div>
              {((activeTab === 'table' && filterStatus.length > 0) || filterTahun.length > 0 || filterKabupaten.length > 0 || filterJenisKegiatan.length > 0 || filterSkalaUsaha.length > 0) && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus([]);
                      setFilterTahun([]);
                      setFilterKabupaten([]);
                      setFilterJenisKegiatan([]);
                      setFilterSkalaUsaha([]);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Box tabel/search/export dipisahkan dari box filter */}
          {activeTab === 'table' ? dataPreview : dataVisualization}
        </>
      )}

      {rekapDialogOpen && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => !rekapLoading && setRekapDialogOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Unduh Rekap Statistik</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Pilih tahun rekap.
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Hanya untuk data yang berstatus VERIFIED.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={rekapLoading}
                  onClick={() => setRekapDialogOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tahun <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rekapTahun}
                  onChange={event => {
                    setRekapTahun(event.target.value);
                    setRekapError('');
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">Pilih Tahun</option>
                  {tahunOptions.map(option => {
                    const value = typeof option === 'object' ? option.value : option;
                    const label = typeof option === 'object' ? option.label : option;
                    return (
                      <option key={String(value)} value={String(value)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>



              {rekapError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                  {rekapError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-5">
              <button
                type="button"
                disabled={rekapLoading}
                onClick={() => setRekapDialogOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!rekapTahun || rekapLoading}
                onClick={handleExportRekap}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rekapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {rekapLoading ? 'Menyiapkan...' : 'Unduh Rekap Statistik'}
              </button>
            </div>
          </div>
        </div>
      ,
        document.body
      ) : null}

      <ActionDialog
        dialog={actionDialog}
        value={dialogValue}
        setValue={setDialogValue}
        onClose={closeActionDialog}
        onSubmit={submitActionDialog}
      />
    </div>
  );
}
