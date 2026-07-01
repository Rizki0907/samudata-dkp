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
  exportData,
  updateStatus
} = require('../controllers/perikananTangkap.controller');

// Public routes
router.get('/', getAllData);
router.get('/stats', getStats);
router.get('/export', exportData);

// Protected routes (Admin only)
router.get('/admin', verifyToken, getAdminData);
router.post('/', verifyToken, createData);
router.put('/:id', verifyToken, updateData);
router.delete('/:id', verifyToken, deleteData);
router.put('/:id/status', verifyToken, updateStatus);

module.exports = router;
