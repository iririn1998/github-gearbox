import type { Feature } from "./types";
import { taskListLabelFeature } from "./features/taskListLabel";
import { reviewCopyButtonFeature } from "./features/reviewCopyButton";
import { toolbarButtonFeature } from "./features/toolbarButton";
import "./features/taskListLabel/styles.css";
import "./features/reviewCopyButton/styles.css";
import "./features/toolbarButton/styles.css";

/**
 * 登録された全機能のリスト
 * 新しい機能を追加する際はここにインポートして追加する
 */
const features: Feature[] = [taskListLabelFeature, reviewCopyButtonFeature, toolbarButtonFeature];

/**
 * 現在有効化されている機能のセット
 */
const activeFeatures = new Set<string>();

/**
 * 全機能を初期化する
 */
const initAllFeatures = (): void => {
  for (const feature of features) {
    try {
      feature.init();
      activeFeatures.add(feature.id);
      console.log(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureEnabled", [feature.name])}`);
    } catch (error) {
      console.error(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureInitFailed", [feature.name])}`, error);
    }
  }
};

/**
 * 全機能をクリーンアップする
 */
const destroyAllFeatures = (): void => {
  for (const feature of features) {
    if (activeFeatures.has(feature.id)) {
      try {
        feature.destroy();
        activeFeatures.delete(feature.id);
      } catch (error) {
        console.error(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureCleanupFailed", [feature.name])}`, error);
      }
    }
  }
};

// 初期化実行
initAllFeatures();

// GitHubのTurbo(PJAX)遷移時に再初期化
document.addEventListener("turbo:load", () => {
  destroyAllFeatures();
  initAllFeatures();
});

// Popup UIからのメッセージを受信して機能のON/OFFを切り替え
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "toggle-feature") {
    const feature = features.find((f) => f.id === message.featureId);
    if (!feature) return;

    if (message.enabled && !activeFeatures.has(feature.id)) {
      try {
        feature.init();
        activeFeatures.add(feature.id);
        console.log(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureEnabled", [feature.name])}`);
      } catch (error) {
        console.error(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureEnableFailed", [feature.name])}`, error);
      }
    } else if (!message.enabled && activeFeatures.has(feature.id)) {
      try {
        feature.destroy();
        activeFeatures.delete(feature.id);
        console.log(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureDisabled", [feature.name])}`);
      } catch (error) {
        console.error(`[GitHub Gearbox] ${chrome.i18n.getMessage("featureDisableFailed", [feature.name])}`, error);
      }
    }
  }
});
