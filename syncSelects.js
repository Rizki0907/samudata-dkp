const fs = require('fs');

const adminPath = 'client/src/pages/admin/AdminBudidaya.jsx';
const userPath = 'client/src/pages/user/Budidaya.jsx';

let admin = fs.readFileSync(adminPath, 'utf8').replace(/\r\n/g, '\n');
let user = fs.readFileSync(userPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Sync Top 10 select
const adminTop10Select = admin.match(/<select\n\s*value=\{barFilter\}[\s\S]*?<\/select>/)[0];
user = user.replace(/<select\n\s*value=\{barFilter\}[\s\S]*?<\/select>/, adminTop10Select);

// 2. Sync Treemap select
const adminTreemapSelectMatch = admin.match(/<select\n\s*value=\{treemapFilter\}[\s\S]*?<\/select>/);
if (adminTreemapSelectMatch) {
  const adminTreemapSelect = adminTreemapSelectMatch[0];
  user = user.replace(
    /Komposisi Jenis Wadah<\/h2>\n\s*<\/div>\n\s*<\/div>/,
    "Komposisi Jenis Wadah</h2>\n                  </div>\n                  " + adminTreemapSelect + "\n                </div>"
  );
}

fs.writeFileSync(userPath, user);
console.log('UI styles synced');
