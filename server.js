// Load environment variables
import 'dotenv/config';

// Import dependencies
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatbotRoutes from './routes/chatbot.js';
import { exec } from 'child_process';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create Express app
const app = express();

// Set default environment variables if not provided
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not found in environment. Using default value (not secure for production)');
  process.env.JWT_SECRET = 'momapp_default_jwt_secret_key';
}

if (!process.env.JWT_EXPIRE) {
  console.warn('JWT_EXPIRE not found in environment. Using default value of 30 days');
  process.env.JWT_EXPIRE = '30d';
}

// Connect to MongoDB
connectDB();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit

// Serve static files from the public directory with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    index: 'home.html',  // Set the default file to home.html
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Basic route - Root path serves home.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Chat page route
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Home page route (alternative)
app.get('/home', (req, res) => {
    res.redirect('/');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Catch-all route for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Start server
const PORT = process.env.PORT || 8004;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the home page at: http://localhost:${PORT}`);
    console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGO_URI: process.env.MONGO_URI ? '********' : undefined
    });
});
