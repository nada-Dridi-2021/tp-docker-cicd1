import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with retry logic
const mongoURI = process.env.MONGO_URI || "mongodb://mongo:27017/devopsTp2";

const connectWithRetry = () => {
  console.log('Attempting MongoDB connection...');
  mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    })
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch((err) => {
      console.error("❌ Erreur MongoDB, retrying in 5 seconds...", err.message);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Exemple de modèle (collection "users")
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});
const User = mongoose.model("User", userSchema);

// Route test API
app.get("/api", (req, res) => {
  res.json({ message: "Hello from Backend + MongoDB!" });
});

// Route : afficher tous les utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Database connection error" });
  }
});

// Route : ajouter un utilisateur
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = new User({ name, email });
    await user.save();
    res.json({ message: "Utilisateur ajouté", user });
  } catch (error) {
    res.status(500).json({ error: "Database connection error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  const mongoState = mongoose.connection.readyState;
  if (mongoState === 1) {
    res.json({ status: "healthy", database: "connected" });
  } else {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port is the number ${PORT}`);
});
