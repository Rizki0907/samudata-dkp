const express = require('express');
const router = express.Router();
const controller = require('../controllers/kelautanPesisir.controller');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getMangroveData,
  getMangrovePublicData,
  createMangroveData,
  updateMangroveData,
  deleteMangroveData,
  updateMangroveStatus,
  batchMangroveStatus,
  batchDeleteMangrove,
  getLamunData,
  getLamunPublicData,
  createLamunData,
  updateLamunData,
  deleteLamunData,
  updateLamunStatus,
  batchLamunStatus,
  batchDeleteLamun,
  getTerumbuKarangData,
  getTerumbuKarangPublicData,
  createTerumbuKarangData,
  updateTerumbuKarangData,
  deleteTerumbuKarangData,
  updateTerumbuKarangStatus,
  batchTerumbuKarangStatus,
  batchDeleteTerumbuKarang,
} = require('../controllers/kelautanPesisir.controller');

// ==========================================
// GARAM ROUTES
// ==========================================

// Public Route
router.get('/garam/public', controller.getGaramPublicData);

// Admin Routes
router.get('/garam', verifyToken, controller.getGaramData);
router.post('/garam', verifyToken, controller.createGaramData);
router.put('/garam/:id', verifyToken, controller.updateGaramData);
router.delete('/garam/:id', verifyToken, controller.deleteGaramData);
router.patch('/garam/:id/status', verifyToken, controller.updateGaramStatus);
router.post('/garam/batch-status', verifyToken, controller.batchGaramStatus);
router.post('/garam/batch-delete', verifyToken, controller.batchDeleteGaram);

// ==========================================
// TERUMBU KARANG ROUTES
// ==========================================

// Public Route
router.get('/terumbu-karang/public', getTerumbuKarangPublicData);

// Admin Routes
router.get('/terumbu-karang', verifyToken, getTerumbuKarangData);
router.post('/terumbu-karang', verifyToken, createTerumbuKarangData);
router.put('/terumbu-karang/:id', verifyToken, updateTerumbuKarangData);
router.delete('/terumbu-karang/:id', verifyToken, deleteTerumbuKarangData);
router.patch('/terumbu-karang/:id/status', verifyToken, updateTerumbuKarangStatus);
router.post('/terumbu-karang/batch-status', verifyToken, batchTerumbuKarangStatus);
router.post('/terumbu-karang/batch-delete', verifyToken, batchDeleteTerumbuKarang);

// ==========================================
// POTENSI PERAIRAN ROUTES
// ==========================================

// Public Route
router.get('/potensi-perairan/public', controller.getPotensiPerairanPublicData);

// Admin Routes
router.get('/potensi-perairan', verifyToken, controller.getPotensiPerairanData);
router.post('/potensi-perairan', verifyToken, controller.createPotensiPerairanData);
router.put('/potensi-perairan/:id', verifyToken, controller.updatePotensiPerairanData);
router.delete('/potensi-perairan/:id', verifyToken, controller.deletePotensiPerairanData);
router.patch('/potensi-perairan/:id/status', verifyToken, controller.updatePotensiPerairanStatus);
router.post('/potensi-perairan/batch-status', verifyToken, controller.batchPotensiPerairanStatus);
router.post('/potensi-perairan/batch-delete', verifyToken, controller.batchDeletePotensiPerairan);

// ==============================
// Mangrove
// ==============================

// Public
router.get('/mangrove/public', getMangrovePublicData);

// Admin (pasang middleware auth/role sesuai punyamu, contoh: verifyToken)
router.get('/mangrove', verifyToken, getMangroveData);
router.post('/mangrove', verifyToken, createMangroveData);
router.put('/mangrove/:id', verifyToken, updateMangroveData);
router.delete('/mangrove/:id', verifyToken, deleteMangroveData);
router.patch('/mangrove/:id/status', verifyToken, updateMangroveStatus);
router.post('/mangrove/batch-status', verifyToken, batchMangroveStatus);
router.post('/mangrove/batch-delete', verifyToken, batchDeleteMangrove);

// ==============================
// Lamun
// ==============================

// Public
router.get('/lamun/public', getLamunPublicData);

// Admin (pasang middleware auth/role sesuai punyamu, contoh: verifyToken)
router.get('/lamun', verifyToken, getLamunData);
router.post('/lamun', verifyToken, createLamunData);
router.put('/lamun/:id', verifyToken, updateLamunData);
router.delete('/lamun/:id', verifyToken, deleteLamunData);
router.patch('/lamun/:id/status', verifyToken, updateLamunStatus);
router.post('/lamun/batch-status', verifyToken, batchLamunStatus);
router.post('/lamun/batch-delete', verifyToken, batchDeleteLamun);

// ==========================================
// KELAUTAN & PESISIR AGGREGATE STATS (untuk Dashboard)
// ==========================================
router.get('/stats', controller.getKelautanPesisirStats);

module.exports = router;