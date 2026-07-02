const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const randomLogistik = [
  "Es 20 Balok, Solar 100 Liter, Air 50 Liter",
  "Es 10 Balok, Umpan 5 Kg, Beras 10 Kg",
  "Solar 200 Liter, Olie 5 Liter",
  "Bensin 50 Liter, Umpan 10 Kg",
  "Es 15 Balok, Air 100 Liter, Gas LPG 1 Tabung",
  "Solar 300 Liter, Es 30 Balok",
  "Air 50 Liter, Umpan 2 Kg",
  "Beras 25 Kg, Es 5 Balok"
];

async function main() {
  const records = await prisma.perikananTangkap.findMany({
    where: { logistik: null }
  });

  console.log(`Ditemukan ${records.length} record yang belum memiliki data logistik.`);

  let updated = 0;
  for (const record of records) {
    const randomL = randomLogistik[Math.floor(Math.random() * randomLogistik.length)];
    
    // Assign logistik ONLY if sumber_data is PELABUHAN. If not pelabuhan, just assign empty string or '-'
    const logistikVal = record.sumber_data === 'PELABUHAN' ? randomL : '-';

    await prisma.perikananTangkap.update({
      where: { id: record.id },
      data: { logistik: logistikVal }
    });
    updated++;
  }

  console.log(`Berhasil mengupdate ${updated} record.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
