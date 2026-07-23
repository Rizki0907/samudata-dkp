import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, MapPin, TrendingUp, Box, LineChart, Fish, Filter, X, Download, FileText } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import BudidayaForm from '@/components/admin/BudidayaForm';
import { BudidayaTahunanForm } from '@/components/admin/BudidayaTahunanForm';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import geoJsonData from '@/assets/jawa_timur.json';

echarts.registerMap('jawa_timur', geoJsonData);
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const TwBadge = ({ tw }) => {
  const twStr = String(tw).startsWith('TW') ? String(tw) : `TW ${tw}`;
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  const cls = colorMap[twStr] ?? 'bg-muted text-muted-foreground border-border';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{twStr}</span>;
};

export default function AdminBudidaya() {
  const [data, setData] = useState([]);
  const [dataTahunan, setDataTahunan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTahunanFormOpen, setIsTahunanFormOpen] = useState(false);
  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
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
  const [filterModul, setFilterModul] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState('wadah');
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());

  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.komoditas))].filter(Boolean).sort(), [data]);
  const kabupatenOptions = useMemo(() => [...new Set([...data.map(d => d.kabupaten_kota), ...dataTahunan.map(d => d.kabupaten_kota)])].filter(Boolean).sort(), [data, dataTahunan]);
  const wadahOptions = useMemo(() => [...new Set(data.map(d => d.jenis_wadah))].filter(Boolean).sort(), [data]);
  const twOptions = useMemo(() => [...new Set(data.map(d => d.triwulan))].filter(Boolean).sort(), [data]);
  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set([...data.map(d => d.tahun), ...dataTahunan.map(d => d.tahun)])].filter(Boolean).sort(), [data, dataTahunan]);
  const modulOptions = useMemo(() => [...new Set(dataTahunan.map(d => d.modul_id))].filter(Boolean).sort(), [dataTahunan]);

  const filteredDataTahunan = useMemo(() => {
    return dataTahunan.filter(item => {
      if (filterKabupaten && item.kabupaten_kota !== filterKabupaten) return false;
      if (filterTahun && item.tahun?.toString() !== filterTahun?.toString()) return false;
      if (filterModul && item.modul_id !== filterModul) return false;
      return true;
    });
  }, [dataTahunan, filterKabupaten, filterTahun, filterModul]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterKomoditas && item.komoditas !== filterKomoditas) return false;
      if (filterKabupaten && item.kabupaten_kota !== filterKabupaten) return false;
      if (filterWadah && item.jenis_wadah !== filterWadah) return false;
      if (filterTw && item.triwulan?.toString() !== filterTw?.toString()) return false;
      if (filterBulan && item.bulan !== filterBulan) return false;
      if (filterTahun && item.tahun?.toString() !== filterTahun?.toString()) return false;
      return true;
    });
  }, [data, filterKomoditas, filterKabupaten, filterWadah, filterTw, filterBulan, filterTahun]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [response, tahRes] = await Promise.all([
        api.get('/budidaya/admin'),
        api.get('/budidaya-tahunan')
      ]);
      if (response.data.success) {
        setData(response.data.data);
      }
      if (tahRes.data.success) {
        setDataTahunan(tahRes.data.data);
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

  const handleApproveTahunan = async (row) => {
    let promptMsg = 'Pilih jenis validasi (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    if (row.status === 'APPROVED') {
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
      if (row.status === 'APPROVED') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'SETUJU';
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
      await api.put(`/budidaya-tahunan/${row.id}/status`, { status: targetStatus });
      fetchData();
    } catch (error) {
      alert('Gagal menyetujui data');
    }
  };

  const handleRejectTahunan = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (alasan) {
      try {
        await api.put(`/budidaya-tahunan/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        fetchData();
      } catch (error) {
        alert('Gagal menolak data');
      }
    }
  };

  const handleDeleteTahunan = async (row) => {
    if (window.confirm(`Yakin ingin menghapus data tahunan ${row.modul_id}?`)) {
      try {
        await api.delete(`/budidaya-tahunan/${row.id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus data');
      }
    }
  };

  const handleApprove = async (row) => {
    let promptMsg = 'Pilih jenis validasi (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    if (row.status === 'APPROVED') {
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
      if (row.status === 'APPROVED') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
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
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
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

  const handleBatchApproveTahunan = async (ids) => {
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU';
    } else if (jenis === '2') {
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'SETUJU';
    } else {
      alert('Pilihan tidak valid');
      return;
    }

    const confirmText = window.prompt(`Ketik "${expectedKeyword}" untuk mengonfirmasi validasi ${namaValidasi} untuk ${ids.length} data:`);
    if (confirmText !== expectedKeyword) {
      alert('Validasi dibatalkan karena teks konfirmasi tidak sesuai.');
      return;
    }

    try {
      await api.post(`/budidaya-tahunan/batch-status`, { ids, status: targetStatus });
      fetchData();
    } catch (error) {
      console.error('Error batch approve tahunan:', error);
      alert('Gagal menyetujui data secara massal');
    }
  };

  const handleBatchRejectTahunan = async (ids) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk ${ids.length} data:`);
    if (alasan === null) return;
    if (!alasan.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    try {
      await api.post(`/budidaya-tahunan/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject tahunan:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDeleteTahunan = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data tahunan ini?`)) {
      try {
        await api.post(`/budidaya-tahunan/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete tahunan:', error);
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

    let endpoint = '';
    let fileName = '';

    if (activeTab === 'tahunan') {
      endpoint = '/budidaya-tahunan/export';
      fileName = `Data_Tahunan_Budidaya_${exportYear}.xlsx`;
    } else {
      endpoint = exportType === 'wadah' ? '/budidaya/export-wadah' : '/budidaya/export-komoditas';
      fileName = `Ringkasan_${exportType}_${exportYear}.xlsx`;
    }

    const token = localStorage.getItem('admin_token');

    // Use fetch and blob to include auth headers properly
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}?tahun=${exportYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setIsExportModalOpen(false);
      })
      .catch(err => {
        console.error('Export error:', err);
        alert(`Gagal mengunduh file: ${err.message}. Fetching URL: ${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${endpoint}?tahun=${exportYear}`);
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
      tooltip: { trigger: 'item', formatter: (params) => `${params.name}<br/>Total Produksi: <b>${Number(params.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG</b>` },
      visualMap: { left: 'right', min: 1, max: maxVal || 100, inRange: { color: ['#0f172a', '#1e3a8a', '#3b82f6', '#93c5fd', '#34d399'] }, text: ['Tinggi', 'Rendah'], textStyle: { color: '#94a3b8' }, calculable: true, type: 'piecewise', splitNumber: 5 },
      series: [{ name: 'Produksi Budidaya', type: 'map', map: 'jawa_timur', roam: true, label: { show: false, color: '#fff' }, emphasis: { label: { show: true, color: '#fff' }, itemStyle: { areaColor: '#f59e0b' } }, itemStyle: { areaColor: '#1e293b', borderColor: '#334155' }, data: mapData }]
    };
  }, [computedStats.produksiPerKabupaten]);

  const barOption = useMemo(() => {
    const sortedData = [...computedStats.produksiPerKabupaten].sort((a, b) => b[barFilter] - a[barFilter]);
    const top10 = sortedData.slice(0, 10).reverse();
    const isProduksi = barFilter === 'produksi';
    const seriesName = isProduksi ? 'Produksi (KG)' : 'Nilai Total (Rp)';
    const formatter = isProduksi ? val => Number(val).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' KG' : val => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params) => `${params[0].name}<br/>${seriesName}: <b>${formatter(params[0].value || 0)}</b>` },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }, axisLabel: { color: '#94a3b8', formatter: (val) => { if (val >= 1000000000000) return (val / 1000000000000).toFixed(1) + 'T'; if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'M'; if (val >= 1000000) return (val / 1000000).toFixed(1) + 'Jt'; if (val >= 1000) return (val / 1000).toFixed(1) + 'rb'; return val; } } },
      yAxis: { type: 'category', data: top10.map(d => d.name), axisLabel: { color: '#cbd5e1', fontSize: 11 } },
      series: [{ name: seriesName, type: 'bar', data: top10.map(d => d[barFilter]), itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#2563eb' }]), borderRadius: [0, 4, 4, 0] } }]
    };
  }, [computedStats.produksiPerKabupaten, barFilter]);

  const lineOption = useMemo(() => {
    const seriesData = computedStats.top5Wadah.map(wadah => ({ name: wadah, type: 'line', smooth: true, symbolSize: 6, data: computedStats.trenBulanan.map(m => m[wadah] || 0) }));
    seriesData.push({ name: 'Lainnya', type: 'line', smooth: true, lineStyle: { type: 'dashed', width: 2, color: '#94a3b8' }, itemStyle: { color: '#94a3b8' }, symbol: 'none', data: computedStats.trenBulanan.map(m => m.Lainnya || 0) });
    return {
      tooltip: { trigger: 'axis', valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
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
      tooltip: { formatter: (info) => `<b>${info.name}</b><br/>Total Produksi: ${Number(info.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG` },
      series: [{ type: 'treemap', width: '100%', height: '100%', top: 0, bottom: 0, left: 0, right: 0, roam: false, nodeClick: false, breadcrumb: { show: false }, label: { show: true, formatter: (params) => `${params.name}\n\n${Number(params.value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG`, color: '#fff', fontWeight: 'bold' }, itemStyle: { borderColor: '#0f172a', gapWidth: 2 }, data: data, colorMappingBy: 'value', visualMap: { show: false, inRange: { color: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'] } } }]
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
      tooltip: { position: 'top', formatter: (params) => { const xIndex = params.data[0]; const yIndex = params.data[1]; const rawValue = tooltipRawData[`${xIndex}-${yIndex}`] || 0; return `<b>${yAxisData[yIndex]}</b><br/>${xAxisData[xIndex]}<br/>Produksi: ${Number(rawValue).toLocaleString('id-ID', { maximumFractionDigits: 2 })} KG`; } },
      grid: { left: '3%', right: '4%', top: '3%', bottom: '5%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData, splitArea: { show: true }, axisLabel: { color: '#cbd5e1', rotate: 45 } },
      yAxis: { type: 'category', data: yAxisData, splitArea: { show: true }, axisLabel: { color: '#cbd5e1', fontSize: 10 } },
      visualMap: { min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', inRange: { color: ['#0f172a', '#2563eb', '#06b6d4', '#facc15', '#22c55e'] }, textStyle: { color: '#cbd5e1' }, formatter: (value) => value.toFixed(1) },
      series: [{ name: 'Heatmap', type: 'heatmap', data: dataPairs, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } } }]
    };
  }, [computedStats.heatmapData]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const row = info.row.original;

        const contextFields = [
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Komoditas', value: row.komoditas },
          { label: 'Kategori', value: row.kategori_komoditas },
          { label: 'Periode', value: `Tahun ${row.tahun} (Triwulan ${row.triwulan}, Bulan ${row.bulan})` }
        ];

        return (
          <StatusBadge
            row={row}
            onEdit={() => setEditingData(row)}
            contextFields={contextFields}
          />
        );
      }
    },
    { header: 'Tahun', accessorKey: 'tahun' },
    { header: 'Bulan', accessorKey: 'bulan' },
    { header: 'Triwulan', accessorKey: 'triwulan', cell: info => (<TwBadge tw={info.getValue()} />) },
    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
    { header: 'Kategori Komoditas', accessorKey: 'kategori_komoditas' },
    { header: 'Komoditas', accessorKey: 'komoditas' },
    { header: 'Jenis Wadah', accessorKey: 'jenis_wadah', cell: info => (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{info.getValue()}</span>) },
    { header: 'Produksi (KG)', accessorKey: 'produksi_kg', cell: info => (info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }) },
    { header: 'Harga (Rp)', accessorKey: 'harga_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } },
    { header: 'Nilai Total (Rp)', accessorKey: 'nilai_rp', cell: info => { const val = info.getValue() || 0; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val); } }
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

        {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
          <div className="relative">
            <button
              onClick={() => setIsSelectTypeModalOpen(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Tambah Data Baru
            </button>
          </div>
        )}
      </div>

      {isSelectTypeModalOpen && (
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm animate-in fade-in duration-300">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Pilih Jenis Data Budidaya</h2>
            <p className="text-muted-foreground">Silakan pilih jenis laporan data budidaya yang ingin Anda kelola.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => {
                setIsSelectTypeModalOpen(false);
                setEditingData(null);
                setIsFormOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Data Bulanan</h3>
                <p className="text-sm text-muted-foreground mt-1">Laporan produksi ikan budidaya harian/bulanan.</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsSelectTypeModalOpen(false);
                setEditingData(null);
                setIsTahunanFormOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Box className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Data Tahunan</h3>
                <p className="text-sm text-muted-foreground mt-1">Laporan inventarisasi dan infrastruktur budidaya tahunan.</p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button onClick={() => setIsSelectTypeModalOpen(false)} className="text-sm text-muted-foreground hover:text-foreground font-medium">Batalkan</button>
          </div>
        </div>
      )}

      {isTahunanFormOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <BudidayaTahunanForm
            initialData={editingData}
            onClose={() => {
              setIsTahunanFormOpen(false);
              setEditingData(null);
            }}
            onSuccess={() => {
              setIsTahunanFormOpen(false);
              setEditingData(null);
              fetchData();
            }}
          />
        </div>
      )}

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
          {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'data' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Tabel Data
                </button>
                <button
                  onClick={() => setActiveTab('tahunan')}
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'tahunan' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Data Tahunan
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
                {activeTab === 'tahunan' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                      <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">Semua Tahun</option>
                        {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Modul</label>
                      <select value={filterModul} onChange={(e) => setFilterModul(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                        <option value="">Semua Modul</option>
                        {modulOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isFormOpen && !isTahunanFormOpen && !isSelectTypeModalOpen && (
            activeTab === 'tahunan' ? (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DataTable
                  data={filteredDataTahunan}
                  columns={[
                    {
                      header: 'Status',
                      accessorKey: 'status',
                      cell: info => {
                        const row = info.row.original;
                        const contextFields = [
                          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
                          { label: 'Modul', value: row.modul_id },
                          { label: 'Tahun', value: row.tahun }
                        ];
                        return (
                          <StatusBadge
                            row={row}
                            onEdit={() => {
                              setEditingData(row);
                              setIsTahunanFormOpen(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            contextFields={contextFields}
                          />
                        );
                      }
                    },
                    { header: 'Tahun', accessorKey: 'tahun' },
                    { header: 'Kabupaten/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-medium text-foreground">{info.getValue()}</p> },
                    { header: 'Modul', accessorKey: 'modul_id' },
                    { header: 'Terakhir Diubah', accessorKey: 'updated_at', cell: info => new Date(info.getValue()).toLocaleDateString('id-ID') }
                  ]}
                  onEdit={(row) => {
                    setEditingData(row);
                    setIsTahunanFormOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDeleteTahunan}
                  onApprove={handleApproveTahunan}
                  onReject={handleRejectTahunan}
                  onBatchApprove={handleBatchApproveTahunan}
                  onBatchReject={handleBatchRejectTahunan}
                  onBatchDelete={handleBatchDeleteTahunan}
                  exportName={`Data_Tahunan_Budidaya_${new Date().toISOString().split('T')[0]}`}
                  customExportButton={
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Ekspor Ringkasan
                    </button>
                  }
                  searchable={true}
                  searchField="kabupaten_kota"
                  renderSubComponent={({ row }) => {
                    const data = row.original.data || {};
                    const formatVal = (val) => {
                      if (val === null || val === undefined || val === '') return '-';
                      if (typeof val === 'number') return val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
                      if (!isNaN(parseFloat(val)) && isFinite(val) && !val.toString().includes('Dummy')) return parseFloat(val).toLocaleString('id-ID', { maximumFractionDigits: 2 });
                      return val;
                    };

                    if (data.items && Array.isArray(data.items)) {
                      return (
                        <div className="p-6 bg-muted/30 border-t border-border">
                          <h4 className="text-sm font-semibold text-primary mb-4">Detail Data Modul: {row.original.modul_id} (Unit Berulang)</h4>
                          <div className="space-y-6">
                            {data.items.map((item, idx) => (
                              <div key={idx} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                                <h5 className="font-medium text-foreground mb-3 text-sm border-b border-border pb-2">Unit {idx + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {Object.keys(item).filter(k => k !== 'id').map(sectionTitle => (
                                    <div key={sectionTitle} className="space-y-2">
                                      <h6 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{sectionTitle.replace(/^(MODUL\s*\d+\s*:\s*|Seksi\s*\d+\s*:\s*)/i, '').replace(/\s*[-—]\s*dalam\s+(.+)$/i, ' ($1)')}</h6>
                                      <div className="space-y-3">
                                        {Object.entries(item[sectionTitle] || {}).map(([key, val]) => (
                                          <div key={key}>
                                            <span className="text-[11px] text-muted-foreground block mb-0.5">{key}</span>
                                            <span className="text-sm font-medium text-foreground">{formatVal(val)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-6 bg-muted/30 border-t border-border">
                        <h4 className="text-sm font-semibold text-primary mb-4">Detail Data Modul: {row.original.modul_id}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.keys(data).map(sectionTitle => (
                            <div key={sectionTitle} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                              <h6 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">{sectionTitle.replace(/^(MODUL\s*\d+\s*:\s*|Seksi\s*\d+\s*:\s*)/i, '').replace(/\s*[-—]\s*dalam\s+(.+)$/i, ' ($1)')}</h6>
                              <div className="space-y-3">
                                {Object.entries(data[sectionTitle] || {}).map(([key, val]) => (
                                  <div key={key}>
                                    <span className="text-[11px] text-muted-foreground block leading-tight mb-0.5">{key}</span>
                                    <span className="text-sm font-medium text-foreground">{formatVal(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            ) : activeTab === 'data' ? (
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
                    'Status': row.status || '-',
                    'Tahun': row.tahun || '-',
                    'Bulan': row.bulan || '-',
                    'Triwulan': row.triwulan || '-',
                    'Kabupaten/Kota': row.kabupaten_kota || '-',
                    'Kategori Komoditas': row.kategori_komoditas || '-',
                    'Komoditas': row.komoditas || '-',
                    'Jenis Wadah': row.jenis_wadah || '-',
                    'Produksi (KG)': row.produksi_kg || '-',
                    'Harga (Rp)': row.harga_rp || '-',
                    'Nilai Total (Rp)': row.nilai_rp || '-'
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
                        {computedStats.kpi.total_volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">KG</span>
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
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(computedStats.kpi.total_nilai)}
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
                  {activeTab !== 'tahunan' && (
                    <div className="mb-4">
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
                  )}
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
