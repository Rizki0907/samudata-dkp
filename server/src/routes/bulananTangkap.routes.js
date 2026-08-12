const express = require('express');
const router = express.Router();
const controller = require('../controllers/bulananTangkap.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint publik
router.get('/publik', controller.getPublikData);

// Endpoint Admin Pusat (Bidang Tangkap)
router.get('/admin', verifyToken, controller.getAdminData);
// Endpoint API (POST) untuk menambah data baru
router.post('/sync', verifyToken, controller.triggerSync);
// Endpoint API (PUT/PATCH) untuk memperbarui data
router.put('/:id/target', verifyToken, controller.updateTarget);
// Endpoint API (POST) untuk menambah data baru
router.post('/:id/reset', verifyToken, controller.resetTarget);
// Endpoint API (POST) untuk menambah data baru
router.post('/batch-target', verifyToken, controller.batchUpdateTarget);

module.exports = router;
