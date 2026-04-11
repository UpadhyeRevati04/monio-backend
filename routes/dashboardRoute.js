import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getDashboardOverview,
  downloadExpenseReport,   
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", authMiddleware, getDashboardOverview);
router.get("/download-report", authMiddleware, downloadExpenseReport);  // ← add this

export default router;