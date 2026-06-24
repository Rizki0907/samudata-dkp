const express = require('express');
const router = express.Router();
const budidayaController = require('../controllers/budidayaController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/stats', budidayaController.getStats);
router.get('/', budidayaController.getAllData);
router.post('/', verifyToken, budidayaController.createData);
router.put('/:id', verifyToken, budidayaController.updateData);
router.delete('/:id', verifyToken, budidayaController.deleteData);

module.exports = router;
