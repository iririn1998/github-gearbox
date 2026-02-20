import type { Feature } from "../../types";

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

/** 歯車アイコン (Octicon gear SVG) */
const GEAR_ICON = `<svg aria-hidden="true" focusable="false" class="octicon octicon-gear" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" display="inline-block" overflow="visible" style="vertical-align: text-bottom;"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294a6.084 6.084 0 0 1 0 .772c-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.08.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.16.107.327.204.5.29.449.222.851.628.998 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.08-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.5-.29c-.449-.222-.851-.628-.998-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>`;

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
  button.innerHTML = GEAR_ICON;
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
