import { ACCOUNTS, getAccountType } from "./accounts.js";

// ── 損益計算 ──
export function calcPL(entries) {
  const revTotals = {};
  const expTotals = {};
  entries.forEach((e) => {
    if (getAccountType(e.creditCode) === "revenue")
      revTotals[e.creditCode] = (revTotals[e.creditCode] || 0) + e.amount;
    if (getAccountType(e.debitCode) === "revenue")
      revTotals[e.debitCode] = (revTotals[e.debitCode] || 0) - e.amount;
    if (getAccountType(e.debitCode) === "expense")
      expTotals[e.debitCode] = (expTotals[e.debitCode] || 0) + e.amount;
    if (getAccountType(e.creditCode) === "expense")
      expTotals[e.creditCode] = (expTotals[e.creditCode] || 0) - e.amount;
  });
  const revenueRows = ACCOUNTS.revenue
    .map((a) => ({ ...a, amount: revTotals[a.code] || 0 }))
    .filter((r) => r.amount !== 0);
  const expenseRows = ACCOUNTS.expense
    .map((a) => ({ ...a, amount: expTotals[a.code] || 0 }))
    .filter((r) => r.amount !== 0);
  const totalRevenue = revenueRows.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0);
  return {
    revenueRows,
    expenseRows,
    totalRevenue,
    totalExpense,
    netIncome: totalRevenue - totalExpense,
  };
}

// ── 残高計算（期首残高を初期値として受け取る）──
export function calcBalances(entries, opening = {}) {
  const bal = {};
  // 期首残高をセット
  Object.entries(opening).forEach(([code, amount]) => {
    bal[code] = amount;
  });
  entries.forEach((e) => {
    if (!bal[e.debitCode]) bal[e.debitCode] = 0;
    if (!bal[e.creditCode]) bal[e.creditCode] = 0;
    const dt = getAccountType(e.debitCode);
    const ct = getAccountType(e.creditCode);
    // 借方: 資産・費用は増加(+)、それ以外は減少(-)
    bal[e.debitCode] += dt === "asset" || dt === "expense" ? e.amount : -e.amount;
    // 貸方: 負債・収益・資本は増加(+)、それ以外は減少(-)
    bal[e.creditCode] +=
      ct === "liability" || ct === "revenue" || ct === "capital"
        ? e.amount
        : -e.amount;
  });
  return bal;
}

// ── 年度締め: 翌年の期首残高を計算 ──
export function closeYear(bal, netIncome) {
  // 期末元入金 = 期首元入金 + 当期利益 + 事業主借 − 事業主貸
  const moto =
    (bal["301"] || 0) + netIncome + (bal["203"] || 0) - (bal["104"] || 0);
  const opening = {};
  // 資産（事業主貸はリセット）
  ACCOUNTS.asset
    .filter((a) => a.code !== "104")
    .forEach((a) => {
      if (bal[a.code]) opening[a.code] = bal[a.code];
    });
  // 負債（事業主借はリセット）
  ACCOUNTS.liability
    .filter((a) => a.code !== "203")
    .forEach((a) => {
      if (bal[a.code]) opening[a.code] = bal[a.code];
    });
  // 新しい元入金
  opening["301"] = moto;
  return opening;
}

// ── 所得税の基礎控除（令和7年度改正対応）──
export function basicDeductionIncomeTax(fy, totalIncome) {
  // 令和6年分以前
  if (fy <= 2024) {
    if (totalIncome <= 24000000) return 480000;
    if (totalIncome <= 24500000) return 320000;
    if (totalIncome <= 25000000) return 160000;
    return 0;
  }
  // 令和9年分以後: 132万以下=95万, それ以外=58万（特例加算なし）
  if (fy >= 2027) {
    if (totalIncome <= 1320000) return 950000;
    if (totalIncome <= 23500000) return 580000;
    if (totalIncome <= 24000000) return 480000;
    if (totalIncome <= 24500000) return 320000;
    if (totalIncome <= 25000000) return 160000;
    return 0;
  }
  // 令和7・8年分 (2025-2026): 特例加算あり
  if (totalIncome <= 1320000) return 950000;
  if (totalIncome <= 3360000) return 880000;
  if (totalIncome <= 4890000) return 680000;
  if (totalIncome <= 6550000) return 630000;
  if (totalIncome <= 23500000) return 580000;
  if (totalIncome <= 24000000) return 480000;
  if (totalIncome <= 24500000) return 320000;
  if (totalIncome <= 25000000) return 160000;
  return 0;
}

// ── 住民税の基礎控除（改正なし: 43万円）──
export function basicDeductionResidentTax(totalIncome) {
  if (totalIncome <= 24000000) return 430000;
  if (totalIncome <= 24500000) return 290000;
  if (totalIncome <= 25000000) return 150000;
  return 0;
}

// ── 所得税額の速算表 ──
export function calcIncomeTax(income) {
  if (income <= 0) return 0;
  const brackets = [
    { limit: 1950000, rate: 0.05, ded: 0 },
    { limit: 3300000, rate: 0.1, ded: 97500 },
    { limit: 6950000, rate: 0.2, ded: 427500 },
    { limit: 9000000, rate: 0.23, ded: 636000 },
    { limit: 18000000, rate: 0.33, ded: 1536000 },
    { limit: 40000000, rate: 0.4, ded: 2796000 },
    { limit: Infinity, rate: 0.45, ded: 4796000 },
  ];
  const b = brackets.find((x) => income <= x.limit);
  return Math.floor(income * b.rate - b.ded);
}

// ── 家事按分: 対象科目とデフォルト ──
export const ANBUN_TARGET_ACCOUNTS = [
  { code: "504", name: "地代家賃", hint: "仕事部屋の面積 ÷ 家全体の面積" },
  { code: "505", name: "水道光熱費", hint: "仕事時間 ÷ 1日の時間（例: 8h/24h = 33%）" },
  { code: "507", name: "通信費", hint: "仕事での利用割合" },
  { code: "522", name: "車両費", hint: "仕事での走行距離 ÷ 総走行距離" },
];

// 按分後のPLを計算
export function calcPLWithAnbun(entries, anbunRates = {}) {
  const pl = calcPL(entries);
  const adjustedExpenseRows = pl.expenseRows.map((row) => {
    const rate = anbunRates[row.code];
    if (rate != null && rate < 100) {
      const adjusted = Math.floor(row.amount * rate / 100);
      return { ...row, amountBeforeAnbun: row.amount, amount: adjusted, anbunRate: rate };
    }
    return row;
  });
  const totalExpense = adjustedExpenseRows.reduce((s, r) => s + r.amount, 0);
  return {
    ...pl,
    expenseRows: adjustedExpenseRows,
    totalExpenseBeforeAnbun: pl.totalExpense,
    totalExpense,
    netIncome: pl.totalRevenue - totalExpense,
    netIncomeBeforeAnbun: pl.netIncome,
    hasAnbun: Object.values(anbunRates).some((r) => r != null && r < 100),
  };
}
