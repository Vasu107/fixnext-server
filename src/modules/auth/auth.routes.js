const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/register/customer', async (req, res) => {
    try {
        const result = await authService.registerCustomer(req.body);
        res.status(201).json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post('/register/provider', async (req, res) => {
    try {
        const result = await authService.registerProvider(req.body);
        res.status(201).json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Google OAuth — client sends the idToken from expo-auth-session
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, error: 'idToken is required' });
        }
        const result = await authService.googleAuth({ idToken });
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await authService.getMe(req.user.userId);
        res.json({ success: true, user });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

module.exports = router;
