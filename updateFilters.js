const fs = require('fs');
let user = fs.readFileSync('client/src/pages/user/Budidaya.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Remove the existing Terakhir Diperbarui badge from the top h1 row
user = user.replace(
  /<div \n\s*className="[^"]*inline-flex items-center gap-2[\s\S]*?<\/div>\n\s*<\/div>/,
  "</div>"
);

// 2. Replace the filter block with the card-styled one
const filterReplacement = \<div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-bold text-foreground">Filter Multidimensi</h3>
          </div>
          {lastUpdated ? (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 sm:self-auto">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="opacity-80">Terakhir Diperbarui:</span>
              <span className="font-semibold">{lastUpdated}</span>
            </div>
          ) : null}
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <SearchableMultiSelect
              options={tahunOptions}
              value={filterTahun}
              onChange={setFilterTahun}
              placeholder="Semua Tahun"
            />
            <SearchableMultiSelect
              options={bulanOptions}
              value={filterBulan}
              onChange={setFilterBulan}
              placeholder="Semua Bulan"
            />
            <SearchableMultiSelect
              options={kabupatenOptions}
              value={filterKabupaten}
              onChange={setFilterKabupaten}
              placeholder="Semua Kab/Kota"
            />
            <SearchableMultiSelect
              options={komoditasOptions}
              value={filterKomoditas}
              onChange={setFilterKomoditas}
              placeholder="Semua Komoditas"
            />
            <SearchableMultiSelect
              options={wadahOptions}
              value={filterWadah}
              onChange={setFilterWadah}
              placeholder="Semua Wadah"
            />
          </div>
          {(filterKomoditas.length > 0 || filterKabupaten.length > 0 || filterWadah.length > 0 || filterBulan.length > 0 || filterTahun.length > 0) && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setFilterKomoditas([]);
                  setFilterKabupaten([]);
                  setFilterWadah([]);
                  setFilterBulan([]);
                  setFilterTahun([]);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>\;

user = user.replace(
  /<div className="flex flex-col gap-2">\n\s*<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">[\s\S]*?Reset Semua Filter\n\s*<\/button>\n\s*<\/div>\n\s*\)}/,
  filterReplacement.substring(0, filterReplacement.length - 19) // Removing the extra trailing tags to avoid duplication, actually I'll just regex the exact end.
);

// Better replace strategy for filter block
const filterRegex = /<div className="flex flex-col gap-2">\s*<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">[\s\S]*?Reset Semua Filter\s*<\/button>\s*<\/div>\s*\)\}\s*<\/div>/;
user = user.replace(filterRegex, filterReplacement);

fs.writeFileSync('client/src/pages/user/Budidaya.jsx', user);
console.log('Filter UI updated');
