const express = require('express');
const router = express.Router();
const budidayaTahunanController = require('../controllers/budidayaTahunan.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Protect all routes
router.use(verifyToken);

router.get('/export', budidayaTahunanController.exportExcel);
router.get('/', budidayaTahunanController.getAll);
router.post('/', budidayaTahunanController.createOrUpdate);
router.post('/batch-status', budidayaTahunanController.batchUpdateStatus);
router.post('/batch-delete', budidayaTahunanController.batchDelete);
router.put('/:id/status', budidayaTahunanController.updateStatus);
router.delete('/:id', budidayaTahunanController.deleteRecord);

module.exports = router;
