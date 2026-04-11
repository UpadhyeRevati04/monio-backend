import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAIInsights } from "../controllers/geminiController.js";

const router = express.Router();
router.get("/insights", authMiddleware, getAIInsights);

export default router;