import type { Feature } from "../../types";
import { FEATURE_ID } from "./constants";
import { processAllTaskListItems, cleanup } from "./labelWrapper";

let observer: MutationObserver | null = null;

/**
 * MutationObserverを開始して、動的に追加されるタスクリストにも対応する
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
            // 追加されたノード自体がtask-list-itemか、その中にtask-list-itemがあるか
            if (
              node.classList?.contains("task-list-item") ||
              node.querySelector?.("li.task-list-item")
            ) {
              shouldProcess = true;
              break;
            }
            // コメントやPR本文が動的に読み込まれた場合
            if (node.querySelector?.(".contains-task-list")) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      processAllTaskListItems();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * Observerを停止してnullにする
 */
const stopObserver = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

/**
 * タスクリストLabel機能
 */
export const taskListLabelFeature: Feature = {
  id: FEATURE_ID,
  name: "タスクリスト Label 拡張",

  init(): void {
    processAllTaskListItems();
    startObserver();
  },

  destroy(): void {
    stopObserver();
    cleanup();
  },
};

// テスト用に定数を再エクスポート
export { FEATURE_ID, PROCESSED_ATTR, TASK_LABEL_CLASS } from "./constants";
