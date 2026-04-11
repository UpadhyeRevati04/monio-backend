import expenseModel from "../models/expenseModel.js";
import incomeModel from "../models/incomeModel.js";

export async function getAIInsights(req, res) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [expenses, incomes] = await Promise.all([
      expenseModel.find({ userId: req.user._id, date: { $gte: startOfMonth, $lte: now } }).lean(),
      incomeModel.find({ userId: req.user._id, date: { $gte: startOfMonth, $lte: now } }).lean(),
    ]);

    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const savings = totalIncome - totalExpense;

    const categoryBreakdown = {};
    expenses.forEach(e => {
      const cat = e.category || "Other";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(e.amount || 0);
    });

    const prompt = `
You are a personal finance advisor. Analyze this user's monthly financial data and provide:
1) 3 specific spending pattern insights
2) 3 actionable budget recommendations

Financial Data:
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpense}
- Net Savings: ₹${savings}
- Savings Rate: ${totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0}%
- Spending by Category: ${JSON.stringify(categoryBreakdown)}

Respond in this exact JSON format only, no extra text:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    // Add these logs right before the Gemini fetch call
    console.log("Expenses found:", expenses.length);
    console.log("Incomes found:", incomes.length);
    console.log("Category breakdown:", categoryBreakdown);
    const data = await response.json();
    // Add right after const data = await response.json();
console.log("Gemini raw response:", JSON.stringify(data, null, 2));
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json({ success: true, insights: parsed.insights || [], recommendations: parsed.recommendations || [] });
  } catch (err) {
    console.error("Gemini AI error:", err);
    res.status(500).json({ success: false, message: "AI analysis failed" });
  }
}