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

const CALC_BTNS = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", "00", ".", "+"],
  ["C", "⌫", "", "="],
];

export function AmountInput({ value, onChange, placeholder }) {
  const [showCalc, setShowCalc] = useState(false);
  const [expr, setExpr] = useState("");
  const [computed, setComputed] = useState(null);

  const display = expr || "0";

  const handleBtn = (btn) => {
    if (btn === "C") {
      setExpr("");
      setComputed(null);
      return;
    }
    if (btn === "⌫") {
      setExpr((e) => e.slice(0, -1));
      setComputed(null);
      return;
    }
    if (btn === "=") {
      const op = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      const r = safeEval(op);
      if (r != null) setComputed(r);
      return;
    }
    setComputed(null);
    setExpr((e) => e + btn);
  };

  const applyResult = () => {
    const val = computed != null ? computed : safeEval(expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"));
    if (val != null && val > 0) {
      onChange(String(val));
      setShowCalc(false);
      setExpr("");
      setComputed(null);
    }
  };

  const btnStyle = (btn) => ({
    padding: "12px 0", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: btn === "⌫" ? 16 : 18, fontWeight: 600, cursor: "pointer",
    fontFamily: FONT, outline: "none",
    background: "÷×−+".includes(btn) ? "#eff6ff" : btn === "=" ? "#1d4ed8" : btn === "C" || btn === "⌫" ? "#fef2f2" : "#fff",
    color: btn === "=" ? "#fff" : "÷×−+".includes(btn) ? "#1d4ed8" : btn === "C" || btn === "⌫" ? "#dc2626" : "#1e293b",
  });

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
          onClick={() => { setShowCalc(!showCalc); setExpr(""); setComputed(null); }}
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
          marginTop: 8, padding: "12px", background: "#f8fafc",
          borderRadius: 12, border: "1px solid #e2e8f0",
        }}>
          <div style={{
            padding: "10px 14px", background: "#fff", borderRadius: 8,
            border: "1px solid #e2e8f0", marginBottom: 8, textAlign: "right",
            minHeight: 48, display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", fontFamily: "monospace" }}>
              {display}
            </p>
            {computed != null && (
              <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace" }}>
                = {fmt(computed)}
              </p>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {CALC_BTNS.flat().map((btn, i) =>
              btn === "" ? <div key={i} /> : (
                <button key={i} type="button" onClick={() => handleBtn(btn)} style={btnStyle(btn)}>
                  {btn}
                </button>
              )
            )}
          </div>
          {(computed != null || safeEval(expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")) != null) && (
            <button
              type="button"
              onClick={applyResult}
              style={{
                ...S.btnPrimary, width: "100%", marginTop: 8, padding: "10px",
                fontSize: 14,
              }}
            >
              この金額を入力
            </button>
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
