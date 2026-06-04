import { ACCOUNTS, fmt } from "../lib/accounts.js";
import { S } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

export default function AccountSummary({ entries }) {
  const totals = {};
  entries.forEach((e) => {
    [e.debitCode, e.creditCode].forEach((c) => {
      if (!totals[c]) totals[c] = { debit: 0, credit: 0 };
    });
    totals[e.debitCode].debit += e.amount;
    totals[e.creditCode].credit += e.amount;
  });

  const sections = [
    { title: "収入", accounts: ACCOUNTS.revenue, color: "#059669" },
    { title: "経費", accounts: ACCOUNTS.expense, color: "#dc2626" },
    { title: "資産", accounts: ACCOUNTS.asset, color: "#2563eb" },
    { title: "負債", accounts: ACCOUNTS.liability, color: "#7c3aed" },
    { title: "資本", accounts: ACCOUNTS.capital, color: "#0891b2" },
  ];

  return (
    <div>
      <SectionTitle icon="📋" title="勘定科目別集計" />
      {sections.map((sec) => {
        const rows = sec.accounts
          .map((a) => ({ ...a, ...(totals[a.code] || { debit: 0, credit: 0 }) }))
          .filter((a) => a.debit > 0 || a.credit > 0);
        if (!rows.length) return null;
        return (
          <div key={sec.title} style={S.card}>
            <h3 style={{ ...S.cardTitle, color: sec.color }}>{sec.title}</h3>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>科目</th>
                  <th style={{ ...S.th, textAlign: "right" }}>借方合計</th>
                  <th style={{ ...S.th, textAlign: "right" }}>貸方合計</th>
                  <th style={{ ...S.th, textAlign: "right" }}>残高</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const bal =
                    sec.title === "資産" || sec.title === "経費"
                      ? r.debit - r.credit
                      : r.credit - r.debit;
                  return (
                    <tr key={r.code} style={S.tr}>
                      <td style={S.td}>{r.name}</td>
                      <td style={{ ...S.td, textAlign: "right" }}>
                        ¥{fmt(r.debit)}
                      </td>
                      <td style={{ ...S.td, textAlign: "right" }}>
                        ¥{fmt(r.credit)}
                      </td>
                      <td
                        style={{
                          ...S.td,
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        ¥{fmt(bal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
