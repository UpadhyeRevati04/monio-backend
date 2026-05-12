import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';
import gmailRouter from './routes/gmailRoute.js';
import geminiRouter from './routes/geminiRoute.js';

const app = express();
const port = process.env.PORT || 4000;

// MIDDLEWARES
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB
connectDB();

// ROUTES
app.use("/api/user", userRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/gmail", gmailRouter);
app.use("/api/ai", geminiRouter);

app.get('/', (req, res) => {
    res.send("API WORKING");
});
// Keep Render alive — ping every 14 minutes

// Serve frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
});

const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
setInterval(async () => {
  try {
    await fetch(`${BACKEND_URL}/`);
    console.log("Keep-alive ping sent");
  } catch (err) {
    console.log("Keep-alive ping failed:", err.message);
  }
}, 14 * 60 * 1000); // every 14 minutes