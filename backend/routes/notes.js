import express from "express";
import { NOTES } from "../data/notesData.js";

const router = express.Router();

// GET /api/notes — returns the flat list of semesters with Drive links
router.get("/notes", (req, res) => {
  res.json({ notes: NOTES });
});

export default router;