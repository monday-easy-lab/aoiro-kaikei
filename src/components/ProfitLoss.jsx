import { fmt } from "../lib/accounts.js";
import { calcPL } from "../lib/calc.js";
import { S } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

export default function ProfitLoss({ entries }) {
  const c = calcPL(entries);

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
              <th style={S.th} colSpan={2}>経費の部</th>
            </tr>
          </thead>
          <tbody>
            {c.expenseRows.map((r) => (
              <tr key={r.code} style={S.tr}>
                <td style={S.td}>{r.name}</td>
                <td style={{ ...S.td, textAlign: "right" }}>¥{fmt(r.amount)}</td>
              </tr>
            ))}
            <tr style={S.totalRow}>
              <td style={S.td}>経費合計</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
