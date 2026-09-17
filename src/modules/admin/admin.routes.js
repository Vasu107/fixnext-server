const express = require('express');
const router = express.Router();
const adminService = require('./admin.service');
const { authenticate, authorizeRole } = require('../../middlewares/auth.middleware');

// Apply admin role authorization to all routes in this file
router.use(authenticate);
router.use(authorizeRole('admin'));

router.get('/stats', async (req, res) => {
    try {
        const stats = await adminService.getStats();
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/providers/pending', async (req, res) => {
    try {
        const providers = await adminService.getPendingProviders();
        res.json({ success: true, providers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/providers/:id/approve', async (req, res) => {
    try {
        const provider = await adminService.approveProvider(req.params.id);
        res.json({ success: true, provider });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/bookings', async (req, res) => {
    try {
        const bookings = await adminService.getAllBookings();
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
