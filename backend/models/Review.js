// Review.js — customer reviews a café after pickup
const mongoose = require('mongoose');
 
const reviewSchema = new mongoose.Schema({
 cafe:     { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
 customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
 rating:   { type: Number, required: true, min: 1, max: 5 },
 comment:  { type: String, trim: true },
 images:   [{ type: String }],
}, { timestamps: true });
 
// One review per order
reviewSchema.index({ order: 1 }, { unique: true });
 
// After saving, recalculate café's average rating
reviewSchema.post('save', async function() {
 const Cafe   = mongoose.model('Cafe');
 const Review = this.constructor;
 const stats  = await Review.aggregate([
   { $match: { cafe: this.cafe } },
   { $group: { _id: '$cafe', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
 ]);
 if (stats.length > 0) {
   await Cafe.findByIdAndUpdate(this.cafe, {
     rating: Math.round(stats[0].avgRating * 10) / 10,
     reviewCount: stats[0].count
   });
 }
});
 
module.exports = mongoose.model('Review', reviewSchema);