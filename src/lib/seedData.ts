import { getDb } from './db';

export function seedDemoData() {
  const db = getDb();

  // Clear existing records to ensure a fresh demo dataset
  db.exec('DELETE FROM transactions;');
  db.exec('DELETE FROM budgets;');

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g., "2026-08"

  // 1. Seed Realistic Category Budgets for the current month (in ₹ INR)
  const sampleBudgets = [
    { category: '🍛 Food & Dining', amount: 12000 },
    { category: '🛒 Groceries', amount: 15000 },
    { category: '🚕 Transport', amount: 5000 },
    { category: '🏠 Rent & Housing', amount: 25000 },
    { category: '💡 Bills & Utilities', amount: 8000 },
    { category: '🛍️ Shopping', amount: 10000 },
    { category: '🎬 Entertainment', amount: 4000 },
    { category: '🏥 Healthcare', amount: 6000 },
    { category: '💳 Subscriptions', amount: 2000 },
    { category: '📱 Mobile & Internet', amount: 2500 },
    { category: '💰 Investments', amount: 20000 },
  ];

  const insertBudget = db.prepare(`
    INSERT INTO budgets (category, amount, month)
    VALUES (?, ?, ?)
    ON CONFLICT(category, month) DO UPDATE SET amount = excluded.amount
  `);

  for (const b of sampleBudgets) {
    insertBudget.run(b.category, b.amount, currentYearMonth);
  }

  // 2. Generate 50+ Realistic Indian Transactions across dates, amounts, categories, and payment methods
  const today = new Date();
  function getDateAgo(daysAgo: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  const rawTransactions = [
    // --- MONTH 1 (Current Month) ---
    // Incomes
    { amount: 85000, category: '📦 Other', description: 'Tech Corp Monthly Salary Transfer (NEFT)', date: getDateAgo(1), type: 'income', payment_method: 'Bank Transfer' },
    { amount: 18500, category: '📦 Other', description: 'UI/UX Freelance Design Retainer', date: getDateAgo(5), type: 'income', payment_method: 'UPI' },
    { amount: 3200, category: '💰 Investments', description: 'Mutual Fund Dividend Payout', date: getDateAgo(10), type: 'income', payment_method: 'Bank Transfer' },

    // Expenses - Rent & Housing
    { amount: 22000, category: '🏠 Rent & Housing', description: 'Monthly Apartment Rent Transfer', date: getDateAgo(2), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 1500, category: '🏠 Rent & Housing', description: 'Society Maintenance & Cleaning Fee', date: getDateAgo(3), type: 'expense', payment_method: 'UPI' },

    // Expenses - Food & Dining
    { amount: 480, category: '🍛 Food & Dining', description: 'Swiggy Gourmet Dinner - Italian Pizza', date: getDateAgo(1), type: 'expense', payment_method: 'UPI' },
    { amount: 240, category: '🍛 Food & Dining', description: 'Chai Point Tea & Snacks with Team', date: getDateAgo(2), type: 'expense', payment_method: 'UPI' },
    { amount: 1250, category: '🍛 Food & Dining', description: 'Barbeque Nation Weekend Lunch', date: getDateAgo(4), type: 'expense', payment_method: 'Credit Card' },
    { amount: 350, category: '🍛 Food & Dining', description: 'Zomato Lunch Delivery', date: getDateAgo(6), type: 'expense', payment_method: 'UPI' },
    { amount: 180, category: '🍛 Food & Dining', description: 'Starbucks Iced Latte Coffee', date: getDateAgo(7), type: 'expense', payment_method: 'UPI' },
    { amount: 620, category: '🍛 Food & Dining', description: 'Biryani Blues Dinner Order', date: getDateAgo(9), type: 'expense', payment_method: 'UPI' },

    // Expenses - Groceries
    { amount: 1850, category: '🛒 Groceries', description: 'Zepto Instant Grocery Delivery', date: getDateAgo(1), type: 'expense', payment_method: 'UPI' },
    { amount: 3400, category: '🛒 Groceries', description: 'D-Mart Monthly Household Provisions', date: getDateAgo(4), type: 'expense', payment_method: 'Debit Card' },
    { amount: 920, category: '🛒 Groceries', description: 'Blinkit Fresh Vegetables & Fruits', date: getDateAgo(6), type: 'expense', payment_method: 'UPI' },
    { amount: 1450, category: '🛒 Groceries', description: 'BigBasket Organic Staples Order', date: getDateAgo(11), type: 'expense', payment_method: 'UPI' },

    // Expenses - Transport
    { amount: 420, category: '🚕 Transport', description: 'Uber Ride to Client Office Meeting', date: getDateAgo(2), type: 'expense', payment_method: 'UPI' },
    { amount: 2500, category: '🚕 Transport', description: 'HPCL Petrol Pump Fuel Refill', date: getDateAgo(5), type: 'expense', payment_method: 'Credit Card' },
    { amount: 180, category: '🚕 Transport', description: 'Namma Metro Card Auto Recharge', date: getDateAgo(8), type: 'expense', payment_method: 'UPI' },
    { amount: 350, category: '🚕 Transport', description: 'Ola Auto Commute to Airport Metro', date: getDateAgo(12), type: 'expense', payment_method: 'UPI' },

    // Expenses - Bills & Utilities
    { amount: 2850, category: '💡 Bills & Utilities', description: 'BESCOM State Electricity Bill', date: getDateAgo(5), type: 'expense', payment_method: 'UPI' },
    { amount: 1199, category: '📱 Mobile & Internet', description: 'Airtel Black Fiber Broadband & Landline', date: getDateAgo(6), type: 'expense', payment_method: 'UPI' },
    { amount: 799, category: '📱 Mobile & Internet', description: 'Jio 5G Postpaid Family Mobile Recharge', date: getDateAgo(10), type: 'expense', payment_method: 'UPI' },
    { amount: 1050, category: '💡 Bills & Utilities', description: 'Piped Cooking Gas Utility Bill', date: getDateAgo(13), type: 'expense', payment_method: 'UPI' },

    // Expenses - Shopping
    { amount: 3499, category: '🛍️ Shopping', description: 'Amazon India Electronics Accessories', date: getDateAgo(3), type: 'expense', payment_method: 'Credit Card' },
    { amount: 2200, category: '🛍️ Shopping', description: 'Myntra Fashion Brand Shoes Purchase', date: getDateAgo(7), type: 'expense', payment_method: 'UPI' },
    { amount: 890, category: '🛍️ Shopping', description: 'Decathlon Sports Fitness Gear', date: getDateAgo(14), type: 'expense', payment_method: 'Debit Card' },

    // Expenses - Entertainment, Subscriptions, Healthcare & Investments
    { amount: 650, category: '🎬 Entertainment', description: 'PVR IMAX Cinema Movie Tickets for 2', date: getDateAgo(3), type: 'expense', payment_method: 'UPI' },
    { amount: 649, category: '💳 Subscriptions', description: 'Netflix India Premium 4K Plan', date: getDateAgo(8), type: 'expense', payment_method: 'Credit Card' },
    { amount: 299, category: '💳 Subscriptions', description: 'Spotify Premium Individual Annual', date: getDateAgo(11), type: 'expense', payment_method: 'UPI' },
    { amount: 1200, category: '🏥 Healthcare', description: 'Apollo Pharmacy Medicines & Health Supplements', date: getDateAgo(9), type: 'expense', payment_method: 'UPI' },
    { amount: 10000, category: '💰 Investments', description: 'Nifty 50 Index Mutual Fund Monthly SIP', date: getDateAgo(5), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 5000, category: '💰 Investments', description: 'Digital Gold SIP Investment', date: getDateAgo(10), type: 'expense', payment_method: 'UPI' },

    // --- MONTH 2 (1 Month Ago) ---
    { amount: 85000, category: '📦 Other', description: 'Tech Corp Monthly Salary', date: getDateAgo(32), type: 'income', payment_method: 'Bank Transfer' },
    { amount: 15000, category: '📦 Other', description: 'Freelance Mobile App Consultation', date: getDateAgo(35), type: 'income', payment_method: 'UPI' },
    { amount: 22000, category: '🏠 Rent & Housing', description: 'Monthly Apartment Rent', date: getDateAgo(31), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 4200, category: '🛒 Groceries', description: 'Supermarket Monthly Bulk Provisions', date: getDateAgo(33), type: 'expense', payment_method: 'Debit Card' },
    { amount: 3100, category: '🍛 Food & Dining', description: 'Weekend Dinner & Drinks with Friends', date: getDateAgo(34), type: 'expense', payment_method: 'Credit Card' },
    { amount: 2600, category: '🚕 Transport', description: 'Monthly Vehicle Petrol Refill', date: getDateAgo(36), type: 'expense', payment_method: 'UPI' },
    { amount: 2900, category: '💡 Bills & Utilities', description: 'Electricity & Water Utility Payments', date: getDateAgo(38), type: 'expense', payment_method: 'UPI' },
    { amount: 4500, category: '🛍️ Shopping', description: 'Festival Ethnic Wear Shopping', date: getDateAgo(40), type: 'expense', payment_method: 'Credit Card' },
    { amount: 1800, category: '🏥 Healthcare', description: 'Dental Clinic Checkup & X-Ray', date: getDateAgo(42), type: 'expense', payment_method: 'UPI' },
    { amount: 10000, category: '💰 Investments', description: 'Nifty 50 Index Mutual Fund SIP', date: getDateAgo(35), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 4500, category: '✈️ Travel', description: 'IndiGo Flight Ticket Booking for Weekend Trip', date: getDateAgo(45), type: 'expense', payment_method: 'Credit Card' },
    { amount: 2200, category: '✈️ Travel', description: 'Hotel Airbnb Stay Booking', date: getDateAgo(46), type: 'expense', payment_method: 'UPI' },

    // --- MONTH 3 (2 Months Ago) ---
    { amount: 85000, category: '📦 Other', description: 'Tech Corp Monthly Salary', date: getDateAgo(62), type: 'income', payment_method: 'Bank Transfer' },
    { amount: 22000, category: '🏠 Rent & Housing', description: 'Monthly Apartment Rent', date: getDateAgo(61), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 3800, category: '🛒 Groceries', description: 'Bi-Weekly Grocery Run', date: getDateAgo(64), type: 'expense', payment_method: 'UPI' },
    { amount: 2400, category: '🍛 Food & Dining', description: 'Family Buffet Dinner', date: getDateAgo(66), type: 'expense', payment_method: 'Credit Card' },
    { amount: 2500, category: '🚕 Transport', description: 'Monthly Fuel Refill', date: getDateAgo(67), type: 'expense', payment_method: 'UPI' },
    { amount: 10000, category: '💰 Investments', description: 'Nifty 50 Index Mutual Fund SIP', date: getDateAgo(65), type: 'expense', payment_method: 'Bank Transfer' },
    { amount: 3200, category: '📚 Education', description: 'Udemy & Coursera Tech Certification Courses', date: getDateAgo(70), type: 'expense', payment_method: 'Credit Card' },
    { amount: 1400, category: '🛍️ Shopping', description: 'Books & Stationery Purchase', date: getDateAgo(72), type: 'expense', payment_method: 'Cash' },
    { amount: 600, category: '🚕 Transport', description: 'Local Taxi Commute', date: getDateAgo(75), type: 'expense', payment_method: 'Cash' }
  ];

  const insertTx = db.prepare(`
    INSERT INTO transactions (amount, category, description, date, type, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION;');
  for (const tx of rawTransactions) {
    insertTx.run(tx.amount, tx.category, tx.description, tx.date, tx.type, tx.payment_method);
  }
  db.exec('COMMIT;');

  return {
    success: true,
    message: `Database successfully seeded with ${rawTransactions.length} realistic Indian transaction records!`,
    count: rawTransactions.length,
  };
}
