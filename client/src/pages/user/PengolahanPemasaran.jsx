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

const getUpiKey = row => {
  if (row?.id_upi) return String(row.id_upi);
  if (row?.upi_id) return String(row.upi_id);

  const nama = String(row?.nama_upi ?? '').trim().toLowerCase();
  const kabupaten = String(row?.kabupaten_kota ?? '').trim().toLowerCase();

  if (!nama && !kabupaten) return null;
  return `${nama}|${kabupaten}`;
};

const getJenisDetail = row =>
  row.jenis_kegiatan === 'Pengolahan'
    ? row.jenis_kegiatan_pengolahan
    : row.jenis_kegiatan_pemasaran;

export default function PengolahanPemasaran() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("-");

  // Filter utama dashboard dan tabel
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedJenisKegiatan, setSelectedJenisKegiatan] = useState('');
  const [filterKabupaten, setFilterKabupaten] = useState('');
  const [filterSkalaUsaha, setFilterSkalaUsaha] = useState('');

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
          setLastUpdated(
            new Date(latest.updated_at).toLocaleString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
          })
        );
      } else {
        setLastUpdated("-");
      }
    } catch (error) {
      console.error(
        'Error fetching pengolahan & pemasaran:',
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
          item.jenis_kegiatan !== selectedJenisKegiatan
        ) {
          return false;
        }

        return true;
      }),
    [data, selectedJenisKegiatan, selectedYear],
  );

  const kabupatenOptions = useMemo(
    () =>
      [...new Set(dashboardData.map(item => item.kabupaten_kota).filter(Boolean))]
        .sort(),
    [dashboardData],
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

        if (
          filterSkalaUsaha &&
          item.skala_usaha !== filterSkalaUsaha
        ) {
          return false;
        }

        return true;
      }),
    [
      dashboardData,
      filterKabupaten,
      filterSkalaUsaha,
    ],
  );

  const stats = useMemo(() => {
    const rows = dashboardData;

    const total_volume = rows.reduce(
      (sum, row) => sum + toNumber(row.hasil_produksi_per_tahun_kg),
      0,
    );

    const total_nilai = rows.reduce(
      (sum, row) => sum + toNumber(row.nilai_hasil_produksi_per_tahun_rp),
      0,
    );

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

    const kabupatenMap = new Map();

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

    // Tren tetap memakai seluruh tahun agar pola antartahun terlihat,
    // tetapi tetap mengikuti pilihan jenis kegiatan global.
    const yearlyMap = new Map();
    const trendRows = selectedJenisKegiatan
      ? data.filter(item => item.jenis_kegiatan === selectedJenisKegiatan)
      : data;

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
  }, [dashboardData, data, selectedJenisKegiatan]);

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
          <p className="font-medium text-foreground">
            {info.getValue()}
          </p>
        ),
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
              ? 'border-blue-500/20 bg-blue-500/10 text-blue-600'
              : value === 'Pemasaran'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                : 'border-border bg-muted text-muted-foreground';

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
        header: 'Hasil Produksi/Tahun (Kg)',
        accessorKey: 'hasil_produksi_per_tahun_kg',
        cell: info =>
          toNumber(info.getValue()).toLocaleString('id-ID'),
      },
      {
        header: 'Nilai Hasil/Tahun (Rp)',
        accessorKey: 'nilai_hasil_produksi_per_tahun_rp',
        cell: info => formatRupiah(info.getValue()),
      },
      {
        header: 'Total Tenaga Kerja',
        accessorKey: 'total_seluruh_tenaga_kerja',
        cell: info =>
          toNumber(info.getValue()).toLocaleString('id-ID'),
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
            Statistik Pengolahan & Pemasaran
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
          
          <span className="font-semibold">
            {lastUpdated}
          </span> 
          <span className="opacity-80">
            Terakhir Diperbarui
          </span>
        </div>
      </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <select
            value={selectedJenisKegiatan}
            onChange={event => {
              setSelectedJenisKegiatan(event.target.value);
              setSelectedMapRegion(null);
              setFilterKabupaten('');
            }}
            className="w-full cursor-pointer rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/50 sm:min-w-48"
          >
            <option value="">Semua Jenis Kegiatan</option>
            <option value="Pengolahan">Pengolahan</option>
            <option value="Pemasaran">Pemasaran</option>
          </select>

          <select
            value={selectedYear}
            onChange={event => {
              setSelectedYear(event.target.value);
              setSelectedMapRegion(null);
              setFilterKabupaten('');
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
              {/* Header peta */}
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
                    {selectedJenisKegiatan
                      ? `Tren Tahunan ${selectedJenisKegiatan}`
                      : 'Tren Tahunan Pengolahan vs Pemasaran'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedJenisKegiatan
                      ? `Menampilkan perkembangan ${selectedJenisKegiatan.toLowerCase()} dari tahun ke tahun.`
                      : 'Dua garis memudahkan perbandingan perkembangan setiap tahun.'}
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

          {/* Tabel rincian */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <div className="mb-1 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">
                  Rincian Data Pengolahan & Pemasaran
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Tabel dapat dicari, diurutkan, dan diekspor ke Excel.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                value={filterKabupaten}
                onChange={event => setFilterKabupaten(event.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Semua Kab/Kota</option>
                {kabupatenOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={filterSkalaUsaha}
                onChange={event =>
                  setFilterSkalaUsaha(event.target.value)
                }
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
              exportName={`Pengolahan_Pemasaran_${
                new Date().toISOString().split('T')[0]
              }`}
              formatExportData={exportData =>
                exportData.map(row => ({
                  Tahun: row.tahun,
                  'Kabupaten/Kota': row.kabupaten_kota,
                  'Nama UPI': row.nama_upi,
                  'Jenis Kegiatan': row.jenis_kegiatan,
                  'Jenis Detail': getJenisDetail(row),
                  'Skala Usaha': row.skala_usaha,
                  'Jenis Produk': row.jenis_produk,
                  'Hasil Produksi/Tahun (Kg)':
                    row.hasil_produksi_per_tahun_kg,
                  'Nilai Hasil/Tahun (Rp)':
                    row.nilai_hasil_produksi_per_tahun_rp,
                  'Total Tenaga Kerja':
                    row.total_seluruh_tenaga_kerja,
                }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}