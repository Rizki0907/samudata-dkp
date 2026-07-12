import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Save, Search, X } from 'lucide-react';

export const KABUPATEN_KOTA_OPTIONS = [
  'KAB. PACITAN',
  'KAB. PONOROGO',
  'KAB. TRENGGALEK',
  'KAB. TULUNGAGUNG',
  'KAB. BLITAR',
  'KAB. KEDIRI',
  'KAB. MALANG',
  'KAB. LUMAJANG',
  'KAB. JEMBER',
  'KAB. BANYUWANGI',
  'KAB. BONDOWOSO',
  'KAB. SITUBONDO',
  'KAB. PROBOLINGGO',
  'KAB. PASURUAN',
  'KAB. SIDOARJO',
  'KAB. MOJOKERTO',
  'KAB. JOMBANG',
  'KAB. NGANJUK',
  'KAB. MADIUN',
  'KAB. MAGETAN',
  'KAB. NGAWI',
  'KAB. BOJONEGORO',
  'KAB. TUBAN',
  'KAB. LAMONGAN',
  'KAB. GRESIK',
  'KAB. BANGKALAN',
  'KAB. SAMPANG',
  'KAB. PAMEKASAN',
  'KAB. SUMENEP',
  'KOTA KEDIRI',
  'KOTA BLITAR',
  'KOTA MALANG',
  'KOTA PROBOLINGGO',
  'KOTA PASURUAN',
  'KOTA MOJOKERTO',
  'KOTA MADIUN',
  'KOTA SURABAYA',
  'KOTA BATU',
];

const PROVINCE_OPTIONS = [
  'ACEH',
  'SUMATERA UTARA',
  'SUMATERA BARAT',
  'RIAU',
  'KEPULAUAN RIAU',
  'JAMBI',
  'SUMATERA SELATAN',
  'KEPULAUAN BANGKA BELITUNG',
  'BENGKULU',
  'LAMPUNG',
  'DKI JAKARTA',
  'JAWA BARAT',
  'BANTEN',
  'JAWA TENGAH',
  'DI YOGYAKARTA',
  'JAWA TIMUR',
  'BALI',
  'NUSA TENGGARA BARAT',
  'NUSA TENGGARA TIMUR',
  'KALIMANTAN BARAT',
  'KALIMANTAN TENGAH',
  'KALIMANTAN SELATAN',
  'KALIMANTAN TIMUR',
  'KALIMANTAN UTARA',
  'SULAWESI UTARA',
  'GORONTALO',
  'SULAWESI TENGAH',
  'SULAWESI BARAT',
  'SULAWESI SELATAN',
  'SULAWESI TENGGARA',
  'MALUKU',
  'MALUKU UTARA',
  'PAPUA',
  'PAPUA BARAT',
  'PAPUA BARAT DAYA',
  'PAPUA SELATAN',
  'PAPUA TENGAH',
  'PAPUA PEGUNUNGAN',
  'Tidak Ada',
];


const MULTI_KABUPATEN_KOTA_OPTIONS = [
  ...KABUPATEN_KOTA_OPTIONS,
  'Tidak Ada',
];

const COUNTRY_OPTIONS = [
  'INDONESIA',
  'MALAYSIA',
  'SINGAPURA',
  'BRUNEI DARUSSALAM',
  'THAILAND',
  'FILIPINA',
  'VIETNAM',
  'LAOS',
  'KAMBOJA',
  'MYANMAR',
  'TIMOR LESTE',
  'CHINA',
  'JEPANG',
  'KOREA SELATAN',
  'KOREA UTARA',
  'INDIA',
  'PAKISTAN',
  'BANGLADESH',
  'SRI LANKA',
  'NEPAL',
  'BHUTAN',
  'MALADEWA',
  'AFGHANISTAN',
  'MONGOLIA',
  'TAIWAN',
  'HONG KONG',
  'MAKAU',
  'ARAB SAUDI',
  'UNI EMIRAT ARAB',
  'QATAR',
  'KUWAIT',
  'BAHRAIN',
  'OMAN',
  'YAMAN',
  'IRAK',
  'IRAN',
  'ISRAEL',
  'PALESTINA',
  'YORDANIA',
  'LEBANON',
  'SURIAH',
  'TURKI',
  'KAZAKHSTAN',
  'UZBEKISTAN',
  'TURKMENISTAN',
  'KIRGIZSTAN',
  'TAJIKISTAN',
  'RUSIA',
  'UKRAINA',
  'BELARUS',
  'MOLDOVA',
  'POLANDIA',
  'JERMAN',
  'BELANDA',
  'BELGIA',
  'LUKSEMBURG',
  'PRANCIS',
  'SPANYOL',
  'PORTUGAL',
  'ITALIA',
  'SWISS',
  'AUSTRIA',
  'INGGRIS',
  'IRLANDIA',
  'ISLANDIA',
  'NORWEGIA',
  'SWEDIA',
  'FINLANDIA',
  'DENMARK',
  'ESTONIA',
  'LATVIA',
  'LITUANIA',
  'CEKO',
  'SLOVAKIA',
  'HONGARIA',
  'RUMANIA',
  'BULGARIA',
  'YUNANI',
  'ALBANIA',
  'KROASIA',
  'SLOVENIA',
  'BOSNIA DAN HERZEGOVINA',
  'SERBIA',
  'MONTENEGRO',
  'MAKEDONIA UTARA',
  'KOSOVO',
  'SIPRUS',
  'MALTA',
  'AMERIKA SERIKAT',
  'KANADA',
  'MEKSIKO',
  'GUATEMALA',
  'BELIZE',
  'HONDURAS',
  'EL SALVADOR',
  'NIKARAGUA',
  'KOSTA RIKA',
  'PANAMA',
  'KUBA',
  'JAMAIKA',
  'HAITI',
  'REPUBLIK DOMINIKA',
  'BAHAMA',
  'BARBADOS',
  'TRINIDAD DAN TOBAGO',
  'ANTIGUA DAN BARBUDA',
  'DOMINIKA',
  'GRENADA',
  'SAINT KITTS DAN NEVIS',
  'SAINT LUCIA',
  'SAINT VINCENT DAN GRENADINES',
  'BRASIL',
  'ARGENTINA',
  'CHILE',
  'PERU',
  'BOLIVIA',
  'PARAGUAY',
  'URUGUAY',
  'KOLOMBIA',
  'VENEZUELA',
  'EKUADOR',
  'GUYANA',
  'SURINAME',
  'AUSTRALIA',
  'SELANDIA BARU',
  'PAPUA NUGINI',
  'FIJI',
  'SOLOMON',
  'VANUATU',
  'SAMOA',
  'TONGA',
  'KIRIBATI',
  'TUVALU',
  'NAURU',
  'PALAU',
  'MIKRONESIA',
  'KEPULAUAN MARSHALL',
  'MESIR',
  'LIBYA',
  'TUNISIA',
  'ALJAZAIR',
  'MAROKO',
  'SUDAN',
  'SUDAN SELATAN',
  'ETHIOPIA',
  'ERITREA',
  'DJIBOUTI',
  'SOMALIA',
  'KENYA',
  'UGANDA',
  'TANZANIA',
  'RWANDA',
  'BURUNDI',
  'AFRIKA SELATAN',
  'NAMIBIA',
  'BOTSWANA',
  'ZIMBABWE',
  'ZAMBIA',
  'MOZAMBIK',
  'MALAWI',
  'MADAGASKAR',
  'MAURITIUS',
  'SEYCHELLES',
  'KOMORO',
  'ANGOLA',
  'REPUBLIK DEMOKRATIK KONGO',
  'REPUBLIK KONGO',
  'GABON',
  'GUINEA KHATULISTIWA',
  'KAMERUN',
  'REPUBLIK AFRIKA TENGAH',
  'CHAD',
  'NIGERIA',
  'NIGER',
  'BENIN',
  'TOGO',
  'GHANA',
  'PANTAI GADING',
  'LIBERIA',
  'SIERRA LEONE',
  'GUINEA',
  'GUINEA-BISSAU',
  'SENEGAL',
  'GAMBIA',
  'MAURITANIA',
  'MALI',
  'BURKINA FASO',
  'CABO VERDE',
  'SAO TOME DAN PRINCIPE',
  'LESOTHO',
  'ESWATINI',
  'Tidak Ada',
];

const SERTIFIKAT_LAHAN_OPTIONS = ['SHM', 'Non SHM', 'Tidak Ada'];

const JENIS_PENGOLAHAN_OPTIONS = [
  'Fermentasi',
  'Pelumatan Daging Ikan',
  'Pembekuan',
  'Pemindangan',
  'Penanganan Produk Segar',
  'Pengalengan',
  'Pengasapan/Pemanggangan',
  'Pereduksian/Ekstraksi',
  'Penggaraman/Pengeringan',
  'Pengolahan Lainnya',
];

const JENIS_PEMASARAN_OPTIONS = [
  'Pengecer',
  'Pengumpul/Pedagang Besar/Distributor',
];

const PERIZINAN_OPTIONS = [
  'NIB',
  'KUSUKA',
  'NPWP',
  'Pengesahan MENKUMHAM',
  'Akta Pendirian Usaha',
  'SIUP Perikanan',
  'SIUP Perdagangan',
  'Tidak Ada',
];

const SERTIFIKAT_BANGUNAN_OPTIONS = ['IMB/PBG', 'Lokasi/Domisili', 'Tidak Ada'];
const SERTIFIKAT_PRODUK_OPTIONS = ['SKP', 'HALAL', 'SNI', 'HACCP', 'MD', 'Tidak Ada'];
const STATUS_COLD_STORAGE_OPTIONS = ['Milik Pribadi', 'Sewa', 'Tidak Ada'];
const PEMBERI_PINJAMAN_OPTIONS = ['Bank', 'Koperasi', 'Lainnya'];
const BULAN_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground';

export const FILTER_SELECT_CLASS =
  'w-full rounded-full border border-border bg-card px-5 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10';

const NUMERIC_FIELDS = [
  'tahun',
  'tahun_berdiri',
  'nilai_aset_rp',
  'cold_storage_kg',
  'aset_cold_storage_rp',
  'luas_lahan_m2',
  'nilai_lahan_rp',
  'luas_bangunan_m2',
  'nilai_bangunan_rp',
  'biaya_sewa_per_tahun_rp',
  'jumlah_modal_sendiri_rp',
  'jumlah_laba_ditanam_rp',
  'jumlah_pinjaman_rp',
  'tenor_pinjaman_tahun',
  'biaya_produksi_per_periode_rp',
  'biaya_lain_lain_per_periode_rp',
  'hasil_produksi_per_periode_kg',
  'kapasitas_per_periode_kg',
  'harga_jual_rp_kg',
  'jumlah_total_bulan_produksi_per_tahun',
  'jumlah_hari_produksi_per_bulan',
  'total_bahan_baku_per_periode_kg',
  'total_pemasaran_per_tahun_kg',
  'pasar_dalam_kota_kab_per_tahun_kg',
  'pasar_kota_dalam_jatim_per_tahun_kg',
  'pasar_luar_jatim_per_tahun_kg',
  'pasar_luar_negeri_per_tahun_kg',
  'tenaga_kerja_tetap_laki_laki',
  'tenaga_kerja_tetap_perempuan',
  'tenaga_kerja_tidak_tetap_laki_laki',
  'tenaga_kerja_tidak_tetap_perempuan',
  'tenaga_kerja_keluarga_laki_laki',
  'tenaga_kerja_keluarga_perempuan',
  'tenaga_kerja_tetap_laki_laki_2',
  'tenaga_kerja_tetap_perempuan_2',
  'tenaga_kerja_tidak_tetap_laki_laki_2',
  'tenaga_kerja_tidak_tetap_perempuan_2',
];

export const TENAGA_KERJA_FIELDS = [
  'tenaga_kerja_tetap_laki_laki',
  'tenaga_kerja_tetap_perempuan',
  'tenaga_kerja_tidak_tetap_laki_laki',
  'tenaga_kerja_tidak_tetap_perempuan',
  'tenaga_kerja_keluarga_laki_laki',
  'tenaga_kerja_keluarga_perempuan',
  'tenaga_kerja_tetap_laki_laki_2',
  'tenaga_kerja_tetap_perempuan_2',
  'tenaga_kerja_tidak_tetap_laki_laki_2',
  'tenaga_kerja_tidak_tetap_perempuan_2',
];

const GROUPED_NUMERIC_FIELDS = new Set(
  NUMERIC_FIELDS.filter(key => !['tahun', 'tahun_berdiri'].includes(key)),
);

const formatNumericInputValue = value => {
  const raw = String(value ?? '')
    .replace(/\./g, '')
    .replace(/[^0-9,]/g, '');

  if (!raw) return '';

  const [integerPart = '', ...decimalParts] = raw.split(',');
  const cleanInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const groupedInteger = cleanInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalParts.length === 0) return groupedInteger;

  const decimalPart = decimalParts.join('').slice(0, 2);
  return `${groupedInteger},${decimalPart}`;
};

const formatInitialNumericValue = value => {
  if (value === '' || value === null || value === undefined) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('id-ID', {
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  }

  const raw = String(value).trim();
  if (!raw) return '';

  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('id-ID', {
        maximumFractionDigits: 2,
        useGrouping: true,
      });
    }
  }

  return formatNumericInputValue(raw);
};

export const toNumber = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  let normalized = String(value ?? '').trim().replace(/\s/g, '');
  if (!normalized) return 0;

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '');
  }

  normalized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberOrNull = value => {
  if (value === '' || value === null || value === undefined) return null;
  return toNumber(value);
};

const toArray = value => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const normalizePinjaman = value => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (['YA', 'ADA'].includes(normalized)) return 'Ya';
  if (['TIDAK', 'TIDAK ADA'].includes(normalized)) return 'Tidak';
  return '';
};

const createInitialForm = initialData => {
  const form = {
  tahun: initialData?.tahun ?? '',
  jenis_kegiatan: initialData?.jenis_kegiatan ?? '',
  skala_usaha: initialData?.skala_usaha ?? '',
  jenis_kegiatan_pengolahan: initialData?.jenis_kegiatan_pengolahan ?? '',
  jenis_kegiatan_pemasaran: initialData?.jenis_kegiatan_pemasaran ?? '',

  nama_upi: initialData?.nama_upi ?? '',
  alamat: initialData?.alamat ?? '',
  desa: initialData?.desa ?? '',
  kecamatan: initialData?.kecamatan ?? '',
  kabupaten_kota: initialData?.kabupaten_kota ?? '',
  nomor_telepon: initialData?.nomor_telepon ?? '',
  tahun_berdiri: initialData?.tahun_berdiri ?? '',

  perizinan: toArray(initialData?.perizinan),
  nama_pemilik: initialData?.nama_pemilik ?? '',
  jenis_kelamin: initialData?.jenis_kelamin ?? '',
  alamat_2: initialData?.alamat_2 ?? '',
  desa_2: initialData?.desa_2 ?? '',
  kecamatan_2: initialData?.kecamatan_2 ?? '',
  kabupaten_kota_2: initialData?.kabupaten_kota_2 ?? '',
  nomor_telepon_2: initialData?.nomor_telepon_2 ?? '',

  nilai_aset_rp: initialData?.nilai_aset_rp ?? '',
  cold_storage_kg: initialData?.cold_storage_kg ?? '',
  status_cold_storage: initialData?.status_cold_storage ?? '',
  aset_cold_storage_rp: initialData?.aset_cold_storage_rp ?? '',
  status_lahan_usaha: initialData?.status_lahan_usaha ?? '',
  sertifikat_lahan: initialData?.sertifikat_lahan ?? '',
  luas_lahan_m2: initialData?.luas_lahan_m2 ?? '',
  nilai_lahan_rp: initialData?.nilai_lahan_rp ?? '',
  sertifikat_bangunan: toArray(initialData?.sertifikat_bangunan),
  luas_bangunan_m2: initialData?.luas_bangunan_m2 ?? '',
  nilai_bangunan_rp: initialData?.nilai_bangunan_rp ?? '',
  biaya_sewa_per_tahun_rp: initialData?.biaya_sewa_per_tahun_rp ?? '',

  jumlah_modal_sendiri_rp: initialData?.jumlah_modal_sendiri_rp ?? '',
  jumlah_laba_ditanam_rp: initialData?.jumlah_laba_ditanam_rp ?? '',
  pinjaman_modal: normalizePinjaman(initialData?.pinjaman_modal),
  jumlah_pinjaman_rp: initialData?.jumlah_pinjaman_rp ?? '',
  pemberi_pinjaman: initialData?.pemberi_pinjaman ?? '',
  tanggal_akad_pinjaman: initialData?.tanggal_akad_pinjaman
    ? String(initialData.tanggal_akad_pinjaman).slice(0, 10)
    : '',
  tenor_pinjaman_tahun: initialData?.tenor_pinjaman_tahun ?? '',

  nama_merek: initialData?.nama_merek ?? '',
  jenis_produk: initialData?.jenis_produk ?? '',
  sertifikat_umum: toArray(initialData?.sertifikat_umum ?? initialData?.sertifikat_produk),
  sertifikat_bpom: initialData?.sertifikat_bpom ?? '',
  periode_produksi: initialData?.periode_produksi ?? '',

  biaya_produksi_per_periode_rp: initialData?.biaya_produksi_per_periode_rp ?? '',
  biaya_lain_lain_per_periode_rp: initialData?.biaya_lain_lain_per_periode_rp ?? '',
  hasil_produksi_per_periode_kg: initialData?.hasil_produksi_per_periode_kg ?? '',
  kapasitas_per_periode_kg: initialData?.kapasitas_per_periode_kg ?? '',
  harga_jual_rp_kg: initialData?.harga_jual_rp_kg ?? '',
  bulan_produksi: toArray(initialData?.bulan_produksi),
  jumlah_total_bulan_produksi_per_tahun:
    initialData?.jumlah_total_bulan_produksi_per_tahun ?? '',
  jumlah_hari_produksi_per_bulan: initialData?.jumlah_hari_produksi_per_bulan ?? '',

  nama_bahan_baku: initialData?.nama_bahan_baku ?? '',
  total_bahan_baku_per_periode_kg: initialData?.total_bahan_baku_per_periode_kg ?? '',
  asal_bahan_baku_kabupaten_kota: toArray(initialData?.asal_bahan_baku_kabupaten_kota),
  provinsi_asal_bahan_baku: toArray(initialData?.provinsi_asal_bahan_baku),
  asal_negara_bahan_baku: toArray(initialData?.asal_negara_bahan_baku),
  total_pemasaran_per_tahun_kg: initialData?.total_pemasaran_per_tahun_kg ?? '',
  pasar_dalam_kota_kab_per_tahun_kg:
    initialData?.pasar_dalam_kota_kab_per_tahun_kg ?? '',
  pasar_kota_dalam_jatim_per_tahun_kg:
    initialData?.pasar_kota_dalam_jatim_per_tahun_kg ?? '',
  pasar_luar_jatim_per_tahun_kg: initialData?.pasar_luar_jatim_per_tahun_kg ?? '',
  pasar_luar_negeri_per_tahun_kg:
    initialData?.pasar_luar_negeri_per_tahun_kg ?? '',
  tujuan_pemasaran_kabupaten_kota: toArray(
    initialData?.tujuan_pemasaran_kabupaten_kota,
  ),
  provinsi_tujuan_pemasaran: toArray(initialData?.provinsi_tujuan_pemasaran),
  negara_tujuan_pemasaran: toArray(initialData?.negara_tujuan_pemasaran),

  tenaga_kerja_tetap_laki_laki: initialData?.tenaga_kerja_tetap_laki_laki ?? '',
  tenaga_kerja_tetap_perempuan: initialData?.tenaga_kerja_tetap_perempuan ?? '',
  tenaga_kerja_tidak_tetap_laki_laki:
    initialData?.tenaga_kerja_tidak_tetap_laki_laki ?? '',
  tenaga_kerja_tidak_tetap_perempuan:
    initialData?.tenaga_kerja_tidak_tetap_perempuan ?? '',
  tenaga_kerja_keluarga_laki_laki:
    initialData?.tenaga_kerja_keluarga_laki_laki ?? '',
  tenaga_kerja_keluarga_perempuan:
    initialData?.tenaga_kerja_keluarga_perempuan ?? '',
  tenaga_kerja_tetap_laki_laki_2:
    initialData?.tenaga_kerja_tetap_laki_laki_2 ?? '',
  tenaga_kerja_tetap_perempuan_2:
    initialData?.tenaga_kerja_tetap_perempuan_2 ?? '',
  tenaga_kerja_tidak_tetap_laki_laki_2:
    initialData?.tenaga_kerja_tidak_tetap_laki_laki_2 ?? '',
  tenaga_kerja_tidak_tetap_perempuan_2:
    initialData?.tenaga_kerja_tidak_tetap_perempuan_2 ?? '',
  };

  GROUPED_NUMERIC_FIELDS.forEach(key => {
    form[key] = formatInitialNumericValue(form[key]);
  });

  return form;
};

function SectionCard({ number, title, description, children }) {
  return (
    <section className="relative overflow-visible rounded-2xl border border-border bg-card shadow-sm">
      <div className="rounded-t-2xl border-b border-border bg-muted/35 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          {number ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {number}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex min-h-8 items-center">
              <h2 className="font-heading text-base font-semibold leading-none text-foreground">
                {title}
              </h2>
            </div>
            {description ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required = true,
  disabled = false,
  readOnly = false,
  className = '',
  helpText,
  maxLength,
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required && !disabled && !readOnly}
        disabled={disabled}
        readOnly={readOnly}
        className={INPUT_CLASS}
      />
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  required = true,
  className = '',
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={onChange}
          required={required}
          className={`${INPUT_CLASS} appearance-none pr-10`}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
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

function ChoiceButtons({ label, value, options, onChange, required = true, columns = 2 }) {
  const gridClass = columns === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2';

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </div>
      <div className={`grid grid-cols-1 gap-2 ${gridClass}`}>
        {options.map(option => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchableMultiSelect({
  label,
  values,
  options,
  onChange,
  placeholder = 'Pilih satu atau lebih',
  required = true,
  helpText,
  allowCustom = false,
  selectAllLabel = 'Pilih Semua',
  allSelectedText,
  exclusiveOptions = ['Tidak Ada'],
  className = '',
}) {
  const wrapperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const normalizedValues = Array.isArray(values) ? values : toArray(values);
  const normalizedOptions = [...new Set((options || []).filter(Boolean))];
  const normalizedSearch = search.trim().toUpperCase();

  const filteredOptions = normalizedOptions.filter(option =>
    String(option).toUpperCase().includes(normalizedSearch),
  );

  const exactOptionExists = normalizedOptions.some(
    option => String(option).toUpperCase() === normalizedSearch,
  );

  const selectableAllOptions = normalizedOptions.filter(
    option => !exclusiveOptions.includes(option),
  );

  const allSelected =
    selectableAllOptions.length > 0 &&
    selectableAllOptions.every(option => normalizedValues.includes(option));

  useEffect(() => {
    const handleOutsideClick = event => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const toggleOption = option => {
    const alreadySelected = normalizedValues.includes(option);
    const isExclusive = exclusiveOptions.includes(option);

    if (isExclusive) {
      onChange(alreadySelected ? [] : [option]);
      return;
    }

    const withoutExclusive = normalizedValues.filter(
      item => !exclusiveOptions.includes(item),
    );

    onChange(
      alreadySelected
        ? withoutExclusive.filter(item => item !== option)
        : [...withoutExclusive, option],
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : selectableAllOptions);
  };

  const addCustomOption = () => {
    if (!normalizedSearch || normalizedValues.includes(normalizedSearch)) {
      return;
    }

    onChange([
      ...normalizedValues.filter(
        item => !exclusiveOptions.includes(item),
      ),
      normalizedSearch,
    ]);
    setSearch('');
  };

  const selectedText = useMemo(() => {
    if (normalizedValues.length === 0) return placeholder;

    if (allSelected && allSelectedText) {
      return allSelectedText;
    }

    const visibleValues = normalizedValues.slice(0, 3);
    const remainingCount = normalizedValues.length - visibleValues.length;

    return remainingCount > 0
      ? `${visibleValues.join(', ')}, ${remainingCount} lainnya`
      : visibleValues.join(', ');
  }, [
    allSelected,
    allSelectedText,
    normalizedValues,
    placeholder,
  ]);

  return (
    <div
      ref={wrapperRef}
      className={`relative flex min-w-0 flex-col gap-1.5 ${
        isOpen ? 'z-[90]' : 'z-0'
      } ${className}`}
    >
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(previous => !previous)}
        aria-expanded={isOpen}
        className={`${INPUT_CLASS} flex items-center justify-between gap-3 text-left`}
      >
        <span
          className={
            normalizedValues.length
              ? 'truncate text-foreground'
              : 'truncate text-muted-foreground'
          }
        >
          {selectedText}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => {
                if (
                  event.key === 'Enter' &&
                  allowCustom &&
                  normalizedSearch &&
                  !exactOptionExists
                ) {
                  event.preventDefault();
                  addCustomOption();
                }
              }}
              placeholder={`Cari ${label.toLowerCase()}...`}
              className={`${INPUT_CLASS} pl-9`}
              autoFocus
            />
          </div>

          {selectAllLabel ? (
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span>{selectAllLabel}</span>
            </label>
          ) : null}

          {normalizedValues.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {normalizedValues.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleOption(value)}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  title={`Hapus ${value}`}
                >
                  <span className="max-w-[220px] truncate">{value}</span>
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.map(option => {
              const checked = normalizedValues.includes(option);

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    checked
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(option)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span>{option}</span>
                </label>
              );
            })}

            {allowCustom && normalizedSearch && !exactOptionExists ? (
              <button
                type="button"
                onClick={addCustomOption}
                className="flex w-full items-center rounded-lg border border-dashed border-primary/30 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/5"
              >
                Tambahkan “{normalizedSearch}”
              </button>
            ) : null}

            {!filteredOptions.length &&
            !(allowCustom && normalizedSearch && !exactOptionExists) ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Tidak ada pilihan yang cocok.
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Bersihkan
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Selesai
            </button>
          </div>
        </div>
      ) : null}

      {helpText ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

function ReadOnlyMetric({ label, value, suffix = '' }) {
  const displayValue = `${Number(value || 0).toLocaleString('id-ID')}${suffix}`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        readOnly
        disabled
        className="w-full cursor-not-allowed rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-100"
      />
    </div>
  );
}

export default function PengolahanPemasaranForm({ initialData, isLoading, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => createInitialForm(initialData));
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setForm(createInitialForm(initialData));
    setFormError('');
  }, [initialData]);

  const setValue = key => event => {
    const rawValue = event.target.value;

    const nextValue = GROUPED_NUMERIC_FIELDS.has(key)
      ? formatNumericInputValue(rawValue)
      : ['tahun', 'tahun_berdiri'].includes(key)
        ? rawValue.replace(/\D/g, '').slice(0, 4)
        : rawValue;

    setForm(previous => ({ ...previous, [key]: nextValue }));
  };

  const setUppercase = key => event => {
    setForm(previous => ({ ...previous, [key]: event.target.value.toUpperCase() }));
  };

  const setChoice = (key, value) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const handleJenisKegiatan = value => {
    setForm(previous => ({
      ...previous,
      jenis_kegiatan: value,
      jenis_kegiatan_pengolahan:
        value === 'Pengolahan' ? previous.jenis_kegiatan_pengolahan : '',
      jenis_kegiatan_pemasaran:
        value === 'Pemasaran' ? previous.jenis_kegiatan_pemasaran : '',
    }));
  };

  const handlePinjamanModal = value => {
    setForm(previous => ({
      ...previous,
      pinjaman_modal: value,
      ...(value === 'Tidak'
        ? {
            jumlah_pinjaman_rp: '',
            pemberi_pinjaman: '',
            tanggal_akad_pinjaman: '',
            tenor_pinjaman_tahun: '',
          }
        : {}),
    }));
  };

  const productionMetrics = useMemo(() => {
    const totalBulan = toNumber(form.jumlah_total_bulan_produksi_per_tahun);
    const hariPerBulan = toNumber(form.jumlah_hari_produksi_per_bulan);
    const multiplier =
      form.periode_produksi === 'Harian'
        ? totalBulan * hariPerBulan
        : form.periode_produksi === 'Bulanan'
          ? totalBulan
          : 0;

    const biayaProduksiPerTahun =
      toNumber(form.biaya_produksi_per_periode_rp) * multiplier;
    const kapasitasPerTahun = toNumber(form.kapasitas_per_periode_kg) * multiplier;
    const hasilProduksiPerTahun =
      toNumber(form.hasil_produksi_per_periode_kg) * multiplier;
    const nilaiHasilProduksiPerTahun =
      hasilProduksiPerTahun * toNumber(form.harga_jual_rp_kg);

    return {
      multiplier,
      biaya_produksi_per_tahun_rp: biayaProduksiPerTahun,
      kapasitas_per_tahun_kg: kapasitasPerTahun,
      hasil_produksi_per_tahun_kg: hasilProduksiPerTahun,
      nilai_hasil_produksi_per_tahun_rp: nilaiHasilProduksiPerTahun,
    };
  }, [
    form.biaya_produksi_per_periode_rp,
    form.hasil_produksi_per_periode_kg,
    form.harga_jual_rp_kg,
    form.jumlah_hari_produksi_per_bulan,
    form.jumlah_total_bulan_produksi_per_tahun,
    form.kapasitas_per_periode_kg,
    form.periode_produksi,
  ]);

  const totalTenagaKerja = useMemo(
    () => TENAGA_KERJA_FIELDS.reduce((total, key) => total + toNumber(form[key]), 0),
    [form],
  );

  const validateRequiredFields = () => {
    const requiredTextFields = [
      ['Tahun', form.tahun],
      ['Kabupaten/Kota', form.kabupaten_kota],
      ['Kecamatan', form.kecamatan],
      ['Desa/Kelurahan', form.desa],
      ['Alamat Detail', form.alamat],
      ['Nama UPI', form.nama_upi],
      ['Nomor Telepon', form.nomor_telepon],
      ['Tahun Berdiri', form.tahun_berdiri],
      ['Nama Pemilik', form.nama_pemilik],
      ['Jenis Kelamin', form.jenis_kelamin],
      ['Nomor Telepon Pemilik', form.nomor_telepon_2],
      ['Kabupaten 2', form.kabupaten_kota_2],
      ['Kecamatan 2', form.kecamatan_2],
      ['Desa 2', form.desa_2],
      ['Alamat Detail 2', form.alamat_2],
      ['Nilai Aset', form.nilai_aset_rp],
      ['Cold Storage', form.cold_storage_kg],
      ['Status Cold Storage', form.status_cold_storage],
      ['Aset Cold Storage', form.aset_cold_storage_rp],
      ['Sertifikat Lahan', form.sertifikat_lahan],
      ['Status Lahan Usaha', form.status_lahan_usaha],
      ['Luas Lahan', form.luas_lahan_m2],
      ['Nilai Lahan', form.nilai_lahan_rp],
      ['Biaya Sewa Per Tahun', form.biaya_sewa_per_tahun_rp],
      ['Luas Bangunan', form.luas_bangunan_m2],
      ['Nilai Bangunan', form.nilai_bangunan_rp],
      ['Jumlah Modal Sendiri', form.jumlah_modal_sendiri_rp],
      ['Jumlah Laba Ditanam', form.jumlah_laba_ditanam_rp],
      ['Pinjaman Modal', form.pinjaman_modal],
      ['Nama Merek', form.nama_merek],
      ['Jenis Produk', form.jenis_produk],
      ['Sertifikat BPOM', form.sertifikat_bpom],
      ['Periode Produksi', form.periode_produksi],
      ['Biaya Produksi Per Periode', form.biaya_produksi_per_periode_rp],
      ['Biaya Lain-Lain Per Periode', form.biaya_lain_lain_per_periode_rp],
      ['Hasil Produksi Per Periode', form.hasil_produksi_per_periode_kg],
      ['Kapasitas Per Periode', form.kapasitas_per_periode_kg],
      ['Harga Jual', form.harga_jual_rp_kg],
      ['Jumlah Total Bulan Produksi Per Tahun', form.jumlah_total_bulan_produksi_per_tahun],
      ['Jumlah Hari Produksi Per Bulan', form.jumlah_hari_produksi_per_bulan],
      ['Nama Bahan Baku', form.nama_bahan_baku],
      ['Total Bahan Baku Per Periode', form.total_bahan_baku_per_periode_kg],
      ['Asal Bahan Baku Kabupaten/Kota', form.asal_bahan_baku_kabupaten_kota],
      ['Provinsi Asal Bahan Baku', form.provinsi_asal_bahan_baku],
      ['Asal Negara Bahan Baku', form.asal_negara_bahan_baku],
      ['Total Pemasaran Per Tahun', form.total_pemasaran_per_tahun_kg],
      ['Pasar Dalam Kota/Kab Per Tahun', form.pasar_dalam_kota_kab_per_tahun_kg],
      ['Pasar Kota Dalam Jatim Per Tahun', form.pasar_kota_dalam_jatim_per_tahun_kg],
      ['Pasar Luar Jatim Per Tahun', form.pasar_luar_jatim_per_tahun_kg],
      ['Pasar Luar Negeri Per Tahun', form.pasar_luar_negeri_per_tahun_kg],
      ['Tujuan Pemasaran Kabupaten/Kota', form.tujuan_pemasaran_kabupaten_kota],
      ['Provinsi Tujuan Pemasaran', form.provinsi_tujuan_pemasaran],
      ['Negara Tujuan Pemasaran', form.negara_tujuan_pemasaran],
      ['Tenaga Kerja Tetap Laki-Laki', form.tenaga_kerja_tetap_laki_laki],
      ['Tenaga Kerja Tetap Perempuan', form.tenaga_kerja_tetap_perempuan],
      ['Tenaga Kerja Tidak Tetap Laki-Laki', form.tenaga_kerja_tidak_tetap_laki_laki],
      ['Tenaga Kerja Tidak Tetap Perempuan', form.tenaga_kerja_tidak_tetap_perempuan],
      ['Tenaga Kerja Keluarga Laki-Laki', form.tenaga_kerja_keluarga_laki_laki],
      ['Tenaga Kerja Keluarga Perempuan', form.tenaga_kerja_keluarga_perempuan],
      ['Tenaga Kerja Tetap 2 Laki-Laki', form.tenaga_kerja_tetap_laki_laki_2],
      ['Tenaga Kerja Tetap 2 Perempuan', form.tenaga_kerja_tetap_perempuan_2],
      ['Tenaga Kerja Tidak Tetap 2 Laki-Laki', form.tenaga_kerja_tidak_tetap_laki_laki_2],
      ['Tenaga Kerja Tidak Tetap 2 Perempuan', form.tenaga_kerja_tidak_tetap_perempuan_2],
    ];

    if (form.pinjaman_modal === 'Ya') {
      requiredTextFields.push(
        ['Jumlah Pinjaman', form.jumlah_pinjaman_rp],
        ['Pemberi Pinjaman', form.pemberi_pinjaman],
        ['Tanggal Akad Pinjaman', form.tanggal_akad_pinjaman],
        ['Tenor Pinjaman', form.tenor_pinjaman_tahun],
      );
    }

    const emptyField = requiredTextFields.find(([, value]) => String(value ?? '').trim() === '');
    if (emptyField) return `${emptyField[0]} wajib diisi.`;

    if (!/^\d{4}$/.test(String(form.tahun))) {
      return 'Tahun wajib diisi 4 angka, contoh 2026.';
    }

    if (form.tahun_berdiri && !/^\d{4}$/.test(String(form.tahun_berdiri))) {
      return 'Tahun Berdiri wajib diisi 4 angka, contoh 2020.';
    }

    if (!form.perizinan.length) return 'Sertifikat Perizinan Usaha wajib dipilih.';
    if (!form.sertifikat_bangunan.length) return 'Sertifikat Bangunan wajib dipilih.';
    if (!form.sertifikat_umum.length) return 'Sertifikat Produk wajib dipilih.';
    if (!form.bulan_produksi.length) return 'Bulan Produksi wajib dipilih.';

    return '';
  };

  const handleSubmit = event => {
    event.preventDefault();

    const requiredMessage = validateRequiredFields();
    if (requiredMessage) {
      setFormError(requiredMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!form.jenis_kegiatan || !form.skala_usaha) {
      setFormError('Jenis kegiatan dan skala usaha wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      form.jenis_kegiatan === 'Pengolahan' &&
      !form.jenis_kegiatan_pengolahan
    ) {
      setFormError('Jenis pengolahan wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      form.jenis_kegiatan === 'Pemasaran' &&
      !form.jenis_kegiatan_pemasaran
    ) {
      setFormError('Jenis pemasaran wajib dipilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormError('');

    const payload = {
      ...form,
      ...productionMetrics,
      total_seluruh_tenaga_kerja: totalTenagaKerja,
      perizinan: form.perizinan.join(', '),
      sertifikat_bangunan: form.sertifikat_bangunan.join(', '),
      sertifikat_umum: form.sertifikat_umum.join(', '),
      bulan_produksi: form.bulan_produksi.join(', '),
      asal_bahan_baku_kabupaten_kota:
        form.asal_bahan_baku_kabupaten_kota.join(', '),
      provinsi_asal_bahan_baku:
        form.provinsi_asal_bahan_baku.join(', '),
      asal_negara_bahan_baku:
        form.asal_negara_bahan_baku.join(', '),
      tujuan_pemasaran_kabupaten_kota:
        form.tujuan_pemasaran_kabupaten_kota.join(', '),
      provinsi_tujuan_pemasaran:
        form.provinsi_tujuan_pemasaran.join(', '),
      negara_tujuan_pemasaran:
        form.negara_tujuan_pemasaran.join(', '),
    };

    NUMERIC_FIELDS.forEach(key => {
      payload[key] = numberOrNull(form[key]);
    });

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {formError}
        </div>
      ) : null}

      <SectionCard
        title={initialData ? 'Edit Data Pengolahan & Pemasaran' : 'Tambah Data Pengolahan & Pemasaran'}
        description="Pilih jenis kegiatan terlebih dahulu, lalu isi formulir berikut dengan lengkap."
      >
        <div className="space-y-5">
          <ChoiceButtons
            label="Jenis Kegiatan"
            value={form.jenis_kegiatan}
            options={['Pengolahan', 'Pemasaran']}
            onChange={handleJenisKegiatan}
            required
          />

          <ChoiceButtons
            label="Skala Usaha"
            value={form.skala_usaha}
            options={['Mikro', 'Kecil', 'Menengah', 'Besar']}
            onChange={value => setChoice('skala_usaha', value)}
            columns={4}
            required
          />

          {form.jenis_kegiatan === 'Pengolahan' ? (
            <SelectField
              label="Jenis Pengolahan"
              value={form.jenis_kegiatan_pengolahan}
              onChange={setValue('jenis_kegiatan_pengolahan')}
              options={JENIS_PENGOLAHAN_OPTIONS}
              placeholder="Pilih jenis pengolahan"
              required
            />
          ) : null}

          {form.jenis_kegiatan === 'Pemasaran' ? (
            <SelectField
              label="Jenis Pemasaran"
              value={form.jenis_kegiatan_pemasaran}
              onChange={setValue('jenis_kegiatan_pemasaran')}
              options={JENIS_PEMASARAN_OPTIONS}
              placeholder="Pilih jenis pemasaran"
              required
            />
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="1" title="Lokasi Utama & Identitas UPI">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Tahun"
            value={form.tahun}
            onChange={setValue('tahun')}
            inputMode="numeric"
            placeholder="YYYY"
            maxLength={4}
            required
          />
          <SelectField
            label="Kabupaten/Kota"
            value={form.kabupaten_kota}
            onChange={setValue('kabupaten_kota')}
            options={KABUPATEN_KOTA_OPTIONS}
            placeholder="Pilih kabupaten/kota"
            required
          />
          <Field
            label="Kecamatan"
            value={form.kecamatan}
            onChange={setUppercase('kecamatan')}
            placeholder="NAMA KECAMATAN"
            required
          />
          <Field
            label="Desa/Kelurahan"
            value={form.desa}
            onChange={setUppercase('desa')}
            placeholder="NAMA DESA/KELURAHAN"
            required
          />
          <Field
            label="Alamat Detail"
            value={form.alamat}
            onChange={setUppercase('alamat')}
            placeholder="CTH: DUSUN KRAJAN, JL. IKAN TUNA NO. JALAN 10, NO. BANGUNAN A-2, RT 02/RW 03"
            helpText="Cantumkan dusun, nama jalan, nomor jalan, nomor bangunan, serta RT/RW agar alamat mudah ditemukan."
            className="md:col-span-2"
            required
          />
          <Field
            label="Nama UPI"
            value={form.nama_upi}
            onChange={setUppercase('nama_upi')}
            placeholder="NAMA UNIT PENGOLAHAN IKAN"
            required
          />
          <Field
            label="Nomor Telepon"
            value={form.nomor_telepon}
            onChange={setValue('nomor_telepon')}
            inputMode="tel"
            placeholder="08XXXXXXXXXX"
          />
          <Field
            label="Tahun Berdiri"
            value={form.tahun_berdiri}
            onChange={setValue('tahun_berdiri')}
            inputMode="numeric"
            placeholder="YYYY"
          />
        </div>
      </SectionCard>

      <SectionCard number="2" title="Legalitas Usaha & Profil Pemilik">
        <div className="space-y-5">
          <SearchableMultiSelect
            label="Sertifikat Perizinan Usaha"
            values={form.perizinan}
            options={PERIZINAN_OPTIONS}
            onChange={values => setChoice('perizinan', values)}
            placeholder="Pilih sertifikat perizinan"
            exclusiveOptions={['Tidak Ada']}
            helpText="Bisa memilih lebih dari satu. Pilihan “Tidak Ada” tidak dapat digabung dengan pilihan lain."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nama Pemilik"
              value={form.nama_pemilik}
              onChange={setUppercase('nama_pemilik')}
              placeholder="NAMA PEMILIK"
            />
            <SelectField
              label="Jenis Kelamin"
              value={form.jenis_kelamin}
              onChange={setValue('jenis_kelamin')}
              options={['Laki-Laki', 'Perempuan']}
              placeholder="Pilih jenis kelamin"
            />
            <Field
              label="Nomor Telepon Pemilik"
              value={form.nomor_telepon_2}
              onChange={setValue('nomor_telepon_2')}
              inputMode="tel"
              placeholder="08XXXXXXXXXX"
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 md:p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Alamat Domisili Pemilik</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Kabupaten 2"
                value={form.kabupaten_kota_2}
                onChange={setValue('kabupaten_kota_2')}
                options={KABUPATEN_KOTA_OPTIONS}
                placeholder="Pilih kabupaten/kota domisili"
              />
              <Field
                label="Kecamatan 2"
                value={form.kecamatan_2}
                onChange={setUppercase('kecamatan_2')}
                placeholder="NAMA KECAMATAN"
              />
              <Field
                label="Desa 2"
                value={form.desa_2}
                onChange={setUppercase('desa_2')}
                placeholder="NAMA DESA/KELURAHAN"
              />
              <Field
                label="Alamat Detail 2"
                value={form.alamat_2}
                onChange={setUppercase('alamat_2')}
                placeholder="CTH: DUSUN KRAJAN, JL. IKAN TUNA NO. JALAN 10, NO. BANGUNAN A-2, RT 02/RW 03"
                helpText="Cantumkan dusun, nama jalan, nomor jalan, nomor bangunan, serta RT/RW agar alamat mudah ditemukan."
                className="md:col-span-2 xl:col-span-3"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard number="3" title="Aset, Lahan, & Bangunan">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Nilai Aset (Rp)"
              value={form.nilai_aset_rp}
              onChange={setValue('nilai_aset_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Cold Storage (Kg)"
              value={form.cold_storage_kg}
              onChange={setValue('cold_storage_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <SelectField
              label="Status Cold Storage"
              value={form.status_cold_storage}
              onChange={setValue('status_cold_storage')}
              options={STATUS_COLD_STORAGE_OPTIONS}
              placeholder="Pilih status cold storage"
            />
            <Field
              label="Aset Cold Storage (Rp)"
              value={form.aset_cold_storage_rp}
              onChange={setValue('aset_cold_storage_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Status Lahan Usaha"
              value={form.status_lahan_usaha}
              onChange={setValue('status_lahan_usaha')}
              options={['Sewa', 'Milik Sendiri']}
              placeholder="Pilih status lahan"
            />
            <SelectField
              label="Sertifikat Lahan"
              value={form.sertifikat_lahan}
              onChange={setValue('sertifikat_lahan')}
              options={SERTIFIKAT_LAHAN_OPTIONS}
              placeholder="Pilih sertifikat lahan"
            />
            <Field
              label="Luas Lahan (m²)"
              value={form.luas_lahan_m2}
              onChange={setValue('luas_lahan_m2')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Nilai Lahan (Rp)"
              value={form.nilai_lahan_rp}
              onChange={setValue('nilai_lahan_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Biaya Sewa Per Tahun (Rp)"
              value={form.biaya_sewa_per_tahun_rp}
              onChange={setValue('biaya_sewa_per_tahun_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Luas Bangunan (m²)"
              value={form.luas_bangunan_m2}
              onChange={setValue('luas_bangunan_m2')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Nilai Bangunan (Rp)"
              value={form.nilai_bangunan_rp}
              onChange={setValue('nilai_bangunan_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <SearchableMultiSelect
              label="Sertifikat Bangunan"
              values={form.sertifikat_bangunan}
              options={SERTIFIKAT_BANGUNAN_OPTIONS}
              onChange={values => setChoice('sertifikat_bangunan', values)}
              placeholder="Pilih sertifikat bangunan"
              exclusiveOptions={['Tidak Ada']}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard number="4" title="Permodalan & Finansial">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Jumlah Modal Sendiri (Rp)"
              value={form.jumlah_modal_sendiri_rp}
              onChange={setValue('jumlah_modal_sendiri_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Jumlah Laba Ditanam (Rp)"
              value={form.jumlah_laba_ditanam_rp}
              onChange={setValue('jumlah_laba_ditanam_rp')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

          <ChoiceButtons
            label="Pinjaman Modal"
            value={form.pinjaman_modal}
            options={['Ya', 'Tidak']}
            onChange={handlePinjamanModal}
          />

          {form.pinjaman_modal === 'Ya' ? (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
              <Field
                label="Jumlah Pinjaman (Rp)"
                value={form.jumlah_pinjaman_rp}
                onChange={setValue('jumlah_pinjaman_rp')}
                inputMode="numeric"
                placeholder="0"
              />
              <SelectField
                label="Pemberi Pinjaman"
                value={form.pemberi_pinjaman}
                onChange={setValue('pemberi_pinjaman')}
                options={PEMBERI_PINJAMAN_OPTIONS}
                placeholder="Pilih pemberi pinjaman"
              />
              <Field
                label="Tanggal Akad Pinjaman"
                value={form.tanggal_akad_pinjaman}
                onChange={setValue('tanggal_akad_pinjaman')}
                type="date"
              />
              <Field
                label="Tenor Pinjaman (Tahun)"
                value={form.tenor_pinjaman_tahun}
                onChange={setValue('tenor_pinjaman_tahun')}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="5" title="Produk & Sertifikasi">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nama Merek"
              value={form.nama_merek}
              onChange={setUppercase('nama_merek')}
              placeholder="NAMA MEREK"
            />
            <Field
              label="Jenis Produk"
              value={form.jenis_produk}
              onChange={setUppercase('jenis_produk')}
              placeholder="JENIS PRODUK"
            />
            <SelectField
              label="Sertifikat BPOM"
              value={form.sertifikat_bpom}
              onChange={setValue('sertifikat_bpom')}
              options={['Tidak Ada', 'BPOM MD', 'PIRT']}
              placeholder="Pilih sertifikat BPOM"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Periode Produksi"
              value={form.periode_produksi}
              onChange={setValue('periode_produksi')}
              options={['Harian', 'Bulanan']}
              placeholder="Pilih periode produksi"
            />
            <SearchableMultiSelect
              label="Sertifikat Produk"
              values={form.sertifikat_umum}
              options={SERTIFIKAT_PRODUK_OPTIONS}
              onChange={values => setChoice('sertifikat_umum', values)}
              placeholder="Pilih sertifikat produk"
              exclusiveOptions={['Tidak Ada']}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        number="6"
        title="Metrik Produksi & Biaya"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Biaya Produksi Per Periode (Rp)"
              value={form.biaya_produksi_per_periode_rp}
              onChange={setValue('biaya_produksi_per_periode_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Biaya Lain-Lain Per Periode (Rp)"
              value={form.biaya_lain_lain_per_periode_rp}
              onChange={setValue('biaya_lain_lain_per_periode_rp')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Hasil Produksi Per Periode (Kg)"
              value={form.hasil_produksi_per_periode_kg}
              onChange={setValue('hasil_produksi_per_periode_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Kapasitas Per Periode (Kg)"
              value={form.kapasitas_per_periode_kg}
              onChange={setValue('kapasitas_per_periode_kg')}
              inputMode="decimal"
              placeholder="0"
            />
            <Field
              label="Harga Jual (Rp/Kg)"
              value={form.harga_jual_rp_kg}
              onChange={setValue('harga_jual_rp_kg')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Jumlah Total Bulan Produksi Per Tahun"
              value={form.jumlah_total_bulan_produksi_per_tahun}
              onChange={setValue('jumlah_total_bulan_produksi_per_tahun')}
              inputMode="numeric"
              placeholder="12"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Jumlah Hari Produksi Per Bulan"
              value={form.jumlah_hari_produksi_per_bulan}
              onChange={setValue('jumlah_hari_produksi_per_bulan')}
              inputMode="numeric"
              placeholder="25"
              helpText={
                form.periode_produksi === 'Bulanan'
                  ? 'Tetap dapat diisi sebagai informasi operasional. Nilai ini tidak mengubah perhitungan tahunan untuk periode bulanan.'
                  : 'Digunakan dalam perhitungan tahunan untuk periode harian.'
              }
            />
            <SearchableMultiSelect
              label="Bulan Produksi"
              values={form.bulan_produksi}
              options={BULAN_OPTIONS}
              onChange={values => setChoice('bulan_produksi', values)}
              placeholder="Pilih bulan produksi"
              selectAllLabel="Pilih Semua Bulan"
              allSelectedText="Semua Bulan"
              exclusiveOptions={[]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:grid-cols-2 xl:grid-cols-4 md:p-5">
            <ReadOnlyMetric
              label="Biaya Produksi Per Tahun"
              value={productionMetrics.biaya_produksi_per_tahun_rp}
              suffix=" Rp"
            />
            <ReadOnlyMetric
              label="Kapasitas Per Tahun"
              value={productionMetrics.kapasitas_per_tahun_kg}
              suffix=" Kg"
            />
            <ReadOnlyMetric
              label="Hasil Produksi Per Tahun"
              value={productionMetrics.hasil_produksi_per_tahun_kg}
              suffix=" Kg"
            />
            <ReadOnlyMetric
              label="Nilai Hasil Produksi Per Tahun"
              value={productionMetrics.nilai_hasil_produksi_per_tahun_rp}
              suffix=" Rp"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard number="7" title="Bahan Baku & Distribusi Pemasaran">
        <div className="space-y-5">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Bahan Baku</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Nama Bahan Baku"
                value={form.nama_bahan_baku}
                onChange={setUppercase('nama_bahan_baku')}
                placeholder="NAMA BAHAN BAKU"
              />
              <Field
                label="Total Bahan Baku Per Periode (Kg)"
                value={form.total_bahan_baku_per_periode_kg}
                onChange={setValue('total_bahan_baku_per_periode_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <SearchableMultiSelect
                label="Asal Bahan Baku (Kabupaten/Kota)"
                values={form.asal_bahan_baku_kabupaten_kota}
                options={MULTI_KABUPATEN_KOTA_OPTIONS}
                onChange={values =>
                  setChoice('asal_bahan_baku_kabupaten_kota', values)
                }
                placeholder="Cari dan pilih kabupaten/kota"
                allowCustom
              />
              <SearchableMultiSelect
                label="Provinsi Asal Bahan Baku"
                values={form.provinsi_asal_bahan_baku}
                options={PROVINCE_OPTIONS}
                onChange={values =>
                  setChoice('provinsi_asal_bahan_baku', values)
                }
                placeholder="Cari dan pilih provinsi"
                allowCustom
              />
              <SearchableMultiSelect
                label="Asal Negara Bahan Baku"
                values={form.asal_negara_bahan_baku}
                options={COUNTRY_OPTIONS}
                onChange={values =>
                  setChoice('asal_negara_bahan_baku', values)
                }
                placeholder="Cari dan pilih negara"
                allowCustom
                exclusiveOptions={['Tidak Ada']}
              />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Distribusi Pemasaran</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Total Pemasaran Per Tahun (Kg)"
                value={form.total_pemasaran_per_tahun_kg}
                onChange={setValue('total_pemasaran_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Dalam Kota/Kab Per Tahun (Kg)"
                value={form.pasar_dalam_kota_kab_per_tahun_kg}
                onChange={setValue('pasar_dalam_kota_kab_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Kota Dalam Jatim Per Tahun (Kg)"
                value={form.pasar_kota_dalam_jatim_per_tahun_kg}
                onChange={setValue('pasar_kota_dalam_jatim_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Luar Jatim Per Tahun (Kg)"
                value={form.pasar_luar_jatim_per_tahun_kg}
                onChange={setValue('pasar_luar_jatim_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <Field
                label="Pasar Luar Negeri Per Tahun (Kg)"
                value={form.pasar_luar_negeri_per_tahun_kg}
                onChange={setValue('pasar_luar_negeri_per_tahun_kg')}
                inputMode="decimal"
                placeholder="0"
              />
              <SearchableMultiSelect
                label="Tujuan Pemasaran (Kabupaten/Kota)"
                values={form.tujuan_pemasaran_kabupaten_kota}
                options={MULTI_KABUPATEN_KOTA_OPTIONS}
                onChange={values =>
                  setChoice('tujuan_pemasaran_kabupaten_kota', values)
                }
                placeholder="Cari dan pilih kabupaten/kota"
                allowCustom
              />
              <SearchableMultiSelect
                label="Provinsi Tujuan Pemasaran"
                values={form.provinsi_tujuan_pemasaran}
                options={PROVINCE_OPTIONS}
                onChange={values =>
                  setChoice('provinsi_tujuan_pemasaran', values)
                }
                placeholder="Cari dan pilih provinsi"
                allowCustom
              />
              <SearchableMultiSelect
                label="Negara Tujuan Pemasaran"
                values={form.negara_tujuan_pemasaran}
                options={COUNTRY_OPTIONS}
                onChange={values =>
                  setChoice('negara_tujuan_pemasaran', values)
                }
                placeholder="Cari dan pilih negara"
                allowCustom
                exclusiveOptions={['Tidak Ada']}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        number="8"
        title="Ketenagakerjaan"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Tenaga Kerja Tetap - Laki-Laki"
              value={form.tenaga_kerja_tetap_laki_laki}
              onChange={setValue('tenaga_kerja_tetap_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap - Perempuan"
              value={form.tenaga_kerja_tetap_perempuan}
              onChange={setValue('tenaga_kerja_tetap_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap - Laki-Laki"
              value={form.tenaga_kerja_tidak_tetap_laki_laki}
              onChange={setValue('tenaga_kerja_tidak_tetap_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap - Perempuan"
              value={form.tenaga_kerja_tidak_tetap_perempuan}
              onChange={setValue('tenaga_kerja_tidak_tetap_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Keluarga - Laki-Laki"
              value={form.tenaga_kerja_keluarga_laki_laki}
              onChange={setValue('tenaga_kerja_keluarga_laki_laki')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Keluarga - Perempuan"
              value={form.tenaga_kerja_keluarga_perempuan}
              onChange={setValue('tenaga_kerja_keluarga_perempuan')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap 2 - Laki-Laki"
              value={form.tenaga_kerja_tetap_laki_laki_2}
              onChange={setValue('tenaga_kerja_tetap_laki_laki_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tetap 2 - Perempuan"
              value={form.tenaga_kerja_tetap_perempuan_2}
              onChange={setValue('tenaga_kerja_tetap_perempuan_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap 2 - Laki-Laki"
              value={form.tenaga_kerja_tidak_tetap_laki_laki_2}
              onChange={setValue('tenaga_kerja_tidak_tetap_laki_laki_2')}
              inputMode="numeric"
              placeholder="0"
            />
            <Field
              label="Tenaga Kerja Tidak Tetap 2 - Perempuan"
              value={form.tenaga_kerja_tidak_tetap_perempuan_2}
              onChange={setValue('tenaga_kerja_tidak_tetap_perempuan_2')}
              inputMode="numeric"
              placeholder="0"
            />
          </div>

        </div>
      </SectionCard>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 md:max-w-sm">
          <ReadOnlyMetric label="Total Seluruh Tenaga Kerja" value={totalTenagaKerja} suffix=" Orang" />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Data
          </button>
        </div>
      </div>
    </form>
  );
}