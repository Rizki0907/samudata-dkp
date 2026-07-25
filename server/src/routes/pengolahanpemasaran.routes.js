const express = require('express');
const router = express.Router();
const pengolahanPemasaranController = require('../controllers/pengolahanpemasaran.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/stats', pengolahanPemasaranController.getStats);
router.get('/dashboard-stats', pengolahanPemasaranController.getDashboardStats);
router.post('/export-data', pengolahanPemasaranController.exportDataPublic);
router.post('/export-rekap', pengolahanPemasaranController.exportRekapPublic);
router.get('/', pengolahanPemasaranController.getAllData);

// Protected routes
router.get('/admin', verifyToken, pengolahanPemasaranController.getAdminData);
router.post('/admin/export-data', verifyToken, pengolahanPemasaranController.exportDataAdmin);
router.post('/admin/export-rekap', verifyToken, pengolahanPemasaranController.exportRekapAdmin);
router.post('/batch', verifyToken, pengolahanPemasaranController.createBatchData);
router.post('/', verifyToken, pengolahanPemasaranController.createData);
router.post('/batch-status', verifyToken, pengolahanPemasaranController.batchStatus);
router.post('/batch-delete', verifyToken, pengolahanPemasaranController.batchDelete);
router.put('/:id', verifyToken, pengolahanPemasaranController.updateData);
router.delete('/:id', verifyToken, pengolahanPemasaranController.deleteData);
router.put('/:id/status', verifyToken, pengolahanPemasaranController.updateStatus);

module.exports = router;
