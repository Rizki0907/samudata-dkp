const XlsxPopulate = require('xlsx-populate');
const path = require('path');

const filePath = path.resolve('templates/NON_PELABUHAN.xlsx');
console.log(`Reading file: ${filePath}`);

XlsxPopulate.fromFileAsync(filePath).then(wb => {
    ['TRIP', 'VOLUME', 'NILAI', 'Perbekalan'].forEach(sheetName => {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        const sheet = wb.sheet(sheetName);
        if(!sheet) {
           console.log("NOT FOUND");
           return;
        }
        
        // Print first 15 rows, 40 columns
        for (let r = 1; r <= 15; r++) {
            let rowData = [];
            let hasData = false;
            for (let c = 1; c <= 40; c++) {
                const cellVal = sheet.cell(r, c).value();
                if (cellVal !== undefined && cellVal !== null && cellVal !== '') {
                    hasData = true;
                }
                rowData.push(cellVal);
            }
            if (hasData) {
                console.log(`Row ${r}:`, rowData.join(' | '));
            }
        }
    });
}).catch(err => {
    console.error(err);
});
