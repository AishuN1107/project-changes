const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const sendEmail = require('../utils/mailer');
const User = require('../models/user');


router.post('/book', async (req, res) => {
  const {
    userId, name, age, phone, gender, department,
    doctor, service, date, time
  } = req.body;
  const io = req.app.get('io');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }
  try {
    const appointment = await Appointment.create({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      age,
      phone,
      gender,
      department,
      doctor,
      service,
      date,
      time
    });

    const user = await User.findById(userId);
    await sendEmail(user.email, "Appointment Confirmation", `
      <h3>Your appointment is booked!</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Age:</strong> ${age}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Gender:</strong> ${gender}</p>
      <p><strong>Department:</strong> ${department}</p>
      <p><strong>Doctor:</strong> ${doctor}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
      <p><strong>Time:</strong> ${time}</p>
    `);

    io.emit('appointment:booked', appointment);
    res.status(201).json({ message: "Appointment booked and email sent." });
  } catch (e) {
    console.error("Booking error:", e);
    res.status(400).json({ error: "Error booking appointment." });
  }
});

router.post('/cancel/:id', async (req, res) => {
  const io = req.app.get('io');
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    const user = await User.findById(appointment.userId);

    await sendEmail(user.email, "Appointment Cancelled", `
      <h3>Your appointment has been cancelled.</h3>
      <p><strong>Service:</strong> ${appointment.service}</p>
    `);

    io.emit('appointment:cancelled', appointment);
    res.send('Appointment cancelled and email sent.');
  } catch {
    res.status(500).send('Error cancelling appointment');
  }
});

router.post('/reschedule/:id', async (req, res) => {
  const { newDate, newTime } = req.body;
  const io = req.app.get('io');
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, {
      date: newDate,
      time: newTime,
      status: 'rescheduled'
    });

    const user = await User.findById(appointment.userId);
    await sendEmail(user.email, "Appointment Rescheduled", `
      <h3>Your appointment has been rescheduled.</h3>
      <p><strong>New Date:</strong> ${new Date(newDate).toDateString()}</p>
      <p><strong>New Time:</strong> ${newTime}</p>
    `);

    io.emit('appointment:rescheduled', appointment);
    res.send('Appointment rescheduled and email sent.');
  } catch {
    res.status(500).send('Error rescheduling appointment');
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const appts = await Appointment.find({ userId: req.params.userId });
    res.json(appts);
  } catch (e) {
    res.status(500).send("Could not fetch appointments");
  }
});

router.get('/booked-times', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).send("Date required");

  try {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const bookedTimes = appointments.map(app => app.time);
    res.json(bookedTimes);
  } catch (e) {
    console.error("Fetch booked times error:", e);
    res.status(500).send("Could not fetch booked times");
  }
});

module.exports = router;
