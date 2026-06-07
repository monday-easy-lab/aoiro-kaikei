import { useState } from "react";
import { fmt } from "../lib/accounts.js";
import { S, FONT } from "../styles.js";

export function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={S.sectionTitle}>
        <span>{icon}</span> {title}
        {sub && <span style={S.sectionSub}>{sub}</span>}
      </h2>
    </div>
  );
}

export function DashCard({ label, value, color, sub }) {
  return (
    <div style={S.card}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{label}</p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 22,
          fontWeight: 800,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ¥{fmt(value)}
      </p>
      {sub && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── ミニ電卓付き金額入力 ──
function safeEval(expr) {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, "");
    if (!sanitized) return null;
    const result = new Function("return " + sanitized)();
    if (!Number.isFinite(result)) return null;
    return Math.floor(result);
  } catch { return null; }
}

export function AmountInput({ value, onChange, placeholder }) {
  const [showCalc, setShowCalc] = useState(false);
  const [expr, setExpr] = useState("");
  const result = safeEval(expr);

  const applyResult = () => {
    if (result != null && result > 0) {
      onChange(String(result));
      setShowCalc(false);
      setExpr("");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="number"
          value={value}
          placeholder={placeholder || "10000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...S.input, fontSize: 18, fontWeight: 700, flex: 1 }}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setShowCalc(!showCalc)}
          style={{
            width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 8,
            background: showCalc ? "#eff6ff" : "#fff", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, outline: "none",
          }}
          title="電卓"
        >
          🔢
        </button>
      </div>
      {showCalc && (
        <div style={{
          marginTop: 8, padding: "12px 16px", background: "#f8fafc",
          borderRadius: 10, border: "1px solid #e2e8f0",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8" }}>
            計算式を入力（例: 8000*3, 50000/4, 1200+800）
          </p>
          <input
            type="text"
            value={expr}
            placeholder="8000 * 3"
            onChange={(e) => setExpr(e.target.value)}
            style={{ ...S.input, fontSize: 16, fontFamily: "monospace", marginBottom: 8 }}
          />
          {expr && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize: 20, fontWeight: 700,
                color: result != null ? "#1d4ed8" : "#dc2626",
              }}>
                {result != null ? `= ¥${fmt(result)}` : "計算できません"}
              </span>
              {result != null && result > 0 && (
                <button
                  type="button"
                  onClick={applyResult}
                  style={{
                    ...S.btnPrimary, padding: "8px 16px", fontSize: 13,
                  }}
                >
                  この金額を入力
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "24px 28px",
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={S.btnSecondary} onClick={onCancel}>
            キャンセル
          </button>
          <button
            style={{ ...S.btnPrimary, background: "#ef4444" }}
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
