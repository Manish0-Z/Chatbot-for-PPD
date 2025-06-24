import jwt from 'jsonwebtoken';
// Use the MongoDB User model
import User from '../models/User.js';
import mongoose from 'mongoose';

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if auth header exists and has the correct format
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Alternative: check for token in cookies
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'mock_jwt_secret'
      );

      // Check if this is a temporary mock user (ID starts with 'temp_')
      if (decoded.id && decoded.id.toString().startsWith('temp_')) {
        // Create a mock user object from the token data
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          name: decoded.name || 'User',
          email: decoded.email || 'user@example.com',
          role: 'user'
        };
        
        console.log('Using mock user from token:', req.user.email);
        return next();
      }
      
      // Regular flow: Add user from database if MongoDB is connected
      if (mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id);
          
          if (!req.user) {
            return res.status(401).json({
              success: false,
              message: 'User no longer exists'
            });
          }
        } catch (dbError) {
          console.error('Database error in auth middleware:', dbError);
          // Fall back to mock user if database query fails
          req.user = {
            _id: decoded.id,
            id: decoded.id,
            name: decoded.name || 'User',
            email: decoded.email || 'user@example.com',
            role: 'user'
          };
          console.log('Falling back to token data due to DB error');
        }
      } else {
        // MongoDB not connected, use token data
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          name: decoded.name || 'User',
          email: decoded.email || 'user@example.com',
          role: 'user'
        };
        console.log('MongoDB not connected, using token data');
      }
      
      next();
    } catch (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user has required role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'unknown'}' is not authorized to access this route`
      });
    }
    next();
  };
}; 