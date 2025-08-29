// index.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();
const db = require("./models");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Public routes
app.use("/auth", authRoutes);

// Protected student routes (require token)
app.use("/students", authMiddleware, studentRoutes);

// Serve login by default
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Start server + sync DB
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ MySQL connection OK");
    await db.sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    // Seed an admin user if not present
    const admin = await db.User.findOne({ where: { username: "admin" } });
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.User.create({ username: "admin", passwordHash: hash });
      console.log("👤 Seeded user: username=admin password=admin123");
    }

    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
