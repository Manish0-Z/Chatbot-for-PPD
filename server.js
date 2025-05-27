import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import chatbotRoutes from './routes/chatbot.js';
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Define routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/auth', authRoutes);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Specific routes for HTML pages
app.get('/medical-assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'medical-assistant.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Handle production setup
if (process.env.NODE_ENV === 'production') {
  // Serve any static files in the public directory
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Handle SPA routing - send all requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Set port and start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 