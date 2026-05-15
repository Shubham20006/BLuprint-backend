const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { getModel } = require('../models/GenericModel');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const User = getModel('users');
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return only safe user info
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    };
    res.json({
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});
// Google Login
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const User = getModel('users');
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No user found with this email. Please register first.' });
    }
    // Update avatar if needed
    if (picture && !user.avatar) {
      user.avatar = picture;
      await user.save();
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    // Return only safe user info
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    };
    res.json({
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

module.exports = router;
