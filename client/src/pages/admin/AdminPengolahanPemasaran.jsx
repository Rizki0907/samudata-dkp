import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Plus, MapPin, TrendingUp, Factory, Box, LineChart, Users, Filter, ChevronDown, Search } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { DataTable } from '@/components/shared/DataTable';
import PengolahanPemasaranForm from '@/components/admin/PengolahanPemasaranForm';
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
      // Backend dashboard-stats saat ini masih memakai filter single value.
      // Kalau user memilih lebih dari satu opsi, filter tetap berjalan di tabel,
      // sedangkan visualisasi tidak dipaksa mengirim format yang belum didukung backend.
      if (filterTahun.length === 1) params.append('tahun', filterTahun[0]);
      if (filterKabupaten.length === 1) params.append('kabupaten_kota', filterKabupaten[0]);
      if (filterJenisKegiatan.length === 1) params.append('jenis_kegiatan', filterJenisKegiatan[0]);
      if (filterSkalaUsaha.length === 1) params.append('skala_usaha', filterSkalaUsaha[0]);

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

    if (selectedRows.some(row => row.status === 'APPROVED')) {
      alert('Ada data yang sudah selesai divalidasi Program. Pilih data lain.');
      return;
    }

    if (selectedRows.some(row => row.status === 'REJECTED')) {
      alert('Data yang ditolak harus diperbaiki dulu agar kembali ke status PENDING.');
      return;
    }

    const selectedStatuses = [...new Set(selectedRows.map(row => row.status))];

    if (selectedStatuses.length > 1) {
      alert('Pilih data dengan status yang sama. Validasi Bidang hanya untuk PENDING, sedangkan Validasi Program hanya untuk APPROVED_BIDANG.');
      return;
    }

    const currentStatus = selectedStatuses[0];
    let promptMsg = '';

    if (currentStatus === 'PENDING') {
      promptMsg = `Data yang dipilih masih PENDING (${selectedRows.length} data).\nKetik "1" untuk Validasi Bidang.\n\nCatatan: Validasi Program belum bisa dilakukan sebelum Validasi Bidang.`;
    } else if (currentStatus === 'APPROVED_BIDANG') {
      promptMsg = `Data yang dipilih sudah divalidasi Bidang (${selectedRows.length} data).\nKetik "2" untuk Validasi Program.`;
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
        alert('Validasi Bidang hanya bisa dilakukan pada data berstatus PENDING.');
        return;
      }

      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
    } else if (jenis === '2') {
      if (currentStatus !== 'APPROVED_BIDANG') {
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
      `Ketik "SETUJU" untuk menyelesaikan Validasi ${namaValidasi} pada ${selectedRows.length} data:`
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
      await fetchStats();
    } catch (error) {
      console.error('Error batch approve:', error);
      alert(`Gagal memvalidasi data terpilih: ${error?.response?.data?.message || error.message}`);
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
      await fetchStats();
    } catch (error) {
      console.error('Error batch reject:', error);
      alert(`Gagal menolak data terpilih: ${error?.response?.data?.message || error.message}`);
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
      await fetchStats();
    } catch (error) {
      console.error('Error batch delete:', error);
      alert(`Gagal menghapus data terpilih: ${error?.response?.data?.message || error.message}`);
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
    ],
    [],
  );

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

          {activeTab === 'table' ? (
            dataPreview
          ) : statsLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {dataVisualization}
            </div>
          )}
        </>
      )}
    </div>
  );
}