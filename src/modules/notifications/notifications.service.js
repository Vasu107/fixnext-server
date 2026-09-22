const prisma = require('../../config/db');

const getNotifications = (userId) => {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

const markAsRead = (userId) => {
    return prisma.notification.updateMany({
        where: { userId, isRead: 0 },
        data: { isRead: 1 },
    });
};

const createNotification = (data) => {
    const { userId, type, title, message, time, button, icon } = data;
    return prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            time,
            button: button || null,
            icon,
        },
    });
};

module.exports = {
    getNotifications,
    markAsRead,
    createNotification,
};
