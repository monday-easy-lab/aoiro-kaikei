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
  { id: "settings", label: "設定", icon: "⚙️" },
];

// Mobile bottom nav
const BOTTOM_TABS = [
  { id: "dashboard", label: "ホーム", icon: "🏠" },
  { id: "easy", label: "入力", icon: "➕" },
  { id: "ledger", label: "仕訳", icon: "📒" },
  { id: "reports", label: "集計", icon: "📊" },
  { id: "settings", label: "設定", icon: "⚙️" },
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
  const activeBottomTab = ["summary", "pl", "bs", "tax"].includes(tab) ? "reports" : tab;

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
