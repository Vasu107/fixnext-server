const express = require('express');
const router = express.Router();
const bookingsService = require('./bookings.service');
const { authenticate, authorizeRole } = require('../../middlewares/auth.middleware');

router.post('/', authenticate, authorizeRole('customer'), async (req, res) => {
    try {
        const booking = await bookingsService.createBooking({ ...req.body, customerId: req.user.userId });
        res.status(201).json({ success: true, booking });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get('/customer', authenticate, authorizeRole('customer'), async (req, res) => {
    try {
        const bookings = await bookingsService.getCustomerBookings(req.user.userId);
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/provider', authenticate, authorizeRole('provider'), async (req, res) => {
    try {
        const jobs = await bookingsService.getProviderJobs(req.user.userId);
        res.json({ success: true, jobs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id/status', authenticate, authorizeRole('provider'), async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await bookingsService.updateJobStatus(req.params.id, req.user.userId, status);
        res.json({ success: true, booking });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post('/:id/verify-otp', authenticate, authorizeRole('provider'), async (req, res) => {
    try {
        const { otp } = req.body;
        const booking = await bookingsService.verifyOtp(req.params.id, req.user.userId, otp);
        res.json({ success: true, booking });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
