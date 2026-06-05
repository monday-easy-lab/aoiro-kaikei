import { useState, useRef } from "react";
import { fmt, makeId } from "../lib/accounts.js";
import { calcBalances, calcPL, closeYear, ANBUN_TARGET_ACCOUNTS } from "../lib/calc.js";
import { exportCSV, importCSV, exportBackup, parseBackup } from "../lib/csv.js";
import { S } from "../styles.js";
import { SectionTitle, ConfirmModal } from "./ui.jsx";

export default function SettingsPage({
  settings,
  persistSettings,
  entries,
  persist,
  fyEntries,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [motoirekinAmount, setMotoirekinAmount] = useState("");
  const [motoirekinDate, setMotoirekinDate] = useState(
    `${settings.fy}-01-01`,
  );
  const [motoMsg, setMotoMsg] = useState("");
  const [closeConfirm, setCloseConfirm] = useState(false);
  const fileRef = useRef(null);
  const backupRef = useRef(null);

  const opening = settings.openingBalances?.[settings.fy] || {};
  const hasMotoirekinEntry = entries.some(
    (e) => e.creditCode === "301" || e.debitCode === "301",
  );

  // 元入金の実際の残高（仕訳 or 期首残高から）
  const bal = calcBalances(fyEntries, opening);
  const actualMotoirekin = bal["301"] || 0;

  const showMsg = (setter, msg, ms = 4000) => {
    setter(msg);
    setTimeout(() => setter(""), ms);
  };

  // ── 元入金仕訳の自動作成 ──
  const generateMotoirekin = () => {
    const amt = Number(motoirekinAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      showMsg(setMotoMsg, "⚠ 正しい金額を入力してください");
      return;
    }
    persist([
      ...entries,
      {
        id: makeId(),
        date: motoirekinDate,
        debitCode: "102",
        creditCode: "301",
        amount: amt,
        memo: "開業時元入金",
      },
    ]);
    showMsg(setMotoMsg, "✓ 元入金仕訳を自動作成しました", 3000);
  };

  // ── 年度締め ──
  const handleCloseYear = () => {
    const { netIncome } = calcPL(fyEntries);
    const newOpening = closeYear(bal, netIncome);
    const nextFY = settings.fy + 1;
    const ob = { ...(settings.openingBalances || {}), [nextFY]: newOpening };
    persistSettings({ ...settings, openingBalances: ob });
    setCloseConfirm(false);
    showMsg(
      setImportMsg,
      `✓ ${settings.fy}年度を締め、${nextFY}年度の期首残高を作成しました`,
    );
  };

  // ── CSV ──
  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { newEntries, imported, skipped } = await importCSV(file);
      if (newEntries.length > 0) persist([...entries, ...newEntries]);
      showMsg(
        setImportMsg,
        `✓ ${imported}件をインポート${skipped > 0 ? `（${skipped}件スキップ）` : ""}`,
      );
    } catch {
      showMsg(setImportMsg, "⚠ CSV読み込み失敗");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── バックアップ ──
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseBackup(ev.target.result);
        if (
          !window.confirm(
            `${data.entries.length}件の仕訳データを復元します。現在のデータは上書きされます。よろしいですか？`,
          )
        )
          return;
        persist(data.entries);
        if (data.settings) persistSettings(data.settings);
        showMsg(setImportMsg, "✓ バックアップを復元しました");
      } catch {
        showMsg(setImportMsg, "⚠ バックアップファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    if (backupRef.current) backupRef.current.value = "";
  };

  return (
    <div>
      <SectionTitle icon="⚙️" title="設定" />

      {/* ── 基本設定 ── */}
      <div style={S.card}>
        <div style={S.formGrid}>
          <div style={S.formGroup}>
            <label style={S.label}>事業者名</label>
            <input
              type="text"
              value={settings.name}
              placeholder="山田太郎"
              onChange={(e) =>
                persistSettings({ ...settings, name: e.target.value })
              }
              style={S.input}
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>会計年度</label>
            <select
              value={settings.fy}
              onChange={(e) =>
                persistSettings({ ...settings, fy: Number(e.target.value) })
              }
              style={S.input}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}年（令和{y - 2018}年）
                </option>
              ))}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>青色申告特別控除</label>
            <select
              value={settings.deductionType || "65"}
              onChange={(e) =>
                persistSettings({
                  ...settings,
                  deductionType: e.target.value,
                })
              }
              style={S.input}
            >
              <option value="65">65万円控除（複式簿記＋e-Tax）</option>
              <option value="55">55万円控除（複式簿記・紙提出）</option>
              <option value="10">10万円控除（簡易簿記）</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 元入金 ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>💼 元入金（開業時の事業用資金）</h3>
        {hasMotoirekinEntry || actualMotoirekin !== 0 ? (
          <div
            style={{
              padding: "12px 16px",
              background: "#f0fdf4",
              borderRadius: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#059669" }}>
              ✅ 元入金: ¥{fmt(actualMotoirekin)}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>
              変更する場合は仕訳帳から編集してください
            </p>
          </div>
        ) : (
          <div>
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, marginBottom: 12, fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
              💡 開業時に事業用として用意したお金です。<br />
              💡 わからない場合や、個人口座・個人資金から始めた場合は <strong>0円のままで大丈夫</strong>です。<br />
              💡 後から個人のお金で事業費を支払った場合は「🙋 個人立替（事業主借）」で記録できます。
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div style={S.formGroup}>
                <label style={S.label}>日付</label>
                <input
                  type="date"
                  value={motoirekinDate}
                  onChange={(e) => setMotoirekinDate(e.target.value)}
                  style={{ ...S.input, width: 160 }}
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>金額（円）</label>
                <input
                  type="number"
                  value={motoirekinAmount}
                  placeholder="0"
                  onChange={(e) => setMotoirekinAmount(e.target.value)}
                  style={{ ...S.input, width: 180 }}
                />
              </div>
              <button style={S.btnPrimary} onClick={generateMotoirekin}>
                仕訳を作成
              </button>
            </div>
            {motoMsg && (
              <p
                style={{
                  ...S.msg,
                  marginTop: 8,
                  color: motoMsg.startsWith("⚠") ? "#dc2626" : "#059669",
                }}
              >
                {motoMsg}
              </p>
            )}
          </div>
        )}

      {/* ── 家事按分 ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>🏠 家事按分の設定</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
          自宅を仕事にも使っている場合、経費の「事業で使っている割合」を設定してください。
          日常の入力は全額で行い、損益計算書と所得税計算で自動的に按分されます。
        </p>
        {ANBUN_TARGET_ACCOUNTS.map((acct) => {
          const rate = settings.anbunRates?.[acct.code];
          const hasRate = rate != null && rate < 100;
          return (
            <div key={acct.code} style={{ marginBottom: 16, padding: "12px 16px", background: hasRate ? "#f0fdf4" : "#f8fafc", borderRadius: 8, border: `1px solid ${hasRate ? "#bbf7d0" : "#e2e8f0"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{acct.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>💡 {acct.hint}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range"
                    min="0" max="100" step="5"
                    value={rate ?? 100}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const rates = { ...(settings.anbunRates || {}) };
                      if (v >= 100) { delete rates[acct.code]; }
                      else { rates[acct.code] = v; }
                      persistSettings({ ...settings, anbunRates: rates });
                    }}
                    style={{ width: 120, accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: 16, fontWeight: 700, color: hasRate ? "#059669" : "#94a3b8", minWidth: 48, textAlign: "right" }}>
                    {rate ?? 100}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>
          ※ 100%の科目は按分なし（全額事業経費）として扱います。確定申告時に損益計算書・所得税計算に反映されます。
        </p>
      </div>

      {/* ── 年度締め ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>📅 年度締め・繰越</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>
          当年度の期末残高を確定し、翌年度の期首残高（元入金含む）を自動作成します。
          事業主貸・事業主借は元入金に振り替えられ、翌期は0からスタートします。
        </p>
        {settings.openingBalances?.[settings.fy + 1] && (
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              color: "#059669",
              background: "#f0fdf4",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            ✅ {settings.fy + 1}年度の期首残高は作成済みです（再実行で上書き）
          </p>
        )}
        <button
          style={S.btnPrimary}
          onClick={() => setCloseConfirm(true)}
        >
          {settings.fy}年度を締める → {settings.fy + 1}年度を準備
        </button>
      </div>

      {/* ── データ管理 ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>データ管理</h3>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            style={S.btnSecondary}
            onClick={() => exportCSV(entries, settings.fy)}
          >
            📥 CSVエクスポート
          </button>
          <button
            style={S.btnSecondary}
            onClick={() => fileRef.current?.click()}
          >
            📤 CSVインポート
          </button>
          <input
            type="file"
            ref={fileRef}
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: "none" }}
          />
        </div>
        {importMsg && (
          <p
            style={{
              ...S.msg,
              marginTop: 12,
              color: importMsg.startsWith("⚠") ? "#dc2626" : "#059669",
            }}
          >
            {importMsg}
          </p>
        )}
      </div>

      {/* ── バックアップ ── */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>🔒 バックアップ・復元</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>
          設定と全仕訳データをJSONファイルとしてバックアップできます。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            style={S.btnSecondary}
            onClick={() => exportBackup(settings, entries, settings.fy)}
          >
            💾 バックアップ保存
          </button>
          <button
            style={S.btnSecondary}
            onClick={() => backupRef.current?.click()}
          >
            📂 バックアップ復元
          </button>
          <input
            type="file"
            ref={backupRef}
            accept=".json"
            onChange={handleImportBackup}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* ── 全データ削除 ── */}
      <div style={{ ...S.card, borderColor: "#fca5a5" }}>
        <h3 style={{ ...S.cardTitle, color: "#dc2626" }}>⚠ 全データ削除</h3>
        {!confirmClear ? (
          <button
            style={{
              ...S.btnSecondary,
              color: "#ef4444",
              borderColor: "#fca5a5",
            }}
            onClick={() => setConfirmClear(true)}
          >
            全データ削除を開始
          </button>
        ) : (
          <div>
            <p
              style={{ margin: "0 0 12px", fontSize: 13, color: "#dc2626" }}
            >
              全ての仕訳データが完全に削除されます。この操作は取り消せません。
              <br />
              削除するには下に「削除」と入力してください。
            </p>
            <div
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                type="text"
                value={deleteText}
                placeholder="「削除」と入力"
                onChange={(e) => setDeleteText(e.target.value)}
                style={{ ...S.input, width: 160, borderColor: "#fca5a5" }}
              />
              <button
                style={{
                  ...S.btnPrimary,
                  background:
                    deleteText === "削除" ? "#ef4444" : "#d1d5db",
                  cursor:
                    deleteText === "削除" ? "pointer" : "not-allowed",
                }}
                disabled={deleteText !== "削除"}
                onClick={() => {
                  persist([]);
                  setConfirmClear(false);
                  setDeleteText("");
                }}
              >
                完全に削除する
              </button>
              <button
                style={S.btnSecondary}
                onClick={() => {
                  setConfirmClear(false);
                  setDeleteText("");
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CSVフォーマット説明 ── */}
      <div style={{ ...S.card, background: "#f8fafc" }}>
        <h3 style={{ ...S.cardTitle, fontSize: 13 }}>CSVインポート形式</h3>
        <p
          style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.8 }}
        >
          ヘッダー行:{" "}
          <code
            style={{
              background: "#e2e8f0",
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 11,
            }}
          >
            日付,借方科目コード,借方科目,貸方科目コード,貸方科目,金額,摘要
          </code>
          <br />
          日付は YYYY-MM-DD 形式。借方と貸方が同一科目の行はスキップされます。
          同一内容の重複行もスキップされます。
        </p>
      </div>

      {/* ── 年度締め確認モーダル ── */}
      {closeConfirm && (
        <ConfirmModal
          message={`${settings.fy}年度を締め、${settings.fy + 1}年度の期首残高を作成します。よろしいですか？`}
          onConfirm={handleCloseYear}
          onCancel={() => setCloseConfirm(false)}
        />
      )}
    </div>
  );
}
