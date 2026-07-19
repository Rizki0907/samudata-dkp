import React, { useState, useEffect } from 'react';
import { KAB_KOTA_OPTIONS } from '@/utils/constants';
import { BUDIDAYA_TAHUNAN_CONFIG } from '@/utils/BudidayaTahunanConfig';
import { Save, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import SearchableSelect from '../shared/SearchableSelect';
import api from '@/services/api';


const currentYear = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

const formatTitle = (title) => {
  if (!title) return '';
  let formatted = title.replace(/^(MODUL\s*\d+\s*:\s*|Seksi\s*\d+\s*:\s*)/i, '');
  formatted = formatted.replace(/\s*[-—]\s*dalam\s+(.+)$/i, ' ($1)');
  return formatted.trim();
};


export function BudidayaTahunanForm({ onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;
  const [tahun, setTahun] = useState(initialData?.tahun?.toString() || currentYear.toString());
  const [kabupaten, setKabupaten] = useState(initialData?.kabupaten_kota || '');
  const [activeModule, setActiveModule] = useState(initialData?.modul_id || BUDIDAYA_TAHUNAN_CONFIG[0].id);
  
  // formData stores the data for the currently active module
  const [formData, setFormData] = useState(initialData?.data || {});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-save logic
  useEffect(() => {
    if (isEditing) return;
    if (!tahun || !kabupaten || Object.keys(formData).length === 0) return;
    const key = `dkp2_${tahun}_${kabupaten.toLowerCase().replace(/ /g, '_')}_${activeModule}`;
    localStorage.setItem(key, JSON.stringify(formData));
  }, [formData, tahun, kabupaten, activeModule, isEditing]);

  // Load from local storage or server when module, tahun, or kabupaten changes
  useEffect(() => {
    if (isEditing) return;
    if (!tahun || !kabupaten) {
      setFormData({});
      return;
    }
    
    const loadData = () => {
      const key = `dkp2_${tahun}_${kabupaten.toLowerCase().replace(/ /g, '_')}_${activeModule}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        const config = BUDIDAYA_TAHUNAN_CONFIG.find(c => c.id === activeModule);
        if (config.tipe === 'REPEATABLE') {
          setFormData({ items: [{ id: Date.now() }] });
        } else {
          setFormData({});
        }
      }
    };
    
    loadData();
    setErrorMsg('');
    setSuccessMsg('');
  }, [activeModule, tahun, kabupaten]);

  const currentConfig = BUDIDAYA_TAHUNAN_CONFIG.find(c => c.id === activeModule);

  const handleInputChange = (seksiTitle, fieldName, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (!newData[seksiTitle]) newData[seksiTitle] = {};
      
      // Validation: >= 0 and numbers only unless text
      if (fieldName.includes('(Text)') || fieldName.includes('Daerah Distribusi') || fieldName.includes('Nama BBI') || fieldName.includes('Lokasi BBI')) {
         newData[seksiTitle][fieldName] = value;
      } else {
         const numVal = parseFloat(value);
         newData[seksiTitle][fieldName] = isNaN(numVal) || numVal < 0 ? '' : numVal;
      }

      // Auto-calculate for Grup C
      if (currentConfig.tipe === 'PRODUKSI' && fieldName !== 'JUMLAH') {
        let total = 0;
        currentConfig.seksi.forEach(s => {
          if (s.title.includes('Produksi Benih')) {
            s.fields.forEach(f => {
              if (f !== 'JUMLAH') {
                const val = (s.title === seksiTitle && f === fieldName) 
                   ? (isNaN(parseFloat(value)) ? 0 : parseFloat(value))
                   : parseFloat(newData[s.title]?.[f] || 0);
                total += val;
              }
            });
            if (!newData[s.title]) newData[s.title] = {};
            newData[s.title]['JUMLAH'] = total;
          }
        });
      }

      return newData;
    });
  };

  const handleRepeatableChange = (index, seksiTitle, fieldName, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (!newData.items) newData.items = [{ id: Date.now() }];
      
      const item = { ...newData.items[index] };
      if (!item[seksiTitle]) item[seksiTitle] = {};
      
      if (fieldName.includes('(Text)') || fieldName.includes('Nama BBI') || fieldName.includes('Lokasi BBI')) {
         item[seksiTitle][fieldName] = value;
      } else {
         const numVal = parseFloat(value);
         item[seksiTitle][fieldName] = isNaN(numVal) || numVal < 0 ? '' : numVal;
      }
      
      newData.items[index] = item;
      return newData;
    });
  };

  const addRepeatableRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now() }]
    }));
  };

  const removeRepeatableRow = (index) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!kabupaten) {
      setErrorMsg('Pilih Kabupaten/Kota terlebih dahulu.');
      return;
    }

    // Check if at least 1 field has data
    let hasData = false;
    if (currentConfig.tipe === 'REPEATABLE') {
      hasData = formData.items && formData.items.some(item => 
        Object.keys(item).some(k => k !== 'id' && Object.keys(item[k]).length > 0)
      );
    } else {
      hasData = Object.keys(formData).some(s => 
        Object.keys(formData[s]).some(f => formData[s][f] !== '' && formData[s][f] !== undefined)
      );
    }

    if (!hasData) {
      setErrorMsg('Mohon isi minimal 1 data sebelum menyimpan modul ini.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tahun: parseInt(tahun),
        kabupaten_kota: kabupaten,
        modul_id: activeModule,
        data: formData
      };
      
      await api.post('/budidaya-tahunan', payload);
      setSuccessMsg(`Modul ${currentConfig.title} berhasil disimpan!`);
      
      // Optional: Clear local storage upon successful submit? 
      // The user can keep it to continue editing later if they want.
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      setErrorMsg('Terjadi kesalahan saat menyimpan data ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm w-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Form Data Tahunan Budidaya</h2>
            <p className="text-sm text-muted-foreground mt-1">Isi data per modul. Tersimpan otomatis di perangkat Anda.</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="w-32">
              <SearchableSelect
                name="tahun"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                options={TAHUN_OPTIONS}
                placeholder="Tahun"
                className="py-2 h-[42px]"
              />
            </div>
            
            <div className="w-64">
              <SearchableSelect
                name="kabupaten"
                value={kabupaten}
                onChange={(e) => setKabupaten(e.target.value)}
                options={KAB_KOTA_OPTIONS}
                placeholder="Pilih Kabupaten/Kota"
                className="py-2 h-[42px]"
              />
            </div>

          
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground ml-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex min-h-[70vh] flex-1 overflow-hidden relative">
          
          {/* Block Overlay if Kab not selected */}
          {!kabupaten && (
            <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Pilih Kabupaten/Kota</h3>
              <p className="text-muted-foreground">Silakan pilih Kabupaten/Kota di kanan atas untuk mulai mengisi data.</p>
            </div>
          )}

          {/* Sidebar Modules */}
          <div className="w-72 border-r border-border bg-card/30 flex flex-col overflow-y-auto">
            {BUDIDAYA_TAHUNAN_CONFIG.reduce((acc, curr) => {
              const group = acc.find(g => g.group === curr.grup);
              if (group) group.items.push(curr);
              else acc.push({ group: curr.grup, items: [curr] });
              return acc;
            }, []).map((group, idx) => {
              // If editing and no items in this group match the activeModule, don't render the group header
              if (isEditing && !group.items.some(mod => mod.id === activeModule)) return null;

              return (
                <div key={idx} className="mb-4">
                  <div className={`px-4 py-2 text-xs font-bold text-muted-foreground bg-card/50 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 ${isEditing ? 'hidden' : ''}`}>
                    {group.group}
                  </div>
                  {group.items.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      disabled={isEditing && activeModule !== mod.id}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                        activeModule === mod.id 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-transparent text-muted-foreground hover:bg-muted'
                      } ${isEditing && activeModule !== mod.id ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                    >
                      {formatTitle(mod.title)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Main Form Area */}
          <div className="flex-1 overflow-y-auto bg-card flex flex-col">
            <div className="flex-1 p-6">
              
              <div className="mb-6 pb-4 border-b flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{formatTitle(currentConfig.title)}</h3>
                  {currentConfig.tipe === 'PRODUKSI' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-2">
                      ⚠️ Satuan Data: 1.000 Ekor
                    </span>
                  )}
                  {currentConfig.tipe === 'REPEATABLE' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                      ♻️ Bisa Input Lebih dari 1 Unit
                    </span>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  {successMsg}
                </div>
              )}

              <form id="tahunanForm" onSubmit={handleSubmit} className="space-y-8">
                
                {currentConfig.tipe !== 'REPEATABLE' ? (
                  // STANDARD & PRODUKSI RENDERING
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentConfig.seksi.map((seksi, sIdx) => (
                      <div key={sIdx} className="bg-background rounded-xl p-5 border border-border">
                        <h4 className="font-semibold text-foreground mb-4 pb-2 border-b">{formatTitle(seksi.title)}</h4>
                        <div className="space-y-4">
                          {seksi.fields.map((field, fIdx) => (
                            <div key={fIdx}>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">{field}</label>
                              <input
                                type={field.includes('Text') ? 'text' : 'number'}
                                step="any"
                                min="0"
                                value={formData[seksi.title]?.[field] ?? ''}
                                readOnly={field === 'JUMLAH' && currentConfig.tipe === 'PRODUKSI'}
                                onChange={(e) => handleInputChange(seksi.title, field, e.target.value)}
                                className={`w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium text-foreground ${
                                  field === 'JUMLAH' ? 'bg-muted font-bold' : 'bg-background'
                                }`}
                                placeholder={field.includes('Text') ? 'Masukkan teks' : '0'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // REPEATABLE RENDERING (For BBI)
                  <div className="space-y-8">
                    {(formData.items || []).map((item, index) => (
                      <div key={item.id} className="relative bg-background rounded-xl p-6 border border-border shadow-sm">
                        <div className="absolute top-4 right-4">
                          {(formData.items || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRepeatableRow(index)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                          <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          Data BBI Unit {index + 1}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {currentConfig.seksi.map((seksi, sIdx) => (
                            <div key={sIdx} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                              <h5 className="font-semibold text-foreground mb-3 pb-2 border-b text-sm">{formatTitle(seksi.title)}</h5>
                              <div className="space-y-3">
                                {seksi.fields.map((field, fIdx) => (
                                  <div key={fIdx}>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">{field}</label>
                                    <input
                                      type={field.includes('Text') || field.includes('Nama BBI') || field.includes('Lokasi BBI') ? 'text' : 'number'}
                                      step="any"
                                      min="0"
                                      value={item[seksi.title]?.[field] ?? ''}
                                      onChange={(e) => handleRepeatableChange(index, seksi.title, field, e.target.value)}
                                      className="w-full px-3 py-1.5 text-sm border border-input rounded-md focus:ring-2 focus:ring-primary/50 outline-none transition-all bg-background text-foreground"
                                      placeholder={field.includes('Text') ? 'Masukkan teks' : '0'}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addRepeatableRow}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium border border-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Unit BBI Lainnya
                    </button>
                  </div>
                )}
                
              </form>
            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-card border-t border-border flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border rounded-lg text-muted-foreground hover:bg-muted font-medium transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="tahunanForm"
                disabled={loading || !kabupaten}
                className="px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg font-medium shadow-lg shadow-primary/20 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <span className="animate-spin text-xl leading-none">⟳</span> : <Save className="w-5 h-5" />}
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
