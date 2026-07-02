const express = require('express');
const router = express.Router();
const budidayaController = require('../controllers/budidaya.controller');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/export-wadah', budidayaController.exportRingkasanWadah);
router.get('/stats', budidayaController.getStats);
router.get('/', budidayaController.getAllData);

// Protected routes
router.get('/admin', verifyToken, budidayaController.getAdminData);
router.post('/', verifyToken, budidayaController.createData);
router.put('/:id', verifyToken, budidayaController.updateData);
router.delete('/:id', verifyToken, budidayaController.deleteData);
router.put('/:id/status', verifyToken, budidayaController.updateStatus);

module.exports = router;
