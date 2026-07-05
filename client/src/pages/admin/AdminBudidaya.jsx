import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, MapPin, TrendingUp, Box, LineChart, Fish, Filter, X, Download, FileText } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import BudidayaForm from '@/components/admin/BudidayaForm';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';

echarts.registerMap('jawa_timur', geoJsonData);
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function AdminBudidaya() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [barFilter, setBarFilter] = useState('produksi');

  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterKabupaten, setFilterKabupaten] = useState('');
  const [filterWadah, setFilterWadah] = useState('');
  const [filterTw, setFilterTw] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('wadah');
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());

  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.komoditas))].filter(Boolean).sort(), [data]);
  const kabupatenOptions = useMemo(() => [...new Set(data.map(d => d.kabupaten_kota))].filter(Boolean).sort(), [data]);
  const wadahOptions = useMemo(() => [...new Set(data.map(d => d.jenis_wadah))].filter(Boolean).sort(), [data]);
  const twOptions = useMemo(() => [...new Set(data.map(d => d.triwulan))].filter(Boolean).sort(), [data]);
  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterKomoditas && item.komoditas !== filterKomoditas) return false;
      if (filterKabupaten && item.kabupaten_kota !== filterKabupaten) return false;
      if (filterWadah && item.jenis_wadah !== filterWadah) return false;
      if (filterTw && item.triwulan !== filterTw) return false;
      if (filterBulan && item.bulan !== filterBulan) return false;
      if (filterTahun && item.tahun !== filterTahun) return false;
      return true;
    });
  }, [data, filterKomoditas, filterKabupaten, filterWadah, filterTw, filterBulan, filterTahun]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budidaya/admin');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching budidaya:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setSubmitLoading(true);
      if (editingData) {
        await api.put(`/budidaya/${editingData.id}`, formData);
      } else {
        await api.post('/budidaya', formData);
      }
      setIsFormOpen(false);
      setEditingData(null);
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Gagal menyimpan data');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Yakin ingin menghapus data budidaya untuk ${row.kabupaten_kota}?`)) {
      try {
        await api.delete(`/budidaya/${row.id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting budidaya:', error);
        alert('Gagal menghapus data');
      }
    }
  };

  const handleEdit = (row) => {
    setEditingData(row);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (row) => {
    let promptMsg = 'Pilih jenis validasi (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    if (row.status === 'APPROVED_BIDANG') {
      promptMsg = 'Data ini sudah disetujui Bidang.\nKetik "2" untuk melanjutkan Validasi Program:';
    } else if (row.status === 'PENDING') {
      promptMsg = 'Data berstatus PENDING.\nKetik "1" untuk Validasi Bidang\nKetik "2" untuk Validasi Program';
    }

    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      if (row.status === 'APPROVED_BIDANG') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'APPROVED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    } else {
      alert('Pilihan tidak valid. Proses dibatalkan.');
      return;
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.put(`/budidaya/${row.id}/status`, { status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error approving data:', error);
      alert(`Gagal menyetujui data: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    
    try {
      await api.put(`/budidaya/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error rejecting data:', error);
      alert('Gagal menolak data');
    }
  };

  const handleBatchApprove = async (ids) => {
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      targetStatus = 'APPROVED_BIDANG';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'APPROVED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC';
    } else {
      alert('Pilihan tidak valid. Proses dibatalkan.');
      return;
    }

    const confirmText = window.prompt(`Anda akan menyetujui ${ids.length} data.\nKetik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      await api.post(`/budidaya/batch-status`, { ids, status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error batch approve:', error);
      alert(`Gagal menyetujui data secara massal: ${error?.response?.data?.message || error.message}`);
    }
  };

  const handleBatchReject = async (ids) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk ${ids.length} data:`);
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    try {
      await api.post(`/budidaya/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDelete = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data ini?`)) {
      try {
        await api.post(`/budidaya/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete:', error);
        alert('Gagal menghapus data secara massal');
      }
    }
  };

  const handleCustomExport = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = () => {
    if (!exportYear) {
      alert('Pilih tahun terlebih dahulu');
      return;
    }

    const endpoint = exportType === 'wadah' ? '/budidaya/export-wadah' : '/budidaya/export-komoditas';
    const token = localStorage.getItem('token');
    
    // Create a form to trigger download
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}`;
    
    const yearInput = document.createElement('input');
    yearInput.type = 'hidden';
    yearInput.name = 'tahun';
    yearInput.value = exportYear;
    form.appendChild(yearInput);

    if (token) {
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token'; // Backend needs to support token via query for this to work perfectly, or we use fetch + blob
      tokenInput.value = token;
      // Note: for file downloads with auth, fetch + blob is better
    }

    document.body.appendChild(form);
    // Actually better to use fetch and blob to include auth headers properly
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}?tahun=${exportYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Ringkasan_${exportType}_${exportYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
    })
    .catch(err => {
      console.error('Export error:', err);
      alert('Gagal mengunduh file');
    });
  };

  const computedStats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    const komoditasMap = {};
    const kabMap = {};
    const wadahMap = {};
    const heatmapRaw = {};
    
    filteredData.forEach(item => {
      const vol = Number(item.produksi_kg) || 0;
      const nilai = Number(item.nilai_rp) || 0;
      
      total_volume += vol;
      total_nilai += nilai;
      
      if (item.komoditas) {
        komoditasMap[item.komoditas] = (komoditasMap[item.komoditas] || 0) + vol;
      }
      
      const kab = item.kabupaten_kota || 'Tidak Diketahui';
      if (!kabMap[kab]) kabMap[kab] = { produksi: 0, nilai: 0 };
      kabMap[kab].produksi += vol;
      kabMap[kab].nilai += nilai;
      
      if (item.jenis_wadah) {
        wadahMap[item.jenis_wadah] = (wadahMap[item.jenis_wadah] || 0) + vol;
      }
      
      if (!heatmapRaw[kab]) {
        heatmapRaw[kab] = MONTHS.map(b => ({ bulan: b, produksi: 0 }));
      }
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex !== -1) {
        heatmapRaw[kab][bIndex].produksi += vol;
      }
    });

    let top_komoditas = '-';
    let maxKomoditasProd = 0;
    for (const [kom, prod] of Object.entries(komoditasMap)) {
      if (prod > maxKomoditasProd) {
        maxKomoditasProd = prod;
        top_komoditas = kom;
      }
    }

    const produksiPerKabupaten = Object.entries(kabMap)
      .map(([name, stats]) => ({ name, produksi: stats.produksi, nilai: stats.nilai }))
      .sort((a, b) => b.produksi - a.produksi);

    const komposisiWadah = Object.entries(wadahMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const top5Wadah = komposisiWadah.slice(0, 5).map(w => w.name);

    const trenBulanan = MONTHS.map(bulan => {
      const monthData = { bulan, Lainnya: 0 };
      top5Wadah.forEach(w => monthData[w] = 0);
      return monthData;
    });

    filteredData.forEach(item => {
      const bIndex = MONTHS.indexOf(item.bulan);
      if (bIndex === -1) return;
      
      const vol = Number(item.produksi_kg) || 0;
      if (top5Wadah.includes(item.jenis_wadah)) {
        trenBulanan[bIndex][item.jenis_wadah] += vol;
      } else {
        trenBulanan[bIndex].Lainnya += vol;
      }
    });

    const heatmapData = [];
    Object.keys(heatmapRaw).forEach(kab => {
      const bulanArr = heatmapRaw[kab];
      const maxProd = Math.max(...bulanArr.map(b => b.produksi));
      const minProd = Math.min(...bulanArr.map(b => b.produksi));
      const range = maxProd - minProd;

      bulanArr.forEach(b => {
        let normalized = 0;
        if (range > 0) {
          normalized = (b.produksi - minProd) / range;
        } else if (maxProd > 0) {
          normalized = 1;
        }
        heatmapData.push({
          kabupaten: kab,
          bulan: b.bulan,
          produksi: b.produksi,
          normalized: parseFloat(normalized.toFixed(4))
        });
      });
    });

    return {
      kpi: { total_volume, top_komoditas, total_nilai },
      produksiPerKabupaten,
      komposisiWadah,
      top5Wadah,
      trenBulanan,
      heatmapData
    };
  }, [filteredData]);

  const mapOption = useMemo(() => {
    const mapData = computedStats.produksiPerKabupaten.map(item => ({ name: item.name, value: item.produksi }));
    const maxVal = mapData.length > 0 ? Math.max(...mapData.map(d => d.value)) : 0;
    return {
      title: { text: 'Produksi Budidaya per Kabupaten/Kota', textStyle: { color: '#e2e8f0', fontSize: 16, fontFamily: 'Inter' }, left: 'center', top: 10 },
      tooltip: { trigger: 'item', formatter: (params) => `${params.name}<br/>Total Produksi: <b>${(params.value || 0).toLocaleString('id-ID')} KG</b>` },
      visualMap: { left: 'right', min: 1, max: maxVal || 100, inRange: { color: ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#34d399'] }, text: ['Tinggi', 'Rendah'], textStyle: { color: '#94a3b8' }, calculable: true, type: 'piecewise', splitNumber: 5 },
      series: [{ name: 'Produksi Budidaya', type: 'map', map: 'jawa_timur', roam: true, label: { show: false, color: '#fff' }, emphasis: { label: { show: true, color: '#fff' }, itemStyle: { areaColor: '#f59e0b' } }, itemStyle: { areaColor: '#1e293b', borderColor: '#334155' }, data: mapData }]
    };
  }, [computedStats.produksiPerKabupaten]);

  const barOption = useMemo(() => {
    const sortedData = [...computedStats.produksiPerKabupaten].sort((a, b) => b[barFilter] - a[barFilter]);
    const top10 = sortedData.slice(0, 10).reverse();
    const isProduksi = barFilter === 'produksi';
    const seriesName = isProduksi ? 'Produksi (KG)' : 'Nilai Total (Rp)';
    const formatter = isProduksi ? val => val.toLocaleString('id-ID') + ' KG' : val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => `${params[0].name}<br/>${seriesName}: <b>${formatter(params[0].value || 0)}</b>` },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }, axisLabel: { color: '#94a3b8', formatter: (val) => { if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T'; if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M'; if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt'; if (val >= 1000) return (val / 1000).toFixed(1) + 'rb'; return val; } } },
      yAxis: { type: 'category', data: top10.map(d => d.name), axisLabel: { color: '#cbd5e1', fontSize: 11 } },
      series: [{ name: seriesName, type: 'bar', data: top10.map(d => d[barFilter]), itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#2563eb' }]), borderRadius: [0, 4, 4, 0] } }]
    };
  }, [computedStats.produksiPerKabupaten, barFilter]);

  const lineOption = useMemo(() => {
    const seriesData = computedStats.top5Wadah.map(wadah => ({ name: wadah, type: 'line', smooth: true, symbolSize: 6, data: computedStats.trenBulanan.map(m => m[wadah] || 0) }));
    seriesData.push({ name: 'Lainnya', type: 'line', smooth: true, lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' }, itemStyle: { color: '#94a3b8' }, symbol: 'none', data: computedStats.trenBulanan.map(m => m.Lainnya || 0) });
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: [...computedStats.top5Wadah, 'Lainnya'], textStyle: { color: '#cbd5e1' }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 30 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }, axisLabel: { color: '#94a3b8' } },
      series: seriesData
    };
  }, [computedStats.trenBulanan, computedStats.top5Wadah]);

  const treemapOption = useMemo(() => {
    const data = computedStats.komposisiWadah.map(w => ({ name: w.name, value: w.value }));
    return {
      tooltip: { formatter: (info) => `<b>${info.name}</b><br/>Total Produksi: ${(info.value || 0).toLocaleString('id-ID')} KG` },
      series: [{ type: 'treemap', width: '100%', height: '100%', top: 0, bottom: 0, left: 0, right: 0, roam: false, nodeClick: false, breadcrumb: { show: false }, label: { show: true, formatter: '{b}\n\n{c} KG', color: '#fff', fontWeight: 'bold' }, itemStyle: { borderColor: '#0f172a', gapWidth: 2 }, data: data, colorMappingBy: 'value', visualMap: { show: false, inRange: { color: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] } } }]
    };
  }, [computedStats.komposisiWadah]);

  const heatmapOption = useMemo(() => {
    const yAxisData = [...new Set(computedStats.heatmapData.map(d => d.kabupaten))].sort();
    const xAxisData = MONTHS;
    const dataPairs = [];
    const tooltipRawData = {};
    computedStats.heatmapData.forEach(item => {
      const xIndex = xAxisData.indexOf(item.bulan);
      const yIndex = yAxisData.indexOf(item.kabupaten);
      if (xIndex !== -1 && yIndex !== -1) {
        dataPairs.push([xIndex, yIndex, item.normalized]);
        tooltipRawData[`${xIndex}-${yIndex}`] = item.produksi;
      }
    });
    return {
      tooltip: { position: 'top', formatter: (params) => { const xIndex = params.data[0]; const yIndex = params.data[1]; const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0; return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Produksi: ${rawValue.toLocaleString('id-ID')} KG`; } },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData, splitArea: { show: true }, axisLabel: { color: '#cbd5e1', rotate: 45 } },
      yAxis: { type: 'category', data: yAxisData, splitArea: { show: true }, axisLabel: { color: '#cbd5e1', fontSize: 10 } },
      visualMap: { min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#0f172a', '#3b82f6', '#2dd4bf', '#fde047', '#f43f5e'] }, textStyle: { color: '#cbd5e1' }, formatter: (value) => value.toFixed(1) },
      series: [{ name: 'Heatmap', type: 'heatmap', data: dataPairs, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
    };
  }, [computedStats.heatmapData]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const status = info.getValue();
        const alasan = info.row.original.alasan_penolakan;
        let colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        let label = 'PENDING';
        if (status === 'APPROVED') {
          colorClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
          label = 'APPROVED (PROGRAM)';
        } else if (status === 'APPROVED_BIDANG') {
          colorClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          label = 'APPROVED (BIDANG)';
        } else if (status === 'REJECTED') {
          colorClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          label = 'REJECTED';
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
              {label}
            </span>
            {status === 'REJECTED' && alasan && (
              <span className="text-xs text-rose-500 cursor-help" title={`Alasan: ${alasan}`}>
                (?)
              </span>
            )}
          </div>
        );
      }
    },
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan', cell: info => (<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{info.getValue()}</span>) },
    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
    { header: 'Kategori Komoditas', accessorKey: 'kategori_komoditas' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    { header: 'Jenis Wadah', accessorKey: 'jenis_wadah', cell: info => (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{info.getValue()}</span>) },
    { header: 'Produksi (KG)', accessorKey: 'produksi_kg', cell: info => (info.getValue() || 0).toLocaleString('id-ID') },
    { header: 'Harga (Rp)', accessorKey: 'harga_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val); } },
    { header: 'Nilai Total (Rp)', accessorKey: 'nilai_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val); } }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Data Budidaya</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen data produksi perikanan budidaya per Kabupaten/Kota.
          </p>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingData(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Tambah Data Baru
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <BudidayaForm
            initialData={editingData}
            isLoading={submitLoading}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingData(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      {/* Tabs Filter & Statistik */}
      {!isFormOpen && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <button 
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'data' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Tabel Data
            </button>
            <button 
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'visual' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Visualisasi Statistik
            </button>
          </div>

          {/* Super Filters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Tahun</option>
                  {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Triwulan</label>
                <select value={filterTw} onChange={(e) => setFilterTw(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Triwulan</option>
                  {twOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Bulan</option>
                  {bulanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                <select value={filterKabupaten} onChange={(e) => setFilterKabupaten(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Kab/Kota</option>
                  {kabupatenOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
                <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Komoditas</option>
                  {komoditasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jenis Wadah</label>
                <select value={filterWadah} onChange={(e) => setFilterWadah(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Wadah</option>
                  {wadahOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isFormOpen && (
        activeTab === 'data' ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <DataTable 
              columns={columns} 
              data={filteredData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onBatchApprove={handleBatchApprove}
              onBatchReject={handleBatchReject}
              onBatchDelete={handleBatchDelete}
              exportName={`Budidaya_Samudera_${new Date().toISOString().split('T')[0]}`}
              customExportButton={
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Ekspor Ringkasan
                </button>
              }
              formatExportData={(exportData) => exportData.map(row => ({
                'Status': row.status,
                'Tahun': row.tahun,
                'Bulan': row.bulan,
                'Triwulan': row.triwulan,
                'Kabupaten/Kota': row.kabupaten_kota,
                'Kategori Komoditas': row.kategori_komoditas,
                'Komoditas': row.komoditas,
                'Jenis Wadah': row.jenis_wadah,
                'Produksi (KG)': row.produksi_kg,
                'Harga (Rp)': row.harga_rp,
                'Nilai Total (Rp)': row.nilai_rp
              }))}
            />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold text-foreground">
                    {computedStats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">KG</span>
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Komoditas</p>
                  <p className="text-xl font-bold text-foreground leading-tight">{computedStats.kpi.top_komoditas}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Nilai Budidaya</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(computedStats.kpi.total_nilai)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Peta Sebaran Produksi</h2>
                </div>
                <div className="h-[450px]">
                  <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Top 10 Kab/Kota</h2>
                  </div>
                  <select
                    value={barFilter}
                    onChange={(e) => setBarFilter(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200"
                  >
                    <option value="produksi">Produksi (KG)</option>
                    <option value="nilai">Nilai Total (Rp)</option>
                  </select>
                </div>
                <div className="h-[450px]">
                  <ReactECharts option={barOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-teal-500" />
                  <h2 className="text-lg font-semibold">Tren Produksi Bulanan</h2>
                </div>
                <div className="h-[350px]">
                  <ReactECharts option={lineOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Fish className="w-5 h-5 text-cyan-500" />
                  <h2 className="text-lg font-semibold">Komposisi Jenis Wadah</h2>
                </div>
                <div className="h-[350px]">
                  <ReactECharts option={treemapOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-semibold">Pola Musiman per Wilayah </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Warna merepresentasikan intensitas produksi relatif terhadap titik tertinggi masing-masing kabupaten. Hover untuk melihat angka tonase.
              </p>
              <div className="h-[600px]">
                <ReactECharts option={heatmapOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
          </div>
        )
      )}
      {/* Modal Ekspor */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Ekspor Data Budidaya</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipe Laporan</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'wadah' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="exportType" value="wadah" checked={exportType === 'wadah'} onChange={() => setExportType('wadah')} className="hidden" />
                    Berdasarkan Wadah
                  </label>
                  <label className={`cursor-pointer px-4 py-3 border rounded-xl flex items-center gap-2 ${exportType === 'komoditas' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="exportType" value="komoditas" checked={exportType === 'komoditas'} onChange={() => setExportType('komoditas')} className="hidden" />
                    Berdasarkan Komoditas
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tahun Laporan</label>
                <select 
                  value={exportYear} 
                  onChange={(e) => setExportYear(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="">Pilih Tahun...</option>
                  {tahunOptions.length > 0 ? tahunOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  )) : (
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  )}
                </select>
              </div>
              <button 
                onClick={executeExport}
                disabled={!exportYear}
                className="w-full mt-4 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Unduh Excel
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
