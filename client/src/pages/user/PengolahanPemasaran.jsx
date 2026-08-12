// File ini digunakan sebagai halaman publik Pengolahan dan Pemasaran.
// Halaman ini hanya menampilkan data yang telah berstatus VERIFIED,
// serta menyediakan tabel data, filter, pencarian, ekspor data,
// Rekap Statistik, dan berbagai visualisasi statistik untuk pengguna publik.

 
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
 
import {Box, Factory, FileText, LineChart, Loader2, MapPin, TrendingUp, Users, Clock, Download, ChevronDown, Search, X, } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';
import { useThemeStore } from '@/store/themeStore';
import { useMasterDataStore } from '@/store/masterDataStore';

// Menyamakan format nama Kab/Kota agar data dapat dicocokkan dengan wilayah pada peta.
const normalizeRegionKey = (value) => {
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
  (geoJsonData.features || []).map((feature) => {
    const properties = feature?.properties || {};

    const geoName = properties.name || properties.NAME_2 || '';

    const regionType = String(properties.TYPE_2 || '').toUpperCase();

    const baseName = String(geoName)
      .replace(/^KOTA\s+/i, '')
      .trim();

    const databaseStyleName =
      regionType === 'KOTA' ? `KOTA ${baseName}` : `KAB ${baseName}`;

    return [normalizeRegionKey(databaseStyleName), geoName];
  }),
);

const getGeoRegionName = (databaseName) => {
  return GEO_REGION_NAME_MAP.get(normalizeRegionKey(databaseName)) || databaseName;
};

// Registrasi peta Jawa Timur
echarts.registerMap('jawa_timur', geoJsonData);

// Fungsi bantuan untuk mengubah angka menjadi format tampilan Rupiah dan angka ringkas.
const formatRupiah = (value) =>
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '');
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


// Menyiapkan beberapa bentuk angka agar pencarian tabel tetap bekerja pada angka biasa maupun angka berformat.
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

const getRowUpdatedAt = row =>
  row?.updated_at ??
  row?.updatedAt ??
  row?.updated_At ??
  row?.created_at ??
  row?.createdAt ??
  null;

// Memeriksa apakah satu paket data sesuai dengan filter Jenis Kegiatan dan Skala Usaha yang dipilih.
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

const normalizeKategori = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

// Mengunduh file Excel dari endpoint backend dan menampilkan pesan jika proses ekspor gagal.
const downloadExcelFromApi = async (endpoint, payload, fileName) => {
  try {
    const response = await api.post(endpoint, payload, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Gagal mengunduh file Excel:', error);

    let message = 'Gagal mengunduh file Excel.';

    const responseData = error?.response?.data;

    if (responseData instanceof Blob) {
      try {
        const errorText = await responseData.text();
        const errorJson = JSON.parse(errorText);

        message = errorJson.message || message;
      } catch {
      }
    } else if (responseData?.message) {
      message = responseData.message;
    }

    throw new Error(message);
  }
};

// Halaman publik Pengolahan dan Pemasaran. Data yang ditampilkan hanya data berstatus VERIFIED.
export default function PengolahanPemasaran() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // Master data dinamis: menambah/menghapus data di halaman Master Data
  // Mengambil pilihan Kab/Kota dan Skala Usaha dari Master Data.
  const { getOptions } = useMasterDataStore();
  const KABUPATEN_KOTA_OPTIONS = getOptions('KABUPATEN_KOTA');
  const SKALA_USAHA_OPTIONS = getOptions('KATEGORI_SKALA_USAHA');

  const chartColors = useMemo(
    () => ({
      textStrong: isDark ? '#e2e8f0' : '#1e293b', // label kategori, judul angka besar
      textMuted: isDark ? '#94a3b8' : '#64748b', // sumbu nilai, subtext, teks sekunder
      gridLine: isDark ? '#334155' : '#cbd5e1', // garis bantu grid & sumbu
      labelLine: isDark ? '#475569' : '#94a3b8', // garis penunjuk label pie
      tooltipBg: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
      tooltipBorder: isDark ? '#334155' : '#e2e8f0',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      mapArea: isDark ? '#1e293b' : '#f8fafc',
      mapBorder: isDark ? '#334155' : '#cbd5e1',
      mapLabel: isDark ? '#ffffff' : '#0f172a',
      mapEmphasisBorder: isDark ? '#ffffff' : '#0f172a',
      mapHoverArea: isDark ? '#38bdf8' : '#f59e0b',
      mapSelectedArea: isDark ? '#0284c7' : '#f59e0b',
      pieBorder: isDark ? '#0f172a' : '#ffffff',
      mapInRange: isDark
        ? ['#dc2626', '#f97316', '#facc15', '#a3e635', '#34d399']
        : ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e'],
      barGradientStart: isDark ? '#0ea5e9' : '#0284c7',
      barGradientEnd: isDark ? '#2563eb' : '#1e40af',
      categoryPengolahan: '#0096C7',
      categoryPemasaran: isDark ? '#34D399' : '#10B981',
    }),
    [isDark],
  );

  // State utama untuk data, status pemuatan, filter, pilihan grafik, dan dialog Rekap Statistik.
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('-');

  // Filter utama dashboard dan tabel
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterJenisKegiatan, setFilterJenisKegiatan] = useState([]);
  const [filterKabupaten, setFilterKabupaten] = useState([]);
  const [filterSkalaUsaha, setFilterSkalaUsaha] = useState([]);

  // Pilihan metrik visualisasi
  const [barFilter, setBarFilter] = useState('produksi');
  const [topKabFilter, setTopKabFilter] = useState('produksi');
  const [detailKegiatanFilter, setDetailKegiatanFilter] = useState('Pengolahan');
  const [trendPengolahanFilter, setTrendPengolahanFilter] = useState('produksi');
  const [trendPemasaranFilter, setTrendPemasaranFilter] = useState('produksi');

   
  const [selectedMapRegion, setSelectedMapRegion] = useState(null);
  const [isMobileMap, setIsMobileMap] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);

  const [rekapDialogOpen, setRekapDialogOpen] = useState(false);
  const [noticeDialog, setNoticeDialog] = useState(null);
  const [rekapTahun, setRekapTahun] = useState('');
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapError, setRekapError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobileState = (event) => {
      setIsMobileMap(event.matches);
      if (!event.matches) {
        setMapInteractionEnabled(true);
      } else {
        setMapInteractionEnabled(false);
      }
    };
    updateMobileState(mediaQuery);

    mediaQuery.addEventListener('change', updateMobileState);
    return () => {
      mediaQuery.removeEventListener('change', updateMobileState);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await api.get('/pengolahan-pemasaran');
        const responseData = Array.isArray(response.data?.data) ? response.data.data : [];

        // Perlindungan tambahan di frontend:
        // data selain VERIFIED tidak akan dihitung atau ditampilkan.
        setData(responseData.filter((item) => item.status === 'VERIFIED'));

        const verifiedData = responseData.filter((item) => item.status === 'VERIFIED');
        if (verifiedData.length > 0) {
          const latest = verifiedData.reduce((a, b) =>
            new Date(a.updated_at) > new Date(b.updated_at) ? a : b,
          );
          const updatedAt = new Date(latest.updated_at);
          const datePart = updatedAt.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const timePart = updatedAt
            .toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            .replace(':', '.');

          setLastUpdated(`${datePart} ${timePart}`);
        } else {
          setLastUpdated('-');
        }
      } catch (error) {
        console.error(
          'Error fetching pengolahan dan pemasaran:',
          error.response?.data || error,
        );
        setData([]);
        setLastUpdated('-');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tahunOptions = useMemo(
    () =>
      [...new Set(data.map((item) => String(item.tahun ?? '')).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [data],
  );

  // Menyaring data sesuai filter aktif dan menempatkan data yang paling baru diperbarui di urutan atas.
  const filteredData = useMemo(
    () =>
      data
        .filter(item => {
          if (filterTahun.length && !filterTahun.includes(String(item.tahun))) return false;
          if (filterKabupaten.length && !filterKabupaten.includes(item.kabupaten_kota)) return false;
          if (!packageMatchesDetailFilters(item, filterJenisKegiatan, filterSkalaUsaha)) return false;
          return true;
        })
        .sort((a, b) => {
          const timeA = new Date(getRowUpdatedAt(a) || 0).getTime();
          const timeB = new Date(getRowUpdatedAt(b) || 0).getTime();
          return timeB - timeA;
        }),
    [data, filterTahun, filterKabupaten, filterJenisKegiatan, filterSkalaUsaha],
  );

  // Menangani ekspor data tabel yang sedang dipilih atau ditampilkan.
  const handleExportData = async (rows) => {
    const exportRows = Array.isArray(rows) ? rows : [];

    if (!exportRows.length) {
      setNoticeDialog({
        title: 'Ekspor Data',
        message: 'Tidak ada data yang dapat diekspor.',
      });
      return;
    }

    await downloadExcelFromApi(
      '/pengolahan-pemasaran/export-data',
      {
        ids: exportRows.map((row) => row.id).filter(Boolean),
      },
      `Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}.xlsx`,
    );
  };

  const openRekapDialog = () => {
    setRekapTahun('');
    setRekapError('');
    setRekapDialogOpen(true);
  };

  const exportRekapForYear = async (year, closeDialogAfterSuccess = false) => {
    const selectedYear = String(year || '').trim();
    if (!selectedYear) { setRekapError('Pilih tahun terlebih dahulu.'); return; }
    const selectedRegions = filterKabupaten.length
      ? KABUPATEN_KOTA_OPTIONS.filter(region => filterKabupaten.includes(region))
      : KABUPATEN_KOTA_OPTIONS;
    const reportRows = data.filter(row => String(row.tahun) === selectedYear && selectedRegions.includes(row.kabupaten_kota));
    if (!reportRows.length) {
      setRekapError(filterKabupaten.length ? 'Tidak ada data VERIFIED pada tahun dan wilayah yang sedang dipilih.' : 'Tidak ada data VERIFIED pada tahun tersebut.');
      return;
    }
    try {
      setRekapLoading(true); setRekapError('');
      await downloadExcelFromApi('/pengolahan-pemasaran/export-rekap', { tahun: selectedYear, regions: selectedRegions, ids: reportRows.map(row => row.id).filter(Boolean) }, `Rekap_Statistik_Pengolahan_Pemasaran_${selectedYear}.xlsx`);
      if (closeDialogAfterSuccess) setRekapDialogOpen(false);
    } catch (error) {
      setRekapError(error.message || 'Gagal mengunduh rekap statistik.');
      if (!closeDialogAfterSuccess) { setRekapDialogOpen(true); setRekapTahun(selectedYear); }
    } finally { setRekapLoading(false); }
  };

  const handleExportRekap = () => exportRekapForYear(rekapTahun, true);
  const handleRekapButtonClick = () => {
    if (filterTahun.length === 1) { exportRekapForYear(String(filterTahun[0]), false); return; }
    openRekapDialog();
  };

  // Mengolah data VERIFIED menjadi nilai KPI serta sumber data untuk seluruh visualisasi.
  const stats = useMemo(() => {
    const rows = flattenPackageDetails(filteredData);

    const total_volume = rows.reduce((sum, row) => sum + toNumber(row.hasil_kg), 0);
    const total_nilai = rows.reduce((sum, row) => sum + toNumber(row.hasil_rp), 0);
    const total_upi = rows.reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0);

    const kegiatanMap = new Map();
    rows.forEach((row) => {
      const name = String(row.jenis_kegiatan || 'Tidak diketahui').trim();
      if (!kegiatanMap.has(name)) {
        kegiatanMap.set(name, { name, produksi: 0, nilai: 0, upi: 0 });
      }
      const current = kegiatanMap.get(name);
      current.produksi += toNumber(row.hasil_kg);
      current.nilai += toNumber(row.hasil_rp);
      current.upi += toNumber(row.jumlah_unit_usaha);
    });

    const produkData = [...kegiatanMap.values()].sort((a, b) => b.produksi - a.produksi);
    const topProduk = produkData[0] || {
      name: '-',
      produksi: 0,
      nilai: 0,
      upi: 0,
    };

    const kabupatenMap = new Map();
    KABUPATEN_KOTA_OPTIONS.forEach((name) => {
      kabupatenMap.set(name, { name, produksi: 0, nilai: 0, upi: 0 });
    });

    rows.forEach((row) => {
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
    const detailMaps = {
      Pengolahan: new Map(),
      Pemasaran: new Map(),
    };

    rows.forEach((row) => {
      const kategori = normalizeKategori(row.kategori_kegiatan);
      const detail = String(row.jenis_kegiatan ?? '').trim();
      if (!detail) return;
      const target = detailMaps[kategori];
      target.set(detail, (target.get(detail) || 0) + toNumber(row.jumlah_unit_usaha));
    });

    const detailKegiatan = {
      Pengolahan: [...detailMaps.Pengolahan.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      Pemasaran: [...detailMaps.Pemasaran.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };

    const rasioKegiatan = ['Pengolahan', 'Pemasaran'].map((name) => ({
      name,
      value: rows
        .filter((row) => normalizeKategori(row.kategori_kegiatan) === name)
        .reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0),
    }));

    const trendRows = rows;

    const yearlyMap = new Map();
    trendRows.forEach((row) => {
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
  }, [filteredData, KABUPATEN_KOTA_OPTIONS]);

  const singleSelectedCategory =
    filterJenisKegiatan.length === 1 ? filterJenisKegiatan[0] : '';

  const activeDetailKegiatan = singleSelectedCategory || detailKegiatanFilter;

  const showDetailKegiatanToggle = filterJenisKegiatan.length !== 1;

  // Menampilkan rincian Unit dan Produksi serta Modal ketika satu baris tabel dibuka.
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

  // Mendefinisikan kolom pada tabel data publik.
  const columns = useMemo(
    () => [
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

  // Menyusun konfigurasi peta persebaran data Pengolahan dan Pemasaran per Kab/Kota.
  const mapOption = useMemo(() => {
    const mapData = stats.produksiPerKabupaten.map((item) => ({
      name: getGeoRegionName(item.name),
      dbName: item.name,
      value: barFilter === 'produksi' ? toNumber(item.produksi) : toNumber(item.nilai),

      produksi: toNumber(item.produksi),
      nilai: toNumber(item.nilai),
      upi: toNumber(item.upi),
    }));

    const maxValue = mapData.length ? Math.max(...mapData.map((item) => item.value)) : 0;

    const isProduksi = barFilter === 'produksi';

    const allowRoam = !isMobileMap || mapInteractionEnabled;

    return {
      animationDuration: 400,

      tooltip: {
        trigger: 'item',

        // HP memakai tap, desktop bisa hover dan klik.
        triggerOn: isMobileMap ? 'click' : 'mousemove|click',

        confine: true,

        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        borderWidth: 1,
        

        formatter: (params) => {
          const item = params.data || {};

          const regionName = item.dbName || params.name || 'Wilayah';

          const produksi = toNumber(item.produksi);
          const nilai = toNumber(item.nilai);
          const upi = toNumber(item.upi);

          return [
            `<b>${regionName}</b>`,
            `Total Unit Usaha: <b>${upi.toLocaleString('id-ID')}</b>`,
            `Hasil: <b>${produksi.toLocaleString('id-ID')} Kg</b>`,
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

        orient: isMobileMap ? 'horizontal' : 'vertical',

        left: isMobileMap ? 'center' : 'right',

        right: isMobileMap ? 'auto' : 5,

        top: isMobileMap ? 'auto' : 'middle',

        bottom: isMobileMap ? 4 : 'auto',

        itemWidth: isMobileMap ? 150 : 14,

        itemHeight: isMobileMap ? 10 : 120,

        calculable: false,

        text: ['Tinggi', 'Rendah'],

        textStyle: {
          color: chartColors.textMuted,
          fontSize: 10,
        },

        inRange: {
          color: chartColors.mapInRange,
        },
      },

      series: [
        {
          name: isProduksi ? 'Hasil Produksi' : 'Nilai Produksi',

          type: 'map',
          map: 'jawa_timur',

          roam: allowRoam,

          // Sedikit diperbesar supaya lebih nyaman dilihat.
          zoom: isMobileMap ? 1.08 : 1.12,

          layoutCenter: [isMobileMap ? '50%' : '47%', isMobileMap ? '44%' : '50%'],

          layoutSize: isMobileMap ? '100%' : '108%',

          selectedMode: 'single',

          label: {
            show: false,
            color: chartColors.mapLabel,
            fontSize: 10,
          },

          itemStyle: {
            areaColor: chartColors.mapArea,
            borderColor: chartColors.mapBorder,
            borderWidth: 0.8,
          },

          emphasis: {
            label: {
              show: !isMobileMap,
              color: chartColors.mapLabel,
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: chartColors.mapHoverArea,
              borderColor: chartColors.mapEmphasisBorder,
              borderWidth: 1.5,
            },
          },

          select: {
            label: {
              show: true,
              color: chartColors.mapLabel,
              fontSize: 10,
              fontWeight: 'bold',
            },

            itemStyle: {
              areaColor: chartColors.mapSelectedArea,
              borderColor: chartColors.mapEmphasisBorder,
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
    chartColors,
  ]);

  const mapEvents = useMemo(
    () => ({
      click: (params) => {
        if (params.seriesType !== 'map') {
          return;
        }

        const item = params.data || {};

        setSelectedMapRegion({
          name: item.dbName || params.name || 'Wilayah',

          upi: toNumber(item.upi),
          produksi: toNumber(item.produksi),
          nilai: toNumber(item.nilai),
        });
      },
    }),
    [],
  );

  // Menyusun grafik Top 10 Kab/Kota berdasarkan metrik yang dipilih.
  const barOption = useMemo(() => {
    const top10 = [...stats.produksiPerKabupaten]
      .filter((item) => item[topKabFilter] > 0)
      .sort((a, b) => b[topKabFilter] - a[topKabFilter])
      .slice(0, 10)
      .reverse();

    const isProduksi = topKabFilter === 'produksi';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
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
            color: chartColors.gridLine,
            type: 'dashed',
          },
        },
        axisLabel: {
          color: chartColors.textMuted,
          formatter: (val) => {
            if (val >= 1_000_000_000_000)
              return `${(val / 1_000_000_000_000).toFixed(1)}T`;
            if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
            if (val >= 1_000) return `${(val / 1_000).toFixed(1)}rb`;
            return val;
          },
        },
      },
      yAxis: {
        type: 'category',
        data: top10.map((item) => item.name),
        axisLabel: {
          color: chartColors.textStrong,
          fontSize: 11,
        },
      },
      series: [
        {
          name: isProduksi ? 'Hasil Produksi (Kg)' : 'Nilai Produksi (Rp)',
          type: 'bar',
          data: top10.map((item) => item[topKabFilter]),
          barMaxWidth: 28,
          label: {
            show: true,
            position: 'right',
            distance: 8,
            color: chartColors.textStrong,
            fontSize: 10,
            fontWeight: 600,
            formatter: (params) => {
              const value = toNumber(params.value);

              return isProduksi
                ? `${value.toLocaleString('id-ID')} Kg`
                : formatRupiah(value);
            },
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: chartColors.barGradientStart },
              { offset: 1, color: chartColors.barGradientEnd },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
    };
  }, [stats.produksiPerKabupaten, topKabFilter, chartColors]);

  // Menyusun grafik perbandingan jumlah unit usaha berdasarkan kategori kegiatan.
  const pieOption = useMemo(() => {
    const total = stats.rasioKegiatan.reduce((sum, item) => sum + item.value, 0);

    return {
      title: {
        text: total.toLocaleString('id-ID'),
        subtext: 'Unit',
        left: 'center',
        top: '36%',
        textStyle: {
          color: chartColors.textStrong,
          fontSize: 26,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: chartColors.textMuted,
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText },
        formatter: (params) => {
          const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';

          return `${params.name}<br/>Jumlah: <b>${params.value.toLocaleString(
            'id-ID',
          )} Unit</b><br/>Persentase: <b>${pct}%</b>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: chartColors.textStrong },
      },
      series: [
        {
          name: 'Jumlah Unit Usaha',
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: chartColors.pieBorder,
            borderWidth: 2,
          },
          label: {
            show: true,
            color: chartColors.textStrong,
            formatter: (params) => {
              const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';

              return `${params.name}\n${params.value} Unit\n${pct}%`;
            },
          },
          labelLine: {
            lineStyle: { color: chartColors.labelLine },
          },
          data: [
            {
              ...stats.rasioKegiatan.find((item) => item.name === 'Pengolahan'),
              itemStyle: { color: chartColors.categoryPengolahan },
            },
            {
              ...stats.rasioKegiatan.find((item) => item.name === 'Pemasaran'),
              itemStyle: { color: chartColors.categoryPemasaran },
            },
          ],
        },
      ],
    };
  }, [stats.rasioKegiatan, chartColors]);

  // Menyusun grafik rincian Jenis Kegiatan Pengolahan atau Pemasaran.
  const detailKegiatanOption = useMemo(() => {
    const chartData = [...(stats.detailKegiatan?.[activeDetailKegiatan] || [])]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .reverse();

    const isPengolahan = activeDetailKegiatan === 'Pengolahan';

    return {
      animationDuration: 400,

      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params) => {
          const item = params?.[0];
          const value = toNumber(item?.value);

          return [
            `<b>${item?.name || '-'}</b>`,
            `Jumlah: <b>${value.toLocaleString('id-ID')} Unit</b>`,
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
            color: chartColors.gridLine,
            type: 'dashed',
          },
        },

        axisLabel: {
          color: chartColors.textMuted,
          formatter: (value) => Number(value).toLocaleString('id-ID'),
        },
      },

      yAxis: {
        type: 'category',
        data: chartData.map((item) => item.name),

        axisLabel: {
          color: chartColors.textStrong,
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

          data: chartData.map((item) => item.value),

          barMaxWidth: 28,

          label: {
            show: true,
            position: 'right',
            color: chartColors.textStrong,
            formatter: (params) =>
              `${toNumber(params.value).toLocaleString('id-ID')} Unit`,
          },

          itemStyle: {
            color: isPengolahan
              ? chartColors.categoryPengolahan
              : chartColors.categoryPemasaran,

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
                  fill: chartColors.textMuted,
                  fontSize: 13,
                },
              },
            ]
          : [],
    };
  }, [activeDetailKegiatan, stats.detailKegiatan, chartColors]);

  // Menyusun grafik tren tahunan Pengolahan dan Pemasaran.
  const trendOptions = useMemo(() => {
    const createTrendOption = (category, metric, color, areaTop, areaBottom) => {
      const isProduksi = metric === 'produksi';
      const dataKey =
        category === 'Pengolahan'
          ? isProduksi ? 'pengolahan_produksi' : 'pengolahan_nilai'
          : isProduksi ? 'pemasaran_produksi' : 'pemasaran_nilai';

      return {
        animationDuration: 500,
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const item = params?.[0];
            const value = toNumber(item?.value);
            return [
              `<b>${category}</b>`,
              `Tahun: <b>${item?.name || '-'}</b>`,
              isProduksi
                ? `Hasil: <b>${value.toLocaleString('id-ID')} Kg</b>`
                : `Nilai: <b>${formatRupiah(value)}</b>`,
            ].join('<br/>');
          },
        },
        grid: { left: '3%', right: '4%', top: '8%', bottom: '5%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: stats.trenTahunan.map((item) => item.tahun),
          axisLabel: { color: chartColors.textMuted, fontSize: 12 },
          axisLine: { lineStyle: { color: chartColors.gridLine } },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: chartColors.gridLine, type: 'dashed' } },
          axisLabel: {
            color: chartColors.textMuted,
            formatter: (value) => {
              if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
              if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
              if (value >= 1_000) return `${(value / 1_000).toFixed(1)}rb`;
              return value;
            },
          },
        },
        series: [{
          name: category,
          type: 'line',
          data: stats.trenTahunan.map((item) => item[dataKey]),
          smooth: true,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color },
          itemStyle: { color, borderColor: '#ffffff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: areaTop },
                { offset: 1, color: areaBottom },
              ],
            },
          },
        }],
      };
    };

    return {
      pengolahan: createTrendOption(
        'Pengolahan',
        trendPengolahanFilter,
        '#0096C7',
        'rgba(0, 150, 199, 0.48)',
        'rgba(0, 150, 199, 0.04)',
      ),
      pemasaran: createTrendOption(
        'Pemasaran',
        trendPemasaranFilter,
        isDark ? '#34D399' : '#10B981',
        isDark ? 'rgba(52, 211, 153, 0.38)' : 'rgba(16, 185, 129, 0.30)',
        isDark ? 'rgba(52, 211, 153, 0.03)' : 'rgba(16, 185, 129, 0.03)',
      ),
    };
  }, [stats.trenTahunan, trendPengolahanFilter, trendPemasaranFilter, chartColors]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Statistik Pengolahan dan Pemasaran Produk Kelautan dan Perikanan
          </h1>
        </div>

        <div
           className="
            inline-flex items-center gap-2
            whitespace-nowrap
            px-4 py-2
            bg-cyan-50 text-cyan-700
            dark:bg-cyan-500/10 dark:text-cyan-300
            rounded-full
            text-sm 
            font-medium
            border border-cyan-200
            dark:border-cyan-500/20
            shadow-sm"
        >
          <Clock className="w-4 h-4 flex-shrink-0 animate-pulse" />

          <span className="opacity-80">Terakhir Diperbarui:</span>
          <span className="font-semibold">{lastUpdated}</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SearchableMultiSelect
          values={filterTahun}
          options={tahunOptions}
          onChange={(values) => {
            setFilterTahun(values);
            setSelectedMapRegion(null);
          }}
          placeholder="Semua Tahun"
        />

        <SearchableMultiSelect
          values={filterKabupaten}
          options={KABUPATEN_KOTA_OPTIONS}
          onChange={(values) => {
            setFilterKabupaten(values);
            setSelectedMapRegion(null);
          }}
          placeholder="Semua Kab/Kota"
        />

        <SearchableMultiSelect
          values={filterJenisKegiatan}
          options={['Pengolahan', 'Pemasaran']}
          onChange={(values) => {
            setFilterJenisKegiatan(values);
            setSelectedMapRegion(null);
          }}
          placeholder="Semua Kategori Kegiatan"
        />

        <SearchableMultiSelect
          values={filterSkalaUsaha}
          options={SKALA_USAHA_OPTIONS}
          onChange={(values) => {
            setFilterSkalaUsaha(values);
            setSelectedMapRegion(null);
          }}
          placeholder="Semua Skala Usaha"
        />
      </div>
      {(filterTahun.length > 0 ||
        filterKabupaten.length > 0 ||
        filterJenisKegiatan.length > 0 ||
        filterSkalaUsaha.length > 0) && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => {
              setFilterTahun([]);
              setFilterKabupaten([]);
              setFilterJenisKegiatan([]);
              setFilterSkalaUsaha([]);
              setSelectedMapRegion(null);
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
                <p className="text-sm font-medium text-muted-foreground">Total Hasil Produksi</p>
                <p className="text-xl font-bold text-foreground xl:text-2xl">
                  {stats.kpi.total_volume.toLocaleString('id-ID')}{' '}
                  <span className="text-sm font-normal text-muted-foreground">Kg</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-500">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Nilai Produksi</p>
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
              {/* Header peta */}
              <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-500">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <h2 className="text-xl font-bold text-foreground">
                    Peta Sebaran
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex">
                  <ChartSelect
                    value={barFilter}
                    onChange={(event) => {
                      setBarFilter(event.target.value);
                      setSelectedMapRegion(null);
                    }}
                    ariaLabel="Filter peta"
                    options={[
                      { value: 'produksi', label: 'Hasil (Kg)' },
                      { value: 'nilai', label: 'Nilai (Rp)' },
                    ]}
                  />

                  {isMobileMap ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMapInteractionEnabled((previous) => !previous);
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

              {/* Petunjuk saat interaksi peta aktif */}
              {isMobileMap && mapInteractionEnabled ? (
                <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  Mode peta aktif. Gunakan dua jari untuk memperbesar atau menggeser.
                  Tekan “Kunci Peta” agar halaman kembali mudah di-scroll.
                </div>
              ) : null}

              {/* Peta */}
              <div className="h-[330px] overflow-hidden rounded-xl sm:h-[420px] lg:h-[450px]">
                <ReactECharts
                  option={mapOption}
                  onEvents={mapEvents}
                  notMerge
                  lazyUpdate
                  style={{
                    height: '100%',
                    width: '100%',

                    // Saat peta dikunci, swipe tetap menggulir halaman.
                    touchAction: isMobileMap && !mapInteractionEnabled ? 'pan-y' : 'none',
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Top 10 Kab/Kota</h2>
                </div>

                <ChartSelect
                  value={topKabFilter}
                  onChange={(event) => setTopKabFilter(event.target.value)}
                  ariaLabel="Filter Top 10 Kab/Kota"
                  options={[
                    { value: 'produksi', label: 'Hasil (Kg)' },
                    { value: 'nilai', label: 'Nilai (Rp)' },
                  ]}
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
                  <h2 className="text-xl font-bold text-foreground">Perbandingan Jumlah Unit Usaha Berdasarkan Kategori Kegiatan</h2>
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
                  <div
                    className={`rounded-xl p-2.5 ${
                      activeDetailKegiatan === 'Pengolahan'
                        ? 'bg-[#0096C7]/10 text-[#0096C7]'
                        : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400'
                    }`}
                  >
                    <Factory
                      className={`h-5 w-5 ${
                        activeDetailKegiatan === 'Pengolahan'
                          ? 'text-[#0096C7]'
                          : 'text-emerald-500 dark:text-emerald-400'
                      }`}
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-foreground">Jenis Detail Kegiatan</h2>
                  </div>
                </div>

                {showDetailKegiatanToggle ? (
                  <div className="grid grid-cols-2 rounded-xl border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setDetailKegiatanFilter('Pengolahan')}
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
                      onClick={() => setDetailKegiatanFilter('Pemasaran')}
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
                      <h3 className="text-xl font-bold text-foreground">Tren Produksi Pengolahan</h3>
                    </div>
                  </div>

                  <ChartSelect
                    value={trendPengolahanFilter}
                    onChange={(event) => setTrendPengolahanFilter(event.target.value)}
                    ariaLabel="Filter tren pengolahan"
                    options={[
                      { value: 'produksi', label: 'Hasil (Kg)' },
                      { value: 'nilai', label: 'Nilai (Rp)' },
                    ]}
                  />
                </div>

                <div className="h-[340px]">
                  <ReactECharts
                    option={trendOptions.pengolahan}
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
                      <h3 className="text-xl font-bold text-foreground">Tren Produksi Pemasaran</h3>
                    </div>
                  </div>

                  <ChartSelect
                    value={trendPemasaranFilter}
                    onChange={(event) => setTrendPemasaranFilter(event.target.value)}
                    ariaLabel="Filter tren pemasaran"
                    options={[
                      { value: 'produksi', label: 'Hasil (Kg)' },
                      { value: 'nilai', label: 'Nilai (Rp)' },
                    ]}
                  />
                </div>

                <div className="h-[340px]">
                  <ReactECharts
                    option={trendOptions.pemasaran}
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

          {/* Tabel rincian */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              <h3 className="text-lg font-semibold text-foreground">
                Rincian Data Pengolahan dan Pemasaran Produk Kelautan dan Perikanan
              </h3>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SearchableMultiSelect
                values={filterTahun}
                options={tahunOptions}
                onChange={(values) => {
                  setFilterTahun(values);
                  setSelectedMapRegion(null);
                }}
                placeholder="Semua Tahun"
              />

              <SearchableMultiSelect
                values={filterKabupaten}
                options={KABUPATEN_KOTA_OPTIONS}
                onChange={(values) => {
                  setFilterKabupaten(values);
                  setSelectedMapRegion(null);
                }}
                placeholder="Semua Kab/Kota"
              />

              <SearchableMultiSelect
                values={filterJenisKegiatan}
                options={['Pengolahan', 'Pemasaran']}
                onChange={(values) => {
                  setFilterJenisKegiatan(values);
                  setSelectedMapRegion(null);
                }}
                placeholder="Semua Kategori Kegiatan"
              />

              <SearchableMultiSelect
                values={filterSkalaUsaha}
                options={SKALA_USAHA_OPTIONS}
                onChange={(values) => {
                  setFilterSkalaUsaha(values);
                  setSelectedMapRegion(null);
                }}
                placeholder="Semua Skala Usaha"
              />
            </div>
            {(filterTahun.length > 0 ||
              filterKabupaten.length > 0 ||
              filterJenisKegiatan.length > 0 ||
              filterSkalaUsaha.length > 0) && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setFilterTahun([]);
                    setFilterKabupaten([]);
                    setFilterJenisKegiatan([]);
                    setFilterSkalaUsaha([]);
                    setSelectedMapRegion(null);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}

            <DataTable
              columns={columns}
              data={filteredData}
              getSearchText={(row) => buildTableSearchText(row, false)}
              onCustomExport={handleExportData}
              renderSubComponent={renderPackageDetail}
              customExportButton={
                <button
                  type="button"
                  onClick={handleRekapButtonClick}
                  disabled={!filteredData.length}
                  title="Jika tahun belum dipilih, tentukan tahun melalui pop-up."
                  className="order-first inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Rekap Statistik
                </button>
              }
              exportName={`Pengolahan_Pemasaran_${
                new Date().toISOString().split('T')[0]
              }`}
            />
          </div>
        </div>
      )}

      {noticeDialog && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setNoticeDialog(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{noticeDialog.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{noticeDialog.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoticeDialog(null)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-end border-t border-border p-5">
              <button
                type="button"
                onClick={() => setNoticeDialog(null)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ,
        document.body
      ) : null}

      {rekapDialogOpen && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4 py-8" onClick={() => !rekapLoading && setRekapDialogOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Unduh Rekap Statistik</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Pilih tahun rekap.</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Hanya untuk data yang berstatus VERIFIED.</p>
                </div>
                <button type="button" disabled={rekapLoading} onClick={() => setRekapDialogOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tahun <span className="text-rose-500">*</span></label>
                <select value={rekapTahun} onChange={event => { setRekapTahun(event.target.value); setRekapError(''); }} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground">
                  <option value="">Pilih Tahun</option>
                  {tahunOptions.map(option => <option key={String(option)} value={String(option)}>{option}</option>)}
                </select>
              </div>
              {rekapError ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{rekapError}</div> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-5">
              <button type="button" disabled={rekapLoading} onClick={() => setRekapDialogOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">Batal</button>
              <button type="button" disabled={!rekapTahun || rekapLoading} onClick={handleExportRekap} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {rekapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {rekapLoading ? 'Menyiapkan...' : 'Unduh Rekap Statistik'}
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
