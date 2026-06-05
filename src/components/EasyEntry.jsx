import { useState } from "react";
import { getAccountName, getAccountType, makeId } from "../lib/accounts.js";
import { S, FONT } from "../styles.js";
import { SectionTitle } from "./ui.jsx";

// ── 支払方法 → 貸方コード ──
const PAY_METHODS = [
  { key: "bank", label: "🏦 銀行振込", code: "102" },
  { key: "cash", label: "💵 現金", code: "101" },
  { key: "credit", label: "💳 クレカ", code: "205" },
  { key: "emoney", label: "📱 電子マネー", code: "107" },
  { key: "personal", label: "🙋 個人立替", code: "203" },
];

// ── カテゴリ定義（ステップ1で表示）──
const CATEGORIES = [
  {
    key: "revenue", label: "売上", icon: "💰", color: "#059669",
    desc: "入金・請求・売掛金の回収",
    items: [
      { label: "売上が入金された（銀行振込）", debit: "102", credit: "401", icon: "💰", desc: "クライアントから振込があった" },
      { label: "売上が入金された（現金）", debit: "101", credit: "401", icon: "💵", desc: "現金で売上を受け取った" },
      { label: "売上を請求した（まだ未入金）", debit: "103", credit: "401", icon: "📄", desc: "請求書を出した（売掛金）" },
      { label: "売掛金が回収できた", debit: "102", credit: "103", icon: "✅", desc: "請求していたお金が振り込まれた" },
      { label: "雑収入があった", debit: "102", credit: "402", icon: "🎁", desc: "助成金・還付金・ポイント換金など" },
    ],
  },
  {
    key: "expense", label: "経費", icon: "🛒", color: "#dc2626",
    desc: "仕入・外注・家賃・通信費など",
    items: [
      { label: "仕入をした", debit: "501", credit: "102", icon: "📦", desc: "商品・材料を仕入れた" },
      { label: "外注費を払った", debit: "502", credit: "102", icon: "🤝", desc: "外部への業務委託費" },
      { label: "家賃を払った", debit: "504", credit: "102", icon: "🏠", desc: "事務所・作業場の家賃" },
      { label: "水道光熱費を払った", debit: "505", credit: "102", icon: "💡", desc: "電気・ガス・水道代" },
      { label: "交通費を使った", debit: "506", credit: "101", icon: "🚃", desc: "電車・バス・タクシー代" },
      { label: "通信費を払った", debit: "507", credit: "102", icon: "📱", desc: "携帯・ネット・サーバー代" },
      { label: "広告費を払った", debit: "508", credit: "102", icon: "📣", desc: "Google広告・SNS広告など" },
      { label: "接待交際費を使った", debit: "509", credit: "101", icon: "🍺", desc: "打合せ飲食・お土産など" },
      { label: "消耗品を買った", debit: "510", credit: "101", icon: "🖊️", desc: "文房具・日用品など（10万円未満）" },
      { label: "手数料を払った", debit: "513", credit: "102", icon: "🏦", desc: "振込手数料・決済手数料" },
      { label: "税金を払った（租税公課）", debit: "514", credit: "102", icon: "🏛️", desc: "個人事業税・印紙税など" },
      { label: "保険料を払った", debit: "515", credit: "102", icon: "🛡️", desc: "事業用の保険料" },
      { label: "書籍・資料を買った", debit: "518", credit: "101", icon: "📚", desc: "参考書・技術書など" },
      { label: "ソフトウェア利用料を払った", debit: "523", credit: "102", icon: "💻", desc: "Unity/Adobe/ChatGPT/サーバー等" },
      { label: "会議費を使った", debit: "521", credit: "101", icon: "☕", desc: "打合せカフェ代・会議室代" },
      { label: "荷造運賃を払った", debit: "520", credit: "102", icon: "📬", desc: "宅配便・郵送料" },
      { label: "車両費を払った", debit: "522", credit: "102", icon: "🚗", desc: "ガソリン・駐車場・車検代" },
      { label: "その他の経費", debit: "512", credit: "102", icon: "📝", desc: "上記に当てはまらない経費" },
    ],
  },
  {
    key: "transfer", label: "資金移動", icon: "🏦", color: "#2563eb",
    desc: "現金引出・クレカ引落・チャージ",
    items: [
      { label: "預金から現金を引き出した", debit: "101", credit: "102", icon: "🏧", desc: "ATMで事業用現金を引き出し" },
      { label: "現金を預金に預けた", debit: "102", credit: "101", icon: "🏦", desc: "事業用現金を口座に入金" },
      { label: "クレカの引き落とし", debit: "205", credit: "102", icon: "💳", desc: "クレジットカード利用分が口座から引落" },
      { label: "電子マネーにチャージ", debit: "107", credit: "102", icon: "📱", desc: "PayPay・Suica等に銀行口座からチャージ" },
    ],
  },
  {
    key: "living", label: "生活費", icon: "🏧", color: "#7c3aed",
    desc: "個人の財布から支出・入金",
    items: [
      { label: "生活費を引き出した", debit: "104", credit: "102", icon: "🏧", desc: "事業口座→生活費（事業主貸）" },
      { label: "個人のお金を事業口座に入れた", debit: "102", credit: "203", icon: "💰", desc: "個人口座→事業口座への入金" },
    ],
  },
  {
    key: "asset", label: "固定資産", icon: "🖥️", color: "#0891b2",
    desc: "備品購入・減価償却",
    items: [
      { label: "10万円以上の備品を買った", debit: "105", credit: "102", icon: "🖥️", desc: "PC・カメラ・機材など（工具器具備品）" },
      { label: "車両を購入した", debit: "106", credit: "102", icon: "🚙", desc: "事業用自動車の取得" },
      { label: "減価償却を計上した（備品）", debit: "511", credit: "105", icon: "📉", desc: "工具器具備品の減価償却", cashless: true },
      { label: "減価償却を計上した（車両）", debit: "511", credit: "106", icon: "📉", desc: "車両運搬具の減価償却", cashless: true },
    ],
  },
  {
    key: "closing", label: "決算", icon: "📊", color: "#64748b",
    desc: "年末の決算整理仕訳",
    items: [
      { label: "未払いの経費を計上", debit: "512", credit: "202", icon: "📋", desc: "年末時点で未払いの経費（未払金）" },
      { label: "前払い費用を計上", debit: "104", credit: "102", icon: "📅", desc: "翌年分を前払い（事業主貸へ振替）" },
    ],
  },
];

function showPayMethodSelector(item) {
  if (item.cashless) return false;
  const dt = getAccountType(item.debit);
  return dt === "expense" || item.debit === "105" || item.debit === "106";
}

export default function EasyEntry({ entries, persist, fy }) {
  const today = `${fy}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const [category, setCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState("");
  const [payMethod, setPayMethod] = useState("bank");

  const handleSubmit = () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!date || !Number.isFinite(amt) || amt <= 0) {
      setMsg("⚠ 日付と金額を入力してください");
      return;
    }
    let creditCode = selected.credit;
    if (showPayMethodSelector(selected)) {
      const pm = PAY_METHODS.find((p) => p.key === payMethod);
      if (pm) creditCode = pm.code;
    }
    persist([
      ...entries,
      { id: makeId(), date, debitCode: selected.debit, creditCode, amount: amt, memo: memo || selected.desc },
    ]);
    setMsg("✓ 登録しました！");
    setAmount(""); setMemo(""); setSelected(null);
    setTimeout(() => setMsg(""), 2500);
  };

  const handleBack = () => {
    if (selected) { setSelected(null); }
    else { setCategory(null); }
  };

  // ── ステップ1: カテゴリ選択 ──
  if (!category) {
    return (
      <div>
        <SectionTitle icon="🎯" title="かんたん入力" />
        <p style={{ color: "#64748b", fontSize: 13, marginTop: -12, marginBottom: 20 }}>
          まず、何をしましたか？
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "24px 16px", border: "2px solid #e2e8f0", borderRadius: 16,
                background: "#fff", cursor: "pointer", fontFamily: FONT,
                transition: "all 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ fontSize: 36 }}>{cat.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.label}</span>
              <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>{cat.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ステップ2: テンプレート選択 ──
  if (!selected) {
    return (
      <div>
        <SectionTitle icon={category.icon} title={category.label} />
        <button onClick={handleBack} style={{ ...S.btnSecondary, marginBottom: 16, fontSize: 13 }}>← カテゴリに戻る</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
          {category.items.map((item) => (
            <button key={item.label} onClick={() => setSelected(item)} style={S.easyCard}>
             <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ステップ3: 金額入力 ──
  return (
    <div>
      <SectionTitle icon="🎯" title="かんたん入力" />
      <div style={S.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#f0f9ff", borderRadius: 10 }}>
          <span style={{ fontSize: 28 }}>{selected.icon}</span>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{selected.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
              {getAccountName(selected.debit)} ／ {getAccountName(selected.credit)}
            </p>
          </div>
        </div>

        {selected.cashless && (
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#64748b" }}>
            💡 減価償却はお金の移動がない帳簿上の処理です
          </div>
        )}

        <div style={S.formGrid}>
          <div style={S.formGroup}>
            <label style={S.label}>日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={S.input} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>金額（円）</label>
            <input type="number" value={amount} placeholder="10000" onChange={(e) => setAmount(e.target.value)} style={{ ...S.input, fontSize: 18, fontWeight: 700 }} autoFocus />
          </div>
          {showPayMethodSelector(selected) && (
            <div style={{ ...S.formGroup, gridColumn: "1 / -1" }}>
              <label style={S.label}>支払方法</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PAY_METHODS.map((pm) => (
                  <button type="button" key={pm.key} onClick={() => setPayMethod(pm.key)}
                    style={{ ...S.payBtn, ...(payMethod === pm.key ? S.payBtnActive : {}) }}>
                    {pm.label}
                  </button>
                ))}
              </div>
              {(payMethod === "credit" || payMethod === "personal") && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
                  {payMethod === "credit"
                    ? "※ 引落日に再入力する必要はありません。引落時は「資金移動→クレカの引き落とし」で処理します。"
                    : <>※ 個人のお金で事業の支払いをした場合に選択します。<br />💡 個人口座と事業口座が同じ場合は「銀行振込」を選んでください。</>}
                </p>
              )}
            </div>
          )}
          <div style={{ ...S.formGroup, gridColumn: "1 / -1" }}>
            <label style={S.label}>メモ（任意）</label>
            <input type="text" value={memo} placeholder={selected.desc} onChange={(e) => setMemo(e.target.value)} style={S.input} />
          </div>
        </div>
        <div style={S.formActions}>
          <button style={S.btnSecondary} onClick={handleBack}>← 戻る</button>
          <button style={S.btnPrimary} onClick={handleSubmit}>登録する</button>
        </div>
        {msg && <p style={{ ...S.msg, color: msg.startsWith("⚠") ? "#dc2626" : "#059669" }}>{msg}</p>}
      </div>
    </div>
  );
}
