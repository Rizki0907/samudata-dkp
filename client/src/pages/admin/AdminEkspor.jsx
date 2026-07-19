import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Globe, Box, Target, LineChart, TrendingUp, Filter } from 'lucide-react';
import api from '@/services/api';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EksporForm } from '@/components/admin/EksporForm';
import ReactECharts from 'echarts-for-react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const currentYear = new Date().getFullYear();

export default function AdminEkspor() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKomoditas, setFilterKomoditas] = useState('');
  const [filterNegara, setFilterNegara] = useState('');
  const [agregatFilter, setAgregatFilter] = useState('Segar dan Olahan');
  const [satuanFilter, setSatuanFilter] = useState('KG');
  const [mataUangFilter, setMataUangFilter] = useState('USD');

  const bulanOptions = useMemo(() => [...new Set(data.map(d => d.bulan))].filter(Boolean).sort(), [data]);
  const tahunOptions = useMemo(() => [...new Set(data.map(d => d.tahun))].filter(Boolean).sort(), [data]);
  const komoditasOptions = useMemo(() => [...new Set(data.map(d => d.nama_komoditas))].filter(Boolean).sort(), [data]);
  const negaraOptions = useMemo(() => [...new Set(data.map(d => d.negara_tujuan))].filter(Boolean).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterBulan && item.bulan !== filterBulan) return false;
      if (filterTahun && item.tahun !== filterTahun) return false;
      if (filterKomoditas && item.nama_komoditas !== filterKomoditas) return false;
      if (filterNegara && item.negara_tujuan !== filterNegara) return false;
      return true;
    });
  }, [data, filterBulan, filterTahun, filterKomoditas, filterNegara]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ekspor/admin');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
        await api.put(`/ekspor/${editingData.id}`, formData);
      } else {
        await api.post('/ekspor', formData);
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
    if (window.confirm(`Yakin ingin menghapus data ekspor eksportir ${row.nama_eksportir}?`)) {
      try {
        await api.delete(`/ekspor/${row.id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
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
      await api.put(`/ekspor/${row.id}/status`, { status: targetStatus });
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
      await api.put(`/ekspor/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
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
      await api.post(`/ekspor/batch-status`, { ids, status: targetStatus });
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
      await api.post(`/ekspor/batch-status`, { ids, status: 'REJECTED', alasan_penolakan: alasan });
      fetchData();
    } catch (error) {
      console.error('Error batch reject:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDelete = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data ini?`)) {
      try {
        await api.post(`/ekspor/batch-delete`, { ids });
        fetchData();
      } catch (error) {
        console.error('Error batch delete:', error);
        alert('Gagal menghapus data secara massal');
      }
    }
  };

  const computedStats = useMemo(() => {
    let total_volume = 0;
    let total_nilai = 0;
    
    const komoditasMap = {};
    const monthlyRaw = {};
    const monthlyAgg = {};
    const negaraMap = {};

    MONTHS.forEach(m => {
      monthlyAgg[m] = { 
        'Semua': { volume: 0, nilai_usd: 0 },
        'Segar dan Olahan': { volume: 0, nilai_usd: 0 },
        'Hidup': { volume: 0, nilai_usd: 0 },
        'Satuan': {}
      };
    });

    filteredData.forEach(item => {
      const vol = Number(item.volume) || 0;
      const nilai = mataUangFilter === 'RP' ? (Number(item.nilai_rp) || 0) : (Number(item.nilai_usd) || 0);
      
      total_volume += vol;
      total_nilai += nilai;

      const kat = item.kategori_komoditas || 'Lainnya';
      const kom = item.nama_komoditas || 'Lainnya';
      
      if (!komoditasMap[kat]) komoditasMap[kat] = {};
      if (!komoditasMap[kat][kom]) komoditasMap[kat][kom] = 0;
      komoditasMap[kat][kom] += nilai;

      const negara = item.negara_tujuan || 'Lainnya';
      if (!negaraMap[negara]) negaraMap[negara] = 0;
      negaraMap[negara] += nilai;

      if (item.bulan && MONTHS.includes(item.bulan)) {
        monthlyAgg[item.bulan]['Semua'].volume += vol;
        monthlyAgg[item.bulan]['Semua'].nilai_usd += nilai;

        if (kat === 'Segar dan Olahan' || kat === 'Hidup') {
          monthlyAgg[item.bulan][kat].volume += vol;
          monthlyAgg[item.bulan][kat].nilai_usd += nilai;

          const satuan = (item.satuan_volume || '').toUpperCase();
          if (satuan) {
             if (!monthlyAgg[item.bulan]['Satuan'][kat]) monthlyAgg[item.bulan]['Satuan'][kat] = {};
             if (!monthlyAgg[item.bulan]['Satuan'][kat][satuan]) monthlyAgg[item.bulan]['Satuan'][kat][satuan] = { volume: 0, nilai_usd: 0 };
             monthlyAgg[item.bulan]['Satuan'][kat][satuan].volume += vol;
             monthlyAgg[item.bulan]['Satuan'][kat][satuan].nilai_usd += nilai;
          }
        }

        if (!monthlyRaw[item.bulan]) monthlyRaw[item.bulan] = {};
        if (!monthlyRaw[item.bulan][kom]) monthlyRaw[item.bulan][kom] = 0;
        monthlyRaw[item.bulan][kom] += nilai;
      }
    });

    const treemap = [];
    Object.keys(komoditasMap).forEach(kat => {
      Object.keys(komoditasMap[kat]).forEach(kom => {
        treemap.push({
          kategori_komoditas: kat,
          nama_komoditas: kom,
          _sum: { nilai_usd: komoditasMap[kat][kom] }
        });
      });
    });

    const komoditasFlat = {};
    treemap.forEach(t => {
      if (!komoditasFlat[t.nama_komoditas]) komoditasFlat[t.nama_komoditas] = 0;
      komoditasFlat[t.nama_komoditas] += t._sum.nilai_usd;
    });

    const ranking_komoditas = Object.keys(komoditasFlat).map(kom => ({
      nama_komoditas: kom,
      _sum: { nilai_usd: komoditasFlat[kom] }
    })).sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd);

    const top5_names = ranking_komoditas.slice(0, 5).map(k => k.nama_komoditas);

    const negara_tujuan = Object.keys(negaraMap).map(n => ({
      negara_tujuan: n,
      _sum: { nilai_usd: negaraMap[n] }
    })).sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd);

    const monthly_aggregate = MONTHS.map(m => ({
      bulan: m,
      _sum: { volume: monthlyAgg[m]['Semua'].volume, nilai_usd: monthlyAgg[m]['Semua'].nilai_usd }
    }));

    const monthly_data_raw = [];
    Object.keys(monthlyRaw).forEach(m => {
      Object.keys(monthlyRaw[m]).forEach(kom => {
        monthly_data_raw.push({
          bulan: m,
          nama_komoditas: kom,
          _sum: { nilai_usd: monthlyRaw[m][kom] }
        });
      });
    });

    return {
      kpi: { total_volume, total_nilai },
      treemap,
      top5_names,
      monthly_data_raw,
      monthly_aggregate,
      monthlyAgg,
      ranking_komoditas,
      negara_tujuan,
      mataUangPrefix: mataUangFilter === 'RP' ? 'Rp' : '$'
    };
  }, [filteredData, mataUangFilter]);

  const treemapOption = useMemo(() => {
    const blueGradient = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    const greenGradient = ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

    const segarOlahan = computedStats.treemap
      .filter(t => t.kategori_komoditas === 'Segar dan Olahan')
      .sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd)
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum.nilai_usd,
        itemStyle: { color: blueGradient[index % blueGradient.length] }
      }));

    const hidup = computedStats.treemap
      .filter(t => t.kategori_komoditas === 'Hidup')
      .sort((a, b) => b._sum.nilai_usd - a._sum.nilai_usd)
      .map((t, index) => ({
        name: t.nama_komoditas,
        value: t._sum.nilai_usd,
        itemStyle: { color: greenGradient[index % greenGradient.length] }
      }));

    return {
      tooltip: {
        formatter: (info) => {
          const value = info.value;
          const treePath = info.treePathInfo;
          if (!treePath || treePath.length <= 1) return '';
          const pathStr = treePath.map(t => t.name).slice(1).join(' - ');
          const prefix = computedStats.mataUangPrefix;
          return `<b>${pathStr}</b><br/>Nilai: ${prefix}${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      series: [{
        type: 'treemap',
        roam: false,
        top: '2%', bottom: '10%', left: '0%', right: '0%',
        label: { show: true, formatter: '{b}', color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
        breadcrumb: { show: true, bottom: '2%', itemStyle: { color: '#f1f5f9', textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' } }, textStyle: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' } },
        itemStyle: { borderColor: '#0f172a' },
        levels: [
          { itemStyle: { borderWidth: 0, gapWidth: 2 } },
          { itemStyle: { borderWidth: 2, gapWidth: 1, borderColorSaturation: 0.55 } }
        ],
        data: [
          { name: 'Segar dan Olahan', itemStyle: { color: 'transparent' }, children: segarOlahan },
          { name: 'Hidup', itemStyle: { color: 'transparent' }, children: hidup }
        ]
      }],
      tooltip: {
        formatter: function (info) {
          return info.name + '<br/>' + (info.value ? Number(info.value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0');
        }
      }
    };
  }, [computedStats.treemap]);

  const lineChartOption = useMemo(() => {
    const { top5_names, monthly_data_raw } = computedStats;
    const monthlyMap = {};
    MONTHS.forEach(m => {
      monthlyMap[m] = { 'Lainnya': 0 };
      top5_names.forEach(name => monthlyMap[m][name] = 0);
    });

    monthly_data_raw.forEach(item => {
      if (monthlyMap[item.bulan]) {
        if (top5_names.includes(item.nama_komoditas)) {
          monthlyMap[item.bulan][item.nama_komoditas] += item._sum.nilai_usd || 0;
        } else {
          monthlyMap[item.bulan]['Lainnya'] += item._sum.nilai_usd || 0;
        }
      }
    });

    const series = [];
    const legendData = [...top5_names, 'Lainnya'];
    legendData.forEach(name => {
      series.push({
        name: name,
        type: 'line',
        smooth: true,
        data: MONTHS.map(m => monthlyMap[m][name] || 0)
      });
    });

    return {
      tooltip: { trigger: 'axis', valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: legendData, bottom: 0, textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: MONTHS, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } },
      yAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
      series
    };
  }, [computedStats, mataUangFilter]);

  const groupedBarOption = useMemo(() => {
    const formatSatuan = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const volumeLabel = `Volume (${formatSatuan(satuanFilter)})`;

    const volumeData = MONTHS.map(m => {
      return computedStats.monthlyAgg[m]?.['Satuan']?.[agregatFilter]?.[satuanFilter]?.volume || 0;
    });
    const valueData = MONTHS.map(m => {
      return computedStats.monthlyAgg[m]?.['Satuan']?.[agregatFilter]?.[satuanFilter]?.nilai_usd || 0;
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      legend: { data: [volumeLabel, `Nilai (${mataUangFilter})`], top: 0, right: '4%', textStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' } },
      grid: { left: '6%', right: '4%', top: '15%', bottom: '2%', containLabel: true },
      xAxis: [{ type: 'category', data: MONTHS, axisPointer: { type: 'shadow' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500' } }],
      yAxis: [
        { type: 'value', name: volumeLabel, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500', align: 'left', padding: [0, 0, 0, 10] }, axisLabel: { formatter: '{value}', color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { lineStyle: { color: '#334155' } } },
        { type: 'value', name: `Nilai (${computedStats.mataUangPrefix})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { formatter: `${computedStats.mataUangPrefix}{value}`, color: '#f8fafc', fontSize: 12, fontWeight: '500' }, splitLine: { show: false } }
      ],
      series: [
        { name: volumeLabel, type: 'bar', itemStyle: { color: '#8b5cf6' }, data: volumeData },
        { name: `Nilai (${mataUangFilter})`, type: 'bar', yAxisIndex: 1, itemStyle: { color: '#f59e0b' }, data: valueData }
      ]
    };
  }, [computedStats.monthlyAgg, agregatFilter, satuanFilter, mataUangFilter, computedStats.mataUangPrefix]);

  const rankingOption = useMemo(() => {
    const sorted = [...computedStats.ranking_komoditas]
      .sort((a, b) => a._sum.nilai_usd - b._sum.nilai_usd)
      .slice(-10);
    const categories = sorted.map(i => i.nama_komoditas);
    const values = sorted.map(i => i._sum.nilai_usd);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${computedStats.mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${computedStats.mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${computedStats.mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${computedStats.mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', interval: 0, width: 100, overflow: 'truncate' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          data: values,
          itemStyle: { color: '#ec4899', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${computedStats.mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${computedStats.mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${computedStats.mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${computedStats.mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  }, [computedStats.ranking_komoditas, mataUangFilter, computedStats.mataUangPrefix]);

  const negaraOption = useMemo(() => {
    const sorted = [...computedStats.negara_tujuan]
      .sort((a, b) => a._sum.nilai_usd - b._sum.nilai_usd)
      .slice(-10);
    const categories = sorted.map(i => i.negara_tujuan);
    const values = sorted.map(i => i._sum.nilai_usd);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => value ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0' },
      grid: { left: '3%', right: '20%', bottom: '8%', top: '2%', containLabel: true },
      xAxis: { type: 'value', name: `Nilai (${mataUangFilter})`, nameTextStyle: { color: '#f8fafc', fontSize: 13, fontWeight: '500' }, axisLabel: { color: '#f8fafc', fontSize: 12, fontWeight: '500', formatter: (val) => {
        if (val >= 1000000000) return `${computedStats.mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
        if (val >= 1000000) return `${computedStats.mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
        if (val >= 1000) return `${computedStats.mataUangPrefix}${(val / 1000).toFixed(1)}k`;
        return `${computedStats.mataUangPrefix}${val}`;
      } }, splitLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'category', data: categories, axisLabel: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', interval: 0, width: 100, overflow: 'truncate' } },
      series: [
        {
          name: 'Nilai',
          type: 'bar',
          barWidth: '60%',
          data: values,
          itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: '#ffffff', fontSize: 13, fontWeight: 'bold', formatter: (params) => {
            const val = params.value;
            if (val >= 1000000000) return `${computedStats.mataUangPrefix}${(val / 1000000000).toFixed(1)}b`;
            if (val >= 1000000) return `${computedStats.mataUangPrefix}${(val / 1000000).toFixed(1)}m`;
            if (val >= 1000) return `${computedStats.mataUangPrefix}${(val / 1000).toFixed(1)}k`;
            return `${computedStats.mataUangPrefix}${val}`;
          }}
        }
      ]
    };
  }, [computedStats.negara_tujuan, mataUangFilter, computedStats.mataUangPrefix]);

  const columns = useMemo(() => [
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const row = info.row.original;
        
        const contextFields = [
          { label: 'UPI / Eksportir', value: row.upi_eksportir },
          { label: 'Komoditas', value: row.nama_komoditas },
          { label: 'Negara Tujuan', value: row.negara_tujuan },
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
    {
      header: 'Bulan',
      accessorKey: 'bulan'
    },
    {
      header: 'Tahun',
      accessorKey: 'tahun'
    },
    {
      header: 'Kategori Komoditas',
      accessorKey: 'kategori_komoditas',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'Nama Komoditas',
      accessorKey: 'nama_komoditas'
    },
    {
      header: 'Volume',
      accessorKey: 'volume',
      cell: info => info.getValue().toLocaleString('id-ID')
    },
    {
      header: 'Satuan Volume',
      accessorKey: 'satuan_volume'
    },
    {
      header: 'Nilai (USD)',
      accessorKey: 'nilai_usd',
      cell: info => `$${(info.getValue() || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    },
    {
      header: 'Nilai (Rp)',
      accessorKey: 'nilai_rp',
      cell: info => `Rp ${(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
    },
    {
      header: 'Negara Tujuan',
      accessorKey: 'negara_tujuan'
    }
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Data Ekspor</h1>
          <p className="text-muted-foreground mt-1">Input laporan ekspor hasil kelautan dan perikanan.</p>
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
          <EksporForm
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Tahun</option>
                  {tahunOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Komoditas</label>
                <select value={filterKomoditas} onChange={(e) => setFilterKomoditas(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Komoditas</option>
                  {komoditasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Negara Tujuan</label>
                <select value={filterNegara} onChange={(e) => setFilterNegara(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Semua Negara Tujuan</option>
                  {negaraOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mata Uang (Chart)</label>
                <select value={mataUangFilter} onChange={(e) => setMataUangFilter(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="USD">USD ($)</option>
                  <option value="RP">Rupiah (Rp)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isFormOpen && (
        activeTab === 'data' ? (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
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
              exportName={`Ekspor_Samudera_${new Date().toISOString().split('T')[0]}`}
              formatExportData={(exportData) => exportData.map(row => ({
                'Bulan': row.bulan || '-',
                'Tahun': row.tahun || '-',
                'Kategori Komoditas': row.kategori_komoditas || '-',
                'Nama Komoditas': row.nama_komoditas || '-',
                'Volume': row.volume || '-',
                'Satuan Volume': row.satuan_volume || '-',
                'Nilai (USD)': row.nilai_usd || '-',
                'Nilai (Rp)': row.nilai_rp || '-',
                'Negara Tujuan': row.negara_tujuan || '-'
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
                    {computedStats.kpi.total_volume.toLocaleString('id-ID')} <span className="text-sm font-normal text-muted-foreground">Kg/PCS</span>
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Nilai Ekspor</p>
                  <p className="text-2xl font-bold text-foreground">
                    {computedStats.mataUangPrefix}{computedStats.kpi.total_nilai.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-4 bg-orange-500/10 rounded-xl text-orange-500">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Negara Tujuan</p>
                  <p className="text-2xl font-bold text-foreground break-words line-clamp-2">
                    {computedStats.negara_tujuan && computedStats.negara_tujuan.length > 0 ? computedStats.negara_tujuan[0].negara_tujuan : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-foreground">Komposisi Nilai Ekspor per Komoditas</h3>
                </div>
                <ReactECharts option={treemapOption} style={{ height: '500px', width: '100%' }} />
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-pink-500" />
                  <h3 className="text-lg font-semibold text-foreground">Ranking Komoditas Berdasarkan Nilai</h3>
                </div>
                <ReactECharts option={rankingOption} style={{ height: '500px', width: '100%' }} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-semibold text-foreground">Top 5 Komoditas Dengan Tren Nilai Ekspor Bulanan</h3>
              </div>
              <ReactECharts option={lineChartOption} style={{ height: '450px', width: '100%' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-foreground">Agregat Nilai dan Volume</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={agregatFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAgregatFilter(val);
                        setSatuanFilter(val === 'Segar dan Olahan' ? 'KG' : 'PCS');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Segar dan Olahan">Segar & Olahan</option>
                      <option value="Hidup">Hidup</option>
                    </select>
                    {agregatFilter === 'Segar dan Olahan' && (
                      <select
                        value={satuanFilter}
                        onChange={(e) => setSatuanFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="KG">KG</option>
                        <option value="LITER">Liter</option>
                      </select>
                    )}
                    {agregatFilter === 'Hidup' && (
                      <select
                        value={satuanFilter}
                        onChange={(e) => setSatuanFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="PCS">PCS</option>
                        <option value="EKOR">Ekor</option>
                        <option value="BATANG">Batang</option>
                      </select>
                    )}
                  </div>
                </div>
                <ReactECharts option={groupedBarOption} style={{ height: '500px', width: '100%' }} />
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-teal-500" />
                  <h3 className="text-lg font-semibold text-foreground">Ranking Negara Tujuan</h3>
                </div>
                <ReactECharts option={negaraOption} style={{ height: '500px', width: '100%' }} />
              </div>
            </div>
          </div>
        )
      )}
      </>
      )}
    </div>
  );
}
