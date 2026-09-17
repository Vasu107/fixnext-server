const prisma = require('../../config/db');

const submitReview = async (data) => {
    const { bookingId, customerId, providerId, rating, text } = data;
    
    // Ensure booking exists and belongs to customer
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.customerId !== customerId) {
        throw new Error('Invalid booking');
    }

    if (booking.status !== 'Completed') {
        throw new Error('Can only review completed bookings');
    }

    const review = await prisma.review.create({
        data: {
            bookingId,
            customerId,
            providerId,
            rating,
            text
        },
        include: {
            customer: { select: { name: true } }
        }
    });

    return review;
};

const getProviderReviews = async (providerId) => {
    return prisma.review.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        include: {
            customer: { select: { name: true } }
        }
    });
};

module.exports = {
    submitReview,
    getProviderReviews
};
