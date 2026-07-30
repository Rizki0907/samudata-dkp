import * as XLSX from 'xlsx-js-style';

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
          if (typeof ws[cellRef].v === 'number') {
             if (ws[cellRef].v === 0) {
               ws[cellRef].v = '-';
               ws[cellRef].t = 's';
             } else {
               ws[cellRef].z = '#,##0';
             }
          }
        }
      }
    }
  };

  // 1. RTP SHEET
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
    rtpData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Tanpa perahu', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', null, null, null, null, null, 'Kapal Motor', null, null, null, null, null, null, null]);
    rtpData.push([null, null, null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '>30 GT', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '30-50 GT', '50-100 GT', '100-200 GT']);
    rtpMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } },
      { s: { r: 3, c: 9 }, e: { r: 3, c: 14 } },
      { s: { r: 3, c: 15 }, e: { r: 3, c: 22 } }
    ];
    rtpCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }].concat(Array(19).fill({ wch: 12 }));
  }

  // 2. NELAYAN SHEET
  const nelayanData = [];
  nelayanData.push(['PROVINSI: JAWA TIMUR', null, 'Nelayan']);
  nelayanData.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Orang']);
  nelayanData.push([]);
  
  let nelayanMerges = [];
  let nelayanCols = [];
  
  if (isPUD) {
    nelayanData.push(['Kabupaten/Kota', 'Jumlah', 'Nelayan Penuh', 'Nelayan Sambilan Utama', 'Nelayan Sambilan Tambahan']);
    nelayanData.push([null, null, null, null, null]); // Dummy row for formatting consistency
    nelayanMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
      { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }
    ];
    nelayanCols = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
  } else {
    nelayanData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Nelayan Penuh', 'Nelayan Sambilan Utama', 'Nelayan Sambilan Tambahan']);
    nelayanData.push([null, null, null, null, null, null]); // Dummy row
    nelayanMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
      { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
      { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }
    ];
    nelayanCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
  }

  // 3. KAPAL SHEET
  const kapalData = [];
  kapalData.push(['PROVINSI: JAWA TIMUR', null, 'Kapal']);
  kapalData.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Unit']);
  kapalData.push([]);
  
  let kapalMerges = [];
  let kapalCols = [];

  if (isPUD) {
    kapalData.push(['Kabupaten/Kota', 'Jumlah', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', 'Kapal Motor']);
    kapalData.push([null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', null, null]);
    kapalMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 6 } },
      { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
      { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } }
    ];
    kapalCols = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
  } else {
    kapalData.push(['Kabupaten/Kota', 'PERAIRAN PANTAI', 'Jumlah', 'Perahu Tanpa Motor', null, null, null, null, 'Motor Tempel', null, null, null, null, null, 'Kapal Motor', null, null, null, null, null, null, null, null, null, null]);
    kapalData.push([null, null, null, 'Sub Jumlah', 'Jukung', 'Papan Kecil', 'Papan Sedang', 'Papan Besar', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '>30 GT', 'Sub Jumlah', '< 5 GT', '5-10 GT', '10-20 GT', '20-30 GT', '30-50 GT', '50-100 GT', '100-200 GT', '200-300 GT', '300-500 GT', '>500 GT']);
    kapalMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
      { s: { r: 3, c: 3 }, e: { r: 3, c: 7 } },
      { s: { r: 3, c: 8 }, e: { r: 3, c: 13 } },
      { s: { r: 3, c: 14 }, e: { r: 3, c: 24 } }
    ];
    kapalCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }].concat(Array(22).fill({ wch: 12 }));
  }

  // Populate data for RTP, Nelayan, Kapal
  data.forEach(row => {
    const loc = row.pelabuhan || row.kabupaten_kota || '-';
    const pantai = row.jenis_perairan || 'Selatan Jawa';

    // Nelayan
    const n = row.nelayan || {};
    const totalNelayan = (n.penuh || 0) + (n.sambilan_utama || 0) + (n.sambilan_tambahan || 0);
    if (isPUD) {
      nelayanData.push([loc, totalNelayan, n.penuh || 0, n.sambilan_utama || 0, n.sambilan_tambahan || 0]);
    } else {
      nelayanData.push([loc, pantai, totalNelayan, n.penuh || 0, n.sambilan_utama || 0, n.sambilan_tambahan || 0]);
    }

    // RTP & Kapal
    const r = row.rtp || {};
    const r_ptm = r.perahu_tanpa_motor || {};
    const r_mt = r.motor_tempel || {};
    const r_km = r.kapal_motor || {};

    const k = row.kapal || {};
    const k_ptm = k.perahu_tanpa_motor || {};
    const k_mt = k.motor_tempel || {};
    const k_km = k.kapal_motor || {};

    if (isPUD) {
      // PUD RTP
      const subR_ptm = (r_ptm.jukung||0) + (r_ptm.papan_kecil||0) + (r_ptm.papan_sedang||0) + (r_ptm.papan_besar||0);
      const totalRTP = (r.tanpa_perahu||0) + subR_ptm + (r_mt.total_pud||0) + (r_km.total_pud||0);
      rtpData.push([loc, totalRTP, r.tanpa_perahu||0, subR_ptm, r_ptm.jukung||0, r_ptm.papan_kecil||0, r_ptm.papan_sedang||0, r_ptm.papan_besar||0, r_mt.total_pud||0, r_km.total_pud||0]);

      // PUD Kapal
      const subK_ptm = (k_ptm.jukung||0) + (k_ptm.papan_kecil||0) + (k_ptm.papan_sedang||0) + (k_ptm.papan_besar||0);
      const totalKapal = subK_ptm + (k_mt.total_pud||0) + (k_km.total_pud||0);
      kapalData.push([loc, totalKapal, subK_ptm, k_ptm.jukung||0, k_ptm.papan_kecil||0, k_ptm.papan_sedang||0, k_ptm.papan_besar||0, k_mt.total_pud||0, k_km.total_pud||0]);
    } else {
      // LAUT RTP
      const subR_ptm = (r_ptm.jukung||0) + (r_ptm.papan_kecil||0) + (r_ptm.papan_sedang||0) + (r_ptm.papan_besar||0);
      const subR_mt = (r_mt.lt_5||0) + (r_mt.gt_5_10||0) + (r_mt.gt_10_20||0) + (r_mt.gt_20_30||0) + (r_mt.gt_30||0);
      const subR_km = (r_km.lt_5||0) + (r_km.gt_5_10||0) + (r_km.gt_10_20||0) + (r_km.gt_20_30||0) + (r_km.gt_30_50||0) + (r_km.gt_50_100||0) + (r_km.gt_100_200||0);
      const totalRTP = (r.tanpa_perahu||0) + subR_ptm + subR_mt + subR_km;
      
      rtpData.push([loc, pantai, totalRTP, r.tanpa_perahu||0, subR_ptm, r_ptm.jukung||0, r_ptm.papan_kecil||0, r_ptm.papan_sedang||0, r_ptm.papan_besar||0, 
        subR_mt, r_mt.lt_5||0, r_mt.gt_5_10||0, r_mt.gt_10_20||0, r_mt.gt_20_30||0, r_mt.gt_30||0,
        subR_km, r_km.lt_5||0, r_km.gt_5_10||0, r_km.gt_10_20||0, r_km.gt_20_30||0, r_km.gt_30_50||0, r_km.gt_50_100||0, r_km.gt_100_200||0
      ]);

      // LAUT Kapal
      const subK_ptm = (k_ptm.jukung||0) + (k_ptm.papan_kecil||0) + (k_ptm.papan_sedang||0) + (k_ptm.papan_besar||0);
      const subK_mt = (k_mt.lt_5||0) + (k_mt.gt_5_10||0) + (k_mt.gt_10_20||0) + (k_mt.gt_20_30||0) + (k_mt.gt_30||0);
      const subK_km = (k_km.lt_5||0) + (k_km.gt_5_10||0) + (k_km.gt_10_20||0) + (k_km.gt_20_30||0) + (k_km.gt_30_50||0) + (k_km.gt_50_100||0) + (k_km.gt_100_200||0) + (k_km.gt_200_300||0) + (k_km.gt_300_500||0) + (k_km.gt_500||0);
      const totalKapal = subK_ptm + subK_mt + subK_km;

      kapalData.push([loc, pantai, totalKapal, subK_ptm, k_ptm.jukung||0, k_ptm.papan_kecil||0, k_ptm.papan_sedang||0, k_ptm.papan_besar||0, 
        subK_mt, k_mt.lt_5||0, k_mt.gt_5_10||0, k_mt.gt_10_20||0, k_mt.gt_20_30||0, k_mt.gt_30||0,
        subK_km, k_km.lt_5||0, k_km.gt_5_10||0, k_km.gt_10_20||0, k_km.gt_20_30||0, k_km.gt_30_50||0, k_km.gt_50_100||0, k_km.gt_100_200||0, k_km.gt_200_300||0, k_km.gt_300_500||0, k_km.gt_500||0
      ]);
    }
  });

  const wsRtp = XLSX.utils.aoa_to_sheet(rtpData);
  const wsNelayan = XLSX.utils.aoa_to_sheet(nelayanData);
  const wsKapal = XLSX.utils.aoa_to_sheet(kapalData);

  applyFormatting(wsRtp, rtpMerges, rtpCols, data.length);
  applyFormatting(wsNelayan, nelayanMerges, nelayanCols, data.length);
  applyFormatting(wsKapal, kapalMerges, kapalCols, data.length);

  XLSX.utils.book_append_sheet(wb, wsRtp, 'RTP');
  XLSX.utils.book_append_sheet(wb, wsNelayan, 'NELAYAN');
  XLSX.utils.book_append_sheet(wb, wsKapal, 'KAPAL');

  // 4. A.P.I SHEET
  const alatTangkapMap = new Set();
  data.forEach(row => {
    const arr = Array.isArray(row.alat_tangkap) ? row.alat_tangkap : [];
    arr.forEach(a => { if (a.nama) alatTangkapMap.add(a.nama) });
  });
  const alatTangkapList = Array.from(alatTangkapMap);

  const apiDataArray = [];
  apiDataArray.push(['PROVINSI: JAWA TIMUR', null, 'Alat Penangkapan Ikan']);
  apiDataArray.push([`TAHUN: ${filterTahun || 'Semua'}`, null, 'Satuan : Unit']);
  apiDataArray.push([]);
  
  let apiHeader = [];
  let apiMerges = [];
  let apiCols = [];
  
  if (isPUD) {
    apiHeader = ['Kabupaten/Kota', 'TOTAL', ...alatTangkapList];
    apiDataArray.push(apiHeader);
    apiDataArray.push(Array(apiHeader.length).fill(null)); // dummy sub header
    apiMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }
    ];
    apiCols = [{ wch: 20 }, { wch: 12 }];
    alatTangkapList.forEach((_, i) => {
      apiMerges.push({ s: { r: 3, c: i + 2 }, e: { r: 4, c: i + 2 } });
      apiCols.push({ wch: 20 });
    });
  } else {
    apiHeader = ['Kabupaten/Kota', 'PERAIRAN PANTAI', 'TOTAL', ...alatTangkapList];
    apiDataArray.push(apiHeader);
    apiDataArray.push(Array(apiHeader.length).fill(null)); // dummy sub header
    apiMerges = [
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }
    ];
    apiCols = [{ wch: 20 }, { wch: 20 }, { wch: 12 }];
    alatTangkapList.forEach((_, i) => {
      apiMerges.push({ s: { r: 3, c: i + 3 }, e: { r: 4, c: i + 3 } });
      apiCols.push({ wch: 20 });
    });
  }

  data.forEach(row => {
    const loc = row.pelabuhan || row.kabupaten_kota || '-';
    const pantai = row.jenis_perairan || 'Selatan Jawa';
    const apiObj = {};
    let total = 0;
    const arr = Array.isArray(row.alat_tangkap) ? row.alat_tangkap : [];
    arr.forEach(a => {
      apiObj[a.nama] = (apiObj[a.nama] || 0) + (a.jumlah || 0);
      total += (a.jumlah || 0);
    });

    const rowData = isPUD ? [loc, total] : [loc, pantai, total];
    alatTangkapList.forEach(nama => {
      rowData.push(apiObj[nama] || 0);
    });
    apiDataArray.push(rowData);
  });

  const wsApi = XLSX.utils.aoa_to_sheet(apiDataArray);
  applyFormatting(wsApi, apiMerges, apiCols, data.length);
  XLSX.utils.book_append_sheet(wb, wsApi, 'A.P.I');

  let perairanLabel = '';
  if (filterPerairan === 'PUD') perairanLabel = 'PUD';
  else if (filterPerairan === 'PELABUHAN') perairanLabel = 'PELABUHAN';
  else if (filterPerairan === 'KAB_KOTA') perairanLabel = 'NON PELABUHAN';
  else perairanLabel = 'ALL';

  const fileName = `DATA TAHUNAN ${perairanLabel} ${filterTahun || 'ALL'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
