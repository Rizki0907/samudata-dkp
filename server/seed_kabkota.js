require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KAB_KOTA dummy data...');
  
  const kabKotaList = ['Bangkalan', 'Banyuwangi', 'Gresik', 'Lamongan', 'Tuban'];
  const wppList = ['711', '712', '713', '718'];
  const pantaiList = ['Pantai Kelapa', 'Pantai Boom', 'Pantai Prigi', 'Pelabuhan Rakyat X'];
  
  const komoditasPool = [
    'Tuna',
    'Cakalang',
    'Tongkol',
    'Kembung',
    'Tenggiri'
  ];
  
  const alatTangkapPool = ['Pancing Ulur', 'Jaring Insang Hanyut', 'Bubu', 'Rawai Dasar'];
  const gtPool = [
    'Perahu Tanpa Motor', 
    'Motor Tempel < 5 GT', 
    'Motor Tempel 5-10 GT', 
    'Kapal Motor < 5 GT', 
    'Kapal Motor 5-10 GT'
  ];
  
  const dateOptions = ['2026-06-01T00:00:00Z', '2026-06-15T00:00:00Z', '2026-07-01T00:00:00Z', '2026-07-02T00:00:00Z'];

  for (let i = 0; i < 20; i++) {
    const pIndex = Math.floor(Math.random() * pantaiList.length);
    const kIndex = Math.floor(Math.random() * kabKotaList.length);
    const wIndex = Math.floor(Math.random() * wppList.length);
    const dIndex = Math.floor(Math.random() * dateOptions.length);
    const tangkapan = [];
    const numKomoditas = Math.floor(Math.random() * 3) + 1;
    let availableKom = [...komoditasPool];
    
    const populasiAlat = Math.floor(Math.random() * 50) + 10;
    const jumlahSampel = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < numKomoditas; j++) {
      const idx = Math.floor(Math.random() * availableKom.length);
      const kom = availableKom[idx];
      availableKom.splice(idx, 1);
      
      const sampelVol = Math.floor(Math.random() * 100) + 20;
      const volume = (sampelVol / jumlahSampel) * populasiAlat;
      const harga = (Math.floor(Math.random() * 30) + 10) * 1000;
      
      tangkapan.push({ 
        komoditas: kom, 
        volume, 
        harga, 
        nilai: volume * harga,
        pud_tangkapan_sampel: sampelVol
      });
    }

    await prisma.perikananTangkap.create({
      data: {
        sumber_data: 'KAB_KOTA',
        tanggal: new Date(dateOptions[dIndex]),
        kabupaten_kota: kabKotaList[kIndex],
        pelabuhan: pantaiList[pIndex], // Perairan Pantai
        jenis_perairan: wppList[wIndex], // WPP
        pud_populasi_alat: populasiAlat,
        pud_jumlah_sampel: jumlahSampel,
        gt_kapal: gtPool[Math.floor(Math.random() * gtPool.length)],
        alat_tangkap: alatTangkapPool[Math.floor(Math.random() * alatTangkapPool.length)],
        status: 'APPROVED',
        tangkapan: { create: tangkapan }
      }
    });
  }
  console.log('Seeded 20 KAB_KOTA dummy data');
}

main().catch(console.error).finally(() => prisma.$disconnect());
