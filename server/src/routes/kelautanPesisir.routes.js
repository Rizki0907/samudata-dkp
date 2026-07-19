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

// ==========================================
// KELAUTAN & PESISIR AGGREGATE STATS (untuk Dashboard)
// ==========================================
router.get('/stats', controller.getKelautanPesisirStats);

module.exports = router;
