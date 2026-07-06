const express = require('express');
const router = express.Router();
const controller = require('../controllers/kelautanPesisir.controller');

// ==========================================
// GARAM ROUTES
// ==========================================

// Public Route
router.get('/garam/public', controller.getGaramPublicData);

// Admin Routes
router.get('/garam', controller.getGaramData);
router.post('/garam', controller.createGaramData);
router.put('/garam/:id', controller.updateGaramData);
router.delete('/garam/:id', controller.deleteGaramData);
router.patch('/garam/:id/status', controller.updateGaramStatus);


// ==========================================
// POTENSI PERAIRAN ROUTES
// ==========================================

// Public Route
router.get('/potensi-perairan/public', controller.getPotensiPerairanPublicData);

// Admin Routes
router.get('/potensi-perairan', controller.getPotensiPerairanData);
router.post('/potensi-perairan', controller.createPotensiPerairanData);
router.put('/potensi-perairan/:id', controller.updatePotensiPerairanData);
router.delete('/potensi-perairan/:id', controller.deletePotensiPerairanData);
router.patch('/potensi-perairan/:id/status', controller.updatePotensiPerairanStatus);


// ==========================================
// KELAUTAN & PESISIR AGGREGATE STATS (untuk Dashboard)
// ==========================================
router.get('/stats', controller.getKelautanPesisirStats);

module.exports = router;
