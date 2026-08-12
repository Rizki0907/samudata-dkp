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
  "Albakora (Thunnus alalunga)",
  "Alu- alu (Sphyraena qenie)",
  "Alu-alu (Sphyraena barracuda)",
  "Alu-alu (Sphyraena obtusata)",
  "Anggoli (Etelis coruscans)",
  "Aruan tasek (Rachycentron canadum )",
  "Baji-baji sebra (Seriolina nigrofasciata )",
  "Bambangan (Lutjanus malabaricus)",
  "Barakuda (Sphyraena jello)",
  "Baronang (Siganus javus)",
  "Baronang lingkis  (Siganus canaliculatus)",
  "Bawal (Colossoma macropomum)",
  "Bawal hitam (Parastromateus niger)",
  "Bawal putih  (Pampus argenteus)",
  "Bawal sabit (Taractichthys steindachneri)",
  "Belanak (Mugil cephalus)",
  "Beloso (Saurida tumbil)",
  "Biji nangka (Upeneus moluccensis)",
  "Biji nangka (Upeneus spp)",
  "Bulan - Bulan (Megalops cyprinoides)",
  "Buntal karang (Diodon hystrix)",
  "Butana (Acanthurus mata)",
  "Cakalang (Katsuwonus pelamis)",
  "Cendro (Belonidae)",
  "Cendro (Tylosurus crocodilus)",
  "Cipa-cipa (Argyrops spinifer)",
  "Cobia (Rachycentron canadum )",
  "Coklatan (Scolopsis affinis)",
  "Cucut baster (Isurus paucus)",
  "Cucut lanjam (Carcharhinus cautus)",
  "Cucut lanjam (Carcharhinus melanopterus)",
  "Cucut mako (Isurus spp)",
  "Cucut martil (Eusphyra blochii)",
  "Cumi karet (Sthenoteuthis oualaniensis)",
  "Cumi-cumi (Loligo chinensis)",
  "Cumi-cumi (Loligo duvauceli)",
  "Cumi-cumi (Loligo edulis)",
  "Cumi-cumi (Loligo spp)",
  "Cumi-cumi (Loligo vulgaris)",
  "Gemprang (Ilisha elongata)",
  "Gerot-gerot (Pomadasys argenteus)",
  "Gerot-gerot (Pomadasys argyreus)",
  "Gindara (Ruvettus pretiosus)",
  "Golok-golok (Chirocentrus dorab)",
  "Gorara (Lutjanus russelli)",
  "Gorara gigi (Lutjanus erythropterus)",
  "Gulamah (Gymnocranius griseus)",
  "Gulamah (Johnius coitor)",
  "Gulamah (Otolithes ruber)",
  "Gulamah (Panna microdon)",
  "Gulamah (Pennahia argentata)",
  "Gulamah keken (Johnius amblycephalus)",
  "Gulamah papan (Chrysochir aureus)",
  "Gulamah putih (Johnius borneensis)",
  "Gurita (Octopus spp)",
  "Hiu air (Scoliodon laticaudus)",
  "Hiu bongol (Chiloscyllium punctatum)",
  "Hiu lanjam (Carcharhinus amblyrhynchoides )",
  "Hiu lonjor (Carcharhinus spp)",
  "Hiu putik (Mustelus manazo)",
  "Hiu tokek (Atelomycterus marmoratus)",
  "Ikan ayam-ayam (Abalistes stellaris)",
  "Ikan jaket (Aluterus monoceros)",
  "Ikan kakatua (Scarus spp)",
  "Ikan lainnya",
  "Ikan layaran (Istiophorus platypterus)",
  "Ikan lemah (Lactarius lactarius)",
  "Ikan merah (Lutjanus erythropterus)",
  "Ikan pedang (Xiphias gladius)",
  "Ikan sebelah (Psettodes erumei)",
  "Ikan sebelah mata kanan (Poecilopsetta colorata)",
  "Ikan Setan (Lepidocybium flavobrunneum)",
  "Jambian (Lutjanus lutjanus)",
  "Japuh (Dussumieria acuta)",
  "Kaci-kaci (Diagramma labiosum)",
  "Kaci-kaci (Plectorhinchus flavomaculatus",
  "Kaci-kaci (Plectorhinchus spp)",
  "Kakap (Choerodon anchorago)",
  "Kakap jenaha (Lutjanus johnii)",
  "Kakap Merah (Lutjanus bitaeniatus)",
  "Kakap merah (Lutjanus spp)",
  "Kakap merah (Lutjanus timorensis)",
  "Kapas-Kapas (Gerres filamentosus)",
  "Kapas-kapas (Lutjanus monostigma)",
  "Kea-kea (Siganus virgatus)",
  "Kembung lelaki (Rastrelliger kanagurta)",
  "Kembung perempuan (Rastrelliger brachysoma)",
  "Kenyar (Sarda orientalis)",
  "Kerapu (Cephalopholis aurantia)",
  "Kerapu (Epinephelus cyanopodus)",
  "Kerapu (Epinephelus radiatus)",
  "Kerapu bintik kuning (Epinephelus timorensis)",
  "Kerapu karang (Cephalopholis boenak)",
  "Kerapu lumpur (Epinephelus amblycephalus)",
  "Kerapu lumpur (Epinephelus bleekeri)",
  "Kerapu sunu (Plectropomus leopardus)",
  "Kerapu tutul (Epinephelus coioides)",
  "Kerisi (Etelis radiosus)",
  "Kerisi (Nemipterus spp)",
  "Kerisi (Pentapodus emeryii)",
  "Kerong-kerong (Lethrinus spp)",
  "Kerong-kerong (Terapon theraps)",
  "Kerong-kerong padi (Terapon puta)",
  "Ketambak (Lethrinus laticaudis)",
  "Ketang-ketang (Drepane punctata)",
  "Kuniran (Upeneus sulphureus)",
  "Kurisi (Nemipterus aurora)",
  "Kurisi (Nemipterus nematophorus)",
  "Kurisi (Nemipterus virgatus )",
  "Kurisi (Nemipterus virgatus)",
  "Kurisi bali (Pristipomoides filamentosus)",
  "Kurisi perak (Aphareus Rutilans)",
  "Kuro (Eleutheronema tetradactylum)",
  "Kuro (Polydactylus microstomus)",
  "Kuwe (Carangoides hedlandensis)",
  "Kuwe (Carangoides malabaricus)",
  "Kuwe (Carangoides oblongus)",
  "Kuwe (Caranx sexfasciatus)",
  "Kuwe (Caranx spp)",
  "Kuwe abu-abu sirip gelap (Carangoides caeruleopinnatus )",
  "Kuwe abu-abu sirip gelap (Seriola rivoliana)",
  "Kuwe moncong tumpul bulat (Carangoides ferdau)",
  "Layang (Decapterus maruadsi)",
  "Layang anggur (Decapterus kurroides)",
  "Layang benggol (Decapterus russelli)",
  "Layang deles (Decapterus macrosoma)",
  "Layang pectoralf pendek (Decapterus macarellus)",
  "Layang spp (Decapterus spp)",
  "Layur (Lepturacanthus savala)",
  "Layur (Trichiurus lepturus)",
  "Lemadang (Coryphaena hippurus)",
  "Lemuru (Sardinella lemuru)",
  "Lencam (Lethrinus lentjan)",
  "Lencam (Lethrinus spp)",
  "Lolosi biru (Caesio caerulaurea)",
  "Madidihang (Thunnus albacares)",
  "Mala (Gymnocranius elongatus)",
  "Mala (Lutjanus vitta)",
  "Manyung (Arius spp)",
  "Manyung (Netuma thalassina)",
  "Marlin biru (Makaira nigricans)",
  "Mujair (Oreochromis mossambicus )",
  "Nyunglas (Acanthocybium solandri )",
  "Parang (Macrochirichthys macrochirus )",
  "Pari burung (Aetomylaeus niehofii)",
  "Pari kekeh (Rhinobatos spp)",
  "Pari kekeh (Rhynchobatus australiae)",
  "Pari kelapa (Pastinachus ater)",
  "Pari kembang (Dasyatis kuhlii)",
  "Pari merica (Taeniura lymma)",
  "Pari mutiara (Himantura jenkinsii)",
  "Pasir-pasir (Scolopsis bilineata)",
  "Pasir-pasir (Scolopsis taenioptera)",
  "Peperek (Leiognathus berbis)",
  "Peperek (Leiognathus leuciscus)",
  "Peperek bondolan (Gazza minuta)",
  "Peperek bondolan (Leiognathus bindus)",
  "Peperek lainnya (Leiognathus spp)",
  "Peperek topang (Leiognathus equulus)",
  "Pilok (Mene maculata)",
  "Pinjala (Pristipomoides multidens )",
  "Pinjalo (Pristipomoides typus)",
  "Pisang-pisang (Caesio cuning)",
  "Rajungan (Portunus pelagicus)",
  "Rajungan (Portunus spp)",
  "Rajungan angin (Podophthalmus vigil)",
  "Rejum (Sillago sihama)",
  "Remang (Gymnothorax spp)",
  "Remang putih (Gymnothorax undulatus)",
  "Selanget (Anodontostoma chacunda)",
  "Selar (Alepes melanoptera)",
  "Selar (Selar boops)",
  "Selar bentong (Selar crumenophthalmus)",
  "Selar hijau (Atule mate)",
  "Selar komo (Alepes djedaba)",
  "Selar kuning (Selaroides leptolepis)",
  "Semar (Lampris guttatus)",
  "Sembilang (Plotosus canius)",
  "Setuhuk hitam (Istiompax indica ; Makaira Indica)",
  "Silper (Platax boersii)",
  "Siro (Amblygaster sirm)",
  "Sokang (Trachinotus blochii)",
  "Sotong (Sepia aculeata)",
  "Sotong (Sepia officinalis)",
  "Sotong (Sepia pharaonis)",
  "Sotong (Sepia recurvirostra)",
  "Sotong (Sepia spp)",
  "Sunglir (Elagatis bipinnulata)",
  "Swanggi (Priacanthus hamrur)",
  "Swanggi (Priacanthus tayenus)",
  "Talang- talang (Scomberoides tol)",
  "Talang-talang (Scomberoides commersonnianus )",
  "Talang-talang (Scomberoides tala)",
  "Tanda-tanda batu (Lutjanus decussatus)",
  "Tembang (Sardinella albella)",
  "Tembang (Sardinella fimbriata)",
  "Tembang (Sardinella gibbosa)",
  "Tembang Sardinella brachysoma)",
  "Tenggiri (Scomberomorus commerson )",
  "Tenggiri papan (Scomberomorus guttatus)",
  "Teri (Encrasicholina devisi)",
  "Teri (Encrasicholina spp)",
  "Teri (Stolephorus commersonii)",
  "Terman (Ulua mentalis)",
  "Tetengkek (Megalaspis cordyla)",
  "Tigawaja (Johnius dussumieri)",
  "Tongkol abu-abu (Thunnus tonggol)",
  "Tongkol banyar (Euthynnus affinis)",
  "Tongkol banyar (Euthynnus lineatus)",
  "Tongkol pisang-balaki (Auxis thazard)",
  "Tongkol pisang-cerutu (Auxis rochei)",
  "Tuna mata besar (Thunnus obesus)",
  "Udang jerbung (Penaeus merguiensis )",
  "Udang kipas (Thenus orientalis)",
  "Udang krosok (Metapenaeus spp)",
  "Udang krosok merah (Metapenaeopsis rosea)",
  "Udang pasir (Thenus orientalis)",
  "Udang putih vanamei (Penaeus vannamei)"
],
  KOMODITAS_TANGKAP_NON_PELABUHAN: [
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
  KAB_KOTA_KELAUTAN: [
    'Bangkalan', 'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik',
    'Jember', 'Jombang', 'Kediri', 'Lamongan', 'Lumajang', 'Madiun', 'Magetan',
    'Malang', 'Mojokerto', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan',
    'Ponorogo', 'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep',
    'Trenggalek', 'Tuban', 'Tulungagung',
    'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun', 'Kota Malang',
    'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya', 'PT.Garam'
  ],  
};

async function seedAll() {
  console.log('Mulai seeding cepat (createMany) seluruh kategori Master Data...');

  console.log('Membersihkan data komoditas lama...');
  await prisma.masterData.deleteMany({
    where: {
      category: {
        in: ['KOMODITAS_TANGKAP_LAUT', 'KOMODITAS_TANGKAP_NON_PELABUHAN']
      }
    }
  });

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