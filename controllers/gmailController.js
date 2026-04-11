import { google } from "googleapis";
import { parseTransactionEmail } from "../utils/gmailParser.js";
import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";

const getOAuthClient = () => new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Step 1: Generate Google login URL
export function getGmailAuthUrl(req, res) {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state: req.user._id.toString(), // pass userId through OAuth flow
  });
  res.json({ success: true, url });
}

// Step 2: Handle OAuth callback, save tokens to user session
export async function gmailCallback(req, res) {
  const { code, state: userId } = req.query;
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens in memory keyed by userId (use DB in production)
  global.gmailTokens = global.gmailTokens || {};
  global.gmailTokens[userId] = tokens;

  // Redirect back to frontend
  res.redirect("http://localhost:5173/?gmail=connected");
}

// Step 3: Sync emails and save transactions
export async function syncGmailTransactions(req, res) {
  try {
    const userId = req.user._id.toString();
    global.gmailTokens = global.gmailTokens || {};
    const tokens = global.gmailTokens[userId];

    if (!tokens) {
      return res.json({ success: false, needsAuth: true });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch last 20 transaction emails
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
      q: "subject:(transaction OR debited OR credited OR payment) newer_than:30d",
    });

    const messages = listRes.data.messages || [];
    let added = 0;

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = detail.data.payload.headers;
      const subject = headers.find(h => h.name === "Subject")?.value || "";

      // Decode email body
      let body = "";
      const parts = detail.data.payload.parts || [detail.data.payload];
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
          break;
        }
      }

      const parsed = parseTransactionEmail(subject, body);
      if (!parsed) continue;

      // Check duplicate by amount + date (within same day)
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      if (parsed.type === "expense") {
        const exists = await expenseModel.findOne({
          userId: req.user._id,
          amount: parsed.amount,
          date: { $gte: dayStart },
        });
        if (!exists) {
          await expenseModel.create({ ...parsed, userId: req.user._id });
          added++;
        }
      } else {
        const exists = await incomeModel.findOne({
          userId: req.user._id,
          amount: parsed.amount,
          date: { $gte: dayStart },
        });
        if (!exists) {
          await incomeModel.create({ ...parsed, userId: req.user._id });
          added++;
        }
      }
    }

    res.json({ success: true, added, total: messages.length });
  } catch (err) {
    console.error("Gmail sync error:", err);
    res.status(500).json({ success: false, message: "Gmail sync failed" });
  }
}