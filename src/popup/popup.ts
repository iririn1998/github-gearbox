/**
 * GitHub Gearbox - Popup Script
 *
 * 機能のON/OFF切り替えUIを管理する
 */

type FeatureSettings = {
  [featureId: string]: {
    enabled: boolean;
  };
};

/**
 * data-i18n 属性を持つ要素に chrome.i18n のメッセージを注入する
 */
const applyI18n = (): void => {
  const elements = document.querySelectorAll<HTMLElement>("[data-i18n]");
  for (const el of elements) {
    const messageKey = el.getAttribute("data-i18n");
    if (messageKey) {
      const originalText = el.textContent;
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        el.textContent = message;
      } else {
        console.warn(`[i18n] Missing or empty message for key "${messageKey}" on element:`, el);
        el.textContent = originalText || messageKey;
      }
    }
  }
};

/**
 * 個別の機能トグルを設定する共通ヘルパー
 */
const setupFeatureToggle = (
  features: FeatureSettings,
  featureId: string,
  toggleElementId: string,
  defaultEnabled: boolean,
): void => {
  const toggle = document.getElementById(toggleElementId) as HTMLInputElement | null;
  if (!toggle) return;

  toggle.checked = features[featureId]?.enabled ?? defaultEnabled;

  toggle.addEventListener("change", async () => {
    features[featureId] = { enabled: toggle.checked };
    await chrome.storage.local.set({ features });

    // アクティブなGitHubタブにメッセージを送信して機能を切り替え
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "toggle-feature",
        featureId,
        enabled: toggle.checked,
      });
    }
  });
};

const init = async (): Promise<void> => {
  // i18nメッセージを注入し、html要素のlang属性を動的に設定
  applyI18n();
  document.documentElement.lang = chrome.i18n.getUILanguage();

  // 保存された設定を読み込み
  const result = await chrome.storage.local.get("features");
  const features: FeatureSettings = (result.features as FeatureSettings) ?? {
    "task-list-label": { enabled: true },
    "review-copy-button": { enabled: true },
    "toolbar-button": { enabled: true },
  };

  // 各機能のトグルを設定
  setupFeatureToggle(features, "task-list-label", "toggle-task-list-label", true);
  setupFeatureToggle(features, "review-copy-button", "toggle-review-copy-button", true);
  setupFeatureToggle(features, "toolbar-button", "toggle-toolbar-button", true);
};

init();
