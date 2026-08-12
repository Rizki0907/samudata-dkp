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
  exportPUD,
  exportNonPelabuhan,
  updateStatus,
  batchStatus,
  batchDelete
} = require('../controllers/perikananTangkap.controller');

// Public routes
router.get('/', getAllData);
// Endpoint API (GET) untuk mengambil data
router.get('/stats', getStats);
// Endpoint API (GET) untuk mengambil data
router.get('/export', exportData);
// Endpoint API (POST) untuk menambah data baru
router.post('/export-pud', exportPUD);
// Endpoint API (POST) untuk menambah data baru
router.post('/export-non-pelabuhan', exportNonPelabuhan);

// Protected routes (Admin only)
router.get('/admin', verifyToken, getAdminData);
// Endpoint API (POST) untuk menambah data baru
router.post('/', verifyToken, createData);
// Endpoint API (PUT/PATCH) untuk memperbarui data
router.put('/:id', verifyToken, updateData);
// Endpoint API (DELETE) untuk menghapus data
router.delete('/:id', verifyToken, deleteData);
// Endpoint API (PUT/PATCH) untuk memperbarui data
router.put('/:id/status', verifyToken, updateStatus);
// Endpoint API (POST) untuk menambah data baru
router.post('/batch-status', verifyToken, batchStatus);
// Endpoint API (POST) untuk menambah data baru
router.post('/batch-delete', verifyToken, batchDelete);

module.exports = router;
