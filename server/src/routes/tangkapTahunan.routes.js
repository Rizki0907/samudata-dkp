const express = require('express');
const router = express.Router();
const controller = require('../controllers/tangkapTahunan.controller');

router.get('/', controller.getAllTahunan);
router.get('/:id', controller.getTahunanById);
router.post('/', controller.createTahunan);
router.put('/:id', controller.updateTahunan);
router.delete('/:id', controller.deleteTahunan);
router.post('/batch-status', controller.batchUpdateStatus);
router.post('/batch-delete', controller.batchDelete);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
