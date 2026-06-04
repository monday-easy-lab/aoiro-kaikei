import { ACCOUNTS, fmt } from "../lib/accounts.js";
import { calcBalances, calcPL } from "../lib/calc.js";
import { S } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

export default function BalanceSheet({ entries, opening }) {
  const openingBal = opening || {};
  const hasOpening = Object.keys(openingBal).length > 0;
  const bal = calcBalances(entries, openingBal);
  const { netIncome } = calcPL(entries);

  // ── 資産の部（事業主貸を含む：公式BS様式準拠）──
  const assetRows = ACCOUNTS.asset
    .map((a) => ({
      ...a,
      opening: openingBal[a.code] || 0,
      closing: bal[a.code] || 0,
    }))
    .filter((r) => r.opening !== 0 || r.closing !== 0);
  const totalAssetsOpening = ACCOUNTS.asset.reduce(
    (s, a) => s + (openingBal[a.code] || 0),
    0,
  );
  const totalAssetsClosing = ACCOUNTS.asset.reduce(
    (s, a) => s + (bal[a.code] || 0),
    0,
  );

  // ── 負債の部（事業主借を含む）──
  const liabRows = ACCOUNTS.liability
    .map((a) => ({
      ...a,
      opening: openingBal[a.code] || 0,
      closing: bal[a.code] || 0,
    }))
    .filter((r) => r.opening !== 0 || r.closing !== 0);
  const totalLiabOpening = ACCOUNTS.liability.reduce(
    (s, a) => s + (openingBal[a.code] || 0),
    0,
  );
  const totalLiabClosing = ACCOUNTS.liability.reduce(
    (s, a) => s + (bal[a.code] || 0),
    0,
  );

  // ── 資本の部 ──
  const motoirekinOpening = openingBal["301"] || 0;
  const motoirekinClosing = bal["301"] || 0;

  // 期末の資本合計 = 負債・資本合計が資産と一致するように計算
  // 資産合計 = 負債合計 + 元入金 + 青色申告特別控除前の所得金額
  // （公式BS様式: 元入金 + 所得金額 を資本側に表示）
  const capitalTotalOpening = motoirekinOpening;
  const capitalTotalClosing = motoirekinClosing + netIncome;

  const grandTotalOpening = totalLiabOpening + capitalTotalOpening;
  const grandTotalClosing = totalLiabClosing + capitalTotalClosing;

  // 貸借チェック
  const diff = Math.abs(totalAssetsClosing - grandTotalClosing);

  const thStyle = { ...S.th, textAlign: "right" };
  const tdRight = { ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <div>
      <SectionTitle icon="⚖️" title="貸借対照表" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* ── 資産の部 ── */}
        <div style={S.card}>
          <h3 style={{ ...S.cardTitle, color: "#2563eb" }}>資産の部</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>科目</th>
                {hasOpening && <th style={thStyle}>期首</th>}
                <th style={thStyle}>期末</th>
              </tr>
            </thead>
            <tbody>
              {assetRows.map((r) => (
                <tr key={r.code} style={S.tr}>
                  <td style={S.td}>{r.name}</td>
                  {hasOpening && <td style={tdRight}>¥{fmt(r.opening)}</td>}
                  <td style={tdRight}>¥{fmt(r.closing)}</td>
                </tr>
              ))}
              <tr style={S.totalRow}>
                <td style={S.td}>資産合計</td>
                {hasOpening && (
                  <td style={{ ...tdRight, fontWeight: 700 }}>
                    ¥{fmt(totalAssetsOpening)}
                  </td>
                )}
                <td style={{ ...tdRight, fontWeight: 700 }}>
                  ¥{fmt(totalAssetsClosing)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 負債・資本の部 ── */}
        <div style={S.card}>
          <h3 style={{ ...S.cardTitle, color: "#7c3aed" }}>負債・資本の部</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>科目</th>
                {hasOpening && <th style={thStyle}>期首</th>}
                <th style={thStyle}>期末</th>
              </tr>
            </thead>
            <tbody>
              {liabRows.map((r) => (
                <tr key={r.code} style={S.tr}>
                  <td style={S.td}>{r.name}</td>
                  {hasOpening && <td style={tdRight}>¥{fmt(r.opening)}</td>}
                  <td style={tdRight}>¥{fmt(r.closing)}</td>
                </tr>
              ))}
              <tr style={{ ...S.tr, borderTop: "1px solid #e2e8f0" }}>
                <td style={{ ...S.td, fontWeight: 600 }}>元入金</td>
                {hasOpening && (
                  <td style={tdRight}>¥{fmt(motoirekinOpening)}</td>
                )}
                <td style={tdRight}>¥{fmt(motoirekinClosing)}</td>
              </tr>
              <tr style={S.tr}>
                <td style={{ ...S.td, fontWeight: 600 }}>
                  控除前所得金額
                </td>
                {hasOpening && <td style={tdRight}>—</td>}
                <td
                  style={{
                    ...tdRight,
                    color: netIncome >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  ¥{fmt(netIncome)}
                </td>
              </tr>
              <tr style={S.totalRow}>
                <td style={S.td}>負債・資本合計</td>
                {hasOpening && (
                  <td style={{ ...tdRight, fontWeight: 700 }}>
                    ¥{fmt(grandTotalOpening)}
                  </td>
                )}
                <td style={{ ...tdRight, fontWeight: 700 }}>
                  ¥{fmt(grandTotalClosing)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 資本の内訳（参考情報）── */}
      <div style={{ ...S.card, background: "#faf5ff", marginTop: 4 }}>
        <h3 style={{ ...S.cardTitle, color: "#7c3aed", fontSize: 13 }}>
          資本の内訳（参考）
        </h3>
        <table style={S.table}>
          <tbody>
            <tr style={S.tr}>
              <td style={S.td}>元入金</td>
              <td style={tdRight}>¥{fmt(motoirekinClosing)}</td>
            </tr>
            <tr style={S.tr}>
              <td style={S.td}>当期利益</td>
              <td style={tdRight}>¥{fmt(netIncome)}</td>
            </tr>
            <tr style={S.tr}>
              <td style={S.td}>事業主貸（−）</td>
              <td style={{ ...tdRight, color: "#dc2626" }}>
                −¥{fmt(bal["104"] || 0)}
              </td>
            </tr>
            <tr style={S.tr}>
              <td style={S.td}>事業主借（+）</td>
              <td style={{ ...tdRight, color: "#059669" }}>
                +¥{fmt(bal["203"] || 0)}
              </td>
            </tr>
            <tr style={S.totalRow}>
              <td style={{ ...S.td, fontWeight: 700 }}>
                翌期繰越元入金
              </td>
              <td style={{ ...tdRight, fontWeight: 700 }}>
                ¥{fmt(
                  (motoirekinClosing) +
                    netIncome -
                    (bal["104"] || 0) +
                    (bal["203"] || 0),
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>
          ※ 年度締めを行うと、翌期繰越元入金が翌年の期首元入金になります。
        </p>
      </div>

      {diff > 1 && (
        <div
          style={{
            ...S.card,
            background: "#fef2f2",
            borderColor: "#fca5a5",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>
            ⚠ 貸借が一致していません（差額: ¥{fmt(diff)}
            ）。仕訳を確認してください。
          </p>
        </div>
      )}
    </div>
  );
}
