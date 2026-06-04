import { fmt } from "../lib/accounts.js";
import { S } from "../styles.js";

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
