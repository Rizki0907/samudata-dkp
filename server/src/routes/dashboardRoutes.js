const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/overview', dashboardController.getOverviewStats);

module.exports = router;
