import { useState, useMemo } from "react";
import { getAccountName, getAccountType, fmt } from "../lib/accounts.js";
import { S, FONT } from "../styles.js";
import { SectionTitle, ConfirmModal } from "./ui.jsx";

export default function Ledger({ entries, onEdit, onDelete }) {
  const [filter, setFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const [openMonths, setOpenMonths] = useState({ [currentMonth]: true });

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = filter
    ? sorted.filter(
        (e) =>
          getAccountName(e.debitCode).includes(filter) ||
          getAccountName(e.creditCode).includes(filter) ||
          (e.memo || "").includes(filter),
      )
    : sorted;

  // 月ごとにグループ化
  const grouped = useMemo(() => {
    const months = {};
    filtered.forEach((e) => {
      const m = Number(e.date?.split("-")[1]);
      if (!months[m]) months[m] = [];
      months[m].push(e);
    });
    return Object.entries(months)
      .map(([month, items]) => {
        let revenue = 0, expense = 0;
        items.forEach((e) => {
          if (getAccountType(e.creditCode) === "revenue") revenue += e.amount;
          if (getAccountType(e.debitCode) === "expense") expense += e.amount;
        });
        return { month: Number(month), items, revenue, expense };
      })
      .sort((a, b) => b.month - a.month);
  }, [filtered]);

  const toggleMonth = (m) =>
    setOpenMonths((prev) => ({ ...prev, [m]: !prev[m] }));

  return (
    <div>
      <SectionTitle icon="📒" title="仕訳帳" sub={`${filtered.length}件`} />
      <div style={{ ...S.card, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="科目名・摘要で検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={S.input}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={S.card}>
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>
            仕訳がありません
          </p>
        </div>
      ) : (
        grouped.map(({ month, items, revenue, expense }) => {
          const isOpen = !!openMonths[month];
          return (
            <div key={month} style={{ ...S.card, padding: 0, marginBottom: 8, overflow: "hidden" }}>
              {/* 月ヘッダー */}
              <button
                type="button"
                onClick={() => toggleMonth(month)}
                style={{
                  width: "100%", padding: "14px 20px", border: "none",
                  background: isOpen ? "#f8fafc" : "#fff",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center", fontFamily: FONT, textAlign: "left",
                  outline: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 12, color: "#94a3b8", transition: "transform 0.2s",
                    transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block",
                  }}>▼</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                    {month}月
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    （{items.length}件）
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  {revenue > 0 && (
                    <span style={{ color: "#2563eb" }}>売上 ¥{fmt(revenue)}</span>
                  )}
                  {expense > 0 && (
                    <span style={{ color: "#dc2626" }}>経費 ¥{fmt(expense)}</span>
                  )}
                </div>
              </button>

              {/* 月の中身 */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #e2e8f0" }}>
                  {/* Desktop: テーブル */}
                  <div className="ledger-table" style={{ overflowX: "auto" }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>日付</th>
                          <th style={S.th}>借方</th>
                          <th style={S.th}>貸方</th>
                          <th style={{ ...S.th, textAlign: "right" }}>金額</th>
                          <th style={S.th}>摘要</th>
                          <th style={S.th}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((e) => (
                          <tr key={e.id} style={S.tr}>
                            <td style={S.td}>{e.date}</td>
                            <td style={S.td}>{getAccountName(e.debitCode)}</td>
                            <td style={S.td}>{getAccountName(e.creditCode)}</td>
                            <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                              ¥{fmt(e.amount)}
                            </td>
                            <td style={{ ...S.td, color: "#6b7280", fontSize: 13 }}>{e.memo}</td>
                            <td style={S.td}>
                              <button style={S.tblBtn} onClick={() => onEdit(e.id)}>編集</button>
                              <button style={{ ...S.tblBtn, color: "#ef4444" }} onClick={() => setDeleteTarget(e.id)}>削除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: カード */}
                  <div className="ledger-cards">
                    {items.map((e) => (
                      <div key={e.id} style={{
                        padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{e.date}</span>
                          <span style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>¥{fmt(e.amount)}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>
                          {getAccountName(e.debitCode)} → {getAccountName(e.creditCode)}
                        </div>
                        {e.memo && <p style={{ margin: "2px 0 6px", fontSize: 12, color: "#6b7280" }}>{e.memo}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ ...S.tblBtn, fontSize: 13 }} onClick={() => onEdit(e.id)}>✏️ 編集</button>
                          <button style={{ ...S.tblBtn, color: "#ef4444", fontSize: 13 }} onClick={() => setDeleteTarget(e.id)}>🗑️ 削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {deleteTarget && (
        <ConfirmModal
          message="この仕訳を削除しますか？"
          onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
