const express = require('express');
const router = express.Router();
const controller = require('../controllers/kelautanPesisir.controller');
const { verifyToken, requireAdminPusat } = require('../middleware/authMiddleware');
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
router.get('/garam', verifyToken, requireAdminPusat, controller.getGaramData);
router.post('/garam', verifyToken, requireAdminPusat, controller.createGaramData);
router.put('/garam/:id', verifyToken, requireAdminPusat, controller.updateGaramData);
router.delete('/garam/:id', verifyToken, requireAdminPusat, controller.deleteGaramData);
router.patch('/garam/:id/status', verifyToken, requireAdminPusat, controller.updateGaramStatus);
router.post('/garam/batch-status', verifyToken, requireAdminPusat, controller.batchGaramStatus);
router.post('/garam/batch-delete', verifyToken, requireAdminPusat, controller.batchDeleteGaram);

// ==========================================
// TERUMBU KARANG ROUTES
// ==========================================

// Public Route
router.get('/terumbu-karang/public', getTerumbuKarangPublicData);

// Admin Routes
router.get('/terumbu-karang', verifyToken, requireAdminPusat, getTerumbuKarangData);
router.post('/terumbu-karang', verifyToken, requireAdminPusat, createTerumbuKarangData);
router.put('/terumbu-karang/:id', verifyToken, requireAdminPusat, updateTerumbuKarangData);
router.delete('/terumbu-karang/:id', verifyToken, requireAdminPusat, deleteTerumbuKarangData);
router.patch('/terumbu-karang/:id/status', verifyToken, requireAdminPusat, updateTerumbuKarangStatus);
router.post('/terumbu-karang/batch-status', verifyToken, requireAdminPusat, batchTerumbuKarangStatus);
router.post('/terumbu-karang/batch-delete', verifyToken, requireAdminPusat, batchDeleteTerumbuKarang);

// ==========================================
// POTENSI PERAIRAN ROUTES
// ==========================================

// Public Route
router.get('/potensi-perairan/public', controller.getPotensiPerairanPublicData);

// Admin Routes
router.get('/potensi-perairan', verifyToken, requireAdminPusat, controller.getPotensiPerairanData);
router.post('/potensi-perairan', verifyToken, requireAdminPusat, controller.createPotensiPerairanData);
router.put('/potensi-perairan/:id', verifyToken, requireAdminPusat, controller.updatePotensiPerairanData);
router.delete('/potensi-perairan/:id', verifyToken, requireAdminPusat, controller.deletePotensiPerairanData);
router.patch('/potensi-perairan/:id/status', verifyToken, requireAdminPusat, controller.updatePotensiPerairanStatus);
router.post('/potensi-perairan/batch-status', verifyToken, requireAdminPusat, controller.batchPotensiPerairanStatus);
router.post('/potensi-perairan/batch-delete', verifyToken, requireAdminPusat, controller.batchDeletePotensiPerairan);

// ==============================
// Mangrove
// ==============================

// Public
router.get('/mangrove/public', getMangrovePublicData);

// Admin (pasang middleware auth/role sesuai punyamu, contoh: verifyToken)
router.get('/mangrove', verifyToken, requireAdminPusat, getMangroveData);
router.post('/mangrove', verifyToken, requireAdminPusat, createMangroveData);
router.put('/mangrove/:id', verifyToken, requireAdminPusat, updateMangroveData);
router.delete('/mangrove/:id', verifyToken, requireAdminPusat, deleteMangroveData);
router.patch('/mangrove/:id/status', verifyToken, requireAdminPusat, updateMangroveStatus);
router.post('/mangrove/batch-status', verifyToken, requireAdminPusat, batchMangroveStatus);
router.post('/mangrove/batch-delete', verifyToken, requireAdminPusat, batchDeleteMangrove);

// ==============================
// Lamun
// ==============================

// Public
router.get('/lamun/public', getLamunPublicData);

// Admin (pasang middleware auth/role sesuai punyamu, contoh: verifyToken)
router.get('/lamun', verifyToken, requireAdminPusat, getLamunData);
router.post('/lamun', verifyToken, requireAdminPusat, createLamunData);
router.put('/lamun/:id', verifyToken, requireAdminPusat, updateLamunData);
router.delete('/lamun/:id', verifyToken, requireAdminPusat, deleteLamunData);
router.patch('/lamun/:id/status', verifyToken, requireAdminPusat, updateLamunStatus);
router.post('/lamun/batch-status', verifyToken, requireAdminPusat, batchLamunStatus);
router.post('/lamun/batch-delete', verifyToken, requireAdminPusat, batchDeleteLamun);

// ==========================================
// KELAUTAN & PESISIR AGGREGATE STATS (untuk Dashboard)
// ==========================================
router.get('/stats', controller.getKelautanPesisirStats);

module.exports = router;