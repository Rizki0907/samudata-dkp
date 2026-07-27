const express = require('express');
const router = express.Router();
const pengolahanPemasaranController = require('../controllers/pengolahanpemasaran.controller');
const { verifyToken, requireAdminPusat } = require('../middleware/authMiddleware');

// Public routes
router.get('/stats', pengolahanPemasaranController.getStats);
router.get('/dashboard-stats', pengolahanPemasaranController.getDashboardStats);
router.post('/export-data', pengolahanPemasaranController.exportDataPublic);
router.post('/export-rekap', pengolahanPemasaranController.exportRekapPublic);
router.get('/', pengolahanPemasaranController.getAllData);

// Protected routes (Admin Pusat only)
router.get('/admin', verifyToken, requireAdminPusat, pengolahanPemasaranController.getAdminData);
router.post('/admin/export-data', verifyToken, requireAdminPusat, pengolahanPemasaranController.exportDataAdmin);
router.post('/admin/export-rekap', verifyToken, requireAdminPusat, pengolahanPemasaranController.exportRekapAdmin);
router.post('/batch', verifyToken, requireAdminPusat, pengolahanPemasaranController.createBatchData);
router.post('/', verifyToken, requireAdminPusat, pengolahanPemasaranController.createData);
router.post('/batch-status', verifyToken, requireAdminPusat, pengolahanPemasaranController.batchStatus);
router.post('/batch-delete', verifyToken, requireAdminPusat, pengolahanPemasaranController.batchDelete);
router.put('/:id', verifyToken, requireAdminPusat, pengolahanPemasaranController.updateData);
router.delete('/:id', verifyToken, requireAdminPusat, pengolahanPemasaranController.deleteData);
router.put('/:id/status', verifyToken, requireAdminPusat, pengolahanPemasaranController.updateStatus);

module.exports = router;
