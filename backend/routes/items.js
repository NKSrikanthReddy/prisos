// items.js — post/manage surplus food items
const express  = require('express');
const router   = express.Router();
const FoodItem = require('../models/FoodItem');
const Cafe     = require('../models/Cafe');
const notify   = require('../utils/notifications');
const { protect, authorize } = require('../middleware/auth');

// POST /api/items — owner posts a new surplus item
router.post('/', protect, authorize('owner'), async (req, res) => {
  try {
    const { cafeId, title, description, originalPrice,
            discountedPrice, quantity, category,
            pickupStart, pickupEnd, tags } = req.body;

    const cafe = await Cafe.findOne({ _id: cafeId, owner: req.user._id });
    if (!cafe) return res.status(403).json({ message: 'Not your café' });

    const item = await FoodItem.create({
      cafe: cafeId, title, description, originalPrice,
      discountedPrice, quantity, quantityLeft: quantity,
      category, pickupStart, pickupEnd, tags
    });

    // Send push notification to nearby customers
    notify.sendToNearbyUsers(cafe.location.coordinates, {
      title: `🟢 Prisos — ${cafe.name} just listed surplus food!`,
      body:  `${title} for only ₹${discountedPrice} — grab it fast!`,
      data:  { cafeId, itemId: item._id.toString() }
    });

    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/items/:id/sold-out — mark item as sold out
router.patch('/:id/sold-out', protect, authorize('owner'), async (req, res) => {
  try {
    const item = await FoodItem.findByIdAndUpdate(
      req.params.id, { isSoldOut: true, quantityLeft: 0 }, { new: true }
    );
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/items/cafe/:cafeId — all items for a café (owner view)
router.get('/cafe/:cafeId', protect, async (req, res) => {
  try {
    const items = await FoodItem.find({ cafe: req.params.cafeId })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
