// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  pickup: String,
  drop: String,
  dateTime: Date,
  passengers: Number,
  name: String,
  phone: String,
  email: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
