# 初回リリース前チェックリスト

## README の仕上げ

- [ ] `monday-easy-lab` を自分の GitHub ユーザー名に一括置換（README + vite.config.js）
- [ ] スクリーンショットを撮影して `docs/screenshots/` に保存
  - [ ] `dashboard.png` — ダッシュボード（メインのヒーロー画像）
  - [ ] `easy-entry.png` — かんたん入力のテンプレート選択画面
  - [ ] `tax-calc.png` — 所得税計算の結果画面
- [ ] README 内の `<!-- -->` コメントを外してスクリーンショットを表示

## スクリーンショット撮影のコツ

- ブラウザの幅を 1200px 程度に固定（DevTools → レスポンシブモード）
- ダミーデータを入れて「使われている感」を出す
  - 売上 月30〜50万、経費 月8〜15万、数ヶ月分
- ダークモード非対応なので、OS をライトモードにして撮影
- macOS: Cmd+Shift+4 → Space → ウィンドウクリックで影付きキャプチャ
- Windows: Win+Shift+S でスニッピング

## コード・設定の最終確認

- [ ] `npm test` — 30 テスト全通過
- [ ] `npm run build` — ビルド成功
- [ ] `vite.config.js` の `base` がリポジトリ名と一致
- [ ] `package.json` の `name` を変更した場合は `base` も合わせる
- [ ] LICENSE の Copyright 年・名前を更新

## GitHub リポジトリ作成手順

```bash
# 1. プロジェクトフォルダで
cd aoiro-kaikei
git init
git add .
git commit -m "Initial commit: 青色申告かんたん会計 v1.0.0"

# 2. GitHub で空のリポジトリを作成（README は追加しない）
#    https://github.com/new → aoiro-kaikei

# 3. リモート追加 & push
git remote add origin https://github.com/monday-easy-lab/aoiro-kaikei.git
git branch -M main
git push -u origin main
```

## GitHub Pages の有効化

1. リポジトリの **Settings** → **Pages**
2. **Source** を **GitHub Actions** に変更
3. `main` への push で自動デプロイが走る
4. 数分後に `https://monday-easy-lab.github.io/aoiro-kaikei/` で公開

## リポジトリの見栄え

- [ ] **About**（リポジトリ説明）を設定:

  ```
  個人事業主向け青色申告かんたん会計 — freeeを開いて3秒で閉じた人のための複式簿記アプリ
  ```

- [ ] **Topics** を追加:

  ```
  react, vite, accounting, japan, tax, blue-return, sole-proprietor, 青色申告, 確定申告, 個人事業主
  ```

- [ ] **Website** に GitHub Pages の URL を設定

## 公開後

- [ ] GitHub Pages にアクセスして動作確認
- [ ] README のスクリーンショットが表示されるか確認
- [ ] バッジ（テスト結果）が緑になっているか確認
- [ ] モバイルブラウザでも表示崩れがないか確認
