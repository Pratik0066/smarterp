const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/analyze', analysisController.analyzeCode);

module.exports = router;
