const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');
const { BUDIDAYA_TAHUNAN_CONFIG } = require('../utils/BudidayaTahunanConfig');

const getAll = async (req, res) => {
  try {
    const data = await prisma.budidayaTahunan.findMany({
      orderBy: { updated_at: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createOrUpdate = async (req, res) => {
  try {
    const { tahun, kabupaten_kota, modul_id, data, status } = req.body;

    if (!tahun || !kabupaten_kota || !modul_id || !data) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const existingData = await prisma.budidayaTahunan.findFirst({
      where: {
        tahun: parseInt(tahun),
        kabupaten_kota,
        modul_id,
      },
    });

    let result;
    if (existingData) {
      result = await prisma.budidayaTahunan.update({
        where: { id: existingData.id },
        data: {
          data,
          status: status || (existingData.status === 'REJECTED' ? 'PENDING' : existingData.status),
          alasan_penolakan: null, // reset penolakan if re-submitted
        },
      });
    } else {
      result = await prisma.budidayaTahunan.create({
        data: {
          tahun: parseInt(tahun),
          kabupaten_kota,
          modul_id,
          data,
          status: status || 'PENDING',
        },
      });
    }

    res.json({ success: true, data: result, message: 'Data berhasil disimpan' });
  } catch (error) {
    console.error('Error saving budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;

    const updatedData = await prisma.budidayaTahunan.update({
      where: { id: parseInt(id) },
      data: {
        status,
        alasan_penolakan: status === 'REJECTED' ? alasan_penolakan : null,
      },
    });

    res.json({ success: true, data: updatedData, message: `Status berhasil diubah menjadi ${status}` });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.budidayaTahunan.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting budidaya tahunan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status, alasan_penolakan } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    await prisma.budidayaTahunan.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status,
        alasan_penolakan: alasan_penolakan || null
      }
    });

    res.json({ success: true, message: `Berhasil mengupdate status ${ids.length} data` });
  } catch (error) {
    console.error('Error in batchUpdateStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const batchDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    await prisma.budidayaTahunan.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    res.json({ success: true, message: `Berhasil menghapus ${ids.length} data` });
  } catch (error) {
    console.error('Error in batchDelete:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const exportExcel = async (req, res) => {
  try {
    console.log('Incoming export request. Query:', req.query);
    const { tahun } = req.query;
    if (!tahun) {
      return res.status(400).json({ success: false, message: 'Parameter tahun diperlukan' });
    }

    const templatePath = path.join(__dirname, '../../templates/BudidayaTahunan.xlsx');
    const schemaPath = path.join(__dirname, '../../templates/sheet-schema.json');

    if (!fs.existsSync(templatePath) || !fs.existsSync(schemaPath)) {
      return res.status(500).json({ success: false, message: 'File template atau schema tidak ditemukan' });
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    
    // Fetch all records for the requested year
    const records = await prisma.budidayaTahunan.findMany({
      where: { tahun: parseInt(tahun) }
    });

    // Group records by modul_id and kabupaten_kota
    const recordsMap = {};
    for (const record of records) {
      if (!recordsMap[record.modul_id]) recordsMap[record.modul_id] = {};
      
      const kab = record.kabupaten_kota.toUpperCase();
      if (!recordsMap[record.modul_id][kab]) {
         recordsMap[record.modul_id][kab] = [];
      }
      recordsMap[record.modul_id][kab].push(record);
    }

    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    // Iterate over the 14 configured modules
    for (const config of BUDIDAYA_TAHUNAN_CONFIG) {
      let sheetName = config.title.replace(/MODUL \d+: /, '');
      if (sheetName === 'PRODUKSI PERBENIHAN BBI TAWAR') sheetName = 'PRODUKSI PERBENIHAN BBI';
      if (sheetName === 'BENIH TAWAR UPR & SWASTA') sheetName = 'BENIH TAWAR UPR SWASTA';
      if (sheetName === 'BENIH PAYAU UPR & SWASTA') sheetName = 'BENIH PAYAU UPR SWASTA';

      const sheet = workbook.sheet(sheetName);
      if (!sheet) continue;

      const sheetSchema = schema[sheetName];
      if (!sheetSchema) continue;

      const { row_labels } = sheetSchema;
      if (!row_labels) continue;

      const orderedFields = [];
      for (const seksi of config.seksi) {
         for (const field of seksi.fields) {
            orderedFields.push({ seksi: seksi.title, field });
         }
      }

      // Dynamically find the row that separates the top table from the bottom table
      // ONLY applicable for PRODUKSI type (Modul 11-14) which have two tables per sheet.
      const allRows = row_labels.map(r => r.row).sort((a, b) => a - b);
      let splitRow = 99999; 
      if (config.tipe === 'PRODUKSI' && allRows.length > 2) {
          let maxGap = 0;
          for (let i = 0; i < allRows.length - 1; i++) {
              const gap = allRows[i+1] - allRows[i];
              if (gap > maxGap) {
                  maxGap = gap;
                  splitRow = allRows[i] + (gap / 2);
              }
          }
      }

      const labelsByKab = {};
      for (const rowLabel of row_labels) {
        let baseKab = '';
        if (rowLabel.label.startsWith('KABUPATEN ')) {
           baseKab = rowLabel.label.replace('KABUPATEN ', '').split(' (')[0].trim().toUpperCase();
        } else if (rowLabel.label.startsWith('KOTA ')) {
           baseKab = rowLabel.label.split(' (')[0].trim().toUpperCase();
        } else {
           baseKab = rowLabel.label.split(' (')[0].trim().toUpperCase();
        }
        
        if (!labelsByKab[baseKab]) labelsByKab[baseKab] = [];
        labelsByKab[baseKab].push(rowLabel);
      }

      const modulData = recordsMap[config.id] || {};

      for (const kab of Object.keys(labelsByKab)) {
        const labels = labelsByKab[kab];
        const recordArr = modulData[kab] || [];
        const record = recordArr.length > 0 ? recordArr[0] : null;

        // Split template rows into top table and bottom table
        const topLabels = labels.filter(r => r.row < splitRow).sort((a,b) => a.row - b.row);
        const bottomLabels = labels.filter(r => r.row >= splitRow).sort((a,b) => a.row - b.row);

        const isProduksi = config.tipe === 'PRODUKSI';
        
        let targetFieldsTop = orderedFields;
        let targetFieldsBottom = orderedFields;
        
        if (isProduksi && config.isRepeatable) {
           targetFieldsTop = orderedFields.filter(f => !f.seksi.includes('Nilai Benih'));
           targetFieldsBottom = orderedFields.filter(f => !f.seksi.includes('Produksi Benih'));
        }

        const isRepeatable = config.tipe === 'REPEATABLE' || config.isRepeatable;
        
        let items = [];
        if (record && record.data) {
           if (record.data.items) {
               items = record.data.items;
           } else if (isRepeatable) {
               // Fallback: If it's supposed to be repeatable but has old flat data, wrap it in an array
               items = [record.data];
           }
        }

        // Determine max rows to process (max of template rows available)
        const maxTopRows = topLabels.length;
        
        for (let i = 0; i < maxTopRows; i++) {
           const topRowObj = topLabels[i];
           const bottomRowObj = bottomLabels[i];
           
           // If user inputted this index, use it, else empty (dash)
           let dataObj = null;
           if (record && record.data) {
               if (isRepeatable) {
                   dataObj = items[i] || null;
               } else {
                   dataObj = i === 0 ? record.data : null;
               }
           }

           const isHeaderRow = kab.toLowerCase().includes('nama kab');

           // Process Top Table Row
           if (topRowObj && !isHeaderRow) {
              for (let colIdx = 0; colIdx < targetFieldsTop.length; colIdx++) {
                 const { seksi, field } = targetFieldsTop[colIdx];
                 let val = "-";
                 if (dataObj && dataObj[seksi]) {
                    const rawVal = dataObj[seksi][field];
                    if (rawVal !== undefined && rawVal !== null && rawVal !== 0 && rawVal !== "") {
                       val = rawVal;
                    }
                 }
                 sheet.row(topRowObj.row).cell(colIdx + 2).value(val);
              }
           }

           // Process Bottom Table Row
           if (bottomRowObj && !isHeaderRow) {
              for (let colIdx = 0; colIdx < targetFieldsBottom.length; colIdx++) {
                 const { seksi, field } = targetFieldsBottom[colIdx];
                 let val = "-";
                 if (dataObj && dataObj[seksi]) {
                    const rawVal = dataObj[seksi][field];
                    if (rawVal !== undefined && rawVal !== null && rawVal !== 0 && rawVal !== "") {
                       val = rawVal;
                    }
                 }
                 sheet.row(bottomRowObj.row).cell(colIdx + 2).value(val);
              }
           }
        }
      }
    }

    const buffer = await workbook.outputAsync();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Data_Tahunan_Budidaya_${tahun}.xlsx`
    );

    res.end(buffer);
  } catch (error) {
    console.error('Error in exportExcel:', error);
    fs.appendFileSync('error.log', new Date().toISOString() + ': ' + error.stack + '\n');
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAll,
  createOrUpdate,
  updateStatus,
  deleteRecord,
  batchUpdateStatus,
  batchDelete,
  exportExcel
};
