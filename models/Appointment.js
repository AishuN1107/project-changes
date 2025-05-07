const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  service: String,
  date: Date,
  time: String,
  status: { type: String, default: 'booked' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
