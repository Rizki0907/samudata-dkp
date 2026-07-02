import os
import time
import requests
import pandas as pd
from openpyxl import load_workbook

# Konfigurasi
TAHUN_MULAI = 2020
TAHUN_AKHIR = 2024
BASE_URL = "http://localhost:5000/api/budidaya/export-wadah?tahun={year}"
OUTPUT_DIR = "./output_excel"
ERROR_LOG = "error_log.txt"

# Pastikan folder output ada
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def log_error(message):
    """Fungsi untuk menyimpan log error ke file."""
    print(f"ERROR: {message}")
    with open(ERROR_LOG, "a") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")

def download_file(year, max_retries=3):
    """Fungsi untuk mengunduh file Excel dari server."""
    url = BASE_URL.format(year=year)
    filepath = os.path.join(OUTPUT_DIR, f"data_produksi_perikanan_{year}.xlsx")
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Mencoba mengunduh data tahun {year} (Percobaan {attempt}/{max_retries})...")
            # Gunakan session jika butuh state (sesuai requirement)
            session = requests.Session()
            # Gunakan header User-Agent dasar
            headers = {"User-Agent": "Mozilla/5.0"}
            
            response = session.get(url, headers=headers, timeout=10)
            
            # Jika response OK, simpan file
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"Berhasil mengunduh data tahun {year}.")
                return filepath
            else:
                log_error(f"Gagal mengunduh tahun {year}. Status Code: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            log_error(f"Koneksi error pada tahun {year}: {e}")
        
        # Jeda sebelum retry
        time.sleep(2)
        
    log_error(f"Gagal mengunduh data tahun {year} setelah {max_retries} percobaan.")
    return None

def parse_excel(filepath, year):
    """Fungsi untuk mem-parsing file Excel sesuai format tabel khusus."""
    print(f"Mem-parsing data untuk tahun {year}...")
    try:
        # Kita menggunakan pandas dengan parameter skiprows=3
        # Row 1-3 berisi judul dan keterangan. Baris 4 adalah header.
        df = pd.read_excel(filepath, skiprows=3)
        
        # Standarisasi nama kolom agar konsisten
        # Header pertama adalah 'KABUPATEN/KOTA', ubah jadi 'kabupaten'
        df.rename(columns={df.columns[0]: 'kabupaten'}, inplace=True)
        
        # Hapus baris agregat JUMLAH TOTAL (Row 5 pada Excel asli, di pandas menjadi index 0)
        df = df[df['kabupaten'].astype(str).str.strip().str.upper() != 'JUMLAH TOTAL']
        
        # Bersihkan whitespace pada nama kabupaten
        df['kabupaten'] = df['kabupaten'].astype(str).str.strip()
        
        # Tambahkan kolom tahun
        df['tahun'] = year
        
        # Handle nilai NaN menjadi 0
        df = df.fillna(0)
        
        return df
    
    except Exception as e:
        log_error(f"Gagal mem-parsing file {filepath}: {e}")
        return None

def merge_all_years(df_list):
    """Fungsi untuk menggabungkan semua DataFrame tahunan menjadi satu."""
    if not df_list:
        print("Tidak ada data yang berhasil dikumpulkan untuk digabungkan.")
        return
        
    print("Menggabungkan seluruh data tahunan...")
    merged_df = pd.concat(df_list, ignore_index=True)
    
    output_path = os.path.join(OUTPUT_DIR, "data_produksi_perikanan_ALL.xlsx")
    merged_df.to_excel(output_path, index=False)
    print(f"Data gabungan berhasil disimpan di: {output_path}")

def main():
    """Fungsi utama untuk menjalankan keseluruhan proses."""
    print("=== Memulai Script Ekstraksi Data Produksi Budidaya ===")
    
    all_dataframes = []
    sukses = []
    gagal = []
    total_baris = 0
    
    # Kosongkan error log jika sudah ada
    if os.path.exists(ERROR_LOG):
        open(ERROR_LOG, 'w').close()
        
    for year in range(TAHUN_MULAI, TAHUN_AKHIR + 1):
        filepath = download_file(year)
        
        if filepath:
            df = parse_excel(filepath, year)
            if df is not None and not df.empty:
                all_dataframes.append(df)
                sukses.append(year)
                total_baris += len(df)
            else:
                gagal.append(year)
        else:
            gagal.append(year)
            
    # Menggabungkan data
    merge_all_years(all_dataframes)
    
    # Print Summary
    print("\n=== RINGKASAN EKSEKUSI ===")
    print(f"Tahun Berhasil  : {', '.join(map(str, sukses)) if sukses else 'Tidak Ada'}")
    print(f"Tahun Gagal     : {', '.join(map(str, gagal)) if gagal else 'Tidak Ada'}")
    print(f"Total Baris Data: {total_baris} baris")
    print("======================================================")

if __name__ == "__main__":
    main()
