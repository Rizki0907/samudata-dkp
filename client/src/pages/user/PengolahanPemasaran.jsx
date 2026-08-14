import { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';
import { Box, Clock, Download, Factory, FileText, LineChart, Loader2, MapPin, TrendingUp, Users } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';
import { useThemeStore } from '@/store/themeStore';
import { useMasterDataStore } from '@/store/masterDataStore';

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
    const baseName = String(geoName).replace(/^KOTA\s+/i, '').trim();
    const databaseStyleName =
      regionType === 'KOTA' ? `KOTA ${baseName}` : `KAB ${baseName}`;

    return [normalizeRegionKey(databaseStyleName), geoName];
  }),
);

const getGeoRegionName = (databaseName) =>
  GEO_REGION_NAME_MAP.get(normalizeRegionKey(databaseName)) || databaseName;

echarts.registerMap('jawa_timur', geoJsonData);

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

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const displayNumber = (value) => {
  const number = toNumber(value);
  return number === 0 ? '-' : number.toLocaleString('id-ID');
};

const displayCurrency = (value) => {
  const number = toNumber(value);
  return number === 0 ? '-' : formatRupiah(number);
};

const splitCompactRupiah = (value) => {
  const amount = Math.abs(toNumber(value));
  const sign = toNumber(value) < 0 ? '-' : '';

  const scales = [
    { value: 1e15, label: 'Kuadriliun' },
    { value: 1e12, label: 'Triliun' },
    { value: 1e9, label: 'Miliar' },
    { value: 1e6, label: 'Juta' },
  ];

  const scale = scales.find((item) => amount >= item.value);

  if (!scale) {
    return { amount: `${sign}${formatRupiah(value)}`, unit: '' };
  }

  const compact = amount / scale.value;
  const digits = compact >= 100 ? 0 : compact >= 10 ? 1 : 2;

  return {
    amount: `${sign}Rp ${compact.toLocaleString('id-ID', {
      maximumFractionDigits: digits,
    })}`,
    unit: scale.label,
  };
};

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

const getRowUpdatedAt = (row) =>
  row?.updated_at ??
  row?.updatedAt ??
  row?.updated_At ??
  row?.created_at ??
  row?.createdAt ??
  null;

const normalizeKategori = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

const flattenPackageDetails = (packages) =>
  (packages || []).flatMap((pkg) =>
    (pkg.details || []).map((detail) => ({
      ...detail,
      tahun: pkg.tahun,
      kabupaten_kota: pkg.kabupaten_kota,
      status: pkg.status,
      updated_at: pkg.updated_at,
    })),
  );

const buildTableSearchText = (row, includeStatus = false) => {
  const parts = [];

  if (includeStatus) parts.push(row?.status);
  parts.push(row?.tahun, row?.kabupaten_kota);

  (row?.details || []).forEach((detail) => {
    parts.push(detail?.kategori_kegiatan, detail?.jenis_kegiatan, detail?.skala_usaha);
    [detail?.jumlah_unit_usaha, detail?.hasil_kg, detail?.hasil_rp].forEach((value) => {
      parts.push(...getSearchNumberVariants(value));
    });
  });

  [row?.jumlah_unit_usaha, row?.hasil_kg, row?.hasil_rp, row?.modal_rp].forEach((value) => {
    parts.push(...getSearchNumberVariants(value));
  });

  Object.entries(row?.modal_by_jenis || {}).forEach(([key, value]) => {
    parts.push(key, ...getSearchNumberVariants(value));
  });

  Object.entries(row?.modal_by_skala || {}).forEach(([key, value]) => {
    parts.push(key, ...getSearchNumberVariants(value));
  });

  return parts
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '',
    )
    .join(' ');
};

const downloadExcelFromApi = async (endpoint, payload, fileName) => {
  try {
    const response = await api.post(endpoint, payload, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Gagal mengunduh file Excel:', error);

    let message = 'Gagal mengunduh file Excel.';
    const responseData = error?.response?.data;

    if (responseData instanceof Blob) {
      try {
        const text = await responseData.text();
        const json = JSON.parse(text);
        message = json.message || message;
      } catch {
        // ignore
      }
    } else if (responseData?.message) {
      message = responseData.message;
    }

    throw new Error(message);
  }
};

export default function PengolahanPemasaran() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const { getOptions } = useMasterDataStore();
  const KABUPATEN_KOTA_OPTIONS = getOptions('KABUPATEN_KOTA');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('-');

  const [filterTahun, setFilterTahun] = useState([]);
  const [filterKabupaten, setFilterKabupaten] = useState([]);

  const [barFilter, setBarFilter] = useState('produksi');
  const [topKabFilter, setTopKabFilter] = useState('produksi');
  const [detailKegiatanFilter, setDetailKegiatanFilter] = useState('Pengolahan');
  const [trendPengolahanFilter, setTrendPengolahanFilter] = useState('produksi');
  const [trendPemasaranFilter, setTrendPemasaranFilter] = useState('produksi');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await api.get('/pengolahan-pemasaran');
        const payload = Array.isArray(response.data?.data) ? response.data.data : [];

        const verifiedData = payload.filter((item) => item.status === 'VERIFIED');
        setData(verifiedData);

        if (verifiedData.length > 0) {
          const latest = verifiedData.reduce((a, b) =>
            new Date(a.updated_at || 0) > new Date(b.updated_at || 0) ? a : b,
          );

          const updatedAt = new Date(latest.updated_at || Date.now());
          const date = updatedAt.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const time = updatedAt
            .toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            .replace(':', '.');

          setLastUpdated(`${date} ${time}`);
        } else {
          setLastUpdated('-');
        }
      } catch (error) {
        console.error('Error fetch pengolahan pemasaran:', error);
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

  const filteredData = useMemo(
    () =>
      data
        .filter((item) => {
          if (filterTahun.length && !filterTahun.includes(String(item.tahun))) return false;
          if (filterKabupaten.length && !filterKabupaten.includes(item.kabupaten_kota)) return false;
          return true;
        })
        .sort((a, b) => {
          const timeA = new Date(getRowUpdatedAt(a) || 0).getTime();
          const timeB = new Date(getRowUpdatedAt(b) || 0).getTime();
          return timeB - timeA;
        }),
    [data, filterTahun, filterKabupaten],
  );

  const stats = useMemo(() => {
    const rows = flattenPackageDetails(filteredData);

    const totalUnit = rows.reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0);
    const totalProduksi = rows.reduce((sum, row) => sum + toNumber(row.hasil_kg), 0);
    const totalNilai = rows.reduce((sum, row) => sum + toNumber(row.hasil_rp), 0);

    const kabMap = new Map();

    rows.forEach((row) => {
      const name = row.kabupaten_kota || 'Lainnya';

      if (!kabMap.has(name)) {
        kabMap.set(name, { name, produksi: 0, nilai: 0, unit: 0 });
      }

      const current = kabMap.get(name);
      current.produksi += toNumber(row.hasil_kg);
      current.nilai += toNumber(row.hasil_rp);
      current.unit += toNumber(row.jumlah_unit_usaha);
    });

    const detailMap = {
      Pengolahan: new Map(),
      Pemasaran: new Map(),
    };

    rows.forEach((row) => {
      const kategori = normalizeKategori(row.kategori_kegiatan);
      const name = String(row.jenis_kegiatan || '').trim();

      if (!name) return;

      if (!detailMap[kategori]) {
        detailMap[kategori] = new Map();
      }

      detailMap[kategori].set(name, (detailMap[kategori].get(name) || 0) + toNumber(row.jumlah_unit_usaha));
    });

    const trendMap = new Map();

    rows.forEach((row) => {
      const tahun = String(row.tahun ?? '').trim();

      if (!tahun) return;

      if (!trendMap.has(tahun)) {
        trendMap.set(tahun, {
          tahun,
          pengolahan_produksi: 0,
          pengolahan_nilai: 0,
          pemasaran_produksi: 0,
          pemasaran_nilai: 0,
        });
      }

      const current = trendMap.get(tahun);
      const kategori = normalizeKategori(row.kategori_kegiatan);

      if (kategori === 'Pengolahan') {
        current.pengolahan_produksi += toNumber(row.hasil_kg);
        current.pengolahan_nilai += toNumber(row.hasil_rp);
      } else {
        current.pemasaran_produksi += toNumber(row.hasil_kg);
        current.pemasaran_nilai += toNumber(row.hasil_rp);
      }
    });

    const rasio = ['Pengolahan', 'Pemasaran'].map((kategori) => {
      const value = rows
        .filter((row) => normalizeKategori(row.kategori_kegiatan) === kategori)
        .reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0);

      return { name: kategori, value };
    });

    return {
      totalUnit,
      totalProduksi,
      totalNilai,
      kegiatans: [...kabMap.values()].sort((a, b) => b.produksi - a.produksi),
      detail: {
        Pengolahan: [...(detailMap.Pengolahan || new Map()).entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        Pemasaran: [...(detailMap.Pemasaran || new Map()).entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      },
      trend: [...trendMap.values()].sort((a, b) => Number(a.tahun) - Number(b.tahun)),
      rasio,
    };
  }, [filteredData]);

  const chartColors = useMemo(
    () => ({
      textStrong: isDark ? '#e2e8f0' : '#1e293b',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      gridLine: isDark ? '#334155' : '#cbd5e1',
      tooltipBg: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
      tooltipBorder: isDark ? '#334155' : '#e2e8f0',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      barStart: isDark ? '#0ea5e9' : '#0284c7',
      barEnd: isDark ? '#2563eb' : '#1e40af',
      piePengolahan: '#0096C7',
      piePemasaran: isDark ? '#34D399' : '#10B981',
    }),
    [isDark],
  );

  const mapOption = useMemo(() => {
    const mapData = stats.kegiatans.map((item) => ({
      name: getGeoRegionName(item.name),
      dbName: item.name,
      value: barFilter === 'produksi' ? item.produksi : item.nilai,
      produksi: item.produksi,
      nilai: item.nilai,
      unit: item.unit,
    }));

    const maxValue = mapData.length ? Math.max(...mapData.map((item) => item.value)) : 1;

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText },
        formatter: (params) => {
          const data = params.data || {};
          return [
            `<b>${data.dbName || params.name}</b>`,
            `Unit: <b>${toNumber(data.unit).toLocaleString('id-ID')}</b>`,
            `Produksi: <b>${toNumber(data.produksi).toLocaleString('id-ID')} Kg</b>`,
            `Nilai: <b>${formatRupiah(data.nilai)}</b>`,
          ].join('<br/>');
        },
      },
      visualMap: {
        min: 0,
        max: maxValue || 1,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        text: ['Tinggi', 'Rendah'],
        textStyle: { color: chartColors.textMuted, fontSize: 10 },
        inRange: {
          color: isDark
            ? ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e']
            : ['#fef3c7', '#fbbf24', '#f97316', '#dc2626', '#7f1d1d'],
        },
      },
      series: [
        {
          type: 'map',
          map: 'jawa_timur',
          roam: false,
          label: { show: false },
          data: mapData,
          itemStyle: {
            areaColor: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? '#334155' : '#cbd5e1',
            borderWidth: 0.8,
          },
          emphasis: {
            itemStyle: {
              areaColor: isDark ? '#38bdf8' : '#f59e0b',
              borderWidth: 1.5,
            },
          },
        },
      ],
    };
  }, [stats.kegiatans, barFilter, isDark, chartColors]);

  const barOption = useMemo(() => {
    const source = [...stats.kegiatans]
      .filter((item) => item.produksi > 0 || item.nilai > 0)
      .sort((a, b) => b[topKabFilter] - a[topKabFilter])
      .slice(0, 10)
      .reverse();

    const isProduksi = topKabFilter === 'produksi';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText },
        formatter: (params) => {
          const data = params[0];
          const val = toNumber(data.value);
          return `${data.name}<br/>${
            isProduksi ? `Produksi: <b>${val.toLocaleString('id-ID')} Kg</b>` : `Nilai: <b>${formatRupiah(val)}</b>`
          }`;
        },
      },
      grid: { left: '5%', right: '8%', top: '8%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: chartColors.textMuted,
          formatter: (value) => {
            if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}rb`;
            return value;
          },
        },
        splitLine: { lineStyle: { color: chartColors.gridLine, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: source.map((item) => item.name),
        axisLabel: { color: chartColors.textStrong, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: source.map((item) => item[topKabFilter]),
          barMaxWidth: 28,
          label: {
            show: true,
            position: 'right',
            color: chartColors.textStrong,
            formatter: (params) => {
              const val = toNumber(params.value);
              return isProduksi ? `${val.toLocaleString('id-ID')} Kg` : formatRupiah(val);
            },
          },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: chartColors.barStart },
              { offset: 1, color: chartColors.barEnd },
            ]),
            borderRadius: [0, 6, 6, 0],
          },
        },
      ],
    };
  }, [stats.kegiatans, topKabFilter, chartColors]);

  const pieOption = useMemo(() => {
    const total = stats.rasio.reduce((sum, item) => sum + item.value, 0);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: chartColors.tooltipBg,
        borderColor: chartColors.tooltipBorder,
        textStyle: { color: chartColors.tooltipText },
        formatter: (params) => {
          const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
          return `${params.name}<br/>Jumlah: <b>${params.value.toLocaleString('id-ID')} Unit</b><br/>Persentase: <b>${percent}%</b>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: chartColors.textStrong },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          label: {
            formatter: (params) => `${params.name}\n${params.value}`,
            color: chartColors.textStrong,
          },
          itemStyle: {
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 2,
          },
          data: stats.rasio.map((item) => ({
            ...item,
            itemStyle: {
              color: item.name === 'Pengolahan' ? chartColors.piePengolahan : chartColors.piePemasaran,
            },
          })),
        },
      ],
    };
  }, [stats.rasio, isDark, chartColors]);

  const trendOption = useMemo(() => {
    const pengolahanSeries = {
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#0096C7' },
      itemStyle: { color: '#0096C7' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 150, 199, 0.35)' },
            { offset: 1, color: 'rgba(0, 150, 199, 0.03)' },
          ],
        },
      },
      data: stats.trend.map((item) =>
        trendPengolahanFilter === 'produksi' ? item.pengolahan_produksi : item.pengolahan_nilai,
      ),
    };

    const pemasaranSeries = {
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: isDark ? '#34D399' : '#10B981' },
      itemStyle: { color: isDark ? '#34D399' : '#10B981' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.35)' },
            { offset: 1, color: isDark ? 'rgba(52, 211, 153, 0.03)' : 'rgba(16, 185, 129, 0.03)' },
          ],
        },
      },
      data: stats.trend.map((item) =>
        trendPemasaranFilter === 'produksi' ? item.pemasaran_produksi : item.pemasaran_nilai,
      ),
    };

    return {
      pengolahan: {
        tooltip: { trigger: 'axis' },
        grid: { left: '5%', right: '5%', top: '8%', bottom: '5%', containLabel: true },
        xAxis: {
          type: 'category',
          data: stats.trend.map((item) => item.tahun),
          axisLabel: { color: chartColors.textMuted },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: chartColors.textMuted },
          splitLine: { lineStyle: { color: chartColors.gridLine, type: 'dashed' } },
        },
        series: [pengolahanSeries],
      },
      pemasaran: {
        tooltip: { trigger: 'axis' },
        grid: { left: '5%', right: '5%', top: '8%', bottom: '5%', containLabel: true },
        xAxis: {
          type: 'category',
          data: stats.trend.map((item) => item.tahun),
          axisLabel: { color: chartColors.textMuted },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: chartColors.textMuted },
          splitLine: { lineStyle: { color: chartColors.gridLine, type: 'dashed' } },
        },
        series: [pemasaranSeries],
      },
    };
  }, [stats.trend, trendPengolahanFilter, trendPemasaranFilter, isDark, chartColors]);

  const detailOption = useMemo(() => {
    const source = [...(stats.detail[detailKegiatanFilter] || [])]
      .filter((item) => item.value > 0)
      .slice(0, 8);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '10%', right: '5%', top: '8%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: chartColors.textMuted },
        splitLine: { lineStyle: { color: chartColors.gridLine, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: source.map((item) => item.name),
        axisLabel: { color: chartColors.textStrong, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: source.map((item) => item.value),
          barMaxWidth: 28,
          label: {
            show: true,
            position: 'right',
            color: chartColors.textStrong,
            formatter: (params) => `${toNumber(params.value).toLocaleString('id-ID')} Unit`,
          },
          itemStyle: {
            color: detailKegiatanFilter === 'Pengolahan' ? '#0096C7' : isDark ? '#34D399' : '#10B981',
            borderRadius: [0, 8, 8, 0],
          },
        },
      ],
    };
  }, [stats.detail, detailKegiatanFilter, isDark, chartColors]);

  const columns = useMemo(
    () => [
      { header: 'Tahun', accessorKey: 'tahun' },
      { header: 'Kab/Kota', accessorKey: 'kabupaten_kota' },
      { header: 'Total Unit', accessorKey: 'jumlah_unit_usaha' },
      { header: 'Hasil Produksi (Kg)', accessorKey: 'hasil_kg' },
      { header: 'Nilai Produksi (Rp)', accessorKey: 'hasil_rp' },
      { header: 'Total Modal (Rp)', accessorKey: 'modal_rp' },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Statistik Pengolahan dan Pemasaran
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Clock className="h-4 w-4" />
          <span>Terakhir Diperbarui:</span>
          <span className="font-semibold">{lastUpdated}</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <SearchableMultiSelect
          values={filterTahun}
          options={tahunOptions}
          onChange={(values) => setFilterTahun(values)}
          placeholder="Semua Tahun"
        />

        <SearchableMultiSelect
          values={filterKabupaten}
          options={KABUPATEN_KOTA_OPTIONS || []}
          onChange={(values) => setFilterKabupaten(values)}
          placeholder="Semua Kab/Kota"
        />
      </div>

      {(filterTahun.length > 0 || filterKabupaten.length > 0) && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => {
              setFilterTahun([]);
              setFilterKabupaten([]);
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Unit</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalUnit.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hasil Produksi</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalProduksi.toLocaleString('id-ID')} <span className="text-sm">Kg</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                  <LineChart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nilai Produksi</p>
                  <div className="flex items-end gap-1">
                    <p className="text-xl font-bold text-foreground">
                      {splitCompactRupiah(stats.totalNilai).amount}
                    </p>
                    {splitCompactRupiah(stats.totalNilai).unit && (
                      <span className="pb-1 text-xs text-muted-foreground">
                        {splitCompactRupiah(stats.totalNilai).unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kab/Kota Tertinggi</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.kegiatans[0]?.name || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Peta Sebaran</h2>
                </div>

                <select
                  value={barFilter}
                  onChange={(event) => setBarFilter(event.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="produksi">Hasil Produksi (Kg)</option>
                  <option value="nilai">Nilai Produksi (Rp)</option>
                </select>
              </div>

              <div className="h-[360px]">
                <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Top Kab/Kota</h2>
                </div>

                <select
                  value={topKabFilter}
                  onChange={(event) => setTopKabFilter(event.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="produksi">Produksi</option>
                  <option value="nilai">Nilai</option>
                </select>
              </div>

              <div className="h-[360px]">
                <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Komposisi Unit Usaha
                </h2>
              </div>

              <div className="h-[320px]">
                <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#0096C7]/10 p-2.5 text-[#0096C7]">
                    <Factory className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Detail Kegiatan</h2>
                </div>

                <div className="grid grid-cols-2 rounded-xl border border-border bg-background p-1">
                  {['Pengolahan', 'Pemasaran'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDetailKegiatanFilter(item)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        detailKegiatanFilter === item
                          ? item === 'Pengolahan'
                            ? 'bg-[#0096C7] text-white'
                            : 'bg-emerald-500 text-white'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[320px]">
                <ReactECharts option={detailOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#0096C7]/20 bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#0096C7]/10 p-2.5 text-[#0096C7]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Tren Pengolahan</h2>
                </div>

                <select
                  value={trendPengolahanFilter}
                  onChange={(event) => setTrendPengolahanFilter(event.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="produksi">Produksi</option>
                  <option value="nilai">Nilai</option>
                </select>
              </div>

              <div className="h-[300px]">
                <ReactECharts option={trendOption.pengolahan} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Tren Pemasaran</h2>
                </div>

                <select
                  value={trendPemasaranFilter}
                  onChange={(event) => setTrendPemasaranFilter(event.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="produksi">Produksi</option>
                  <option value="nilai">Nilai</option>
                </select>
              </div>

              <div className="h-[300px]">
                <ReactECharts option={trendOption.pemasaran} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold text-foreground">
                Data Rinci Pengolahan dan Pemasaran
              </h2>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchableMultiSelect
              values={filterTahun}
              options={tahunOptions}
              onChange={(values) => {
                setFilterTahun(values);
               }}
               placeholder="Semua Tahun"
            />
            <SearchableMultiSelect
            values={filterKabupaten}
            options={KABUPATEN_KOTA_OPTIONS || []}
            onChange={(values) => {
              setFilterKabupaten(values);
            }}
            placeholder="Semua Kab/Kota"
          />
        </div>

        {(filterTahun.length > 0 || filterKabupaten.length > 0) && (
          <div className="mb-4 flex justify-end mb-4">
            <button
            type="button"
            onClick={() => {
              setFilterTahun([]);
              setFilterKabupaten([]);
            }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Reset Semua Filter
          </button>
         </div>
    )}
    
    <DataTable
    data={filteredData}
    columns={columns}
    getSearchText={(row) => buildTableSearchText(row, false)}
  />

  <div className="mt-4 flex justify-end">
    <button
      type="button"
      onClick={async () => {
        if (!filteredData.length) return;

        try {
          await downloadExcelFromApi(
            '/pengolahan-pemasaran/export-data',
             { ids: filteredData.map((row) => row.id).filter(Boolean) },
             `Pengolahan_Pemasaran_${new Date().toISOString().split('T')[0]}.xlsx`
            );
          } catch (error) {
            console.error(error);
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <Download className="h-4 w-4" />
        Export Excel
      </button>
    </div>
  </div>
</div>
      )}
    </div>
  );
}