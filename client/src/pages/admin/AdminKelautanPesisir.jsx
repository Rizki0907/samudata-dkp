import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Loader2, Map, Waves, TreePine, Trash2, X, FlaskConical, Layers,
  BarChart3, CheckCircle, XCircle, FileSpreadsheet, Leaf, Anchor, Globe,
  TableProperties, LineChart as LineChartIcon, Fish, MapPin, Info, Filter, Landmark,
  ChevronRight, ChevronDown, Download, Clock, Edit, Search
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import ReactECharts from 'echarts-for-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { KelautanPesisirForm } from '@/components/admin/KelautanPesisirForm';
import { PotensiPerairanForm } from '@/components/admin/PotensiPerairanForm';
import { MangroveForm } from '@/components/admin/MangroveForm';
import { LamunForm } from '@/components/admin/LamunForm';
import { TerumbuKarangForm } from '@/components/admin/TerumbuKarangForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/shared/DataTable';
import SearchableMultiSelect from '@/components/shared/SearchableMultiSelect';

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
  return <span className="text-foreground">{tw ?? '-'}</span>;
};

// Kategorisasi otomatis kondisi mangrove berdasarkan persentase (0-100%)
const getKondisiMangrove = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 70) return 'Sangat Padat (70-100%)';
  if (p >= 30) return 'Sedang (30-70%)';
  return 'Jarang (0-30%)';
};

const KondisiBadge = ({ kondisi }) => {
  const k = kondisi || '';
  return <span className="text-foreground">{k.replace(/\s*\([^)]*\)\s*$/, '').trim() || '-'}</span>;
};

// Kategorisasi otomatis kondisi Lamun berdasarkan persentase tutupan (0-100%)
const getKondisiLamun = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 60) return 'Kaya (60-100%)';
  if (p >= 30) return 'Kurang Kaya (30-60%)';
  return 'Miskin (0-30%)';
};

const KondisiLamunBadge = ({ kondisi }) => {
  const k = kondisi || '';
  return <span className="text-foreground">{k.replace(/\s*\([^)]*\)\s*$/, '').trim() || '-'}</span>;
};

// Kategorisasi otomatis kondisi Terumbu Karang (0-100%)
const getKondisiTerumbu = (persentase) => {
  const p = Number(persentase) || 0;
  if (p >= 75) return 'Sangat Baik (75-100%)';
  if (p >= 50) return 'Baik (50-75%)';
  return 'Rusak (0-50%)';
};

const KondisiTerumbuBadge = ({ kondisi }) => {
  const k = kondisi || '';
  return <span className="text-foreground">{k.replace(/\s*\([^)]*\)\s*$/, '').trim() || '-'}</span>;
};

// ── EXCEL EXPORT HELPERS (SMART LOGIC) ────────────────────────────────────────────────────────
const borderThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
const cellStyle = (opts = {}) => ({
  font: { bold: opts.bold ?? false, sz: opts.sz ?? 11, color: opts.fontColor ? { rgb: opts.fontColor } : undefined },
  alignment: { horizontal: opts.align ?? 'center', vertical: 'center', wrapText: true },
  border: borderThin,
  fill: opts.fill ? { fgColor: { rgb: opts.fill } } : undefined,
});

const exportGaramExcelPintar = (dataRaw, filterTahun, filterTw, filterBulan, filterKab) => {
  const data = dataRaw.filter(d => d.status === 'VERIFIED');
  if (data.length === 0) {
    alert("Tidak ada data berstatus VERIFIED yang sesuai dengan filter saat ini.");
    return;
  }

  const wb = XLSX.utils.book_new();
  const availableYears = [...new Set(data.map(d => d.tahun))].sort((a, b) => a - b);
  const isMultiYear = availableYears.length > 1;
  const yearString = filterTahun ? filterTahun : (isMultiYear ? 'MultiTahun' : availableYears[0]);
  const titleBase = `DATA PRODUKSI GARAM RAKYAT JAWA TIMUR`;

  const processForYear = (yrData, yr) => {
    const yrSuffix = isMultiYear ? ` ${yr}` : '';
    const title = `${titleBase} TAHUN ${yr}`;

    // KASUS 1: Filter Kab/Kota
    if (filterKab && !filterBulan && !filterTw) {
      const ws = buildGaramSheet(yrData, title, `KABUPATEN/KOTA: ${filterKab.toUpperCase()}`, 'bulan');
      XLSX.utils.book_append_sheet(wb, ws, (filterKab.substring(0, 20) + yrSuffix));
      return;
    }

    // KASUS 2: Filter Bulan
    if (filterBulan) {
      const ws = buildGaramSheet(yrData, title, `BULAN: ${filterBulan.toUpperCase()}`, 'kabupaten');
      XLSX.utils.book_append_sheet(wb, ws, (filterBulan.substring(0, 3) + yrSuffix));
      return;
    }

    // KASUS 3: Filter TW
    if (filterTw) {
      let bulanList = [];
      if (filterTw === 'TW 1') bulanList = ['Januari', 'Februari', 'Maret'];
      if (filterTw === 'TW 2') bulanList = ['April', 'Mei', 'Juni'];
      if (filterTw === 'TW 3') bulanList = ['Juli', 'Agustus', 'September'];
      if (filterTw === 'TW 4') bulanList = ['Oktober', 'November', 'Desember'];

      bulanList.forEach(bln => {
        const dataBulan = yrData.filter(d => formatBulan(d.bulan).toLowerCase() === bln.toLowerCase());
        const ws = buildGaramSheet(dataBulan, title, `BULAN: ${bln.toUpperCase()}`, 'kabupaten');
        XLSX.utils.book_append_sheet(wb, ws, (bln.substring(0, 3) + yrSuffix));
      });
      
      const wsRekap = buildGaramSheet(yrData, title, `REKAPITULASI ${filterTw}`, 'kabupaten');
      XLSX.utils.book_append_sheet(wb, wsRekap, (`Rekap ` + filterTw + yrSuffix).substring(0, 31));
      return;
    }

    // KASUS 4: Tidak ada filter (Full set for this year)
    const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    NAMA_BULAN.forEach(bln => {
      const dataBulan = yrData.filter(d => formatBulan(d.bulan).toLowerCase() === bln.toLowerCase());
      const ws = buildGaramSheet(dataBulan, title, `BULAN: ${bln.toUpperCase()}`, 'kabupaten');
      XLSX.utils.book_append_sheet(wb, ws, (bln.substring(0, 3) + yrSuffix));
    });

    const wsRekap = buildGaramSheet(yrData, title, `REKAPITULASI TAHUN ${yr}`, 'kabupaten');
    XLSX.utils.book_append_sheet(wb, wsRekap, (`Rekap ` + yr).substring(0, 31));
  };

  if (isMultiYear) {
    let subtitle = 'AGREGAT PER TAHUN';
    if (filterKab) subtitle += ` - KAB: ${filterKab.toUpperCase()}`;
    if (filterBulan) subtitle += ` - BULAN: ${filterBulan.toUpperCase()}`;
    if (filterTw) subtitle += ` - ${filterTw}`;
    
    const wsMaster = buildGaramSheet(data, `${titleBase} (MULTI TAHUN)`, subtitle, 'tahun');
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Rekap Semua Tahun');

    availableYears.forEach(yr => {
      const yrData = data.filter(d => d.tahun === yr);
      processForYear(yrData, yr);
    });
  } else {
    processForYear(data, availableYears[0]);
  }

  let filename = `Data_Garam_${yearString}`;
  if (filterKab) filename += `_${filterKab}`;
  if (filterBulan) filename += `_${filterBulan}`;
  if (filterTw) filename += `_${filterTw}`;
  
  XLSX.writeFile(wb, `${filename.replace(/\s+/g, '_')}.xlsx`);
};

// Fungsi Builder (Bisa switch rowMode 'kabupaten' atau 'bulan')
const buildGaramSheet = (dataRowsRaw, title, subtitle, rowMode = 'kabupaten') => {
  const h1 = ['No', 'Status', rowMode === 'kabupaten' ? 'Kab/Kota' : rowMode === 'bulan' ? 'Bulan' : 'Tahun', 'L Total (Ha)', 'L Prod (Ha)', 'Σ Pok', 'Σ Petambak',
    'Produksi (Ton)', '', '', 'Σ Prod (Ton)', 'Prodtv',
    'Stok (Ton)', '', '', 'Σ Stok',
    'Harga (Rp)', '', '', 'Nilai Produksi', '', ''];
  const h2 = ['', '', '', '', '', '', '', 'K1', 'K2', 'K3', '', '', 'K1', 'K2', 'K3', '', 'K1', 'K2', 'K3', 'K1', 'K2', 'K3'];

  const fmt = (v, d) => (v === 0 || v === '0' || !v) ? '-' : (d !== undefined ? v.toLocaleString('id-ID', { maximumFractionDigits: d }) : v.toLocaleString('id-ID'));

  let totalProduksi = 0, totalStok = 0, totalLuas = 0, totalLProd = 0, totalPok = 0, totalPetambak = 0;
  let totalNilaiK1 = 0, totalNilaiK2 = 0, totalNilaiK3 = 0, sumHargaK1 = 0, sumHargaK2 = 0, sumHargaK3 = 0, countHargaK1 = 0, countHargaK2 = 0, countHargaK3 = 0;
  let sumProd = 0, countProd = 0, countNilaiK1 = 0, countNilaiK2 = 0, countNilaiK3 = 0;

  const aggData = {};
  dataRowsRaw.forEach(row => {
    const key = rowMode === 'kabupaten' ? row.kabupaten_kota : rowMode === 'bulan' ? formatBulan(row.bulan) : row.tahun;
    if (!key) return;

    if (!aggData[key]) {
      aggData[key] = { 
        nama_baris: key, 
        produksi_k1_ton: 0, produksi_k2_ton: 0, produksi_k3_ton: 0, stok_k1_ton: 0, stok_k2_ton: 0, stok_k3_ton: 0, 
        total_produksi_ton: 0, total_stok_ton: 0, harga_k1_rp: 0, harga_k2_rp: 0, harga_k3_rp: 0,
        max_per_kab: {} 
      };
    }
    
    const target = aggData[key];
    target.produksi_k1_ton += row.produksi_k1_ton || 0; target.produksi_k2_ton += row.produksi_k2_ton || 0; target.produksi_k3_ton += row.produksi_k3_ton || 0; target.total_produksi_ton += (row.produksi_k1_ton || 0) + (row.produksi_k2_ton || 0) + (row.produksi_k3_ton || 0);
    target.stok_k1_ton += row.stok_k1_ton || 0; target.stok_k2_ton += row.stok_k2_ton || 0; target.stok_k3_ton += row.stok_k3_ton || 0; target.total_stok_ton += (row.stok_k1_ton || 0) + (row.stok_k2_ton || 0) + (row.stok_k3_ton || 0);

    const kab = row.kabupaten_kota;
    if (!target.max_per_kab[kab]) target.max_per_kab[kab] = { luas_total: 0, luas_prod: 0, pok: 0, petambak: 0 };
    target.max_per_kab[kab].luas_total = Math.max(target.max_per_kab[kab].luas_total, row.luas_total_ha || 0);
    target.max_per_kab[kab].luas_prod = Math.max(target.max_per_kab[kab].luas_prod, row.luas_produksi_ha || 0);
    target.max_per_kab[kab].pok = Math.max(target.max_per_kab[kab].pok, row.jumlah_kelompok || 0);
    target.max_per_kab[kab].petambak = Math.max(target.max_per_kab[kab].petambak, row.jumlah_petambak || 0);

    if (row.harga_k1_rp > 0) target.harga_k1_rp = target.harga_k1_rp === 0 ? row.harga_k1_rp : (target.harga_k1_rp + row.harga_k1_rp) / 2;
    if (row.harga_k2_rp > 0) target.harga_k2_rp = target.harga_k2_rp === 0 ? row.harga_k2_rp : (target.harga_k2_rp + row.harga_k2_rp) / 2;
    if (row.harga_k3_rp > 0) target.harga_k3_rp = target.harga_k3_rp === 0 ? row.harga_k3_rp : (target.harga_k3_rp + row.harga_k3_rp) / 2;
  });

  const sortedKeys = Object.keys(aggData);
  if (rowMode === 'tahun') sortedKeys.sort((a, b) => parseInt(a) - parseInt(b));
  else if (rowMode === 'bulan') sortedKeys.sort((a, b) => NAMA_BULAN_LIST.indexOf(a) - NAMA_BULAN_LIST.indexOf(b));
  else sortedKeys.sort();

  const dataRows = sortedKeys.map((key, i) => {
    const row = aggData[key];
    let rowLuas = 0, rowLProd = 0, rowPok = 0, rowPetambak = 0;
    Object.values(row.max_per_kab).forEach(k => {
      rowLuas += k.luas_total; rowLProd += k.luas_prod; rowPok += k.pok; rowPetambak += k.petambak;
    });

    totalProduksi += row.total_produksi_ton; totalStok += row.total_stok_ton; totalLuas += rowLuas; totalLProd += rowLProd; totalPok += rowPok; totalPetambak += rowPetambak;
    const nk1 = row.produksi_k1_ton * row.harga_k1_rp; const nk2 = row.produksi_k2_ton * row.harga_k2_rp; const nk3 = row.produksi_k3_ton * row.harga_k3_rp;
    if (nk1 > 0) { totalNilaiK1 += nk1; countNilaiK1++; }
    if (nk2 > 0) { totalNilaiK2 += nk2; countNilaiK2++; }
    if (nk3 > 0) { totalNilaiK3 += nk3; countNilaiK3++; }
    if (row.harga_k1_rp > 0) { sumHargaK1 += row.harga_k1_rp; countHargaK1++; }
    if (row.harga_k2_rp > 0) { sumHargaK2 += row.harga_k2_rp; countHargaK2++; }
    if (row.harga_k3_rp > 0) { sumHargaK3 += row.harga_k3_rp; countHargaK3++; }

    const prod = rowLProd > 0 ? row.total_produksi_ton / rowLProd : 0;
    if (prod > 0) { sumProd += prod; countProd++; }
    return [ i + 1, 'VERIFIED', row.nama_baris, fmt(rowLuas), fmt(rowLProd), rowPok || '-', rowPetambak || '-',
      fmt(row.produksi_k1_ton), fmt(row.produksi_k2_ton), fmt(row.produksi_k3_ton), fmt(row.total_produksi_ton), fmt(prod, 3),
      fmt(row.stok_k1_ton), fmt(row.stok_k2_ton), fmt(row.stok_k3_ton), fmt(row.total_stok_ton),
      fmt(row.harga_k1_rp), fmt(row.harga_k2_rp), fmt(row.harga_k3_rp), fmt(nk1), fmt(nk2), fmt(nk3)
    ];
  });

  const avgK1 = countHargaK1 > 0 ? (sumHargaK1 / countHargaK1).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK2 = countHargaK2 > 0 ? (sumHargaK2 / countHargaK2).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
  const avgK3 = countHargaK3 > 0 ? (sumHargaK3 / countHargaK3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';

  const avgProd = countProd > 0 ? sumProd / countProd : 0;
  const avgNilaiK1 = countNilaiK1 > 0 ? totalNilaiK1 / countNilaiK1 : 0;
  const avgNilaiK2 = countNilaiK2 > 0 ? totalNilaiK2 / countNilaiK2 : 0;
  const avgNilaiK3 = countNilaiK3 > 0 ? totalNilaiK3 / countNilaiK3 : 0;

  const totalRow = [ 'TOTAL', '', '', fmt(totalLuas), fmt(totalLProd), totalPok || '-', totalPetambak || '-', '', '', '', fmt(totalProduksi, 2), fmt(avgProd, 3), '', '', '', fmt(totalStok, 2), avgK1, avgK2, avgK3, fmt(avgNilaiK1), fmt(avgNilaiK2), fmt(avgNilaiK3) ];
  
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
  for (let R = 5; R < totalRowIdx; R++) { for (let C = range.s.c; C <= range.e.c; C++) { const ref = XLSX.utils.encode_cell({ c: C, r: R }); if (!ws[ref]) ws[ref] = { t: 's', v: '' }; ws[ref].s = C === 2 ? dataLeftStyle : dataStyle; } }
  for (let C = range.s.c; C <= range.e.c; C++) { const ref = XLSX.utils.encode_cell({ c: C, r: totalRowIdx }); if (!ws[ref]) ws[ref] = { t: 's', v: '' }; ws[ref].s = (C === 10 || C === 15) ? totalSumStyle : totalStyle; }
  ws['!merges'] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 21 } }, { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }, { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }, { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, { s: { r: 3, c: 7 }, e: { r: 3, c: 9 } }, { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } }, { s: { r: 3, c: 11 }, e: { r: 4, c: 11 } }, { s: { r: 3, c: 12 }, e: { r: 3, c: 14 } }, { s: { r: 3, c: 15 }, e: { r: 4, c: 15 } }, { s: { r: 3, c: 16 }, e: { r: 3, c: 18 } }, { s: { r: 3, c: 19 }, e: { r: 3, c: 21 } }, { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 6 } } ];
  ws['!cols'] = [ { wch: 5 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 } ];
  ws['!rows'] = [{ hpt: 20 }, { hpt: 16 }, { hpt: 8 }, { hpt: 40 }, { hpt: 30 }];
  return ws;
};

const fmtExcel = (v, d) => (v === 0 || v === '0' || !v) ? '-' : (d !== undefined ? v.toLocaleString('id-ID', { maximumFractionDigits: d }) : v.toLocaleString('id-ID'));

const exportMangroveExcel = (data) => {
  if (data.length === 0) { alert("Tidak ada data untuk diekspor!"); return; }
  const title = 'DATA MANGROVE JAWA TIMUR';
  const h1 = ['No', 'Status', 'Kab/Kota', 'Tahun', 'Luas Eksisting (Ha)', 'Spesies', 'Kondisi (%)', 'Kondisi', 'Luas Rehabilitasi (Ha)'];
  const dataRows = data.map((row, i) => [
    i + 1, row.status || '-', row.kabupaten_kota || '-', row.tahun || '-', 
    fmtExcel(row.luas_eksisting_ha),
    row.spesies || '-', fmtExcel(row.persentase_kondisi),
    row.kondisi ? row.kondisi.replace(/\s*\([^)]*\)\s*$/, '').trim() : '-', fmtExcel(row.luas_rehabilitasi_ha)
  ]);
  buildStandardSheet(title, h1, dataRows, 'Data_Mangrove');
};

const exportLamunExcel = (data) => {
  if (data.length === 0) { alert("Tidak ada data untuk diekspor!"); return; }
  const title = 'DATA LAMUN JAWA TIMUR';
  const h1 = ['No', 'Status', 'Kab/Kota', 'Tahun', 'Luas Eksisting (Ha)', 'Persentase Tutupan (%)', 'Kondisi', 'Luas Rehabilitasi (Ha)'];
  const dataRows = data.map((row, i) => [
    i + 1, row.status || '-', row.kabupaten_kota || '-', row.tahun || '-', 
    fmtExcel(row.luas_eksisting_ha),
    fmtExcel(row.persentase_tutupan),
    row.kondisi ? row.kondisi.replace(/\s*\([^)]*\)\s*$/, '').trim() : '-', fmtExcel(row.luas_rehabilitasi_ha)
  ]);
  buildStandardSheet(title, h1, dataRows, 'Data_Lamun');
};

const exportTerumbuKarangExcel = (data) => {
  if (data.length === 0) { alert("Tidak ada data untuk diekspor!"); return; }
  const title = 'DATA TERUMBU KARANG JAWA TIMUR';
  const h1 = ['No', 'Status', 'Kab/Kota', 'Tahun', 'Luas Eksisting (Ha)', 'Persentase Tutupan (%)', 'Kondisi', 'Luas Rehabilitasi (Ha)'];
  const dataRows = data.map((row, i) => [
    i + 1, row.status || '-', row.kabupaten_kota || '-', row.tahun || '-', 
    fmtExcel(row.luas_eksisting_ha),
    fmtExcel(row.persentase_tutupan),
    row.kondisi ? row.kondisi.replace(/\s*\([^)]*\)\s*$/, '').trim() : '-', fmtExcel(row.luas_rehabilitasi_ha)
  ]);
  buildStandardSheet(title, h1, dataRows, 'Data_Terumbu_Karang');
};

const buildStandardSheet = (title, h1, dataRows, filenamePrefix) => {
  const aoa = [[title], [], h1, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const hStyle = cellStyle({ bold: true, fill: '1F4E79', fontColor: 'FFFFFF' });
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws[XLSX.utils.encode_cell({ c: 0, r: 0 })].s = { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } };
  for (let C = range.s.c; C <= range.e.c; C++) {
    const r2 = XLSX.utils.encode_cell({ c: C, r: 2 });
    if (!ws[r2]) ws[r2] = { t: 's', v: '' };
    ws[r2].s = hStyle;
  }
  for (let R = 3; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].s = cellStyle({ align: C <= 2 ? 'left' : 'center' });
    }
  }
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: h1.length - 1 } }];
  const cols = h1.map((_, i) => ({ wch: i === 0 ? 5 : i === 2 ? 18 : 15 }));
  ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const exportPotensiExcel = (dataRaw) => {
  const data = dataRaw.filter(d => d.status === 'VERIFIED');
  if (data.length === 0) {
    alert("Tidak ada data berstatus VERIFIED untuk diekspor!");
    return;
  }

  const title = 'REKAPITULASI POTENSI PERAIRAN JAWA TIMUR';
  const h1 = ['No', 'Status', 'Kab/Kota', 'Tahun', 'Luas Wilayah Laut (km²)', 'Total Panjang Garis Pantai (Km)', 'Jumlah Pulau Kecil', 'Desa Pesisir', 'Keterangan'];
  const dataRows = data.map((row, i) => {
    return [i + 1, row.status || '-', row.kabupaten_kota, row.tahun_data,
      fmtExcel(row.luas_wilayah_laut_km2),
      fmtExcel(row.total_panjang_garis_pantai_km),
      fmtExcel(row.jumlah_pulau_kecil),
      fmtExcel(row.desa_pesisir),
      row.keterangan || '-'];
  });
  buildStandardSheet(title, h1, dataRows, 'Potensi_Perairan_Jatim');
};

// ── CHART OPTION HELPERS ────────────────────────────────────────────────────────
// ── MARITIME COLOR PALETTE ── (disamakan dengan KelautanPesisir.jsx publik)
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

const makeHBarOption = (categories, values, color = '#0891b2', unit = '') => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value.toLocaleString('id-ID')}${unit ? ' ' + unit : ''}`,
  },
  grid: { left: 140, right: 40, top: 10, bottom: 10 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#475569', fontSize: 11, fontWeight: 500 }, axisTick: { show: false }, inverse: true },
  series: [{ data: values, type: 'bar', itemStyle: { color, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 28 }],
});

// Urutkan kategori & value bar chart dari yang tertinggi ke terendah (menyamai KelautanPesisir.jsx publik)
const sortBarData = (categories, values) => {
  const paired = categories.map((c, i) => ({ c, v: values[i] }));
  paired.sort((a, b) => b.v - a.v);
  return { categories: paired.map(p => p.c), values: paired.map(p => p.v) };
};

const makeComboHBarOption = (categories, series) => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, textStyle: { color: '#475569' } },
  grid: { left: 140, right: 40, top: 10, bottom: 40 },
  xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
  yAxis: { type: 'category', data: categories, axisLabel: { color: '#475569', fontSize: 11, fontWeight: 500 }, axisTick: { show: false } },
  series: series.map(s => ({ ...s, type: 'bar', barGap: '0%', barMaxWidth: 28, itemStyle: { ...s.itemStyle, borderRadius: [0, 4, 4, 0] } })),
});

const makePieOption = (title, data, nameField, valueField) => ({
  color: CHART_PALETTE,
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.map(d => ({ name: d[nameField], value: d[valueField] })).filter(d => d.value > 0),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

// Warna kategori kondisi mangrove: Jarang (merah), Sedang (kuning), Sangat Padat (hijau)
const KONDISI_COLOR_MAP = {
  'Sangat Padat (70-100%)': '#10b981',
  'Sedang (30-70%)': '#f59e0b',
  'Jarang (0-30%)': '#f43f5e',
};

const makeKondisiPieOption = (data) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_COLOR_MAP[d.name] } })),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

// Warna kategori kondisi lamun: Miskin (merah), Kurang Kaya (kuning), Kaya (hijau)
const KONDISI_LAMUN_COLOR_MAP = {
  'Kaya (60-100%)': '#10b981',
  'Kurang Kaya (30-60%)': '#f59e0b',
  'Miskin (0-30%)': '#f43f5e',
};

const makeKondisiLamunPieOption = (data) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_LAMUN_COLOR_MAP[d.name] } })),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

// Warna kategori kondisi Terumbu Karang
const KONDISI_TERUMBU_COLOR_MAP = {
  'Sangat Baik (75-100%)': '#10b981',
  'Baik (50-75%)': '#f59e0b',
  'Rusak (0-50%)': '#f43f5e',
};

const makeKondisiTerumbuPieOption = (data) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} lokasi ({d}%)' },
  legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20, textStyle: { color: '#475569', fontSize: 11 } },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    data: data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value, itemStyle: { color: KONDISI_TERUMBU_COLOR_MAP[d.name] } })),
    label: { show: false },
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.15)' } }
  }]
});

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────────
const DATA_TABS = [
  { key: 'garam',            label: 'Garam' },
  { key: 'mangrove',         label: 'Mangrove' },
  { key: 'terumbu_karang',   label: 'Terumbu Karang' },
  { key: 'lamun',            label: 'Lamun' },
  { key: 'potensi_perairan', label: 'Potensi Perairan' },
];

const MAIN_TABS = [
  { key: 'tabel', label: 'Tabel Data' },
  { key: 'visualisasi', label: 'Visualisasi Statistik' },
];

export default function AdminKelautanPesisir() {
  const { user } = useAuthStore();
  const [mainTab, setMainTab] = useState('tabel');
  const [activeTab, setActiveTab] = useState('garam');
  const [dataGaram, setDataGaram] = useState([]);
  const [dataPotensiPerairan, setDataPotensiPerairan] = useState([]);
  const [dataMangrove, setDataMangrove] = useState([]);
  const [dataLamun, setDataLamun] = useState([]);
  const [dataTerumbuKarang, setDataTerumbuKarang] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters
  const [filterTahun, setFilterTahun] = useState([]);
  const [filterTw, setFilterTw] = useState([]);
  const [filterBulan, setFilterBulan] = useState([]);
  const [filterKab, setFilterKab] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [visBulan, setVisBulan] = useState([]);
  const [visTahun, setVisTahun] = useState([]);
  const [visKab, setVisKab] = useState([]);

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

  // Fetch mangrove data
  const fetchMangrove = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/mangrove');
      setDataMangrove(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data mangrove:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lamun data
  const fetchLamun = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/lamun');
      setDataLamun(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data lamun:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch terumbu karang data
  const fetchTerumbuKarang = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kelautan-pesisir/terumbu-karang');
      setDataTerumbuKarang(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data terumbu karang:', err);
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
    fetchMangrove();
    fetchLamun();
    fetchTerumbuKarang();
  }, [fetchGaram, fetchPotensi, fetchMangrove, fetchLamun, fetchTerumbuKarang]);

  useEffect(() => {
    if (mainTab === 'visualisasi') fetchStats();
  }, [mainTab, fetchStats]);

  const handleCreateOrUpdate = async (formData) => {
    let baseData;
    if (activeTab === 'garam') baseData = dataGaram;
    else if (activeTab === 'potensi_perairan') baseData = dataPotensiPerairan;
    else if (activeTab === 'mangrove') baseData = dataMangrove;
    else if (activeTab === 'lamun') baseData = dataLamun;
    else if (activeTab === 'terumbu_karang') baseData = dataTerumbuKarang;
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
      } else if (activeTab === 'mangrove') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/mangrove/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/mangrove', formData);
        }
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/lamun/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/lamun', formData);
        }
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        if (editingData) {
          await api.put(`/kelautan-pesisir/terumbu-karang/${editingData.id}`, formData);
        } else {
          await api.post('/kelautan-pesisir/terumbu-karang', formData);
        }
        await fetchTerumbuKarang();
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
      const id = itemToDelete.id;
      if (activeTab === 'garam') {
        await api.delete(`/kelautan-pesisir/garam/${id}`);
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.delete(`/kelautan-pesisir/potensi-perairan/${id}`);
        await fetchPotensi();
      } else if (activeTab === 'mangrove') {
        await api.delete(`/kelautan-pesisir/mangrove/${id}`);
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        await api.delete(`/kelautan-pesisir/lamun/${id}`);
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        await api.delete(`/kelautan-pesisir/terumbu-karang/${id}`);
        await fetchTerumbuKarang();
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
      if (row.status !== 'APPROVED') {
        alert('Validasi Program ditolak! Pastikan data ini sudah divalidasi oleh Bidang (Status: APPROVED) terlebih dahulu.');
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
      } else if (activeTab === 'mangrove') {
        await api.patch(`/kelautan-pesisir/mangrove/${row.id}/status`, { status: targetStatus, alasan_penolakan: null });
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        await api.patch(`/kelautan-pesisir/lamun/${row.id}/status`, { status: targetStatus, alasan_penolakan: null });
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        await api.patch(`/kelautan-pesisir/terumbu-karang/${row.id}/status`, { status: targetStatus, alasan_penolakan: null });
        await fetchTerumbuKarang();
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
      } else if (activeTab === 'mangrove') {
        await api.patch(`/kelautan-pesisir/mangrove/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        await api.patch(`/kelautan-pesisir/lamun/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        await api.patch(`/kelautan-pesisir/terumbu-karang/${row.id}/status`, { status: 'REJECTED', alasan_penolakan: alasan });
        await fetchTerumbuKarang();
      }
    } catch (err) { 
      console.error(err);
      alert('Gagal menolak data.');
    }
  };

  const handleBatchApprove = async (ids) => {
    const selectedRows = filteredData.filter(row => ids.includes(row.id));
    
    const promptMsg = 'Pilih jenis validasi massal (Ketik angka):\n1. Validasi Bidang\n2. Validasi Program';
    const jenis = window.prompt(promptMsg);
    if (!jenis) return;

    let targetStatus = '';
    let namaValidasi = '';
    let expectedKeyword = '';

    if (jenis === '1') {
      const invalidRows = selectedRows.filter(row => row.status === 'VERIFIED' || row.status === 'APPROVED');
      if (invalidRows.length > 0) {
        alert('Beberapa data yang dipilih sudah divalidasi Bidang/Program! Silakan pilih data yang berstatus PENDING saja.');
        return;
      }
      targetStatus = 'APPROVED';
      namaValidasi = 'BIDANG';
      expectedKeyword = 'SETUJU_PESISIR_BIDANG';
    } else if (jenis === '2') {
      const invalidRows = selectedRows.filter(row => row.status !== 'APPROVED');
      if (invalidRows.length > 0) {
        alert('Validasi Program ditolak! Pastikan SEMUA data yang dipilih sudah divalidasi oleh Bidang (Status: APPROVED) terlebih dahulu.');
        return;
      }
      targetStatus = 'VERIFIED';
      namaValidasi = 'PROGRAM';
      expectedKeyword = 'ACC_PESISIR_PROGRAM';
    } else {
      alert('Pilihan tidak valid.');
      return;
    }

    const confirmText = window.prompt(`Anda akan menyetujui ${ids.length} data.\nKetik "${expectedKeyword}" (huruf kapital) untuk menyelesaikan Validasi ${namaValidasi}:`);
    if (confirmText !== expectedKeyword) {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    const payload = { ids, status: targetStatus };

    try {
      if (activeTab === 'garam') {
        await api.post(`/kelautan-pesisir/garam/batch-status`, payload);
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.post(`/kelautan-pesisir/potensi-perairan/batch-status`, payload);
        await fetchPotensi();
      } else if (activeTab === 'mangrove') {
        await api.post(`/kelautan-pesisir/mangrove/batch-status`, payload);
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        await api.post('/kelautan-pesisir/lamun/batch-status', payload);
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        await api.post('/kelautan-pesisir/terumbu-karang/batch-status', payload);
        await fetchTerumbuKarang();
      }
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
    const confirmText = window.prompt(`Ketik "TOLAK_PESISIR" (huruf kapital) untuk menyelesaikan penolakan massal:`);
    if (confirmText !== 'TOLAK_PESISIR') {
      alert('Konfirmasi dibatalkan atau kata kunci tidak sesuai.');
      return;
    }

    const payload = { ids, status: 'REJECTED', alasan_penolakan: alasan };

    try {
      if (activeTab === 'garam') {
        await api.post(`/kelautan-pesisir/garam/batch-status`, payload);
        await fetchGaram();
      } else if (activeTab === 'potensi_perairan') {
        await api.post(`/kelautan-pesisir/potensi-perairan/batch-status`, payload);
        await fetchPotensi();
      } else if (activeTab === 'mangrove') {
        await api.post(`/kelautan-pesisir/mangrove/batch-status`, payload);
        await fetchMangrove();
      } else if (activeTab === 'lamun') {
        await api.post(`/kelautan-pesisir/lamun/batch-status`, payload);
        await fetchLamun();
      } else if (activeTab === 'terumbu_karang') {
        await api.post(`/kelautan-pesisir/terumbu-karang/batch-status`, payload);
        await fetchTerumbuKarang();
      }
    } catch (error) {
      console.error('Error batch reject:', error);
      alert('Gagal menolak data secara massal');
    }
  };

  const handleBatchDelete = async (ids) => {
    if (window.confirm(`Yakin ingin menghapus ${ids.length} data ini secara massal?`)) {
      try {
        if (activeTab === 'garam') {
          await api.post(`/kelautan-pesisir/garam/batch-delete`, { ids });
          await fetchGaram();
        } else if (activeTab === 'potensi_perairan') {
          await api.post(`/kelautan-pesisir/potensi-perairan/batch-delete`, { ids });
          await fetchPotensi();
        } else if (activeTab === 'mangrove') {
          await api.post(`/kelautan-pesisir/mangrove/batch-delete`, { ids });
          await fetchMangrove();
        } else if (activeTab === 'lamun') {
          await api.post(`/kelautan-pesisir/lamun/batch-delete`, { ids });
          await fetchLamun();
        } else if (activeTab === 'terumbu_karang') {
          await api.post(`/kelautan-pesisir/terumbu-karang/batch-delete`, { ids });
          await fetchTerumbuKarang();
        }
      } catch (error) {
        console.error('Error batch delete:', error);
        alert('Gagal menghapus data secara massal');
      }
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
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="text-foreground">{info.getValue()}</p> },
    { header: 'Total Produksi', accessorKey: 'total_produksi_ton', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Total Stok', accessorKey: 'total_stok_ton', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton</span> },
    { header: 'Produktivitas', accessorKey: 'produktivitas', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ton/Ha</span> },
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
    { header: 'Tahun', accessorKey: 'tahun_data', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'L. Wilayah Laut (km²)', accessorKey: 'luas_wilayah_laut_km2', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span> },
    {
      header: 'Total Pantai (km)', accessorKey: 'total_garis_pantai',
      accessorFn: row => (row.panjang_pantai_utara_km || 0) + (row.panjang_pantai_selatan_km || 0) + (row.panjang_pantai_timur_km || 0) + (row.panjang_pantai_barat_km || 0),
      cell: info => <span className="text-foreground">{info.getValue().toLocaleString('id-ID', { maximumFractionDigits: 2 })} km</span>
    },
    { header: 'Pulau Kecil', accessorKey: 'jumlah_pulau_kecil', cell: info => <span className="text-foreground">{info.getValue()} pulau</span> },
    { header: 'Desa Pesisir', accessorKey: 'desa_pesisir', cell: info => <span className="text-foreground">{info.getValue() || 0}</span> },
  ], []);

  const columnsMangrove = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => {
      const row = info.row.original;
      return <StatusBadge
        row={row}
        contextFields={[
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Tahun', value: row.tahun }
        ]}
      />;
    } },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="text-foreground">{info.getValue()}</p> },
    { header: 'Luas Eksisting', accessorKey: 'luas_eksisting_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
    { header: 'Spesies', accessorKey: 'spesies', cell: info => <p className="text-sm text-muted-foreground max-w-xs truncate" title={info.getValue()}>{info.getValue() || '-'}</p> },
    { header: 'Kondisi', accessorKey: 'kondisi', cell: info => <KondisiBadge kondisi={info.getValue()} /> },
    { header: 'Persentase', accessorKey: 'persentase_kondisi', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span> },
    { header: 'Luas Rehabilitasi', accessorKey: 'luas_rehabilitasi_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
  ], []);

  const columnsLamun = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => {
      const row = info.row.original;
      return <StatusBadge
        row={row}
        contextFields={[
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Tahun', value: row.tahun }
        ]}
      />;
    } },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="text-foreground">{info.getValue()}</p> },
    { header: 'Luas Eksisting', accessorKey: 'luas_eksisting_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
    { header: 'Tutupan', accessorKey: 'persentase_tutupan', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span> },
    { header: 'Kondisi', accessorKey: 'kondisi', cell: info => <KondisiLamunBadge kondisi={info.getValue()} /> },
    { header: 'Luas Rehabilitasi', accessorKey: 'luas_rehabilitasi_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
  ], []);

  const columnsTerumbuKarang = useMemo(() => [
    { header: 'Status', accessorKey: 'status', cell: info => {
      const row = info.row.original;
      return <StatusBadge
        row={row}
        contextFields={[
          { label: 'Kabupaten/Kota', value: row.kabupaten_kota },
          { label: 'Tahun', value: row.tahun }
        ]}
      />;
    } },
    { header: 'Tahun', accessorKey: 'tahun', cell: info => <span className="text-foreground">{info.getValue()}</span> },
    { header: 'Kab/Kota', accessorKey: 'kabupaten_kota', cell: info => <p className="text-foreground">{info.getValue()}</p> },
    { header: 'Luas Eksisting', accessorKey: 'luas_eksisting_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
    { header: 'Tutupan', accessorKey: 'persentase_tutupan', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</span> },
    { header: 'Kondisi', accessorKey: 'kondisi', cell: info => <KondisiTerumbuBadge kondisi={info.getValue()} /> },
    { header: 'Luas Rehabilitasi', accessorKey: 'luas_rehabilitasi_ha', cell: info => <span className="text-foreground">{(info.getValue() || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha</span> },
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
    const bulanOptions = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tahunOptions = [...new Set([
      ...dataGaram.map(d => d.tahun),
      ...dataMangrove.map(d => d.tahun),
      ...dataLamun.map(d => d.tahun),
      ...dataPotensiPerairan.map(d => d.tahun_data)
    ].filter(Boolean))].sort((a, b) => b - a);
    const kabupatenOptions = [...new Set([
      ...dataGaram.map(d => d.kabupaten_kota),
      ...dataMangrove.map(d => d.kabupaten_kota),
      ...dataLamun.map(d => d.kabupaten_kota),
      ...dataPotensiPerairan.map(d => d.kabupaten_kota)
    ].filter(Boolean))].sort();

    // ── KPI Potensi Perairan (only VERIFIED data) ──
    const verifiedPotensi = dataPotensiPerairan.filter(d => d.status === 'VERIFIED');
    const filteredVisPotensi = verifiedPotensi.filter(d =>
      (visTahun.length === 0 || visTahun.includes(String(d.tahun_data))) &&
      (visKab.length === 0 || visKab.includes(d.kabupaten_kota))
    );
    const potensiPerKotaFrontend = Object.values(filteredVisPotensi.reduce((agg, d) => {
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
      (visBulan.length === 0 || visBulan.includes(formatBulan(d.bulan))) &&
      (visTahun.length === 0 || visTahun.includes(String(d.tahun))) &&
      (visKab.length === 0 || visKab.includes(d.kabupaten_kota))
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

    const numFmt = (v) => (Number(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

    // ── VISUALISASI MANGROVE (only VERIFIED data) ──
    const verifiedMangrove = dataMangrove.filter(d => d.status === 'VERIFIED');
    const filteredVisMangrove = verifiedMangrove.filter(d =>
      (visTahun.length === 0 || visTahun.includes(String(d.tahun))) &&
      (visKab.length === 0 || visKab.includes(d.kabupaten_kota))
    );

    const visMangrovePerKota = Object.values(filteredVisMangrove.reduce((agg, d) => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
      return agg;
    }, {})).sort((a, b) => b.luas_eksisting - a.luas_eksisting);

    const kpiMangrove = {
      luas_eksisting: visMangrovePerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visMangrovePerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisMangrove.length,
    };

    const mangroveKota = visMangrovePerKota.map(d => d.name);
    const mangroveEksisting = visMangrovePerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
    const mangroveRehab = visMangrovePerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

    const kondisiCountMap = filteredVisMangrove.reduce((agg, d) => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
      return agg;
    }, {});
    const kondisiChartData = [
      { name: 'Sangat Padat (70-100%)', value: kondisiCountMap['Sangat Padat (70-100%)'] || 0 },
      { name: 'Sedang (30-70%)', value: kondisiCountMap['Sedang (30-70%)'] || 0 },
      { name: 'Jarang (0-30%)', value: kondisiCountMap['Jarang (0-30%)'] || 0 },
    ];

    // ── VISUALISASI LAMUN (only VERIFIED data) ──
    const verifiedLamun = dataLamun.filter(d => d.status === 'VERIFIED');
    const filteredVisLamun = verifiedLamun.filter(d =>
      (visTahun.length === 0 || visTahun.includes(String(d.tahun))) &&
      (visKab.length === 0 || visKab.includes(d.kabupaten_kota))
    );

    const visLamunPerKota = Object.values(filteredVisLamun.reduce((agg, d) => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
      return agg;
    }, {})).sort((a, b) => b.luas_eksisting - a.luas_eksisting);

    const kpiLamun = {
      luas_eksisting: visLamunPerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visLamunPerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisLamun.length,
    };

    const lamunKota = visLamunPerKota.map(d => d.name);
    const lamunEksisting = visLamunPerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
    const lamunRehab = visLamunPerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

    const kondisiLamunCountMap = filteredVisLamun.reduce((agg, d) => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
      return agg;
    }, {});
    const kondisiLamunChartData = [
      { name: 'Kaya (60-100%)', value: kondisiLamunCountMap['Kaya (60-100%)'] || 0 },
      { name: 'Kurang Kaya (30-60%)', value: kondisiLamunCountMap['Kurang Kaya (30-60%)'] || 0 },
      { name: 'Miskin (0-30%)', value: kondisiLamunCountMap['Miskin (0-30%)'] || 0 },
    ];

    // ── VISUALISASI TERUMBU KARANG (only VERIFIED data) ──
    const verifiedTerumbu = dataTerumbuKarang.filter(d => d.status === 'VERIFIED');
    const filteredVisTerumbu = verifiedTerumbu.filter(d =>
      (visTahun.length === 0 || visTahun.includes(String(d.tahun))) &&
      (visKab.length === 0 || visKab.includes(d.kabupaten_kota))
    );

    const visTerumbuPerKota = Object.values(filteredVisTerumbu.reduce((agg, d) => {
      const kab = d.kabupaten_kota || 'Unknown';
      if (!agg[kab]) agg[kab] = { name: kab, luas_eksisting: 0, luas_rehabilitasi: 0 };
      agg[kab].luas_eksisting += (d.luas_eksisting_ha || 0);
      agg[kab].luas_rehabilitasi += (d.luas_rehabilitasi_ha || 0);
      return agg;
    }, {})).sort((a, b) => b.luas_eksisting - a.luas_eksisting);

    const kpiTerumbu = {
      luas_eksisting: visTerumbuPerKota.reduce((s, d) => s + d.luas_eksisting, 0),
      luas_rehabilitasi: visTerumbuPerKota.reduce((s, d) => s + d.luas_rehabilitasi, 0),
      jumlah_lokasi: filteredVisTerumbu.length,
    };

    const terumbuKota = visTerumbuPerKota.map(d => d.name);
    const terumbuEksisting = visTerumbuPerKota.map(d => parseFloat(d.luas_eksisting.toFixed(2)));
    const terumbuRehab = visTerumbuPerKota.map(d => parseFloat(d.luas_rehabilitasi.toFixed(2)));

    const kondisiTerumbuCountMap = filteredVisTerumbu.reduce((agg, d) => {
      const k = d.kondisi || 'Tidak Diketahui';
      agg[k] = (agg[k] || 0) + 1;
      return agg;
    }, {});
    const kondisiTerumbuChartData = [
      { name: 'Sangat Baik (75-100%)', value: kondisiTerumbuCountMap['Sangat Baik (75-100%)'] || 0 },
      { name: 'Baik (50-75%)', value: kondisiTerumbuCountMap['Baik (50-75%)'] || 0 },
      { name: 'Rusak (0-50%)', value: kondisiTerumbuCountMap['Rusak (0-50%)'] || 0 },
    ];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── Potensi Perairan KPI (TOP) ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Anchor className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-bold text-foreground">Potensi Perairan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><Globe className="w-5 h-5 text-orange-500" /><p className="text-sm font-medium text-muted-foreground">Jml. Pulau-Pulau Kecil</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.pulau_kecil)} <span className="text-sm text-muted-foreground font-normal">Pulau</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><Waves className="w-5 h-5 text-cyan-500" /><p className="text-sm font-medium text-muted-foreground">Total Garis Pantai</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.garis_pantai)} <span className="text-sm text-muted-foreground font-normal">Km</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><Anchor className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Luas Wilayah Laut</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.luas_laut)} <span className="text-sm text-muted-foreground font-normal">Km²</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-pink-500" /><p className="text-sm font-medium text-muted-foreground">Jumlah Desa Pesisir</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiPotensi.desa_pesisir)} <span className="text-sm text-muted-foreground font-normal">Desa</span></p>
            </div>
          </div>
        </div>

        {/* ── Visualisasi Garam ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Produksi Garam</h2>
            </div>
          </div>

          {/* Garam KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><FlaskConical className="w-5 h-5 text-emerald-500" /><p className="text-sm font-medium text-muted-foreground">Total Produksi Garam</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.produksi)} <span className="text-sm text-muted-foreground font-normal">Ton</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><Fish className="w-5 h-5 text-amber-500" /><p className="text-sm font-medium text-muted-foreground">Total Petambak Garam</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.petambak)} <span className="text-sm text-muted-foreground font-normal">Orang</span></p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2"><Landmark className="w-5 h-5 text-blue-500" /><p className="text-sm font-medium text-muted-foreground">Total Luas Lahan Tambak</p></div>
              <p className="text-3xl font-bold text-foreground">{numFmt(kpiGaram.lahan)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
            </div>
          </div>

          {/* Garam Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Volume Produksi per Kab/Kota (Ton)</h3>
              {garamKota.length > 0
                ? (() => { const s = sortBarData(garamKota, garamProduksi); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#0077b6', 'Ton')} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Jumlah Kelompok per Kab/Kota</h3>
              {garamKota.length > 0
                ? (() => { const s = sortBarData(garamKota, garamKelompok); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#023e8a', 'Kelompok')} style={{ height: Math.max(320, garamKota.length * 38) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Lahan per Kab/Kota</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makePieOption('Luas Lahan', visGaramPerKota, 'name', 'luas_lahan')} style={{ height: '320px' }} />
                : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Jumlah Petambak per Kab/Kota</h3>
              {garamKota.length > 0
                ? <ReactECharts option={makePieOption('Jumlah Petambak', visGaramPerKota, 'name', 'petambak')} style={{ height: '320px' }} />
                : <div className="h-[320px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
          </div>
        </div>

        {/* ── Visualisasi Mangrove ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Mangrove</h2>
            </div>
          </div>

          {/* Mangrove Charts & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Distribusi Kategori Kondisi Tutupan</h3>
              {kpiMangrove.jumlah_lokasi > 0
                ? <ReactECharts option={makeKondisiPieOption(kondisiChartData)} style={{ height: '240px', width: '100%' }} />
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>

            <div className="flex flex-col gap-3 justify-center h-full">
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><TreePine className="w-6 h-6 text-emerald-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Eksisting</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-cyan-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Rehabilitasi</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiMangrove.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Eksisting per Kab/Kota (Ha)</h3>
              {mangroveKota.length > 0
                ? (() => { const s = sortBarData(mangroveKota, mangroveEksisting); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#0077b6', 'Ha')} style={{ height: Math.max(240, mangroveKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
              {mangroveKota.length > 0
                ? (() => { const s = sortBarData(mangroveKota, mangroveRehab); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#023e8a', 'Ha')} style={{ height: Math.max(240, mangroveKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
          </div>
        </div>

        {/* ── Visualisasi Terumbu Karang ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-500" />
              <h2 className="text-xl font-bold text-foreground">Terumbu Karang</h2>
            </div>
          </div>

          {/* Terumbu Karang Charts & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Distribusi Kategori Kondisi Tutupan</h3>
              {kpiTerumbu.jumlah_lokasi > 0
                ? <ReactECharts option={makeKondisiTerumbuPieOption(kondisiTerumbuChartData)} style={{ height: '240px', width: '100%' }} />
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>

            <div className="flex flex-col gap-3 justify-center h-full">
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Waves className="w-6 h-6 text-sky-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Eksisting</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiTerumbu.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-pink-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Rehabilitasi</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiTerumbu.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Eksisting per Kab/Kota (Ha)</h3>
              {terumbuKota.length > 0
                ? (() => { const s = sortBarData(terumbuKota, terumbuEksisting); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#0ea5e9', 'Ha')} style={{ height: Math.max(240, terumbuKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
              {terumbuKota.length > 0
                ? (() => { const s = sortBarData(terumbuKota, terumbuRehab); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#ec4899', 'Ha')} style={{ height: Math.max(240, terumbuKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
          </div>
        </div>

        {/* ── Visualisasi Lamun ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-foreground">Lamun</h2>
            </div>
          </div>

          {/* Lamun Charts & KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col justify-center">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Distribusi Kategori Kondisi Tutupan</h3>
              {kpiLamun.jumlah_lokasi > 0
                ? <ReactECharts option={makeKondisiLamunPieOption(kondisiLamunChartData)} style={{ height: '240px', width: '100%' }} />
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>

            <div className="flex flex-col gap-3 justify-center h-full">
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><Leaf className="w-6 h-6 text-emerald-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Eksisting</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_eksisting)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
              <div className="bg-card border border-border p-3 rounded-xl shadow-sm relative overflow-hidden group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3"><TreePine className="w-6 h-6 text-purple-500" /><p className="text-base font-semibold text-muted-foreground">Total Luas Rehabilitasi</p></div>
                <p className="text-3xl font-bold text-foreground">{numFmt(kpiLamun.luas_rehabilitasi)} <span className="text-base text-muted-foreground font-normal ml-1">Ha</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Eksisting per Kab/Kota (Ha)</h3>
              {lamunKota.length > 0
                ? (() => { const s = sortBarData(lamunKota, lamunEksisting); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#10b981', 'Ha')} style={{ height: Math.max(240, lamunKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
            <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-4 text-center">Luas Rehabilitasi per Kab/Kota (Ha)</h3>
              {lamunKota.length > 0
                ? (() => { const s = sortBarData(lamunKota, lamunRehab); return (
                    <div className="overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                      <ReactECharts option={makeHBarOption(s.categories, s.values, '#8b5cf6', 'Ha')} style={{ height: Math.max(240, lamunKota.length * 32) + 'px' }} />
                    </div>
                  ); })()
                : <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">Belum ada data</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── ACTIVE DATA / COLUMNS / SUB-ROW ─────────────────────────────────────────
  let activeColumns = activeTab === 'garam' ? columnsGaram : activeTab === 'potensi_perairan' ? columnsPotensi : activeTab === 'mangrove' ? columnsMangrove : activeTab === 'lamun' ? columnsLamun : activeTab === 'terumbu_karang' ? columnsTerumbuKarang : columnsPotensi;

  activeColumns = [
    ...activeColumns,
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Terakhir Diperbarui',
      cell: ({ row }) => {
        if (!row.original.updated_at) return '-';
        return formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true, locale: idLocale });
      }
    }
  ];

  if (user?.role === 'admin_cabang') {
    activeColumns = [
      ...activeColumns,
      {
        header: 'Aksi',
        id: 'aksi_cabang',
        cell: info => {
          const row = info.row.original;
          if (row.status === 'APPROVED' || row.status === 'VERIFIED') return null;
          return (
            <div className="flex justify-end gap-2 pr-2">
              <button onClick={() => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit Data" className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"><Edit className="w-6 h-6" /></button>
              <button onClick={() => setItemToDelete(row)} title="Hapus Data" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-6 h-6" /></button>
            </div>
          );
        }
      }
    ];
  }
  const activeSubRow = activeTab === 'garam' ? renderSubGaram : undefined;

  const filteredData = useMemo(() => {
      let result = activeTab === 'garam' ? dataGaram : activeTab === 'potensi_perairan' ? dataPotensiPerairan : activeTab === 'mangrove' ? dataMangrove : activeTab === 'lamun' ? dataLamun : activeTab === 'terumbu_karang' ? dataTerumbuKarang : [];
      
      if (filterTahun && filterTahun.length > 0) {
        result = result.filter(d => filterTahun.includes(String(d.tahun || d.tahun_data)));
      }
      
      if (filterTw && filterTw.length > 0 && activeTab === 'garam') {
        result = result.filter(d => {
          const bNum = parseInt(d.bulan, 10);
          const bStr = (formatBulan(d.bulan) || '').toLowerCase();
          
          let matchTw = [];
          if (filterTw.includes('TW 1')) matchTw.push((bNum >= 1 && bNum <= 3) || ['januari','februari','maret'].includes(bStr));
          if (filterTw.includes('TW 2')) matchTw.push((bNum >= 4 && bNum <= 6) || ['april','mei','juni'].includes(bStr));
          if (filterTw.includes('TW 3')) matchTw.push((bNum >= 7 && bNum <= 9) || ['juli','agustus','september'].includes(bStr));
          if (filterTw.includes('TW 4')) matchTw.push((bNum >= 10 && bNum <= 12) || ['oktober','november','desember'].includes(bStr));
          
          return matchTw.some(Boolean) || filterTw.includes(d.triwulan);
        });
      }
      
      if (filterBulan && filterBulan.length > 0 && activeTab === 'garam') {
        result = result.filter(d => {
          const dMonth = (formatBulan(d.bulan) || '').toLowerCase();
          return filterBulan.some(b => b.toLowerCase() === dMonth);
        });
      }
      
      if (filterKab && filterKab.length > 0) {
        result = result.filter(d => filterKab.some(kab => kab.toLowerCase() === (d.kabupaten_kota || '').toLowerCase()));
      }

      if (filterStatus && filterStatus.length > 0) {
        result = result.filter(d => filterStatus.includes(d.status));
      }
      
      return result;
    }, [activeTab, dataGaram, dataPotensiPerairan, dataMangrove, dataLamun, dataTerumbuKarang, filterTahun, filterTw, filterBulan, filterKab, filterStatus]);

  const handleCustomExport = (data) => {
      if (activeTab === 'garam') {
        const strTahun = filterTahun?.length > 0 ? filterTahun.join(', ') : '';
        const strTw = filterTw?.length > 0 ? filterTw.join(', ') : '';
        const strBulan = filterBulan?.length > 0 ? filterBulan.join(', ') : '';
        const strKab = filterKab?.length > 0 ? filterKab.join(', ') : '';
        exportGaramExcelPintar(data, strTahun, strTw, strBulan, strKab);
      } else if (activeTab === 'potensi_perairan') {
        exportPotensiExcel(data);
      } else if (activeTab === 'mangrove') {
        exportMangroveExcel(data);
      } else if (activeTab === 'lamun') {
        exportLamunExcel(data);
      } else if (activeTab === 'terumbu_karang') {
        exportTerumbuKarangExcel(data);
      }
    };

  const allData = [...dataGaram, ...dataMangrove, ...dataLamun, ...dataTerumbuKarang, ...dataPotensiPerairan];

  const validDates = allData
    .map(d => new Date(d.updated_at || d.updatedAt || d.created_at || d.createdAt))
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.getTime());

  const latestDate = validDates.length > 0 ? new Date(Math.max(...validDates)) : null;
  const lastUpdated = latestDate 
    ? format(latestDate, "dd MMMM yyyy 'pukul' HH:mm", { locale: idLocale })
    : '-';

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
    if (activeTab === 'mangrove') {
      return (
        <MangroveForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    if (activeTab === 'lamun') {
      return (
        <LamunForm
          initialData={editingData}
          isLoading={submitLoading}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setIsFormOpen(false); setEditingData(null); }}
        />
      );
    }
    if (activeTab === 'terumbu_karang') {
      return (
        <TerumbuKarangForm
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Kelautan dan Pesisir</h1>
        </div>
        {mainTab === 'tabel' && !isFormOpen && (activeTab === 'garam' || activeTab === 'potensi_perairan' || activeTab === 'mangrove' || activeTab === 'lamun' || activeTab === 'terumbu_karang') && (
          <button
            onClick={() => { setEditingData(null); setIsFormOpen(true); }}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Tambah Data Baru
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
                {tab.label}
              </button>
            ))}
          </div>

          {mainTab === 'tabel' && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi</h3>
                </div>
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
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {(activeTab === 'garam' || activeTab === 'potensi_perairan' || activeTab === 'mangrove' || activeTab === 'lamun' || activeTab === 'terumbu_karang') && (
                <div className={activeTab === 'garam' ? "grid grid-cols-1 md:grid-cols-5 gap-4" : "grid grid-cols-1 md:grid-cols-3 gap-4"}>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                    <SearchableMultiSelect
                      value={filterStatus}
                      onChange={setFilterStatus}
                      placeholder="Semua Status"
                      options={[
                        { label: 'Verified', value: 'VERIFIED' },
                        { label: 'Approved', value: 'APPROVED' },
                        { label: 'Rejected', value: 'REJECTED' },
                        { label: 'Pending', value: 'PENDING' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                    <SearchableMultiSelect value={filterTahun} onChange={setFilterTahun} placeholder="Semua Tahun" options={[...new Set((activeTab === 'garam' ? dataGaram : activeTab === 'mangrove' ? dataMangrove : activeTab === 'terumbu_karang' ? dataTerumbuKarang : activeTab === 'lamun' ? dataLamun : dataPotensiPerairan).map(d => String(d.tahun || d.tahun_data)))].filter(Boolean).sort()} />
                  </div>
                  {activeTab === 'garam' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Triwulan</label>
                        <SearchableMultiSelect value={filterTw} onChange={setFilterTw} placeholder="Semua Triwulan" options={['TW 1', 'TW 2', 'TW 3', 'TW 4']} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                        <SearchableMultiSelect value={filterBulan} onChange={setFilterBulan} placeholder="Semua Bulan" options={NAMA_BULAN_LIST} />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                    <SearchableMultiSelect value={filterKab} onChange={setFilterKab} placeholder="Semua Kab/Kota" options={[...new Set((activeTab === 'garam' ? dataGaram : activeTab === 'mangrove' ? dataMangrove : activeTab === 'terumbu_karang' ? dataTerumbuKarang : activeTab === 'lamun' ? dataLamun : dataPotensiPerairan).map(d => d.kabupaten_kota))].filter(Boolean).sort()} />
                  </div>
                  {(filterTahun.length > 0 || filterKab.length > 0 || filterTw.length > 0 || filterBulan.length > 0 || filterStatus.length > 0) && (
                    <div className={activeTab === 'garam' ? "md:col-span-5 flex justify-end mt-1" : "md:col-span-3 flex justify-end mt-1"}>
                      <button
                        type="button"
                        onClick={() => { setFilterTahun([]); setFilterKab([]); setFilterTw([]); setFilterBulan([]); setFilterStatus([]); }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Reset Semua Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mainTab === 'visualisasi' && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Filter Multi-Dimensi</h3>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 sm:self-auto">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span>Terakhir Diperbarui: {lastUpdated}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tahun</label>
                  <SearchableMultiSelect value={visTahun} onChange={setVisTahun} placeholder="Semua Tahun" options={[...new Set([
                      ...dataGaram.map(d => d.tahun),
                      ...dataMangrove.map(d => d.tahun),
                      ...dataPotensiPerairan.map(d => d.tahun_data)
                    ].filter(Boolean).map(String))].sort((a, b) => b - a)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bulan</label>
                  <SearchableMultiSelect value={visBulan} onChange={setVisBulan} placeholder="Semua Bulan" options={['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kab/Kota</label>
                  <SearchableMultiSelect value={visKab} onChange={setVisKab} placeholder="Semua Kab/Kota" options={[...new Set([
                      ...dataGaram.map(d => d.kabupaten_kota),
                      ...dataMangrove.map(d => d.kabupaten_kota),
                      ...dataPotensiPerairan.map(d => d.kabupaten_kota)
                    ].filter(Boolean))].sort()} />
                </div>
                {(visTahun.length > 0 || visBulan.length > 0 || visKab.length > 0) && (
                  <div className="md:col-span-3 flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => { setVisTahun([]); setVisBulan([]); setVisKab([]); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area Based on Active Tab */}
      {isFormOpen ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-[600px]">
          {renderForm()}
        </div>
      ) : mainTab === 'tabel' ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[600px]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Memuat data...</p>
            </div>
          ) : (activeTab === 'garam' || activeTab === 'potensi_perairan' || activeTab === 'mangrove' || activeTab === 'lamun' || activeTab === 'terumbu_karang') ? (
            <DataTable
              user={user}
              columns={activeColumns}
              data={filteredData}
              onEdit={user?.role === 'admin_pusat' ? (row) => { setEditingData(row); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } : undefined}
              onDelete={user?.role === 'admin_pusat' ? (row) => setItemToDelete(row) : undefined}
              onApprove={user?.role === 'admin_pusat' ? handleApprove : undefined}
              onReject={user?.role === 'admin_pusat' ? handleReject : undefined}
              onBatchApprove={user?.role === 'admin_pusat' ? handleBatchApprove : undefined}
              onBatchReject={user?.role === 'admin_pusat' ? handleBatchReject : undefined}
              onBatchDelete={user?.role === 'admin_pusat' ? handleBatchDelete : undefined}
              canBatchApprove={(selectedRows) => user?.role === 'admin_pusat' && selectedRows.some(row => ['PENDING', 'APPROVED', 'VERIFIED'].includes(row.status))}
              canBatchReject={(selectedRows) => user?.role === 'admin_pusat' && selectedRows.some(row => ['PENDING', 'APPROVED', 'VERIFIED'].includes(row.status))}
              renderSubComponent={activeSubRow}
              exportName={`Data_${activeTab}`}
              formatExportData={(data) => data.map(row => {
                const finalRow = {};
                if ('status' in row) {
                  finalRow['Status'] = row.status;
                }
                for (const key in row) {
                  if (key !== 'status') {
                    let val = row[key];
                    finalRow[key] = (val === 0 || val === null || val === '') ? '-' : val;
                  }
                }
                return finalRow;
              })}
              onCustomExport={handleCustomExport}
              hideDefaultExport={true}
              customExportButton={
                <button onClick={() => handleCustomExport(filteredData)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium">
                  <Download className="w-6 h-6" />
                  Ekspor Excel
                </button>
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
        <div className="min-h-[600px]">
          {renderVisualisasi()}
        </div>
      )}
    </div>
  );
}