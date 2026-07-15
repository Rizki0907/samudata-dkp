import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Loader2, Map, Waves, TreePine, Trash2, X, FlaskConical, Layers,
  BarChart3, CheckCircle, XCircle, FileSpreadsheet, Leaf, Anchor, Globe,
  TableProperties, LineChart as LineChartIcon, Fish, MapPin, Info, Filter, Landmark,
  ChevronRight, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import ReactECharts from 'echarts-for-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { KelautanPesisirForm } from '@/components/admin/KelautanPesisirForm';
import { PotensiPerairanForm } from '@/components/admin/PotensiPerairanForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';

// ── KONSTANTA ───────────────────────────────────────────────────────────────────
const NAMA_BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const formatBulan = (val) => {
  if (!val && val !== 0) return '-';
  
  // Jika val sudah berupa huruf (contoh: "Januari"), langsung kembalikan
  if (typeof val === 'string' && isNaN(val)) {
    return val.trim();
  }
  
  // Paksa ubah format apapun (1, "1", atau "01") menjadi angka murni
  const num = parseInt(val, 10);
  if (num >= 1 && num <= 12) {
    return NAMA_BULAN_LIST[num - 1];
  }
  
  return String(val);
};

const getTriwulan = (bulan) => {
  const b = bulan?.toLowerCase() ?? '';
  if (['januari','februari','maret'].includes(b)) return 'TW 1';
  if (['april','mei','juni'].includes(b)) return 'TW 2';
  if (['juli','agustus','september'].includes(b)) return 'TW 3';
  if (['oktober','november','desember'].includes(b)) return 'TW 4';
  return '-';
};

// ── SHARED COMPONENTS ───────────────────────────────────────────────────────────


const TwBadge = ({ tw }) => {
  const colorMap = {
    'TW 1': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'TW 2': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'TW 3': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'TW 4': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[tw] ?? 'bg-muted text-muted-foreground border-border';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{tw ?? '-'}</span>;
};

// ── EXCEL EXPORT HELPERS (SMART LOGIC) ────────────────────────────────────────────────────────
const borderThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
const cellStyle = (opts = {}) => ({
  font: { bold: opts.bold ?? false, sz: opts.sz ?? 11, color: opts.fontColor ? { rgb: opts.fontColor } : undefined },
  alignment: { horizontal: opts.align ?? 'center', vertical: 'center', wrapText: true },
  border: borderThin,
  fill: opts.fill ? { fgColor: { rgb: opts.fill } } : undefined,
});

const exportGaramExcelPintar = (data, filterTahun, filterTw, filterBulan, filterKab) => {
  const wb = XLSX.utils.book_new();
  const currentYear = filterTahun || new Date().getFullYear();
  const title = `DATA PRODUKSI GARAM RAKYAT JAWA TIMUR TAHUN ${currentYear}`;

  // KASUS 1: User filter Kab/Kota -> Baris excel berubah jadi daftar Bulan
  if (filterKab && !filterBulan && !filterTw) {
    const ws = buildGaramSheet(data, title, `KABUPATEN/KOTA: ${filterKab.toUpperCase()}`, 'bulan');
    XLSX.utils.book_append_sheet(wb, ws, filterKab.substring(0, 30));
    XLSX.writeFile(wb, `Data_Garam_${filterKab}_${currentYear}.xlsx`);
    return;
  }

  // KASUS 2: User filter Bulan tertentu (Contoh: Januari) -> Bikin 1 Sheet saja
  if (filterBulan) {
    const ws = buildGaramSheet(data, title, `BULAN: ${filterBulan.toUpperCase()}`, 'kabupaten');
    XLSX.utils.book_append_sheet(wb, ws, filterBulan.substring(0, 3));
    XLSX.writeFile(wb, `Data_Garam_${filterBulan}_${currentYear}.xlsx`);
    return;
  }

  // KASUS 3: User filter Triwulan (TW 1) -> Bikin 3 Sheet Bulan + 1 Sheet Rekap
    if (filterTw) {
      let bulanList = [];
      if (filterTw === 'TW 1') bulanList = ['Januari', 'Februari', 'Maret'];
      if (filterTw === 'TW 2') bulanList = ['April', 'Mei', 'Juni'];
      if (filterTw === 'TW 3') bulanList = ['Juli', 'Agustus', 'September'];
      if (filterTw === 'TW 4') bulanList = ['Oktober', 'November', 'Desember'];

      bulanList.forEach(bln => {
        // PERBAIKAN: Format angka bulan jadi teks dulu sebelum difilter
        const dataBulan = data.filter(d => formatBulan(d.bulan).toLowerCase() === bln.toLowerCase());
        const ws = buildGaramSheet(dataBulan, title, `BULAN: ${bln.toUpperCase()}`, 'kabupaten');
        XLSX.utils.book_append_sheet(wb, ws, bln.substring(0, 3));
      });
      
      const wsRekap = buildGaramSheet(data, title, `REKAPITULASI ${filterTw}`, 'kabupaten');
      XLSX.utils.book_append_sheet(wb, wsRekap, `Rekap ${filterTw}`);
      XLSX.writeFile(wb, `Data_Garam_${filterTw}_${currentYear}.xlsx`);
      return;
    }

    // KASUS 4: Tanpa Filter Bulan/TW/Kab -> Export Tahunan (12 Sheet Bulan + 1 Rekap Tahun)
    const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    NAMA_BULAN.forEach(bln => {
      // PERBAIKAN: Format angka bulan jadi teks dulu sebelum difilter
      const dataBulan = data.filter(d => formatBulan(d.bulan).toLowerCase() === bln.toLowerCase());
      const ws = buildGaramSheet(dataBulan, title, `BULAN: ${bln.toUpperCase()}`, 'kabupaten');
      XLSX.utils.book_append_sheet(wb, ws, bln.substring(0, 3));
    });

    const wsRekap = buildGaramSheet(data, title, `REKAPITULASI TAHUN ${currentYear}`, 'kabupaten');
    XLSX.utils.book_append_sheet(wb, wsRekap, `Rekap Tahun`);
    XLSX.writeFile(wb, `Data_Garam_Tahunan_${currentYear}.xlsx`);
  };

// Fungsi Builder (Bisa switch rowMode 'kabupaten' atau 'bulan')
const buildGaramSheet = (dataRowsRaw, title, subtitle, rowMode = 'kabupaten') => {
  const h1 = ['No', rowMode === 'kabupaten' ? 'Kab/Kota' : 'Bulan', 'L Total (Ha)', 'L Prod (Ha)', 'Σ Pok', 'Σ Petambak',
    'Produksi (Ton)', '', '', 'Σ Prod (Ton)', 'Prodtv',
    'Stok (Ton)', '', '', 'Σ Stok',
    'Harga (Rp)', '', '', 'Nilai Produksi', '', ''];
  const h2 = ['', '', '', '', '', '', 'K1', 'K2', 'K3', '', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', 'K1', 'K2', 'K3'];

  let totalProduksi = 0, totalStok = 0, totalLuas = 0, totalLProd = 0, totalPok = 0, totalPetambak = 0;
  let totalNilaiK1 = 0, totalNilaiK2 = 0, totalNilaiK3 = 0, sumHargaK1 = 0, sumHargaK2 = 0, sumHargaK3 = 0, countHargaK1 = 0, countHargaK2 = 0, countHargaK3 = 0;

  const aggData = {};
  dataRowsRaw.forEach(row => {
    const key = rowMode === 'kabupaten' ? row.kabupaten_kota : formatBulan(row.bulan);
    if (!key) return;

    if (!aggData[key]) {
      aggData[key] = { nama_baris: key, produksi_k1_ton: 0, produksi_k2_ton: 0, produksi_k3_ton: 0, stok_k1_ton: 0, stok_k2_ton: 0, stok_k3_ton: 0, total_produksi_ton: 0, total_stok_ton: 0, luas_total_ha: 0, luas_produksi_ha: 0, jumlah_kelompok: 0, jumlah_petambak: 0, harga_k1_rp: 0, harga_k2_rp: 0, harga_k3_rp: 0 };
    }
    
    const target = aggData[key];
    target.produksi_k1_ton += row.produksi_k1_ton || 0; target.produksi_k2_ton += row.produksi_k2_ton || 0; target.produksi_k3_ton += row.produksi_k3_ton || 0; target.total_produksi_ton += row.total_produksi_ton || 0;
    target.stok_k1_ton += row.stok_k1_ton || 0; target.stok_k2_ton += row.stok_k2_ton || 0; target.stok_k3_ton += row.stok_k3_ton || 0; target.total_stok_ton += row.total_stok_ton || 0;

    target.luas_total_ha = Math.max(target.luas_total_ha, row.luas_total_ha || 0);
    target.luas_produksi_ha = Math.max(target.luas_produksi_ha, row.luas_produksi_ha || 0);
    target.jumlah_kelompok = Math.max(target.jumlah_kelompok, row.jumlah_kelompok || 0);
    target.jumlah_petambak = Math.max(target.jumlah_petambak, row.jumlah_petambak || 0);

    if (row.harga_k1_rp > 0) target.harga_k1_rp = target.harga_k1_rp === 0 ? row.harga_k1_rp : (target.harga_k1_rp + row.harga_k1_rp) / 2;
    if (row.harga_k2_rp > 0) target.harga_k2_rp = target.harga_k2_rp === 0 ? row.harga_k2_rp : (target.harga_k2_rp + row.harga_k2_rp) / 2;
    if (row.harga_k3_rp > 0) target.harga_k3_rp = target.harga_k3_rp === 0 ? row.harga_k3_rp : (target.harga_k3_rp + row.harga_k3_rp) / 2;
  });

  const dataRows = Object.values(aggData).map((row, i) => {
    totalProduksi += row.total_produksi_ton; totalStok += row.total_stok_ton; totalLuas += row.luas_total_ha; totalLProd += row.luas_produksi_ha; totalPok += row.jumlah_kelompok; totalPetambak += row.jumlah_petambak;
    const nk1 = row.produksi_k1_ton * row.harga_k1_rp; const nk2 = row.produksi_k2_ton * row.harga_k2_rp; const nk3 = row.produksi_k3_ton * row.harga_k3_rp;
    totalNilaiK1 += nk1; totalNilaiK2 += nk2; totalNilaiK3 += nk3;
    if (row.harga_k1_rp > 0) { sumHargaK1 += row.harga_k1_rp; countHargaK1++; }
    if (row.harga_k2_rp > 0) { sumHargaK2 += row.harga_k2_rp; countHargaK2++; }
    if (row.harga_k3_rp > 0) { sumHargaK3 += row.harga_k3_rp; countHargaK3++; }

    const prod = row.luas_produksi_ha > 0 ? row.total_produksi_ton / row.luas_produksi_ha : 0;
    return [ i + 1, row.nama_baris, row.luas_total_ha.toLocaleString('id-ID'), row.luas_produksi_ha.toLocaleString('id-ID'), row.jumlah_kelompok, row.jumlah_petambak,
      row.produksi_k1_ton.toLocaleString('id-ID'), row.produksi_k2_ton.toLocaleString('id-ID'), row.produksi_k3_ton.toLocaleString('id-ID'), row.total_produksi_ton.toLocaleString('id-ID'), prod.toLocaleString('id-ID', { maximumFractionDigits: 3 }),
      row.stok_k1_ton.toLocaleString('id-ID'), row.stok_k2_ton.toLocaleString('id-ID'), row.stok_k3_ton.toLocaleString('id-ID'), row.total_stok_ton.toLocaleString('id-ID'),
      row.harga_k1_rp.toLocaleString('id-ID'), row.harga_k2_rp.toLocaleString('id-ID'), row.harga_k3_rp.toLocaleString('id-ID'), nk1.toLocaleString('id-ID'), nk2.toLocaleString('id-ID'), nk3.toLocaleString('id-ID')
    ];
  });

  const avgK1 = countHargaK1 > 0 ? (sumHargaK1 / countHargaK1).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK2 = countHargaK2 > 0 ? (sumHargaK2 / countHargaK2).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK3 = countHargaK3 > 0 ? (sumHargaK3 / countHargaK3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';

  const totalRow = [ 'TOTAL', '', totalLuas.toLocaleString('id-ID'), totalLProd.toLocaleString('id-ID'), totalPok, totalPetambak, '', '', '', totalProduksi.toLocaleString('id-ID', { maximumFractionDigits: 2 }), '', '', '', '', totalStok.toLocaleString('id-ID', { maximumFractionDigits: 2 }), avgK1, avgK2, avgK3, totalNilaiK1.toLocaleString('id-ID'), totalNilaiK2.toLocaleString('id-ID'), totalNilaiK3.toLocaleString('id-ID') ];
  
  const ws = XLSX.utils.aoa_to_sheet([[title], [subtitle], [], h1, h2, ...dataRows, totalRow]);
  // (Bagian styling layout di bawah ini tetap sama persis seperti kode aslimu)
  const refTitle = XLSX.utils.encode_cell({ c: 0, r: 0 }); ws[refTitle].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  const refSub = XLSX.utils.encode_cell({ c: 0, r: 1 }); ws[refSub].s = { font: { bold: false, sz: 11 }, alignment: { horizontal: 'center' } };
  const hStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF', align: 'center' });
  const dataStyle = cellStyle({ align: 'center' }); const dataLeftStyle = cellStyle({ align: 'left' });
  const totalStyle = cellStyle({ bold: true, fill: 'D9E1F2', align: 'center' }); const totalSumStyle = cellStyle({ bold: true, fill: 'B4C6E7', align: 'center' });
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 }); const r4 = XLSX.utils.encode_cell({ c: C, r: 4 });
    if (!ws[r3]) ws[r3] = { t: 's', v: '' }; if (!ws[r4]) ws[r4] = { t: 's', v: '' }; ws[r3].s = hStyle; ws[r4].s = hStyle;
  }
  const totalRowIdx = 5 + dataRows.length;
  for (let R = 5; R < totalRowIdx; R++) { for (let C = range.s.c; C <= range.e.c; C++) { const ref = XLSX.utils.encode_cell({ c: C, r: R }); if (!ws[ref]) ws[ref] = { t: 's', v: '' }; ws[ref].s = C === 1 ? dataLeftStyle : dataStyle; } }
  for (let C = range.s.c; C <= range.e.c; C++) { const ref = XLSX.utils.encode_cell({ c: C, r: totalRowIdx }); if (!ws[ref]) ws[ref] = { t: 's', v: '' }; ws[ref].s = (C === 9 || C === 14) ? totalSumStyle : totalStyle; }
  ws['!merges'] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } }, { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }, { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }, { s: { r: 3, c: 6 }, e: { r: 3, c: 8 } }, { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } }, { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } }, { s: { r: 3, c: 11 }, e: { r: 3, c: 13 } }, { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } }, { s: { r: 3, c: 15 }, e: { r: 3, c: 17 } }, { s: { r: 3, c: 18 }, e: { r: 3, c: 20 } }, { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 5 } } ];
  ws['!cols'] = [ { wch: 5 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 } ];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 16 }, { hpt: 8 }, { hpt: 40 }, { hpt: 30 }];
  return ws;
};

const exportPotensiExcel = (data) => {
  const title = 'REKAPITULASI POTENSI PERAIRAN JAWA TIMUR';
  const h1 = ['No', 'Kab/Kota', 'Tahun', 'Luas Wilayah Laut (km²)',
    'Panjang Garis Pantai (km)', '', '', '', 'Total Pantai (km)',
    'Luas Perairan (km²)', 'Pulau Kecil', 'Berpenghuni', 'Tdk Berpenghuni',
    'Desa Pesisir', 'Konservasi (Ha)', 'Potensi (Ton/Th)', 'Keterangan'];
  const h2 = ['', '', '', '', 'Utara', 'Selatan', 'Timur', 'Barat', '', '', '', '', '', '', '', '', ''];
  const dataRows = data.map((row, i) => {
    const tp = (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) +
      (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0);
    return [i + 1, row.kabupaten_kota, row.tahun_data,
      row.luas_wilayah_laut_km2?.toLocaleString('id-ID') ?? 0,
      row.panjang_pantai_utara_km ?? 0, row.panjang_pantai_selatan_km ?? 0,
      row.panjang_pantai_timur_km ?? 0, row.panjang_pantai_barat_km ?? 0,
      tp.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
      row.luas_perairan_km2?.toLocaleString('id-ID') ?? 0,
      row.jumlah_pulau_kecil ?? 0, row.pulau_berpenghuni ?? 0, row.pulau_tidak_berpenghuni ?? 0,
      row.desa_pesisir ?? 0,
      row.luas_kawasan_konservasi_ha?.toLocaleString('id-ID') ?? 0,
      row.potensi_perikanan_ton_th?.toLocaleString('id-ID') ?? 0,
      row.keterangan ?? ''];
  });
  const aoa = [[title], [], h1, h2, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const hStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF' });
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws[XLSX.utils.encode_cell({ c: 0, r: 0 })].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r2 = XLSX.utils.encode_cell({ c: C, r: 2 });
    const r3 = XLSX.utils.encode_cell({ c: C, r: 3 });
    if (!ws[r2]) ws[r2] = { t: 's', v: '' };
    if (!ws[r3]) ws[r3] = { t: 's', v: '' };
    ws[r2].s = hStyle; ws[r3].s = hStyle;
  }
  for (let R = 4; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = cellStyle({ align: C <= 1 || C === 16 ? 'left' : 'center' });
    }
  }
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
    { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
    { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
    { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
    { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
    { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } },
    { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } },
    { s: { r: 2, c: 14 }, e: { r: 3, c: 14 } },
    { s: { r: 2, c: 15 }, e: { r: 3, c: 15 } },
    { s: { r: 2, c: 16 }, e: { r: 3, c: 16 } },
  ];
  ws['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Potensi_Perairan');
  XLSX.writeFile(wb, `Potensi_Perairan_Jatim_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ── CHART OPTION HELPERS ────────────────────────────────────────────────────────
const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#7fb5d5', fontFamily: 'inherit' },
};

// ── MARITIME COLOR PALETTE ──
const CHART_PALETTE = [
  '#0891b2', // cyan-600
  '#0d9488', // teal-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#db2777', // pink-600
  '#2563eb', // blue-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#dc2626', // red-600
];

const makeHBarOption = (title, categories, values, color = '#0891b2') => ({
  ...darkTheme,
  title: { text: title, textStyle: { color: '#c8dff0', fontSize: 13, fontWeight: 'bold' } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#0f2236', borderColor: '#1e3a52', textStyle: { color: '#c8dff0' } },
  grid: { left: 140, right: 30, top: 40, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#7fb5d5' }, splitLine: { lineStyle: { color: '#1e3a52' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#a3c7df', fontSize: 11, fontWeight: 500 }, axisTick: { show: false } },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 28 }],
});

const makePieOption = (title, data, nameField, valueField) => ({
  ...darkTheme,
  color: CHART_PALETTE,
  title: { text: title, textStyle: { color: '#c8dff0', fontSize: 13, fontWeight: 'bold' } },
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', backgroundColor: '#0f2236', borderColor: '#1e3a52', textStyle: { color: '#c8dff0' } },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 40, bottom: 20, textStyle: { color: '#a3c7df', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '55%'],
    data: data.map(d => ({ name: d[nameField], value: d[valueField] })).filter(d => d.value > 0),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' } }
  }]
});

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────────
const DATA_TABS = [
  { key: 'garam',            label: 'Data Garam',       icon: <Map className="w-4 h-4" /> },
  { key: 'mangrove',         label: 'Data Mangrove',    icon: <TreePine className="w-4 h-4" /> },
  { key: 'terumbu_karang',   label: 'Terumbu Karang',   icon: <Waves className="w-4 h-4" /> },
  { key: 'lamun',            label: 'Padang Lamun',     icon: <Leaf className="w-4 h-4" /> },
  { key: 'potensi_perairan', label: 'Potensi Perairan', icon: <Globe className="w-4 h-4" /> },
];

const MAIN_TABS = [
  { key: 'tabel', label: 'Tabel Data', icon: <TableProperties className="w-4 h-4" /> },
  { key: 'visualisasi', label: 'Visualisasi Statistik', icon: <LineChartIcon className="w-4 h-4" /> },
];

export default function AdminKelautanPesisir() {
  const { user } = useAuthStore();
  const [mainTab, setMainTab] = useState('tabel');
  const [activeTab, setActiveTab] = useState('garam');
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensiPerairan, setDataPotensiPerairan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters
  const [filterTahun, setFilterTahun] = useState('');
  const [filterTw, setFilterTw] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterKab, setFilterKab] = useState('');
  const [visGaramBulan, setVisGaramBulan] = useState('');
  const [visGaramTahun, setVisGaramTahun] = useState('');
  const [visGaramKab, setVisGaramKab] = useState('');

  // Fetch garam data
  const fetchGaram = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/garam');
      setDataGaram(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data garam:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch potensi perairan data
  const fetchPotensi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/potensi-perairan');
      setDataPotensiPerairan(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data potensi perairan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats for visualization
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/stats');
      setStatsData(res.data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGaram();
    fetchPotensi();
  }, [fetchGaram, fetchPotensi]);

  useEffect(() => {
    if (mainTab === 'visualisasi') fetchStats();
  }, [mainTab, fetchStats]);

  const handleCreateOrUpdate = async (formData) => {
    setSubmitLoading(true);
    try {
      if (activeTab === 'garam') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/garam/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/garam', formData);
        }
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/potensi-perairan/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/potensi-perairan', formData);
        }
        await fetchPotensi();
      }
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setSubmitLoading(false);
      setIsFormOpen(false);
      setEditingData(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (activeTab === 'garam') {
        await api.delete(`/kelautan-pesisir/garam/${itemToDelete.id}`);
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.delete(`/kelautan-pesisir/potensi-perairan/${itemToDelete.id}`);
        await fetchPotensi();
      }
    } catch (err) {
      console.error('Gagal menghapus data:', err);
      alert('Gagal menghapus data.');
    } finally {
      setItemToDelete(null);
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
      if (row.status === 'APPROVED' || row.status === 'VERIFIED') {
        alert('Data sudah divalidasi oleh Bidang sebelumnya!');
        return;
      }
      targetStatus = 'APPROVED'; // Approve Bidang -> APPROVED
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU_PESISIR_BIDANG';
    } else if (jenis === '2') {
      if (row.status === 'VERIFIED') {
        alert('Data sudah divalidasi oleh Program sebelumnya!');
        return;
      }
      targetStatus = 'VERIFIED'; // Approve Program -> VERIFIED
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC_PESISIR_PROGRAM';
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
      if (activeTab === 'garam') {
        await api.patch(`/kelautan-pesisir/garam/${row.id}/status`, { status: targetStatus, alasan_penolakan: null });
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.patch(`/kelautan-pesisir/potensi-perairan/${row.id}/status`, { status: targetStatus, alasan_penolakan: null });
        await fetchPotensi();
      }
    } catch (err) { 
      console.error(err);
      alert('Gagal menyetujui data.');
    }
  };

  const handleReject = async (row) => {
    const alasan = window.prompt('Masukkan alasan penolakan:');
    if (!alasan?.trim()) {
      alert('Alasan penolakan tidak boleh kosong.');
      return;
    }
    
    const confirmText = window.prompt('Ketik "TOLAK_PESISIR" (huruf kapital) untuk menyelesaikan penolakan:');
    if (confirmText !== 'TOLAK_PESISIR') {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    try {
      if (activeTab === 'garam') {
        await api.patch(`/kelautan-pesisir/garam/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.patch(`/kelautan-pesisir/potensi-perairan/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchPotensi();
      }
    } catch (err) { 
      console.error(err);
      alert('Gagal menolak data.');
    }
  };

  const handleExport = (data, type) => {
    if (activeTab === 'garam') {
      if (type === 'tahunan') {
        exportGaramExcelTahunan(data, filterTahun);
      } else {
        exportGaramExcel(data);
      }
    } else {
      exportPotensiExcel(data);
    }
  };

  // ── COLUMNS ─────────────────────────────────────────────────────────────────
  const columnsGaram = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => {
      const row = info.row.original;
      return <StatusBadge 
        row={row} 
        onEdit={() => setEditingGaram(row)} 
        contextFields={[
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Periode', value: `Tahun ${row.tahun} (Triwulan ${row.triwulan}, Bulan ${row.bulan})` }
        ]} 
      />;
    } },
    { header: 'Bulan', accessorKey: 'bulan', cell: info => <span className="text-foreground">{formatBulan(info.getValue())}</span> },
    { header: 'TW', accessorKey: 'triwulan', cell: info => <TwBadge tw={info.getValue()} /> },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="font-bold text-foreground bg-muted px-2.5 py-1 rounded-md text-xs">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'Total Produksi', accessorKey: 'total_produksi_ton', cell: info => <span className="font-bold text-emerald-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Total Stok', accessorKey: 'total_stok_ton', cell: info => <span className="font-bold text-amber-400">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Produktivitas', accessorKey: 'produktivitas', cell: info => <span className="text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md text-xs">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha</span> },
    { header: 'Terakhir Diperbarui', accessorKey: 'updated_at', cell: info => info.getValue() ? <span className="whitespace-nowrap text-sm text-muted-foreground">{formatDistanceToNow(new Date(info.getValue()), { addSuffix: true, locale: idLocale })}</span> : '-' },
  ], []);

  const columnsPotensi = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => {
      const row = info.row.original;
      return <StatusBadge 
        row={row} 
        onEdit={() => setEditingPotensi(row)} 
        contextFields={[
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Tahun', value: row.tahun_data }
        ]} 
      />;
    } },
    { header: 'Tahun', accessorKey: 'tahun_data', cell: info => <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-semibold">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="font-bold text-cyan-300">{info.getValue()}</p> },
    { header: 'L. Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => <span className="text-foreground font-medium">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> },
    {
      header: 'Total Pantai (km)', accessorKey: 'total_garis_pantai',
      accessorFn: row => (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) + (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0),
      cell: info => <span className="font-bold text-cyan-400">{info.getValue().toLocaleString('id-ID', { maximumFractionDigits: 2 })} km</span>
    },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil', cell: info => <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs">{info.getValue()} pulau</span> },
    { header: 'Desa Pesisir', accessorKey: 'desa_pesisir', cell: info => <span className="text-foreground">{info.getValue() || 0}</span> },
  ], []);

  // ── SUB-ROWS ─────────────────────────────────────────────────────────────────
  const renderSubGaram = ({ row }) => {
    const d = row.original;
    return (
      <div className="p-6 bg-background/70 border-l-4 border-cyan-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 pb-5 border-b border-border text-sm">
          {[
            { label: 'Luas Total', value: `${(d.luas_total_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-foreground', border: 'border-border' },
            { label: 'Luas Produksi', value: `${(d.luas_produksi_ha || 0).toLocaleString('id-ID')} Ha`, cls: 'text-foreground', border: 'border-border' },
            { label: 'Produktivitas Lahan', value: `${(d.produktivitas || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha`, cls: 'text-emerald-300', border: 'border-emerald-500/30' },
            { label: 'Jml Petambak', value: `${d.jumlah_petambak || 0} Org`, cls: 'text-foreground', border: 'border-border' },
          ].map(s => (
            <div key={s.label} className={`bg-card p-3.5 rounded-xl border ${s.border}`}>
              <span className="text-muted-foreground text-xs font-semibold block mb-1 uppercase tracking-wider">{s.label}</span>
              <span className={`font-bold text-xl ${s.cls}`}>{s.value}</span>
            </div>
          ))}
        </div>
        <h4 className="text-xs font-bold text-muted-foreground mb-4 tracking-widest uppercase flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" /> Rincian per Kualitas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'KUALITAS 1', badge: 'Tinggi', produksi: d.produksi_k1_ton, stok: d.stok_k1_ton, harga: d.harga_k1_rp, borderCls: 'border-cyan-500/20', accentCls: 'bg-cyan-500', headCls: 'text-cyan-300', badgeCls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { label: 'KUALITAS 2', badge: 'Menengah', produksi: d.produksi_k2_ton, stok: d.stok_k2_ton, harga: d.harga_k2_rp, borderCls: 'border-amber-500/20', accentCls: 'bg-amber-500', headCls: 'text-amber-300', badgeCls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'KUALITAS 3', badge: 'Rendah', produksi: d.produksi_k3_ton, stok: d.stok_k3_ton, harga: d.harga_k3_rp, borderCls: 'border-border', accentCls: 'bg-[#7fb5d5]/40', headCls: 'text-muted-foreground', badgeCls: 'text-muted-foreground bg-muted border-border' },
          ].map(k => (
            <div key={k.label} className={`bg-card p-4 rounded-xl border ${k.borderCls} relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${k.accentCls}`}></div>
              <h5 className={`font-bold ${k.headCls} mb-3 flex items-center justify-between`}>
                {k.label}
                <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${k.badgeCls}`}>{k.badge}</span>
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground"><span>Produksi:</span><span className="font-semibold text-foreground">{(k.produksi || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Stok:</span><span className="font-semibold text-foreground">{(k.stok || 0).toLocaleString('id-ID')} Ton</span></div>
                <div className="flex justify-between pt-2 border-t border-border mt-2"><span className="text-muted-foreground text-xs">Harga</span><span className="font-bold text-foreground">Rp {(k.harga || 0).toLocaleString('id-ID')}/kg</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground text-xs">Nilai Produksi</span><span className="font-bold text-foreground">{((k.produksi || 0) * (k.harga || 0)).toLocaleString('id-ID')}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-emerald-400/70 uppercase tracking-wider">Total Produksi</span>
            <span className="font-bold text-emerald-400">{(d.total_produksi_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
            <span className="text-xs text-amber-400/70 uppercase tracking-wider">Total Stok</span>
            <span className="font-bold text-amber-400">{(d.total_stok_ton || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span>
          </div>
        </div>
      </div>
    );
  };

  // ── VISUALISASI ──────────────────────────────────────────────────────────────
  const renderVisualisasi = () => {
    // ── KPI Potensi Perairan (only VERIFIED data) ──
    const verifiedPotensi = dataPotensiPerairan.filter(d => d.status === 'VERIFIED');
    const potensiPerKotaFrontend = Object.values(verifiedPotensi.reduce((agg, d) => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { ...d };
      else if ((d.tahun_data || 0) > (agg[kab].tahun_data || 0)) agg[kab] = { ...d };
      return agg;
    }, {}));

    const kpiPotensi = {
      pulau_kecil: potensiPerKotaFrontend.reduce((s, d) => s + (d.jumlah_pulau_kecil || 0), 0),
      garis_pantai: potensiPerKotaFrontend.reduce((s, d) => s + (d.panjang_pantai_utara_km || 0) + (d.panjang_pantai_selatan_km || 0) + (d.panjang_pantai_timur_km || 0) + (d.panjang_pantai_barat_km || 0), 0),
      luas_laut: potensiPerKotaFrontend.reduce((s, d) => s + (d.luas_wilayah_laut_km2 || 0), 0),
      desa_pesisir: potensiPerKotaFrontend.reduce((s, d) => s + (d.desa_pesisir || 0), 0),
    };

    // ── VISUALISASI GARAM (only VERIFIED data) ──
    const verifiedGaram = dataGaram.filter(d => d.status === 'VERIFIED');
    const filteredVisGaram = verifiedGaram.filter(d => 
      (!visGaramBulan || (d.bulan || '').toLowerCase() === visGaramBulan.toLowerCase()) &&
      (!visGaramTahun || String(d.tahun) === visGaramTahun) &&
      (!visGaramKab || d.kabupaten_kota === visGaramKab)
    );

    const visGaramPerKota = Object.values(filteredVisGaram.reduce((agg, d) => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, produksi: 0, kelompok: 0, luas_lahan: 0, petambak: 0 };
      agg[kab].produksi += (d.total_produksi_ton || 0);
      agg[kab].kelompok = Math.max(agg[kab].kelompok, d.jumlah_kelompok || 0);
      agg[kab].luas_lahan = Math.max(agg[kab].luas_lahan, d.luas_total_ha || 0);
      agg[kab].petambak = Math.max(agg[kab].petambak, d.jumlah_petambak || 0);
      return agg;
    }, {})).sort((a, b) => b.produksi - a.produksi);

    const kpiGaram = {
      produksi: visGaramPerKota.reduce((s, d) => s + d.produksi, 0),
      petambak: visGaramPerKota.reduce((s, d) => s + d.petambak, 0),
      lahan: visGaramPerKota.reduce((s, d) => s + d.luas_lahan, 0),
    };

    const garamKota = visGaramPerKota.map(d => d.name);
    const garamProduksi = visGaramPerKota.map(d => parseFloat(d.produksi.toFixed(2)));
    const garamKelompok = visGaramPerKota.map(d => d.kelompok);

    const bulanOptions = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tahunOptions = [...new Set(dataGaram.map(d => d.tahun).filter(Boolean))].sort((a, b) => b - a);
    const kabupatenOptions = [...new Set(dataGaram.map(d => d.kabupaten_kota).filter(Boolean))].sort();

    const numFmt = (v) => (Number(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

    return (
      <div className="space-y-8">
        {/* ── Potensi Perairan KPI (TOP) ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Anchor className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-foreground">Potensi Perairan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-orange-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-orange-400" /><p className="text-sm font-medium text-muted-foreground">Jml. Pulau-Pulau Kecil</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.pulau_kecil)} <span className="text-sm text-muted-foreground font-normal">Pulau</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-cyan-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><Waves className="w-5 h-5 text-cyan-400" /><p className="text-sm font-medium text-muted-foreground">Total Garis Pantai</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.garis_pantai)} <span className="text-sm text-muted-foreground font-normal">Km</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><Anchor className="w-5 h-5 text-blue-400" /><p className="text-sm font-medium text-muted-foreground">Luas Wilayah Laut</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.luas_laut)} <span className="text-sm text-muted-foreground font-normal">Km²</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-pink-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-pink-400" /><p className="text-sm font-medium text-muted-foreground">Jumlah Desa Pesisir</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.desa_pesisir)} <span className="text-sm text-muted-foreground font-normal">Desa</span></p>
            </div>
          </div>
        </div>

        {/* ── Visualisasi Garam ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-foreground">Visualisasi Produksi Garam</h2>
            </div>
            {/* Garam Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select value={visGaramTahun} onChange={(e) => setVisGaramTahun(e.target.value)} className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
                <option value="">Semua Tahun</option>
                {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={visGaramBulan} onChange={(e) => setVisGaramBulan(e.target.value)} className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
                <option value="">Semua Bulan</option>
                {bulanOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={visGaramKab} onChange={(e) => setVisGaramKab(e.target.value)} className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
                <option value="">Semua Kab/Kota</option>
                {kabupatenOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          
          {/* Garam KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-emerald-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><FlaskConical className="w-5 h-5 text-emerald-400" /><p className="text-sm font-medium text-muted-foreground">Total Produksi Garam</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.produksi)} <span className="text-sm text-muted-foreground font-normal">Ton</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-amber-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><Fish className="w-5 h-5 text-amber-400" /><p className="text-sm font-medium text-muted-foreground">Total Petambak Garam</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.petambak)} <span className="text-sm text-muted-foreground font-normal">Orang</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-2"><Landmark className="w-5 h-5 text-blue-400" /><p className="text-sm font-medium text-muted-foreground">Total Luas Lahan Tambak</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.lahan)} <span className="text-sm text-muted-foreground font-normal">Ha</span></p>
            </div>
          </div>

          {/* Garam Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Volume Produksi per Kab/Kota (Ton)</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makeHBarOption('Volume Produksi Garam', garamKota, garamProduksi, '#0891b2')} style={{ height: Math.max(300, garamKota.length * 38) + 'px' }} />
                : <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Kelompok per Kab/Kota</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makeHBarOption('Jumlah Kelompok Garam', garamKota, garamKelompok, '#7c3aed')} style={{ height: Math.max(300, garamKota.length * 38) + 'px' }} />
                : <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Luas Lahan per Kab/Kota</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makePieOption('Luas Lahan', visGaramPerKota, 'name', 'luas_lahan')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Jumlah Petambak per Kab/Kota</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makePieOption('Jumlah Petambak', visGaramPerKota, 'name', 'petambak')} style={{ height: '300px' }} />
                : <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
          </div>
        </div>

        {/* ── Placeholder Visualisasi Mangrove dkk ── */}
        <div className="bg-muted/50 border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center text-muted-foreground text-center">
          <Info className="w-8 h-8 mb-2 opacity-50" />
          <p className="font-medium text-foreground">Visualisasi Mangrove, Terumbu Karang, dan Lamun</p>
          <p className="text-sm">Segera hadir pada pembaruan berikutnya.</p>
        </div>
      </div>
    );
  };

  // ── ACTIVE DATA / COLUMNS / SUB-ROW ─────────────────────────────────────────
  const activeColumns = activeTab === 'garam' ? columnsGaram : columnsPotensi;
  const activeSubRow = activeTab === 'garam' ? renderSubGaram : undefined;

  const filteredData = useMemo(() => {
      let result = activeTab === 'garam' ? dataGaram : activeTab === 'potensi_perairan' ? dataPotensiPerairan : [];
      
      if (filterTahun) {
        result = result.filter(d => String(d.tahun || d.tahun_data) === filterTahun);
      }
      
      if (filterTw && activeTab === 'garam') {
        result = result.filter(d => {
          // Amankan segala bentuk data bulan (1, "01", atau "Januari")
          const bNum = parseInt(d.bulan, 10);
          const bStr = (formatBulan(d.bulan) || '').toLowerCase();
          
          let match = false;
          if (filterTw === 'TW 1') match = (bNum >= 1 && bNum <= 3) || ['januari','februari','maret'].includes(bStr);
          if (filterTw === 'TW 2') match = (bNum >= 4 && bNum <= 6) || ['april','mei','juni'].includes(bStr);
          if (filterTw === 'TW 3') match = (bNum >= 7 && bNum <= 9) || ['juli','agustus','september'].includes(bStr);
          if (filterTw === 'TW 4') match = (bNum >= 10 && bNum <= 12) || ['oktober','november','desember'].includes(bStr);
          
          return match || d.triwulan === filterTw;
        });
      }
      
      if (filterBulan && activeTab === 'garam') {
        result = result.filter(d => {
          return (formatBulan(d.bulan) || '').toLowerCase() === filterBulan.toLowerCase();
        });
      }
      
      if (filterKab) {
        result = result.filter(d => (d.kabupaten_kota || '').toLowerCase() === filterKab.toLowerCase());
      }
      
      return result;
    }, [activeTab, dataGaram, dataPotensiPerairan, filterTahun, filterTw, filterBulan, filterKab]);

  const handleCustomExport = (data) => {
      if (activeTab === 'garam') {
        // Panggil fungsi pintar yang baru, lempar semua status filternya!
        exportGaramExcelPintar(data, filterTahun, filterTw, filterBulan, filterKab);
      } else if (activeTab === 'potensi_perairan') {
        exportPotensiExcel(data);
      }
    };

  // ── FORM RENDERER ─────────────────────────────────────────────────────────────
  const renderForm = () => {
    if (activeTab === 'garam') {
      return (
        <KelautanPesisirForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    if (activeTab === 'potensi_perairan') {
      return (
        <PotensiPerairanForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    return (
      <div className="bg-card border border-border p-12 rounded-2xl text-center shadow-sm">
        <p className="text-muted-foreground text-sm">Form untuk {DATA_TABS.find(t => t.key === activeTab)?.label} sedang disiapkan.</p>
        <button onClick={() => setIsFormOpen(false)} className="mt-4 px-6 py-2 border border-border rounded-lg hover:bg-muted font-medium text-sm text-foreground transition-colors">Kembali</button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Kelautan Pesisir</h1>
          <p className="text-muted-foreground mt-1">Kelola laporan Garam, Mangrove, Terumbu Karang, Lamun, dan Potensi Perairan.</p>
        </div>
        {mainTab === 'tabel' && !isFormOpen && (activeTab === 'garam' || activeTab === 'potensi_perairan') && (
          <button
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Tambah {DATA_TABS.find(t => t.key === activeTab)?.label}
          </button>
        )}
      </div>

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-destructive"><Trash2 className="w-5 h-5" /><h3 className="text-lg font-bold">Konfirmasi Hapus</h3></div>
            <p className="text-muted-foreground text-sm mb-6">Yakin ingin menghapus data <strong className="text-foreground">{itemToDelete.kabupaten_kota}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg font-medium bg-muted text-muted-foreground hover:bg-muted/80 text-sm transition-colors">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Filter & Statistik */}
      {!isFormOpen && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-4 overflow-x-auto">
            {MAIN_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setMainTab(tab.key); setIsFormOpen(false); }}
                className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                  mainTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {mainTab === 'tabel' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori Data</label>
                <div className="flex flex-wrap gap-2">
                  {DATA_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                        activeTab === tab.key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {(activeTab === 'garam' || activeTab === 'potensi_perairan') && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                    <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Semua Tahun</option>
                      {[...new Set((activeTab === 'garam' ? dataGaram : dataPotensiPerairan).map(d => d.tahun || d.tahun_data))].filter(Boolean).sort().map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                    <select value={filterKab} onChange={e => setFilterKab(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Semua Kab/Kota</option>
                      {[...new Set((activeTab === 'garam' ? dataGaram : dataPotensiPerairan).map(d => d.kabupaten_kota))].filter(Boolean).sort().map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  {activeTab === 'garam' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Triwulan</label>
                        <select value={filterTw} onChange={e => setFilterTw(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">Semua Triwulan</option>
                          <option value="TW 1">TW 1</option><option value="TW 2">TW 2</option><option value="TW 3">TW 3</option><option value="TW 4">TW 4</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                        <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">Semua Bulan</option>
                          {NAMA_BULAN_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  {(filterTahun || filterKab || filterTw || filterBulan) && (
                    <div className="md:col-span-4 mt-2">
                      <button onClick={() => { setFilterTahun(''); setFilterKab(''); setFilterTw(''); setFilterBulan(''); }} className="text-destructive hover:text-destructive/80 text-sm font-medium px-4 py-2 rounded-lg border border-destructive/20 hover:bg-destructive/10 transition-colors">Reset Filter</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area Based on Active Tab */}
      {isFormOpen ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          {renderForm()}
        </div>
      ) : mainTab === 'tabel' ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Memuat data...</p>
            </div>
          ) : (activeTab === 'garam' || activeTab === 'potensi_perairan') ? (
            <DataTable
              user={user}
              columns={activeColumns}
              data={filteredData}
              onEdit={(row) => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onDelete={(row) => setItemToDelete(row)}
              onApprove={handleApprove}
              onReject={handleReject}
              renderSubComponent={activeSubRow}
              exportName={`Data_${activeTab}`}
              onCustomExport={handleCustomExport}
              hideDefaultExport={activeTab === 'garam'}
              customExportButton={
                              activeTab === 'garam' ? (
                                <button onClick={() => handleCustomExport(filteredData)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-md shadow-emerald-600/20">
                                  <FileSpreadsheet className="w-5 h-5" />
                                  Ekspor Excel
                                </button>
                              ) : null
                            }
            />
          ) : (
            <div className="p-16 text-center text-muted-foreground">
              <Waves className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Tabel data untuk {DATA_TABS.find(t => t.key === activeTab)?.label} sedang disiapkan.</p>
            </div>
          )}
        </div>
      ) : (
        /* Visualisasi Tab */
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {renderVisualisasi()}
        </div>
      )}
    </div>
  );
}