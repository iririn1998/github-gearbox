import type { Feature } from "../../types";
import { FEATURE_ID, PROCESSED_ATTR, COPY_BTN_CLASS } from "./constants";
import { processAllReviewComments, cleanupButtons } from "./copyButton";

let observer: MutationObserver | null = null;

/**
 * MutationObserver を開始して動的に追加されるコメントにも対応する
 */
const startObserver = (): void => {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (
              node.classList?.contains("review-comment") ||
              node.querySelector?.(".review-comment")
            ) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      processAllReviewComments();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * クリーンアップ: Observer 停止 + DOM から全ボタン・属性を除去する
 */
const cleanup = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  cleanupButtons();
};

/**
 * レビューコメント コピーボタン機能
 */
export const reviewCopyButtonFeature: Feature = {
  id: FEATURE_ID,
  name: "レビューコメント コピー",

  init(): void {
    processAllReviewComments();
    startObserver();
  },

  destroy(): void {
    cleanup();
  },
};

// テスト用に内部実装を再エクスポート
export { FEATURE_ID, PROCESSED_ATTR, COPY_BTN_CLASS };
