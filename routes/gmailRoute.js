import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getGmailAuthUrl,
  gmailCallback,
  syncGmailTransactions,
} from "../controllers/gmailController.js";

const router = express.Router();

router.get("/auth-url", authMiddleware, getGmailAuthUrl);
router.get("/callback", gmailCallback);        // no auth — Google redirects here
router.get("/sync", authMiddleware, syncGmailTransactions);

export default router;