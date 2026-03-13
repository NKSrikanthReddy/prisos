// admin.js — admin panel + café analytics
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Cafe    = require('../models/Cafe');
const Order   = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// GET /api/admin/stats — platform-wide totals (admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  const [users, cafes, orders] = await Promise.all([
    User.countDocuments(),
    Cafe.countDocuments(),
    Order.countDocuments({ status: 'pickedUp' })
  ]);
  const revenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  res.json({ users, cafes, completedOrders: orders,
             totalRevenue: revenue[0]?.total || 0 });
});

// GET /api/admin/cafes/:cafeId/analytics — owner analytics
router.get('/cafes/:cafeId/analytics', protect, authorize('owner','admin'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const orders = await Order.find({
      cafe: req.params.cafeId,
      status: 'pickedUp',
      pickedUpAt: { $gte: today }
    });
    const todaySales  = orders.reduce((s, o) => s + o.totalAmount, 0);
    const itemsSold   = orders.reduce((s, o) =>
      s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
    res.json({ todaySales, itemsSold, orderCount: orders.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
