const fs = require('fs');

// 1. Fix AdminBudidaya.jsx Treemap Logic
let admin = fs.readFileSync('client/src/pages/admin/AdminBudidaya.jsx', 'utf8').replace(/\r\n/g, '\n');

admin = admin.replace(
  /const komposisiWadah = Object\.entries\(wadahMap\)\n\s*\.map\(\(\[name, value\]\) => \(\{ name, value \}\)\)\n\s*\.sort\(\(a, b\) => b\.value - a\.value\);/g,
  "const komposisiWadah = Object.entries(wadahMap)\n      .map(([name, s]) => ({ name, produksi: s.produksi, nilai: s.nilai }));"
);

admin = admin.replace(
  /const data = computedStats\.komposisiWadah\.map\(w => \(\{ name: w\.name, value: w\.value \}\)\);/g,
  "const data = computedStats.komposisiWadah.map(w => ({ name: w.name, value: w[treemapFilter] || 0 })).sort((a, b) => b.value - a.value);"
);

// 2. Read Budidaya.jsx and sync it
let user = fs.readFileSync('client/src/pages/user/Budidaya.jsx', 'utf8').replace(/\r\n/g, '\n');

// Sync Komposisi Wadah Stats
user = user.replace(
  /const komposisiWadah = Object\.entries\(wadahMap\)\n\s*\.map\(\(\[name, value\]\) => \(\{ name, value: value\.produksi \}\)\)\n\s*\.sort\(\(a, b\) => b\.value - a\.value\);/g,
  "const komposisiWadah = Object.entries(wadahMap)\n      .map(([name, s]) => ({ name, produksi: s.produksi, nilai: s.nilai }));"
);

user = user.replace(
  /const data = stats\.komposisiWadah\.map\(w => \(\{\n\s*name: w\.name,\n\s*value: w\.value\n\s*\}\)\);/g,
  "const data = stats.komposisiWadah.map(w => ({ name: w.name, value: w[treemapFilter] || 0 })).sort((a, b) => b.value - a.value);"
);

fs.writeFileSync('client/src/pages/admin/AdminBudidaya.jsx', admin);
fs.writeFileSync('client/src/pages/user/Budidaya.jsx', user);
console.log('Fixed Treemap logic');
