import fs from 'fs';
import path from 'path';

const geojsonPath = path.join(process.cwd(), 'client', 'src', 'assets', 'jawa_timur.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

geojson.features.forEach(f => {
  const name2 = f.properties.NAME_2; // e.g., 'Bangkalan', 'Surabaya'
  const type2 = f.properties.TYPE_2; // e.g., 'Kabupaten', 'Kota'
  
  let formattedName = name2;
  if (type2 === 'Kota') {
    formattedName = 'Kota ' + name2;
  }
  
  // Set properties.name for ECharts mapping
  f.properties.name = formattedName;
});

fs.writeFileSync(geojsonPath, JSON.stringify(geojson));
console.log('Formatted GeoJSON for ECharts.');
