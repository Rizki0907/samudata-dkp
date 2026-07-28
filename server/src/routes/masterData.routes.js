const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterData.controller');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', masterDataController.getAllMasterData);
router.get('/:category', masterDataController.getMasterDataByCategory);

// Hanya admin_pusat yang boleh menambah/hapus master data
router.post('/', verifyToken, (req, res, next) => {
  if (req.user.role !== 'admin_pusat') {
    return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengelola master data' });
  }
  next();
}, masterDataController.createMasterData);

router.put('/:id', verifyToken, (req, res, next) => {
  if (req.user.role !== 'admin_pusat') {
    return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengelola master data' });
  }
  next();
}, masterDataController.updateMasterData);

router.delete('/:id', verifyToken, (req, res, next) => {
  if (req.user.role !== 'admin_pusat') {
    return res.status(403).json({ success: false, message: 'Hanya Admin Pusat yang dapat mengelola master data' });
  }
  next();
}, masterDataController.deleteMasterData);

module.exports = router;
