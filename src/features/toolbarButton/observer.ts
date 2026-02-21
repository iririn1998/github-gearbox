/**
 * MutationObserver 管理
 *
 * GitHub の SPA ナビゲーションで動的に追加されるコメントフォームに対応するため、
 * DOM の変更を監視し、新しいツールバーを検知したらボタンを挿入する。
 */

import { TOOLBAR_SELECTOR } from "./constants";
import { processAllToolbars } from "./toolbarButton";

let observer: MutationObserver | null = null;

/**
 * MutationObserver を開始して動的に追加されるコメントフォームにも対応する
 *
 * 既に Observer が動いている場合は一度切断してから再起動する。
 */
export const startObserver = (): void => {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // 追加されたノード自体がツールバーか、その中にツールバーがあるか
            if (
              (node.getAttribute("role") === "toolbar" &&
                node.getAttribute("aria-label") === "Formatting tools") ||
              node.querySelector?.(TOOLBAR_SELECTOR)
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
      processAllToolbars();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * MutationObserver を停止する
 */
export const stopObserver = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};
