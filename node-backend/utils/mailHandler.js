const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const fs = require('fs/promises');
const path = require('path');

const sendTicketEmail = async (options) => {
    const templatePath = path.join(__dirname, '../templates/ticket-email.html');
    let htmlContent = await fs.readFile(templatePath, 'utf8');

    const vars = options.variables || {};
    for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        htmlContent = htmlContent.replace(regex, value);
    }

    const mailOptions = {
        from: `"Ticket System" <${process.env.MAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: htmlContent,
    };

    if (options.pdfPath) {
        mailOptions.attachments = [
            {
                filename: 'ticket.pdf',
                path: options.pdfPath,
            }
        ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`=== Email gửi thành công tới ${options.to} ===`);
};

module.exports = { sendTicketEmail };
