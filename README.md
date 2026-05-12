# 💸 MonIO — Personal Finance Tracker

> Track your income, expenses, and savings — with Gmail sync, AI insights, and PDF reports — all in one place.

---

## What is MonIO?

A full-stack personal finance tracker. Log your income and expenses, sync transactions automatically from your bank emails via Gmail, get AI-powered spending insights from Gemini, and download beautifully styled PDF reports — all on a clean, responsive dashboard.

---

## System Architecture
![SystemArchitecture](frontend/public/systemarchi.png)

## Live Demo
https://monio-backend-5lzg.onrender.com

## Screenshots

### Dashboard
![Dashboard](frontend\public\dashboard.png)

### Expense Report (PDF)
![PDF Report](frontend\public\exportreport.png)

---

## Features

**📊 Dashboard**
- Total balance, monthly income, expenses & savings rate cards
- Gauge charts for income, spending and savings
- Expense distribution pie chart
- Recent transactions feed
- Spending by category breakdown

**💰 Transactions**
- Add, edit, delete income and expense entries
- Filter by Daily / Weekly / Monthly timeframe
- Category-wise breakdown with icons
- Export transactions to CSV/XLSX

**📧 Gmail Sync**
- Connect Gmail via Google OAuth 2.0
- Auto-import bank transaction emails (HDFC, ICICI, SBI, UPI apps)
- Smart parser detects amount, merchant, and category
- Duplicate detection to avoid double entries

**🤖 AI Insights**
- Pre-filled Gemini AI prompt with your financial data
- Get spending pattern insights and budget recommendations
- Opens directly in Gemini chat — no API quota issues

**📄 PDF Report**
- Download current month's expense report
- Includes summary cards, insights, category breakdown, and transaction table
- Beautifully styled with teal color theme

**🔐 Authentication**
- JWT-based secure login and signup
- Remember me with localStorage / sessionStorage
- Protected routes

**🆘 Support**
- FAQ page with accordion-style questions
- Search across all FAQs
- Covers Gmail sync, PDF, AI insights, transactions, and account

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7, Tailwind CSS v4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas via Mongoose |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| PDF | PDFKit |
| Gmail | Google APIs (OAuth 2.0) |
| AI | Gemini AI (Google Generative Language API) |
| Deployment | Render (fullstack) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/register` | Register a new user |
| POST | `/api/user/login` | Login user |
| GET | `/api/user/me` | Get current user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/password` | Change password |
| GET/POST | `/api/income/get` | List or add income |
| PUT/DELETE | `/api/income/update/:id` | Update or delete income |
| GET/POST | `/api/expense/get` | List or add expense |
| PUT/DELETE | `/api/expense/update/:id` | Update or delete expense |
| GET | `/api/dashboard` | Dashboard overview stats |
| GET | `/api/dashboard/download-report` | Download PDF report |
| GET | `/api/gmail/auth-url` | Get Gmail OAuth URL |
| GET | `/api/gmail/callback` | Gmail OAuth callback |
| GET | `/api/gmail/sync` | Sync Gmail transactions |
| GET | `/api/ai/insights` | Get Gemini AI insights |

---

## Gmail Sync — Supported Banks

| Bank / App | Email Pattern |
|---|---|
| HDFC Bank | `alerts@hdfcbank.net` |
| ICICI Bank | `alerts@icicibank.com` |
| SBI | `sbiatm@sbi.co.in` |
| GPay / PhonePe / Paytm | UPI transaction alerts |
| Any bank | Emails containing "debited", "credited", "payment" |

---

## Deployment

### Render (Fullstack — Frontend + Backend together)
1. Push repo to GitHub
2. New Web Service → Connect `monio-backend` repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables (see below)
6. Frontend `dist` folder is served statically from Express

---

## Cover Art / External APIs

| Feature | API | Key Required |
|---|---|---|
| Gmail Sync | Google Gmail API | Yes (OAuth 2.0) |
| AI Insights | Gemini Generative Language API | Yes (free tier) |
| PDF Reports | PDFKit (local) | No |

---

## License

MIT — free to use, modify, and deploy.
