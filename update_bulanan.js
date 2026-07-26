const fs = require('fs');
const file = 'server/src/controllers/bulananTangkap.controller.js';
let content = fs.readFileSync(file, 'utf8');

const injectionFunction = `const getLogistikMap = async () => {
  const dataRiil = await prisma.perikananTangkap.findMany({
    where: { status: 'VERIFIED', sumber_data: 'PELABUHAN' }
  });
  const map = {};
  dataRiil.forEach(row => {
    if (!row.tanggal || !row.logistik) return;
    const yyyyMM = row.tanggal.toISOString().substring(0, 7);
    const pelabuhan = row.pelabuhan || 'Lainnya';
    const key = \`\${yyyyMM}|PELABUHAN|\${pelabuhan}\`;
    if (!map[key]) map[key] = {};
    
    try {
      const parsed = JSON.parse(row.logistik);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!map[key][item.nama]) map[key][item.nama] = 0;
          map[key][item.nama] += (parseFloat(item.jumlah) || 0);
        });
      }
    } catch(e) {}
  });
  return map;
};

const getPublikData = async (req, res) =>`;

content = content.replace(/const getPublikData = async \(req, res\) =>/, injectionFunction);

const targetPublik = /res\.status\(200\)\.json\(\{ success: true, data \}\);/g;
content = content.replace(targetPublik, `const logistikBulanan = await getLogistikMap();\n    res.status(200).json({ success: true, data, logistikBulanan });`);

fs.writeFileSync(file, content);
console.log("Updated bulanan controller");
