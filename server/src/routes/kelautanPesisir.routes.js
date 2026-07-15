const express = require('express');
const router = express.Router();
const controller = require('../controllers/kelautanPesisir.controller');
const { verifyToken } = require('../middleware/authMiddleware');

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


// ==========================================
// KELAUTAN & PESISIR AGGREGATE STATS (untuk Dashboard)
// ==========================================
router.get('/stats', controller.getKelautanPesisirStats);

module.exports = router;
