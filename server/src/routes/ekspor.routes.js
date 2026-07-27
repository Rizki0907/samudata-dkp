const express = require('express');
const router = express.Router();
const { verifyToken, requireAdminPusat } = require('../middleware/authMiddleware');
const {
  getAllData,
  getAdminData,
  createData,
  updateData,
  deleteData,
  getStats,
  updateStatus,
  batchStatus,
  batchDelete
} = require('../controllers/ekspor.controller');

// Public routes
router.get('/', getAllData);
router.get('/stats', getStats);

// Protected routes (Admin Pusat only)
router.post('/batch-status', verifyToken, requireAdminPusat, batchStatus);
router.post('/batch-delete', verifyToken, requireAdminPusat, batchDelete);

router.get('/admin', verifyToken, requireAdminPusat, getAdminData);
router.post('/', verifyToken, requireAdminPusat, createData);
router.put('/:id', verifyToken, requireAdminPusat, updateData);
router.delete('/:id', verifyToken, requireAdminPusat, deleteData);
router.put('/:id/status', verifyToken, requireAdminPusat, updateStatus);

module.exports = router;
