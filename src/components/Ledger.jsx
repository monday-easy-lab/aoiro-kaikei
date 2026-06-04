import { useState } from "react";
import { getAccountName, fmt } from "../lib/accounts.js";
import { S } from "../styles.js";
import { SectionTitle, ConfirmModal } from "./ui.jsx";

export default function Ledger({ entries, onEdit, onDelete }) {
  const [filter, setFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const filtered = filter
    ? sorted.filter(
        (e) =>
          getAccountName(e.debitCode).includes(filter) ||
          getAccountName(e.creditCode).includes(filter) ||
          (e.memo || "").includes(filter),
      )
    : sorted;

  return (
    <div>
      <SectionTitle icon="📒" title="仕訳帳" sub={`${filtered.length}件`} />
      <div style={S.card}>
        <input
          type="text"
          placeholder="科目名・摘要で検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ ...S.input, marginBottom: 16 }}
        />
        {filtered.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 32 }}>
            仕訳がありません
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                {filtered.map((e) => (
                  <tr key={e.id} style={S.tr}>
                    <td style={S.td}>{e.date}</td>
                    <td style={S.td}>{getAccountName(e.debitCode)}</td>
                    <td style={S.td}>{getAccountName(e.creditCode)}</td>
                    <td
                      style={{
                        ...S.td,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ¥{fmt(e.amount)}
                    </td>
                    <td style={{ ...S.td, color: "#6b7280", fontSize: 13 }}>
                      {e.memo}
                    </td>
                    <td style={S.td}>
                      <button style={S.tblBtn} onClick={() => onEdit(e.id)}>
                        編集
                      </button>
                      <button
                        style={{ ...S.tblBtn, color: "#ef4444" }}
                        onClick={() => setDeleteTarget(e.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          message="この仕訳を削除しますか？"
          onConfirm={() => {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
