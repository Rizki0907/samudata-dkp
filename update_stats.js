const fs = require('fs');
const file = 'server/src/controllers/perikananTangkap.controller.js';
let content = fs.readFileSync(file, 'utf8');

const targetAgg = /\/\/\s*Format output/g;

const injectionAgg = `    // Fetch adjusted data from DataBulananTangkap to correct the visualization
    let adjustedWhere = { is_adjusted: true };
    if (startDate && endDate) {
      const startBulan = new Date(startDate).toISOString().substring(0, 7);
      const endBulan = new Date(endDate).toISOString().substring(0, 7);
      adjustedWhere.bulan = {
        gte: startBulan,
        lte: endBulan
      };
    }

    const adjustedData = await prisma.dataBulananTangkap.findMany({
      where: adjustedWhere
    });

    adjustedData.forEach(adj => {
      const dV = adj.volume - adj.original_volume;
      const dN = adj.nilai - adj.original_nilai;
      
      totalVolume += dV;
      totalNilai += dN;
      
      const p = adj.pelabuhan;
      const k = adj.komoditas;
      const tgl = adj.bulan;
      
      if (!byKomoditasMap[k]) byKomoditasMap[k] = 0;
      byKomoditasMap[k] += dV;
      
      if (!byPelabuhanMap[p]) byPelabuhanMap[p] = 0;
      byPelabuhanMap[p] += dV;
      
      if (!byTanggalMap[tgl]) byTanggalMap[tgl] = { volume: 0, nilai: 0 };
      byTanggalMap[tgl].volume += dV;
      byTanggalMap[tgl].nilai += dN;
    });

    // Format output`;

if (content.match(targetAgg)) {
  content = content.replace(targetAgg, injectionAgg);
  fs.writeFileSync(file, content);
  console.log("Successfully updated getStats logic");
} else {
  console.log("Failed to find target");
}
