import React, { useMemo, useState } from 'react';
import { ChevronDown, Save, X } from 'lucide-react';

// ============================================================================
// MASTER DATA & OPTIONS
// ============================================================================
export const KABUPATEN_KOTA_OPTIONS = [
  'KAB. PACITAN', 'KAB. PONOROGO', 'KAB. TRENGGALEK', 'KAB. TULUNGAGUNG',
  'KAB. BLITAR', 'KAB. KEDIRI', 'KAB. MALANG', 'KAB. LUMAJANG', 'KAB. JEMBER',
  'KAB. BANYUWANGI', 'KAB. BONDOWOSO', 'KAB. SITUBONDO', 'KAB. PROBOLINGGO',
  'KAB. PASURUAN', 'KAB. SIDOARJO', 'KAB. MOJOKERTO', 'KAB. JOMBANG',
  'KAB. NGANJUK', 'KAB. MADIUN', 'KAB. MAGETAN', 'KAB. NGAWI', 'KAB. BOJONEGORO',
  'KAB. TUBAN', 'KAB. LAMONGAN', 'KAB. GRESIK', 'KAB. BANGKALAN', 'KAB. SAMPANG',
  'KAB. PAMEKASAN', 'KAB. SUMENEP', 'KOTA KEDIRI', 'KOTA BLITAR', 'KOTA MALANG',
  'KOTA PROBOLINGGO', 'KOTA PASURUAN', 'KOTA MOJOKERTO', 'KOTA MADIUN',
  'KOTA SURABAYA', 'KOTA BATU',
];

// Dropdown Tahun: 1 tahun ke depan s.d. 6 tahun ke belakang, dihitung otomatis dari tahun berjalan.
const CURRENT_YEAR = new Date().getFullYear();
export const TAHUN_OPTIONS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR + 1 - i));

export const JENIS_KEGIATAN_PENGOLAHAN = [
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
];

export const JENIS_KEGIATAN_PEMASARAN = [
  'Pengecer',
  'Pengumpul/ Pedagang Besar/ Distributor',
];

export const SKALA_USAHA_OPTIONS = ['Mikro', 'Kecil', 'Menengah', 'Besar'];

export const SERTIFIKAT_PRODUK_LIST = [
  { key: 'haccp', label: 'HACCP' },
  { key: 'sni', label: 'SNI' },
  { key: 'halal', label: 'HALAL' },
  { key: 'skp', label: 'SKP' },
  { key: 'pirt', label: 'PIRT' },
  { key: 'md', label: 'MD' },
  { key: 'lainnya', label: 'Lain-lain' },
];

export const IZIN_USAHA_LIST = [
  { key: 'nib', label: 'NIB' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'kusuka', label: 'KUSUKA' },
  { key: 'menkumham', label: 'Pengesahan MENKUMHAM' },
  { key: 'akta_pendirian', label: 'Akta Pendirian Usaha' },
  { key: 'lokasi_domisili', label: 'Lokasi / Domisili' },
  { key: 'imb', label: 'IMB' },
  { key: 'siup_perikanan', label: 'SIUP Perikanan' },
  { key: 'siup_perdagangan', label: 'SIUP Perdagangan' },
  { key: 'lainnya', label: 'Lain-lain' },
];

const INITIAL_FORM_DATA = {
  tahun: String(CURRENT_YEAR),
  kabupaten_kota: '',
  kategori_kegiatan: 'pengolahan',
  jenis_kegiatan: '',
  skala_usaha: 'Mikro',
  jumlah_unit_usaha: '0',
  modal_rp: '0',
  hasil_kg: '0',
  hasil_rp: '0',
  sertifikat_produk: SERTIFIKAT_PRODUK_LIST.reduce((acc, item) => ({ ...acc, [item.key]: '0' }), {}),
  izin_usaha: IZIN_USAHA_LIST.reduce((acc, item) => ({ ...acc, [item.key]: '0' }), {}),
  shm_count: '0',
  non_shm_count: '0',
};

// ============================================================================
// STYLING
// ============================================================================
const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground';

const LABEL_CLASS = 'mb-1 block text-xs font-medium uppercase text-muted-foreground';

// ============================================================================
// HELPERS
// ============================================================================

// Format angka dengan pemisah ribuan ala Indonesia saat diketik (mis. 15000 -> "15.000")
const formatThousand = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly).toLocaleString('id-ID') : '0';
};

// Ubah string berformat ribuan ("15.000") kembali jadi angka murni untuk dikirim ke API.
// PENTING: fungsi inilah yang dipakai untuk payload backend, BUKAN formatValueForExport.
const toRawNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const cleanVal = String(val).replace(/\./g, '').trim();
  const parsed = Number(cleanVal);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Format nilai HANYA untuk tampilan/export rekap (mis. generate file Excel): 0/kosong -> "-".
// JANGAN pakai fungsi ini untuk payload yang dikirim ke API, karena kolom di database
// bertipe Int/Float dan akan ditolak Prisma kalau menerima string seperti "-" atau "15.000".
const formatValueForDisplay = (val) => {
  if (val === '' || val === null || val === undefined) return '-';
  const cleanVal = String(val).replace(/\./g, '').trim();
  if (cleanVal === '0' || cleanVal === '') return '-';
  return Number(cleanVal).toLocaleString('id-ID');
};

// ============================================================================
// REUSABLE FIELDS
// ============================================================================
function SectionCard({ number, title, description, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">
        Section {number}: {title} <span className="text-red-500">*</span>
      </h2>
      {description ? <p className="mb-4 text-xs text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = '-- Pilih --', required = true, disabled = false }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} {required ? '*' : ''}
      </label>
      <div className="relative">
        <select
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={`${INPUT_CLASS} appearance-none pr-10`}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, required = true }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label} {required ? '*' : ''}
      </label>
      <input
        type="text"
        required={required}
        inputMode="numeric"
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
      />
    </div>
  );
}

// Grid input angka untuk daftar kategori (Sertifikat Produk / Izin Usaha)
function NestedAmountGrid({ category, list, values, onChangeItem }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {list.map((item) => (
        <div key={item.key}>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{item.label} *</label>
          <input
            type="text"
            required
            inputMode="numeric"
            value={values[item.key] ?? '0'}
            onChange={(e) => onChangeItem(category, item.key, e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT (DIRECT REKAP MODE ONLY)
// ============================================================================
export default function PengolahanPemasaranForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const subJenisOptions = useMemo(
    () => (formData.kategori_kegiatan === 'pengolahan' ? JENIS_KEGIATAN_PENGOLAHAN : JENIS_KEGIATAN_PEMASARAN),
    [formData.kategori_kegiatan],
  );

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const setAmountField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: formatThousand(value) }));
  };

  const handleKategoriChange = (kategori) => {
    setFormData((prev) => ({
      ...prev,
      kategori_kegiatan: kategori,
      jenis_kegiatan: '', // reset karena daftar sub-jenis berubah (dependent dropdown)
    }));
  };

  const handleNestedAmountChange = (category, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: formatThousand(value),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Payload untuk API: angka murni (Int/Float), sesuai tipe kolom di Prisma.
    // Kolom nested (sertifikat_produk, izin_usaha) diratakan (flatten) jadi
    // sertifikat_<key> dan izin_<key> agar cocok dengan model PengolahanPemasaran.
    const payload = {
      tahun: toRawNumber(formData.tahun),
      kabupaten_kota: formData.kabupaten_kota,
      kategori_kegiatan: formData.kategori_kegiatan,
      jenis_kegiatan: formData.jenis_kegiatan,
      skala_usaha: formData.skala_usaha,
      jumlah_unit_usaha: toRawNumber(formData.jumlah_unit_usaha),
      modal_rp: toRawNumber(formData.modal_rp),
      hasil_kg: toRawNumber(formData.hasil_kg),
      hasil_rp: toRawNumber(formData.hasil_rp),
      shm_count: toRawNumber(formData.shm_count),
      non_shm_count: toRawNumber(formData.non_shm_count),
    };

    Object.keys(formData.sertifikat_produk).forEach((key) => {
      payload[`sertifikat_${key}`] = toRawNumber(formData.sertifikat_produk[key]);
    });

    Object.keys(formData.izin_usaha).forEach((key) => {
      payload[`izin_${key}`] = toRawNumber(formData.izin_usaha[key]);
    });

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-6 p-4">
      {/* SECTION 1: TAHUN & WILAYAH */}
      <SectionCard
        number="1"
        title="Tahun & Wilayah Kabupaten / Kota"
        description="Pilih tahun data dan lokasi kabupaten/kota target input rekapitulasi."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Tahun"
            value={formData.tahun}
            onChange={(e) => setField('tahun', e.target.value)}
            options={TAHUN_OPTIONS}
            placeholder={null}
          />
          <SelectField
            label="Kabupaten / Kota"
            value={formData.kabupaten_kota}
            onChange={(e) => setField('kabupaten_kota', e.target.value)}
            options={KABUPATEN_KOTA_OPTIONS}
            placeholder="-- Pilih Kabupaten / Kota --"
          />
        </div>
      </SectionCard>

      {/* SECTION 2: KLASIFIKASI & SKALA */}
      <SectionCard
        number="2"
        title="Klasifikasi Jenis Usaha & Skala Usaha"
        description="Pilih kategori utama, jenis kegiatan, dan skala usaha."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
              Kategori Utama *
            </label>
            <div className="flex items-center gap-6">
              {[
                { value: 'pengolahan', label: 'Pengolahan' },
                { value: 'pemasaran', label: 'Pemasaran' },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="radio"
                    name="kategori_kegiatan"
                    value={opt.value}
                    checked={formData.kategori_kegiatan === opt.value}
                    onChange={() => handleKategoriChange(opt.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label={`Jenis Kegiatan (${formData.kategori_kegiatan === 'pengolahan' ? 'Pengolahan' : 'Pemasaran'})`}
              value={formData.jenis_kegiatan}
              onChange={(e) => setField('jenis_kegiatan', e.target.value)}
              options={subJenisOptions}
              placeholder="-- Pilih Jenis Kegiatan --"
            />
            <SelectField
              label="Skala Usaha"
              value={formData.skala_usaha}
              onChange={(e) => setField('skala_usaha', e.target.value)}
              options={SKALA_USAHA_OPTIONS}
              placeholder={null}
            />
          </div>
        </div>
      </SectionCard>

      {/* SECTION 3: UNIT USAHA & MODAL */}
      <SectionCard number="3" title="Unit Usaha & Modal Investasi" description="Isi 0 jika tidak ada data.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Jumlah Unit Usaha (Unit)"
            value={formData.jumlah_unit_usaha}
            onChange={(e) => setAmountField('jumlah_unit_usaha', e.target.value)}
          />
          <NumberField
            label="Modal Investasi (Rp)"
            value={formData.modal_rp}
            onChange={(e) => setAmountField('modal_rp', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* SECTION 4: CAPAIAN PRODUKSI */}
      <SectionCard number="4" title="Capaian Hasil Produksi / Penjualan" description="Isi 0 jika tidak ada data.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Hasil Produksi (Kg)"
            value={formData.hasil_kg}
            onChange={(e) => setAmountField('hasil_kg', e.target.value)}
          />
          <NumberField
            label="Nilai Produksi (Rp)"
            value={formData.hasil_rp}
            onChange={(e) => setAmountField('hasil_rp', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* SECTION 5: SERTIFIKAT PRODUK */}
      <SectionCard
        number="5"
        title="Rekapitulasi Sertifikat Produk"
        description="Wajib diisi semua. Ketik 0 jika belum ada."
      >
        <NestedAmountGrid
          category="sertifikat_produk"
          list={SERTIFIKAT_PRODUK_LIST}
          values={formData.sertifikat_produk}
          onChangeItem={handleNestedAmountChange}
        />
      </SectionCard>

      {/* SECTION 6: IZIN USAHA */}
      <SectionCard
        number="6"
        title="Rekapitulasi Izin Usaha"
        description="Wajib diisi semua. Ketik 0 jika belum ada."
      >
        <NestedAmountGrid
          category="izin_usaha"
          list={IZIN_USAHA_LIST}
          values={formData.izin_usaha}
          onChangeItem={handleNestedAmountChange}
        />
      </SectionCard>

      {/* SECTION 7: LAHAN & BANGUNAN */}
      <SectionCard
        number="7"
        title="Rekapitulasi Sertifikat Lahan & Bangunan"
        description="Isi 0 jika tidak ada data."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Sertifikat Hak Milik (SHM)"
            value={formData.shm_count}
            onChange={(e) => setAmountField('shm_count', e.target.value)}
          />
          <NumberField
            label="Non SHM (Sewa / Girik / HGB / DLL)"
            value={formData.non_shm_count}
            onChange={(e) => setAmountField('non_shm_count', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* BUTTON FOOTER */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" /> Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Menyimpan...' : 'Simpan Data Rekap'}
        </button>
      </div>
    </form>
  );
}