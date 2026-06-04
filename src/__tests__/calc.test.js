import { describe, it, expect } from "vitest";
import {
  calcPL,
  calcBalances,
  closeYear,
  basicDeductionIncomeTax,
  basicDeductionResidentTax,
  calcIncomeTax,
} from "../lib/calc.js";

// ── ヘルパー: テスト用の仕訳を簡単に作る ──
const entry = (debitCode, creditCode, amount, date = "2025-06-01") => ({
  id: String(Math.random()),
  date,
  debitCode,
  creditCode,
  amount,
  memo: "",
});

// ════════════════════════════════════════
// calcPL
// ════════════════════════════════════════
describe("calcPL", () => {
  it("売上10,000 − 経費3,000 = 利益7,000", () => {
    const entries = [
      entry("102", "401", 10000), // 普通預金 / 売上高
      entry("501", "102", 3000), //  仕入高  / 普通預金
    ];
    const pl = calcPL(entries);
    expect(pl.totalRevenue).toBe(10000);
    expect(pl.totalExpense).toBe(3000);
    expect(pl.netIncome).toBe(7000);
  });

  it("仕訳がゼロなら全て0", () => {
    const pl = calcPL([]);
    expect(pl.totalRevenue).toBe(0);
    expect(pl.totalExpense).toBe(0);
    expect(pl.netIncome).toBe(0);
    expect(pl.revenueRows).toHaveLength(0);
    expect(pl.expenseRows).toHaveLength(0);
  });

  it("複数の収入科目と経費科目を正しく集計する", () => {
    const entries = [
      entry("102", "401", 50000), // 売上高 50,000
      entry("102", "402", 5000), //  雑収入  5,000
      entry("504", "102", 10000), // 地代家賃
      entry("507", "102", 3000), //  通信費
      entry("510", "101", 2000), //  消耗品費
    ];
    const pl = calcPL(entries);
    expect(pl.totalRevenue).toBe(55000);
    expect(pl.totalExpense).toBe(15000);
    expect(pl.netIncome).toBe(40000);
    expect(pl.revenueRows).toHaveLength(2);
    expect(pl.expenseRows).toHaveLength(3);
  });

  it("売上の返品（借方に収入科目）は収入を減らす", () => {
    const entries = [
      entry("102", "401", 100000), // 売上 100,000
      entry("401", "102", 10000), //  売上返品 −10,000
    ];
    const pl = calcPL(entries);
    expect(pl.totalRevenue).toBe(90000);
  });

  it("経費の戻り（貸方に経費科目）は経費を減らす", () => {
    const entries = [
      entry("510", "101", 5000), //  消耗品費 5,000
      entry("101", "510", 1000), //  返品戻り −1,000
    ];
    const pl = calcPL(entries);
    expect(pl.totalExpense).toBe(4000);
  });

  it("資産同士の振替はPLに影響しない", () => {
    const entries = [
      entry("101", "102", 50000), // 預金→現金（資金移動）
    ];
    const pl = calcPL(entries);
    expect(pl.totalRevenue).toBe(0);
    expect(pl.totalExpense).toBe(0);
    expect(pl.netIncome).toBe(0);
  });

  it("事業主貸・事業主借はPLに影響しない", () => {
    const entries = [
      entry("102", "401", 100000), // 売上
      entry("104", "102", 30000), //  事業主貸（生活費）
      entry("102", "203", 5000), //   事業主借（立替）
    ];
    const pl = calcPL(entries);
    expect(pl.netIncome).toBe(100000); // 売上のみ
  });
});

// ════════════════════════════════════════
// calcBalances
// ════════════════════════════════════════
describe("calcBalances", () => {
  it("売上入金で預金が増え、経費で減る", () => {
    const entries = [
      entry("102", "401", 100000), // 預金 +100,000
      entry("504", "102", 20000), //  預金 −20,000
    ];
    const bal = calcBalances(entries);
    expect(bal["102"]).toBe(80000); //  普通預金 残高
    expect(bal["401"]).toBe(100000); // 売上高（収入残高）
    expect(bal["504"]).toBe(20000); //  地代家賃（費用残高）
  });

  it("期首残高を初期値として計算できる", () => {
    const opening = { "101": 50000, "102": 200000, "301": 250000 };
    const entries = [
      entry("102", "401", 80000), // 売上
    ];
    const bal = calcBalances(entries, opening);
    expect(bal["101"]).toBe(50000); //  現金: 期首のまま
    expect(bal["102"]).toBe(280000); // 預金: 200,000 + 80,000
    expect(bal["301"]).toBe(250000); // 元入金: 期首のまま
  });

  it("仕訳ゼロ + 期首残高ゼロ → 空", () => {
    const bal = calcBalances([]);
    expect(Object.keys(bal)).toHaveLength(0);
  });

  it("貸借対照表の等式: 資産 = 負債 + 資本 + 収入 − 経費", () => {
    const entries = [
      entry("102", "301", 500000), // 元入金
      entry("102", "401", 300000), // 売上
      entry("501", "102", 100000), // 仕入
      entry("104", "102", 50000), //  事業主貸
      entry("102", "203", 20000), //  事業主借
    ];
    const bal = calcBalances(entries);

    const assets = (bal["101"] || 0) + (bal["102"] || 0) +
      (bal["103"] || 0) + (bal["104"] || 0) + (bal["105"] || 0) + (bal["106"] || 0);
    const liabilities = (bal["201"] || 0) + (bal["202"] || 0) +
      (bal["203"] || 0) + (bal["204"] || 0);
    const capital = bal["301"] || 0;
    const revenue = (bal["401"] || 0) + (bal["402"] || 0);
    const expenses = Object.entries(bal)
      .filter(([code]) => code >= "501" && code <= "599")
      .reduce((sum, [, v]) => sum + v, 0);

    // 資産 = 負債 + 資本 + (収入 − 経費)
    expect(assets).toBe(liabilities + capital + revenue - expenses);
  });
});

// ════════════════════════════════════════
// closeYear（年度締め・元入金繰越）
// ════════════════════════════════════════
describe("closeYear", () => {
  it("翌期元入金 = 元入金 + 利益 + 事業主借 − 事業主貸", () => {
    // 期末残高
    const bal = {
      "101": 30000, //   現金
      "102": 500000, //  普通預金
      "103": 50000, //   売掛金
      "104": 120000, //  事業主貸
      "201": 10000, //   買掛金
      "203": 40000, //   事業主借
      "301": 300000, //  元入金
    };
    const netIncome = 200000;

    const opening = closeYear(bal, netIncome);

    // 翌期の元入金 = 300,000 + 200,000 + 40,000 − 120,000 = 420,000
    expect(opening["301"]).toBe(420000);

    // 資産（事業主貸以外）は繰り越される
    expect(opening["101"]).toBe(30000);
    expect(opening["102"]).toBe(500000);
    expect(opening["103"]).toBe(50000);

    // 事業主貸・事業主借はリセット（含まれない）
    expect(opening["104"]).toBeUndefined();
    expect(opening["203"]).toBeUndefined();

    // 負債（事業主借以外）は繰り越される
    expect(opening["201"]).toBe(10000);
  });

  it("赤字の場合は元入金が減少する", () => {
    const bal = { "102": 100000, "301": 500000 };
    const netIncome = -200000;

    const opening = closeYear(bal, netIncome);
    // 500,000 + (−200,000) + 0 − 0 = 300,000
    expect(opening["301"]).toBe(300000);
  });

  it("残高ゼロの科目は繰り越されない", () => {
    const bal = { "102": 100000, "103": 0, "301": 100000 };
    const opening = closeYear(bal, 0);
    expect(opening["102"]).toBe(100000);
    expect(opening["103"]).toBeUndefined(); // 0なので省略
  });
});

// ════════════════════════════════════════
// 基礎控除（所得税）
// ════════════════════════════════════════
describe("basicDeductionIncomeTax", () => {
  it("令和6年分以前 → 一律48万円", () => {
    expect(basicDeductionIncomeTax(2024, 3000000)).toBe(480000);
    expect(basicDeductionIncomeTax(2023, 5000000)).toBe(480000);
  });

  it("令和7年分: 所得132万以下 → 95万円", () => {
    expect(basicDeductionIncomeTax(2025, 1000000)).toBe(950000);
    expect(basicDeductionIncomeTax(2025, 1320000)).toBe(950000);
  });

  it("令和7年分: 所得336万以下 → 88万円", () => {
    expect(basicDeductionIncomeTax(2025, 2000000)).toBe(880000);
    expect(basicDeductionIncomeTax(2025, 3360000)).toBe(880000);
  });

  it("令和7年分: 所得655万超 → 58万円", () => {
    expect(basicDeductionIncomeTax(2025, 7000000)).toBe(580000);
    expect(basicDeductionIncomeTax(2026, 7000000)).toBe(580000);
  });

  it("令和9年分以後: 132万超は一律58万円", () => {
    expect(basicDeductionIncomeTax(2027, 1320000)).toBe(950000);
    expect(basicDeductionIncomeTax(2027, 1320001)).toBe(580000);
    expect(basicDeductionIncomeTax(2027, 5000000)).toBe(580000);
  });

  it("高所得者 → 控除逓減〜ゼロ", () => {
    expect(basicDeductionIncomeTax(2025, 25000001)).toBe(0);
  });
});

// ── 基礎控除（住民税）──
describe("basicDeductionResidentTax", () => {
  it("合計所得2,400万以下 → 43万円", () => {
    expect(basicDeductionResidentTax(3000000)).toBe(430000);
    expect(basicDeductionResidentTax(24000000)).toBe(430000);
  });

  it("合計所得2,500万超 → 0円", () => {
    expect(basicDeductionResidentTax(25000001)).toBe(0);
  });
});

// ════════════════════════════════════════
// 所得税の速算表
// ════════════════════════════════════════
describe("calcIncomeTax", () => {
  it("課税所得ゼロ以下 → 税額0", () => {
    expect(calcIncomeTax(0)).toBe(0);
    expect(calcIncomeTax(-100000)).toBe(0);
  });

  it("課税所得100万円 → 5%", () => {
    // 1,000,000 × 5% = 50,000
    expect(calcIncomeTax(1000000)).toBe(50000);
  });

  it("課税所得300万円 → 10%−97,500", () => {
    // 3,000,000 × 10% − 97,500 = 202,500
    expect(calcIncomeTax(3000000)).toBe(202500);
  });

  it("課税所得500万円 → 20%−427,500", () => {
    // 5,000,000 × 20% − 427,500 = 572,500
    expect(calcIncomeTax(5000000)).toBe(572500);
  });

  it("課税所得195万円の境界", () => {
    // 1,950,000 × 5% = 97,500
    expect(calcIncomeTax(1950000)).toBe(97500);
    // 1,950,001 → 10%帯: 1,950,001 × 10% − 97,500 = 97,500.1 → floor = 97,500
    expect(calcIncomeTax(1950001)).toBe(97500);
  });
});

// ════════════════════════════════════════
// 実際の確定申告シナリオ（統合テスト）
// ════════════════════════════════════════
describe("実務シナリオ: フリーランスの1年間", () => {
  const yearEntries = [
    // 元入金
    entry("102", "301", 500000, "2025-01-01"),
    // 売上 × 12ヶ月
    entry("102", "401", 400000, "2025-01-31"),
    entry("102", "401", 400000, "2025-02-28"),
    entry("102", "401", 400000, "2025-03-31"),
    entry("102", "401", 400000, "2025-04-30"),
    entry("102", "401", 400000, "2025-05-31"),
    entry("102", "401", 400000, "2025-06-30"),
    entry("102", "401", 400000, "2025-07-31"),
    entry("102", "401", 400000, "2025-08-31"),
    entry("102", "401", 400000, "2025-09-30"),
    entry("102", "401", 400000, "2025-10-31"),
    entry("102", "401", 400000, "2025-11-30"),
    entry("102", "401", 400000, "2025-12-31"),
    // 経費
    entry("504", "102", 80000 * 12, "2025-12-31"), //  家賃 80,000×12
    entry("507", "102", 5000 * 12, "2025-12-31"), //   通信費 5,000×12
    entry("523", "102", 3000 * 12, "2025-12-31"), //   ソフトウェア 3,000×12
    // 生活費
    entry("104", "102", 200000 * 12, "2025-12-31"), // 事業主貸
  ];

  it("年間PL: 売上480万 − 経費105.6万 = 利益374.4万", () => {
    const pl = calcPL(yearEntries);
    expect(pl.totalRevenue).toBe(4800000);
    expect(pl.totalExpense).toBe(1056000);
    expect(pl.netIncome).toBe(3744000);
  });

  it("BSの貸借が一致する", () => {
    const bal = calcBalances(yearEntries);
    const { netIncome } = calcPL(yearEntries);

    // 資産合計
    const totalAssets = [
      "101", "102", "103", "104", "105", "106",
    ].reduce((s, c) => s + (bal[c] || 0), 0);

    // 負債合計 + 資本 + 収入 − 経費
    const totalLiab = [
      "201", "202", "203", "204",
    ].reduce((s, c) => s + (bal[c] || 0), 0);
    const capital = bal["301"] || 0;

    expect(totalAssets).toBe(totalLiab + capital + netIncome);
  });

  it("年度締め後の翌期元入金が正しい", () => {
    const bal = calcBalances(yearEntries);
    const { netIncome } = calcPL(yearEntries);
    const opening = closeYear(bal, netIncome);

    // 元入金500,000 + 利益3,744,000 + 事業主借0 − 事業主貸2,400,000
    expect(opening["301"]).toBe(500000 + 3744000 + 0 - 2400000);
    expect(opening["301"]).toBe(1844000);

    // 事業主貸・借はリセット
    expect(opening["104"]).toBeUndefined();
    expect(opening["203"]).toBeUndefined();
  });
});
