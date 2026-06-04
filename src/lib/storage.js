// ── localStorage ベースの永続化 ──
// async インターフェースを維持（将来 IndexedDB へ移行可能にするため）

export async function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Save failed:", e);
  }
}
