import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Plus, MapPin, TrendingUp, Factory, Box, LineChart, Users, Filter, ChevronDown, Search, X, AlertTriangle, Info, Pencil } from 'lucide-react';
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
  'w-full rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10';

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
  const normalizedValues = Array.isArray(values) ? values : [];
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
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(previous => !previous)}
        className={`${FILTER_SELECT_CLASS} flex items-center justify-between gap-3 text-left`}
      >
        <span className={normalizedValues.length ? 'truncate text-foreground' : 'truncate text-muted-foreground'}>
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

/**
 * StatusBadge
 * -----------
 * Menampilkan status data (PENDING / APPROVED / VERIFIED / REJECTED).
 *
 * Khusus untuk status REJECTED, badge tetap menampilkan tautan
 * "Lihat & Perbaiki" di bawahnya (tidak dihapus, sesuai permintaan).
 * Badge REJECTED sudah TIDAK berkedip lagi (animasi pulse dihapus) supaya
 * lebih nyaman dilihat namun tetap jelas terlihat.
 *
 * Saat "Lihat & Perbaiki" diklik, muncul modal berisi:
 *  - konteks data (Nama UPI, Nama Pemilik, Jenis Kegiatan, Kabupaten/Kota, Tahun)
 *  - alasan penolakan dari Admin Pusat
 *  - panduan singkat apa yang harus dilakukan
 *  - tombol "Perbaiki Data Sekarang" yang langsung membuka form edit (onEdit)
 *
 * Modal dibuat lebih besar (max-w-2xl) dan seluruh teks di dalamnya memakai
 * break-words + kontainer scrollable, sehingga teks panjang (nama UPI,
 * alasan penolakan, dst.) tidak akan keluar dari kotak pop up.
 */
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
                    {row?.nama_upi || '(Tanpa Nama UPI)'}
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
                  <dt className="text-xs font-medium text-muted-foreground">Nama UPI</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.nama_upi || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Nama Pemilik</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.nama_pemilik || '-'}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">Jenis Kegiatan</dt>
                  <dd className="break-words font-semibold text-foreground">
                    {row?.jenis_kegiatan || '-'}
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
                  Alasan Penolakan dari Admin Pusat
                </p>
                <p className="mt-2 break-words text-sm leading-relaxed text-foreground">
                  {alasan || 'Tidak ada alasan yang dicantumkan oleh Admin Pusat.'}
                </p>
              </div>

              {/* Panduan singkat */}
              <div className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground break-words whitespace-normal">
                Silakan perbaiki data sesuai alasan di atas. Setelah diperbaiki dan disimpan,
                status data akan otomatis kembali menjadi <b>PENDING</b> dan akan diperiksa
                ulang oleh Admin Pusat.
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

const getJenisDetail = row =>
  row.jenis_kegiatan === 'Pengolahan'
    ? row.jenis_kegiatan_pengolahan
    : row.jenis_kegiatan_pemasaran;

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

  // Modal input alasan penolakan (saat Admin Pusat menolak data)
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
    } catch (error) {
      console.error('Error deleting pengolahan & pemasaran:', error);
      alert('Gagal menghapus data.');
    }
  };

  const handleApprove = async row => {
  if (!isAdminPusat) {
    alert('Hanya Admin Pusat yang dapat melakukan validasi data.');
    return;
  }

  if (row.status === 'VERIFIED') {
    alert('Data sudah VERIFIED.');
    return;
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
    await api.put(`/pengolahan-pemasaran/${row.id}/status`, {
      status: targetStatus,
    });

    await fetchData();
    // await fetchStats();
  } catch (error) {
    console.error('Error approving data:', error.response?.data || error);
    alert(
      `Gagal memvalidasi data: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
  }
};

  const handleReject = row => {
  if (!isAdminPusat) {
    alert('Hanya Admin Pusat yang dapat menolak data.');
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
    alert('Hanya Admin Pusat yang dapat melakukan validasi data.');
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
    alert('Ada data yang sudah VERIFIED. Pilih data lain.');
    return;
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
    await api.post('/pengolahan-pemasaran/batch-status', {
      ids,
      status: targetStatus,
    });

    await fetchData();
    // await fetchStats();
  } catch (error) {
    console.error('Error batch approve:', error.response?.data || error);
    alert(
      `Gagal memvalidasi data terpilih: ${
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message
      }`
    );
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
    alert('Hanya Admin Pusat yang dapat menolak data.');
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
        if (filterJenisKegiatan.length && !filterJenisKegiatan.includes(item.jenis_kegiatan)) return false;
        if (filterSkalaUsaha.length && !filterSkalaUsaha.includes(item.skala_usaha)) return false;
        return true;
      }),
    [data, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha, filterTahun],
  );

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
      (sum, row) => sum + toNumber(row.hasil_produksi_per_tahun_kg),
      0,
    );

    const total_nilai = rows.reduce(
      (sum, row) => sum + toNumber(row.nilai_hasil_produksi_per_tahun_rp),
      0,
    );

    // UPI dihitung unik berdasarkan id_upi/upi_id.
    // Jika ID UPI belum tersedia, fallback memakai nama UPI + kabupaten/kota.
    const upiMap = new Map();

    rows.forEach(row => {
      const key = getUpiKey(row);
      if (!key || upiMap.has(key)) return;

      upiMap.set(key, {
        key,
        jenis_kegiatan: row.jenis_kegiatan || 'Lainnya',
      });
    });

    const total_upi = upiMap.size;

    // Agregasi jenis produk tetap digunakan untuk KPI Top Produk.
    const produkMap = new Map();

    rows.forEach(row => {
      const name = String(row.jenis_produk || 'Tidak diketahui').trim();

      if (!produkMap.has(name)) {
        produkMap.set(name, {
          name,
          produksi: 0,
          nilai: 0,
          upiKeys: new Set(),
        });
      }

      const current = produkMap.get(name);
      current.produksi += toNumber(row.hasil_produksi_per_tahun_kg);
      current.nilai += toNumber(row.nilai_hasil_produksi_per_tahun_rp);

      const upiKey = getUpiKey(row);
      if (upiKey) current.upiKeys.add(upiKey);
    });

    const produkData = [...produkMap.values()]
      .map(item => ({
        name: item.name,
        produksi: item.produksi,
        nilai: item.nilai,
        upi: item.upiKeys.size,
      }))
      .sort((a, b) => b.produksi - a.produksi);

    const topProduk = produkData[0] || {
      name: '-',
      produksi: 0,
      nilai: 0,
      upi: 0,
    };

    // Agregasi kabupaten/kota untuk peta dan Top 10.
    const kabupatenMap = new Map();

    KABUPATEN_KOTA_OPTIONS.forEach(name => {
      kabupatenMap.set(name, {
        name,
        produksi: 0,
        nilai: 0,
        upiKeys: new Set(),
      });
    });

    rows.forEach(row => {
      const name = row.kabupaten_kota;
      if (!name) return;

      if (!kabupatenMap.has(name)) {
        kabupatenMap.set(name, {
          name,
          produksi: 0,
          nilai: 0,
          upiKeys: new Set(),
        });
      }

      const current = kabupatenMap.get(name);
      current.produksi += toNumber(row.hasil_produksi_per_tahun_kg);
      current.nilai += toNumber(row.nilai_hasil_produksi_per_tahun_rp);

      const upiKey = getUpiKey(row);
      if (upiKey) current.upiKeys.add(upiKey);
    });

    const produksiPerKabupaten = [...kabupatenMap.values()].map(item => ({
      name: item.name,
      produksi: item.produksi,
      nilai: item.nilai,
      upi: item.upiKeys.size,
    }));

    // Jumlah UPI unik pada setiap jenis detail kegiatan.
    const detailKegiatanMaps = {
      Pengolahan: new Map(),
      Pemasaran: new Map(),
    };
    
    rows.forEach((row, rowIndex) => {
      const kelompok = row.jenis_kegiatan;
      
      if (
        kelompok !== 'Pengolahan' &&
        kelompok !== 'Pemasaran'
      ) {
        return;
      }
      
      const detail =
        kelompok === 'Pengolahan'
          ? row.jenis_kegiatan_pengolahan
          : row.jenis_kegiatan_pemasaran;

      const detailName = String(detail ?? '').trim();

      if (!detailName) return;

      if (!detailKegiatanMaps[kelompok].has(detailName)) {
        detailKegiatanMaps[kelompok].set(
          detailName,
          new Set(),
        );
      }

      const upiKey =
        getUpiKey(row) ||
        String(row.id ?? `row-${rowIndex}`);

      detailKegiatanMaps[kelompok]
        .get(detailName)
        .add(upiKey);
    });

    const detailKegiatan = {
      Pengolahan: [
        ...detailKegiatanMaps.Pengolahan.entries(),
      ]
        .map(([name, upiKeys]) => ({
          name,
          value: upiKeys.size,
        }))
        .sort((a, b) => b.value - a.value),

      Pemasaran: [
        ...detailKegiatanMaps.Pemasaran.entries(),
      ]
        .map(([name, upiKeys]) => ({
          name,
          value: upiKeys.size,
        }))
        .sort((a, b) => b.value - a.value),
    };

    // Donut: jumlah UPI unik Pengolahan vs Pemasaran.
    const rasioKegiatan = [
      {
        name: 'Pengolahan',
        value: [...upiMap.values()].filter(
          item => item.jenis_kegiatan === 'Pengolahan',
        ).length,
      },
      {
        name: 'Pemasaran',
        value: [...upiMap.values()].filter(
          item => item.jenis_kegiatan === 'Pemasaran',
        ).length,
      },
    ];

    // Tren tahunan dua garis: Pengolahan vs Pemasaran.
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
      const produksi = toNumber(row.hasil_produksi_per_tahun_kg);
      const nilai = toNumber(row.nilai_hasil_produksi_per_tahun_rp);

      if (row.jenis_kegiatan === 'Pengolahan') {
        current.pengolahan_produksi += produksi;
        current.pengolahan_nilai += nilai;
      } else if (row.jenis_kegiatan === 'Pemasaran') {
        current.pemasaran_produksi += produksi;
        current.pemasaran_nilai += nilai;
      }
    });

    const trenTahunan = [...yearlyMap.values()].sort(
      (a, b) => Number(a.tahun) - Number(b.tahun),
    );

    return {
      produksiPerKabupaten,
      produkData,
      detailKegiatan,
      rasioKegiatan,
      trenTahunan,
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

  // 1. Peta Choropleth Jawa Timur
  // const mapOption = useMemo(() => {
  //   const mapData = stats.produksiPerKabupaten.map(item => ({
  //     name: getGeoRegionName(item.name),
  //     dbName: item.name,
  //     value:
  //       barFilter === 'produksi'
  //       ? item.produksi
  //       : item.nilai,
      
  //     produksi: toNumber(item.produksi),
  //     nilai: toNumber(item.nilai),
  //     upi: toNumber(item.upi),
  //   }));

  //   const maxVal = mapData.length > 0
  //     ? Math.max(...mapData.map(item => item.value))
  //     : 0;

  //   const isProduksi = barFilter === 'produksi';

  //   return {
  //     title: {
  //       text: 'Sebaran Hasil Pengolahan & Pemasaran per Kabupaten/Kota',
  //       textStyle: {
  //         color: '#e2e8f0',
  //         fontSize: 16,
  //         fontFamily: 'Inter',
  //       },
  //       left: 'center',
  //       top: 10,
  //     },
  //     tooltip: {
  //       trigger: 'item',
  //       formatter: params => {
  //         const item = params.data || {
  //           produksi: 0,
  //           nilai: 0,
  //           upi: 0,
  //         };

  //         return [
  //           `<b>${params.name}</b>`,
  //           `Jumlah UPI: <b>${toNumber(item.upi).toLocaleString('id-ID')}</b>`,
  //           `Hasil: <b>${toNumber(item.produksi).toLocaleString('id-ID')} KG</b>`,
  //           `Nilai: <b>${formatRupiah(item.nilai)}</b>`,
  //         ].join('<br/>');
  //       },
  //     },
  //     visualMap: {
  //       left: 'right',
  //       min: 0,
  //       max: maxVal || 1,
  //       inRange: {
  //         color: ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#34d399'],
  //       },
  //       text: ['Tinggi', 'Rendah'],
  //       textStyle: { color: '#94a3b8' },
  //       calculable: true,
  //       type: 'piecewise',
  //       splitNumber: 5,
  //     },
  //     series: [
  //       {
  //         name: isProduksi ? 'Hasil Produksi' : 'Nilai Hasil',
  //         type: 'map',
  //         map: 'jawa_timur',
  //         roam: true,
  //         label: { show: false, color: '#fff' },
  //         emphasis: {
  //           label: { show: true, color: '#fff' },
  //           itemStyle: { areaColor: '#f59e0b' },
  //         },
  //         itemStyle: {
  //           areaColor: '#1e293b',
  //           borderColor: '#334155',
  //         },
  //         data: mapData,
  //       },
  //     ],
  //   };
  // }, [stats.produksiPerKabupaten, barFilter]);

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
          // Konvensi choropleth: nilai rendah lebih terang, nilai tinggi lebih gelap.
          color: [
            '#2563eb',
            '#38bdf8', 
            '#facc15', 
            '#f97316', 
            '#dc2626',
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
            areaColor: '#1e293b',
            borderColor: '#475569',
            borderWidth: 0.8,
          },

          emphasis: {
            label: {
              show: !isMobileMap,
              color: '#ffffff',
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: '#f59e0b',
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
          smooth: true,
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
          smooth: true,
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
      { header: 'Nama UPI', accessorKey: 'nama_upi' },
      { header: 'Nama Pemilik', accessorKey: 'nama_pemilik' },
      {
        header: 'Jenis Kegiatan',
        accessorKey: 'jenis_kegiatan',
        cell: info => {
          const value = info.getValue();
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
        header: 'Nilai Hasil Produksi/Tahun (Rp)',
        accessorKey: 'nilai_hasil_produksi_per_tahun_rp',
        cell: info =>
          new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(toNumber(info.getValue())),
      },
      {
        header: 'Total Tenaga Kerja',
        id: 'total_tenaga_kerja',
        cell: info => getRowTotalTenagaKerja(info.row.original).toLocaleString('id-ID'),
      },
      {
        header: 'Terakhir Diperbarui',
        id: 'terakhir_diperbarui',
        cell: info => {
          const rawDate = getRowUpdatedAt(info.row.original);
          return (
            <span
              className="whitespace-nowrap text-sm text-muted-foreground"
              title={rawDate ? new Date(rawDate).toLocaleString('id-ID') : undefined}
            >
              {formatRelativeTime(rawDate)}
            </span>
          );
        },
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
            {rejectTarget.nama_upi || '(Tanpa Nama UPI)'} &middot; {rejectTarget.kabupaten_kota} &middot; Tahun {rejectTarget.tahun}
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
        approvableStatuses={['PENDING', 'APPROVED']}
        rejectableStatuses={['PENDING', 'APPROVED', 'VERIFIED']}
        lockedStatuses={['APPROVED', 'VERIFIED']}
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
              Top Produk
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
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Ketuk wilayah untuk melihat rincian datanya.
              </p>
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
                Donut Jumlah UPI
              </h2>
              <p className="text-sm text-muted-foreground">
                Perbandingan UPI Pengolahan dan Pemasaran.
              </p>
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

                    <p className="mt-1 text-sm text-muted-foreground">
                      Jumlah UPI berdasarkan jenis detail{' '}
                      {activeDetailKegiatan.toLowerCase()}.
                    </p>
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
              <p className="text-sm text-muted-foreground">
                Dua garis dipakai agar perkembangan kedua jenis kegiatan mudah dibandingkan.
              </p>
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

        {rejectModal}
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

      {rejectModal}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-6 border-b border-border pb-5">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
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
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'visualisasi'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Visualisasi Statistik
              </button>
            </div>

            <div className="pt-5">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Filter Multi-Dimensi
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  label="Jenis Kegiatan"
                  values={filterJenisKegiatan}
                  options={['Pengolahan', 'Pemasaran']}
                  onChange={setFilterJenisKegiatan}
                  placeholder="Semua Jenis Kegiatan"
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

          {activeTab === 'table' ? dataPreview : dataVisualization}
        </>
      )}
    </div>
  );
}