const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterData.controller');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', masterDataController.getAllMasterData);
router.get('/:category', masterDataController.getMasterDataByCategory);

// Hanya admin yang boleh menambah/edit/hapus master data
router.post('/', verifyToken, masterDataController.createMasterData);

router.put('/:id', verifyToken, masterDataController.updateMasterData);

router.delete('/:id', verifyToken, masterDataController.deleteMasterData);

module.exports = router;
