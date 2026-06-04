import { useMemo } from "react";
import { fmt, currentFY } from "../lib/accounts.js";
import { calcPL, calcBalances } from "../lib/calc.js";
import { S } from "../styles.js";
import { SectionTitle, DashCard } from "./ui.jsx";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Dashboard({ entries, fy, opening }) {
  const monthlyData = useMemo(
    () =>
      MONTHS.map((m) => {
        const me = entries.filter(
          (e) => Number(e.date?.split("-")[1]) === m,
        );
        const pl = calcPL(me);
        return {
          month: m,
          revenue: pl.totalRevenue,
          expense: pl.totalExpense,
          profit: pl.netIncome,
          count: me.length,
        };
      }),
    [entries],
  );

  const ytd = calcPL(entries);
  const balances = calcBalances(entries, opening);
  const cashBalance = balances["101"] || 0;
  const bankBalance = balances["102"] || 0;
  const totalCash = cashBalance + bankBalance;
  const receivables = balances["103"] || 0;

  const isPastFY = fy < currentFY();
  const now = new Date();
  const currentMonth =
    isPastFY ? 0 : now.getFullYear() === fy ? now.getMonth() + 1 : 0;
  const cm = currentMonth > 0 ? monthlyData[currentMonth - 1] : null;

  const maxVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.revenue, d.expense)),
    1,
  );

  return (
    <div>
      <SectionTitle
        icon="📊"
        title={isPastFY ? `${fy}年度 実績` : "ダッシュボード"}
      />
      <div style={S.dashGrid}>
        <DashCard
          label="💰 手元資金"
          value={totalCash}
          color="#059669"
          sub={`現金 ¥${fmt(cashBalance)} ／ 預金 ¥${fmt(bankBalance)}`}
        />
        <DashCard label="📈 年間売上" value={ytd.totalRevenue} color="#2563eb" />
        <DashCard label="📉 年間経費" value={ytd.totalExpense} color="#dc2626" />
        <DashCard
          label="✨ 年間利益"
          value={ytd.netIncome}
          color={ytd.netIncome >= 0 ? "#059669" : "#dc2626"}
        />
      </div>

      {receivables > 0 && (
        <div
          style={{ ...S.card, background: "#fffbeb", borderColor: "#fbbf24" }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
            💡 未回収の売掛金が <strong>¥{fmt(receivables)}</strong> あります
          </p>
        </div>
      )}

      {cm && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>{currentMonth}月のまとめ</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              textAlign: "center",
            }}
          >
            {[
              ["売上", cm.revenue, "#2563eb"],
              ["経費", cm.expense, "#dc2626"],
              ["利益", cm.profit, cm.profit >= 0 ? "#059669" : "#dc2626"],
            ].map(([l, v, c]) => (
              <div key={l}>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{l}</p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 18,
                    fontWeight: 700,
                    color: c,
                  }}
                >
                  ¥{fmt(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={S.card}>
        <h3 style={S.cardTitle}>月次推移</h3>
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "flex-end",
            height: 140,
            padding: "0 4px",
          }}
        >
          {monthlyData.map((d) => {
            const revH = maxVal > 0 ? (d.revenue / maxVal) * 110 : 0;
            const expH = maxVal > 0 ? (d.expense / maxVal) * 110 : 0;
            const isActive = isPastFY || d.month <= currentMonth;
            return (
              <div
                key={d.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-end",
                    height: 110,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: revH,
                      background: isActive ? "#3b82f6" : "#e2e8f0",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s",
                    }}
                  />
                  <div
                    style={{
                      width: 8,
                      height: expH,
                      background: isActive ? "#f87171" : "#f1f5f9",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "#475569" : "#cbd5e1",
                  }}
                >
                  {d.month}月
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 11, color: "#6b7280" }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: "#3b82f6",
                borderRadius: 2,
                marginRight: 4,
              }}
            />
            売上
          </span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: "#f87171",
                borderRadius: 2,
                marginRight: 4,
              }}
            />
            経費
          </span>
        </div>
      </div>
    </div>
  );
}
