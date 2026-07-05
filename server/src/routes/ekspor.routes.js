const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
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

// Protected routes (Admin only)
router.post('/batch-status', verifyToken, batchStatus);
router.post('/batch-delete', verifyToken, batchDelete);

router.get('/admin', verifyToken, getAdminData);
router.post('/', verifyToken, createData);
router.put('/:id', verifyToken, updateData);
router.delete('/:id', verifyToken, deleteData);
router.put('/:id/status', verifyToken, updateStatus);

module.exports = router;
