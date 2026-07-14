import { useState, useEffect } from 'react';
import { KAB_KOTA_GT_KAPAL_OPTIONS, GT_KAPAL_OPTIONS, ALAT_TANGKAP_OPTIONS, KOMODITAS_OPTIONS, PELABUHAN_OPTIONS, KAB_KOTA_OPTIONS, PERAIRAN_OPTIONS, KOMODITAS_PUD_OPTIONS, ALAT_TANGKAP_PUD_OPTIONS, PUD_JENIS_PERAHU_OPTIONS, ALAT_TANGKAP_LAUT_OPTIONS, KOMODITAS_LAUT_OPTIONS } from '@/utils/constants';
import { Loader2, Plus, Trash2, Anchor, Droplets, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PerikananTangkapForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const [sumberData, setSumberData] = useState(null); // null, 'PELABUHAN', 'PUD', 'KAB_KOTA'
  
  const [formData, setFormData] = useState({
    tanggal: '',
    jam_labuh: '',
    jam_bongkar: '',
    nama_kapal: '',
    pelabuhan: PELABUHAN_OPTIONS[0],
    kabupaten_kota: '',
    jenis_perairan: PERAIRAN_OPTIONS[0],
    pud_populasi_alat: '',
    pud_jumlah_sampel: '',
    logistik: '',
    gt_kapal: GT_KAPAL_OPTIONS[0],
    alat_tangkap: ALAT_TANGKAP_OPTIONS[0],
    tangkapan: [
      { komoditas: KOMODITAS_OPTIONS[0], volume: '', harga: '', pud_tangkapan_sampel: '' }
    ]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setSumberData(initialData.sumber_data || 'PELABUHAN');
      setFormData({
        tanggal: initialData.tanggal ? initialData.tanggal.split('T')[0] : '',
        jam_labuh: initialData.jam_labuh || '',
        jam_bongkar: initialData.jam_bongkar || '',
        nama_kapal: initialData.nama_kapal || '',
        pelabuhan: initialData.pelabuhan || PELABUHAN_OPTIONS[0],
        kabupaten_kota: initialData.kabupaten_kota || '',
        jenis_perairan: initialData.jenis_perairan || PERAIRAN_OPTIONS[0],
        pud_populasi_alat: initialData.pud_populasi_alat || '',
        pud_jumlah_sampel: initialData.pud_jumlah_sampel || '',
        logistik: initialData.logistik || '',
        gt_kapal: initialData.gt_kapal || GT_KAPAL_OPTIONS[0],
        alat_tangkap: initialData.alat_tangkap || ALAT_TANGKAP_OPTIONS[0],
        tangkapan: [
          { 
            komoditas: initialData.komoditas || (initialData.sumber_data === 'PUD' ? KOMODITAS_PUD_OPTIONS[0] : KOMODITAS_OPTIONS[0]), 
            volume: initialData.volume || '', 
            harga: initialData.harga || '',
            pud_tangkapan_sampel: initialData.pud_tangkapan_sampel || '' 
          }
        ]
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTangkapanChange = (index, field, value) => {
    const newTangkapan = [...formData.tangkapan];
    newTangkapan[index][field] = value;
    setFormData(prev => ({ ...prev, tangkapan: newTangkapan }));
  };

  const addTangkapan = () => {
    setFormData(prev => ({
      ...prev,
      tangkapan: [...prev.tangkapan, { komoditas: KOMODITAS_OPTIONS[0], volume: '', harga: '', pud_tangkapan_sampel: '' }]
    }));
  };

  const removeTangkapan = (index) => {
    if (formData.tangkapan.length > 1) {
      const newTangkapan = formData.tangkapan.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, tangkapan: newTangkapan }));
    }
  };

  const validate = () => {
    // Basic validation for prototype
    const newErrors = {};
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    
    if (sumberData === 'PELABUHAN') {
      if (!formData.jam_labuh) newErrors.jam_labuh = 'Jam labuh wajib diisi';
      if (!formData.jam_bongkar) newErrors.jam_bongkar = 'Jam bongkar wajib diisi';
      if (!formData.nama_kapal) newErrors.nama_kapal = 'Nama kapal wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        sumber_data: sumberData,
        pelabuhan: isPelabuhan ? formData.pelabuhan : null,
        kabupaten_kota: !isPelabuhan ? formData.kabupaten_kota : null,
        nama_kapal: isPelabuhan ? formData.nama_kapal : null,
        jam_labuh: isPelabuhan ? formData.jam_labuh : null,
        jam_bongkar: isPelabuhan ? formData.jam_bongkar : null
      };
      onSubmit(dataToSubmit);
    }
  };

  const isPelabuhan = sumberData === 'PELABUHAN';
  const isPUD = sumberData === 'PUD';
  const isKabKota = sumberData === 'KAB_KOTA';

  const handleCabangSelect = (cabang) => {
    setSumberData(cabang);
    setFormData(prev => ({
      ...prev,
      pelabuhan: cabang === 'PELABUHAN' ? PELABUHAN_OPTIONS[0] : '',
      jenis_perairan: cabang === 'PUD' ? PERAIRAN_OPTIONS[0] : '',
      gt_kapal: cabang === 'PUD' ? PUD_JENIS_PERAHU_OPTIONS[0] : (cabang === 'KAB_KOTA' ? KAB_KOTA_GT_KAPAL_OPTIONS[0] : GT_KAPAL_OPTIONS[0]),
      alat_tangkap: cabang === 'PUD' ? ALAT_TANGKAP_PUD_OPTIONS[0] : (cabang === 'KAB_KOTA' ? ALAT_TANGKAP_LAUT_OPTIONS[0] : ALAT_TANGKAP_OPTIONS[0]),
      tangkapan: [
        {
          komoditas: cabang === 'PUD' ? KOMODITAS_PUD_OPTIONS[0] : (cabang === 'KAB_KOTA' ? KOMODITAS_LAUT_OPTIONS[0] : KOMODITAS_OPTIONS[0]),
          volume: '',
          harga: '',
          pud_tangkapan_sampel: ''
        }
      ]
    }));
  };

  const calculatePudVolume = (sampelVol) => {
    const pop = parseFloat(formData.pud_populasi_alat) || 0;
    const jml = parseFloat(formData.pud_jumlah_sampel) || 1;
    const samp = parseFloat(sampelVol) || 0;
    return (samp / (jml || 1)) * pop;
  };

  // Kalkulasi Total Nilai
  const nilaiTotal = formData.tangkapan.reduce((total, item) => {
    const v = isPUD ? calculatePudVolume(item.pud_tangkapan_sampel) : (parseFloat(item.volume) || 0);
    const h = parseFloat(item.harga) || 0;
    return total + (v * h);
  }, 0);

  // Jika belum pilih sumber data, tampilkan 3 opsi besar
  if (!sumberData && !initialData) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Pilih Sumber Perairan</h2>
          <p className="text-muted-foreground">Silakan pilih sumber laporan data perikanan tangkap. Format formulir akan menyesuaikan dengan pilihan Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <button onClick={() => handleCabangSelect('PELABUHAN')} className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Anchor className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Pelabuhan</h3>
              <p className="text-sm text-muted-foreground mt-1">Data pendaratan kapal di pelabuhan perikanan.</p>
            </div>
          </button>

          <button onClick={() => handleCabangSelect('PUD')} className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplets className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">PUD</h3>
              <p className="text-sm text-muted-foreground mt-1">Data Perairan Umum Darat (Sungai, Danau).</p>
            </div>
          </button>

          <button onClick={() => handleCabangSelect('KAB_KOTA')} className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/5 transition-all group">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Non Pelabuhan</h3>
              <p className="text-sm text-muted-foreground mt-1">Data rekapan atau estimasi dari Dinas Non Pelabuhan.</p>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">Batalkan</button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {initialData ? 'Edit Data Tangkapan' : 'Input Data Tangkapan'}
            <span className={cn(
              "text-xs font-bold px-2.5 py-0.5 rounded-full",
              isPelabuhan ? "bg-blue-500/10 text-blue-500" :
              sumberData === 'PUD' ? "bg-emerald-500/10 text-emerald-500" :
              "bg-orange-500/10 text-orange-500"
            )}>
              {isPelabuhan ? 'Pelabuhan' : sumberData === 'PUD' ? 'PUD' : 'Non Pelabuhan'}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Isi formulir pendaratan ikan harian secara lengkap.</p>
        </div>
        {!initialData && (
          <button onClick={() => setSumberData(null)} className="text-sm text-primary hover:underline">Ganti Perairan</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1 */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
            Informasi Waktu & Lokasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div>
              <label className="block text-sm font-medium mb-2">{(isPUD || isKabKota) ? "Bulan Laporan" : "Tanggal"}</label>
              <input 
                type={(isPUD || isKabKota) ? "month" : "date"} 
                name="tanggal"
                value={(isPUD || isKabKota) && formData.tanggal ? formData.tanggal.substring(0, 7) : formData.tanggal}
                onChange={(e) => {
                  const val = (isPUD || isKabKota) ? `${e.target.value}-01` : e.target.value;
                  setFormData({ ...formData, tanggal: val });
                }}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.tanggal ? "border-destructive" : "border-input")}
              />
              {errors.tanggal && <p className="text-xs text-destructive mt-1">{errors.tanggal}</p>}
            </div>

            {isPelabuhan ? (
              <div>
                <label className="block text-sm font-medium mb-2">Pelabuhan Pendaratan</label>
                <select 
                  name="pelabuhan"
                  value={formData.pelabuhan}
                  onChange={handleChange}
                  className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                >
                  {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Kabupaten / Kota</label>
                  <select 
                    name="kabupaten_kota"
                    value={formData.kabupaten_kota}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  >
                    <option value="">Pilih Kabupaten/Kota</option>
                    {KAB_KOTA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                
                {isPUD && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Jenis Perairan</label>
                    <select 
                      name="jenis_perairan"
                      value={formData.jenis_perairan}
                      onChange={handleChange}
                      className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    >
                      {PERAIRAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
                {isKabKota && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Daerah Operasi (WPP)</label>
                      <input 
                        type="text" 
                        name="jenis_perairan"
                        placeholder="Contoh: 711"
                        value={formData.jenis_perairan}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Perairan Pantai (Pendaratan)</label>
                      <input 
                        type="text" 
                        name="pelabuhan"
                        placeholder="Nama lokasi pendaratan"
                        value={formData.pelabuhan}
                        onChange={handleChange}
                        className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {isPelabuhan && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Jam Labuh</label>
                  <input 
                    type="time" 
                    name="jam_labuh"
                    value={formData.jam_labuh}
                    onChange={handleChange}
                    className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.jam_labuh ? "border-destructive" : "border-input")}
                  />
                  {errors.jam_labuh && <p className="text-xs text-destructive mt-1">{errors.jam_labuh}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Jam Bongkar</label>
                  <input 
                    type="time" 
                    name="jam_bongkar"
                    value={formData.jam_bongkar}
                    onChange={handleChange}
                    className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.jam_bongkar ? "border-destructive" : "border-input")}
                  />
                  {errors.jam_bongkar && <p className="text-xs text-destructive mt-1">{errors.jam_bongkar}</p>}
                </div>
              </>
            )}
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* SECTION 2 - DATA KAPAL */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold">Detail Kapal & Alat Tangkap</h3>
          </div>

          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 pl-10", (!isPelabuhan && !isPUD && !isKabKota) ? "md:grid-cols-1" : "")}>
            {isPelabuhan && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Nama Kapal</label>
                  <input 
                    type="text" 
                    name="nama_kapal"
                    placeholder="Cth: KM Berkah Laut"
                    value={formData.nama_kapal}
                    onChange={handleChange}
                    className={cn("w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50", errors.nama_kapal ? "border-destructive" : "border-input")}
                  />
                  {errors.nama_kapal && <p className="text-xs text-destructive mt-1">{errors.nama_kapal}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">GT Kapal</label>
                  <select 
                    name="gt_kapal"
                    value={formData.gt_kapal}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  >
                    {GT_KAPAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Data Operasional / Logistik</label>
                  <input 
                    type="text" 
                    name="logistik"
                    placeholder="Cth: Es 10 Balok, Solar 200 Liter, Umpan 5 Kg"
                    value={formData.logistik}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Isi detail logistik keberangkatan jika ada.</p>
                </div>
              </>
            )}

            <div className={cn(!isPelabuhan && !isPUD && !isKabKota && "md:col-span-2")}>
              <label className="block text-sm font-medium mb-2">Alat Tangkap</label>
              <select 
                name="alat_tangkap"
                value={formData.alat_tangkap}
                onChange={handleChange}
                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                {(isPUD ? ALAT_TANGKAP_PUD_OPTIONS : (isKabKota ? ALAT_TANGKAP_LAUT_OPTIONS : ALAT_TANGKAP_OPTIONS)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {(isPUD || isKabKota) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{isPUD ? "Jenis Perahu / GT" : "Ukuran / GT Kapal"}</label>
                  <select 
                    name="gt_kapal"
                    value={formData.gt_kapal}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  >
                    {(isPUD ? PUD_JENIS_PERAHU_OPTIONS : (isKabKota ? KAB_KOTA_GT_KAPAL_OPTIONS : GT_KAPAL_OPTIONS)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Populasi Alat di {isPUD ? "Wilayah" : "Kab/Kota"}</label>
                  <input 
                    type="number" 
                    name="pud_populasi_alat"
                    placeholder={isPUD ? "Total populasi alat di wilayah" : "Total alat di Kab/Kota"}
                    value={formData.pud_populasi_alat}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Jumlah Alat Sampel</label>
                  <input 
                    type="number" 
                    name="pud_jumlah_sampel"
                    placeholder="Berapa sampel yang didata?"
                    value={formData.pud_jumlah_sampel}
                    onChange={handleChange}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <div className="h-px bg-border my-6"></div>

        {/* SECTION 3 - MULTI KOMODITAS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
              Detail Tangkapan
            </h3>
            <button 
              type="button" 
              onClick={addTangkapan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Jenis Ikan
            </button>
          </div>
          
          <div className="space-y-4 pl-10">
            {formData.tangkapan.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-muted/30 rounded-xl border border-border/50 relative">
                {formData.tangkapan.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeTangkapan(index)}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Komoditas</label>
                  <select 
                    value={item.komoditas}
                    onChange={(e) => handleTangkapanChange(index, 'komoditas', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  >
                    {(isPUD ? KOMODITAS_PUD_OPTIONS : (isKabKota ? KOMODITAS_LAUT_OPTIONS : KOMODITAS_OPTIONS)).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {(isPUD || isKabKota) ? (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium mb-1.5 text-emerald-600 dark:text-emerald-400">Berat Sampel (Kg)</label>
                    <input 
                      type="number" 
                      step="0.01" min="0"
                      placeholder="Total sampel yg ditimbang"
                      value={item.pud_tangkapan_sampel}
                      onChange={(e) => handleTangkapanChange(index, 'pud_tangkapan_sampel', e.target.value)}
                      className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1.5">
                      Estimasi Vol: {new Intl.NumberFormat('id-ID').format(calculatePudVolume(item.pud_tangkapan_sampel))} Kg
                    </p>
                  </div>
                ) : (
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Volume (Kg)</label>
                    <input 
                      type="number" 
                      step="0.01" min="0"
                      placeholder="Misal: 105.5"
                      value={item.volume}
                      onChange={(e) => handleTangkapanChange(index, 'volume', e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    />
                  </div>
                )}

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Harga (Rp / Kg)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Cth: 15000"
                    value={item.harga}
                    onChange={(e) => handleTangkapanChange(index, 'harga', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions & Summary */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 min-w-[250px]">
            <p className="text-xs text-muted-foreground font-medium mb-1">Estimasi Total Nilai Semua Tangkapan</p>
            <p className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nilaiTotal)}
            </p>
          </div>

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
