const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

const ticketsDir = path.join(__dirname, '../tickets');
if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
}

exports.generateTicketPdf = async (orderId, order, qrContent) => {
    return new Promise(async (resolve, reject) => {
        try {
            const qrPath = path.join(ticketsDir, `qr_${orderId}.png`);
            await QRCode.toFile(qrPath, qrContent || `ORDER:${orderId}`);

            const pdfPath = path.join(ticketsDir, `ticket_${orderId}.pdf`);
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            // Title "VÉ SỰ KIỆN" (Approximating Helvetica 24 Bold color 41, 128, 185)
            // Using standard helvetica for latin text to avoid missing font issues, 
            // since typical pdfkit standard fonts don't bundle full Vietnamese glyphs.
            doc.font('Helvetica-Bold')
                .fontSize(24)
                .fillColor([41, 128, 185])
                .text('VE SU KIEN', { align: 'center' });

            doc.moveDown(1);


            // Event info table (simulated with standard text columns)
            const labelX = 100;
            const valueX = 220;
            let currentY = doc.y;
            const rowHeight = 25;

            const addRow = (label, value) => {
                doc.font('Helvetica-Bold').fontSize(12).fillColor('darkgray').text(label, labelX, currentY);
                doc.font('Helvetica').fillColor('black').text(value, valueX, currentY, { width: 300 });
                currentY = Math.max(doc.y, currentY + rowHeight); // handle text wrap
            };

            const eventDateStr = order.event && order.event.eventDate ? new Date(order.event.eventDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A';
            const venueStr = order.event && order.event.venue ? `${order.event.venue.name} - ${order.event.venue.address || ''}` : 'N/A';

            let seats = 'N/A';
            if (order.orderItems && order.orderItems.length > 0) {
                seats = order.orderItems.map(item => {
                    if (item.eventSeat && item.eventSeat.seat) {
                        return `${item.eventSeat.seat.rowLabel}${item.eventSeat.seat.colNumber}`;
                    }
                    return item.seatNumber;
                }).join(', ');
            }

            const totalMoney = new Intl.NumberFormat('en-US').format(order.totalAmount); // To match COMMA format from Spring Boot

            addRow('Ma don hang:', String(order.id));
            addRow('Su kien:', order.event ? order.event.title : 'N/A');
            addRow('Thoi gian:', eventDateStr);
            addRow('Dia diem:', venueStr);
            addRow('Ghe:', seats);
            addRow('Nguoi mua:', order.user ? (order.user.fullName || order.user.username) : 'N/A');
            addRow('Email:', order.user ? order.user.email : 'N/A');
            addRow('Tong tien:', `${totalMoney} VND`);

            // QR Code at center
            currentY += 20;
            doc.image(qrPath, (doc.page.width - 200) / 2, currentY, { width: 200 });

            // Note below QR
            currentY += 210;
            doc.font('Helvetica-Oblique').fontSize(10).fillColor('gray')
                .text('Vui long xuat trinh ma QR khi check-in', 0, currentY, { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve(pdfPath);
            });
            writeStream.on('error', (err) => {
                reject(err);
            });

        } catch (err) {
            reject(err);
        }
    });
};
