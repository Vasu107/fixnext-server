const prisma = require('../../config/db');

const generateBookingId = () => "#FX-" + Math.floor(100000 + Math.random() * 900000);
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

const createBooking = async (data) => {
    const { customerId, providerId, services, dateTime, address, total, paymentMethod } = data;
    
    const booking = await prisma.booking.create({
        data: {
            bookingId: generateBookingId(),
            customerId,
            providerId,
            services: JSON.stringify(services),
            dateTime,
            address,
            total,
            status: 'Upcoming',
            jobStatus: 'New',
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid'
        },
        include: {
            customer: { select: { name: true, phone: true } },
            provider: { select: { name: true } }
        }
    });

    return booking;
};

const getCustomerBookings = async (customerId) => {
    return prisma.booking.findMany({
        where: { customerId },
        orderBy: { placedAt: 'desc' },
        include: {
            provider: { select: { name: true } }
        }
    });
};

const getProviderJobs = async (providerId) => {
    return prisma.booking.findMany({
        where: { providerId },
        orderBy: { placedAt: 'desc' },
        include: {
            customer: { select: { name: true, phone: true } }
        }
    });
};

const updateJobStatus = async (bookingId, providerId, status) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.providerId !== providerId) throw new Error('Unauthorized');

    let updateData = { jobStatus: status };
    
    if (status === 'Accepted') updateData.status = 'Upcoming';
    if (status === 'Rejected') updateData.status = 'Cancelled';
    if (status === 'En Route') updateData.trackingActive = true;
    if (status === 'Arrived') {
        updateData.otp = generateOtp();
        updateData.otpVerified = false;
    }
    if (status === 'Completed') {
        updateData.status = 'Completed';
        updateData.trackingActive = false;
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
            customer: { select: { name: true, phone: true } }
        }
    });
};

const verifyOtp = async (bookingId, providerId, otp) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.providerId !== providerId) throw new Error('Unauthorized');
    
    if (booking.otp !== otp) throw new Error('Invalid OTP');

    return prisma.booking.update({
        where: { id: bookingId },
        data: {
            otpVerified: true,
            jobStatus: 'In Progress',
            trackingActive: false
        }
    });
};

module.exports = {
    createBooking,
    getCustomerBookings,
    getProviderJobs,
    updateJobStatus,
    verifyOtp
};
