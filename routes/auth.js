const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.send('Username already exists');
  }

  // Save password as-is (PLAIN TEXT)
  const user = new User({ username, password });
  await user.save();

  req.session.userId = user._id;
  res.redirect('/chat');
});

// Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || user.password !== password) {
    return res.send('Invalid username or password');
  }

  req.session.userId = user._id;
  res.redirect('/chat');
});

module.exports = router;
