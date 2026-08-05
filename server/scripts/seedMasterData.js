require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KAB_KOTA_OPTIONS = [
  "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", 
  "Jombang", "Kediri", "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", 
  "Kota Malang", "Kota Mojokerto", "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya", 
  "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", 
  "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", 
  "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"
];

const PELABUHAN_TO_KABKOTA = {
  'Pelabuhan Perikanan Banyusangka': 'Bangkalan',
  'Pelabuhan Perikanan Bawean': 'Gresik',
  'Pelabuhan Perikanan Branta Pesisir': 'Pamekasan',
  'Pelabuhan Perikanan Bulu': 'Tuban',
  'Pelabuhan Perikanan Camplong': 'Sampang',
  'Pelabuhan Perikanan Campurejo': 'Gresik',
  'Pelabuhan Perikanan Grajagan': 'Banyuwangi',
  'Pelabuhan Perikanan Lekok': 'Pasuruan',
  'Pelabuhan Perikanan Mayangan': 'Kota Probolinggo',
  'Pelabuhan Perikanan Muncar': 'Banyuwangi',
  'Pelabuhan Perikanan Ngemplakrejo': 'Kota Pasuruan',
  'Pelabuhan Perikanan Paiton': 'Probolinggo',
  'Pelabuhan Perikanan Pancer': 'Banyuwangi',
  'Pelabuhan Perikanan Pasongsongan': 'Sumenep',
  'Pelabuhan Perikanan Pondokdadap': 'Malang',
  'Pelabuhan Perikanan Popoh': 'Tulungagung',
  'Pelabuhan Perikanan Puger': 'Jember',
  'Pelabuhan Perikanan Sine': 'Tulungagung',
  'Pelabuhan Perikanan Tambakrejo': 'Blitar',
  'Pelabuhan Perikanan Tamperan': 'Pacitan'
};

const PERAIRAN_OPTIONS = ["Sungai", "Danau", "Waduk", "Rawa", "Genangan"];

const ALAT_TANGKAP_LAUT_OPTIONS = [
  "Pukat cincin pelagis kecil dengan satu kapal", "Pukat cincin pelagis besar dengan satu kapal", "Pukat cincin teri dengan satu kapal", "Pukat cincin pelagis kecil dengan dua kapal", "Jaring lingkar tanpa tali kerut", "Jaring tarik pantai", "Payang", "Jaring tarik berkantong", "Jaring hela udang berkantong", "Jaring hela ikan berkantong", "Penggaruk berkapal", "Penggaruk tanpa kapal", "Anco", "Bagan berperahu atau bagan apung", "Bouke ami", "Bagan tancap", "Jala jatuh berkapal", "Jala tebar", "Jaring insang tetap", "Jaring insang hanyut", "Jaring insang lingkar", "Jaring insang berpancang", "Jaring insang berlapis", "Jaring insang kombinasi", "Set net", "Bubu", "Bubu bersayap", "Pukat labuh", "Togo", "Ambai", "Jermal", "Pengerih", "Sero", "Pancing ulur", "Pancing ulur tuna", "Pancing berjoran", "Pancing cumi", "Pancing cumi mekanis", "Pancing layang- layang", "Huhate", "Huhate mekanis", "Rawai dasar", "Rawai tuna", "Tonda", "Tombak", "Ladung", "Panah", "Pukat dorong", "Seser", "Pocongan"
];

const ALAT_TANGKAP_PUD_OPTIONS = [
  "Jaring tarik berkantong", "Penggaruk berkapal", "Penggaruk tanpa kapal", "Anco", "Bagan berperahu atau bagan apung", "Bagan tancap", "Jala jatuh berkapal", "Jala Tebar", "Jaring insang tetap", "Jaring Insang hanyut", "Jaring insang lingkar", "Jaring insang berpancang", "Jaring insang berlapis", "Jaring insang kombinasi", "Set net", "Bubu", "Pancing ulur", "Pancing berjoran", "Rawai", "Tombak", "Ladung", "Panah", "Pukat dorong", "Seser", "Pocongan"
];

const KOMODITAS_LAUT_OPTIONS = [
  "Teri", "Teri nasi", "Belanak", "Bentong", "Cendro", "Daun bambu/Talang-talang", "Ikan terbang", "Japuh", "Julung-julung", "Banyar", "Kembung", "Layang anggur/Malalugis", "Layang deles", "Layang biru", "Layang benggol", "Lemuru", "Siro", "Selar komo", "Selar hijau", "Selar kuning", "Sunglir", "Tembang", "Selanget", "Terubuk", "Tetengkek", "Semar", "Bandeng", "Nike", "Albakora (ALB)", "Tuna mata besar (BET)", "Tuna sirip biru selatan (SBT)", "Tuna gigi anjing", "Madidihang (YFT)", "Tongkol abu-abu (LOT)", "Tongkol komo (KAW)", "Tongkol krai (FRI)", "Lisong (BLT)", "Kenyar", "Slengseng", "Cakalang (SKJ)", "Lemadang", "Ikan Layaran (SFA)", "Ikan pedang (SWO)", "Ikan Tumbuk (SSP)", "Setuhuk biru (BUM)", "Setuhuk hitam (BLM)", "Setuhuk loreng (MLS)", "Tenggiri (COM)", "Tenggiri papan (GUT)", "Nyunglas (WAH)", "Ikan Gindara", "Ikan gergaji", "Cucut botol (PSK)", "Cucut Koboi (OCS)", "Cucut lanyam (FAL)", "Cucut Macan (TIG)", "Cucut martil/Capingan (SPN)", "Cucut Selendang (BSH)", "Cucut tikus/Cucut monyet (THR)", "Mako (MAK)", "Ikan Paus (RHN)", "Manyung", "Ikan sebelah", "Lolosi biru", "Kuwe", "Bawal hitam", "Bawal putih", "Golok golok", "Bawal belang", "Beloso/Buntut kerbo", "Ikan lidah", "Gerot-gerot", "Ikan gaji", "Ikan nomei/Lomei", "Kapas-kapas", "Peperek", "Lencam", "Kakap putih", "Kakap batu", "Kakap Sawo", "Kakap merah/Bambangan", "Jenaha", "Trisi", "Pinjalo", "Kurisi", "Kuniran", "Biji nangka", "Biji nangka karang", "Kurau", "Kuro/Senangin", "Swanggi/Mata besar", "Serinding tembakau", "Gulamah/Tigawaja", "Rejung", "Alu-alu/Manggilala/Pucul", "Senuk", "Kerong-kerong", "Layur", "Pari kembang/Pari macan (PSL)", "Pari kelelawar (MAN)", "Pari burung", "Pari hidung sekop", "Pari kekeh", "Remang/Cunang/Pucuk nipah", "Gabus", "Samgeh", "Kambing-kambing/Ayam-ayam", "Sembilang", "Opah", "Ekor kuning/Pisang-pisang", "Ikan napoleon", "Kerapu karang", "Kerapu bebek", "Kerapu balong", "Kerapu lumpur", "Kerapu sunu", "Beronang lingkis", "Beronang kuning", "Ikan Beronang", "Kakak Tua", "Udang dogol", "Udang putih/Jerbung", "Udang krosok", "Udang ratu/raja", "Udang windu", "Udang barong/Udang karang", "Udang kipas", "Udang ketak", "Lobster mutiara", "Lobster pakistan", "Lobster pasir", "Lobster bambu", "Lobster batik", "Lobster batu", "Kepiting", "Rajungan", "Kerang darah", "Kerang hijau", "Kerang mutiara/Tapis-tapis"
];

const KOMODITAS_PUD_OPTIONS = [
  "Betok", "Sidat", "Belut", "Baung", "Tapah", "Keting", "Sepat rawa", "Sepat siam", "Gabus", "Toman", "Mujair", "Nila", "Lele", "Botia", "Berukung", "Beunteur", "Bilih", "Depik", "Genggehek", "Uceng", "Hampal", "Jelawat", "Kancera", "Kendia", "Koan", "Lalang", "Lalawak", "Lukas", "Mas", "Nilem", "Parang", "Parai/Seluang", "Repang", "Salab/Lampan", "Semah", "Seren", "Tawes", "Tontong tebu", "Betutu", "Tambakan", "Sili", "Belida", "Gurame", "Siluk", "Patin jambal", "Udang grago", "Udang galah", "Buaya", "Katak benggala"
];

const PERBEKALAN_OPTIONS = [
  { nama: 'Es', satuan: 'Kilogram' }, { nama: 'Air', satuan: 'Liter' }, { nama: 'Solar', satuan: 'Liter' }, { nama: 'Oli', satuan: 'Liter' }, { nama: 'Bensin', satuan: 'Liter' }, { nama: 'Umpan', satuan: 'Kilogram' }, { nama: 'Garam', satuan: 'Kilogram' }, { nama: 'Beras', satuan: 'Kilogram' }, { nama: 'Gula', satuan: 'Kilogram' }, { nama: 'Minyak Goreng', satuan: 'Liter' }, { nama: 'Rokok', satuan: 'Press' }, { nama: 'Freon', satuan: 'Tabung' }, { nama: 'Gas LPG 3 Kg', satuan: 'Tabung' }, { nama: 'Gas LPG 12 Kg', satuan: 'Tabung' }
];

async function seed() {
  console.log('Mulai seeding data master...');

  // 1. KAB_KOTA
  for (const kk of KAB_KOTA_OPTIONS) {
    await insertIfNotExist('KAB_KOTA', kk);
  }

  // 2. PELABUHAN (with relation to KAB_KOTA via metadata)
  for (const [pelabuhan, kabKota] of Object.entries(PELABUHAN_TO_KABKOTA)) {
    await insertIfNotExist('PELABUHAN', pelabuhan, { kab_kota: kabKota });
  }

  // 3. JENIS_PERAIRAN
  for (const p of PERAIRAN_OPTIONS) {
    await insertIfNotExist('JENIS_PERAIRAN', p);
  }

  // 4. ALAT_TANGKAP (gabungan laut & PUD untuk simpelnya, atau dipisah)
  const alatTangkap = new Set([...ALAT_TANGKAP_LAUT_OPTIONS, ...ALAT_TANGKAP_PUD_OPTIONS]);
  for (const at of Array.from(alatTangkap)) {
    await insertIfNotExist('ALAT_TANGKAP', at);
  }

  // 5. KOMODITAS_TANGKAP_LAUT
  for (const kl of KOMODITAS_LAUT_OPTIONS) {
    await insertIfNotExist('KOMODITAS_TANGKAP_LAUT', kl);
  }

  // 6. KOMODITAS_TANGKAP_PUD
  for (const kp of KOMODITAS_PUD_OPTIONS) {
    await insertIfNotExist('KOMODITAS_TANGKAP_PUD', kp);
  }

  // 7. PERBEKALAN
  for (const perb of PERBEKALAN_OPTIONS) {
    await insertIfNotExist('PERBEKALAN', perb.nama, { satuan: perb.satuan });
  }

  console.log('Seeding selesai!');
}

async function insertIfNotExist(category, value, metadata = null) {
  try {
    await prisma.masterData.upsert({
      where: {
        category_value: { category, value }
      },
      update: {
        metadata: metadata
      },
      create: {
        category,
        value,
        metadata
      }
    });
  } catch (err) {
    console.error(`Gagal insert ${category} - ${value}:`, err.message);
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
