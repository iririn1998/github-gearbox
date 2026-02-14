import { defineConfig } from "vite";
import { resolve } from "path";
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  rmSync,
} from "fs";

/**
 * publicディレクトリの内容をdistにコピーし、
 * popup HTMLを正しい位置に移動するプラグイン
 */
const chromeExtensionPlugin = () => {
  return {
    name: "chrome-extension",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");

      // 1. publicディレクトリの内容をdistにコピー
      const publicDir = resolve(__dirname, "public");
      const copyDir = (src: string, dest: string): void => {
        mkdirSync(dest, { recursive: true });
        for (const entry of readdirSync(src)) {
          const srcPath = resolve(src, entry);
          const destPath = resolve(dest, entry);
          if (statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        }
      };
      try {
        copyDir(publicDir, distDir);
      } catch {
        // publicディレクトリが無い場合は無視
      }

      // 2. popup HTMLを dist/src/popup/ から dist/popup/ に移動し、パスを修正
      const srcPopupDir = resolve(distDir, "src/popup");
      const destPopupDir = resolve(distDir, "popup");
      if (existsSync(srcPopupDir)) {
        mkdirSync(destPopupDir, { recursive: true });
        const htmlPath = resolve(srcPopupDir, "index.html");
        if (existsSync(htmlPath)) {
          // HTMLの中のアセット参照パスを修正
          let html = readFileSync(htmlPath, "utf-8");
          // ../../popup/popup.js → ./popup.js のように修正
          html = html.replace(/(?:\.\.\/)+popup\//g, "./");
          writeFileSync(resolve(destPopupDir, "index.html"), html);
        }
        // dist/src ディレクトリを削除
        rmSync(resolve(distDir, "src"), { recursive: true, force: true });
      }
    },
  };
};

export default defineConfig({
  // Chrome拡張ではアセットの参照を相対パスにする必要がある
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== "production",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.ts"),
        background: resolve(__dirname, "src/background.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {
        format: "es",
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "popup") {
            return "popup/[name].js";
          }
          return "[name].js";
        },
        chunkFileNames: "chunks/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes("popup")) {
            return "popup/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [chromeExtensionPlugin()],
});
