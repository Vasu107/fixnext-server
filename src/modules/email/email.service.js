const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "vasudevyadav3107@gmail.com", 
        pass: "Vasudev@3107"  
    }
});

/**
 * Sends an email and logs failure instead of throwing an error.
 */
const sendEmailSafe = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: '"FixNext Support" <no-reply@fixnext.com>',
            to,
            subject,
            text,
            html
        });
        console.log(`[Mailer] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[Mailer] Failed to send email to ${to}. Error:`, error.message);
        return false;
    }
};

module.exports = {
    sendEmailSafe
};
