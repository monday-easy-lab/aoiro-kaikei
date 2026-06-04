import Papa from "papaparse";
import { ALL_ACCOUNTS, getAccountName, makeId } from "./accounts.js";

// ── CSV インジェクション対策 ──
function sanitizeCell(value) {
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) return "'" + str;
  return str;
}

// ── CSV エクスポート ──
export function exportCSV(entries, fy) {
  const header =
    "日付,借方科目コード,借方科目,貸方科目コード,貸方科目,金額,摘要\n";
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) =>
      [
        e.date,
        e.debitCode,
        getAccountName(e.debitCode),
        e.creditCode,
        getAccountName(e.creditCode),
        e.amount,
        `"${sanitizeCell((e.memo || "").replace(/"/g, '""'))}"`,
      ].join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + header + rows], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), {
    href: url,
    download: `仕訳帳_${fy}.csv`,
  }).click();
  URL.revokeObjectURL(url);
}

// ── CSV インポート ──
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function importCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.slice(1); // skip header
        let imported = 0;
        let skipped = 0;
        const newEntries = [];
        const seen = new Set();

        rows.forEach((cols) => {
          if (cols.length < 6) {
            skipped++;
            return;
          }
          const date = cols[0]?.trim();
          const debitCode = cols[1]?.trim();
          const creditCode = cols[3]?.trim();
          const amount = Number(cols[5]);
          const memo = cols[6]?.trim() || "";

          // バリデーション
          if (!date || !DATE_RE.test(date)) {
            skipped++;
            return;
          }
          if (
            !debitCode ||
            !creditCode ||
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            skipped++;
            return;
          }
          if (debitCode === creditCode) {
            skipped++;
            return;
          }
          if (
            !ALL_ACCOUNTS.find((a) => a.code === debitCode) ||
            !ALL_ACCOUNTS.find((a) => a.code === creditCode)
          ) {
            skipped++;
            return;
          }

          // 重複検出（同日同科目同金額同メモ）
          const key = `${date}_${debitCode}_${creditCode}_${amount}_${memo}`;
          if (seen.has(key)) {
            skipped++;
            return;
          }
          seen.add(key);

          newEntries.push({
            id: makeId(),
            date,
            debitCode,
            creditCode,
            amount,
            memo,
          });
          imported++;
        });

        resolve({ newEntries, imported, skipped });
      },
      error: () => reject(new Error("CSV parse error")),
    });
  });
}

// ── JSON バックアップ ──
export function exportBackup(settings, entries, fy) {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    entries,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), {
    href: url,
    download: `青色申告バックアップ_${fy}_${new Date().toISOString().slice(0, 10)}.json`,
  }).click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error("invalid backup format");
  }
  return data;
}
