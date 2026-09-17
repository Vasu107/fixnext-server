const express = require('express');
const router = express.Router();
const providersService = require('./providers.service');
const { authenticate, authorizeRole } = require('../../middlewares/auth.middleware');

router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) return res.status(400).json({ success: false, error: 'Category is required' });
        
        const providers = await providersService.getProvidersByCategory(category);
        res.json({ success: true, providers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const provider = await providersService.getProviderById(req.params.id);
        res.json({ success: true, provider });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

router.put('/profile', authenticate, authorizeRole('provider'), async (req, res) => {
    try {
        const provider = await providersService.updateProfile(req.user.userId, req.body);
        res.json({ success: true, provider });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
