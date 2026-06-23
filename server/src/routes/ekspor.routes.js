const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllData,
  createData,
  updateData,
  deleteData,
  getStats
} = require('../controllers/eksporController');

// Public routes
router.get('/', getAllData);
router.get('/stats', getStats);

// Protected routes (Admin only)
router.post('/', verifyToken, createData);
router.put('/:id', verifyToken, updateData);
router.delete('/:id', verifyToken, deleteData);

module.exports = router;
