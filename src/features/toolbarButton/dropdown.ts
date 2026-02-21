/**
 * ドロップダウンメニュー管理
 *
 * レビューバッジのドロップダウンを開閉し、キーボードナビゲーションや
 * 外側クリック検知などのアクセシビリティ動作を担う。
 */

import { DROPDOWN_CLASS, DROPDOWN_OPEN_CLASS } from "./constants";
import { DROPDOWN_ITEMS } from "./dropdownItems";
import { findAssociatedTextarea, insertTextAtCursor } from "./textInserter";

// ---------------------------------------------------------------------------
// モジュールレベル状態
// ---------------------------------------------------------------------------

let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

/** 現在開いているドロップダウン要素 */
export let activeDropdown: HTMLDivElement | null = null;

/** ドロップダウンを開いたアンカーボタン */
export let activeAnchor: HTMLElement | null = null;

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * 開いているドロップダウンを閉じる
 *
 * @param returnFocus - true のとき元のボタンにフォーカスを戻す（デフォルト: true）
 */
export const closeDropdown = (returnFocus = true): void => {
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
 *
 * @param anchor - ドロップダウンの基点となるボタン要素
 */
export const openDropdown = (anchor: HTMLElement): void => {
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
