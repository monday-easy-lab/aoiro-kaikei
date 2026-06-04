import { fmt } from "../lib/accounts.js";
import {
  calcPL,
  basicDeductionIncomeTax,
  basicDeductionResidentTax,
  calcIncomeTax,
} from "../lib/calc.js";
import { S } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

export default function TaxCalc({ entries, deductionType, fy }) {
  const { netIncome } = calcPL(entries);

  // 青色申告特別控除
  const deductionMax =
    deductionType === "65"
      ? 650000
      : deductionType === "55"
        ? 550000
        : 100000;
  const deductionLabel =
    deductionType === "65" ? "65万" : deductionType === "55" ? "55万" : "10万";
  const aoiroDeduction = Math.min(Math.max(netIncome, 0), deductionMax);
  const taxableBusinessIncome = Math.max(0, netIncome - aoiroDeduction);

  // ── 所得税 ──
  const basicDedIT = basicDeductionIncomeTax(fy, taxableBusinessIncome);
  const taxableIncomeIT = Math.max(0, taxableBusinessIncome - basicDedIT);
  const incomeTax = calcIncomeTax(taxableIncomeIT);
  const reconstructionTax = Math.floor(incomeTax * 0.021);
  const totalIncomeTax = incomeTax + reconstructionTax;

  // ── 住民税（基礎控除43万、均等割5,000円）──
  const basicDedRT = basicDeductionResidentTax(taxableBusinessIncome);
  const taxableIncomeRT = Math.max(0, taxableBusinessIncome - basicDedRT);
  const residentTaxShotoku = Math.floor(taxableIncomeRT * 0.1);
  // 均等割: 道府県民税1,000 + 市町村民税3,000 + 森林環境税1,000 = 5,000
  const residentTaxKintou = taxableIncomeRT > 0 ? 5000 : 0;
  const totalResidentTax = residentTaxShotoku + residentTaxKintou;

  const grandTotal = totalIncomeTax + totalResidentTax;

  // 控除条件
  const deductionInfo = {
    "65": {
      label: "65万円控除",
      conds: [
        "複式簿記で記帳",
        "貸借対照表・損益計算書を添付",
        "e-Taxで電子申告 または 電子帳簿保存",
        "申告期限内に提出",
      ],
      color: "#059669",
    },
    "55": {
      label: "55万円控除",
      conds: [
        "複式簿記で記帳",
        "貸借対照表・損益計算書を添付",
        "申告期限内に提出",
        "※ e-Tax未使用・紙提出の場合",
      ],
      color: "#d97706",
    },
    "10": {
      label: "10万円控除",
      conds: ["簡易簿記で記帳", "損益計算書を添付"],
      color: "#6b7280",
    },
  };
  const info = deductionInfo[deductionType];

  // 基礎控除の解説
  const basicDedNote =
    fy <= 2024
      ? "48万円（令和6年分以前）"
      : fy <= 2026
        ? `${fmt(basicDedIT)}円（令和${fy - 2018}年分：所得に応じた特例加算込み）`
        : `${fmt(basicDedIT)}円（令和${fy - 2018}年分）`;

  return (
    <div>
      <SectionTitle icon="🧮" title="所得税の概算計算" />

      <div
        style={{
          ...S.card,
          background:
            deductionType === "65"
              ? "#f0fdf4"
              : deductionType === "55"
                ? "#fffbeb"
                : "#f8fafc",
          borderColor: info.color + "40",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 13,
            fontWeight: 700,
            color: info.color,
          }}
        >
          📋 {info.label}の適用条件
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.8,
          }}
        >
          {info.conds.map((c, i) => (
            <span key={c}>
              {i > 0 && <br />}
              {c.startsWith("※") ? (
                <span style={{ color: "#94a3b8" }}>{c}</span>
              ) : (
                <>✅ {c}</>
              )}
            </span>
          ))}
        </p>
      </div>

      <div style={S.card}>
        <table style={S.table}>
          <tbody>
            {[
              ["事業収入 − 経費", `¥${fmt(netIncome)}`],
              [
                `青色申告特別控除（${deductionLabel}円）`,
                `−¥${fmt(aoiroDeduction)}`,
              ],
              ["事業所得", `¥${fmt(taxableBusinessIncome)}`],
              [
                `基礎控除（${basicDedNote}）`,
                `−¥${fmt(basicDedIT)}`,
              ],
              ["課税所得金額（所得税）", `¥${fmt(taxableIncomeIT)}`],
            ].map(([l, v], i) => (
              <tr key={l} style={i === 4 ? S.totalRow : S.tr}>
                <td style={S.td}>{l}</td>
                <td
                  style={{
                    ...S.td,
                    textAlign: "right",
                    fontWeight: i === 4 ? 700 : 400,
                  }}
                >
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          ...S.card,
          background: "linear-gradient(135deg, #eff6ff, #f0f9ff)",
        }}
      >
        <h3 style={{ ...S.cardTitle, color: "#1d4ed8" }}>納税額の目安</h3>
        <table style={S.table}>
          <tbody>
            <tr style={S.tr}>
              <td style={S.td}>所得税</td>
              <td style={{ ...S.td, textAlign: "right" }}>
                ¥{fmt(incomeTax)}
              </td>
            </tr>
            <tr style={S.tr}>
              <td style={S.td}>復興特別所得税（2.1%）</td>
              <td style={{ ...S.td, textAlign: "right" }}>
                ¥{fmt(reconstructionTax)}
              </td>
            </tr>
            <tr style={S.totalRow}>
              <td style={S.td}>所得税 合計</td>
              <td
                style={{
                  ...S.td,
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1d4ed8",
                }}
              >
                ¥{fmt(totalIncomeTax)}
              </td>
            </tr>
            <tr style={S.tr}>
              <td style={S.td}>
                住民税 所得割（10%）
                <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>
                  基礎控除43万円で計算
                </span>
              </td>
              <td style={{ ...S.td, textAlign: "right" }}>
                ¥{fmt(residentTaxShotoku)}
              </td>
            </tr>
            <tr style={S.tr}>
              <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>
                住民税 均等割（道府県1,000+市町村3,000+森林環境税1,000）
              </td>
              <td
                style={{ ...S.td, textAlign: "right", fontSize: 12, color: "#64748b" }}
              >
                ¥{fmt(residentTaxKintou)}
              </td>
            </tr>
            <tr style={S.totalRow}>
              <td style={S.td}>年間納税額 概算</td>
              <td
                style={{
                  ...S.td,
                  textAlign: "right",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#dc2626",
                }}
              >
                ¥{fmt(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {grandTotal > 0 && (
        <div
          style={{ ...S.card, background: "#fffbeb", borderColor: "#fbbf24" }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
            💡 毎月 約<strong>¥{fmt(Math.ceil(grandTotal / 12))}</strong>{" "}
            を納税用に積み立てておくと安心です
          </p>
        </div>
      )}
      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
        ※
        社会保険料控除、生命保険料控除、配偶者控除、医療費控除、個人事業税等は含まれていません。実際の税額とは異なります。
        <br />※ 住民税の基礎控除は所得税と異なり43万円（改正なし）で計算しています。
        均等割は自治体により異なる場合があります。
      </p>
    </div>
  );
}
