// Utility for generating beautifully styled PDF reports
import PDFDocument from "pdfkit";

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  teal:       "#0d9488",
  tealLight:  "#ccfbf1",
  tealDark:   "#0f766e",
  orange:     "#f97316",
  orangeLight:"#fff7ed",
  red:        "#ef4444",
  redLight:   "#fef2f2",
  green:      "#22c55e",
  greenLight: "#f0fdf4",
  gray900:    "#111827",
  gray700:    "#374151",
  gray500:    "#6b7280",
  gray300:    "#d1d5db",
  gray100:    "#f3f4f6",
  white:      "#ffffff",
  yellow:     "#eab308",
  yellowLight:"#fefce8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return String(d).slice(0, 10); }
}

function fmtAmount(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function setFill(doc, hex) {
  doc.fillColor(hexToRgb(hex));
}

function setStroke(doc, hex) {
  doc.strokeColor(hexToRgb(hex));
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function filledRect(doc, x, y, w, h, hex, radius = 0) {
  setFill(doc, hex);
  if (radius > 0) {
    doc.roundedRect(x, y, w, h, radius).fill();
  } else {
    doc.rect(x, y, w, h).fill();
  }
}

function drawHRule(doc, x, y, w, hex = COLORS.gray300, thickness = 0.5) {
  setStroke(doc, hex);
  doc.lineWidth(thickness).moveTo(x, y).lineTo(x + w, y).stroke();
}

// ─── Page constants ───────────────────────────────────────────────────────────
const PAGE_W   = 595.28;
const PAGE_H   = 841.89;
const MARGIN   = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Section: Header Banner ───────────────────────────────────────────────────
function drawHeader(doc, user) {
  // Teal banner
  filledRect(doc, 0, 0, PAGE_W, 110, COLORS.teal);

  // App name / logo area
  setFill(doc, COLORS.white);
    doc.font("Helvetica-Bold").fontSize(26)
      .text("Monio", MARGIN, 28, { lineBreak: false });

  // Subtitle
  setFill(doc, COLORS.tealLight);
    doc.font("Helvetica").fontSize(11)
      .text("Finance Tracker", MARGIN, 58, { lineBreak: false });

  // Report date — right side
  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  setFill(doc, COLORS.white);
  doc.font("Helvetica").fontSize(10)
     .text(reportDate, PAGE_W - MARGIN - 140, 28, { width: 140, align: "right", lineBreak: false });

  // User name
  const userName = user.name || user.email || "User";
  doc.font("Helvetica-Bold").fontSize(10)
     .text(userName, PAGE_W - MARGIN - 140, 44, { width: 140, align: "right", lineBreak: false });

  doc.y = 130;
}

// ─── Section: Summary Cards (3 boxes in a row) ───────────────────────────────
function drawSummaryCards(doc, { totalExpense, totalIncome, savings, savingsRate, txCount }) {
  const cardW = (CONTENT_W - 20) / 3;
  const cardH = 72;
  const y = doc.y;

  const cards = [
    {
      label: "Total Income",
      value: fmtAmount(totalIncome),
      color: COLORS.green,
      bg: COLORS.greenLight,
    },
    {
      label: "Total Expenses",
      value: fmtAmount(totalExpense),
      color: COLORS.orange,
      bg: COLORS.orangeLight,
    },
    {
      label: "Net Savings",
      value: fmtAmount(savings),
      sub: `${savingsRate}% savings rate`,
      color: savings >= 0 ? COLORS.teal : COLORS.red,
      bg: savings >= 0 ? COLORS.tealLight : COLORS.redLight,
    },
  ];

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardW + 10);

    // Card background
    filledRect(doc, x, y, cardW, cardH, card.bg, 8);

    // Left color bar
    filledRect(doc, x, y, 4, cardH, card.color, 2);

    // Label
    setFill(doc, COLORS.gray500);
    doc.font("Helvetica").fontSize(9)
       .text(card.label, x + 12, y + 12, { width: cardW - 16, lineBreak: false });

    // Value
    setFill(doc, card.color);
    doc.font("Helvetica-Bold").fontSize(18)
       .text(card.value, x + 12, y + 26, { width: cardW - 16, lineBreak: false });

    // Sub
    if (card.sub) {
      setFill(doc, COLORS.gray500);
      doc.font("Helvetica").fontSize(8)
         .text(card.sub, x + 12, y + 52, { width: cardW - 16, lineBreak: false });
    }
  });

  doc.y = y + cardH + 20;

  // Transactions count pill
  filledRect(doc, MARGIN, doc.y, 140, 22, COLORS.gray100, 6);
  setFill(doc, COLORS.gray700);
  doc.font("Helvetica").fontSize(9)
     .text(`${txCount} transactions this month`, MARGIN + 8, doc.y + 6, { lineBreak: false });

  doc.y += 32;
}

// ─── Section: Insights ────────────────────────────────────────────────────────
function drawInsights(doc, insights) {
  if (!insights || insights.length === 0) return;

  // Section title
  setFill(doc, COLORS.gray900);
  doc.font("Helvetica-Bold").fontSize(13)
     .text("AI Insights & Anomaly Alerts", MARGIN, doc.y);

  drawHRule(doc, MARGIN, doc.y + 2, CONTENT_W, COLORS.teal, 1.5);
  doc.y += 14;

  insights.forEach((insight, i) => {
    // Determine color by content
    const isWarning = /more|spike|high|unusual|anomal/i.test(insight);
    const isGood    = /less|saved|reduced|excellent|good/i.test(insight);
    const bg    = isWarning ? COLORS.orangeLight : isGood ? COLORS.greenLight : COLORS.yellowLight;
    const accent = isWarning ? COLORS.orange : isGood ? COLORS.green : COLORS.yellow;
    const bullet = isWarning ? "⚠" : isGood ? "✓" : "•";

    // Check if we need a new page
    if (doc.y + 50 > PAGE_H - MARGIN) {
      doc.addPage();
      doc.y = MARGIN;
    }

    const boxH = 34;
    filledRect(doc, MARGIN, doc.y, CONTENT_W, boxH, bg, 6);
    filledRect(doc, MARGIN, doc.y, 3, boxH, accent, 2);

    // Bullet
    setFill(doc, accent);
    doc.font("Helvetica-Bold").fontSize(11)
       .text(bullet, MARGIN + 8, doc.y + 10, { lineBreak: false });

    // Text
    setFill(doc, COLORS.gray700);
    doc.font("Helvetica").fontSize(9)
       .text(insight, MARGIN + 22, doc.y + 12, {
         width: CONTENT_W - 30,
         lineBreak: false,
         ellipsis: true,
       });

    doc.y += boxH + 5;
  });

  doc.y += 10;
}

// ─── Section: Category Breakdown ─────────────────────────────────────────────
function drawCategoryBreakdown(doc, expenses) {
  if (!expenses || expenses.length === 0) return;

  // Group by category
  const catMap = {};
  let total = 0;
  expenses.forEach(e => {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    catMap[cat] = (catMap[cat] || 0) + amt;
    total += amt;
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return;

  if (doc.y + 40 + sorted.length * 22 > PAGE_H - MARGIN) {
    doc.addPage();
    doc.y = MARGIN;
    doc.x = MARGIN;
  }

  setFill(doc, COLORS.gray900);
  doc.font("Helvetica-Bold").fontSize(13)
     .text("Spending by Category", MARGIN, doc.y);
  drawHRule(doc, MARGIN, doc.y + 2, CONTENT_W, COLORS.teal, 1.5);
  doc.y += 14;

  const BAR_MAX_W = CONTENT_W - 160;
  const PALETTE = [
    COLORS.teal, COLORS.orange, "#8b5cf6", "#ec4899",
    "#06b6d4", "#84cc16", "#f59e0b", "#6366f1",
  ];

  sorted.forEach(([cat, amt], i) => {
    if (doc.y + 22 > PAGE_H - MARGIN) { doc.addPage(); doc.y = MARGIN; doc.x = MARGIN;}

    const pct = total > 0 ? amt / total : 0;
    const barW = Math.max(4, BAR_MAX_W * pct);
    const color = PALETTE[i % PALETTE.length];
    const rowY = doc.y;

    // Category label
    setFill(doc, COLORS.gray700);
    doc.font("Helvetica").fontSize(9)
       .text(cat, MARGIN, rowY + 4, { width: 90, lineBreak: false });

    // Bar background
    filledRect(doc, MARGIN + 95, rowY + 6, BAR_MAX_W, 10, COLORS.gray100, 3);
    // Bar fill
    filledRect(doc, MARGIN + 95, rowY + 6, barW, 10, color, 3);

    // Percent
    setFill(doc, COLORS.gray500);
    doc.font("Helvetica").fontSize(8)
       .text(`${Math.round(pct * 100)}%`, MARGIN + 95 + BAR_MAX_W + 6, rowY + 4, { lineBreak: false });

    // Amount
    setFill(doc, color);
    doc.font("Helvetica-Bold").fontSize(9)
       .text(fmtAmount(amt), PAGE_W - MARGIN - 60, rowY + 4, { width: 60, align: "right", lineBreak: false });

    doc.y += 22;
  });

  doc.y += 10;
}

// ─── Section: Transactions Table ──────────────────────────────────────────────
function drawTransactionsTable(doc, expenses) {
  if (!expenses || expenses.length === 0) return;

  if (doc.y + 60 > PAGE_H - MARGIN) { doc.addPage(); doc.y = MARGIN; doc.x = MARGIN;}

  setFill(doc, COLORS.gray900);
  doc.font("Helvetica-Bold").fontSize(13)
     .text("Transaction Details", MARGIN, doc.y);
  drawHRule(doc, MARGIN, doc.y + 2, CONTENT_W, COLORS.teal, 1.5);
  doc.y += 14;

  // Table header
  const COL = {
    date:   { x: MARGIN,       w: 75  },
    desc:   { x: MARGIN + 75,  w: 170 },
    cat:    { x: MARGIN + 245, w: 100 },
    amount: { x: MARGIN + 345, w: 80  },
    status: { x: MARGIN + 425, w: 90  },
  };

  const headerY = doc.y;
  filledRect(doc, MARGIN, headerY, CONTENT_W, 22, COLORS.teal, 4);

  setFill(doc, COLORS.white);
  doc.font("Helvetica-Bold").fontSize(8.5);
  doc.text("Date",        COL.date.x + 4,   headerY + 7, { lineBreak: false });
  doc.text("Description", COL.desc.x + 4,   headerY + 7, { lineBreak: false });
  doc.text("Category",    COL.cat.x + 4,    headerY + 7, { lineBreak: false });
  doc.text("Amount",      COL.amount.x + 4, headerY + 7, { lineBreak: false });

  doc.y = headerY + 22;

  // Rows
  expenses.forEach((exp, i) => {
    if (doc.y + 20 > PAGE_H - MARGIN) {
      doc.addPage();
      doc.y = MARGIN;
      doc.x = MARGIN;

      // Repeat header on new page
      const hy = doc.y;
      filledRect(doc, MARGIN, hy, CONTENT_W, 22, COLORS.teal, 4);
      setFill(doc, COLORS.white);
      doc.font("Helvetica-Bold").fontSize(8.5);
      doc.text("Date",        COL.date.x + 4,   hy + 7, { lineBreak: false });
      doc.text("Description", COL.desc.x + 4,   hy + 7, { lineBreak: false });
      doc.text("Category",    COL.cat.x + 4,    hy + 7, { lineBreak: false });
      doc.text("Amount",      COL.amount.x + 4, hy + 7, { lineBreak: false });
      doc.y = hy + 22;
    }

    const rowY = doc.y;
    const rowBg = i % 2 === 0 ? COLORS.white : COLORS.gray100;
    filledRect(doc, MARGIN, rowY, CONTENT_W, 18, rowBg);

    // Bottom border
    drawHRule(doc, MARGIN, rowY + 18, CONTENT_W, COLORS.gray300, 0.3);

    setFill(doc, COLORS.gray700);
    doc.font("Helvetica").fontSize(8.5);
    doc.text(fmtDate(exp.date),
      COL.date.x + 4, rowY + 5, { width: COL.date.w - 4, lineBreak: false });

    doc.text(exp.description || "—",
      COL.desc.x + 4, rowY + 5, { width: COL.desc.w - 8, lineBreak: false, ellipsis: true });

    // Category pill
    const catX = COL.cat.x + 4;
    const catLabel = exp.category || "Other";
    filledRect(doc, catX, rowY + 4, 70, 12, COLORS.tealLight, 3);
    setFill(doc, COLORS.tealDark);
    doc.font("Helvetica").fontSize(7.5)
       .text(catLabel, catX + 4, rowY + 6, { width: 62, lineBreak: false, ellipsis: true });

    // Amount
    setFill(doc, COLORS.orange);
    doc.font("Helvetica-Bold").fontSize(9)
       .text(fmtAmount(exp.amount),
         COL.amount.x + 4, rowY + 5, { width: COL.amount.w - 4, lineBreak: false });

    doc.y = rowY + 18;
  });

  doc.y += 10;
}

// ─── Section: Footer ─────────────────────────────────────────────────────────
function drawFooter(doc) {
  const pages = doc.bufferedPageRange
    ? doc.bufferedPageRange()
    : { start: 0, count: 1 };

  const totalPages = pages.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(pages.start + i);

    // Footer bar
    filledRect(doc, 0, PAGE_H - 36, PAGE_W, 36, COLORS.teal);

    setFill(doc, COLORS.tealLight);
    doc.font("Helvetica").fontSize(8)
       .text("Generated by Monio · Confidential",
         MARGIN, PAGE_H - 22, { lineBreak: false });

    setFill(doc, COLORS.white);
    doc.font("Helvetica").fontSize(8)
       .text(`Page ${i} of ${totalPages}`,
         PAGE_W - MARGIN - 60, PAGE_H - 22,
         { width: 60, align: "right", lineBreak: false });
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function generateExpenseReportPDF({ user, insights, expenses, incomes = [], res }) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: 50, left: MARGIN, right: MARGIN },
    bufferPages: true, // needed for footer page numbers
  });

  const filename = `Expense_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  // Compute summary stats
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIncome  = (incomes || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const savings      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // ── Draw sections ──
  drawHeader(doc, user);

  drawSummaryCards(doc, {
    totalExpense,
    totalIncome,
    savings,
    savingsRate,
    txCount: expenses.length,
  });

  drawInsights(doc, insights);
  drawCategoryBreakdown(doc, expenses);
  drawTransactionsTable(doc, expenses);

  // Footer on all pages (must be last)
  drawFooter(doc);

  // Remove trailing empty pages robustly
    if (doc.bufferedPageRange) {
        let { start, count } = doc.bufferedPageRange();

        for (let i = count - 1; i > 0; i--) {
            doc.switchToPage(start + i);

            // More strict check for empty page
            const isAlmostEmpty = doc.y <= MARGIN + 5;

            if (isAlmostEmpty) {
            doc.removePage(start + i);
            } else {
            break;
            }
        }
    }

  doc.end();
}