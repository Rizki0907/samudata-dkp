const { syncDataBulananInternal } = require('../src/controllers/bulananTangkap.controller');

(async () => {
  console.log('Memulai sinkronisasi data riil bulanan...');
  const result = await syncDataBulananInternal();
  if (result) {
    console.log('Sinkronisasi selesai dengan sukses.');
  } else {
    console.log('Sinkronisasi gagal.');
  }
  process.exit(0);
})();
