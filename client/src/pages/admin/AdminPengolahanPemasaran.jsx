import { useState, useMemo } from "react";

const DATA_UNIT_USAHA = [
  { no: "01", kabupaten: "KAB. PACITAN", fermentasi: 25.42, pelumatan: 58.26, pembekuan: 6.17, pemindangan: 16.25, penanganan_segar: 196.02, pengalengan: 0.0, pengasapan: 10.9, pereduksian: 5.7, penggaraman: 48.89, pengolahan_lainnya: 28.75, pengecer: 536.78, distributor: 24.8, total: 957.94, pengolahan_total: 396.36, pemasaran_total: 561.58 },
  { no: "02", kabupaten: "KAB. PONOROGO", fermentasi: 0.0, pelumatan: 40.61, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 2.04, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 67.84, pengecer: 747.56, distributor: 109.49, total: 967.54, pengolahan_total: 110.49, pemasaran_total: 857.04 },
  { no: "03", kabupaten: "KAB. TRENGGALEK", fermentasi: 0.0, pelumatan: 41.3, pembekuan: 3.1, pemindangan: 67.49, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 256.4, pereduksian: 0.0, penggaraman: 56.66, pengolahan_lainnya: 7.28, pengecer: 867.64, distributor: 29.65, total: 1329.52, pengolahan_total: 432.23, pemasaran_total: 897.29 },
  { no: "04", kabupaten: "KAB. TULUNGAGUNG", fermentasi: 0.0, pelumatan: 33.6, pembekuan: 18.57, pemindangan: 54.76, penanganan_segar: 32.36, pengalengan: 0.0, pengasapan: 635.02, pereduksian: 0.0, penggaraman: 33.41, pengolahan_lainnya: 67.98, pengecer: 209.83, distributor: 79.17, total: 1164.71, pengolahan_total: 875.7, pemasaran_total: 289.01 },
  { no: "05", kabupaten: "KAB. BLITAR", fermentasi: 0.0, pelumatan: 3.84, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 5.14, pengalengan: 0.0, pengasapan: 82.96, pereduksian: 30.83, penggaraman: 0.0, pengolahan_lainnya: 18.49, pengecer: 388.97, distributor: 88.23, total: 618.46, pengolahan_total: 141.26, pemasaran_total: 477.2 },
  { no: "06", kabupaten: "KAB. KEDIRI", fermentasi: 0.0, pelumatan: 14.24, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 0.04, pengalengan: 0.0, pengasapan: 5.44, pereduksian: 8.14, penggaraman: 0.0, pengolahan_lainnya: 53.78, pengecer: 1192.93, distributor: 24.78, total: 1299.36, pengolahan_total: 81.64, pemasaran_total: 1217.71 },
  { no: "07", kabupaten: "KAB. MALANG", fermentasi: 0.04, pelumatan: 8.8, pembekuan: 11.31, pemindangan: 131.77, penanganan_segar: 6.3, pengalengan: 0.0, pengasapan: 17.16, pereduksian: 11.42, penggaraman: 8.61, pengolahan_lainnya: 21.55, pengecer: 311.3, distributor: 30.79, total: 559.05, pengolahan_total: 216.96, pemasaran_total: 342.09 },
  { no: "08", kabupaten: "KAB. LUMAJANG", fermentasi: 6.66, pelumatan: 9.24, pembekuan: 0.0, pemindangan: 105.72, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 25.54, pereduksian: 19.47, penggaraman: 0.0, pengolahan_lainnya: 37.27, pengecer: 289.3, distributor: 35.45, total: 528.65, pengolahan_total: 203.9, pemasaran_total: 324.75 },
  { no: "09", kabupaten: "KAB. JEMBER", fermentasi: 35.73, pelumatan: 0.04, pembekuan: 0.0, pemindangan: 229.86, penanganan_segar: 46.34, pengalengan: 0.0, pengasapan: 110.92, pereduksian: 0.04, penggaraman: 85.14, pengolahan_lainnya: 49.14, pengecer: 294.49, distributor: 62.68, total: 914.39, pengolahan_total: 557.22, pemasaran_total: 357.17 },
  { no: "10", kabupaten: "KAB. BANYUWANGI", fermentasi: 0.0, pelumatan: 7.16, pembekuan: 20.68, pemindangan: 96.65, penanganan_segar: 7.73, pengalengan: 12.4, pengasapan: 61.4, pereduksian: 110.32, penggaraman: 74.34, pengolahan_lainnya: 284.55, pengecer: 1370.19, distributor: 50.77, total: 2096.18, pengolahan_total: 675.22, pemasaran_total: 1420.96 },
  { no: "11", kabupaten: "KAB. BONDOWOSO", fermentasi: 0.0, pelumatan: 6.72, pembekuan: 0.0, pemindangan: 4.85, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 0.04, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 39.61, pengecer: 822.87, distributor: 31.36, total: 905.45, pengolahan_total: 51.22, pemasaran_total: 854.23 },
  { no: "12", kabupaten: "KAB. SITUBONDO", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 3.1, pemindangan: 92.89, penanganan_segar: 10.18, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 21.77, penggaraman: 214.52, pengolahan_lainnya: 18.82, pengecer: 390.04, distributor: 152.6, total: 903.91, pengolahan_total: 361.28, pemasaran_total: 542.64 },
  { no: "13", kabupaten: "KAB. PROBOLINGGO", fermentasi: 16.05, pelumatan: 4.91, pembekuan: 2.07, pemindangan: 57.4, penanganan_segar: 0.08, pengalengan: 0.0, pengasapan: 88.07, pereduksian: 8.87, penggaraman: 37.87, pengolahan_lainnya: 38.86, pengecer: 1071.21, distributor: 6.0, total: 1331.38, pengolahan_total: 254.18, pemasaran_total: 1077.2 },
  { no: "14", kabupaten: "KAB. PASURUAN", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 10.33, pemindangan: 42.5, penanganan_segar: 4.1, pengalengan: 2.96, pengasapan: 41.19, pereduksian: 20.77, penggaraman: 15.08, pengolahan_lainnya: 35.34, pengecer: 125.45, distributor: 7.78, total: 305.49, pengolahan_total: 172.27, pemasaran_total: 133.23 },
  { no: "15", kabupaten: "KAB. SIDOARJO", fermentasi: 40.77, pelumatan: 91.7, pembekuan: 29.0, pemindangan: 63.73, penanganan_segar: 32.8, pengalengan: 1.48, pengasapan: 66.39, pereduksian: 42.91, penggaraman: 75.2, pengolahan_lainnya: 52.38, pengecer: 146.21, distributor: 112.91, total: 755.47, pengolahan_total: 496.36, pemasaran_total: 259.11 },
  { no: "16", kabupaten: "KAB. MOJOKERTO", fermentasi: 0.0, pelumatan: 10.08, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 68.26, pereduksian: 0.0, penggaraman: 8.71, pengolahan_lainnya: 119.47, pengecer: 169.5, distributor: 63.31, total: 439.34, pengolahan_total: 206.53, pemasaran_total: 232.81 },
  { no: "17", kabupaten: "KAB. JOMBANG", fermentasi: 0.0, pelumatan: 17.69, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 17.08, pengalengan: 0.0, pengasapan: 40.25, pereduksian: 0.0, penggaraman: 5.2, pengolahan_lainnya: 40.23, pengecer: 504.82, distributor: 18.08, total: 643.36, pengolahan_total: 120.45, pemasaran_total: 522.9 },
  { no: "18", kabupaten: "KAB. NGANJUK", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 27.72, pengecer: 104.73, distributor: 28.02, total: 160.47, pengolahan_total: 27.72, pemasaran_total: 132.75 },
  { no: "19", kabupaten: "KAB. MADIUN", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 0.0, pemindangan: 0.0, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 2.17, penggaraman: 0.13, pengolahan_lainnya: 49.73, pengecer: 69.13, distributor: 47.47, total: 168.63, pengolahan_total: 52.03, pemasaran_total: 116.6 },
  { no: "20", kabupaten: "KAB. MAGETAN", fermentasi: 0.0, pelumatan: 27.57, pembekuan: 0.04, pemindangan: 0.08, penanganan_segar: 19.98, pengalengan: 0.0, pengasapan: 0.08, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 44.52, pengecer: 55.85, distributor: 41.16, total: 189.29, pengolahan_total: 92.28, pemasaran_total: 97.01 },
  { no: "21", kabupaten: "KAB. NGAWI", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 0.0, pemindangan: 55.33, penanganan_segar: 29.14, pengalengan: 0.0, pengasapan: 21.33, pereduksian: 0.0, penggaraman: 1.04, pengolahan_lainnya: 31.83, pengecer: 99.13, distributor: 27.24, total: 265.04, pengolahan_total: 138.67, pemasaran_total: 126.37 },
  { no: "22", kabupaten: "KAB. BOJONEGORO", fermentasi: 0.0, pelumatan: 18.97, pembekuan: 0.0, pemindangan: 65.48, penanganan_segar: 40.01, pengalengan: 0.0, pengasapan: 119.58, pereduksian: 0.0, penggaraman: 49.46, pengolahan_lainnya: 19.36, pengecer: 528.79, distributor: 40.53, total: 882.16, pengolahan_total: 312.85, pemasaran_total: 569.32 },
  { no: "23", kabupaten: "KAB. TUBAN", fermentasi: 29.46, pelumatan: 1.13, pembekuan: 19.65, pemindangan: 42.36, penanganan_segar: 20.57, pengalengan: 0.0, pengasapan: 278.84, pereduksian: 7.46, penggaraman: 227.61, pengolahan_lainnya: 109.96, pengecer: 741.89, distributor: 19.82, total: 1498.74, pengolahan_total: 737.04, pemasaran_total: 761.71 },
  { no: "24", kabupaten: "KAB. LAMONGAN", fermentasi: 2.45, pelumatan: 40.41, pembekuan: 19.59, pemindangan: 88.35, penanganan_segar: 18.78, pengalengan: 1.48, pengasapan: 121.48, pereduksian: 27.52, penggaraman: 203.61, pengolahan_lainnya: 8.01, pengecer: 910.57, distributor: 229.4, total: 1671.66, pengolahan_total: 531.68, pemasaran_total: 1139.97 },
  { no: "25", kabupaten: "KAB. GRESIK", fermentasi: 23.28, pelumatan: 95.11, pembekuan: 3.1, pemindangan: 74.98, penanganan_segar: 18.34, pengalengan: 0.0, pengasapan: 27.69, pereduksian: 37.72, penggaraman: 130.0, pengolahan_lainnya: 182.17, pengecer: 102.22, distributor: 63.14, total: 757.77, pengolahan_total: 592.4, pemasaran_total: 165.37 },
  { no: "26", kabupaten: "KAB. BANGKALAN", fermentasi: 3.16, pelumatan: 19.97, pembekuan: 0.0, pemindangan: 41.07, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 125.27, pereduksian: 3.66, penggaraman: 100.2, pengolahan_lainnya: 40.34, pengecer: 1564.35, distributor: 7.99, total: 1906.02, pengolahan_total: 333.67, pemasaran_total: 1572.34 },
  { no: "27", kabupaten: "KAB. SAMPANG", fermentasi: 43.9, pelumatan: 0.54, pembekuan: 6.31, pemindangan: 386.09, penanganan_segar: 29.33, pengalengan: 0.0, pengasapan: 70.16, pereduksian: 36.66, penggaraman: 53.74, pengolahan_lainnya: 15.0, pengecer: 778.72, distributor: 32.18, total: 1452.63, pengolahan_total: 641.73, pemasaran_total: 810.91 },
  { no: "28", kabupaten: "KAB. PAMEKASAN", fermentasi: 5.46, pelumatan: 13.54, pembekuan: 1.03, pemindangan: 149.71, penanganan_segar: 1.04, pengalengan: 0.0, pengasapan: 22.74, pereduksian: 48.93, penggaraman: 186.08, pengolahan_lainnya: 64.58, pengecer: 1432.44, distributor: 14.38, total: 1939.94, pengolahan_total: 493.12, pemasaran_total: 1446.82 },
  { no: "29", kabupaten: "KAB. SUMENEP", fermentasi: 7.07, pelumatan: 0.0, pembekuan: 2.07, pemindangan: 5.93, penanganan_segar: 3.17, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 2.04, penggaraman: 35.28, pengolahan_lainnya: 23.68, pengecer: 496.57, distributor: 10.16, total: 585.97, pengolahan_total: 79.24, pemasaran_total: 506.73 },
  { no: "71", kabupaten: "KOTA KEDIRI", fermentasi: 0.0, pelumatan: 2.54, pembekuan: 0.0, pemindangan: 24.83, penanganan_segar: 27.29, pengalengan: 1.48, pengasapan: 0.04, pereduksian: 0.25, penggaraman: 0.0, pengolahan_lainnya: 67.34, pengecer: 155.47, distributor: 27.23, total: 306.48, pengolahan_total: 123.78, pemasaran_total: 182.7 },
  { no: "72", kabupaten: "KOTA BLITAR", fermentasi: 0.0, pelumatan: 23.17, pembekuan: 0.0, pemindangan: 2.67, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 8.75, pereduksian: 0.0, penggaraman: 6.74, pengolahan_lainnya: 47.07, pengecer: 75.36, distributor: 6.54, total: 170.29, pengolahan_total: 88.39, pemasaran_total: 81.9 },
  { no: "73", kabupaten: "KOTA MALANG", fermentasi: 0.0, pelumatan: 0.29, pembekuan: 0.0, pemindangan: 6.89, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 1.13, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 6.93, pengecer: 217.68, distributor: 0.04, total: 232.96, pengolahan_total: 15.24, pemasaran_total: 217.72 },
  { no: "74", kabupaten: "KOTA PROBOLINGGO", fermentasi: 21.27, pelumatan: 41.39, pembekuan: 9.35, pemindangan: 33.31, penanganan_segar: 20.19, pengalengan: 0.0, pengasapan: 56.8, pereduksian: 53.06, penggaraman: 72.45, pengolahan_lainnya: 138.52, pengecer: 507.72, distributor: 41.2, total: 995.26, pengolahan_total: 446.33, pemasaran_total: 548.93 },
  { no: "75", kabupaten: "KOTA PASURUAN", fermentasi: 8.54, pelumatan: 16.1, pembekuan: 1.08, pemindangan: 70.59, penanganan_segar: 3.06, pengalengan: 1.48, pengasapan: 55.84, pereduksian: 45.63, penggaraman: 120.05, pengolahan_lainnya: 125.0, pengecer: 326.56, distributor: 32.88, total: 806.81, pengolahan_total: 447.36, pemasaran_total: 359.44 },
  { no: "76", kabupaten: "KOTA MOJOKERTO", fermentasi: 0.0, pelumatan: 0.0, pembekuan: 0.0, pemindangan: 11.02, penanganan_segar: 0.0, pengalengan: 0.0, pengasapan: 26.35, pereduksian: 0.0, penggaraman: 0.0, pengolahan_lainnya: 29.64, pengecer: 55.36, distributor: 0.0, total: 122.37, pengolahan_total: 67.01, pemasaran_total: 55.36 },
  { no: "77", kabupaten: "KOTA MADIUN", fermentasi: 0.0, pelumatan: 32.79, pembekuan: 0.0, pemindangan: 19.89, penanganan_segar: 11.5, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 0.0, penggaraman: 1.08, pengolahan_lainnya: 12.08, pengecer: 126.65, distributor: 17.07, total: 221.05, pengolahan_total: 77.34, pemasaran_total: 143.71 },
  { no: "78", kabupaten: "KOTA SURABAYA", fermentasi: 0.0, pelumatan: 5.96, pembekuan: 1.03, pemindangan: 0.04, penanganan_segar: 1.04, pengalengan: 0.0, pengasapan: 33.96, pereduksian: 0.0, penggaraman: 11.61, pengolahan_lainnya: 40.28, pengecer: 1860.34, distributor: 58.45, total: 2012.72, pengolahan_total: 93.93, pemasaran_total: 1918.79 },
  { no: "79", kabupaten: "KOTA BATU", fermentasi: 0.0, pelumatan: 2.21, pembekuan: 0.0, pemindangan: 4.85, penanganan_segar: 3.1, pengalengan: 0.0, pengasapan: 0.0, pereduksian: 0.0, penggaraman: 27.84, pengolahan_lainnya: 58.1, pengecer: 257.58, distributor: 0.0, total: 353.69, pengolahan_total: 96.11, pemasaran_total: 257.58 },
];

const PENGOLAHAN_FIELDS = [
  { key: "fermentasi", label: "Fermentasi" },
  { key: "pelumatan", label: "Pelumatan Daging Ikan" },
  { key: "pembekuan", label: "Pembekuan" },
  { key: "pemindangan", label: "Pemindangan" },
  { key: "penanganan_segar", label: "Penanganan Produk Segar" },
  { key: "pengalengan", label: "Pengalengan" },
  { key: "pengasapan", label: "Pengasapan/Pemanggangan" },
  { key: "pereduksian", label: "Pereduksian/Ekstraksi" },
  { key: "penggaraman", label: "Penggaraman/Pengeringan" },
  { key: "pengolahan_lainnya", label: "Pengolahan Lainnya" },
];

const PEMASARAN_FIELDS = [
  { key: "pengecer", label: "Pengecer" },
  { key: "distributor", label: "Pengumpul/Pedagang Besar/Distributor" },
];

const emptyForm = {
  tahun: "2025",
  kabupaten: "",
  fermentasi: "", pelumatan: "", pembekuan: "", pemindangan: "",
  penanganan_segar: "", pengalengan: "", pengasapan: "", pereduksian: "",
  penggaraman: "", pengolahan_lainnya: "", pengecer: "", distributor: "",
};

export default function AdminPengolahanPemasaran() {
  const [activeTab, setActiveTab] = useState("pengolahan");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [data, setData] = useState(DATA_UNIT_USAHA);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);

  const filtered = useMemo(() =>
    data.filter(d => d.kabupaten.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  const grandTotal = useMemo(() => ({
    pengolahan_total: data.reduce((s, d) => s + d.pengolahan_total, 0),
    pemasaran_total: data.reduce((s, d) => s + d.pemasaran_total, 0),
    total: data.reduce((s, d) => s + d.total, 0),
    pengecer: data.reduce((s, d) => s + d.pengecer, 0),
    distributor: data.reduce((s, d) => s + d.distributor, 0),
    fermentasi: data.reduce((s, d) => s + d.fermentasi, 0),
    pelumatan: data.reduce((s, d) => s + d.pelumatan, 0),
    pembekuan: data.reduce((s, d) => s + d.pembekuan, 0),
    pemindangan: data.reduce((s, d) => s + d.pemindangan, 0),
    penanganan_segar: data.reduce((s, d) => s + d.penanganan_segar, 0),
    pengalengan: data.reduce((s, d) => s + d.pengalengan, 0),
    pengasapan: data.reduce((s, d) => s + d.pengasapan, 0),
    pereduksian: data.reduce((s, d) => s + d.pereduksian, 0),
    penggaraman: data.reduce((s, d) => s + d.penggaraman, 0),
    pengolahan_lainnya: data.reduce((s, d) => s + d.pengolahan_lainnya, 0),
  }), [data]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      tahun: "2025",
      kabupaten: item.kabupaten,
      fermentasi: item.fermentasi,
      pelumatan: item.pelumatan,
      pembekuan: item.pembekuan,
      pemindangan: item.pemindangan,
      penanganan_segar: item.penanganan_segar,
      pengalengan: item.pengalengan,
      pengasapan: item.pengasapan,
      pereduksian: item.pereduksian,
      penggaraman: item.penggaraman,
      pengolahan_lainnya: item.pengolahan_lainnya,
      pengecer: item.pengecer,
      distributor: item.distributor,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const pengolahan_fields = ["fermentasi","pelumatan","pembekuan","pemindangan","penanganan_segar","pengalengan","pengasapan","pereduksian","penggaraman","pengolahan_lainnya"];
    const pengolahan_total = pengolahan_fields.reduce((s, k) => s + (parseFloat(form[k]) || 0), 0);
    const pengecer = parseFloat(form.pengecer) || 0;
    const distributor = parseFloat(form.distributor) || 0;
    const pemasaran_total = pengecer + distributor;
    const total = pengolahan_total + pemasaran_total;

    const newItem = {
      no: editItem ? editItem.no : String(Date.now()),
      kabupaten: form.kabupaten,
      pengolahan_total: Math.round(pengolahan_total * 100) / 100,
      pemasaran_total: Math.round(pemasaran_total * 100) / 100,
      total: Math.round(total * 100) / 100,
      ...Object.fromEntries(pengolahan_fields.map(k => [k, parseFloat(form[k]) || 0])),
      pengecer, distributor,
    };

    if (editItem) {
      setData(prev => prev.map(d => d.no === editItem.no ? newItem : d));
      showNotif("Data berhasil diperbarui!");
    } else {
      setData(prev => [...prev, newItem]);
      showNotif("Data berhasil ditambahkan!");
    }
    setShowModal(false);
  };

  const handleDelete = (item) => {
    setData(prev => prev.filter(d => d.no !== item.no));
    setShowDeleteConfirm(null);
    showNotif("Data berhasil dihapus!", "error");
  };

  const fmt = (n) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const styles = {
    page: { minHeight: "100vh", background: "#0a1628", color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: "24px" },
    header: { marginBottom: "24px" },
    title: { fontSize: "28px", fontWeight: "700", color: "#ffffff", margin: 0 },
    subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
    topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" },
    searchBox: { background: "#0f1f38", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "10px 14px 10px 38px", color: "#e2e8f0", fontSize: "14px", width: "280px", outline: "none" },
    searchWrap: { position: "relative" },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "16px" },
    btnPrimary: { background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", borderRadius: "8px", padding: "10px 18px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
    btnExport: { background: "linear-gradient(135deg, #06b6d4, #0891b2)", border: "none", borderRadius: "8px", padding: "10px 18px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
    tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: "#0f1f38", borderRadius: "10px", padding: "4px", width: "fit-content" },
    tab: (active) => ({ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", background: active ? "linear-gradient(135deg, #06b6d4, #0891b2)" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s" }),
    card: { background: "#0f1f38", borderRadius: "12px", border: "1px solid #1e3a5f", overflow: "hidden" },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { padding: "12px 14px", textAlign: "left", background: "#071326", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e3a5f", whiteSpace: "nowrap" },
    thCenter: { padding: "12px 14px", textAlign: "center", background: "#071326", color: "#64748b", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e3a5f", whiteSpace: "nowrap" },
    td: { padding: "11px 14px", borderBottom: "1px solid #1a2d4a", color: "#cbd5e1", whiteSpace: "nowrap" },
    tdNum: { padding: "11px 14px", borderBottom: "1px solid #1a2d4a", color: "#94a3b8", textAlign: "right", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" },
    tdTotal: { padding: "11px 14px", borderBottom: "1px solid #1a2d4a", color: "#06b6d4", textAlign: "right", fontFamily: "monospace", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" },
    tdFoot: { padding: "12px 14px", background: "#071326", color: "#06b6d4", fontWeight: "700", textAlign: "right", fontFamily: "monospace", fontSize: "13px", whiteSpace: "nowrap" },
    tdFootLabel: { padding: "12px 14px", background: "#071326", color: "#e2e8f0", fontWeight: "700", whiteSpace: "nowrap" },
    badge: (type) => ({
      display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
      background: type === "pengolahan" ? "rgba(6,182,212,0.15)" : "rgba(16,185,129,0.15)",
      color: type === "pengolahan" ? "#06b6d4" : "#06b6d4",
    }),
    btnEdit: { background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "6px", padding: "5px 10px", color: "#06b6d4", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    btnDel: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "5px 10px", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
    modal: { background: "#0f1f38", borderRadius: "16px", border: "1px solid #1e3a5f", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" },
    modalHead: { padding: "20px 24px", borderBottom: "1px solid #1e3a5f", display: "flex", justifyContent: "space-between", alignItems: "center" },
    modalTitle: { fontSize: "18px", fontWeight: "700", color: "#ffffff", margin: 0 },
    modalBody: { padding: "24px", overflowY: "auto", flex: 1 },
    modalFoot: { padding: "16px 24px", borderTop: "1px solid #1e3a5f", display: "flex", justifyContent: "flex-end", gap: "10px" },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
    input: { background: "#071326", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "9px 12px", color: "#e2e8f0", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
    sectionLabel: { fontSize: "13px", fontWeight: "700", color: "#06b6d4", marginBottom: "12px", marginTop: "16px", paddingBottom: "6px", borderBottom: "1px solid #1e3a5f" },
    btnClose: { background: "none", border: "none", color: "#64748b", fontSize: "20px", cursor: "pointer", lineHeight: 1 },
    btnCancel: { background: "#071326", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "9px 18px", color: "#94a3b8", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
    notif: (type) => ({ position: "fixed", top: "20px", right: "20px", background: type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeIn 0.3s ease" }),
    confirmModal: { background: "#0f1f38", borderRadius: "16px", border: "1px solid #1e3a5f", padding: "32px", maxWidth: "380px", textAlign: "center" },
    confirmTitle: { fontSize: "18px", fontWeight: "700", color: "#ffffff", marginBottom: "10px" },
    confirmText: { fontSize: "14px", color: "#94a3b8", marginBottom: "24px" },
    btnDelConfirm: { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: "8px", padding: "10px 20px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  };

  const PengolahanTable = () => (
    <div style={styles.card}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>No</th>
              <th style={styles.th}>Kabupaten/Kota</th>
              {PENGOLAHAN_FIELDS.map(f => <th key={f.key} style={styles.thCenter}>{f.label}</th>)}
              <th style={styles.thCenter}>Total Pengolahan</th>
              <th style={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.no} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={styles.td}>{row.no}</td>
                <td style={styles.td}><span style={{ fontWeight: 600, color: "#e2e8f0" }}>{row.kabupaten}</span></td>
                {PENGOLAHAN_FIELDS.map(f => (
                  <td key={f.key} style={styles.tdNum}>
                    {row[f.key] > 0 ? fmt(row[f.key]) : <span style={{ color: "#374151" }}>-</span>}
                  </td>
                ))}
                <td style={styles.tdTotal}>{fmt(row.pengolahan_total)}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <button style={styles.btnEdit} onClick={() => openEdit(row)}>Edit</button>
                    <button style={styles.btnDel} onClick={() => setShowDeleteConfirm(row)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.tdFootLabel} colSpan={2}>JUMLAH TOTAL</td>
              {PENGOLAHAN_FIELDS.map(f => <td key={f.key} style={styles.tdFoot}>{fmt(grandTotal[f.key])}</td>)}
              <td style={styles.tdFoot}>{fmt(grandTotal.pengolahan_total)}</td>
              <td style={{ background: "#071326" }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const PemasaranTable = () => (
    <div style={styles.card}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>No</th>
              <th style={styles.th}>Kabupaten/Kota</th>
              {PEMASARAN_FIELDS.map(f => <th key={f.key} style={styles.thCenter}>{f.label}</th>)}
              <th style={styles.thCenter}>Total Pemasaran</th>
              <th style={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.no} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={styles.td}>{row.no}</td>
                <td style={styles.td}><span style={{ fontWeight: 600, color: "#e2e8f0" }}>{row.kabupaten}</span></td>
                {PEMASARAN_FIELDS.map(f => (
                  <td key={f.key} style={styles.tdNum}>
                    {row[f.key] > 0 ? fmt(row[f.key]) : <span style={{ color: "#374151" }}>-</span>}
                  </td>
                ))}
                <td style={styles.tdTotal}>{fmt(row.pemasaran_total)}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <button style={styles.btnEdit} onClick={() => openEdit(row)}>Edit</button>
                    <button style={styles.btnDel} onClick={() => setShowDeleteConfirm(row)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.tdFootLabel} colSpan={2}>JUMLAH TOTAL</td>
              {PEMASARAN_FIELDS.map(f => <td key={f.key} style={styles.tdFoot}>{fmt(grandTotal[f.key])}</td>)}
              <td style={styles.tdFoot}>{fmt(grandTotal.pemasaran_total)}</td>
              <td style={{ background: "#071326" }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {notification && <div style={styles.notif(notification.type)}>{notification.msg}</div>}

      <div style={styles.header}>
        <h1 style={styles.title}>Kelola Data Pengolahan & Pemasaran</h1>
        <p style={styles.subtitle}>Manajemen data statistik unit usaha pengolahan dan pemasaran hasil perikanan per tahun.</p>
      </div>

      <div style={styles.topBar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input style={styles.searchBox} placeholder="Cari kabupaten/kota..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={styles.btnExport} onClick={() => alert("Export Excel berhasil!")}>⬇ Export Excel</button>
          <button style={styles.btnPrimary} onClick={openAdd}>+ Tambah Data Baru</button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === "pengolahan")} onClick={() => setActiveTab("pengolahan")}>🏭 Kegiatan Pengolahan</button>
        <button style={styles.tab(activeTab === "pemasaran")} onClick={() => setActiveTab("pemasaran")}>🛒 Kegiatan Pemasaran</button>
      </div>

      <div style={{ marginBottom: "12px", fontSize: "13px", color: "#64748b" }}>
        Menampilkan <span style={{ color: "#06b6d4", fontWeight: 600 }}>{filtered.length}</span> dari {data.length} kabupaten/kota
      </div>

      {activeTab === "pengolahan" ? <PengolahanTable /> : <PemasaranTable />}

      {/* Modal Form */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHead}>
              <h2 style={styles.modalTitle}>{editItem ? "Edit Data" : "Tambah Data Baru"}</h2>
              <button style={styles.btnClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tahun</label>
                  <input style={styles.input} value={form.tahun} onChange={e => setForm(f => ({ ...f, tahun: e.target.value }))} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Kabupaten/Kota</label>
                  <input style={styles.input} value={form.kabupaten} onChange={e => setForm(f => ({ ...f, kabupaten: e.target.value }))} placeholder="Contoh: KAB. SIDOARJO" />
                </div>
              </div>

              <div style={styles.sectionLabel}> Data Pengolahan</div>
              <div style={styles.formGrid}>
                {PENGOLAHAN_FIELDS.map(f => (
                  <div key={f.key} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input type="number" step="0.01" style={styles.input} value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div style={styles.sectionLabel}> Data Pemasaran</div>
              <div style={styles.formGrid}>
                {PEMASARAN_FIELDS.map(f => (
                  <div key={f.key} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input type="number" step="0.01" style={styles.input} value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalFoot}>
              <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Batal</button>
              <button style={styles.btnPrimary} onClick={handleSave}> Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div style={styles.overlay}>
          <div style={styles.confirmModal}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🗑️</div>
            <div style={styles.confirmTitle}>Hapus Data?</div>
            <div style={styles.confirmText}>Data <strong>{showDeleteConfirm.kabupaten}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button style={styles.btnCancel} onClick={() => setShowDeleteConfirm(null)}>Batal</button>
              <button style={styles.btnDelConfirm} onClick={() => handleDelete(showDeleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}