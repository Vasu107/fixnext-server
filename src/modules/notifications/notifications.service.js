const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../../../server/dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS Notification (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId TEXT NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    time TEXT NOT NULL,
                    button TEXT,
                    icon TEXT NOT NULL,
                    isRead INTEGER DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        });
    }
});

const getNotifications = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC`,
            [userId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

const markAsRead = (userId) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE Notification SET isRead = 1 WHERE userId = ? AND isRead = 0`,
            [userId],
            function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
};

const createNotification = (data) => {
    return new Promise((resolve, reject) => {
        const { userId, type, title, message, time, button, icon } = data;
        db.run(
            `INSERT INTO Notification (userId, type, title, message, time, button, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, type, title, message, time, button || null, icon],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};

module.exports = {
    getNotifications,
    markAsRead,
    createNotification
};
