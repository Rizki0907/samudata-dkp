import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Anchor, Droplets, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { useMasterDataStore } from '@/store/masterDataStore';

export function PerikananTangkapForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const getOptions = useMasterDataStore((state) => state.getOptions);
  
  const [sumberData, setSumberData] = useState(null); // null, 'PELABUHAN', 'PUD', 'KAB_KOTA'
  
  const isPelabuhan = sumberData === 'PELABUHAN';
  const isPUD = sumberData === 'PUD';
  const isKabKota = sumberData === 'KAB_KOTA';

  const PELABUHAN_OPTIONS = getOptions('PELABUHAN');
  const KAB_KOTA_OPTIONS = getOptions('KAB_KOTA');
  const WPP_OPTIONS = getOptions(isKabKota ? 'WPP_NON_PELABUHAN' : 'WPP');
  const PERBEKALAN_OPTIONS = getOptions(isKabKota ? 'PERBEKALAN_NON_PELABUHAN' : 'PERBEKALAN');
  const PERAIRAN_OPTIONS = getOptions('JENIS_PERAIRAN');
  
  const ALAT_TANGKAP_LAUT = getOptions(isKabKota ? 'ALAT_TANGKAP_NON_PELABUHAN' : 'ALAT_TANGKAP_LAUT');
  const KOMODITAS_LAUT_OPTIONS = getOptions(isKabKota ? 'KOMODITAS_TANGKAP_NON_PELABUHAN' : 'KOMODITAS_TANGKAP_LAUT');
  const GT_KAPAL_LAUT = getOptions(isKabKota ? 'GT_KAPAL_NON_PELABUHAN' : 'GT_KAPAL_LAUT');

  const KOMODITAS_PUD_OPTIONS = getOptions('KOMODITAS_TANGKAP_PUD');
  const ALAT_TANGKAP_PUD = getOptions('ALAT_TANGKAP_PUD');
  const JENIS_PERAHU_PUD = getOptions('JENIS_PERAHU_PUD');
  
  const [formData, setFormData] = useState({
    tanggal: '',
    jam_labuh: '',
    jam_bongkar: '',
    nama_kapal: '',
    pelabuhan: '',
    kabupaten_kota: '',
    wpp: '',
    jenis_perairan: '',
    pud_populasi_alat: '',
    pud_jumlah_sampel: '',
    logistik: [{ nama: '', jumlah: '' }],
    gt_kapal: '',
    alat_tangkap: '',
    tangkapan: [
      { komoditas: '', bentuk_ikan: 'Segar', volume: '', harga: '', pud_tangkapan_sampel: '' }
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
        pelabuhan: initialData.pelabuhan || '',
        kabupaten_kota: initialData.kabupaten_kota || '',
        wpp: initialData.wpp || '',
        jenis_perairan: initialData.jenis_perairan || '',
        pud_populasi_alat: initialData.pud_populasi_alat || '',
        pud_jumlah_sampel: initialData.pud_jumlah_sampel || '',
        logistik: (() => {
          if (!initialData.logistik) return [{ nama: '', jumlah: '' }];
          try {
            const parsed = JSON.parse(initialData.logistik);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ nama: '', jumlah: '' }];
          } catch (e) {
            // legacy string fallback
            return [{ nama: '', jumlah: '', legacy: initialData.logistik }];
          }
        })(),
        gt_kapal: initialData.gt_kapal || '',
        alat_tangkap: initialData.alat_tangkap || '',
        tangkapan: [
          { 
            komoditas: initialData.komoditas || '', 
            volume: initialData.volume || '', 
            harga: initialData.harga || '',
            pud_tangkapan_sampel: initialData.pud_tangkapan_sampel || '' 
          }
        ]
      });
    } else {
      // Set default values after options are loaded if creating new
      if(sumberData && !formData.pelabuhan && PELABUHAN_OPTIONS.length > 0) {
        setFormData(prev => ({
          ...prev,
          pelabuhan: PELABUHAN_OPTIONS[0] || '',
          kabupaten_kota: KAB_KOTA_OPTIONS[0] || '',
          wpp: WPP_OPTIONS[0] || '',
          jenis_perairan: PERAIRAN_OPTIONS[0] || '',
          gt_kapal: sumberData === 'PUD' ? (JENIS_PERAHU_PUD[0] || '') : (GT_KAPAL_LAUT[0] || ''),
          alat_tangkap: sumberData === 'PUD' ? (ALAT_TANGKAP_PUD[0] || '') : (ALAT_TANGKAP_LAUT[0] || ''),
          logistik: [{ nama: PERBEKALAN_OPTIONS[0]?.nama || PERBEKALAN_OPTIONS[0] || '', jumlah: '' }],
          tangkapan: [{ komoditas: sumberData === 'PUD' ? (KOMODITAS_PUD_OPTIONS[0] || '') : (KOMODITAS_LAUT_OPTIONS[0] || ''), bentuk_ikan: 'Segar', volume: '', harga: '', pud_tangkapan_sampel: '' }]
        }));
      }
    }
  }, [
    initialData, sumberData, PELABUHAN_OPTIONS.length, KAB_KOTA_OPTIONS.length, 
    PERAIRAN_OPTIONS.length, ALAT_TANGKAP_LAUT.length, ALAT_TANGKAP_PUD.length, 
    GT_KAPAL_LAUT.length, JENIS_PERAHU_PUD.length, WPP_OPTIONS.length, 
    KOMODITAS_LAUT_OPTIONS.length, KOMODITAS_PUD_OPTIONS.length, PERBEKALAN_OPTIONS.length
  ]);

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

  const handleLogistikChange = (index, field, value) => {
    const newLogistik = [...formData.logistik];
    newLogistik[index][field] = value;
    setFormData(prev => ({ ...prev, logistik: newLogistik }));
  };

  const addLogistik = () => {
    setFormData(prev => ({
      ...prev,
      logistik: [...prev.logistik, { nama: PERBEKALAN_OPTIONS[0]?.nama || PERBEKALAN_OPTIONS[0] || '', jumlah: '' }]
    }));
  };

  const removeLogistik = (index) => {
    if (formData.logistik.length > 1) {
      const newLogistik = formData.logistik.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, logistik: newLogistik }));
    }
  };

  const addTangkapan = () => {
    const isPUD = formData.sumber_data === 'PUD';
    const defaultKom = isPUD ? KOMODITAS_PUD_OPTIONS[0] : KOMODITAS_LAUT_OPTIONS[0];
    setFormData(prev => ({
      ...prev,
      tangkapan: [...prev.tangkapan, { komoditas: defaultKom, bentuk_ikan: 'Segar', volume: '', harga: '', pud_tangkapan_sampel: '' }]
    }));
  };

  const removeTangkapan = (index) => {
    if (formData.tangkapan.length > 1) {
      const newTangkapan = formData.tangkapan.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, tangkapan: newTangkapan }));
    }
  };

  const validate = () => {
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
        wpp: isKabKota ? formData.wpp : null,
        nama_kapal: isPelabuhan ? formData.nama_kapal : null,
        jam_labuh: isPelabuhan ? formData.jam_labuh : null,
        jam_bongkar: isPelabuhan ? formData.jam_bongkar : null
      };
      onSubmit(dataToSubmit);
    }
  };

  const handleCabangSelect = (cabang) => {
    setSumberData(cabang);
    setFormData(prev => ({
      ...prev,
      pelabuhan: cabang === 'PELABUHAN' ? PELABUHAN_OPTIONS[0] || '' : '',
      kabupaten_kota: cabang !== 'PELABUHAN' ? KAB_KOTA_OPTIONS[0] || '' : '',
      wpp: cabang === 'KAB_KOTA' ? WPP_OPTIONS[0] || '' : '',
      logistik: [{ nama: PERBEKALAN_OPTIONS[0]?.nama || PERBEKALAN_OPTIONS[0] || '', jumlah: '' }],
      jenis_perairan: cabang === 'PUD' ? PERAIRAN_OPTIONS[0] || '' : '',
      gt_kapal: cabang === 'PUD' ? JENIS_PERAHU_PUD[0] || '' : GT_KAPAL_LAUT[0] || '',
      alat_tangkap: cabang === 'PUD' ? ALAT_TANGKAP_PUD[0] || '' : ALAT_TANGKAP_LAUT[0] || '',
      tangkapan: [
        {
          komoditas: cabang === 'PUD' ? KOMODITAS_PUD_OPTIONS[0] || '' : KOMODITAS_LAUT_OPTIONS[0] || '',
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

  const nilaiTotal = formData.tangkapan.reduce((total, item) => {
    const v = isPUD ? calculatePudVolume(item.pud_tangkapan_sampel) : (parseFloat(item.volume) || 0);
    const h = parseFloat(item.harga) || 0;
    return total + (v * h);
  }, 0);

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
                <SearchableSelect
                  name="pelabuhan"
                  value={formData.pelabuhan}
                  onChange={handleChange}
                  options={PELABUHAN_OPTIONS}
                  placeholder="Cari Pelabuhan..."
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Kabupaten / Kota</label>
                  <SearchableSelect
                    name="kabupaten_kota"
                    value={formData.kabupaten_kota}
                    onChange={handleChange}
                    options={KAB_KOTA_OPTIONS}
                    placeholder="Pilih Kabupaten/Kota..."
                  />
                </div>
                
                {isPUD && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Jenis Perairan</label>
                    <SearchableSelect
                      name="jenis_perairan"
                      value={formData.jenis_perairan}
                      onChange={handleChange}
                      options={PERAIRAN_OPTIONS}
                      placeholder="Pilih Jenis Perairan..."
                    />
                  </div>
                )}
                {isKabKota && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Daerah Operasi (WPP)</label>
                      <SearchableSelect
                        name="wpp"
                        value={formData.wpp}
                        onChange={handleChange}
                        options={WPP_OPTIONS}
                        placeholder="Pilih WPP..."
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
                  <SearchableSelect
                    name="gt_kapal"
                    value={formData.gt_kapal}
                    onChange={handleChange}
                    options={GT_KAPAL_LAUT}
                    placeholder="Pilih GT Kapal..."
                  />
                </div>
                
                {!isKabKota && (
                  <div className="md:col-span-2 mt-4 border border-border rounded-xl p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium">Data Operasional / Perbekalan</label>
                      <button 
                        type="button" 
                        onClick={addLogistik}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" /> Tambah Perbekalan
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {Array.isArray(formData.logistik) && formData.logistik.map((item, index) => {
                        return (
                          <div key={index} className="flex items-end gap-3 relative">
                            <div className="flex-1">
                              <label className="block text-xs font-medium mb-1 text-muted-foreground">Jenis Logistik</label>
                              <SearchableSelect
                                name="logistik_nama"
                                value={item.nama}
                                onChange={(e) => handleLogistikChange(index, 'nama', e.target.value)}
                                options={PERBEKALAN_OPTIONS.map(opt => typeof opt === 'object' ? opt.nama : opt)}
                                placeholder="Pilih Perbekalan..."
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium mb-1 text-muted-foreground">Jumlah</label>
                              <input 
                                type="number" 
                                step="0.01" min="0"
                                placeholder="Jumlah"
                                value={item.jumlah}
                                onChange={(e) => handleLogistikChange(index, 'jumlah', e.target.value)}
                                className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input text-sm"
                              />
                            </div>
                            {item.legacy && (
                              <div className="flex-1 text-xs text-destructive">
                                Data Lama: {item.legacy}
                              </div>
                            )}
                            {formData.logistik.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeLogistik(index)}
                                className="w-9 h-9 shrink-0 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors mb-0.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className={cn(!isPelabuhan && !isPUD && !isKabKota && "md:col-span-2")}>
              <label className="block text-sm font-medium mb-2">Alat Tangkap</label>
              <SearchableSelect
                name="alat_tangkap"
                value={formData.alat_tangkap}
                onChange={handleChange}
                options={isPUD ? ALAT_TANGKAP_PUD : ALAT_TANGKAP_LAUT}
                placeholder="Pilih Alat Tangkap..."
              />
            </div>

            {(isPUD || isKabKota) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">{isPUD ? "Jenis Perahu / GT" : "Ukuran / GT Kapal"}</label>
                  <SearchableSelect
                    name="gt_kapal"
                    value={formData.gt_kapal}
                    onChange={handleChange}
                    options={isPUD ? JENIS_PERAHU_PUD : GT_KAPAL_LAUT}
                    placeholder="Pilih Ukuran/GT..."
                  />
                </div>
                {isPUD && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Populasi Alat di Wilayah</label>
                      <input 
                        type="number" 
                        name="pud_populasi_alat"
                        placeholder="Total populasi alat di wilayah"
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
          </div>
          
          <div className="space-y-4 pl-10 pr-2">
            <div className="flex justify-end mb-2">
              <button 
                type="button" 
                onClick={addTangkapan}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Jenis Ikan
              </button>
            </div>
            {formData.tangkapan.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-muted/30 rounded-xl border border-border/50 relative">
                {formData.tangkapan.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeTangkapan(index)}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                
                <div className={isPelabuhan ? "md:col-span-2" : "md:col-span-4"}>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Komoditas</label>
                  <SearchableSelect
                    name="komoditas"
                    value={item.komoditas}
                    onChange={(e) => handleTangkapanChange(index, 'komoditas', e.target.value)}
                    options={isPUD ? KOMODITAS_PUD_OPTIONS : KOMODITAS_LAUT_OPTIONS}
                    placeholder="Pilih Komoditas Ikan..."
                  />
                </div>

                {isPelabuhan && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Bentuk Ikan</label>
                    <select
                      value={item.bentuk_ikan || 'Segar'}
                      onChange={(e) => handleTangkapanChange(index, 'bentuk_ikan', e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input text-sm"
                    >
                      <option value="Segar">Segar</option>
                      <option value="Beku">Beku</option>
                    </select>
                  </div>
                )}

                {isPUD ? (
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
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Volume Tangkapan (Kg)</label>
                    <input 
                      type="number" 
                      step="0.01" min="0"
                      placeholder="Volume"
                      value={item.volume}
                      onChange={(e) => handleTangkapanChange(index, 'volume', e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    />
                  </div>
                )}

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Harga per Kg (Rp)</label>
                  <input 
                    type="number" 
                    step="0.01" min="0"
                    placeholder="Harga Ikan"
                    value={item.harga}
                    onChange={(e) => handleTangkapanChange(index, 'harga', e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Subtotal: Rp {new Intl.NumberFormat('id-ID').format(
                      (isPUD ? calculatePudVolume(item.pud_tangkapan_sampel) : (parseFloat(item.volume) || 0)) * (parseFloat(item.harga) || 0)
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end pl-10">
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-4 min-w-[300px]">
              <p className="text-sm font-medium text-primary mb-1">Total Nilai Produksi</p>
              <p className="text-2xl font-bold text-foreground">
                Rp {new Intl.NumberFormat('id-ID').format(nilaiTotal)}
              </p>
            </div>
          </div>
        </section>

        <div className="h-px bg-border my-8"></div>

        <div className="flex justify-end gap-3 pt-6">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isLoading || formData.tangkapan.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
