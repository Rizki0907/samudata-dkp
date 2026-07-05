const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const sumberDataOptions = ['PELABUHAN', 'PUD', 'KAB_KOTA'];
const pelabuhanOptions = [
  'Pelabuhan Perikanan Mayangan',
  'Pelabuhan Perikanan Muncar',
  'Pelabuhan Perikanan Pondokdadap',
  'Pelabuhan Perikanan Grajagan'
];
const kapalNames = ['Berkah Makmur', 'Kembali Jaya', 'KMN Nelayan 5', 'KMN Nelayan 11'];
const alatTangkapOptions = ['Payang', 'Jaring Insang Hanyut', 'Rawai Dasar', 'Pancing Ulur'];
const komoditasOptions = ['Layang (Decapterus spp)', 'Cakalang (Katsuwonus pelamis)', 'Tongkol (Euthynnus spp)', 'Tuna (Thunnus spp)'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting seed for Perikanan Tangkap (Jan 2025 - Aug 2026)...');

  const startYear = 2025;
  const startMonth = 0; // Jan
  const endYear = 2026;
  const endMonth = 7; // Aug

  let currentYear = startYear;
  let currentMonth = startMonth;

  let tripsCreated = 0;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    // Buat 2-3 trip per bulan
    const tripsThisMonth = randomInt(2, 3);
    
    for (let i = 0; i < tripsThisMonth; i++) {
      const day = randomInt(1, 28);
      const date = new Date(Date.UTC(currentYear, currentMonth, day, 8, 0, 0));
      
      const sumber = randomElement(sumberDataOptions);
      const pelabuhan = randomElement(pelabuhanOptions);

      // Tangkapan: 2 komoditas per trip
      const tangkapan = [
         {
           komoditas: randomElement(komoditasOptions),
           volume: randomInt(100, 1500),
           harga: randomInt(15, 45) * 1000
         },
         {
           komoditas: randomElement(komoditasOptions),
           volume: randomInt(50, 800),
           harga: randomInt(20, 60) * 1000
         }
      ].map(t => ({
         ...t,
         nilai: t.volume * t.harga
      }));

      await prisma.perikananTangkap.create({
        data: {
          sumber_data: sumber,
          tanggal: date,
          jam_labuh: '06:00',
          jam_bongkar: '09:00',
          pelabuhan: pelabuhan,
          kabupaten_kota: pelabuhan.split(' ').pop(),
          nama_kapal: randomElement(kapalNames),
          gt_kapal: `GT ${randomInt(10, 30)}`,
          alat_tangkap: randomElement(alatTangkapOptions),
          logistik: 'Es, Air, Solar',
          status: 'APPROVED',
          tangkapan: {
            create: tangkapan
          }
        }
      });
      tripsCreated++;
    }

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  console.log(`Seeding complete. Created ${tripsCreated} trips.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
