import type { Feature } from "./types";
import { taskListLabelFeature } from "./features/taskListLabel";
import { reviewCopyButtonFeature } from "./features/reviewCopyButton";
import "./features/taskListLabel/styles.css";
import "./features/reviewCopyButton/styles.css";

/**
 * 登録された全機能のリスト
 * 新しい機能を追加する際はここにインポートして追加する
 */
const features: Feature[] = [taskListLabelFeature, reviewCopyButtonFeature];

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
      console.log(`[GitHub Gearbox] ${feature.name} を有効化しました`);
    } catch (error) {
      console.error(`[GitHub Gearbox] ${feature.name} の初期化に失敗しました:`, error);
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
        console.error(`[GitHub Gearbox] ${feature.name} のクリーンアップに失敗しました:`, error);
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
        console.log(`[GitHub Gearbox] ${feature.name} を有効化しました`);
      } catch (error) {
        console.error(`[GitHub Gearbox] ${feature.name} の有効化に失敗しました:`, error);
      }
    } else if (!message.enabled && activeFeatures.has(feature.id)) {
      try {
        feature.destroy();
        activeFeatures.delete(feature.id);
        console.log(`[GitHub Gearbox] ${feature.name} を無効化しました`);
      } catch (error) {
        console.error(`[GitHub Gearbox] ${feature.name} の無効化に失敗しました:`, error);
      }
    }
  }
});
