const cron = require('node-cron');
const { Op } = require('sequelize');
const { Order, OrderItem, EventSeat } = require('../schemas');

const startCronJobs = () => {
  // Run every minute to check for expired pending orders (older than 5 minutes)
  cron.schedule('* * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const expiredOrders = await Order.findAll({
        where: {
          status: 'PENDING',
          createdAt: {
            [Op.lt]: fiveMinutesAgo
          }
        },
        include: [{ model: OrderItem, as: 'orderItems' }]
      });

      if (expiredOrders.length > 0) {
        console.log(`[Cron] Found ${expiredOrders.length} expired pending orders to cancel.`);
        
        for (const order of expiredOrders) {
          order.status = 'CANCELLED';
          await order.save();

          // Revert seats
          if (order.orderItems) {
            for (const item of order.orderItems) {
              if (item.event_seat_id) {
                const es = await EventSeat.findByPk(item.event_seat_id);
                if (es && es.status !== 'AVAILABLE') {
                  es.status = 'AVAILABLE';
                  await es.save();
                }
              }
            }
          }
          console.log(`[Cron] Cancelled order #${order.id} and released its seats.`);
        }
      }
    } catch (error) {
      console.error('[Cron Error] Failed to process expired orders:', error);
    }
  });
};

module.exports = { startCronJobs };
