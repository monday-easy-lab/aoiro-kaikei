import { useState, useEffect, useCallback, useMemo } from "react";
import { currentFY } from "./lib/accounts.js";
import { loadData, saveData } from "./lib/storage.js";
import { S, FONT } from "./styles.js";

import Dashboard from "./components/Dashboard.jsx";
import EasyEntry from "./components/EasyEntry.jsx";
import JournalEntry from "./components/JournalEntry.jsx";
import Ledger from "./components/Ledger.jsx";
import AccountSummary from "./components/AccountSummary.jsx";
import ProfitLoss from "./components/ProfitLoss.jsx";
import BalanceSheet from "./components/BalanceSheet.jsx";
import TaxCalc from "./components/TaxCalc.jsx";
import SettingsPage from "./components/SettingsPage.jsx";

const DEFAULT_SETTINGS = {
  fy: currentFY(),
  name: "",
  deductionType: "65",
  openingBalances: {},
  anbunRates: {},
};

// Desktop tabs (top nav)
const TABS = [
  { id: "dashboard", label: "ダッシュボード", icon: "📊" },
  { id: "easy", label: "かんたん入力", icon: "🎯" },
  { id: "journal", label: "仕訳入力", icon: "✏️" },
  { id: "ledger", label: "仕訳帳", icon: "📒" },
  { id: "summary", label: "科目集計", icon: "📋" },
  { id: "pl", label: "損益計算書", icon: "📈" },
  { id: "bs", label: "貸借対照表", icon: "⚖️" },
  { id: "tax", label: "所得税計算", icon: "🧮" },
  { id: "more", label: "その他", icon: "•••" },
];

// Mobile bottom nav
const BOTTOM_TABS = [
  { id: "dashboard", label: "ホーム", icon: "🏠" },
  { id: "easy", label: "入力", icon: "➕" },
  { id: "ledger", label: "仕訳", icon: "📒" },
  { id: "reports", label: "集計", icon: "📊" },
  { id: "more", label: "その他", icon: "•••" },
];

// Reports sub-pages (集計の中身)
const REPORT_ITEMS = [
  { id: "summary", label: "勘定科目別集計", icon: "📋", desc: "科目ごとの借方・貸方・残高", color: "#2563eb" },
  { id: "pl", label: "損益計算書", icon: "📈", desc: "収入・経費・事業所得", color: "#059669" },
  { id: "bs", label: "貸借対照表", icon: "⚖️", desc: "資産・負債・資本の一覧", color: "#7c3aed" },
  { id: "tax", label: "所得税計算", icon: "🧮", desc: "所得税・住民税の概算", color: "#dc2626" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    (async () => {
      const e = await loadData("aoiro-entries", []);
      const s = await loadData("aoiro-settings", DEFAULT_SETTINGS);
      if (s.deduction65 !== undefined && s.deductionType === undefined) {
        s.deductionType = s.deduction65 ? "65" : "10";
        delete s.deduction65;
      }
      if (!s.openingBalances) s.openingBalances = {};
      if (!s.anbunRates) s.anbunRates = {};
      setEntries(e);
      setSettings(s);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback((ne) => {
    setEntries(ne);
    saveData("aoiro-entries", ne);
  }, []);

  const persistSettings = useCallback((s) => {
    setSettings(s);
    saveData("aoiro-settings", s);
  }, []);

  const fyEntries = useMemo(
    () => entries.filter((e) => Number(e.date?.split("-")[0]) === settings.fy),
    [entries, settings.fy],
  );

  const opening = settings.openingBalances?.[settings.fy] || {};

  // Bottom nav maps "reports" to a report selector
  const activeBottomTab = ["summary", "pl", "bs", "tax"].includes(tab) ? "reports"
  : ["settings", "help"].includes(tab) ? "more" : tab;

  const switchTab = (id) => {
    setTab(id);
    setEditId(null);
  };

  if (loading)
    return (
      <div style={S.loadWrap}>
        <div style={S.loadSpin} />
        <p style={{ color: "#6b7280", marginTop: 16, fontFamily: FONT }}>読み込み中...</p>
      </div>
    );

  return (
    <div style={S.root}>
      {/* ── Header ── */}
     <header style={S.header}>
        <div style={{ ...S.headerInner, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={S.logo}>
            <span style={S.logoMark}>帳</span>
            <div>
              <h1 style={S.logoTitle}>青色申告かんたん会計</h1>
              <p style={S.logoSub}>
                {settings.fy}年度（令和{settings.fy - 2018}年）
                {settings.name ? ` ／ ${settings.name}` : ""}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => switchTab("help")}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10,
                width: 40, height: 40, fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", transition: "background 0.15s",
              }}
              title="使い方ガイド"
            >
              ❓
            </button>
            <button
              onClick={() => switchTab("settings")}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10,
                width: 40, height: 40, fontSize: 20, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", transition: "background 0.15s",
              }}
              title="設定"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* ── Desktop Top Nav ── */}
      <nav style={S.nav} className="top-nav">
        <div style={S.navScroll}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{ ...S.navBtn, ...(tab === t.id ? S.navBtnActive : {}) }}
            >
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={S.main} className="main-content">
        {tab === "dashboard" && <Dashboard entries={fyEntries} fy={settings.fy} opening={opening} onNavigate={switchTab} />}
        {tab === "easy" && <EasyEntry entries={entries} persist={persist} fy={settings.fy} />}
        {tab === "journal" && <JournalEntry entries={entries} persist={persist} fy={settings.fy} editId={editId} setEditId={setEditId} />}
        {tab === "ledger" && <Ledger entries={fyEntries} onEdit={(id) => { setEditId(id); setTab("journal"); }} onDelete={(id) => persist(entries.filter((e) => e.id !== id))} />}
        {tab === "reports" && <ReportSelector onSelect={switchTab} />}
        {tab === "summary" && <AccountSummary entries={fyEntries} />}
        {tab === "pl" && <ProfitLoss entries={fyEntries} anbunRates={settings.anbunRates} />}
        {tab === "bs" && <BalanceSheet entries={fyEntries} opening={opening} />}
        {tab === "tax" && <TaxCalc entries={fyEntries} deductionType={settings.deductionType} fy={settings.fy} anbunRates={settings.anbunRates} />}
        {tab === "settings" && <SettingsPage settings={settings} persistSettings={persistSettings} entries={entries} persist={persist} fyEntries={fyEntries} />}
        {tab === "more" && <MoreMenu onSelect={switchTab} />}
        {tab === "help" && <HelpGuide onBack={() => switchTab("more")} />}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="bottom-nav"
        style={{
          display: "none",
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #e2e8f0",
          justifyContent: "space-around", alignItems: "center",
          padding: "6px 0 env(safe-area-inset-bottom, 8px)",
          zIndex: 50,
        }}
      >
        {BOTTOM_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: activeBottomTab === t.id ? "#1d4ed8" : "#94a3b8",
              fontFamily: FONT, fontSize: 10, fontWeight: activeBottomTab === t.id ? 700 : 400,
              padding: "4px 12px", transition: "color 0.15s",
            }}
          >
            <span style={{ fontSize: activeBottomTab === t.id ? 26 : 22, transition: "font-size 0.15s" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <footer style={S.footer}>
  <p>※ 本ソフトは簡易的な会計補助ツールです。正式な確定申告には税理士にご相談ください。</p>
  <p style={{ marginTop: 8 }}>
    <a href="/aoiro-kaikei/blog/" style={{ color: "#6b7280", textDecoration: "underline" }}>
      📝 ブログ ── 個人事業主の会計と経営のヒント
    </a>
  </p>
</footer>
    </div>
  );
}

// ── 集計ページ（モバイルの中継地点 + デスクトップでも使える）──
function ReportSelector({ onSelect }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={S.sectionTitle}><span>📊</span> 集計・レポート</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {REPORT_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "20px 18px", border: "2px solid #e2e8f0", borderRadius: 14,
              background: "#fff", cursor: "pointer", fontFamily: FONT,
              textAlign: "left", transition: "all 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "none"; }}
          >
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: item.color }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function MoreMenu({ onSelect }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={S.sectionTitle}><span>•••</span> その他</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {[
          { id: "help", label: "使い方ガイド", icon: "📖", desc: "入力例・会計ルール・よくある質問", color: "#2563eb" },
          { id: "settings", label: "設定", icon: "⚙️", desc: "年度・按分・データ管理・年度締め", color: "#475569" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "20px 18px", border: "2px solid #e2e8f0", borderRadius: 14,
              background: "#fff", cursor: "pointer", fontFamily: FONT,
              textAlign: "left", transition: "all 0.15s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "none"; }}
          >
            <span style={{ fontSize: 32 }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: item.color }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{item.desc}</p>
            </div>
          </button>
        ))}

      </div>
    </div>
  );
}
function HelpGuide({ onBack }) {
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen(open === id ? null : id);

  const sections = [
    { id: "basic", title: "📖 基本的な使い方", content: [
      "1. 「➕ 入力」からカテゴリを選ぶ（売上・経費・資金移動など）",
      "2. やったことに近いテンプレートを選ぶ",
      "3. 日付・金額・支払方法を入れて「登録する」",
      "4. 借方・貸方は裏側で自動処理されます",
    ]},
    { id: "pay", title: "💳 支払方法の選び方", content: [
      "🏦 銀行振込 → 事業用口座から支払った",
      "💵 現金 → 事業用の現金で支払った",
      "💳 クレカ → 事業用クレジットカードで支払った",
      "📱 電子マネー → PayPay・Suica等で支払った",
      "🙋 個人立替 → 個人のお金・個人カードで支払った",
      "",
      "💡 個人口座と事業口座が同じ場合は「銀行振込」を選んでください。",
    ]},
    { id: "credit", title: "💳 クレカの入力ルール", content: [
      "① 経費発生日: 経費テンプレートで「💳 クレカ」を選んで入力",
      "② 引落日: 「資金移動 → クレカの引き落とし」で入力",
      "",
      "⚠ 経費は使った日に1回だけ入力。引落日に再入力すると二重計上になります。",
      "",
      "個人カードで払った場合は「🙋 個人立替」で入力。引落処理は不要です。",
    ]},
    { id: "examples", title: "📝 よくある入力例", content: [
      "【ChatGPT Plus】経費 → ソフトウェア利用料 → 💳クレカ",
      "【Adobe CC（個人カード）】経費 → ソフトウェア利用料 → 🙋個人立替",
      "【ココナラ売上入金】売上 → 売上が入金された（銀行振込）",
      "【電車代（Suica）】経費 → 交通費を使った → 📱電子マネー",
      "【Suicaチャージ】資金移動 → 電子マネーにチャージ",
      "【Amazon文房具（事業クレカ）】経費 → 消耗品を買った → 💳クレカ",
      "【カフェ打合せ（現金）】経費 → 会議費を使った → 💵現金",
      "【生活費引出】生活費 → 生活費を引き出した",
      "【PC購入（15万円）】固定資産 → 備品を買った → 🏦銀行振込",
      "【年末の減価償却】固定資産 → 減価償却を計上した",
    ]},
    { id: "kaigyou", title: "🚀 開業前の費用", content: [
      "開業前に支払った費用は、開業日の日付で入力します。",
      "",
      "支払方法は「🙋 個人立替」を選択。",
      "メモに「開業準備費（実際の購入日: YYYY/MM/DD）」と記録。",
      "",
      "【例】開業前にAdobe契約 → 経費 → ソフトウェア利用料 → 🙋個人立替",
      "【例】開業前にPC購入（15万） → 固定資産 → 備品を買った → 🙋個人立替",
      "",
      "⚠ 金額が大きい場合は税理士にご相談ください。",
    ]},
    { id: "anbun", title: "🏠 家事按分", content: [
      "自宅兼事務所の家賃やスマホ代など、事業とプライベート両方にかかる費用を分けること。",
      "",
      "設定 → 家事按分 でスライダーを調整するだけ。",
      "日常の入力は全額で入力してOK。",
      "損益計算書と税計算に自動反映されます。",
      "",
      "【目安】家賃: 仕事部屋の面積割合（20〜50%）",
      "【目安】電気代: 仕事時間÷24時間（25〜40%）",
      "【目安】通信費: 仕事利用割合（30〜50%）",
      "",
      "PC等の個別購入品は、事業使用分の金額だけ入力してメモに記録。",
    ]},
    { id: "depreciation", title: "📉 減価償却", content: [
      "10万円以上の事業用資産は、購入年に全額経費にできません。",
      "数年に分けて経費にします。",
      "",
      "【耐用年数の目安】",
      "パソコン: 4年（例: 16万円 → 年4万円）",
      "カメラ: 5年",
      "普通自動車: 6年",
      "軽自動車: 4年",
      "",
      "購入時: 固定資産 → 備品を買った",
      "年末: 固定資産 → 減価償却を計上した（年間償却額を入力）",
      "",
      "10万円未満は「消耗品費」で全額その年の経費にできます。",
    ]},
    { id: "yearend", title: "📅 年度締め", content: [
      "年度末に「設定 → 年度締め」を実行すると:",
      "",
      "・事業主貸・事業主借が元入金に自動振替",
      "・翌年の期首残高（現金・預金・売掛金等）を自動作成",
      "・翌期の元入金 = 元入金 + 利益 + 事業主借 − 事業主貸",
      "",
      "年度締め後に会計年度を翌年に切り替えると、新しい年度で記帳を開始できます。",
    ]},
    { id: "backup", title: "🔒 バックアップ", content: [
      "⚠ データはブラウザ内（localStorage）に保存されます。",
      "ブラウザデータの削除やPC初期化でデータが消えます。",
      "",
      "設定 → バックアップ保存 で定期的にJSONファイルを保存してください。",
      "復元は 設定 → バックアップ復元 から。",
    ]},
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ ...S.btnSecondary, fontSize: 13, padding: "6px 12px" }}>← 戻る</button>
        <h2 style={S.sectionTitle}><span>📖</span> 使い方ガイド</h2>
      </div>
      {sections.map((sec) => (
        <div key={sec.id} style={{ ...S.card, padding: 0, marginBottom: 8, overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => toggle(sec.id)}
            style={{
              width: "100%", padding: "16px 20px", border: "none", background: open === sec.id ? "#f0f9ff" : "#fff",
              cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: 15, fontWeight: 600, color: "#1e293b", fontFamily: FONT, textAlign: "left",
            }}
          >
            <span>{sec.title}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", transition: "transform 0.2s", transform: open === sec.id ? "rotate(180deg)" : "none" }}>▼</span>
          </button>
          {open === sec.id && (
            <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#475569", lineHeight: 1.9 }}>
              {sec.content.map((line, i) => (
                line === "" ? <br key={i} /> : <p key={i} style={{ margin: "2px 0" }}>{line}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}