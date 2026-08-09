import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Ship, Users, Activity, Fish } from 'lucide-react';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { 
  PELABUHAN_OPTIONS, 
  KAB_KOTA_OPTIONS, 
  PERAIRAN_OPTIONS,
  ALAT_TANGKAP_LAUT_OPTIONS,
  ALAT_TANGKAP_PUD_OPTIONS
} from '@/utils/constants';
import { useMasterDataStore } from '@/store/masterDataStore';
import { useAuthStore } from '@/store/authStore';

const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

export function TangkapTahunanForm({ initialData, isLoading, onSubmit, onCancel }) {
  const { getKabKotaByPelabuhan } = useMasterDataStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('umum'); // umum, nelayan, rtp, kapal, api

  const defaultRtp = {
    tanpa_perahu: 0,
    perahu_tanpa_motor: { jukung: 0, papan_kecil: 0, papan_sedang: 0, papan_besar: 0 },
    motor_tempel: { lt_5: 0, gt_5_10: 0, gt_10_20: 0, gt_20_30: 0, gt_30: 0, total_pud: 0 },
    kapal_motor: { lt_5: 0, gt_5_10: 0, gt_10_20: 0, gt_20_30: 0, gt_30_50: 0, gt_50_100: 0, gt_100_200: 0, gt_200_300: 0, gt_300_500: 0, gt_500: 0, total_pud: 0 }
  };

  const defaultNelayan = { penuh: 0, sambilan_utama: 0, sambilan_tambahan: 0 };

  const defaultKapal = {
    perahu_tanpa_motor: { jukung: 0, papan_kecil: 0, papan_sedang: 0, papan_besar: 0 },
    motor_tempel: { lt_5: 0, gt_5_10: 0, gt_10_20: 0, gt_20_30: 0, gt_30: 0, total_pud: 0 },
    kapal_motor: { lt_5: 0, gt_5_10: 0, gt_10_20: 0, gt_20_30: 0, gt_30_50: 0, gt_50_100: 0, gt_100_200: 0, gt_200_300: 0, gt_300_500: 0, gt_500: 0, total_pud: 0 }
  };

  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear().toString(),
    sumber_data: 'PELABUHAN',
    pelabuhan: '',
    kabupaten_kota: '',
    jenis_perairan: '',
    rtp: defaultRtp,
    nelayan: defaultNelayan,
    kapal: defaultKapal,
    alat_tangkap: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        rtp: initialData.rtp || defaultRtp,
        nelayan: initialData.nelayan || defaultNelayan,
        kapal: initialData.kapal || defaultKapal,
        alat_tangkap: Array.isArray(initialData.alat_tangkap) ? initialData.alat_tangkap : []
      });
    }
  }, [initialData]);

  // Handle nested object changes
  const handleNestedChange = (section, category, field, value) => {
    const numValue = value === '' ? 0 : Number(value);
    setFormData(prev => {
      const updatedSection = { ...prev[section] };
      if (category) {
        updatedSection[category] = { ...updatedSection[category], [field]: numValue };
      } else {
        updatedSection[field] = numValue;
      }
      return { ...prev, [section]: updatedSection };
    });
  };

  // Alat Tangkap
  const addAlatTangkap = () => {
    setFormData(prev => ({
      ...prev,
      alat_tangkap: [...prev.alat_tangkap, { nama: '', jumlah: 0 }]
    }));
  };

  const updateAlatTangkap = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.alat_tangkap];
      newList[index] = { ...newList[index], [field]: field === 'jumlah' ? Number(value) : value };
      return { ...prev, alat_tangkap: newList };
    });
  };

  const removeAlatTangkap = (index) => {
    setFormData(prev => ({
      ...prev,
      alat_tangkap: prev.alat_tangkap.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Auto map Perairan Pantai untuk LAUT
    if (submitData.sumber_data !== 'PUD') {
      const SELATAN_JAWA = [
        "Banyuwangi", "Blitar", "Jember", "Lumajang", "Malang", 
        "Pacitan", "Trenggalek", "Tulungagung", "Kota Blitar", "Kota Malang"
      ];
      submitData.jenis_perairan = SELATAN_JAWA.includes(submitData.kabupaten_kota) 
        ? "Selatan Jawa" 
        : "Utara Jawa";
    } else {
      submitData.jenis_perairan = '';
    }

    if (!initialData) {
      submitData.status = user?.role === 'admin_pusat' ? 'APPROVED' : 'PENDING';
    }
    onSubmit(submitData);
  };

  const isPUD = formData.sumber_data === 'PUD';

  const renderTabButton = (id, label, icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors border-b-2 ${
        activeTab === id 
        ? 'border-primary text-primary bg-primary/5' 
        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden w-full max-w-5xl flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-4 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {initialData ? 'Edit Data Tahunan' : 'Input Data Tahunan'}
        </h2>
        <button onClick={onCancel} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex px-6 pt-4 border-b border-border bg-muted/30 shrink-0 overflow-x-auto">
        {renderTabButton('umum', 'Info Utama', <Activity className="w-4 h-4" />)}
        {renderTabButton('nelayan', 'Nelayan', <Users className="w-4 h-4" />)}
        {renderTabButton('rtp', 'RTP', <Users className="w-4 h-4" />)}
        {renderTabButton('kapal', 'Kapal', <Ship className="w-4 h-4" />)}
        {renderTabButton('api', 'Alat Tangkap', <Fish className="w-4 h-4" />)}
      </div>

      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        <form id="tahunanForm" onSubmit={handleSubmit} className="space-y-6 pb-32">
          
          {/* TAB UMUM */}
          <div className={activeTab === 'umum' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tahun</label>
                <input
                  type="number"
                  name="tahun"
                  value={formData.tahun}
                  onChange={(e) => setFormData({...formData, tahun: e.target.value})}
                  min="2000"
                  max={new Date().getFullYear()}
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Sumber Data / Perairan</label>
                <div className="flex gap-4 p-1 bg-muted/50 rounded-xl border border-border/50">
                  {['PELABUHAN', 'PUD', 'KAB_KOTA'].map(type => (
                    <label key={type} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sumber_data"
                        className="peer sr-only"
                        value={type}
                        checked={formData.sumber_data === type}
                        onChange={(e) => setFormData({...formData, sumber_data: e.target.value, pelabuhan: '', jenis_perairan: ''})}
                      />
                      <div className="text-center py-2 px-3 rounded-lg text-sm font-medium text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-hover:bg-muted transition-all">
                        {type === 'KAB_KOTA' ? 'Non Pelabuhan' : type}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Kabupaten / Kota (Wilayah)</label>
                <SearchableSelect
                  name="kabupaten_kota"
                  value={formData.kabupaten_kota}
                  onChange={(e) => setFormData({...formData, kabupaten_kota: e.target.value})}
                  options={KAB_KOTA_OPTIONS}
                  placeholder="Pilih Kab/Kota..."
                  required
                />
              </div>
            </div>
          </div>

          {/* TAB NELAYAN */}
          <div className={activeTab === 'nelayan' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nelayan Penuh</label>
                <input type="number" min="0" value={formData.nelayan.penuh || 0} onChange={e => handleNestedChange('nelayan', null, 'penuh', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nelayan Sambilan Utama</label>
                <input type="number" min="0" value={formData.nelayan.sambilan_utama || 0} onChange={e => handleNestedChange('nelayan', null, 'sambilan_utama', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nelayan Sambilan Tambahan</label>
                <input type="number" min="0" value={formData.nelayan.sambilan_tambahan || 0} onChange={e => handleNestedChange('nelayan', null, 'sambilan_tambahan', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* TAB RTP */}
          <div className={activeTab === 'rtp' ? 'block space-y-6' : 'hidden'}>
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Tanpa Perahu</h3>
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium mb-1.5">Jumlah (RTP)</label>
                <input type="number" min="0" value={formData.rtp.tanpa_perahu || 0} onChange={e => handleNestedChange('rtp', null, 'tanpa_perahu', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Perahu Tanpa Motor</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({jukung: 'Jukung', papan_kecil: 'Papan Kecil', papan_sedang: 'Papan Sedang', papan_besar: 'Papan Besar'}).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input type="number" min="0" value={formData.rtp.perahu_tanpa_motor[key] || 0} onChange={e => handleNestedChange('rtp', 'perahu_tanpa_motor', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {!isPUD ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Motor Tempel (Berdasarkan GT)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries({lt_5: '< 5', gt_5_10: '5-10', gt_10_20: '10-20', gt_20_30: '20-30', gt_30: '>30'}).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1.5">{label} GT</label>
                        <input type="number" min="0" value={formData.rtp.motor_tempel[key] || 0} onChange={e => handleNestedChange('rtp', 'motor_tempel', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Kapal Motor (Berdasarkan GT)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries({lt_5: '< 5', gt_5_10: '5-10', gt_10_20: '10-20', gt_20_30: '20-30', gt_30_50: '30-50', gt_50_100: '50-100', gt_100_200: '100-200', gt_200_300: '200-300', gt_300_500: '300-500', gt_500: '>500'}).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1.5">{label} GT</label>
                        <input type="number" min="0" value={formData.rtp.kapal_motor[key] || 0} onChange={e => handleNestedChange('rtp', 'kapal_motor', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Motor Tempel</h3>
                  <label className="block text-sm font-medium mb-1.5">Jumlah (RTP)</label>
                  <input type="number" min="0" value={formData.rtp.motor_tempel.total_pud || 0} onChange={e => handleNestedChange('rtp', 'motor_tempel', 'total_pud', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Kapal Motor</h3>
                  <label className="block text-sm font-medium mb-1.5">Jumlah (RTP)</label>
                  <input type="number" min="0" value={formData.rtp.kapal_motor.total_pud || 0} onChange={e => handleNestedChange('rtp', 'kapal_motor', 'total_pud', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* TAB KAPAL */}
          <div className={activeTab === 'kapal' ? 'block space-y-6' : 'hidden'}>
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Perahu Tanpa Motor</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({jukung: 'Jukung', papan_kecil: 'Papan Kecil', papan_sedang: 'Papan Sedang', papan_besar: 'Papan Besar'}).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input type="number" min="0" value={formData.kapal.perahu_tanpa_motor[key] || 0} onChange={e => handleNestedChange('kapal', 'perahu_tanpa_motor', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {!isPUD ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Motor Tempel (Berdasarkan GT)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries({lt_5: '< 5', gt_5_10: '5-10', gt_10_20: '10-20', gt_20_30: '20-30', gt_30: '>30'}).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1.5">{label} GT</label>
                        <input type="number" min="0" value={formData.kapal.motor_tempel[key] || 0} onChange={e => handleNestedChange('kapal', 'motor_tempel', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Kapal Motor (Berdasarkan GT)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries({lt_5: '< 5', gt_5_10: '5-10', gt_10_20: '10-20', gt_20_30: '20-30', gt_30_50: '30-50', gt_50_100: '50-100', gt_100_200: '100-200', gt_200_300: '200-300', gt_300_500: '300-500', gt_500: '>500'}).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1.5">{label} GT</label>
                        <input type="number" min="0" value={formData.kapal.kapal_motor[key] || 0} onChange={e => handleNestedChange('kapal', 'kapal_motor', key, e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Motor Tempel</h3>
                  <label className="block text-sm font-medium mb-1.5">Jumlah Kapal</label>
                  <input type="number" min="0" value={formData.kapal.motor_tempel.total_pud || 0} onChange={e => handleNestedChange('kapal', 'motor_tempel', 'total_pud', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Kapal Motor</h3>
                  <label className="block text-sm font-medium mb-1.5">Jumlah Kapal</label>
                  <input type="number" min="0" value={formData.kapal.kapal_motor.total_pud || 0} onChange={e => handleNestedChange('kapal', 'kapal_motor', 'total_pud', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* TAB ALAT TANGKAP */}
          <div className={activeTab === 'api' ? 'block' : 'hidden'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Daftar Alat Penangkap Ikan (A.P.I)</h3>
              <button type="button" onClick={addAlatTangkap} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 text-sm font-medium">
                <Plus className="w-4 h-4" /> Tambah Alat Tangkap
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.alat_tangkap.map((api, index) => (
                <div key={index} className="flex gap-4 items-end bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1.5">Nama Alat Tangkap</label>
                    <SearchableSelect
                      name={`api_nama_${index}`}
                      value={api.nama}
                      onChange={e => updateAlatTangkap(index, 'nama', e.target.value)}
                      options={isPUD ? ALAT_TANGKAP_PUD_OPTIONS : ALAT_TANGKAP_LAUT_OPTIONS}
                      placeholder="Pilih Alat Tangkap..."
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-medium mb-1.5">Jumlah (Unit)</label>
                    <input type="number" min="0" value={api.jumlah || 0} onChange={e => updateAlatTangkap(index, 'jumlah', e.target.value)} className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                  </div>
                  <button type="button" onClick={() => removeAlatTangkap(index)} className="bg-destructive/10 text-destructive hover:bg-destructive/20 p-2.5 rounded-lg mb-[1px]">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.alat_tangkap.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  Belum ada alat tangkap. Klik Tambah untuk memasukkan.
                </div>
              )}
            </div>
          </div>

        </form>
      </div>

      <div className="bg-muted/30 p-6 border-t border-border flex justify-end gap-3 shrink-0">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 font-medium text-muted-foreground bg-background border border-border rounded-xl hover:bg-muted transition-colors">
          Batal
        </button>
        <button form="tahunanForm" type="submit" disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70">
          {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Data Tahunan
        </button>
      </div>
      </div>
    </div>
  );
}
