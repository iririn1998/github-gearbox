import type { Feature } from "../../types";
import gearIcon from "./icons/gear.svg?raw";

const FEATURE_ID = "toolbar-button";
const PROCESSED_ATTR = "data-gh-gearbox-toolbar-btn";
const BUTTON_CLASS = "gh-gearbox-toolbar-btn";
const TOOLTIP_CLASS = "gh-gearbox-toolbar-tooltip";
const GROUP_CLASS = "gh-gearbox-toolbar-group";
const DROPDOWN_CLASS = "gh-gearbox-dropdown";
const DROPDOWN_OPEN_CLASS = "gh-gearbox-dropdown--open";

/**
 * ツールバーのセレクタ
 * ハッシュ付きクラス名はビルドごとに変わる可能性があるため、
 * role と aria-label 属性で特定する
 */
const TOOLBAR_SELECTOR = 'div[role="toolbar"][aria-label="Formatting tools"]';

/** レビューバッジの選択肢 (https://zenn.dev/yumemi_inc/articles/review-badge) */
const DROPDOWN_ITEMS = [
  {
    label: "ask  - 確認・質問",
    text: "![ask-badge](https://img.shields.io/badge/review-ask-yellowgreen.svg)",
  },
  {
    label: "must - 必須の修正",
    text: "![must-badge](https://img.shields.io/badge/review-must-red.svg)",
  },
  {
    label: "imo  - 個人的意見",
    text: "![imo-badge](https://img.shields.io/badge/review-imo-orange.svg)",
  },
  {
    label: "nits - 軽微な指摘",
    text: "![nits-badge](https://img.shields.io/badge/review-nits-green.svg)",
  },
  {
    label: "next - 次回対応",
    text: "![next-badge](https://img.shields.io/badge/review-next-blueviolet)",
  },
  {
    label: "memo - メモ",
    text: "![memo-badge](https://img.shields.io/badge/review-memo-lightgrey)",
  },
  {
    label: "good - 良いコード",
    text: "![good-badge](https://img.shields.io/badge/review-good-brightgreen.svg)",
  },
];

let observer: MutationObserver | null = null;
let tooltipIdCounter = 0;
let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let activeDropdown: HTMLDivElement | null = null;
let activeAnchor: HTMLElement | null = null;

/**
 * ツールバーに紐づく textarea を DOM ツリーを遡って探す
 */
const findAssociatedTextarea = (from: HTMLElement): HTMLTextAreaElement | null => {
  let el: HTMLElement | null = from.parentElement;
  while (el && el !== document.body) {
    const textarea = el.querySelector<HTMLTextAreaElement>("textarea");
    if (textarea) return textarea;
    el = el.parentElement;
  }
  return null;
};

/**
 * textarea のカーソル位置にテキストを挿入する
 */
const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string): void => {
  textarea.focus();
  // execCommand はアンドゥ履歴を保持したまま挿入できる
  const success = document.execCommand("insertText", false, text);
  if (!success) {
    // フォールバック: 手動で値を書き換えて input イベントを発火
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

/**
 * ユニークなツールチップIDを生成する
 */
const generateTooltipId = (): string => {
  return `gh-gearbox-toolbar-tooltip-${tooltipIdCounter++}`;
};

/**
 * 開いているドロップダウンを閉じる
 * @param returnFocus - true のとき元のボタンにフォーカスを戻す
 */
const closeDropdown = (returnFocus = true): void => {
  if (activeAnchor) {
    activeAnchor.setAttribute("aria-expanded", "false");
  }
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  if (outsideClickHandler) {
    document.removeEventListener("click", outsideClickHandler, true);
    outsideClickHandler = null;
  }
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler, true);
    keydownHandler = null;
  }
  if (returnFocus && activeAnchor) {
    activeAnchor.focus();
  }
  activeAnchor = null;
};

/**
 * ドロップダウンメニューを作成して body に追加し、ボタン直下に配置する
 */
const openDropdown = (anchor: HTMLElement): void => {
  // 既に開いていれば閉じる（フォーカスは戻さない）
  closeDropdown(false);
  activeAnchor = anchor;

  const dropdown = document.createElement("div");
  dropdown.className = `${DROPDOWN_CLASS} ${DROPDOWN_OPEN_CLASS}`;
  dropdown.setAttribute("role", "menu");

  for (const item of DROPDOWN_ITEMS) {
    const menuItem = document.createElement("button");
    menuItem.className = `${DROPDOWN_CLASS}__item`;
    menuItem.setAttribute("role", "menuitem");
    menuItem.type = "button";
    menuItem.textContent = item.label;

    menuItem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // textarea を先に取得してから閉じる (closeDropdown が activeAnchor をクリアするため)
      const textarea = activeAnchor ? findAssociatedTextarea(activeAnchor) : null;
      closeDropdown(false);
      if (textarea) {
        insertTextAtCursor(textarea, item.text);
        console.log(`[GitHub Gearbox] バッジを挿入しました: ${item.label}`);
      } else {
        console.warn("[GitHub Gearbox] 対応する textarea が見つかりませんでした");
      }
    });

    dropdown.appendChild(menuItem);
  }

  // body に追加してから位置を計算 (サイズ取得のため)
  document.body.appendChild(dropdown);
  activeDropdown = dropdown;

  const rect = anchor.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();

  let top = rect.bottom + 4;
  let left = rect.right - dropdownRect.width;

  // 画面下にはみ出す場合はボタン上に表示
  if (top + dropdownRect.height > window.innerHeight) {
    top = rect.top - dropdownRect.height - 4;
  }
  // 画面左にはみ出す場合は補正
  if (left < 0) {
    left = rect.left;
  }

  dropdown.style.top = `${top + window.scrollY}px`;
  dropdown.style.left = `${left + window.scrollX}px`;

  // 先頭項目にフォーカス
  const items = Array.from(
    dropdown.querySelectorAll<HTMLButtonElement>(`.${DROPDOWN_CLASS}__item`),
  );
  items[0]?.focus();

  // キーボードナビゲーション
  keydownHandler = (e: KeyboardEvent) => {
    if (!activeDropdown) return;
    const currentItems = Array.from(
      activeDropdown.querySelectorAll<HTMLButtonElement>(`.${DROPDOWN_CLASS}__item`),
    );
    const idx = currentItems.indexOf(document.activeElement as HTMLButtonElement);

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeDropdown(); // フォーカスをボタンに戻す
        break;
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        currentItems[(idx + 1) % currentItems.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        currentItems[(idx - 1 + currentItems.length) % currentItems.length]?.focus();
        break;
      case "Home":
        e.preventDefault();
        e.stopPropagation();
        currentItems[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        e.stopPropagation();
        currentItems[currentItems.length - 1]?.focus();
        break;
      case "Tab":
        // フォーカスは自然に移動させる
        closeDropdown(false);
        break;
    }
  };
  document.addEventListener("keydown", keydownHandler, true);

  // 外側クリックで閉じる
  outsideClickHandler = (ev: MouseEvent) => {
    if (!dropdown.contains(ev.target as Node) && ev.target !== anchor) {
      closeDropdown(false);
    }
  };
  document.addEventListener("click", outsideClickHandler, true);
};

/**
 * カスタムボタンとツールチップを作成する
 */
const createToolbarButton = (): { group: HTMLDivElement; button: HTMLButtonElement } => {
  const tooltipId = generateTooltipId();

  // Divider
  const divider = document.createElement("div");
  divider.setAttribute("data-component", "ActionBar.VerticalDivider");
  divider.setAttribute("aria-hidden", "true");
  divider.className = "prc-ActionBar-Divider-6V8yH";

  // ボタン
  const button = document.createElement("button");
  button.setAttribute("aria-disabled", "false");
  button.setAttribute("data-component", "IconButton");
  button.type = "button";
  button.className =
    "prc-Button-ButtonBase-9n-Xk ToolbarButton-module__iconButton__WwwAY prc-Button-IconButton-fyge7";
  button.setAttribute("data-loading", "false");
  button.setAttribute("data-no-visuals", "true");
  button.setAttribute("data-size", "medium");
  button.setAttribute("data-variant", "invisible");
  button.setAttribute("aria-labelledby", tooltipId);
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.tabIndex = 0;
  button.innerHTML = gearIcon;
  button.classList.add(BUTTON_CLASS);

  // ツールチップ
  const tooltip = document.createElement("span");
  tooltip.className = "prc-TooltipV2-Tooltip-tLeuB";
  tooltip.setAttribute("data-direction", "s");
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.id = tooltipId;
  tooltip.setAttribute("popover", "auto");
  tooltip.textContent = "GitHub Gearbox";
  tooltip.classList.add(TOOLTIP_CLASS);

  // グループ (Divider + ボタン + ツールチップ)
  const group = document.createElement("div");
  group.className = "prc-ActionBar-Group-peNCk";
  group.classList.add(GROUP_CLASS);
  group.appendChild(divider);
  group.appendChild(button);
  group.appendChild(tooltip);

  // ボタンクリック: ドロップダウンを開閉する
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeDropdown) {
      closeDropdown(false); // 既にボタンにフォーカスがあるので戻し不要
    } else {
      button.setAttribute("aria-expanded", "true");
      console.log("[GitHub Gearbox] ドロップダウンを開きました");
      openDropdown(button);
    }
  });

  // ArrowDown でドロップダウンを開く
  button.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && !activeDropdown) {
      e.preventDefault();
      e.stopPropagation();
      button.setAttribute("aria-expanded", "true");
      openDropdown(button);
    }
  });

  return { group, button };
};

/**
 * 単一のツールバーにカスタムボタンを追加する
 */
const addButtonToToolbar = (toolbar: HTMLElement): void => {
  if (toolbar.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  const { group } = createToolbarButton();
  toolbar.appendChild(group);

  toolbar.setAttribute(PROCESSED_ATTR, "true");
};

/**
 * ページ内の全ツールバーにボタンを追加する
 */
const processAllToolbars = (): void => {
  const toolbars = document.querySelectorAll<HTMLElement>(
    `${TOOLBAR_SELECTOR}:not([${PROCESSED_ATTR}])`,
  );
  toolbars.forEach(addButtonToToolbar);
};

/**
 * MutationObserver を開始して動的に追加されるコメントフォームにも対応する
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
 * クリーンアップ: 追加したボタン・ツールチップ・グループと属性を全て除去する
 */
const cleanup = (): void => {
  // Observer を停止
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // ドロップダウンを閉じてクリーンアップ
  closeDropdown();

  // 追加したグループを全て除去
  const groups = document.querySelectorAll<HTMLElement>(`.${GROUP_CLASS}`);
  groups.forEach((group) => group.remove());

  // 処理済みマークを除去
  const processedElements = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedElements.forEach((el) => el.removeAttribute(PROCESSED_ATTR));

  tooltipIdCounter = 0;
};

/**
 * ツールバーボタン機能
 */
export const toolbarButtonFeature: Feature = {
  id: FEATURE_ID,
  name: "ツールバーボタン",

  init(): void {
    processAllToolbars();
    startObserver();
  },

  destroy(): void {
    cleanup();
  },
};
