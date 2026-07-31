import * as XLSX from 'xlsx-js-style';
import { KAB_KOTA_OPTIONS, ALAT_TANGKAP_LAUT_OPTIONS, ALAT_TANGKAP_PUD_OPTIONS } from './constants';

export const exportTahunan = (data, filterTahun, filterPerairan) => {
  const isPUD = filterPerairan === 'PUD';
  const wb = XLSX.utils.book_new();

  const borderStyle = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const headerStyle = { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: borderStyle, fill: { fgColor: { rgb: "C9DAF8" } } };
  const dataStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle, font: { sz: 10 } };
  const titleStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left' } };

  const applyFormatting = (ws, merges, cols, dataRowsLength, startHeaderRow = 3) => {
    ws['!merges'] = merges;
    ws['!cols'] = cols;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (R < startHeaderRow) {
          if (ws[cellRef].v) ws[cellRef].s = titleStyle;
        } else if (R === startHeaderRow || R === startHeaderRow + 1) {
          ws[cellRef].s = headerStyle;
        } else {
          ws[cellRef].s = dataStyle;
          // Apply '-' for missing values instead of 0
          if (ws[cellRef].v === '' || ws[cellRef].v === 0) {
            ws[cellRef].v = '-';
            ws[cellRef].t = 's';
          } else if (typeof ws[cellRef].v === 'number') {
            ws[cellRef].z = '#,##0';
          }
        }
      }
    }
  };

  // --- 1. RTP SHEET ---
  const rtpData = [];
  rtpData.push(['PROVINSI: JAWA TIMUR', null, 'Rumah Tangga Perikanan']);
  rtpData.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Unit/Orang']);
  rtpData.push([]);
  
  let rtpMerges = [];
  let rtpCols = [];
  
  if (isPUD) {
    rtpData.push(['Kabupaten/Kota', 'Jumlah', 'Tanpa perahu', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', 'Kapal Motor']);
    rtpData.push([null, null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', null, null]);
    rtpMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 3, c: 7 } },
      { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
      { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } }
    ];
    rtpCols = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
  } else {
    rtpData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Tanpa perahu', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', null, null, null, null, null, 'Kapal Motor', null, null, null, null, null, null, null, null, null, null]);
    rtpData.push([null, null, null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '>30 GT', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '30-50 GT', '50-100 GT', '100-200 GT', '200-300 GT', '300-500 GT', '>500 GT']);
    rtpMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } },
      { s: { r: 3, c: 9 }, e: { r: 3, c: 14 } },
      { s: { r: 3, c: 15 }, e: { r: 3, c: 25 } }
    ];
    rtpCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }].concat(Array(22).fill({ wch: 12 }));
  }

  // --- 2. NELAYAN SHEET ---
  const nelayanData = [];
  nelayanData.push(['PROVINSI: JAWA TIMUR', null, 'Nelayan']);
  nelayanData.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Orang']);
  nelayanData.push([]);
  
  let nelayanMerges = [];
  let nelayanCols = [];
  
  if (isPUD) {
    nelayanData.push(['Kabupaten/Kota', 'Jumlah', 'Kategori Nelayan', null, null, 'Keterangan']);
    nelayanData.push([null, null, 'Nelayan Penuh', 'Nelayan Sambilan Utama', 'Nelayan Sambilan Tambahan', null]);
    nelayanMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 4 } }, // Kategori Nelayan
      { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }, // Keterangan
    ];
    nelayanCols = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }];
  } else {
    nelayanData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Kategori Nelayan', null, null, 'Keterangan']);
    nelayanData.push([null, null, null, 'Nelayan Penuh', 'Nelayan Sambilan Utama', 'Nelayan Sambilan Tambahan', null]);
    nelayanMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }, // Kategori Nelayan
      { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, // Keterangan
    ];
    nelayanCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }];
  }

  // --- 3. KAPAL SHEET ---
  const kapalData = [];
  kapalData.push(['PROVINSI: JAWA TIMUR', null, 'Kapal']);
  kapalData.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Unit']);
  kapalData.push([]);
  
  let kapalMerges = [];
  let kapalCols = [];

  if (isPUD) {
    kapalData.push(['Kabupaten/Kota', 'Jumlah', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', 'Kapal Motor', 'Keterangan']);
    kapalData.push([null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', null, null, null]);
    kapalMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 6 } },
      { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
      { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
      { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } } // Keterangan
    ];
    kapalCols = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
  } else {
    kapalData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', null, null, null, null, null, 'Kapal Motor', null, null, null, null, null, null, null, null, null, null, 'Keterangan']);
    kapalData.push([null, null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '>30 GT', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '30-50 GT', '50-100 GT', '100-200 GT', '200-300 GT', '300-500 GT', '>500 GT', null]);
    kapalMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 3, c: 7 } },
      { s: { r: 3, c: 8 }, e: { r: 3, c: 13 } },
      { s: { r: 3, c: 14 }, e: { r: 3, c: 24 } },
      { s: { r: 3, c: 25 }, e: { r: 4, c: 25 } } // Keterangan
    ];
    kapalCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }].concat(Array(22).fill({ wch: 12 })).concat([{ wch: 20 }]);
  }

  // --- 4. A.P.I SHEET ---
  const alatTangkapList = isPUD ? ALAT_TANGKAP_PUD_OPTIONS : ALAT_TANGKAP_LAUT_OPTIONS;

  // Group alat tangkap statically to match template exactly
  const PUD_API_GROUPS = {
    "Jaring Insang": ["Hanyut", "Tetap"],
    "Jala": ["Jala"],
    "J. Angkat": ["Serok", "Anco", "Bagan Perahu"],
    "Pancing": ["Rawai", "Pancing"],
    "Perangkap": ["Sero", "Bubu", "Perangkap lain"]
  };
  const LAUT_API_GROUPS = {
    "Jaring lingkar": ["Pukat cincin pelagis kecil dengan satu kapal", "Pukat cincin pelagis besar dengan satu kapal", "Pukat cincin teri dengan satu kapal", "Pukat cincin pelagis kecil dengan dua kapal"],
    "Pukat tarik": ["Jaring lingkar tanpa tali kerut", "Jaring tarik pantai", "Payang", "Dogol", "Jaring tarik berkantong"],
    "Pukat hela": ["Jaring hela udang berkantong", "Jaring hela ikan berkantong"],
    "Alat penggaruk": ["Penggaruk berkapal", "Penggaruk tanpa kapal"],
    "Jaring angkat": ["Anco", "Bagan berperahu atau bagan apung", "Bouke ami", "Bagan tancap"],
    "Alat yang dijatuhkan": ["Jala jatuh berkapal", "Jala tebar"],
    "Jaring insang": ["Jaring insang tetap", "Jaring insang hanyut", "Jaring insang lingkar", "Jaring insang berpancang", "Jaring insang berlapis", "Jaring insang kombinasi"],
    "Perangkap": ["Set net", "Bubu", "Bubu bersayap", "Pukat labuh", "Togo", "Ambai", "Jermal", "Pengerih", "Sero", "Perangkap Lainnya"],
    "Pancing": ["Pancing ulur", "Pancing ulur tuna", "Pancing berjoran", "Pancing cumi", "Pancing cumi mekanis", "pancing layang-layang", "Huhate", "Huhate mekanis", "Rawai dasar", "Rawai tuna", "Tonda"],
    "Alat penjepit dan melukai": ["Tombak", "Ladung", "Panah", "Pukat dorong", "Seser", "Pocongan"],
    "Alat Tangkap Lainnya": ["Alat Tangkap Lainnya"]
  };
  
  const apiGroups = isPUD ? PUD_API_GROUPS : LAUT_API_GROUPS;

  const apiDataArray = [];
  apiDataArray.push(['PROVINSI: JAWA TIMUR', null, 'Alat Penangkapan Ikan']);
  apiDataArray.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Unit']);
  apiDataArray.push([]);
  
  let apiHeaderRow1 = [];
  let apiHeaderRow2 = [];
  let apiMerges = [];
  let apiCols = [];
  
  if (isPUD) {
    apiHeaderRow1 = ['Kabupaten/Kota', 'TOTAL'];
    apiHeaderRow2 = [null, null];
    apiMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }
    ];
    apiCols = [{ wch: 20 }, { wch: 12 }];

    let colIndex = 2;
    Object.keys(apiGroups).forEach(groupName => {
      const items = apiGroups[groupName];
      apiHeaderRow1.push(groupName);
      for (let i = 1; i < items.length; i++) apiHeaderRow1.push(null);
      apiHeaderRow2.push(...items);

      if (items.length > 1) {
        apiMerges.push({ s: { r: 3, c: colIndex }, e: { r: 3, c: colIndex + items.length - 1 } });
      }
      
      items.forEach(() => {
        apiCols.push({ wch: 20 });
      });
      colIndex += items.length;
    });

    apiDataArray.push(apiHeaderRow1);
    apiDataArray.push(apiHeaderRow2); 
  } else {
    apiHeaderRow1 = ['Kabupaten/Kota', 'PERAIRAN PANTAI', 'TOTAL'];
    apiHeaderRow2 = [null, null, null];
    apiMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }
    ];
    apiCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }];

    let colIndex = 3;
    Object.keys(apiGroups).forEach(groupName => {
      const items = apiGroups[groupName];
      apiHeaderRow1.push(groupName);
      for (let i = 1; i < items.length; i++) apiHeaderRow1.push(null);
      apiHeaderRow2.push(...items);

      if (items.length > 1) {
        apiMerges.push({ s: { r: 3, c: colIndex }, e: { r: 3, c: colIndex + items.length - 1 } });
      }
      
      items.forEach(() => {
        apiCols.push({ wch: 20 });
      });
      colIndex += items.length;
    });

    apiDataArray.push(apiHeaderRow1);
    apiDataArray.push(apiHeaderRow2);
  }

  // Helpers to safely parse JSON or return default empty object
  const parseJSON = (str) => {
    if (typeof str === 'object' && str !== null) return str;
    try { return JSON.parse(str || '{}'); } 
    catch { return {}; }
  };

  // Helper to resolve Southern/Northern coast statically for LAUT
  const SELATAN_JAWA = [
    "Banyuwangi", "Blitar", "Jember", "Lumajang", "Malang", 
    "Pacitan", "Trenggalek", "Tulungagung", "Kota Blitar", "Kota Malang"
  ];
  const resolvePantai = (kabKota) => {
    if (SELATAN_JAWA.includes(kabKota)) return "Selatan Jawa";
    return "Utara Jawa";
  };

  // LOOP OVER ALL 38 KABUPATEN/KOTA TO GUARANTEE ROWS
  KAB_KOTA_OPTIONS.forEach(kab => {
    // Find matching row for this kab/kota (we assume data is pre-filtered by Perairan & Tahun)
    const row = data.find(d => (d.pelabuhan || d.kabupaten_kota) === kab) || {};

    const pantai = isPUD ? '-' : (row.jenis_perairan || resolvePantai(kab));

    // Nelayan
    const n = row.nelayan || {};
    const nPenuh = Number(n.penuh) || 0;
    const nSamU = Number(n.sambilan_utama) || 0;
    const nSamT = Number(n.sambilan_tambahan) || 0;
    const totalNelayan = nPenuh + nSamU + nSamT;

    if (isPUD) {
      nelayanData.push([kab, totalNelayan, nPenuh, nSamU, nSamT, '']);
    } else {
      nelayanData.push([kab, pantai, totalNelayan, nPenuh, nSamU, nSamT, '']);
    }

    // Kapal
    const kp = row.kapal || {};
    const tnpMotor = parseJSON(kp.perahu_tanpa_motor);
    const tm = parseJSON(kp.motor_tempel);
    const km = parseJSON(kp.kapal_motor);

    const sumTnpMotor = (Number(tnpMotor.jukung) || 0) + (Number(tnpMotor.papan_kecil) || 0) + (Number(tnpMotor.papan_sedang) || 0) + (Number(tnpMotor.papan_besar) || 0);
    let sumTm = 0; let sumKm = 0;
    Object.values(tm).forEach(v => sumTm += Number(v) || 0);
    Object.values(km).forEach(v => sumKm += Number(v) || 0);
    const totalKapal = sumTnpMotor + sumTm + sumKm;

    if (isPUD) {
      kapalData.push([
        kab, totalKapal,
        sumTnpMotor, Number(tnpMotor.jukung) || 0, Number(tnpMotor.papan_kecil) || 0, Number(tnpMotor.papan_sedang) || 0, Number(tnpMotor.papan_besar) || 0,
        sumTm, sumKm, '' // Keterangan
      ]);
    } else {
      kapalData.push([
        kab, pantai, totalKapal,
        sumTnpMotor, Number(tnpMotor.jukung) || 0, Number(tnpMotor.papan_kecil) || 0, Number(tnpMotor.papan_sedang) || 0, Number(tnpMotor.papan_besar) || 0,
        sumTm, Number(tm.lt_5) || 0, Number(tm.gt_5_10) || 0, Number(tm.gt_10_20) || 0, Number(tm.gt_20_30) || 0, Number(tm.gt_30) || 0,
        sumKm, Number(km.lt_5) || 0, Number(km.gt_5_10) || 0, Number(km.gt_10_20) || 0, Number(km.gt_20_30) || 0, Number(km.gt_30_50) || 0, Number(km.gt_50_100) || 0, Number(km.gt_100_200) || 0, Number(km.gt_200_300) || 0, Number(km.gt_300_500) || 0, Number(km.gt_500) || 0,
        '' // Keterangan
      ]);
    }

    // RTP
    const rtp = row.rtp || {};
    const sumTnpPerahu = Number(rtp.tanpa_perahu) || 0;
    const rtpTnpMotor = parseJSON(rtp.perahu_tanpa_motor);
    const rtpTm = parseJSON(rtp.motor_tempel);
    const rtpKm = parseJSON(rtp.kapal_motor);

    const rtpSumTnpMotor = (Number(rtpTnpMotor.jukung) || 0) + (Number(rtpTnpMotor.papan_kecil) || 0) + (Number(rtpTnpMotor.papan_sedang) || 0) + (Number(rtpTnpMotor.papan_besar) || 0);
    let rtpSumTm = 0; let rtpSumKm = 0;
    Object.values(rtpTm).forEach(v => rtpSumTm += Number(v) || 0);
    Object.values(rtpKm).forEach(v => rtpSumKm += Number(v) || 0);
    const totalRtp = sumTnpPerahu + rtpSumTnpMotor + rtpSumTm + rtpSumKm;

    if (isPUD) {
      rtpData.push([
        kab, totalRtp, sumTnpPerahu,
        rtpSumTnpMotor, Number(rtpTnpMotor.jukung) || 0, Number(rtpTnpMotor.papan_kecil) || 0, Number(rtpTnpMotor.papan_sedang) || 0, Number(rtpTnpMotor.papan_besar) || 0,
        rtpSumTm, rtpSumKm
      ]);
    } else {
      rtpData.push([
        kab, pantai, totalRtp, sumTnpPerahu,
        rtpSumTnpMotor, Number(rtpTnpMotor.jukung) || 0, Number(rtpTnpMotor.papan_kecil) || 0, Number(rtpTnpMotor.papan_sedang) || 0, Number(rtpTnpMotor.papan_besar) || 0,
        rtpSumTm, Number(rtpTm.lt_5) || 0, Number(rtpTm.gt_5_10) || 0, Number(rtpTm.gt_10_20) || 0, Number(rtpTm.gt_20_30) || 0, Number(rtpTm.gt_30) || 0,
        rtpSumKm, Number(rtpKm.lt_5) || 0, Number(rtpKm.gt_5_10) || 0, Number(rtpKm.gt_10_20) || 0, Number(rtpKm.gt_20_30) || 0, Number(rtpKm.gt_30_50) || 0, Number(rtpKm.gt_50_100) || 0, Number(rtpKm.gt_100_200) || 0, Number(rtpKm.gt_200_300) || 0, Number(rtpKm.gt_300_500) || 0, Number(rtpKm.gt_500) || 0
      ]);
    }

    // API
    const arrApi = Array.isArray(row.alat_tangkap) ? row.alat_tangkap : [];
    const apiMap = {};
    let totalApi = 0;
    arrApi.forEach(a => {
      if (a.nama && a.jumlah) {
        apiMap[a.nama] = Number(a.jumlah) || 0;
        totalApi += apiMap[a.nama];
      }
    });

    const apiRow = [];
    if (isPUD) apiRow.push(kab, totalApi);
    else apiRow.push(kab, pantai, totalApi);

    Object.keys(apiGroups).forEach(groupName => {
      apiGroups[groupName].forEach(alat => {
        apiRow.push(apiMap[alat] || 0);
      });
    });

    apiDataArray.push(apiRow);
  });

  const wsRtp = XLSX.utils.aoa_to_sheet(rtpData);
  const wsNelayan = XLSX.utils.aoa_to_sheet(nelayanData);
  const wsKapal = XLSX.utils.aoa_to_sheet(kapalData);
  const wsApi = XLSX.utils.aoa_to_sheet(apiDataArray);

  // KAB_KOTA_OPTIONS.length rows + headers
  applyFormatting(wsRtp, rtpMerges, rtpCols, KAB_KOTA_OPTIONS.length);
  applyFormatting(wsNelayan, nelayanMerges, nelayanCols, KAB_KOTA_OPTIONS.length);
  applyFormatting(wsKapal, kapalMerges, kapalCols, KAB_KOTA_OPTIONS.length);
  applyFormatting(wsApi, apiMerges, apiCols, KAB_KOTA_OPTIONS.length);

  XLSX.utils.book_append_sheet(wb, wsRtp, 'RTP');
  XLSX.utils.book_append_sheet(wb, wsNelayan, 'NELAYAN');
  XLSX.utils.book_append_sheet(wb, wsKapal, 'KAPAL');
  XLSX.utils.book_append_sheet(wb, wsApi, 'A.P.I');

  let perairanLabel = '';
  if (filterPerairan === 'PUD') perairanLabel = 'PUD';
  else if (filterPerairan === 'PELABUHAN') perairanLabel = 'PELABUHAN';
  else if (filterPerairan === 'KAB_KOTA') perairanLabel = 'NON PELABUHAN';
  else perairanLabel = 'ALL';

  const fileName = `DATA TAHUNAN ${perairanLabel} ${filterTahun || 'ALL'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
