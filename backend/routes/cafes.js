// cafes.js — create profile, find nearby cafés, get details
const express    = require('express');
const router     = express.Router();
const Cafe       = require('../models/Cafe');
const FoodItem   = require('../models/FoodItem');
const { protect, authorize } = require('../middleware/auth');

// GET /api/cafes/nearby?lat=12.9&lng=77.6&radius=5000
// Returns cafés within radius metres that have active surplus items
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    const cafes = await Cafe.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    }).limit(30);

    // Attach item count for each café
    const results = await Promise.all(cafes.map(async c => {
      const count = await FoodItem.countDocuments({
        cafe: c._id, isAvailable: true, isSoldOut: false,
        pickupEnd: { $gte: new Date() }    // still within pickup window
      });
      return { ...c.toObject(), activeItems: count };
    }));
    res.json(results.filter(c => c.activeItems > 0));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/cafes/:id — full café details + active items
router.get('/:id', async (req, res) => {
  try {
    const cafe  = await Cafe.findById(req.params.id).populate('owner','name email');
    if (!cafe) return res.status(404).json({ message: 'Café not found' });
    const items = await FoodItem.find({
      cafe: cafe._id, isAvailable: true, isSoldOut: false,
      pickupEnd: { $gte: new Date() }
    });
    res.json({ cafe, items });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/cafes — owner creates café profile
router.post('/', protect, authorize('owner','admin'), async (req, res) => {
  try {
    const { name, address, description, phone, lat, lng, openingHours } = req.body;
    const cafe = await Cafe.create({
      owner: req.user._id, name, address, description, phone, openingHours,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    });
    res.status(201).json(cafe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/cafes/:id — update café info
router.patch('/:id', protect, authorize('owner','admin'), async (req, res) => {
  try {
    const cafe = await Cafe.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body, { new: true }
    );
    if (!cafe) return res.status(404).json({ message: 'Not found or not owner' });
    res.json(cafe);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
