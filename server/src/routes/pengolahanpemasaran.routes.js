const express = require('express');
const router = express.Router();
const pengolahanPemasaranController = require('../controllers/pengolahanpemasaran.controller');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/stats', pengolahanPemasaranController.getStats);
router.get('/', pengolahanPemasaranController.getAllData);

// Protected routes
router.get('/admin', verifyToken, pengolahanPemasaranController.getAdminData);
router.post('/', verifyToken, pengolahanPemasaranController.createData);
router.put('/:id', verifyToken, pengolahanPemasaranController.updateData);
router.delete('/:id', verifyToken, pengolahanPemasaranController.deleteData);
router.put('/:id/status', verifyToken, pengolahanPemasaranController.updateStatus);

module.exports = router;