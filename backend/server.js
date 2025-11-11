import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/devopsTp2";
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

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
  const users = await User.find();
  res.json(users);
});

// Route : ajouter un utilisateur
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  const user = new User({ name, email });
  await user.save();
  res.json({ message: "Utilisateur ajouté", user });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

