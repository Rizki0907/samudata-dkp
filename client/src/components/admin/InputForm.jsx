import React, { useState, useEffect } from 'react';
import { GT_KAPAL_OPTIONS, ALAT_TANGKAP_OPTIONS, KOMODITAS_OPTIONS, PELABUHAN_OPTIONS } from '@/utils/constants';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InputForm({ initialData = null, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    tanggal: '',
    jam_labuh: '',
    jam_bongkar: '',
    nama_kapal: '',
    pelabuhan: PELABUHAN_OPTIONS[0],
    gt_kapal: GT_KAPAL_OPTIONS[0],
    alat_tangkap: ALAT_TANGKAP_OPTIONS[0],
    komoditas: KOMODITAS_OPTIONS[0],
    volume: '',
    harga: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggal: initialData.tanggal ? initialData.tanggal.split('T')[0] : '',
        jam_labuh: initialData.jam_labuh || '',
        jam_bongkar: initialData.jam_bongkar || '',
        nama_kapal: initialData.nama_kapal || '',
        pelabuhan: initialData.pelabuhan || PELABUHAN_OPTIONS[0],
        gt_kapal: initialData.gt_kapal || GT_KAPAL_OPTIONS[0],
        alat_tangkap: initialData.alat_tangkap || ALAT_TANGKAP_OPTIONS[0],
        komoditas: initialData.komoditas || KOMODITAS_OPTIONS[0],
        volume: initialData.volume || '',
        harga: initialData.harga || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const volumeVal = parseFloat(formData.volume) || 0;
  const hargaVal = parseFloat(formData.harga) || 0;
  const nilaiTotal = volumeVal * hargaVal;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          {initialData ? 'Edit Data Tangkapan' : 'Input Data Tangkapan Baru'}
        </h3>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waktu */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tanggal</label>
          <input 
            type="date" 
            name="tanggal"
            required
            value={formData.tanggal}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Jam Labuh</label>
            <input 
              type="time" 
              name="jam_labuh"
              required
              value={formData.jam_labuh}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Jam Bongkar</label>
            <input 
              type="time" 
              name="jam_bongkar"
              required
              value={formData.jam_bongkar}
              onChange={handleChange}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Kapal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nama Kapal</label>
          <input 
            type="text" 
            name="nama_kapal"
            required
            placeholder="Cth: KM Berkah Laut"
            value={formData.nama_kapal}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pelabuhan Pendaratan</label>
          <select 
            name="pelabuhan"
            value={formData.pelabuhan}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
          >
            {PELABUHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">GT Kapal</label>
          <select 
            name="gt_kapal"
            value={formData.gt_kapal}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
          >
            {GT_KAPAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Tangkapan */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Alat Tangkap</label>
          <select 
            name="alat_tangkap"
            value={formData.alat_tangkap}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
          >
            {ALAT_TANGKAP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Komoditas</label>
          <select 
            name="komoditas"
            value={formData.komoditas}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
          >
            {KOMODITAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Nominal */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Volume (Kg)</label>
          <input 
            type="number" 
            name="volume"
            required
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.volume}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Harga (Rp / Kg)</label>
          <input 
            type="number" 
            name="harga"
            required
            min="0"
            placeholder="Cth: 15000"
            value={formData.harga}
            onChange={handleChange}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Gunakan harga per Kg untuk estimasi nilai.</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Estimasi Total Nilai (Otomatis)</p>
          <p className="text-lg font-bold text-primary">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nilaiTotal)}
          </p>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl font-medium border border-border hover:bg-muted transition-colors text-sm"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 text-sm disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>
        </div>
      </div>
    </form>
  );
}
