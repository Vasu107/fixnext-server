const express = require('express');
const router = express.Router();
const reviewsService = require('./reviews.service');
const { authenticate, authorizeRole } = require('../../middlewares/auth.middleware');

router.post('/', authenticate, authorizeRole('customer'), async (req, res) => {
    try {
        const review = await reviewsService.submitReview({ ...req.body, customerId: req.user.userId });
        res.status(201).json({ success: true, review });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get('/provider/:providerId', async (req, res) => {
    try {
        const reviews = await reviewsService.getProviderReviews(req.params.providerId);
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
