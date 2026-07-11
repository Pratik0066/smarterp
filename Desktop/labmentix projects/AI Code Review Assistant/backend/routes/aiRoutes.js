const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/review', aiController.reviewCode);
router.post('/explain', aiController.explainCode);
router.post('/docs', aiController.generateDocs);

module.exports = router;
