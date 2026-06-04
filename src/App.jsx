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
};

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
      // migrate old boolean deduction65
      if (s.deduction65 !== undefined && s.deductionType === undefined) {
        s.deductionType = s.deduction65 ? "65" : "10";
        delete s.deduction65;
      }
      // ensure openingBalances exists
      if (!s.openingBalances) s.openingBalances = {};
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
    () =>
      entries.filter(
        (e) => Number(e.date?.split("-")[0]) === settings.fy,
      ),
    [entries, settings.fy],
  );

  const opening = settings.openingBalances?.[settings.fy] || {};

  if (loading)
    return (
      <div style={S.loadWrap}>
        <div style={S.loadSpin} />
        <p style={{ color: "#6b7280", marginTop: 16, fontFamily: FONT }}>
          読み込み中...
        </p>
      </div>
    );

  return (
    <div style={S.root}>
      <header style={S.header}>
        <div style={S.headerInner}>
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
        </div>
      </header>

      <nav style={S.nav}>
        <div style={S.navScroll}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setEditId(null);
              }}
              style={{
                ...S.navBtn,
                ...(tab === t.id ? S.navBtnActive : {}),
              }}
            >
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main style={S.main}>
        {tab === "dashboard" && (
          <Dashboard entries={fyEntries} fy={settings.fy} opening={opening} />
        )}
        {tab === "easy" && (
          <EasyEntry entries={entries} persist={persist} fy={settings.fy} />
        )}
        {tab === "journal" && (
          <JournalEntry
            entries={entries}
            persist={persist}
            fy={settings.fy}
            editId={editId}
            setEditId={setEditId}
          />
        )}
        {tab === "ledger" && (
          <Ledger
            entries={fyEntries}
            onEdit={(id) => {
              setEditId(id);
              setTab("journal");
            }}
            onDelete={(id) => persist(entries.filter((e) => e.id !== id))}
          />
        )}
        {tab === "summary" && <AccountSummary entries={fyEntries} />}
        {tab === "pl" && <ProfitLoss entries={fyEntries} anbunRates={settings.anbunRates} />}
        {tab === "bs" && (
          <BalanceSheet entries={fyEntries} opening={opening} />
        )}
        {tab === "tax" && (
          <TaxCalc
            entries={fyEntries}
            deductionType={settings.deductionType}
            fy={settings.fy}
            anbunRates={settings.anbunRates}
          />
        )}
        {tab === "settings" && (
          <SettingsPage
            settings={settings}
            persistSettings={persistSettings}
            entries={entries}
            persist={persist}
            fyEntries={fyEntries}
          />
        )}
      </main>

      <footer style={S.footer}>
        <p>
          ※
          本ソフトは簡易的な会計補助ツールです。正式な確定申告には税理士にご相談ください。
        </p>
      </footer>
    </div>
  );
}
