const express = require('express');
const router = express.Router();
const controller = require('../controllers/tangkapTahunan.controller');

router.get('/', controller.getAllTahunan);
router.get('/:id', controller.getTahunanById);
router.post('/', controller.createTahunan);
router.put('/:id', controller.updateTahunan);
router.delete('/:id', controller.deleteTahunan);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
