const getDbForUser = require('../utils/getDbForUser');
const saleSchema = require('../models/Sale').schema;
const productSchema = require('../models/Product').schema;


exports.getDailyReport = async (req, res) => {
  try {
    const db = getDbForUser(req.user);
    const Sale = db.model('Sale', saleSchema);

    const sales = await Sale.find().populate('items.product');
    const daily = {};
    const istOffsetMinutes = 330;

    sales.forEach(sale => {
      if (!sale.createdAt) return;
      const createdUTC = new Date(sale.createdAt);
      if (isNaN(createdUTC)) return;

      const istTime = new Date(createdUTC.getTime() + istOffsetMinutes * 60 * 1000);
      const istDateStr = istTime.toISOString().slice(0, 10);

      const total = sale.items.reduce((sum, item) => {
        if (item.product?.price) {
          return sum + item.product.price * item.quantity;
        }
        return sum;
      }, 0);

      daily[istDateStr] = (daily[istDateStr] || 0) + total;
    });

    const result = Object.entries(daily).map(([date, total]) => ({
      date,
      total: total.toFixed(2),
    }));

    res.json(result);
  } catch (err) {
    console.error('Daily report error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const db = getDbForUser(req.user);
    const Sale = db.model('Sale', saleSchema);

    const sales = await Sale.find().populate('items.product');
    const monthly = {};
    const istOffset = 5.5 * 60 * 60 * 1000;

    sales.forEach(sale => {
      if (!sale.createdAt) return;
      const created = new Date(sale.createdAt);
      if (isNaN(created)) return;

      const istMonth = new Date(created.getTime() + istOffset)
        .toISOString()
        .slice(0, 7);

      const total = sale.items.reduce((sum, item) => {
        if (item.product?.price) {
          return sum + item.product.price * item.quantity;
        }
        return sum;
      }, 0);

      monthly[istMonth] = (monthly[istMonth] || 0) + total;
    });

    const result = Object.entries(monthly).map(([month, total]) => ({
      month,
      total: total.toFixed(2),
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching monthly report:', err);
    res.status(500).json({ message: 'Error fetching monthly report', error: err.message });
  }
};

