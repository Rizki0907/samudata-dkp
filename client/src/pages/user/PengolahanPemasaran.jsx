import { useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import {
  Box,
  Factory,
  FileText,
  LineChart,
  Loader2,
  MapPin,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';
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

// Registrasi peta Jawa Timur
echarts.registerMap('jawa_timur', geoJsonData);

// Daftar tetap 38 kabupaten/kota di Jawa Timur untuk filter.
const KABUPATEN_KOTA_OPTIONS = [
  'SEMUA',
  'KAB. BANGKALAN',
  'KAB. BANYUWANGI',
  'KAB. BLITAR',
  'KAB. BOJONEGORO',
  'KAB. BONDOWOSO',
  'KAB. GRESIK',
  'KAB. JEMBER',
  'KAB. JOMBANG',
  'KAB. KEDIRI',
  'KAB. LAMONGAN',
  'KAB. LUMAJANG',
  'KAB. MADIUN',
  'KAB. MAGETAN',
  'KAB. MALANG',
  'KAB. MOJOKERTO',
  'KAB. NGANJUK',
  'KAB. NGAWI',
  'KAB. PACITAN',
  'KAB. PAMEKASAN',
  'KAB. PASURUAN',
  'KAB. PONOROGO',
  'KAB. PROBOLINGGO',
  'KAB. SAMPANG',
  'KAB. SIDOARJO',
  'KAB. SITUBONDO',
  'KAB. SUMENEP',
  'KAB. TRENGGALEK',
  'KAB. TUBAN',
  'KAB. TULUNGAGUNG',
  'KOTA BATU',
  'KOTA BLITAR',
  'KOTA KEDIRI',
  'KOTA MADIUN',
  'KOTA MALANG',
  'KOTA MOJOKERTO',
  'KOTA PASURUAN',
  'KOTA PROBOLINGGO',
  'KOTA SURABAYA',
];

const formatRupiah = value =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));

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

const normalizeKategori = value =>
  String(value ?? '').trim().toLowerCase() === 'pemasaran'
    ? 'Pemasaran'
    : 'Pengolahan';

const getJenisDetail = row => row?.jenis_kegiatan || '';

export default function PengolahanPemasaran() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("-");

  // Filter utama dashboard dan tabel
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedJenisKegiatan, setSelectedJenisKegiatan] = useState('');
  const [filterKabupaten, setFilterKabupaten] = useState('');

  // Pilihan metrik visualisasi
  const [barFilter, setBarFilter] = useState('produksi');
  const [topKabFilter, setTopKabFilter] = useState('produksi');
  const [detailKegiatanFilter, setDetailKegiatanFilter] =
    useState('Pengolahan');
  const [trendFilter, setTrendFilter] = useState('produksi');

  const [selectedMapRegion, setSelectedMapRegion] = useState(null);
  const [isMobileMap, setIsMobileMap] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await api.get('/pengolahan-pemasaran');
        const responseData = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        // Perlindungan tambahan di frontend:
        // data selain VERIFIED tidak akan dihitung atau ditampilkan.
        setData(
          responseData.filter(item => item.status === 'VERIFIED'),
        );

        const verifiedData = responseData.filter(item => item.status === 'VERIFIED');
        if (verifiedData.length > 0) {
          const latest = verifiedData.reduce((a, b) =>
            new Date(a.updated_at) > new Date(b.updated_at) ? a : b
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
        setLastUpdated("-");
      }
    } catch (error) {
      console.error(
        'Error fetching pengolahan dan pemasaran:',
        error.response?.data || error,
      );
        setData([]);
        setLastUpdated("-");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tahunOptions = useMemo(
    () =>
      [...new Set(data.map(item => String(item.tahun ?? '')).filter(Boolean))]
        .sort((a, b) => Number(b) - Number(a)),
    [data],
  );

  const dashboardData = useMemo(
    () =>
      data.filter(item => {
        if (
          selectedYear &&
          String(item.tahun) !== selectedYear
        ) {
          return false;
        }

        if (
          selectedJenisKegiatan &&
          normalizeKategori(item.kategori_kegiatan) !== selectedJenisKegiatan
        ) {
          return false;
        }

        return true;
      }),
    [data, selectedJenisKegiatan, selectedYear],
  );

  const filteredData = useMemo(
    () =>
      dashboardData.filter(item => {
        if (
          filterKabupaten &&
          item.kabupaten_kota !== filterKabupaten
        ) {
          return false;
        }

        return true;
      }),
    [
      dashboardData,
      filterKabupaten,
    ],
  );

  const stats = useMemo(() => {
    const rows = filteredData;

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
    const detailMaps = {
      Pengolahan: new Map(),
      Pemasaran: new Map(),
    };

    rows.forEach(row => {
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

    const rasioKegiatan = ['Pengolahan', 'Pemasaran'].map(name => ({
      name,
      value: rows
        .filter(row => normalizeKategori(row.kategori_kegiatan) === name)
        .reduce((sum, row) => sum + toNumber(row.jumlah_unit_usaha), 0),
    }));

    const trendRows = data.filter(row => {
      if (
        selectedJenisKegiatan &&
        normalizeKategori(row.kategori_kegiatan) !== selectedJenisKegiatan
      ) {
        return false;
      }
      if (filterKabupaten && row.kabupaten_kota !== filterKabupaten) return false;
      return true;
    });

    const yearlyMap = new Map();
    trendRows.forEach(row => {
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
  }, [data, filteredData, filterKabupaten, selectedJenisKegiatan]);

  const activeDetailKegiatan =
    selectedJenisKegiatan || detailKegiatanFilter;

  const showDetailKegiatanToggle =
    !selectedJenisKegiatan;

  const columns = useMemo(
    () => [
      { header: 'Tahun', accessorKey: 'tahun' },
      {
        header: 'Kabupaten/Kota',
        accessorKey: 'kabupaten_kota',
        cell: info => (
          <p className="font-medium text-foreground">{info.getValue()}</p>
        ),
      },
      {
        header: 'Kategori Kegiatan',
        accessorKey: 'kategori_kegiatan',
        cell: info => {
          const value = normalizeKategori(info.getValue());
          const colorClass =
            value === 'Pengolahan'
              ? 'border-blue-500/20 bg-blue-500/10 text-blue-600'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600';
          
          return (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: 'Jenis Kegiatan',
        accessorKey: 'jenis_kegiatan',
      },
      { header: 'Skala Usaha', accessorKey: 'skala_usaha' },
      {
        header: 'Jumlah Unit Usaha',
        accessorKey: 'jumlah_unit_usaha',
        cell: info => toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Hasil Produksi (Kg)',
        accessorKey: 'hasil_kg',
        cell: info => toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Nilai Produksi (Rp)',
        accessorKey: 'hasil_rp',
        cell: info => formatRupiah(info.getValue()),
      },
      {
        header: 'Modal Investasi (Rp)',
        accessorKey: 'modal_rp',
        cell: info => formatRupiah(info.getValue()),
      },
    ],
    [],
  );

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
              areaColor: '#38bdf8',
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
              areaColor: '#0284c7',
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

  const barOption = useMemo(() => {
    const top10 = [...stats.produksiPerKabupaten]
      .filter(item => item[topKabFilter] > 0)
      .sort((a, b) => b[topKabFilter] - a[topKabFilter])
      .slice(0, 10)
      .reverse();

    const isProduksi = topKabFilter === 'produksi';

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
          name: isProduksi
            ? 'Hasil Produksi (KG)'
            : 'Nilai Hasil (Rp)',
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

  const lineOption = useMemo(() => {
    const isProduksi = trendFilter === 'produksi';

    const pengolahanKey = isProduksi
      ? 'pengolahan_produksi'
      : 'pengolahan_nilai';

    const pemasaranKey = isProduksi
      ? 'pemasaran_produksi'
      : 'pemasaran_nilai';

    const allSeries = [
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
    ];

    const visibleSeries = selectedJenisKegiatan
      ? allSeries.filter(item => item.name === selectedJenisKegiatan)
      : allSeries;

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: value =>
          isProduksi
            ? `${toNumber(value).toLocaleString('id-ID')} KG`
            : formatRupiah(value),
      },
      legend: {
        data: visibleSeries.map(item => item.name),
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
      series: visibleSeries,
    };
  }, [
    selectedJenisKegiatan,
    stats.trenTahunan,
    trendFilter,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Statistik Pengolahan dan Pemasaran
          </h1>
        </div>

        <div 
          className="
            inline-flex item-center gap-2
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
          <Clock className="w-4 h-4 flex-shrink-0 animate-pulse"/>
          
          <span className="opacity-80">
            Terakhir Diperbarui:
          </span>
          <span className="font-semibold">
            {lastUpdated}
          </span>
        </div>
      </div>

        {/* Filter utama: Tahun, Jenis Kegiatan, Kabupaten/Kota - sejajar 3 kolom */}
        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3">
          <select
            value={selectedYear}
            onChange={event => {
              setSelectedYear(event.target.value);
              setSelectedMapRegion(null);
            }}
            className="w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/50 sm:min-w-40"
          >
            <option value="">Semua Tahun</option>
            {tahunOptions.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedJenisKegiatan}
            onChange={event => {
              setSelectedJenisKegiatan(event.target.value);
              setSelectedMapRegion(null);
            }}
            className="w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/50 sm:min-w-48"
          >
            <option value="">Semua Jenis Kegiatan</option>
            <option value="Pengolahan">Pengolahan</option>
            <option value="Pemasaran">Pemasaran</option>
          </select>

          <select
            value={filterKabupaten}
            onChange={event => {
              setFilterKabupaten(event.target.value);
              setSelectedMapRegion(null);
            }}
            className="w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/50 sm:min-w-48"
          >
            <option value="">Semua Kabupaten/Kota</option>
            {KABUPATEN_KOTA_OPTIONS.filter(kab => kab !== 'SEMUA').map(kab => (
              <option key={kab} value={kab}>
                {kab}
              </option>
            ))}
          </select>
        </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Baris 1 — KPI */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="rounded-xl bg-emerald-500/10 p-4 text-emerald-500">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Nilai
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatRupiah(stats.kpi.total_nilai)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
              {/* Header peta */}
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                    
                    <h2 className="text-base font-semibold sm:text-lg">
                      Peta Sebaran Hasil
                    </h2>
                  </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:flex">
                    <select
                      value={barFilter}
                      onChange={event => {
                        setBarFilter(event.target.value);
                        setSelectedMapRegion(null);
                      }}
                    
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-auto"
                    >
                      <option value="produksi">
                        Hasil (KG)
                      </option>
                          
                      <option value="nilai">
                        Nilai (Rp)
                      </option>
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
                        {mapInteractionEnabled
                          ? 'Kunci Peta'
                          : 'Geser & Zoom'}
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
        touchAction:
          isMobileMap && !mapInteractionEnabled
            ? 'pan-y'
            : 'none',
      }}
    />
  </div>

  {/* Detail wilayah hasil tap */}
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
          <p className="text-xs text-muted-foreground">
            Jumlah UPI
          </p>

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
          <p className="text-xs text-muted-foreground">
            Nilai Hasil
          </p>

          <p className="mt-1 break-words font-bold text-foreground">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(selectedMapRegion.nilai)}
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

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
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

              <div className="h-[450px]">
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
                    {selectedJenisKegiatan
                      ? `Tren Tahunan ${selectedJenisKegiatan}`
                      : 'Tren Tahunan Pengolahan vs Pemasaran'}
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

          {/* Tabel rincian */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <div className="mb-1 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">
                  Rincian Data Pengolahan dan Pemasaran
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Tabel dapat dicari, diurutkan, dan diekspor ke Excel.
              </p>
            </div>

            {/* Filter tabel: Tahun, Jenis Kegiatan, Kabupaten/Kota (mengikuti filter utama) */}
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <select
                value={selectedYear}
                onChange={event => {
                  setSelectedYear(event.target.value);
                  setSelectedMapRegion(null);
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Semua Tahun</option>
                {tahunOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedJenisKegiatan}
                onChange={event => {
                  setSelectedJenisKegiatan(event.target.value);
                  setSelectedMapRegion(null);
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Semua Jenis Kegiatan</option>
                <option value="Pengolahan">Pengolahan</option>
                <option value="Pemasaran">Pemasaran</option>
              </select>

              <select
                value={filterKabupaten}
                onChange={event => {
                  setFilterKabupaten(event.target.value);
                  setSelectedMapRegion(null);
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Semua Kabupaten/Kota</option>
                {KABUPATEN_KOTA_OPTIONS.filter(kab => kab !== 'SEMUA').map(kab => (
                  <option key={kab} value={kab}>
                    {kab}
                  </option>
                ))}
              </select>
            </div>

            <DataTable
              columns={columns}
              data={filteredData}
              exportName={`Pengolahan_Pemasaran_${
                new Date().toISOString().split('T')[0]
              }`}
              formatExportData={exportData =>
                exportData.map((row, index) => ({
                  No: index + 1,
                  Tahun: row.tahun,
                  'Kabupaten/Kota': row.kabupaten_kota,
                  'Kategori Kegiatan': normalizeKategori(row.kategori_kegiatan),
                  'Jenis Kegiatan': row.jenis_kegiatan,
                  'Skala Usaha': row.skala_usaha,
                  'Jumlah Unit Usaha': toNumber(row.jumlah_unit_usaha),
                  'Hasil Produksi (Kg)': toNumber(row.hasil_kg),
                  'Nilai Produksi (Rp)': toNumber(row.hasil_rp),
                  'Modal Investasi (Rp)': toNumber(row.modal_rp),
                }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}