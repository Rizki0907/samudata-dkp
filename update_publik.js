const fs = require('fs');

function updateDataPublik() {
  const file = 'client/src/components/admin/DataPublikTangkap.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // 1. Import PERBEKALAN_OPTIONS
  const targetImport = `import { KOMODITAS_OPTIONS, KOMODITAS_PUD_OPTIONS, KOMODITAS_LAUT_OPTIONS } from '@/utils/constants';`;
  const replaceImport = `import { KOMODITAS_OPTIONS, KOMODITAS_PUD_OPTIONS, KOMODITAS_LAUT_OPTIONS, PERBEKALAN_OPTIONS } from '@/utils/constants';`;
  content = content.replace(targetImport, replaceImport);

  // 2. Add publicLogistik prop & state
  const targetProp = `export function DataPublikTangkap({ filterTahun, filterCabang, filterWilayah, filterKomoditas, isPublic = false, publicData = null }) {
  const [data, setData] = useState([]);`;
  const replaceProp = `export function DataPublikTangkap({ filterTahun, filterCabang, filterWilayah, filterKomoditas, isPublic = false, publicData = null, publicLogistik = null }) {
  const [data, setData] = useState([]);
  const [logistikBulanan, setLogistikBulanan] = useState({});`;
  content = content.replace(targetProp, replaceProp);

  // 3. Update useEffect
  const targetEffect = `  useEffect(() => {
    if (isPublic) {
      if (publicData) {
        setData(publicData);
      }`;
  const replaceEffect = `  useEffect(() => {
    if (isPublic) {
      if (publicData) {
        setData(publicData);
      }
      if (publicLogistik) {
        setLogistikBulanan(publicLogistik);
      }`;
  content = content.replace(targetEffect, replaceEffect);

  // 4. Update fetchData
  const targetFetch = `      const res = await api.get('/bulanan-tangkap/admin');
      setData(res.data.data || []);`;
  const replaceFetch = `      const res = await api.get('/bulanan-tangkap/admin');
      setData(res.data.data || []);
      setLogistikBulanan(res.data.logistikBulanan || {});`;
  content = content.replace(targetFetch, replaceFetch);

  // 5. Update handleExport header & row logic
  const targetExportHead = `    komoditasArray.forEach(kom => {
      headerRow1.push(kom, '', '');
      headerRow2.push('Volume (Kg)', 'Harga (Rp)', 'Nilai (Rp)');
    });`;
  const replaceExportHead = `    komoditasArray.forEach(kom => {
      headerRow1.push(kom, '', '');
      headerRow2.push('Volume (Kg)', 'Harga (Rp)', 'Nilai (Rp)');
    });

    const isPelabuhanFilter = filterCabang !== 'PUD' && filterCabang !== 'KAB_KOTA';
    if (isPelabuhanFilter) {
       PERBEKALAN_OPTIONS.forEach(pb => {
          headerRow1.push(pb.nama);
          headerRow2.push(pb.satuan);
       });
    }`;
  content = content.replace(targetExportHead, replaceExportHead);

  // 6. Update handleExport data push
  const targetExportPush = `      let hasData = false;

      komoditasArray.forEach(kom => {
        const val = komoditasMap[kom];
        if (val) {
          baseRow.push(val.volume, val.harga, val.nilai);
          hasData = true;
        } else {
          baseRow.push(0, 0, 0);
        }
      });`;
  const replaceExportPush = `      let hasData = false;

      komoditasArray.forEach(kom => {
        const val = komoditasMap[kom];
        if (val) {
          baseRow.push(val.volume, val.harga, val.nilai);
          hasData = true;
        } else {
          baseRow.push(0, 0, 0);
        }
      });
      
      if (isPelabuhanFilter && row.sumber_data === 'PELABUHAN') {
         const logKey = \`\${row.bulan}|PELABUHAN|\${row.pelabuhan}\`;
         const logData = logistikBulanan[logKey] || {};
         PERBEKALAN_OPTIONS.forEach(pb => {
            const val = logData[pb.nama] || 0;
            baseRow.push(val);
         });
      } else if (isPelabuhanFilter) {
         PERBEKALAN_OPTIONS.forEach(() => {
            baseRow.push(0);
         });
      }`;
  content = content.replace(targetExportPush, replaceExportPush);

  // 7. Update handleExportLaporanPelabuhanBulanan header
  const targetLMHead = `    const row6 = ['', '', '', '', 'Volume', 'Nilai'];
    
    const komoditasArray = [...KOMODITAS_OPTIONS];`;
  const replaceLMHead = `    const row6 = ['', '', '', '', 'Volume', 'Nilai'];
    
    const komoditasArray = [...KOMODITAS_OPTIONS];
    
    PERBEKALAN_OPTIONS.forEach(pb => {
       row4.push(pb.nama);
       row5.push('');
       row6.push(pb.satuan);
    });`;
  content = content.replace(targetLMHead, replaceLMHead);

  // 8. Update handleExportLaporanPelabuhanBulanan row push
  const targetLMPush = `      let hasData = false;
      komoditasArray.forEach(kom => {
        const val = komoditasMap[kom];
        if (val) {
          dataRow.push(val.volume, val.nilai);
          komoditasTotalMap[kom].vol += val.volume;
          komoditasTotalMap[kom].nilai += val.nilai;
          hasData = true;
        } else {
          dataRow.push(0, 0);
        }
      });`;
  const replaceLMPush = `      let hasData = false;
      komoditasArray.forEach(kom => {
        const val = komoditasMap[kom];
        if (val) {
          dataRow.push(val.volume, val.nilai);
          komoditasTotalMap[kom].vol += val.volume;
          komoditasTotalMap[kom].nilai += val.nilai;
          hasData = true;
        } else {
          dataRow.push(0, 0);
        }
      });
      
      const logKey = \`\${bulan}|PELABUHAN|\${pelabuhanName}\`;
      const logData = logistikBulanan[logKey] || {};
      PERBEKALAN_OPTIONS.forEach(pb => {
         const val = logData[pb.nama] || 0;
         dataRow.push(val);
         
         if (!komoditasTotalMap[pb.nama]) komoditasTotalMap[pb.nama] = 0;
         komoditasTotalMap[pb.nama] += val;
      });`;
  content = content.replace(targetLMPush, replaceLMPush);

  // 9. Update handleExportLaporanPelabuhanBulanan total row
  const targetLMTotal = `    komoditasArray.forEach(k => {
      totalRow.push(komoditasTotalMap[k].vol, komoditasTotalMap[k].nilai);
    });

    dataRows.push(totalRow);`;
  const replaceLMTotal = `    komoditasArray.forEach(k => {
      totalRow.push(komoditasTotalMap[k].vol, komoditasTotalMap[k].nilai);
    });
    
    PERBEKALAN_OPTIONS.forEach(pb => {
       totalRow.push(komoditasTotalMap[pb.nama] || 0);
    });

    dataRows.push(totalRow);`;
  content = content.replace(targetLMTotal, replaceLMTotal);

  fs.writeFileSync(file, content);
  console.log("Updated DataPublikTangkap.jsx");
}

function updateUserTangkap() {
  const file = 'client/src/pages/user/PerikananTangkap.jsx';
  let content = fs.readFileSync(file, 'utf8');

  const targetState = `  const [data, setData] = useState([]);`;
  const replaceState = `  const [data, setData] = useState([]);
  const [logistikBulanan, setLogistikBulanan] = useState({});`;
  if (content.includes(targetState)) content = content.replace(targetState, replaceState);

  const targetFetch = `        const [dataRes] = await Promise.all([
          api.get(\`/bulanan-tangkap/publik\`)
        ]);

        setData(dataRes.data.data || []);`;
  const replaceFetch = `        const [dataRes] = await Promise.all([
          api.get(\`/bulanan-tangkap/publik\`)
        ]);

        setData(dataRes.data.data || []);
        setLogistikBulanan(dataRes.data.logistikBulanan || {});`;
  if (content.includes(targetFetch)) content = content.replace(targetFetch, replaceFetch);

  const targetRender = `<DataPublikTangkap 
                filterTahun={filterTahun}
                filterCabang={filterCabang}
                filterWilayah={filterWilayah}
                filterKomoditas={filterKomoditas}
                isPublic={true}
                publicData={filteredData}
              />`;
  const replaceRender = `<DataPublikTangkap 
                filterTahun={filterTahun}
                filterCabang={filterCabang}
                filterWilayah={filterWilayah}
                filterKomoditas={filterKomoditas}
                isPublic={true}
                publicData={filteredData}
                publicLogistik={logistikBulanan}
              />`;
  if (content.includes(targetRender)) content = content.replace(targetRender, replaceRender);

  fs.writeFileSync(file, content);
  console.log("Updated user/PerikananTangkap.jsx");
}

updateDataPublik();
updateUserTangkap();
