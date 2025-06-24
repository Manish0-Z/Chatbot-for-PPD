import mongoose from 'mongoose';

const connectDB = async () => {
  // Fallback to a demo connection string if none is provided
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is not defined in your .env file. Using demo connection.');
    // This is a placeholder and won't actually connect to a real database
    process.env.MONGO_URI = 'mongodb://localhost:27017/momapp';
    
    console.log('=================================================================');
    console.log('WARNING: Using local MongoDB connection. Registration and login');
    console.log('functionality will be limited. Please set up a proper MongoDB');
    console.log('connection as described in MongoDB-Setup-Guide.md');
    console.log('=================================================================');
  }

  try {
    console.log(`Attempting to connect to MongoDB...`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Please ensure your MONGO_URI in the .env file is correct and your current IP address is whitelisted in MongoDB Atlas.');
    
    // Don't exit the process, allow the app to run with limited functionality
    console.log('=================================================================');
    console.log('WARNING: Running with limited functionality. User registration');
    console.log('and authentication features will not work properly.');
    console.log('=================================================================');
    
    return false;
  }
};

export default connectDB;