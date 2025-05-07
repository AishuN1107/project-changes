const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const newUser = await User.create({ name, email, password: hashed }); //validated by Gayathri
    res.status(201).json({ message: 'User created' });
  } catch (e) {
    res.status(400).json({ error: 'User already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Wrong password' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, userId: user._id, message: 'Login successful' });
});
// // Get User Profile
// router.get('/user/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select("name email");
//     res.json(user);
//   } catch (e) {
//     res.status(404).json({ error: "User not found" });
//   }
// });


module.exports = router;
