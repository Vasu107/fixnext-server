const express = require('express');
const cors = require('cors');
const { getNotifications, markAsRead, createNotification } = require('./src/modules/notifications/notifications.service');
const { sendEmailSafe } = require('./src/modules/email/email.service');

const authRoutes = require('./src/modules/auth/auth.routes');
const providersRoutes = require('./src/modules/providers/providers.routes');
const bookingsRoutes = require('./src/modules/bookings/bookings.routes');
const reviewsRoutes = require('./src/modules/reviews/reviews.routes');
const adminRoutes = require('./src/modules/admin/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- NEW API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

// --- NOTIFICATIONS API ---

app.get('/api/notifications', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    try {
        const notifications = await getNotifications(userId);
        res.json({ success: true, notifications });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.post('/api/notifications/read', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    try {
        const updatedCount = await markAsRead(userId);
        res.json({ success: true, updatedCount });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// --- EMAIL/BUSINESS LOGIC API ---

app.post('/api/bookings/accept', async (req, res) => {
    const { bookingId, customerId, customerEmail, providerName } = req.body;
    if (!bookingId || !customerId || !customerEmail || !providerName) {
        return res.status(400).json({ error: 'Missing required booking fields' });
    }

    try {
        await createNotification({
            userId: customerId,
            type: 'partner',
            title: 'Partner is on the way',
            message: `${providerName} has started your location for booking #${bookingId}. Arrival expected soon.`,
            time: 'Just now',
            icon: 'bicycle-outline'
        });

        const subject = `Booking #${bookingId} Accepted!`;
        const text = `Hi there,\n\nYour booking #${bookingId} has been accepted by ${providerName}. They are on their way to your location.\n\nThank you for using FixNext!`;
        const html = `<h3>Booking Accepted!</h3><p>Hi there,</p><p>Your booking <b>#${bookingId}</b> has been accepted by <b>${providerName}</b>. They are on their way to your location.</p><p>Thank you for using FixNext!</p>`;
        
        await sendEmailSafe(customerEmail, subject, text, html);

        res.json({ success: true, message: 'Booking accepted successfully' });
    } catch (err) {
        console.error('Error accepting booking:', err);
        res.status(500).json({ error: 'Internal server error during booking acceptance' });
    }
});

app.post('/api/providers/approve', async (req, res) => {
    const { providerId, providerEmail, providerName } = req.body;
    if (!providerId || !providerEmail || !providerName) {
        return res.status(400).json({ error: 'Missing required provider fields' });
    }

    try {
        await createNotification({
            userId: providerId,
            type: 'offer',
            title: 'Profile Approved! 🎉',
            message: `Congratulations ${providerName}, your provider profile has been verified and approved. You can now accept jobs.`,
            time: 'Just now',
            button: 'View Dashboard',
            icon: 'shield-checkmark-outline'
        });

        const subject = `Welcome to FixNext, ${providerName}! Your profile is approved.`;
        const text = `Hi ${providerName},\n\nGreat news! Your provider profile has been verified and approved. You can now start accepting jobs on FixNext.\n\nWelcome aboard!`;
        const html = `<h3>Profile Approved!</h3><p>Hi ${providerName},</p><p>Great news! Your provider profile has been verified and approved. You can now start accepting jobs on FixNext.</p><p>Welcome aboard!</p>`;
        
        await sendEmailSafe(providerEmail, subject, text, html);

        res.json({ success: true, message: 'Provider approved successfully' });
    } catch (err) {
        console.error('Error approving provider:', err);
        res.status(500).json({ error: 'Internal server error during provider approval' });
    }
});

app.post('/api/seed', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        await createNotification({
            userId,
            type: 'booking',
            title: 'Booking Confirmed',
            message: 'Your Bathroom Cleaning booking #FIX2911 is confirmed for 10 Oct, 10:00 AM.',
            time: 'Yesterday',
            icon: 'calendar-outline'
        });

        await createNotification({
            userId,
            type: 'offer',
            title: 'Flat ₹200 OFF 🎁',
            message: 'Get more from Home Cleaning. Apply coupon: CLEANFIX200.',
            time: '2h ago',
            icon: 'pricetag-outline'
        });

        res.json({ success: true, message: 'Seeded notifications for user' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixNext Backend running on http://0.0.0.0:${PORT}`);
});
