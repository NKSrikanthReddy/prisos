// User.js — stores both customers and café owners
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
 
const userSchema = new mongoose.Schema({
 name:        { type: String, required: true, trim: true },
 email:       { type: String, required: true, unique: true, lowercase: true },
 password:    { type: String },           // null for Google OAuth users
 phone:       { type: String },
 role:        { type: String, enum: ['customer','owner','admin'], default: 'customer' },
 googleId:    { type: String },            // for Google OAuth login
 fcmToken:    { type: String },            // Firebase push token
 avatar:      { type: String },            // Cloudinary URL
 location: {                               // customer's last known location
   type:  { type: String, default: 'Point' },
   coordinates: [Number]                  // [longitude, latitude]
 },
 isActive:    { type: Boolean, default: true },
 createdAt:   { type: Date, default: Date.now }
}, { timestamps: true });
 
// Hash password before saving
userSchema.pre('save', async function(next) {
 if (!this.isModified('password') || !this.password) return next();
 this.password = await bcrypt.hash(this.password, 12);
 next();
});
 
// Method to check password at login
userSchema.methods.matchPassword = async function(enteredPassword) {
 return await bcrypt.compare(enteredPassword, this.password);
};
 
// 2dsphere index allows geospatial queries (find nearby cafés)
userSchema.index({ location: '2dsphere' });
 
module.exports = mongoose.model('User', userSchema);