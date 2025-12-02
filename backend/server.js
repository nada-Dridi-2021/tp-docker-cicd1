import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ========== ROUTES ==========

app.get('/', (req, res) => {
  res.json({
    message: 'DevOps TP2 API is running',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      api: '/api',
      health: '/health',
      users: '/api/users',
      testDb: '/api/test-db'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  if (dbStatus === 1) {
    res.json({ status: 'healthy', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// ========== MONGODB CONNECTION ==========

const getMongoURI = () => {
  // Production (Render) - use environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.MONGO_URI;
  }
  // Development - use local MongoDB
  return "mongodb://localhost:27017/devopsTp2";
};

const mongoURI = getMongoURI();

console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📡 MongoDB URI configured: ${mongoURI ? 'Yes' : 'No'}`);

// Simple connection without retry logic for production
const connectToMongoDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, connectionOptions);
    console.log('✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // In production, don't try localhost alternatives
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Running without database in production mode');
      throw error;
    }
    
    // Only in development, try local alternatives
    console.log('🔄 Trying localhost connection for development...');
    try {
      await mongoose.connect("mongodb://localhost:27017/devopsTp2", {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ Connected to local MongoDB');
    } catch (localError) {
      console.error('❌ Local connection also failed:', localError.message);
      throw error;
    }
  }
};

// Connect to MongoDB
connectToMongoDB().catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  console.log('🚀 Starting server anyway...');
});

// ========== DATABASE MODELS AND ROUTES ==========

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Users routes with error handling
app.get('/api/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not available',
        connected: false 
      });
    }
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not available',
        connected: false 
      });
    }
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        connected: false,
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      });
    }
    const count = await User.countDocuments();
    res.json({
      connected: true,
      message: 'Database is working',
      userCount: count
    });
  } catch (error) {
    res.json({
      connected: false,
      message: error.message
    });
  }
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: /health`);
  console.log(`🏠 Home page: /`);
});
