// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    if (username.length < 3 || password.length < 4) return res.status(400).json({ error: "username/password too short" });

    const exists = await User.findOne({ where: { username } });
    if (exists) return res.status(400).json({ error: "username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash: hash });

    // Auto-login: return token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "3h" });
    res.status(201).json({ token, username: user.username });
  } catch (e) {
    console.error("REGISTER error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: "Invalid username or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "3h" });
    res.json({ token, username: user.username });
  } catch (e) {
    console.error("LOGIN error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
