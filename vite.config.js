import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages にデプロイする場合は base をリポジトリ名に合わせる
// 例: https://username.github.io/aoiro-kaikei/
export default defineConfig({
  plugins: [react()],
  base: "/aoiro-kaikei/",
});
