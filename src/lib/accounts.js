// ── 勘定科目定義 ──

export const ACCOUNTS = {
  revenue: [
    { code: "401", name: "売上高" },
    { code: "402", name: "雑収入" },
  ],
  expense: [
    { code: "501", name: "仕入高" },
    { code: "502", name: "外注費" },
    { code: "503", name: "給料賃金" },
    { code: "504", name: "地代家賃" },
    { code: "505", name: "水道光熱費" },
    { code: "506", name: "旅費交通費" },
    { code: "507", name: "通信費" },
    { code: "508", name: "広告宣伝費" },
    { code: "509", name: "接待交際費" },
    { code: "510", name: "消耗品費" },
    { code: "511", name: "減価償却費" },
    { code: "512", name: "雑費" },
    { code: "513", name: "支払手数料" },
    { code: "514", name: "租税公課" },
    { code: "515", name: "保険料" },
    { code: "516", name: "修繕費" },
    { code: "517", name: "福利厚生費" },
    { code: "518", name: "新聞図書費" },
    { code: "519", name: "研修費" },
    { code: "520", name: "荷造運賃" },
    { code: "521", name: "会議費" },
    { code: "522", name: "車両費" },
    { code: "523", name: "ソフトウェア利用料" },
  ],
  capital: [{ code: "301", name: "元入金" }],
  asset: [
    { code: "101", name: "現金" },
    { code: "102", name: "普通預金" },
    { code: "103", name: "売掛金" },
    { code: "104", name: "事業主貸" },
    { code: "105", name: "工具器具備品" },
    { code: "106", name: "車両運搬具" },
  ],
  liability: [
    { code: "201", name: "買掛金" },
    { code: "202", name: "未払金" },
    { code: "203", name: "事業主借" },
    { code: "204", name: "預り金" },
  ],
};

export const ALL_ACCOUNTS = [
  ...ACCOUNTS.asset,
  ...ACCOUNTS.liability,
  ...ACCOUNTS.capital,
  ...ACCOUNTS.revenue,
  ...ACCOUNTS.expense,
];

export function getAccountName(code) {
  return ALL_ACCOUNTS.find((a) => a.code === code)?.name || code;
}

export function getAccountType(code) {
  if (ACCOUNTS.asset.find((a) => a.code === code)) return "asset";
  if (ACCOUNTS.liability.find((a) => a.code === code)) return "liability";
  if (ACCOUNTS.capital.find((a) => a.code === code)) return "capital";
  if (ACCOUNTS.revenue.find((a) => a.code === code)) return "revenue";
  if (ACCOUNTS.expense.find((a) => a.code === code)) return "expense";
  return null;
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("ja-JP");
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function currentFY() {
  return new Date().getFullYear();
}
