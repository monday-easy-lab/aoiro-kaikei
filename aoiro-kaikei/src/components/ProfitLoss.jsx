import { fmt } from "../lib/accounts.js";
import { calcPLWithAnbun } from "../lib/calc.js";
import { S } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

export default function ProfitLoss({ entries, anbunRates }) {
  const c = calcPLWithAnbun(entries, anbunRates || {});

  return (
    <div>
      <SectionTitle icon="📈" title="損益計算書" />
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th} colSpan={2}>収入の部</th>
            </tr>
          </thead>
          <tbody>
            {c.revenueRows.map((r) => (
              <tr key={r.code} style={S.tr}>
                <td style={S.td}>{r.name}</td>
                <td style={{ ...S.td, textAlign: "right" }}>¥{fmt(r.amount)}</td>
              </tr>
            ))}
            <tr style={S.totalRow}>
              <td style={S.td}>収入合計</td>
              <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>
                ¥{fmt(c.totalRevenue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>経費の部</th>
              {c.hasAnbun && <th style={{ ...S.th, textAlign: "right", fontSize: 11 }}>按分前</th>}
              <th style={{ ...S.th, textAlign: "right" }}>{c.hasAnbun ? "按分後" : ""}</th>
            </tr>
          </thead>
          <tbody>
            {c.expenseRows.map((r) => (
              <tr key={r.code} style={S.tr}>
                <td style={S.td}>
                  {r.name}
                  {r.anbunRate != null && (
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>({r.anbunRate}%)</span>
                  )}
                </td>
                {c.hasAnbun && (
                  <td style={{ ...S.td, textAlign: "right", color: r.amountBeforeAnbun ? "#94a3b8" : undefined, fontSize: 12 }}>
                    {r.amountBeforeAnbun ? `¥${fmt(r.amountBeforeAnbun)}` : ""}
                  </td>
                )}
                <td style={{ ...S.td, textAlign: "right" }}>¥{fmt(r.amount)}</td>
              </tr>
            ))}
            <tr style={S.totalRow}>
              <td style={S.td}>経費合計</td>
              {c.hasAnbun && (
                <td style={{ ...S.td, textAlign: "right", color: "#94a3b8", fontSize: 12 }}>
                  ¥{fmt(c.totalExpenseBeforeAnbun)}
                </td>
              )}
              <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>
                ¥{fmt(c.totalExpense)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          ...S.card,
          background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
        }}
      >
        <table style={S.table}>
          <tbody>
            <tr>
              <td style={{ ...S.td, fontWeight: 700, fontSize: 16 }}>
                差引金額（事業所得）
                {c.hasAnbun && (
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>家事按分適用後</span>
                )}
              </td>
              <td
                style={{
                  ...S.td,
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: 20,
                  color: c.netIncome >= 0 ? "#059669" : "#dc2626",
                }}
              >
                ¥{fmt(c.netIncome)}
              </td>
            </tr>
            {c.hasAnbun && (
              <tr style={S.tr}>
                <td style={{ ...S.td, fontSize: 12, color: "#94a3b8" }}>（按分前参考: ¥{fmt(c.netIncomeBeforeAnbun)}）</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
