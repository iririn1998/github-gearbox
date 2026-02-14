/**
 * GitHub Gearbox - Popup Script
 *
 * 機能のON/OFF切り替えUIを管理する
 */

interface FeatureSettings {
  [featureId: string]: {
    enabled: boolean;
  };
}

async function init(): Promise<void> {
  // 保存された設定を読み込み
  const result = await chrome.storage.local.get("features");
  const features: FeatureSettings = (result.features as FeatureSettings) ?? {
    "task-list-label": { enabled: true },
  };

  // タスクリストLabel機能のトグル
  const toggle = document.getElementById("toggle-task-list-label") as HTMLInputElement | null;

  if (toggle) {
    toggle.checked = features["task-list-label"]?.enabled ?? true;

    toggle.addEventListener("change", async () => {
      features["task-list-label"] = { enabled: toggle.checked };
      await chrome.storage.local.set({ features });

      // アクティブなGitHubタブにメッセージを送信して機能を切り替え
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "toggle-feature",
          featureId: "task-list-label",
          enabled: toggle.checked,
        });
      }
    });
  }
}

init();
