import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ========== ROUTES (define these BEFORE connection attempts) ==========

// Root route
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

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  if (dbStatus === 1) {
    res.json({ status: 'healthy', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API test
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// ========== MONGODB CONNECTION ==========

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/devopsTp2";

console.log(`🔗 MongoDB URI: ${mongoURI}`);

// Try multiple connection strategies
const connectToMongoDB = async () => {
  const connectionOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4 only
  };

  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Try primary connection
    await mongoose.connect(mongoURI, connectionOptions);
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Primary connection failed: ${error.message}`);
    
    // Try alternative connection methods
    const alternativeURIs = [
      "mongodb://host.docker.internal:27017/devopsTp2",
      "mongodb://172.17.0.1:27017/devopsTp2",
      "mongodb://localhost:27017/devopsTp2"
    ];
    
    for (const altURI of alternativeURIs) {
      try {
        console.log(`🔄 Trying alternative: ${altURI}`);
        await mongoose.connect(altURI, connectionOptions);
        console.log(`✅ Connected via alternative: ${altURI}`);
        return true;
      } catch (altError) {
        console.log(`❌ Alternative failed: ${altError.message}`);
      }
    }
    
    throw error;
  }
};

// Start connection with retries
const startWithRetries = async (maxRetries = 10, delay = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connectToMongoDB();
      return; // Success!
    } catch (error) {
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('🚨 Max retries reached. Starting server without database.');
      }
    }
  }
};

// Initialize connection
startWithRetries().then(() => {
  console.log('✅ MongoDB initialization completed');
}).catch(err => {
  console.error('❌ MongoDB initialization failed:', err);
});

// ========== DATABASE MODELS AND ROUTES ==========

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Users routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Home page: http://localhost:${PORT}/`);
});
