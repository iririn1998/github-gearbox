/**
 * ツールバーボタン管理
 *
 * ツールバーへのカスタムボタン挿入と、ページ内全ツールバーへの一括適用を担う。
 */

import gearIcon from "./icons/gear.svg?raw";
import {
  BUTTON_CLASS,
  DROPDOWN_CLASS,
  GROUP_CLASS,
  PROCESSED_ATTR,
  TOOLBAR_SELECTOR,
  TOOLTIP_CLASS,
} from "./constants";
import { activeDropdown, closeDropdown, openDropdown } from "./dropdown";

// ---------------------------------------------------------------------------
// ツールチップ ID カウンター
// ---------------------------------------------------------------------------

let tooltipIdCounter = 0;

/**
 * ユニークなツールチップ ID を生成する
 */
export const generateTooltipId = (): string => {
  return `gh-gearbox-toolbar-tooltip-${tooltipIdCounter++}`;
};

/**
 * ツールチップ ID カウンターをリセットする（テスト・クリーンアップ用）
 */
export const resetTooltipIdCounter = (): void => {
  tooltipIdCounter = 0;
};

// ---------------------------------------------------------------------------
// ボタン作成
// ---------------------------------------------------------------------------

/**
 * カスタムボタンとツールチップをグループとして作成する
 *
 * @returns 作成された group 要素と button 要素
 */
export const createToolbarButton = (): { group: HTMLDivElement; button: HTMLButtonElement } => {
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

// ---------------------------------------------------------------------------
// ツールバーへの追加
// ---------------------------------------------------------------------------

/**
 * 単一のツールバーにカスタムボタンを追加する
 *
 * 既に処理済みのツールバーはスキップする。
 *
 * @param toolbar - 対象のツールバー要素
 */
export const addButtonToToolbar = (toolbar: HTMLElement): void => {
  if (toolbar.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  const { group } = createToolbarButton();
  toolbar.appendChild(group);

  toolbar.setAttribute(PROCESSED_ATTR, "true");
};

/**
 * ページ内の全ツールバーにカスタムボタンを追加する
 *
 * 未処理のツールバーのみが対象。
 */
export const processAllToolbars = (): void => {
  const toolbars = document.querySelectorAll<HTMLElement>(
    `${TOOLBAR_SELECTOR}:not([${PROCESSED_ATTR}])`,
  );
  toolbars.forEach(addButtonToToolbar);
};

/**
 * 挿入したグループ要素・処理済み属性を全て除去し、カウンターをリセットする
 */
export const cleanupToolbarButtons = (): void => {
  // 追加したグループを全て除去
  const groups = document.querySelectorAll<HTMLElement>(`.${GROUP_CLASS}`);
  groups.forEach((group) => group.remove());

  // 追加したツールバーボタン（BUTTON_CLASS）を除去
  const buttons = document.querySelectorAll<HTMLElement>(`.${BUTTON_CLASS}`);
  buttons.forEach((btn) => btn.remove());

  // DROPDOWN_CLASS の残留要素を除去
  const dropdowns = document.querySelectorAll<HTMLElement>(`.${DROPDOWN_CLASS}`);
  dropdowns.forEach((d) => d.remove());

  // 処理済みマークを除去
  const processedElements = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedElements.forEach((el) => el.removeAttribute(PROCESSED_ATTR));

  resetTooltipIdCounter();
};
