
// FoodItem.js — a surplus item posted by a café
const mongoose = require('mongoose');
 
const foodItemSchema = new mongoose.Schema({
 cafe:         { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
 title:        { type: String, required: true },
 description:  { type: String },
 originalPrice: { type: Number, required: true },   // original selling price
 discountedPrice: { type: Number, required: true }, // surplus discount price
 quantity:     { type: Number, required: true, min: 0 },
 quantityLeft: { type: Number },                    // decreases as orders come in
 images:       [{ type: String }],
 category:     {
   type: String,
   enum: ['bakery','meals','drinks','desserts','snacks','other'],
   default: 'other'
 },
 pickupStart:  { type: Date, required: true },      // pickup window start
 pickupEnd:    { type: Date, required: true },      // pickup window end
 isAvailable:  { type: Boolean, default: true },    // owner can toggle off
 isSoldOut:    { type: Boolean, default: false },
 tags:         [{ type: String }],                  // e.g. ['vegan','gluten-free']
}, { timestamps: true });
 
module.exports = mongoose.model('FoodItem', foodItemSchema);