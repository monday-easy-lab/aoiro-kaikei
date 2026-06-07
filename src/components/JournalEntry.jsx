import { useState, useEffect, useMemo } from "react";
import { ACCOUNTS, makeId } from "../lib/accounts.js";
import { S, FONT } from "../styles.js";
import { SectionTitle, AmountInput } from "./ui.jsx";

export default function JournalEntry({ entries, persist, fy, editId, setEditId }) {
  const emptyForm = useMemo(
    () => ({
      date: `${fy}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
      debitCode: "501",
      creditCode: "102",
      amount: "",
      memo: "",
    }),
    [fy],
  );

  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (editId) {
      const e = entries.find((x) => x.id === editId);
      if (e)
        setForm({
          date: e.date,
          debitCode: e.debitCode,
          creditCode: e.creditCode,
          amount: String(e.amount),
          memo: e.memo || "",
        });
    } else {
      setForm(emptyForm);
    }
  }, [editId, entries, emptyForm]);

  const handleSubmit = () => {
    const amt = Number(form.amount);
    if (!form.date || !Number.isFinite(amt) || amt <= 0) {
      setMsg("⚠ 日付と金額を正しく入力してください");
      return;
    }
    if (form.debitCode === form.creditCode) {
      setMsg("⚠ 借方と貸方に同じ科目は指定できません");
      return;
    }
    if (editId) {
      persist(
        entries.map((e) =>
          e.id === editId ? { ...e, ...form, amount: amt } : e,
        ),
      );
      setEditId(null);
      setMsg("✓ 更新しました");
    } else {
      persist([...entries, { id: makeId(), ...form, amount: amt }]);
      setMsg("✓ 登録しました");
    }
    setForm(emptyForm);
    setTimeout(() => setMsg(""), 2500);
  };

  const presets = [
    { label: "売上（振込）", d: "102", c: "401" },
    { label: "売上（現金）", d: "101", c: "401" },
    { label: "売上（掛け）", d: "103", c: "401" },
    { label: "売掛金回収", d: "102", c: "103" },
    { label: "仕入", d: "501", c: "102" },
    { label: "家賃", d: "504", c: "102" },
    { label: "交通費", d: "506", c: "101" },
    { label: "消耗品", d: "510", c: "101" },
    { label: "通信費", d: "507", c: "102" },
    { label: "外注費", d: "502", c: "102" },
    { label: "経費（クレカ）", d: "510", c: "205" },
    { label: "クレカ引落", d: "205", c: "102" },
    { label: "電子マネーチャージ", d: "107", c: "102" },
    { label: "事業主貸", d: "104", c: "102" },
    { label: "事業主借", d: "102", c: "203" },
    { label: "備品購入", d: "105", c: "102" },
    { label: "減価償却", d: "511", c: "105" },
  ];

  const AccountSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={S.input}>
      <optgroup label="── 資産 ──">
        {ACCOUNTS.asset.map((a) => (
          <option key={a.code} value={a.code}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="── 経費 ──">
        {ACCOUNTS.expense.map((a) => (
          <option key={a.code} value={a.code}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="── 負債 ──">
        {ACCOUNTS.liability.map((a) => (
          <option key={a.code} value={a.code}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="── 収入 ──">
        {ACCOUNTS.revenue.map((a) => (
          <option key={a.code} value={a.code}>{a.name}</option>
        ))}
      </optgroup>
      <optgroup label="── 資本 ──">
        {ACCOUNTS.capital.map((a) => (
          <option key={a.code} value={a.code}>{a.name}</option>
        ))}
      </optgroup>
    </select>
  );

  return (
    <div>
      <SectionTitle
        icon="✏️"
        title={editId ? "仕訳の編集" : "仕訳入力（上級者向け）"}
      />
      <p
        style={{
          color: "#64748b",
          fontSize: 13,
          marginTop: -12,
          marginBottom: 20,
        }}
      >
        借方・貸方を直接指定して仕訳を入力します。初めての方は「🎯
        かんたん入力」をお使いください。
      </p>
      <div style={S.card}>
        <p style={S.presetLabel}>よく使う仕訳パターン：</p>
        <div style={S.presetWrap}>
          {presets.map((p) => (
            <button
              key={p.label}
              style={S.presetBtn}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  debitCode: p.d,
                  creditCode: p.c,
                }))
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.formGrid}>
          <div style={S.formGroup}>
            <label style={S.label}>日付</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              style={S.input}
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>金額（円）</label>
            <AmountInput
              value={form.amount}
              onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
              placeholder="0"
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>借方</label>
            <AccountSelect
              value={form.debitCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, debitCode: e.target.value }))
              }
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>貸方</label>
            <AccountSelect
              value={form.creditCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, creditCode: e.target.value }))
              }
            />
          </div>
          <div style={{ ...S.formGroup, gridColumn: "1 / -1" }}>
            <label style={S.label}>摘要</label>
            <input
              type="text"
              value={form.memo}
              placeholder="取引内容"
              onChange={(e) =>
                setForm((f) => ({ ...f, memo: e.target.value }))
              }
              style={S.input}
            />
          </div>
        </div>
        <div style={S.formActions}>
          {editId && (
            <button
              style={S.btnSecondary}
              onClick={() => {
                setEditId(null);
                setForm(emptyForm);
              }}
            >
              キャンセル
            </button>
          )}
          <button style={S.btnPrimary} onClick={handleSubmit}>
            {editId ? "更新する" : "登録する"}
          </button>
        </div>
        {msg && (
          <p
            style={{
              ...S.msg,
              color: msg.startsWith("⚠") ? "#dc2626" : "#059669",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
