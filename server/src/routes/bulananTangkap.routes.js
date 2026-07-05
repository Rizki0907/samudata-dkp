const express = require('express');
const router = express.Router();
const controller = require('../controllers/bulananTangkap.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint publik
router.get('/publik', controller.getPublikData);

// Endpoint Admin Pusat (Bidang Tangkap)
router.get('/admin', verifyToken, controller.getAdminData);
router.post('/sync', verifyToken, controller.triggerSync);
router.put('/:id/target', verifyToken, controller.updateTarget);
router.post('/:id/reset', verifyToken, controller.resetTarget);

module.exports = router;
