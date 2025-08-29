// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const { User, Student } = db;

// GET /students -> students associated with logged-in user
router.get("/", async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user" });

    const students = await user.getStudents({ order: [["id", "ASC"]] });
    res.json(students);
  } catch (err) {
    console.error("GET /students error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /students -> create student if missing OR associate existing to user
router.post("/", async (req, res) => {
  try {
    const { name, rollNumber, course, year } = req.body;
    if (!name || !rollNumber || !course || year === undefined) {
      return res.status(400).json({ error: "name, rollNumber, course, year required" });
    }

    // Ensure a canonical student row exists (unique by rollNumber)
    const [student, created] = await Student.findOrCreate({
      where: { rollNumber },
      defaults: { name, course, year: parseInt(year, 10) },
    });

    // Associate the student with the current user (if not already)
    const user = await User.findByPk(req.userId);
    const already = await user.hasStudent(student);
    if (!already) {
      await user.addStudent(student);
    }

    // Return the student object (201 if newly created, 200 if already existed)
    res.status(created ? 201 : 200).json(student);
  } catch (err) {
    console.error("POST /students error:", err);
    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map((e) => e.message);
      return res.status(400).json({ error: msgs.join("; ") });
    }
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Conflict: duplicate value" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /students/:id -> update student fields (only allowed if user is associated)
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, rollNumber, course, year } = req.body;

    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const user = await User.findByPk(req.userId);
    const has = await user.hasStudent(student);
    if (!has) return res.status(403).json({ error: "Not allowed to edit this student" });

    // If rollNumber changes, ensure it doesn't collide with another student
    if (rollNumber && rollNumber !== student.rollNumber) {
      const exists = await Student.findOne({ where: { rollNumber } });
      if (exists) {
        return res.status(409).json({ error: "rollNumber already exists for another student" });
      }
      student.rollNumber = rollNumber;
    }

    if (name !== undefined) student.name = name;
    if (course !== undefined) student.course = course;
    if (year !== undefined) student.year = parseInt(year, 10);

    await student.save();
    res.json(student);
  } catch (err) {
    console.error("PUT /students/:id error:", err);
    if (err.name === "SequelizeValidationError") {
      const msgs = err.errors.map((e) => e.message);
      return res.status(400).json({ error: msgs.join("; ") });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /students/:id -> remove association for current user; delete student row if no users remain
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const student = await Student.findByPk(id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const user = await User.findByPk(req.userId);
    const has = await user.hasStudent(student);
    if (!has) return res.status(403).json({ error: "Not allowed to remove this student" });

    // Remove only the association for this user
    await user.removeStudent(student);

    // If no other users are associated, delete the canonical student row
    const count = await student.countUsers();
    if (count === 0) {
      await student.destroy();
    }

    res.json({ message: "Student association removed" });
  } catch (err) {
    console.error("DELETE /students/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
