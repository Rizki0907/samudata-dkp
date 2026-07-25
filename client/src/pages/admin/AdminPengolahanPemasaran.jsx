import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Plus, MapPin, TrendingUp, Factory, Box, LineChart, Users, Filter, ChevronDown, Search, X, AlertTriangle, Info, Pencil, Clock, Download, } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/shared/DataTable';
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
  'Pengasapan/ Pemanggangan',
  'Pereduksian/ Ekstraksi',
  'Penggaraman/ Pengeringan',
  'Pengolahan Lainnya',
];

const JENIS_PEMASARAN_OPTIONS = [
  'Pengecer',
  'Pengumpul/ Pedagang Besar/ Distributor',
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


function FilterMultiSelect({ label, values, options, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const normalizedValues = Array.isArray(values) ? values : [];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideInteraction = event => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  const filteredOptions = options.filter(option =>
    String(option).toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOption = option => {
    onChange(
      normalizedValues.includes(option)
        ? normalizedValues.filter(item => item !== option)
        : [...normalizedValues, option],
    );
  };

  const selectedText =
    normalizedValues.length === 0
      ? placeholder
      : normalizedValues.length === 1
        ? normalizedValues[0]
        : `${normalizedValues.length} dipilih`;

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(previous => !previous)}
        className={`${FILTER_SELECT_CLASS} flex items-center justify-between gap-3 text-left`}
      >
        <span className="truncate font-medium text-white">
          {selectedText}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={`Cari ${label.toLowerCase()}...`}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onChange(options)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Pilih Semua
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Bersihkan
            </button>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length ? (
              filteredOptions.map(option => {
                const checked = normalizedValues.includes(option);

                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      checked
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(option)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="truncate">{option}</span>
                  </label>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Tidak ada pilihan yang cocok.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ row, onEdit }) {
  const [showModal, setShowModal] = useState(false);

  const status = row?.status;
  const alasan = row?.alasan_penolakan;
  const isRejected = status === 'REJECTED';

  let colorClass = 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600';
  let label = 'PENDING';

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
          Lihat &amp; Perbaiki
        </button>
      ) : null}

      {isRejected && showModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-8"
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
                  <dt className="text-xs font-medium text-muted-foreground">Kabupaten/Kota</dt>
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
                status data akan otomatis kembali menjadi <b>PENDING</b> dan akan diperiksa
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
const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'VERIFIED', 'REJECTED'];
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

    window.alert(message);
  }
};

export default function AdminPengolahanPemasaran() {
  const { user } = useAuthStore();
  const isAdminPusat = user?.role === 'admin_pusat';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

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
  const [trendFilter, setTrendFilter] = useState('produksi');

  const [selectedMapRegion, setSelectedMapRegion] = useState(null);
  const [isMobileMap, setIsMobileMap] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);

  // Modal input alasan penolakan (saat Pusat menolak data)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

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
      } else if (Array.isArray(formData?.details)) {
        await api.post('/pengolahan-pemasaran/batch', formData);
      } else {
        await api.post('/pengolahan-pemasaran', formData);
      }

      setIsFormOpen(false);
      setEditingData(null);
      await fetchData();
    } catch (error) {
      console.error(
        'Error saving pengolahan & pemasaran:',
        error.response?.data || error.message,
      );
      window.alert(
        error.response?.data?.message || 'Gagal menyimpan data pengolahan dan pemasaran.',
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
    if (!window.confirm(`Yakin ingin menghapus data ${row.kabupaten_kota} - ${row.jenis_kegiatan} (${row.tahun})?`)) {
      return;
    }

    try {
      await api.delete(`/pengolahan-pemasaran/${row.id}`);
      await fetchData();
    } catch (error) {
      console.error('Error deleting pengolahan & pemasaran:', error);
      alert('Gagal menghapus data.');
    }
  };

  const handleApprove = async row => {
  if (!isAdminPusat) {
    alert('Hanya Pusat yang dapat melakukan validasi data.');
    return;
  }

  if (row.status === 'VERIFIED') {
    alert('Data ini sudah VERIFIED.');
    return false;
  }

  if (row.status === 'REJECTED') {
    alert('Data yang ditolak harus diperbaiki dulu agar kembali ke status PENDING.');
    return;
  }

  let promptMsg = '';

  if (row.status === 'PENDING') {
    promptMsg =
      'Data masih PENDING.\nKetik "1" untuk APPROVED.\n\nCatatan: VERIFIED belum bisa dilakukan sebelum APPROVED.';
  } else if (row.status === 'APPROVED') {
    promptMsg =
      'Data sudah APPROVED.\nKetik "2" untuk VERIFIED.';
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
      alert('APPROVED hanya bisa dilakukan pada data berstatus PENDING.');
      return;
    }

    targetStatus = 'APPROVED';
    namaValidasi = 'APPROVED';
  } else if (jenis === '2') {
    if (row.status !== 'APPROVED') {
      alert('Data harus APPROVED terlebih dahulu sebelum VERIFIED.');
      return;
    }

    targetStatus = 'VERIFIED';
    namaValidasi = 'VERIFIED';
  } else {
    alert('Pilihan tidak valid. Ketik 1 atau 2.');
    return;
  }

  const confirmText = window.prompt(
    `Ketik "SETUJU" untuk menyelesaikan ${namaValidasi}:`
  );

  if (confirmText !== 'SETUJU') {
    alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
    return;
  }

  try {
    const response = await api.put(
      `/pengolahan-pemasaran/${row.id}/status`,
      {
        status: targetStatus,
      }
    );

    alert(
      response.data?.message ||
      `Data berhasil diubah statusnya menjadi ${targetStatus}.`,
    );

    await fetchData();
    return true;
  } catch (error) {
    console.error('Error approving data:', error.response?.data || error);
    
    alert(
      `Gagal memvalidasi data: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
    return false;
  }
};

  const handleReject = row => {
  if (!isAdminPusat) {
    alert('Hanya Pusat yang dapat menolak data.');
    return;
  }

  if (row.status === 'REJECTED') {
    alert('Data ini sudah ditolak.');
    return;
  }

  setRejectTarget(row);
  setRejectReason('');
  setRejectModalOpen(true);
};
  const submitReject = async () => {
  if (!rejectTarget) return;

  if (!rejectReason.trim()) {
    alert('Alasan penolakan wajib diisi.');
    return;
  }

  try {
    setRejectLoading(true);

    await api.put(`/pengolahan-pemasaran/${rejectTarget.id}/status`, {
      status: 'REJECTED',
      alasan_penolakan: rejectReason.trim(),
    });

    // Tutup modal
    setRejectModalOpen(false);
    setRejectTarget(null);
    setRejectReason('');

    // Refresh data
    await fetchData();

    alert('Data berhasil ditolak.');
  } catch (error) {
    console.error('Error rejecting data:', error.response?.data || error);

    alert(
      `Gagal menolak data: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
  } finally {
    setRejectLoading(false);
  }
};

  const handleBatchApprove = async ids => {
  if (!isAdminPusat) {
    alert('Hanya Pusat yang dapat melakukan validasi data.');
    return;
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    alert('Tidak ada data yang dipilih.');
    return;
  }

  const selectedIdSet = new Set(ids.map(id => String(id)));
  const selectedRows = data.filter(row => selectedIdSet.has(String(row.id)));

  if (!selectedRows.length) {
    alert('Data terpilih tidak ditemukan. Silakan refresh halaman.');
    return;
  }

  if (selectedRows.some(row => row.status === 'VERIFIED')) {
    alert(
      'Ada data yang sudah VERIFIED. Hapus data tersebut dari pilihan.',
    );
    return false;
  }

  if (selectedRows.some(row => row.status === 'REJECTED')) {
    alert('Data yang ditolak harus diperbaiki dulu agar kembali ke status PENDING.');
    return;
  }

  const selectedStatuses = [...new Set(selectedRows.map(row => row.status))];

  if (selectedStatuses.length > 1) {
    alert('Pilih data dengan status yang sama. APPROVED hanya untuk PENDING, sedangkan VERIFIED hanya untuk APPROVED.');
    return;
  }

  const currentStatus = selectedStatuses[0];

  let promptMsg = '';

  if (currentStatus === 'PENDING') {
    promptMsg = `Data yang dipilih masih PENDING (${selectedRows.length} data).\nKetik "1" untuk APPROVED.`;
  } else if (currentStatus === 'APPROVED') {
    promptMsg = `Data yang dipilih sudah APPROVED (${selectedRows.length} data).\nKetik "2" untuk VERIFIED.`;
  } else {
    alert('Status data terpilih tidak valid untuk proses validasi.');
    return;
  }

  const jenis = window.prompt(promptMsg);
  if (!jenis) return;

  let targetStatus = '';
  let namaValidasi = '';

  if (jenis === '1') {
    if (currentStatus !== 'PENDING') {
      alert('APPROVED hanya bisa dilakukan pada data PENDING.');
      return;
    }

    targetStatus = 'APPROVED';
    namaValidasi = 'APPROVED';
  } else if (jenis === '2') {
    if (currentStatus !== 'APPROVED') {
      alert('Data harus APPROVED terlebih dahulu sebelum VERIFIED.');
      return;
    }

    targetStatus = 'VERIFIED';
    namaValidasi = 'VERIFIED';
  } else {
    alert('Pilihan tidak valid. Ketik 1 atau 2.');
    return;
  }

  const confirmText = window.prompt(
    `Ketik "SETUJU" untuk menyelesaikan ${namaValidasi} pada ${selectedRows.length} data:`
  );

  if (confirmText !== 'SETUJU') {
    alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
    return;
  }

  try {
    const response =await api.post(
      '/pengolahan-pemasaran/batch-status', 
      {
        ids,
        status: targetStatus,
      }
    );

    const count = Number(
      response.data?.count ?? 0,
    );

    if (count === 0) {
      alert('Tidak ada data yang berhasil diperbarui. Pastikan status data yang dipilih sesuai.'
      );
      return false;
    }

    alert(
      response.data?.message ||
      `${count} data berhasil diubah menjadi ${targetStatus}.`
    );

    await fetchData();
    return true;
  } catch (error) {
    console.error('Error batch approve:', error.response?.data || error);
    alert(
      `Gagal memvalidasi data terpilih: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
    return false;
  }
};

  const handleBatchDelete = async ids => {
    if (!Array.isArray(ids) || ids.length === 0) {
      alert('Tidak ada data yang dipilih.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus ${ids.length} data terpilih?`)) {
      return;
    }

    try {
      await api.post('/pengolahan-pemasaran/batch-delete', { ids });

      await fetchData();
    } catch (error) {
      console.error('Error batch delete:', error);
      alert(`Gagal menghapus data terpilih: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleBatchReject = async ids => {
  if (!isAdminPusat) {
    alert('Hanya Pusat yang dapat menolak data.');
    return;
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    alert('Tidak ada data yang dipilih.');
    return;
  }

  const selectedIdSet = new Set(ids.map(id => String(id)));
  const selectedRows = data.filter(row => selectedIdSet.has(String(row.id)));

  if (selectedRows.some(row => row.status === 'REJECTED')) {
    alert('Ada data yang sudah REJECTED. Pilih data lain.');
    return;
  }

  const alasan = window.prompt(`Masukkan alasan penolakan untuk ${ids.length} data:`);
  if (alasan === null) return;

  if (!alasan.trim()) {
    alert('Alasan penolakan wajib diisi.');
    return;
  }

  try {
    await api.post('/pengolahan-pemasaran/batch-status', {
      ids,
      status: 'REJECTED',
      alasan_penolakan: alasan.trim(),
    });

    await fetchData();
    // await fetchStats();
  } catch (error) {
    console.error('Error batch reject:', error.response?.data || error);
    alert(
      `Gagal menolak data terpilih: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
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
      if (filterTahun.length && !filterTahun.includes(String(item.tahun))) return false;
      if (filterKabupaten.length && !filterKabupaten.includes(item.kabupaten_kota)) return false;
      if (filterJenisKegiatan.length && !filterJenisKegiatan.includes(normalizeKategori(item.kategori_kegiatan))) return false;
      if (filterSkalaUsaha.length && !filterSkalaUsaha.includes(item.skala_usaha)) return false;
      
      // Menggunakan filterStatus multi-select (jika diisi), jika kosong tampilkan SEMUA status
      if (filterStatus.length && !filterStatus.includes(item.status)) return false;
      
      return true;
    }),
  [data, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha, filterTahun, filterStatus],
);

  const handleExportData = async rows => {
    const exportRows = Array.isArray(rows) ? rows : [];

    if (!exportRows.length) {
      window.alert('Tidak ada data yang dapat diekspor.');
      return;
    }

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
  };

  const handleExportRekap = async () => {
    if (filterTahun.length !== 1) {
      window.alert(
        'Pilih tepat satu tahun sebelum mengekspor rekap statistik.',
      );
      return;
    }

    const selectedYear = String(filterTahun[0]);

    const selectedRegions =
      filterKabupaten.length
        ? KABUPATEN_KOTA_OPTIONS.filter(
            region =>
              filterKabupaten.includes(region),
          )
        : KABUPATEN_KOTA_OPTIONS;

    const reportRows = data.filter(
      row =>
        row.status === 'VERIFIED' &&
        String(row.tahun) === selectedYear &&
        selectedRegions.includes(
          row.kabupaten_kota,
        ),
    );

    if (!reportRows.length) {
      window.alert(
        'Tidak ada data VERIFIED pada tahun dan wilayah yang dipilih.',
      );
      return;
    }

    await downloadExcelFromApi(
      '/pengolahan-pemasaran/admin/export-rekap',
      {
        tahun: selectedYear,
        regions: selectedRegions,
        ids: reportRows
          .map(row => row.id)
          .filter(Boolean),
      },
      `Rekap_Statistik_Pengolahan_Pemasaran_${selectedYear}.xlsx`,
    );
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

  // Data sumber visualisasi: hanya baris yang sudah berstatus VERIFIED,
  // tetap menghormati filter multi-dimensi yang aktif di atas tabel.
  // Karena diturunkan langsung dari `data`, visualisasi otomatis ikut
  // berubah setiap kali ada create/update/delete/approve/reject.
  const verifiedData = useMemo(
    () => filteredData.filter(item => item.status === 'VERIFIED'),
    [filteredData],
  );

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
  }, [verifiedData]);

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

        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: {
          color: '#f8fafc',
          fontSize: 12,
        },
        
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
            `Jumlah UPI: <b>${upi.toLocaleString('id-ID')}</b>`,
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
          color: '#94a3b8',
          fontSize: 10,
        },

        inRange: {
          // Nilai rendah merah, lalu bertransisi hingga hijau emerald untuk nilai tertinggi.
          color: [
            '#dc2626',
            '#f97316',
            '#facc15',
            '#a3e635',
            '#34d399',
          ],
        },  
      },

      series: [
        {
          name: isProduksi
            ? 'Hasil Produksi'
            : 'Nilai Hasil',

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
            color: '#ffffff',
            fontSize: 10,
          },

          itemStyle: {
            areaColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 0.8,
          },

          emphasis: {
            label: {
              show: !isMobileMap,
              color: '#ffffff',
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: '#0284c7',
              borderColor: '#ffffff',
              borderWidth: 1.5,
            },
          },

          select: {
            label: {
              show: true,
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: '#f59e0b',
              borderColor: '#ffffff',
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

  // 2. Bar Chart Top 10 Kabupaten/Kota
  const barOption = useMemo(() => {
    const top10 = [...stats.produksiPerKabupaten]
      .filter(item => item[topKabFilter] > 0)
      .sort((a, b) => b[topKabFilter] - a[topKabFilter])
      .slice(0, 10)
      .reverse();

    const isProduksi = topKabFilter === 'produksi';
    const seriesName = isProduksi
      ? 'Hasil Produksi (KG)'
      : 'Nilai Hasil (Rp)';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: params => {
          const value = toNumber(params[0]?.value);

          return `${params[0]?.name}<br/>${
            isProduksi
              ? `Hasil: <b>${value.toLocaleString('id-ID')} KG</b>`
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
            color: '#334155',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#94a3b8',
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
          color: '#cbd5e1',
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
            color: '#cbd5e1',
            fontSize: 10,
            fontWeight: 600,
            formatter: params => {
              const value = toNumber(params.value);

              return isProduksi
                ? `${value.toLocaleString('id-ID')} KG`
                : formatRupiah(value);
            },
          },
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
  }, [stats.produksiPerKabupaten, topKabFilter]);

  // 3. Donut Jumlah UPI Pengolahan vs Pemasaran
  const pieOption = useMemo(() => {
    const total = stats.rasioKegiatan.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    return {
      title: {
        text: total.toLocaleString('id-ID'),
        subtext: 'Total UPI',
        left: 'center',
        top: '36%',
        textStyle: {
          color: '#e2e8f0',
          fontSize: 26,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: '#94a3b8',
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
          )} UPI</b><br/>Persentase: <b>${pct}%</b>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#cbd5e1' },
      },
      series: [
        {
          name: 'Jumlah UPI',
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: '#0f172a',
            borderWidth: 2,
          },
          label: {
            show: true,
            color: '#e2e8f0',
            formatter: params => {
              const pct = total > 0
                ? ((params.value / total) * 100).toFixed(1)
                : '0.0';

              return `${params.name}\n${params.value} UPI\n${pct}%`;
            },
          },
          labelLine: {
            lineStyle: { color: '#475569' },
          },
          data: [
            {
              ...stats.rasioKegiatan.find(
                item => item.name === 'Pengolahan',
              ),
              itemStyle: { color: '#3b82f6' },
            },
            {
              ...stats.rasioKegiatan.find(
                item => item.name === 'Pemasaran',
              ),
              itemStyle: { color: '#10b981' },
            },
          ],
        },
      ],
    };
  }, [stats.rasioKegiatan]);

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
            )} UPI</b>`,
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
            color: '#334155',
            type: 'dashed',
          },
        },

        axisLabel: {
          color: '#94a3b8',
          formatter: value =>
            Number(value).toLocaleString('id-ID'),
        },
      },

      yAxis: {
        type: 'category',
        data: chartData.map(item => item.name),

        axisLabel: {
          color: '#cbd5e1',
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
            color: '#cbd5e1',
            formatter: params =>
              `${toNumber(params.value).toLocaleString(
                'id-ID',
              )} UPI`,
          },

          itemStyle: {
            color: isPengolahan
              ? '#3b82f6'
              : '#10b981',

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
                  text: `Belum ada data detail ${activeDetailKegiatan.toLowerCase()}.`,
                  fill: '#94a3b8',
                  fontSize: 13,
                },
              },
            ]
          : [],
      };
    }, [
      activeDetailKegiatan,
      stats.detailKegiatan,
    ]);

  // 5. Line Chart Tren Tahunan: dua garis Pengolahan vs Pemasaran
  const lineOption = useMemo(() => {
    const isProduksi = trendFilter === 'produksi';

    const pengolahanKey = isProduksi
      ? 'pengolahan_produksi'
      : 'pengolahan_nilai';

    const pemasaranKey = isProduksi
      ? 'pemasaran_produksi'
      : 'pemasaran_nilai';

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: value =>
          isProduksi
            ? `${toNumber(value).toLocaleString('id-ID')} KG`
            : formatRupiah(value),
      },
      legend: {
        data: ['Pengolahan', 'Pemasaran'],
        textStyle: { color: '#cbd5e1' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '12%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: stats.trenTahunan.map(item => item.tahun),
        axisLabel: {
          color: '#94a3b8',
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#334155',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#94a3b8',
          formatter: val => {
            if (val >= 1_000_000_000_000) return `${(val / 1_000_000_000_000).toFixed(1)}T`;
            if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
            if (val >= 1_000) return `${(val / 1_000).toFixed(1)}rb`;
            return val;
          },
        },
      },
      series: [
        {
          name: 'Pengolahan',
          type: 'line',
          smooth: false,
          symbolSize: 8,
          data: stats.trenTahunan.map(item => item[pengolahanKey]),
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
        },
        {
          name: 'Pemasaran',
          type: 'line',
          smooth: false,
          symbolSize: 8,
          data: stats.trenTahunan.map(item => item[pemasaranKey]),
          lineStyle: {
            width: 3,
            color: '#10b981',
          },
          itemStyle: {
            color: '#10b981',
          },
        },
      ],
    };
  }, [stats.trenTahunan, trendFilter]);

  // ==== Akhir Visualisasi Data ====

  const columns = useMemo(
    () => [
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => (
          <StatusBadge
            row={info.row.original}
            onEdit={handleEdit}
          />
        ),
      },
      { header: 'Tahun', accessorKey: 'tahun' },
      {
        header: 'Kabupaten/Kota',
        accessorKey: 'kabupaten_kota',
        cell: info => <span className="font-medium text-foreground">{info.getValue()}</span>,
      },
      {
        header: 'Kategori',
        accessorKey: 'kategori_kegiatan',
        cell: info => {
          const value = normalizeKategori(info.getValue());
          const colorClass =
            value === 'Pengolahan'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : value === 'Pemasaran'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border';

          return (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
            >
              {value || '-'}
            </span>
          );
        },
      },
      {
        header: 'Jenis Kegiatan',
        id: 'jenis_kegiatan_detail',
        cell: info => getJenisDetail(info.row.original) || '-',
      },
      { header: 'Skala Usaha', accessorKey: 'skala_usaha' },
      {
        header: 'Unit Usaha',
        accessorKey: 'jumlah_unit_usaha',
        cell: info => toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Hasil Produksi (Kg)',
        accessorKey: 'hasil_kg',
        cell: info => toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Hasil Produksi (Rp)',
        accessorKey: 'hasil_rp',
        cell: info =>
          new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(toNumber(info.getValue())),
      },
      {
        header: 'Modal (Rp)',
        accessorKey: 'modal_rp',
        cell: info =>
          new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(toNumber(info.getValue())),
      },
    ],
    [],
  );

  // Modal input alasan penolakan. Dulunya state ini ada tapi modalnya
  // belum pernah dirender, jadi klik tombol Tolak tidak menampilkan apa-apa.
  const rejectModal =
    rejectModalOpen && rejectTarget ? (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-foreground">Tolak Data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {rejectTarget.jenis_kegiatan || '-'} &middot; {rejectTarget.kabupaten_kota} &middot; Tahun {rejectTarget.tahun}
          </p>

          <label className="mb-1.5 mt-4 block text-xs font-medium text-muted-foreground">
            Alasan Penolakan
          </label>
          <textarea
            value={rejectReason}
            onChange={event => setRejectReason(event.target.value)}
            rows={3}
            placeholder="Tuliskan alasan penolakan..."
            className={INPUT_CLASS}
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectTarget(null);
                setRejectReason('');
              }}
              disabled={rejectLoading}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={submitReject}
              disabled={rejectLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {rejectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tolak Data
            </button>
          </div>
        </div>
      </div>
    ) : null;
    
  const dataPreview = (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <DataTable
        columns={columns}
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={isAdminPusat ? handleApprove : undefined}
        onReject={isAdminPusat ? handleReject : undefined}
        onBatchApprove={isAdminPusat ? handleBatchApprove : undefined}
        onBatchReject={isAdminPusat ? handleBatchReject : undefined}
        onBatchDelete={isAdminPusat ? handleBatchDelete : undefined}
        selectRowOnClick
        customExportButton={
          <button
            type="button"
            onClick={handleExportRekap}
            disabled={!filteredData.length}
            title="Pilih satu tahun. Rekap hanya menghitung data VERIFIED dan wilayah yang dipilih."
            className="order-2 inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Ekspor Rekap Statistik
          </button>
        }
        onCustomExport={handleExportData}
        exportName={`Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );

  // ==== Blok Visualisasi Data (ditampilkan di atas tabel, hanya saat form tertutup) ====
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
              Total Unit Usaha (UPI)
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_upi.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="rounded-xl bg-blue-500/10 p-4 text-blue-500">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Hasil
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats.kpi.total_volume.toLocaleString('id-ID')}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                KG
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
              Total Nilai
            </p>
            <p className="text-xl font-bold leading-tight text-foreground">
              {formatRupiah(stats.kpi.total_nilai)}
            </p>
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

      {/* Baris 2 — Peta dan Top 10 Kabupaten/Kota */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:col-span-3">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-semibold sm:text-lg">
                  Peta Sebaran Hasil
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex">
              <select
                value={barFilter}
                onChange={event => {
                  setBarFilter(event.target.value);
                  setSelectedMapRegion(null);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-auto"
              >
                <option value="produksi">Hasil (KG)</option>
                <option value="nilai">Nilai (Rp)</option>
              </select>

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
                  {mapInteractionEnabled ? 'Kunci Peta' : 'Geser & Zoom'}
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

          {selectedMapRegion ? (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Wilayah Terpilih
                  </p>
                  <h3 className="mt-1 break-words font-semibold text-foreground">
                    {selectedMapRegion.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMapRegion(null)}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Jumlah UPI</p>
                  <p className="mt-1 font-bold text-foreground">
                    {selectedMapRegion.upi.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="rounded-xl bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">
                    Hasil Produksi
                  </p>
                  <p className="mt-1 font-bold text-foreground">
                    {selectedMapRegion.produksi.toLocaleString('id-ID')} KG
                  </p>
                </div>

                <div className="rounded-xl bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Nilai Hasil</p>
                  <p className="mt-1 break-words font-bold text-foreground">
                    {formatRupiah(selectedMapRegion.nilai)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ketuk salah satu kabupaten/kota pada peta untuk melihat rinciannya.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold">
                Top 10 Kabupaten/Kota
              </h2>
            </div>

            <select
              value={topKabFilter}
              onChange={event => setTopKabFilter(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary sm:w-auto"
            >
              <option value="produksi">Hasil (KG)</option>
              <option value="nilai">Nilai (Rp)</option>
            </select>
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
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <div>
              <h2 className="text-lg font-semibold">
                Perbandingan Jumlah UPI
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
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <Factory
                    className={`mt-0.5 h-5 w-5 ${
                      activeDetailKegiatan === 'Pengolahan'
                        ? 'text-blue-500'
                        : 'text-emerald-500'
                    }`}
                  />

                  <div>
                    <h2 className="text-lg font-semibold">
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
                          ? 'bg-blue-500 text-white'
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
                          ? 'bg-emerald-500 text-white'
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

      {/* Baris 4 — Tren Tahunan */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            <div>
              <h2 className="text-lg font-semibold">
                Tren Tahunan Pengolahan vs Pemasaran
              </h2>
            </div>
          </div>

          <select
            value={trendFilter}
            onChange={event => setTrendFilter(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="produksi">Hasil (KG)</option>
            <option value="nilai">Nilai (Rp)</option>
          </select>
        </div>

        <div className="h-[380px]">
          <ReactECharts
            option={lineOption}
            style={{ height: '100%', width: '100%' }}
          />
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
              Kelola Data Pengolahan dan Pemasaran Produk Kelautan Perikanan
            </h1>
            <p className="mt-1 text-muted-foreground">
              Input dan Kelola Data Statistik Unit Usaha Pengolahan serta Pemasaran Produk Kelautan Perikanan.
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

        {rejectModal}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Kelola Data Pengolahan dan Pemasaran Produk Kelautan Perikanan
          </h1>
          <p className="mt-1 text-muted-foreground">
            Input dan Kelola Data Statistik Unit Usaha Pengolahan serta Pemasaran Produk Kelautan Perikanan.
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

      {rejectModal}

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
                    Filter Multi-Dimensi
                  </h3>
                </div>

                {activeTab !== 'table' ? (
                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 sm:self-auto">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>Terakhir Diperbarui: {lastUpdated}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <FilterMultiSelect
                  label="Status"
                  values={filterStatus}
                  options={['VERIFIED', 'PENDING', 'REJECTED', 'APPROVED']}
                  onChange={setFilterStatus}
                  placeholder="Semua Status"
                />

                <FilterMultiSelect
                  label="Tahun"
                  values={filterTahun}
                  options={tahunOptions}
                  onChange={setFilterTahun}
                  placeholder="Semua Tahun"
                />

                <FilterMultiSelect
                  label="Kabupaten/Kota"
                  values={filterKabupaten}
                  options={KABUPATEN_KOTA_OPTIONS}
                  onChange={setFilterKabupaten}
                  placeholder="Semua Kabupaten/Kota"
                />

                <FilterMultiSelect
                  label="Kategori Kegiatan"
                  values={filterJenisKegiatan}
                  options={['Pengolahan', 'Pemasaran']}
                  onChange={setFilterJenisKegiatan}
                  placeholder="Semua Kategori Kegiatan"
                />

                <FilterMultiSelect
                  label="Skala Usaha"
                  values={filterSkalaUsaha}
                  options={['Mikro', 'Kecil', 'Menengah', 'Besar']}
                  onChange={setFilterSkalaUsaha}
                  placeholder="Semua Skala Usaha"
                />
     
              </div>
            </div>
          </div>

          {/* Box tabel/search/export dipisahkan dari box filter */}
          {activeTab === 'table' ? dataPreview : dataVisualization}
        </>
      )}
    </div>
  );
}