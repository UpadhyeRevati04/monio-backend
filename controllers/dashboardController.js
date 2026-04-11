import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
import { generateExpenseReportPDF } from "../utils/pdfUtils.js";

export async function getDashboardOverview(req, res) {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const incomes = await incomeModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const expenses = await expenseModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const monthlyIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const monthlyExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const savings = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

        const recentTransactions = [
            ...incomes.map((i) => ({ ...i, type: "income" })),
            ...expenses.map((e) => ({ ...e, type: "expense" })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const spendByCategory = {};
        for (const exp of expenses) {
            const cat = exp.category || "Other";
            spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
        }

        const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
            category,
            amount,
            percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
        }));//for chart

        return res.status(200).json({
            success: true,
            data: {
                monthlyIncome,
                monthlyExpense,
                savings,
                savingsRate,
                recentTransactions,
                spendByCategory,
                expenseDistribution
            }
        })
    }

    catch (err) {
        console.error("GetDashboardOverview Error:", err);
        return res.status(500).json({
            success: false,
            message: "Dashboard Fetch failed"
        });
    }
}

export async function downloadExpenseReport(req, res) {
    const user = req.user;
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd      = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current month expenses
        const expenses = await expenseModel.find({
            userId: user._id,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        // Current month incomes
        const incomes = await incomeModel.find({
            userId: user._id,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        // Previous month expenses for insights
        const prevExpenses = await expenseModel.find({
            userId: user._id,
            date: { $gte: prevMonth, $lte: prevEnd },
        }).lean();

        // Group by category helper
        const groupByCategory = (arr) => {
            const out = {};
            arr.forEach(e => {
                const cat = e.category || "Other";
                out[cat] = (out[cat] || 0) + Number(e.amount || 0);
            });
            return out;
        };

        // Generate insights by comparing curr vs prev month
        const currCat = groupByCategory(expenses);
        const prevCat = groupByCategory(prevExpenses);
        const insights = [];

        for (const cat in currCat) {
            const curr = currCat[cat];
            const prev = prevCat[cat] || 0;
            if (prev === 0 && curr > 0) {
                insights.push(`New spending in '${cat}': ₹${curr}`);
            } else if (prev > 0) {
                const percent = Math.round(((curr - prev) / prev) * 100);
                if (percent > 30) {
                    insights.push(`You spent ${percent}% more on '${cat}' this month (₹${curr}) vs last month (₹${prev})`);
                } else if (percent < -30) {
                    insights.push(`You spent ${Math.abs(percent)}% less on '${cat}' this month (₹${curr}) vs last month (₹${prev})`);
                }
            }
        }

        if (insights.length === 0) {
            insights.push("No significant anomalies detected this month. Keep it up!");
        }

        // Generate and stream PDF
        generateExpenseReportPDF({ user, insights, expenses, incomes, res });

    } catch (err) {
        console.error("DownloadExpenseReport Error:", err);
        res.status(500).json({ success: false, message: "Failed to generate PDF report" });
    }
}