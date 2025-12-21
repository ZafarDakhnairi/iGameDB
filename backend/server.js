// Main Express Server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();

// Data file paths
const usersFile = path.join(__dirname, 'data', 'users.json');
const wishlistFile = path.join(__dirname, 'data', 'wishlist.json');

// Initialize data files if they don't exist
function initializeDataFiles() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(wishlistFile)) {
        fs.writeFileSync(wishlistFile, JSON.stringify([], null, 2));
    }
}

// Helper function to read users
function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write users
function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Helper function to read wishlist
function readWishlist() {
    try {
        const data = fs.readFileSync(wishlistFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write wishlist
function writeWishlist(wishlist) {
    fs.writeFileSync(wishlistFile, JSON.stringify(wishlist, null, 2));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5500',
    'file://'
  ],
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

// ===== SIGNUP ROUTE =====
app.post('/signup', (req, res) => {
    try {
        const { username, email, password, gender, platforms, terms } = req.body;

        // Validation
        if (!username || !email || !password || !gender || !platforms || !terms) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Read existing users
        const users = readUsers();

        // Check if email already exists
        const existingEmail = users.find(user => user.email === email);
        if (existingEmail) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Check if username already exists
        const existingUsername = users.find(user => user.username === username);
        if (existingUsername) {
            return res.status(409).json({ 
                success: false, 
                message: 'Username already taken' 
            });
        }

        // Create new user (in real app, hash password)
        const newUser = {
            id: Date.now(),
            username,
            email,
            password, // WARNING: NEVER store plain passwords in production!
            gender,
            platforms: Array.isArray(platforms) ? platforms : [platforms],
            terms,
            createdAt: new Date().toISOString()
        };

        // Add user to array
        users.push(newUser);

        // Write back to file
        writeUsers(users);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ===== LOGIN ROUTE =====
app.post('/login', (req, res) => {
    try {
        const { login, password } = req.body;

        // Validation
        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/Username and password are required'
            });
        }

        // Read users
        const users = readUsers();

        // Find user by email OR username
        const user = users.find(u => u.email === login || u.username === login);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/username or password'
            });
        }

        // Check password (in real app, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/username or password'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ===== WISHLIST ROUTE =====
app.post('/wishlist', (req, res) => {
    try {
        const { gameTitle, platform, genre, reason, userId } = req.body;

        // Validation
        if (!gameTitle || !platform || !genre || !reason || !userId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Read wishlist
        const wishlist = readWishlist();

        // Create new wishlist entry
        const newEntry = {
            id: Date.now(),
            userId,
            gameTitle,
            platform,
            genre: Array.isArray(genre) ? genre : [genre],
            reason,
            dateAdded: new Date().toISOString()
        };

        // Add to wishlist
        wishlist.push(newEntry);

        // Write back to file
        writeWishlist(wishlist);

        return res.status(201).json({
            success: true,
            message: 'Game added to wishlist successfully',
            entry: newEntry
        });
    } catch (error) {
        console.error('Wishlist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ===== GET WISHLIST ROUTE =====
app.get('/wishlist/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const wishlist = readWishlist();
        const userWishlist = wishlist.filter(item => item.userId === parseInt(userId));
        return res.status(200).json({
            success: true,
            data: userWishlist
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/auth', authRoutes);

// ===== HEALTH CHECK ROUTE =====
app.get('/health', (req, res) => {
    return res.status(200).json({ 
        success: true, 
        message: 'iGameDB API is running' 
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// MongoDB Connection
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/igamedb';

// Initialize data files
initializeDataFiles();

mongoose.connect(mongoUrl, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.warn('⚠️  MongoDB connection warning (running without database):', err.message);
    console.warn('Note: User registration/wishlist will not work without MongoDB');
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
    ====================================
       iGameDB Backend Server Running
    ====================================
    Server: http://localhost:${PORT}
    Health Check: http://localhost:${PORT}/health
    
    Available Endpoints:
    - POST /signup     - Create new account
    - POST /login      - Login user
    - POST /wishlist   - Add game to wishlist
    - GET /wishlist/:userId - Get wishlist entries
    ====================================
    `);
  console.log(`📦 MongoDB URL: ${mongoUrl}`);
  console.log(`🔐 Google OAuth requires: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⛔ Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});
