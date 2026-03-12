// Cafe.js — café profile created by owner
const mongoose = require('mongoose');
 
const cafeSchema = new mongoose.Schema({
 owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 name:     { type: String, required: true, trim: true },
 description: { type: String },
 address:  { type: String, required: true },
 phone:    { type: String },
 email:    { type: String },
 images:   [{ type: String }],          // Cloudinary URLs
 location: {                            // GeoJSON for map queries
   type:        { type: String, default: 'Point' },
   coordinates: [Number]                // [longitude, latitude]
 },
 openingHours: {                        // e.g. { monday: '08:00-22:00' }
   monday: String, tuesday: String, wednesday: String,
   thursday: String, friday: String, saturday: String, sunday: String
 },
 rating:      { type: Number, default: 0 },
 reviewCount: { type: Number, default: 0 },
 isVerified:  { type: Boolean, default: false }, // admin approves
 isActive:    { type: Boolean, default: true },
}, { timestamps: true });
 
cafeSchema.index({ location: '2dsphere' });  // required for $nearSphere
 
module.exports = mongoose.model('Cafe', cafeSchema);