export const BUDIDAYA_TAHUNAN_CONFIG = [
  {
    id: 'IN_LAUT',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 1: IN LAUT',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik', 'Pandega'] },
      { title: 'Seksi 4: Besaran Usaha (RTP)', fields: ['KJA < 1 Ha', 'KJA 1-10 Ha', 'KJA > 10 Ha', 'Rula < 1 Ha', 'Rula 1-10 Ha', 'Rula > 10 Ha'] },
      { title: 'Seksi 5: Benih yang Ditanam — dalam RTP', fields: ['Kerapu Cantang', 'Kerapu Macan', 'Kakap', 'Bandeng', 'Rula', 'Udang Lobster', 'Udang Lainnya', 'Kerang Hijau', 'Ikan Lainnya'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam Ekor', fields: ['Kerapu Cantang', 'Kerapu Macan', 'Kakap', 'Bandeng', 'Rula', 'Udang Lobster', 'Udang Lainnya', 'Kerang Hijau', 'Ikan Lainnya'] },
      { title: 'Seksi 7: OIKB', fields: ['RTP Menggunakan', 'RTP Tidak Menggunakan', 'Volume Menggunakan (ml/gram)'] },
      { title: 'Seksi 8: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Lainnya'] },
      { title: 'Seksi 9: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Lainnya'] },
      { title: 'Seksi 10: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 11: OIKB (Kg/Liter)', fields: ['Obat', 'Lainnya'] },
      { title: 'Seksi 12: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'IN_TAMBAK',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 2: IN TAMBAK',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Luas Tambak per Intensitas (Ha)', fields: ['Tradisional', 'Semi Intensif', 'Intensif'] },
      { title: 'Seksi 4: Jumlah Pembudidaya (Orang)', fields: ['Pemilik', 'Pandega'] },
      { title: 'Seksi 5: Besaran Usaha (RTP)', fields: ['< 10 Ha', '10-50 Ha', '> 50 Ha'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam RTP', fields: ['Bandeng', 'Kerapu', 'Kakap', 'Nila', 'Bandeng & Udang', 'Bandeng & Nila', 'Ikan Lainnya', 'Rula', 'Kepiting', 'U. Windu', 'U. Vaname', 'U. Putih', 'Udang Lainnya'] },
      { title: 'Seksi 7: Benih yang Ditanam — dalam Ekor', fields: ['Bandeng', 'Kerapu', 'Kakap', 'Nila', 'Bandeng & Udang', 'Bandeng & Nila', 'Ikan Lainnya', 'Rula', 'Kepiting', 'U. Windu', 'U. Vaname', 'U. Putih', 'Udang Lainnya'] },
      { title: 'Seksi 8: Pupuk — dalam RTP', fields: ['Organik', 'An Organik', 'Campuran', 'Tidak Menggunakan'] },
      { title: 'Seksi 9: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 10: Pupuk — dalam Kg', fields: ['Organik', 'An Organik', 'Campuran'] },
      { title: 'Seksi 11: OIKB Volume (ml/gram)', fields: ['Menggunakan'] },
      { title: 'Seksi 12: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 13: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 14: OIKB Tambahan (RTP)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 15: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 16: OIKB (Kg/Liter)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 17: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'IN_KOLAM',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 3: IN KOLAM',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik'] },
      { title: 'Seksi 4: Besaran Usaha (RTP)', fields: ['< 0,1 Ha', '0,1-0,3 Ha', '0,3-0,5 Ha', '> 0,5 Ha'] },
      { title: 'Seksi 5: Benih yang Ditanam — dalam RTP', fields: ['Bandeng', 'Bawal', 'Gabus', 'Gurami', 'Lele', 'Lobster Tawar', 'Ikan Mas', 'Mujair', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam Ekor', fields: ['Bandeng', 'Bawal', 'Gabus', 'Gurami', 'Lele', 'Lobster Tawar', 'Ikan Mas', 'Mujair', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 7: Pupuk — dalam RTP', fields: ['Organik', 'An Organik', 'Campuran', 'Tidak Menggunakan'] },
      { title: 'Seksi 8: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 9: Pupuk — dalam Kg', fields: ['Organik', 'An Organik', 'Campuran'] },
      { title: 'Seksi 10: OIKB Volume (ml/gram)', fields: ['Menggunakan'] },
      { title: 'Seksi 11: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 12: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 13: OIKB Tambahan (RTP)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 14: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 15: OIKB (Kg/Liter)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 16: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'IN_KERAMBA',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 4: IN KERAMBA',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik'] },
      { title: 'Seksi 4: Besaran Usaha (RTP)', fields: ['< 50 m²', '50-100 m²', '100-500 m²'] },
      { title: 'Seksi 5: Benih yang Ditanam — dalam RTP', fields: ['Gurami', 'Ikan Mas', 'Lele', 'Nila', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam Ekor', fields: ['Gurami', 'Ikan Mas', 'Lele', 'Nila', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 7: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 8: OIKB Volume (ml/gram)', fields: ['Menggunakan'] },
      { title: 'Seksi 9: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 10: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 11: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 12: OIKB (Kg/Liter)', fields: ['Obat', 'Lainnya'] },
      { title: 'Seksi 13: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'IN_MINA_PADI',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 5: IN MINA PADI',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik'] },
      { title: 'Seksi 4: Besaran Usaha (RTP)', fields: ['< 0,1 Ha', '0,1-0,3 Ha', '0,3-0,5 Ha', '> 0,5 Ha'] },
      { title: 'Seksi 5: Benih yang Ditanam — dalam RTP', fields: ['Ikan Mas', 'Nila', 'Ikan Lainnya', 'Bandeng', 'Vaname'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam Ekor', fields: ['Ikan Mas', 'Nila', 'Ikan Lainnya', 'Bandeng', 'Vaname'] },
      { title: 'Seksi 7: Pupuk — dalam RTP', fields: ['Organik', 'An Organik', 'Campuran', 'Tidak Menggunakan'] },
      { title: 'Seksi 8: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 9: Pupuk — dalam Kg', fields: ['Organik', 'An Organik', 'Campuran'] },
      { title: 'Seksi 10: OIKB Volume (ml/gram)', fields: ['Menggunakan'] },
      { title: 'Seksi 11: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 12: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 13: OIKB Tambahan (RTP)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 14: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 15: OIKB (Kg/Liter)', fields: ['Probiotik', 'Obat', 'Kapur', 'Pestisida', 'Desinfektan', 'Lainnya'] },
      { title: 'Seksi 16: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'IN_JAPUNG',
    grup: 'GRUP A: BUDIDAYA PER WADAH',
    title: 'MODUL 6: IN JAPUNG',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik', 'Pandega'] },
      { title: 'Seksi 4: Besaran Usaha (RTP)', fields: ['< 50 m²', '50-100 m²', '100-300 m²', '> 300 m²'] },
      { title: 'Seksi 5: Benih yang Ditanam — dalam RTP', fields: ['Gurami', 'Ikan Mas', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 6: Benih yang Ditanam — dalam Ekor', fields: ['Gurami', 'Ikan Mas', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya'] },
      { title: 'Seksi 7: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 8: OIKB Volume (ml/gram)', fields: ['Menggunakan'] },
      { title: 'Seksi 9: Pakan — dalam RTP', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 10: Pakan — dalam Kg', fields: ['Pelet', 'Rucah', 'Dedak', 'Lainnya'] },
      { title: 'Seksi 11: OIKB Tambahan (RTP)', fields: ['Probiotik', 'Obat', 'Kapur'] },
      { title: 'Seksi 12: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 13: OIKB (Kg/Liter)', fields: ['Probiotik', 'Obat'] },
      { title: 'Seksi 14: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] }
    ]
  },
  {
    id: 'BBI',
    grup: 'GRUP B: BALAI BENIH & IH',
    title: 'MODUL 7: BBI',
    tipe: 'REPEATABLE', // Berarti butuh + Tambah BBI
    seksi: [
      { title: 'Data Dasar', fields: ['Nama BBI (Text)', 'Lokasi BBI (Text)', 'Luas BBI Tawar — Luas Bersih (Ha)'] },
      { title: 'Jumlah Induk (Ekor)', fields: ['Bawal', 'Gabus', 'Gurami', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya', 'U. Lobster Air Tawar'] },
      { title: 'Jumlah Calon Induk (Ekor)', fields: ['Bawal', 'Gabus', 'Gurami', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya', 'U. Lobster Air Tawar'] },
      { title: 'Jumlah Benih yang Dihasilkan (Ekor)', fields: ['Bawal', 'Gabus', 'Gurami', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya', 'U. Lobster Air Tawar'] }
    ]
  },
  {
    id: 'IH',
    grup: 'GRUP B: BALAI BENIH & IH',
    title: 'MODUL 8: IH',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah Pembudidaya (Orang)', fields: ['Pemilik'] },
      { title: 'Seksi 4: OIKB (RTP)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 5: OIKB Volume (ml/gram)', fields: ['Menggunakan', 'Tidak Menggunakan'] },
      { title: 'Seksi 6: Pakan (RTP)', fields: ['Pelet', 'Lainnya'] },
      { title: 'Seksi 7: Pakan (Kg)', fields: ['Pelet', 'Lainnya'] },
      { title: 'Seksi 8: OIKB Tambahan (RTP)', fields: ['Probiotik', 'Obat'] },
      { title: 'Seksi 9: Energi (RTP)', fields: ['BBM', 'Listrik'] },
      { title: 'Seksi 10: OIKB (Kg/Liter)', fields: ['Probiotik', 'Obat'] },
      { title: 'Seksi 11: Energi (volume & biaya)', fields: ['BBM (Liter)', 'Listrik (KVA)', 'Listrik (Rp.)'] },
      { title: 'Seksi 12: Daerah Distribusi', fields: ['Daerah Distribusi (Text)'] }
    ]
  },
  {
    id: 'PERBENIHAN_TAWAR',
    grup: 'GRUP B: BALAI BENIH & IH',
    title: 'MODUL 9: PERBENIHAN TAWAR',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah', fields: ['Unit UPR', 'Pemilik (Orang)', 'Pekerja (Orang)'] },
      { title: 'Seksi 4: Besaran Usaha (Unit)', fields: ['< 0,1 Ha', '0,1-0,3 Ha', '0,3-0,5 Ha', '> 0,5 Ha'] },
      { title: 'Jumlah Induk (Ekor)', fields: ['Bawal', 'Gabus', 'Gurami', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya', 'U. Lobster Air Tawar'] },
      { title: 'Jumlah Calon Induk (Ekor)', fields: ['Bawal', 'Gabus', 'Gurami', 'Lele', 'Nila', 'Patin', 'Tawes', 'Ikan Lainnya', 'U. Lobster Air Tawar'] }
    ]
  },
  {
    id: 'PERBENIHAN_PAYAU',
    grup: 'GRUP B: BALAI BENIH & IH',
    title: 'MODUL 10: PERBENIHAN PAYAU',
    tipe: 'STANDAR',
    seksi: [
      { title: 'Seksi 1: Potensi (Ha)', fields: ['Potensi Lahan', 'Potensi Budidaya'] },
      { title: 'Seksi 2: Luas Budidaya (Ha)', fields: ['Luas Kotor', 'Luas Bersih'] },
      { title: 'Seksi 3: Jumlah', fields: ['Unit UPR', 'Pemilik (Orang)', 'Pekerja (Orang)'] },
      { title: 'Seksi 4: Besaran Usaha (Unit)', fields: ['< 0,1 Ha', '0,1-0,3 Ha', '0,3-0,5 Ha', '> 0,5 Ha'] },
      { title: 'Jumlah Induk (Ekor)', fields: ['Bandeng', 'Kerapu', 'Kakap', 'U. Windu', 'U. Vaname', 'U. Putih', 'Rula', 'Ikan Lainnya'] },
      { title: 'Jumlah Calon Induk (Ekor)', fields: ['Bandeng', 'Kerapu', 'Kakap', 'U. Windu', 'U. Vaname', 'U. Putih', 'Rula', 'Ikan Lainnya'] }
    ]
  },
  {
    id: 'PRODUKSI_PERBENIHAN_BBI_TAWAR',
    grup: 'GRUP C: PRODUKSI BENIH',
    title: 'MODUL 11: PRODUKSI PERBENIHAN BBI TAWAR',
    tipe: 'PRODUKSI', // Satuan 1.000 Ekor, ada auto hitung JUMLAH
    seksi: [
      { title: 'Data Luas', fields: ['Luas Kotor (Ha)', 'Luas Bersih (Ha)'] },
      { title: 'Produksi Benih dari BBI (1.000 Ekor)', fields: ['Lele', 'Nila', 'Gurami', 'Mas/Tombro', 'Mujair', 'Tawes', 'Patin', 'Ikan Hias', 'Udang Galah', 'Lain-Lainnya', 'JUMLAH'] }
    ]
  },
  {
    id: 'PRODUKSI_PERBENIHAN_BBI_PAYAU',
    grup: 'GRUP C: PRODUKSI BENIH',
    title: 'MODUL 12: PRODUKSI PERBENIHAN BBI PAYAU',
    tipe: 'PRODUKSI', 
    seksi: [
      { title: 'Data Luas', fields: ['Luas Kotor (Ha)', 'Luas Bersih (Ha)'] },
      { title: 'Produksi Benih dari BBI (1.000 Ekor)', fields: ['Vaname', 'Windu', 'Kerapu', 'Kakap', 'Udang Galah', 'Bandeng', 'Udang Putih', 'Gracilaria', 'Cotonii', 'Lain-Lainnya', 'JUMLAH'] }
    ]
  },
  {
    id: 'BENIH_TAWAR_UPR_SWASTA',
    grup: 'GRUP C: PRODUKSI BENIH',
    title: 'MODUL 13: BENIH TAWAR UPR & SWASTA',
    tipe: 'PRODUKSI',
    seksi: [
      { title: 'Data KPI', fields: ['Jumlah KPI (Unit)', 'Pemilik (Orang)', 'Luas Bersih (Ha)'] },
      { title: 'Produksi Benih (1.000 Ekor)', fields: ['Lele', 'Nila', 'Gurami', 'Mas/Tombro', 'Mujair', 'Tawes', 'Patin', 'Ikan Hias', 'Udang Galah', 'Lain-Lainnya', 'JUMLAH'] }
    ]
  },
  {
    id: 'BENIH_PAYAU_UPR_SWASTA',
    grup: 'GRUP C: PRODUKSI BENIH',
    title: 'MODUL 14: BENIH PAYAU UPR & SWASTA',
    tipe: 'PRODUKSI',
    seksi: [
      { title: 'Data KPI', fields: ['Jumlah KPI (Unit)', 'Pemilik (Orang)', 'Luas Bersih (Ha)'] },
      { title: 'Produksi Benih (1.000 Ekor)', fields: ['Vaname', 'Windu', 'Kerapu', 'Kakap', 'Udang Galah', 'Bandeng', 'Udang Putih', 'Gracilaria', 'Cotonii', 'Lain-Lainnya', 'JUMLAH'] }
    ]
  }
];
