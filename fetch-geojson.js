import https from 'https';
import fs from 'fs';
import path from 'path';

const url = 'https://raw.githubusercontent.com/TheMaggieSimpson/IndonesiaGeoJSON/master/kota-kabupaten.json';

https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      console.log('Got GeoJSON with', geojson.features.length, 'features');
      
      const jatimFeatures = geojson.features.filter(f => {
        // Find property that matches Jawa Timur
        const propStr = JSON.stringify(f.properties).toLowerCase();
        return propStr.includes('jawa timur');
      });

      console.log('Found', jatimFeatures.length, 'Jatim regencies');

      const jatimGeojson = {
        type: 'FeatureCollection',
        features: jatimFeatures
      };

      fs.writeFileSync(
        path.join(process.cwd(), 'client', 'src', 'assets', 'jawa_timur.json'), 
        JSON.stringify(jatimGeojson)
      );
      console.log('Successfully saved Jawa Timur GeoJSON.');
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('Error fetching GeoJSON:', e.message);
});
