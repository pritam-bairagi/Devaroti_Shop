const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Get dashboard statistics
const getDashboardStats = async (startDate, endDate) => {
  try {
    const dailyStats = await Order.aggregate([
      { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'delivered'
        }},
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          revenue: { $sum: '$platformCommission' }
        }},
      { $sort: { _id: 1 } }
    ]);

    return dailyStats;
  } catch (error) {
    console.error('Analytics error:', error);
    return [];
  }
};

// Calculate revenue
const calculateRevenue = async (startDate, endDate) => {
  try {
    const result = await Order.aggregate([
      { $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'delivered'
        }},
      { $group: {
          _id: null,
          totalRevenue: { $sum: '$platformCommission' },
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }}
    ]);

    return result[0] || { totalRevenue: 0, totalSales: 0, orderCount: 0 };
  } catch (error) {
    console.error('Revenue calculation error:', error);
    return { totalRevenue: 0, totalSales: 0, orderCount: 0 };
  }
};

// Get top products
const getTopProducts = async (limit = 10) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }},
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }},
      { $unwind: '$product' }
    ]);

    return topProducts;
  } catch (error) {
    console.error('Top products error:', error);
    return [];
  }
};

module.exports = { getDashboardStats, calculateRevenue, getTopProducts };