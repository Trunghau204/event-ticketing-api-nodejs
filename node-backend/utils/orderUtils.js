const { Order, OrderItem, Event, Venue, EventSeat, Seat, User } = require('../schemas');
const { generateTicketPdf } = require('./ticketService');
const { sendTicketEmail } = require('./mailHandler');

exports.completeOrderAndSendTicket = async (orderId) => {
    const { sequelize } = require('../schemas');
    const t = await sequelize.transaction();
    try {
        // Re-fetch with lock
        const order = await Order.findByPk(orderId, {
            include: [
                { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
                { model: User, as: 'user' },
                { model: OrderItem, as: 'orderItems', include: [{ model: EventSeat, as: 'eventSeat', include: [{ model: Seat, as: 'seat' }] }] }
            ],
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!order) {
            await t.rollback();
            throw new Error('Order not found');
        }

        // 2. Update status if pending
        if (order.status === 'PENDING') {
            order.status = 'PAID';
            order.paymentTime = new Date();
            await order.save({ transaction: t });
        } else {
            // Already paid or cancelled, just commit and return
            await t.commit();
            return order;
        }
        await t.commit();
        
        // Return the updated order object for the rest of processing (no longer requires transaction)
    } catch (err) {
        if (t) await t.rollback();
        throw err;
    }

    // Re-fetch clean copy for generation (to avoid transaction stale issues if any)
    const order = await Order.findByPk(orderId, {
        include: [
            { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
            { model: User, as: 'user' },
            { model: OrderItem, as: 'orderItems', include: [{ model: EventSeat, as: 'eventSeat', include: [{ model: Seat, as: 'seat' }] }] }
        ]
    });

    // 3. Generate PDF
    const pdfPath = await generateTicketPdf(order.id, order, `ORDER:${order.id}`);
    
    // 4. Send Email
    let seatsString = 'N/A';
    if (order.orderItems && order.orderItems.length > 0) {
      seatsString = order.orderItems.map(item => {
        if (item.eventSeat && item.eventSeat.seat) {
          return `${item.eventSeat.seat.rowLabel}${item.eventSeat.seat.colNumber}`;
        }
        return item.seatNumber;
      }).join(', ');
    }
    
    const eventDateStr = order.event && order.event.eventDate ? new Date(order.event.eventDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A';
    const venueStr = order.event && order.event.venue ? `${order.event.venue.name} - ${order.event.venue.address || ''}` : 'N/A';
    const totalMoney = new Intl.NumberFormat('en-US').format(order.totalAmount);

    try {
      if (order.user && order.user.email) {
          await sendTicketEmail({
            to: order.user.email,
            subject: 'Xác nhận đặt vé: ' + (order.event ? order.event.title : 'Sự kiện'),
            pdfPath: pdfPath,
            variables: {
              fullName: order.user.fullName || order.user.username,
              orderId: String(order.id),
              eventTitle: order.event ? order.event.title : 'N/A',
              eventDate: eventDateStr,
              venueName: venueStr,
              seats: seatsString,
              totalAmount: totalMoney
            }
          });
      } else {
        console.warn('Cannot send email, user email is null for order', order.id);
      }
    } catch (e) {
      console.error('Mail error in completeOrderAndSendTicket:', e);
    }

    return order;
};
