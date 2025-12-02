import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with enhanced retry logic
const mongoURI = process.env.MONGO_URI || "mongodb://mongo:27017/devopsTp2";

console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);

const connectWithRetry = (retries = 30, delay = 5000) => {
  console.log(`Attempting MongoDB connection (${retries} retries left)...`);
  
  mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip IPv6
      maxPoolSize: 10,
    })
    .then(() => {
      console.log("✅ Successfully connected to MongoDB");
      console.log(`Database: ${mongoose.connection.db.databaseName}`);
      console.log(`Host: ${mongoose.connection.host}`);
      console.log(`Port: ${mongoose.connection.port}`);
    })
    .catch((err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
      
      if (retries > 0) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error("❌ Max retries reached. Could not connect to MongoDB.");
        console.error("Please check if MongoDB container is running.");
        process.exit(1);
      }
    });
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Start connection
connectWithRetry();

// Exemple de modèle (collection "users")
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const User = mongoose.model("User", userSchema);

// Route test API
app.get("/api", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = dbStatus === 1 ? "connected" : "disconnected";
  
  res.json({ 
    message: "Hello from Backend + MongoDB!",
    database: statusText,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const mongoState = mongoose.connection.readyState;
  
  if (mongoState === 1) {
    res.status(200).json({ 
      status: "healthy", 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({ 
      status: "unhealthy", 
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

// Route : afficher tous les utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database connection error", details: error.message });
  }
});

// Route : ajouter un utilisateur
app.post("/api/users", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    
    const user = new User({ name, email });
    await user.save();
    res.status(201).json({ 
      message: "Utilisateur ajouté avec succès", 
      user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Failed to add user", details: error.message });
  }
});

// Route : tester la connexion à MongoDB
app.get("/api/test-db", async (req, res) => {
  try {
    // Test connection by running a simple query
    const count = await User.countDocuments();
    const dbInfo = {
      database: mongoose.connection.db.databaseName,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      connected: mongoose.connection.readyState === 1,
      userCount: count
    };
    
    res.json({ 
      message: "Database connection test successful",
      ...dbInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Database connection test failed",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});
