export function parseTransactionEmail(subject, body) {
  const text = `${subject} ${body}`.replace(/\s+/g, " ");

  // Match amount — handles ₹1,234.56 / Rs.1234 / INR 1234
  const amountMatch = text.match(
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/,/g, ""))
    : null;

  if (!amount) return null;

  // Detect type
  const isCredit = /credited|credit|received|deposited|added/i.test(text);
  const isDebit = /debited|debit|paid|spent|withdrawn|purchase|transaction/i.test(text);
  const type = isCredit ? "income" : isDebit ? "expense" : null;
  if (!type) return null;

  // Extract merchant/description
  const merchantPatterns = [
    /(?:at|to|from|merchant|towards)\s+([A-Za-z0-9\s&\-\.]+?)(?:\s+on|\s+for|\s+via|\s+ref|\.|,|$)/i,
    /(?:UPI|IMPS|NEFT)\s*[-:]?\s*([A-Za-z0-9\s&\-\.]+?)(?:\s+ref|\s+upi|\.|,|$)/i,
  ];

  let description = "Bank Transaction";
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 2) {
      description = match[1].trim();
      break;
    }
  }

  // Detect category from keywords
  const categoryMap = {
    Food: /zomato|swiggy|restaurant|food|cafe|eat|pizza|burger|hotel/i,
    Transport: /uber|ola|rapido|petrol|fuel|irctc|train|bus|metro|flight/i,
    Shopping: /amazon|flipkart|myntra|meesho|shop|store|mall/i,
    Entertainment: /netflix|hotstar|prime|spotify|movie|cinema|pvr|inox/i,
    Utilities: /electricity|water|gas|broadband|wifi|airtel|jio|bsnl|recharge/i,
    Healthcare: /pharmacy|hospital|clinic|doctor|medical|apollo|pharma/i,
    Salary: /salary|payroll|stipend|wages/i,
  };

  let category = type === "income" ? "Salary" : "Other";
  for (const [cat, regex] of Object.entries(categoryMap)) {
    if (regex.test(text)) { category = cat; break; }
  }

  return {
    amount,
    type,
    description,
    category,
    date: new Date().toISOString(),
  };
}