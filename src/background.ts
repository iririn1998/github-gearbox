/**
 * GitHub Gearbox - Background Service Worker
 *
 * 現在は最小限の実装。
 * 将来的に以下の用途で拡張予定:
 * - 機能のON/OFF状態の管理
 * - GitHub API との連携
 * - コンテキストメニューの追加
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[GitHub Gearbox] 拡張機能がインストールされました");

    // デフォルト設定を保存
    chrome.storage.local.set({
      features: {
        "task-list-label": { enabled: true },
      },
    });
  }
});
