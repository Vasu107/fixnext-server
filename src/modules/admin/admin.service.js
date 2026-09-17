const prisma = require('../../config/db');

const getStats = async () => {
    const totalUsers = await prisma.user.count({ where: { role: 'customer' } });
    const totalProviders = await prisma.user.count({ where: { role: 'provider' } });
    
    // Revenue: sum of all completed bookings' total
    const revenueObj = await prisma.booking.aggregate({
        where: { status: 'Completed' },
        _sum: { total: true }
    });
    
    // Bookings today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingsToday = await prisma.booking.count({
        where: {
            placedAt: { gte: today }
        }
    });

    return {
        totalUsers,
        totalProviders,
        bookingsToday,
        revenue: revenueObj._sum.total || 0
    };
};

const getPendingProviders = async () => {
    return prisma.providerProfile.findMany({
        where: { verified: false },
        include: {
            user: { select: { name: true, email: true, phone: true } },
            categories: true
        }
    });
};

const approveProvider = async (providerId) => {
    return prisma.providerProfile.update({
        where: { userId: providerId },
        data: {
            verified: true,
            verifiedAt: new Date()
        }
    });
};

const getAllUsers = async () => {
    return prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    });
};

const getAllBookings = async () => {
    return prisma.booking.findMany({
        include: {
            customer: { select: { name: true } },
            provider: { select: { name: true } }
        },
        orderBy: { placedAt: 'desc' }
    });
};

module.exports = {
    getStats,
    getPendingProviders,
    approveProvider,
    getAllUsers,
    getAllBookings
};
