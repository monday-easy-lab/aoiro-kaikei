// ── 匿名の利用状況トラッキング ──
// Umami（Cookie不使用・個人を識別しない）に、操作の種類だけを送ります。
// 会計データ（金額・摘要・勘定科目の中身）は一切送信しません。
// スクリプトが読み込まれていない環境（ブロッカー等）でも動作に影響しないよう、
// すべて安全に握りつぶします。

const ACTIVATED_KEY = "aoiro-activated";

/**
 * イベントを1件送信する。
 * @param {string} name  イベント名（例: "entry_added"）
 * @param {object} [data] 付随データ。件数など、個人を特定しない値のみ渡すこと。
 */
export function track(name, data) {
  try {
    if (typeof window === "undefined") return;
    const u = window.umami;
    if (!u || typeof u.track !== "function") return;
    if (data) u.track(name, data);
    else u.track(name);
  } catch {
    // 計測の失敗でアプリを止めない
  }
}

/**
 * 「はじめて仕訳を登録した」を1回だけ送る（アクティベーション計測）。
 * 判定用のフラグはブラウザ内にのみ保存し、外部には送りません。
 */
export function trackActivation() {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ACTIVATED_KEY)) return;
    localStorage.setItem(ACTIVATED_KEY, "1");
    track("first_entry");
  } catch {
    // localStorage が使えない環境では何もしない
  }
}
