import mongoose from 'mongoose';
import { setUseMemoryStore } from '../models/User.js';

const connectDB = async () => {
  try {
    // Construct MongoDB URI
    const mongoUser = process.env.MONGO_USER || 'manishbaral';
    const mongoPass = process.env.MONGO_PASS || '1dIc0odKBV7ab3vX';
    const mongoCluster = process.env.MONGO_CLUSTER || 'cluster0.0hwxpms.mongodb.net';
    const mongoUri = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log(`Attempting to connect to MongoDB...`);
    
    // Connection options with pooling
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoUri, options);
    
    // Setup MongoDB connection event listeners
    mongoose.connection.on('connected', () => {
      console.log(`MongoDB connected to: ${conn.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    setUseMemoryStore(false);
    return true;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.warn('Falling back to in-memory data storage.');
    setUseMemoryStore(true);
    return false;
  }
};

export default connectDB; 