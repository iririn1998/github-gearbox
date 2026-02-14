import type { Feature } from "../../types";

const FEATURE_ID = "task-list-label";
const CHECKBOX_ID_PREFIX = "gh-gearbox-task";
const PROCESSED_ATTR = "data-gh-gearbox-labeled";

let observer: MutationObserver | null = null;
let idCounter = 0;

/**
 * 単一のタスクリストアイテムにlabelを付与する
 *
 * 変換前:
 *   <li class="task-list-item">
 *     <input type="checkbox" class="task-list-item-checkbox"> テキスト
 *   </li>
 *
 * 変換後:
 *   <li class="task-list-item">
 *     <input type="checkbox" class="task-list-item-checkbox" id="gh-gearbox-task-0">
 *     <label for="gh-gearbox-task-0" class="gh-gearbox-task-label"> テキスト</label>
 *   </li>
 */
function wrapWithLabel(listItem: HTMLElement): void {
  // 既に処理済みならスキップ
  if (listItem.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  const checkbox = listItem.querySelector<HTMLInputElement>("input.task-list-item-checkbox");
  if (!checkbox) {
    return;
  }

  // チェックボックスにIDを付与
  const checkboxId = `${CHECKBOX_ID_PREFIX}-${idCounter++}`;
  checkbox.id = checkboxId;

  // チェックボックスの後ろにある全ノード（テキストノードや要素）をlabelで囲む
  const label = document.createElement("label");
  label.setAttribute("for", checkboxId);
  label.classList.add("gh-gearbox-task-label");

  // checkboxの後ろの兄弟ノードを全てlabelに移動
  const nodesToWrap: Node[] = [];
  let sibling = checkbox.nextSibling;
  while (sibling) {
    nodesToWrap.push(sibling);
    sibling = sibling.nextSibling;
  }

  for (const node of nodesToWrap) {
    label.appendChild(node);
  }

  // labelをcheckboxの後ろに挿入
  checkbox.after(label);

  // labelクリック時にGitHub側のイベントハンドラが正しく動作するよう、
  // labelのデフォルト動作（checkbox toggle）に加えて、
  // GitHub側のカスタムイベントも発火させる
  label.addEventListener("click", (e) => {
    // labelのデフォルト動作でcheckboxがトグルされるが、
    // GitHub側はcheckboxへの直接クリックイベントを監視しているため、
    // プログラム的にcheckboxのclickイベントを発火させる
    // ただし、labelのデフォルト動作と二重にならないよう制御
    e.preventDefault();
    checkbox.click();
  });

  // 処理済みマークを付与
  listItem.setAttribute(PROCESSED_ATTR, "true");
}

/**
 * ページ内の全タスクリストアイテムを処理する
 */
function processAllTaskListItems(): void {
  const items = document.querySelectorAll<HTMLElement>(
    "li.task-list-item:not([" + PROCESSED_ATTR + "])",
  );
  items.forEach(wrapWithLabel);
}

/**
 * MutationObserverを開始して、動的に追加されるタスクリストにも対応する
 */
function startObserver(): void {
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
}

/**
 * クリーンアップ: 付与したlabel・ID・属性を全て除去する
 */
function cleanup(): void {
  // Observerを停止
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // 付与したlabelを解除してノードを元に戻す
  const processedItems = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedItems.forEach((item) => {
    const label = item.querySelector<HTMLLabelElement>("label.gh-gearbox-task-label");
    if (label) {
      // labelの中身をlabelの前（checkboxの後）に戻す
      while (label.firstChild) {
        label.before(label.firstChild);
      }
      label.remove();
    }

    // checkboxのIDを除去
    const checkbox = item.querySelector<HTMLInputElement>(`input[id^="${CHECKBOX_ID_PREFIX}"]`);
    if (checkbox) {
      checkbox.removeAttribute("id");
    }

    item.removeAttribute(PROCESSED_ATTR);
  });

  idCounter = 0;
}

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
    cleanup();
  },
};
