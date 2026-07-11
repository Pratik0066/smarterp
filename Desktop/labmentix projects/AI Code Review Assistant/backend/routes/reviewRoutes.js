const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/submit', reviewController.submitReview);
router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReview);
router.delete('/:id', reviewController.deleteReview);
router.get('/stats/overview', reviewController.getStats);

module.exports = router;
