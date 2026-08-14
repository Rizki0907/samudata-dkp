const express = require('express');
const router = express.Router();
const controller = require('../controllers/tangkapTahunan.controller');

// Endpoint API (GET) untuk mengambil data
router.get('/', controller.getAllTahunan);
// Endpoint API (GET) untuk publik
router.get('/publik', controller.getPublikData);
// Endpoint API (GET) untuk mengambil data
router.get('/:id', controller.getTahunanById);
// Endpoint API (POST) untuk menambah data baru
router.post('/', controller.createTahunan);
// Endpoint API (PUT/PATCH) untuk memperbarui data
router.put('/:id', controller.updateTahunan);
// Endpoint API (DELETE) untuk menghapus data
router.delete('/:id', controller.deleteTahunan);
// Endpoint API (POST) untuk menambah data baru
router.post('/batch-status', controller.batchUpdateStatus);
// Endpoint API (POST) untuk menambah data baru
router.post('/batch-delete', controller.batchDelete);
// Endpoint API (PUT/PATCH) untuk memperbarui data
router.patch('/:id/status', controller.updateStatus);

module.exports = router;
