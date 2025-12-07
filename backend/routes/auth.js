// Authentication Routes
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Google OAuth Login Route
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth Callback Route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin?error=auth_failed' }),
  async (req, res) => {
    try {
      // Create JWT token
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Set cookie with token
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with token in URL (alternative method)
      res.redirect(`/index.html?token=${token}&userId=${req.user._id}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/signin?error=callback_failed');
    }
  }
);

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout Route
router.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.clearCookie('connect.sid');
  res.json({ message: 'Logged out successfully' });
});

// User Profile Route
router.get('/profile', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update User Profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { preferences, metadata } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        $set: {
          preferences: preferences || undefined,
          metadata: metadata || undefined
        }
      },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add Game to Wishlist
router.post('/wishlist/add', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { gameId } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $addToSet: { wishlist: gameId } },
      { new: true }
    );

    res.json({ message: 'Game added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove Game from Wishlist
router.post('/wishlist/remove', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { gameId } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $pull: { wishlist: gameId } },
      { new: true }
    );

    res.json({ message: 'Game removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get User Wishlist
router.get('/wishlist', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('wishlist');

    res.json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
