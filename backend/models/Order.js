// Order.js — customer's reservation/purchase
const mongoose = require('mongoose');
 
const orderSchema = new mongoose.Schema({
 customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 cafe:      { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
 items: [{
   foodItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
   title:     String,        // snapshot so history is preserved even if item deleted
   price:     Number,
   quantity:  Number,
 }],
 totalAmount: { type: Number, required: true },
 status: {
   type: String,
   enum: ['pending','confirmed','ready','pickedUp','cancelled'],
   default: 'pending'
 },
 paymentStatus:  { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
 paymentMethod:  { type: String, enum: ['card','upi','cash'], default: 'card' },
 stripePaymentId: { type: String },    // Stripe payment intent ID
 pickupCode:  { type: String },        // 4-digit code customer shows at café
 pickedUpAt:  { type: Date },
 cancelledAt: { type: Date },
 cancelReason: { type: String },
}, { timestamps: true });
 
module.exports = mongoose.model('Order', orderSchema);