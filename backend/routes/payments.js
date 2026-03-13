// payments.js — Stripe payment intents
const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

// POST /api/payments/intent — create Stripe payment intent
// Mobile app calls this, receives clientSecret, then confirms on device
router.post('/intent', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(order.totalAmount * 100),  // Stripe uses smallest currency unit
      currency: 'inr',
      metadata: { orderId: orderId.toString() }
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/payments/webhook — Stripe calls this when payment succeeds
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig   = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === 'payment_intent.succeeded') {
    const { orderId } = event.data.object.metadata;
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid', status: 'confirmed',
      stripePaymentId: event.data.object.id
    });
  }
  res.json({ received: true });
});

module.exports = router;
