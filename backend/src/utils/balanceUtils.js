const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

/**
 * Recalculates and updates a seller's balance fields (cashBox, totalEarnings, etc.)
 * based on their delivered orders and withdrawal history.
 * @param {string} sellerId - The ID of the seller to sync
 * @returns {Promise<object>} - The updated user object
 */
const syncSellerBalance = async (sellerId) => {
  try {
    const sId = new mongoose.Types.ObjectId(sellerId);

    // 1. Calculate Lifetime Earnings from Delivered Orders
    const earningsResult = await Order.aggregate([
      { 
        $match: { 
          'sellers.sellerId': sId, 
          status: 'delivered', 
          paymentStatus: 'paid' 
        } 
      },
      { $unwind: '$sellers' },
      { $match: { 'sellers.sellerId': sId } },
      { $group: { _id: null, total: { $sum: '$sellers.sellerEarnings' } } }
    ]);

    const totalEarnings = earningsResult[0]?.total || 0;

    // 2. Calculate Completed Withdrawals (Cash Out)
    const withdrawalsResult = await Transaction.aggregate([
      { 
        $match: { 
          user: sId, 
          category: 'withdrawals', 
          status: 'completed',
          type: 'Cash Out'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawn = withdrawalsResult[0]?.total || 0;

    // 3. Calculate Pending Withdrawals
    const pendingResult = await Transaction.aggregate([
      { 
        $match: { 
          user: sId, 
          category: 'withdrawals', 
          status: 'pending',
          type: 'Cash Out'
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingWithdrawals = pendingResult[0]?.total || 0;

    // 4. Calculate Current Cash Box
    // cashBox = Total Earnings - (Both Completed and Pending Withdrawals)
    // because pending withdrawals are already deducted from cashBox at the time of request
    const cashBox = Math.max(0, totalEarnings - totalWithdrawn - pendingWithdrawals);

    // 5. Update User Document
    const user = await User.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          totalEarnings: totalEarnings,
          cashBox: cashBox,
          pendingWithdrawals: pendingWithdrawals,
          totalWithdrawn: totalWithdrawn
        }
      },
      { new: true }
    );

    console.log(`Synced balance for seller ${sellerId}: Earnings=${totalEarnings}, CashBox=${cashBox}, Pending=${pendingWithdrawals}`);
    
    return user;
  } catch (error) {
    console.error(`Error syncing balance for seller ${sellerId}:`, error);
    throw error;
  }
};

module.exports = { syncSellerBalance };
