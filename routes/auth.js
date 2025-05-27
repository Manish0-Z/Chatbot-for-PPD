import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { memoryUsers, useMemoryStore } from '../models/User.js';

const router = express.Router();

// Set default JWT_SECRET if not defined in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mom_postpartum_care_secret_key_2024';

// Middleware to verify JWT token
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('Processing registration request');
    const { firstName, lastName, username, email, password, phoneNumber } = req.body;

    // Validate input
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if we're using memory store or MongoDB
    if (!useMemoryStore) {
      console.log('Using MongoDB for user registration');
      try {
        // MongoDB flow - check if user exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Create new user
        const user = new User({
          firstName,
          lastName,
          username,
          email,
          password,
          phoneNumber,
          profilePicture: '/images/profiles/default-profile.png'
        });

        // Save user to database
        await user.save();

        // Create JWT payload
        const payload = {
          user: {
            id: user.id
          }
        };

        // Sign token
        jwt.sign(
          payload,
          JWT_SECRET,
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            res.status(201).json({
              success: true,
              token,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                profilePicture: user.profilePicture
              }
            });
          }
        );
      } catch (err) {
        console.error('MongoDB registration error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error. Using fallback.' });
      }
    } else {
      // In-memory fallback flow
      console.log('Using in-memory user store for registration');
      
      // Check if user exists
      const existingEmail = memoryUsers.find(u => u.email === email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }

      const existingUsername = memoryUsers.find(u => u.username === username);
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user with id
      const userId = 'mem_' + Date.now().toString();
      const user = {
        id: userId,
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        profilePicture: '/images/profiles/default-profile.png',
        createdAt: new Date()
      };

      // Save to in-memory store
      memoryUsers.push(user);
      console.log(`User saved to in-memory store: ${user.email}`);

      // Create JWT payload
      const payload = {
        user: {
          id: userId
        }
      };

      // Sign token
      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.status(201).json({
            success: true,
            token,
            user: {
              id: userId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              username: user.username,
              profilePicture: user.profilePicture
            }
          });
        }
      );
    }
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check if we're using memory store or MongoDB
    if (!useMemoryStore) {
      try {
        // MongoDB flow
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
          user: {
            id: user.id
          }
        };

        // Sign token
        jwt.sign(
          payload,
          JWT_SECRET,
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            res.json({
              success: true,
              token,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                profilePicture: user.profilePicture
              }
            });
          }
        );
      } catch (err) {
        console.error('MongoDB login error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
      }
    } else {
      // In-memory fallback flow
      console.log('Using in-memory user store for login');
      
      // Find user by email
      const user = memoryUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({
            success: true,
            token,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              username: user.username,
              profilePicture: user.profilePicture
            }
          });
        }
      );
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/user
// @desc    Get logged in user data
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    if (!useMemoryStore) {
      try {
        // MongoDB flow
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
      } catch (err) {
        console.error('MongoDB get user error:', err.message);
        return res.status(500).json({ success: false, message: 'Database error. Try again later.' });
      }
    } else {
      // In-memory fallback flow
      console.log('Using in-memory user store for user lookup');
      
      // Find user by id
      const user = memoryUsers.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    }
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 