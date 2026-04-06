const bcrypt = require('bcryptjs');
const {
  User, Venue, Seat, Event, EventSeat, Order, OrderItem,
  Category, Review, Wishlist, Notification, Promotion, Cart, CartItem,
  sequelize
} = require('../schemas');

const seedData = async () => {
  try {
    console.log('=== DATA SEEDER: Bat dau tao du lieu mau (14 bang) ===');

    // 1. Sync Database (force: true = xoa tat ca va tao lai)
    console.log('[1/10] Syncing database...');
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // ========================================
    // 2. USERS
    // ========================================
    console.log('[2/10] Seeding users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('123456', 10);

    const admin = await User.create({
      username: 'admin', email: 'admin@ticketsystem.com', password: hashedAdminPassword,
      fullName: 'Administrator', phone: '0123456789', role: 'ADMIN',
    });
    const user1 = await User.create({
      username: 'nguyenvana', email: 'nguyenvana@gmail.com', password: hashedUserPassword,
      fullName: 'Nguyen Van A', phone: '0987654321', role: 'USER',
    });
    const user2 = await User.create({
      username: 'tranthib', email: 'tranthib@gmail.com', password: hashedUserPassword,
      fullName: 'Tran Thi B', phone: '0912345678', role: 'USER',
    });
    const user3 = await User.create({
      username: 'levanc', email: 'levanc@gmail.com', password: hashedUserPassword,
      fullName: 'Le Van C', phone: '0901234567', role: 'USER',
    });

    // ========================================
    // 3. CATEGORIES
    // ========================================
    console.log('[3/10] Seeding categories...');
    const catMusic = await Category.create({ name: 'Am nhac', description: 'Cac su kien am nhac, concert, live show', icon: '🎵' });
    const catSports = await Category.create({ name: 'The thao', description: 'Cac tran dau, giai dau the thao', icon: '⚽' });
    const catTech = await Category.create({ name: 'Cong nghe', description: 'Hoi nghi, hoi thao cong nghe', icon: '💻' });
    const catComedy = await Category.create({ name: 'Hai kich', description: 'Hai doc thoai, tieu pham hai', icon: '😂' });
    const catArt = await Category.create({ name: 'Nghe thuat', description: 'Trien lam, bieu dien nghe thuat', icon: '🎨' });

    // ========================================
    // 4. PROMOTIONS
    // ========================================
    console.log('[4/10] Seeding promotions...');
    await Promotion.create({
      code: 'CHAOHE2026', description: 'Giam 10% cho mua he 2026', discountType: 'PERCENTAGE',
      discountValue: 10, minOrderValue: 200000, maxDiscount: 100000,
      startDate: new Date('2026-03-01'), endDate: new Date('2026-08-31'), usageLimit: 100,
    });
    await Promotion.create({
      code: 'WELCOME50K', description: 'Giam 50.000d cho don dau tien', discountType: 'FIXED_AMOUNT',
      discountValue: 50000, minOrderValue: 100000, maxDiscount: null,
      startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), usageLimit: 500,
    });
    await Promotion.create({
      code: 'VIP20', description: 'Giam 20% cho ve VIP', discountType: 'PERCENTAGE',
      discountValue: 20, minOrderValue: 500000, maxDiscount: 300000,
      startDate: new Date('2026-03-01'), endDate: new Date('2026-06-30'), usageLimit: 50,
    });

    // ========================================
    // 5. VENUES + SEATS
    // ========================================
    console.log('[5/10] Seeding venues & seats...');

    const createVenueWithSeats = async (name, address, rowConfigs) => {
      let maxCols = 0;
      rowConfigs.forEach(row => { maxCols = Math.max(maxCols, parseInt(row[1])); });

      const venue = await Venue.create({ name, address, totalRows: rowConfigs.length, totalColumns: maxCols });

      const seats = [];
      for (const [label, count, type] of rowConfigs) {
        for (let col = 1; col <= parseInt(count); col++) {
          seats.push({ venue_id: venue.id, rowLabel: label, colNumber: col, seatType: type });
        }
      }
      await Seat.bulkCreate(seats);
      return venue;
    };

    const venue1 = await createVenueWithSeats("Nha hat Lon Ha Noi", "1 Trang Tien, Hoan Kiem, Ha Noi", [
      ["A", "10", "VIP"], ["B", "10", "VIP"], ["C", "12", "STANDARD"], ["D", "12", "STANDARD"],
      ["E", "12", "STANDARD"], ["F", "14", "ECONOMY"], ["G", "14", "ECONOMY"], ["H", "14", "ECONOMY"]
    ]);
    const venue2 = await createVenueWithSeats("Nha Thi Dau Phu Tho", "1 Lu Gia, Quan 11, TP.HCM", [
      ["A", "12", "VIP"], ["B", "12", "VIP"], ["C", "14", "VIP"], ["D", "15", "STANDARD"],
      ["E", "15", "STANDARD"], ["F", "15", "STANDARD"], ["G", "15", "STANDARD"], ["H", "18", "ECONOMY"],
      ["I", "18", "ECONOMY"], ["J", "18", "ECONOMY"]
    ]);
    const venue3 = await createVenueWithSeats("San Van Dong My Dinh", "Le Duc Tho, Nam Tu Liem, Ha Noi", [
      ["A", "15", "VIP"], ["B", "15", "VIP"], ["C", "15", "VIP"], ["D", "18", "STANDARD"],
      ["E", "18", "STANDARD"], ["F", "18", "STANDARD"], ["G", "20", "STANDARD"], ["H", "20", "STANDARD"],
      ["I", "20", "STANDARD"], ["J", "22", "ECONOMY"], ["K", "22", "ECONOMY"], ["L", "22", "ECONOMY"],
      ["M", "22", "ECONOMY"], ["N", "22", "ECONOMY"], ["O", "22", "ECONOMY"]
    ]);

    // ========================================
    // 6. EVENTS + EVENT SEATS
    // ========================================
    console.log('[6/10] Seeding events & event seats...');

    const createEventWithSeats = async (title, description, venue, eventDate, priceVip, priceStandard, priceEconomy, imageUrl, categoryId) => {
      const event = await Event.create({
        title, description, venue_id: venue.id, eventDate, price: priceStandard,
        imageUrl, status: 'UPCOMING', category_id: categoryId || null,
      });

      const seats = await Seat.findAll({ where: { venue_id: venue.id } });
      const eventSeats = seats.map(seat => ({
        event_id: event.id, seat_id: seat.id, status: 'AVAILABLE',
        price: seat.seatType === 'VIP' ? priceVip : seat.seatType === 'ECONOMY' ? priceEconomy : priceStandard,
      }));
      await EventSeat.bulkCreate(eventSeats);
      return event;
    };

    const event1 = await createEventWithSeats(
      "Live Concert Son Tung M-TP", "Dem nhac live cua Son Tung M-TP voi nhieu ca khuc hit...",
      venue1, new Date('2026-04-15T19:30:00'), 750000, 500000, 300000,
      "https://picsum.photos/seed/concert1/800/400", catMusic.id
    );
    const event2 = await createEventWithSeats(
      "Tech Conference 2026", "Hoi nghi cong nghe hang dau Viet Nam...",
      venue2, new Date('2026-05-20T08:00:00'), 500000, 300000, 150000,
      "https://picsum.photos/seed/tech1/800/400", catTech.id
    );
    const event3 = await createEventWithSeats(
      "Festival Am Nhac Quoc Te", "Festival am nhac voi su tham gia cua cac nghe sy quoc te...",
      venue3, new Date('2026-06-10T17:00:00'), 1200000, 800000, 500000,
      "https://picsum.photos/seed/festival1/800/400", catMusic.id
    );
    const event4 = await createEventWithSeats(
      "Stand-up Comedy Night", "Dem hai doc thoai voi cac comedian noi tieng...",
      venue1, new Date('2026-04-25T20:00:00'), 350000, 200000, 100000,
      "https://picsum.photos/seed/comedy1/800/400", catComedy.id
    );
    const event5 = await createEventWithSeats(
      "Tran Chung Ket AFF Cup 2026", "Tran chung ket luot ve AFF Cup 2026...",
      venue3, new Date('2026-07-01T19:00:00'), 1500000, 1000000, 600000,
      "https://picsum.photos/seed/football1/800/400", catSports.id
    );

    // ========================================
    // 7. SAMPLE ORDER (user1 mua ve event1)
    // ========================================
    console.log('[7/10] Seeding sample orders...');
    const eventSeatsForOrder = await EventSeat.findAll({ where: { event_id: event1.id }, limit: 2 });
    let orderTotal = 0;
    for (const es of eventSeatsForOrder) {
      es.status = 'BOOKED';
      await es.save();
      orderTotal += es.price;
    }
    const sampleOrder = await Order.create({
      user_id: user1.id, event_id: event1.id, totalAmount: orderTotal, status: 'PAID', paymentTime: new Date(),
    });
    const orderItemsData = eventSeatsForOrder.map(es => ({
      order_id: sampleOrder.id, event_seat_id: es.id, price: es.price, seatNumber: 'N/A',
    }));
    await OrderItem.bulkCreate(orderItemsData);

    // ========================================
    // 8. REVIEWS
    // ========================================
    console.log('[8/10] Seeding reviews...');
    await Review.create({ user_id: user1.id, event_id: event1.id, rating: 5, comment: 'Su kien tuyet voi! Am thanh rat hay, khung canh dep. Se quay lai lan sau!' });
    await Review.create({ user_id: user2.id, event_id: event2.id, rating: 4, comment: 'Noi dung cong nghe rat bo ich, dien gia rat chuyen nghiep.' });
    await Review.create({ user_id: user3.id, event_id: event1.id, rating: 4, comment: 'Nhac hay, nhung cho ngoi hoi chat.' });
    await Review.create({ user_id: user1.id, event_id: event4.id, rating: 5, comment: 'Cuoi suot 2 tieng! Cac comedian qua tai nang.' });

    // ========================================
    // 9. WISHLISTS
    // ========================================
    console.log('[9/10] Seeding wishlists...');
    await Wishlist.create({ user_id: user1.id, event_id: event3.id });
    await Wishlist.create({ user_id: user1.id, event_id: event5.id });
    await Wishlist.create({ user_id: user2.id, event_id: event1.id });
    await Wishlist.create({ user_id: user2.id, event_id: event3.id });
    await Wishlist.create({ user_id: user3.id, event_id: event5.id });

    // ========================================
    // 10. NOTIFICATIONS, CARTS & CART ITEMS
    // ========================================
    console.log('[10/10] Seeding notifications, carts & cart items...');

    // Notifications
    await Notification.create({
      user_id: user1.id, title: 'Dat ve thanh cong!', type: 'ORDER_SUCCESS',
      message: `Ban da dat 2 ve cho su kien "${event1.title}". Chuc ban co trai nghiem tuyet voi!`,
      referenceId: sampleOrder.id, referenceType: 'ORDER',
    });
    await Notification.create({
      user_id: user1.id, title: 'Su kien sap dien ra', type: 'EVENT_REMINDER',
      message: `Su kien "${event1.title}" se dien ra vao ngay 15/04/2026. Dung quen nhe!`,
      referenceId: event1.id, referenceType: 'EVENT',
    });
    await Notification.create({
      user_id: user2.id, title: 'Ma giam gia moi!', type: 'PROMOTION',
      message: 'Su dung ma CHAOHE2026 de giam 10% cho don hang tiep theo cua ban!',
      isRead: false,
    });
    await Notification.create({
      user_id: user3.id, title: 'Chao mung ban moi!', type: 'SYSTEM',
      message: 'Chao mung Le Van C da tham gia TicketSystem! Kham pha cac su kien hap dan ngay.',
      isRead: false,
    });

    // Carts
    const cart2 = await Cart.create({ user_id: user2.id });
    const cart3 = await Cart.create({ user_id: user3.id });

    // Cart Items (ghế chưa bị khóa! Vẫn AVAILABLE trong DB)
    const availableSeatsEvent3 = await EventSeat.findAll({
      where: { event_id: event3.id, status: 'AVAILABLE' }, limit: 3,
    });
    for (const es of availableSeatsEvent3) {
      await CartItem.create({ cart_id: cart2.id, event_seat_id: es.id, event_id: event3.id });
    }

    const availableSeatsEvent5 = await EventSeat.findAll({
      where: { event_id: event5.id, status: 'AVAILABLE' }, limit: 2,
    });
    for (const es of availableSeatsEvent5) {
      await CartItem.create({ cart_id: cart3.id, event_seat_id: es.id, event_id: event5.id });
    }

    // ========================================
    // DONE
    // ========================================
    console.log('\n========================================');
    console.log('=== DATA SEEDER: HOAN TAT (14 BANG) ===');
    console.log('========================================');
    console.log('');
    console.log('TAI KHOAN DANG NHAP:');
    console.log('  Admin : admin / admin123');
    console.log('  User 1: nguyenvana / 123456');
    console.log('  User 2: tranthib / 123456');
    console.log('  User 3: levanc / 123456');
    console.log('');
    console.log('DU LIEU MAU:');
    console.log('  Users       : 4  (1 admin + 3 users)');
    console.log('  Categories  : 5  (Am nhac, The thao, Cong nghe, Hai kich, Nghe thuat)');
    console.log('  Venues      : 3');
    console.log('  Events      : 5  (all linked to categories)');
    console.log('  Promotions  : 3  (CHAOHE2026, WELCOME50K, VIP20)');
    console.log('  Orders      : 1  (user1 mua 2 ve event1 - PAID)');
    console.log('  Reviews     : 4');
    console.log('  Wishlists   : 5');
    console.log('  Notifications: 4');
    console.log('  Cart Items  : 5  (user2: 3 ghe event3, user3: 2 ghe event5)');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
