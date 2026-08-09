require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATA_MAP = {
  KAB_KOTA: [
    "Bangkalan", "Banyuwangi", "Blitar", "Bojonegoro", "Bondowoso", "Gresik", "Jember", 
    "Jombang", "Kediri", "Kota Batu", "Kota Blitar", "Kota Kediri", "Kota Madiun", 
    "Kota Malang", "Kota Mojokerto", "Kota Pasuruan", "Kota Probolinggo", "Kota Surabaya", 
    "Lamongan", "Lumajang", "Madiun", "Magetan", "Malang", "Mojokerto", "Nganjuk", "Ngawi", 
    "Pacitan", "Pamekasan", "Pasuruan", "Ponorogo", "Probolinggo", "Sampang", "Sidoarjo", 
    "Situbondo", "Sumenep", "Trenggalek", "Tuban", "Tulungagung"
  ],
  PROVINSI: ["Jawa Timur"],
  PELABUHAN: [
    { name: 'Pelabuhan Perikanan Banyusangka', meta: { kab_kota: 'Bangkalan' } },
    { name: 'Pelabuhan Perikanan Bawean', meta: { kab_kota: 'Gresik' } },
    { name: 'Pelabuhan Perikanan Branta Pesisir', meta: { kab_kota: 'Pamekasan' } },
    { name: 'Pelabuhan Perikanan Bulu', meta: { kab_kota: 'Tuban' } },
    { name: 'Pelabuhan Perikanan Camplong', meta: { kab_kota: 'Sampang' } },
    { name: 'Pelabuhan Perikanan Campurejo', meta: { kab_kota: 'Gresik' } },
    { name: 'Pelabuhan Perikanan Grajagan', meta: { kab_kota: 'Banyuwangi' } },
    { name: 'Pelabuhan Perikanan Lekok', meta: { kab_kota: 'Pasuruan' } },
    { name: 'Pelabuhan Perikanan Mayangan', meta: { kab_kota: 'Kota Probolinggo' } },
    { name: 'Pelabuhan Perikanan Muncar', meta: { kab_kota: 'Banyuwangi' } },
    { name: 'Pelabuhan Perikanan Ngemplakrejo', meta: { kab_kota: 'Kota Pasuruan' } },
    { name: 'Pelabuhan Perikanan Paiton', meta: { kab_kota: 'Probolinggo' } },
    { name: 'Pelabuhan Perikanan Pancer', meta: { kab_kota: 'Banyuwangi' } },
    { name: 'Pelabuhan Perikanan Pasongsongan', meta: { kab_kota: 'Sumenep' } },
    { name: 'Pelabuhan Perikanan Pondokdadap', meta: { kab_kota: 'Malang' } },
    { name: 'Pelabuhan Perikanan Popoh', meta: { kab_kota: 'Tulungagung' } },
    { name: 'Pelabuhan Perikanan Puger', meta: { kab_kota: 'Jember' } },
    { name: 'Pelabuhan Perikanan Sine', meta: { kab_kota: 'Tulungagung' } },
    { name: 'Pelabuhan Perikanan Tambakrejo', meta: { kab_kota: 'Blitar' } },
    { name: 'Pelabuhan Perikanan Tamperan', meta: { kab_kota: 'Pacitan' } }
  ],
  JENIS_PERAIRAN: ["Sungai", "Danau", "Waduk", "Rawa", "Genangan"],
  KOMODITAS_TANGKAP_LAUT: [
    "Teri", "Teri nasi", "Belanak", "Bentong", "Cendro", "Daun bambu/Talang-talang", "Ikan terbang", "Japuh", 
    "Julung-julung", "Banyar", "Kembung", "Layang anggur/Malalugis", "Layang deles", "Layang biru", "Layang benggol", 
    "Lemuru", "Siro", "Selar komo", "Selar hijau", "Selar kuning", "Sunglir", "Tembang", "Selanget", "Terubuk", 
    "Tetengkek", "Semar", "Bandeng", "Albakora (ALB)", "Tuna mata besar (BET)", "Tuna sirip biru selatan (SBT)", 
    "Madidihang (YFT)", "Tongkol abu-abu (LOT)", "Tongkol komo (KAW)", "Cakalang (SKJ)", "Tenggiri (COM)", 
    "Kakap merah/Bambangan", "Kerapu karang", "Kerapu sunu", "Bawal putih", "Bawal hitam", "Udang windu", 
    "Udang vaname", "Lobster mutiara", "Lobster pasir", "Rajungan", "Kepiting", "Cumi-cumi", "Sotong", "Gurita"
  ],
  KOMODITAS_TANGKAP_PUD: [
    "Betok", "Sidat", "Belut", "Baung", "Tapah", "Keting", "Sepat rawa", "Sepat siam", "Gabus", "Toman", 
    "Mujair", "Nila", "Lele", "Mas", "Tawes", "Gurame", "Patin jambal", "Udang galah"
  ],
  ALAT_TANGKAP_LAUT: [
    "Pukat cincin pelagis kecil dengan satu kapal", "Pukat cincin pelagis besar dengan satu kapal", 
    "Jaring lingkar tanpa tali kerut", "Jaring tarik pantai", "Payang", "Jaring tarik berkantong", 
    "Jaring hela udang berkantong", "Jaring hela ikan berkantong", "Bagan berperahu atau bagan apung", 
    "Bagan tancap", "Jala jatuh berkapal", "Jaring insang tetap", "Jaring insang hanyut", 
    "Set net", "Bubu", "Bubu bersayap", "Sero", "Pancing ulur", "Pancing ulur tuna", 
    "Huhate", "Rawai dasar", "Rawai tuna", "Tonda"
  ],
  ALAT_TANGKAP_PUD: [
    "Jaring tarik berkantong", "Penggaruk berkapal", "Penggaruk tanpa kapal", "Anco", 
    "Bagan tancap", "Jala Tebar", "Jaring insang tetap", "Jaring insang hanyut", "Bubu", "Pancing ulur"
  ],
  GT_KAPAL_LAUT: [
    "GT < 5", "GT 6 - 10", "GT 11 - 20", "GT 21 - 30", "GT 31 - 50", "GT 51 - 100", 
    "GT 101 - 200", "GT 201 - 300", "GT 301 - 500", "GT 501 - 1000", "GT > 1000"
  ],
  JENIS_PERAHU_PUD: [
    "Perahu Tanpa Motor", "Motor Tempel < 5 GT", "Motor Tempel 5-10 GT", "Kapal Motor < 5 GT", "Kapal Motor 5-10 GT"
  ],
  PERBEKALAN: [
    { name: 'Es', meta: { satuan: 'Kilogram' } },
    { name: 'Air', meta: { satuan: 'Liter' } },
    { name: 'Solar', meta: { satuan: 'Liter' } },
    { name: 'Oli', meta: { satuan: 'Liter' } },
    { name: 'Bensin', meta: { satuan: 'Liter' } },
    { name: 'Umpan', meta: { satuan: 'Kilogram' } },
    { name: 'Garam', meta: { satuan: 'Kilogram' } },
    { name: 'Beras', meta: { satuan: 'Kilogram' } },
    { name: 'Gula', meta: { satuan: 'Kilogram' } },
    { name: 'Minyak Goreng', meta: { satuan: 'Liter' } }
  ],
  WPP: [
    "WPP 571", "WPP 572", "WPP 573", "WPP 711", "WPP 712", "WPP 713", 
    "WPP 714", "WPP 715", "WPP 716", "WPP 717", "WPP 718"
  ],
  KOMODITAS_BUDIDAYA: [
    "Ikan Lele", "Ikan Nila", "Ikan Gurame", "Ikan Bandeng", "Udang Vaname", 
    "Udang Windu", "Rumput Laut", "Ikan Patin", "Ikan Mas", "Ikan Kakap Putih", "Ikan Kerapu"
  ],
  JENIS_WADAH: [
    "Kolam Tanah", "Kolam Beton", "Kolam Terpal", "Tambak", 
    "Keramba Jaring Apung (KJA)", "Keramba Jaring Tancap (KJT)", "Minapadi", "Rumput Laut / Laut"
  ],

  // ================== BIDANG: PENGOLAHAN DAN PEMASARAN ==================
  // Kategori berikut HARUS sama persis (value-nya) dengan CATEGORY_MAP
  // di MasterData.jsx pada key 'Pengolahan dan Pemasaran', supaya form
  // input & tampilan otomatis sinkron saat master data ditambah/diedit.

  KABUPATEN_KOTA: [
    'KAB. PACITAN', 'KAB. PONOROGO', 'KAB. TRENGGALEK', 'KAB. TULUNGAGUNG',
    'KAB. BLITAR', 'KAB. KEDIRI', 'KAB. MALANG', 'KAB. LUMAJANG', 'KAB. JEMBER',
    'KAB. BANYUWANGI', 'KAB. BONDOWOSO', 'KAB. SITUBONDO', 'KAB. PROBOLINGGO',
    'KAB. PASURUAN', 'KAB. SIDOARJO', 'KAB. MOJOKERTO', 'KAB. JOMBANG',
    'KAB. NGANJUK', 'KAB. MADIUN', 'KAB. MAGETAN', 'KAB. NGAWI', 'KAB. BOJONEGORO',
    'KAB. TUBAN', 'KAB. LAMONGAN', 'KAB. GRESIK', 'KAB. BANGKALAN', 'KAB. SAMPANG',
    'KAB. PAMEKASAN', 'KAB. SUMENEP', 'KOTA KEDIRI', 'KOTA BLITAR', 'KOTA MALANG',
    'KOTA PROBOLINGGO', 'KOTA PASURUAN', 'KOTA MOJOKERTO', 'KOTA MADIUN',
    'KOTA SURABAYA', 'KOTA BATU',
  ],
  JENIS_PENGOLAHAN: [
    'Fermentasi',
    'Pelumatan Daging Ikan',
    'Pembekuan',
    'Pemindangan',
    'Penanganan Produk Segar',
    'Pengalengan',
    'Pengasapan/ Pemanggangan',
    'Pereduksian/ Ekstraksi',
    'Penggaraman/ Pengeringan',
    'Pengolahan Lainnya',
  ],
  JENIS_PEMASARAN: [
    'Pengecer',
    'Pengumpul/ Pedagang Besar/ Distributor',
  ],
  KATEGORI_SKALA_USAHA: [
    'Mikro', 'Kecil', 'Menengah', 'Besar'
  ],
  SERTIFIKAT_PRODUK: [
    'HACCP', 'SNI', 'HALAL', 'SKP', 'PIRT', 'MD', 'Lainnya'
  ],
  IZIN_USAHA: [
    'NIB', 'NPWP', 'KUSUKA', 'Pengesahan MENHUKAM', 'Akta Pendirian Usaha',
    'Lokasi / Domisili', 'IMB', 'SIUP Perikanan', 'SIUP Perdagangan', 'Lain-lain'
  ],
  SERTIFIKAT_LAHAN_BANGUNAN: [
    'Sertifikat Hak Milik (SHM)', 'Non SHM (Sewa / Girik / HGB / DLL)'
  ],
  // ========================================================================

  BENTUK_PRODUK: [
    "Utuh / Whole", "Siap Masak / Ready to Cook", "Siap Saji / Ready to Eat", 
    "Fillet / Loin", "Surimi / Lumat", "Kering / Bubuk", "Cair / Minyak"
  ],
  KOMODITAS_EKSPOR: [
    "Udang (Shrimp)", "Tuna, Cakalang, Tongkol", "Rajungan dan Kepiting", 
    "Cumi-cumi, Sotong, Gurita", "Rumput Laut (Seaweed)", "Ikan Karang (Kerapu, Kakap)", 
    "Demersal / Ikan Dasar", "Ikan Hias Air Laut", "Ikan Hias Air Tawar"
  ],
  KATEGORI_KOMODITAS_EKSPOR: [
    "Crustacea (Udang & Kepiting)", "Pelagis Besar (Tuna & Cakalang)", 
    "Mollusca (Cumi & Gurita)", "Rumput Laut & Olahan", "Ikan Demersal & Karang", "Ikan Hias"
  ],
  NEGARA_TUJUAN: [
    "Amerika Serikat", "Tiongkok (China)", "Jepang", "Negara-Negara ASEAN", 
    "Uni Eropa", "Timur Tengah", "Australia", "Korea Selatan", "Taiwan", "Inggris"
  ],
  SATUAN_VOLUME: [
    "Kilogram", "Ton", "Kuintal", "Pcs", "Box / Karton", "Kontainer / TEUs"
  ],
  JENIS_GARAM: [
    "Garam Krosok / Konsumsi (K1)", "Garam Krosok / Konsumsi (K2)", "Garam Krosok (K3)", 
    "Garam Industri", "Garam Halus / Meja", "Garam Spa / Kesehatan"
  ],
  KATEGORI_PETAMBAK: [
    "Petambak Mandiri / Perorangan", "Kelompok Petambak Garam (KUGAR)", 
    "Koperasi Petambak Garam", "Perusahaan Swasta / Badan Usaha", "PT Garam (Persero)"
  ]
};

async function seedAll() {
  console.log('Mulai seeding cepat (createMany) seluruh kategori Master Data...');
  for (const [cat, list] of Object.entries(DATA_MAP)) {
    const existingRows = await prisma.masterData.findMany({
      where: { category: cat },
      select: { value: true }
    });
    const existingSet = new Set(existingRows.map(r => r.value));
    
    const toCreate = [];
    for (const item of list) {
      const val = typeof item === 'object' ? item.name : item;
      const meta = typeof item === 'object' ? item.meta : {};
      if (!existingSet.has(val)) {
        toCreate.push({
          category: cat,
          value: val,
          metadata: meta
        });
      }
    }

    if (toCreate.length > 0) {
      await prisma.masterData.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      console.log(` - Seeding ${cat}: ${toCreate.length} baris baru ditambahkan.`);
    } else {
      console.log(` - Seeding ${cat}: sudah lengkap (${existingSet.size} baris).`);
    }
  }
  console.log('Seluruh Master Data selesai diseed dengan sukses!');
}

seedAll()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });