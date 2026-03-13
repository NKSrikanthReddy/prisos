// orders.js — place, confirm, pickup orders
const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const { protect, authorize } = require('../middleware/auth');

// POST /api/orders — customer places an order
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const { cafeId, items } = req.body;
    // items = [{ foodItemId, quantity }]

    let totalAmount = 0;
    const orderItems = [];

    for (const entry of items) {
      const food = await FoodItem.findById(entry.foodItemId);
      if (!food || food.isSoldOut || food.quantityLeft < entry.quantity)
        return res.status(400).json({ message: `${food?.title || 'Item'} not available` });

      // Reduce available quantity atomically
      await FoodItem.findByIdAndUpdate(entry.foodItemId, {
        $inc: { quantityLeft: -entry.quantity }
      });

      totalAmount += food.discountedPrice * entry.quantity;
      orderItems.push({ foodItem: food._id, title: food.title,
                        price: food.discountedPrice, quantity: entry.quantity });
    }

    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const order = await Order.create({
      customer: req.user._id, cafe: cafeId,
      items: orderItems, totalAmount, pickupCode
    });

    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/my — customer's order history
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('cafe', 'name address images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/cafe/:cafeId — owner sees orders for their café
router.get('/cafe/:cafeId', protect, authorize('owner','admin'), async (req, res) => {
  try {
    const orders = await Order.find({ cafe: req.params.cafeId, status: { $ne: 'cancelled' } })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/orders/:id/status — owner updates order status
router.patch('/:id/status', protect, authorize('owner','admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status,
        ...(req.body.status === 'pickedUp' && { pickedUpAt: new Date() }) },
      { new: true }
    );
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
