/**
 * toolbarButton のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * 対象:
 *   - generateTooltipId: 呼ぶたびに異なる ID が生成される
 *   - resetTooltipIdCounter: カウンターが 0 にリセットされる
 *   - createToolbarButton: 作成される要素の属性・クラス名・HTML
 *   - addButtonToToolbar: 処理済みスキップ / 未処理時の挿入
 *   - processAllToolbars: 複数ツールバーへの一括適用 / 既処理スキップ
 *   - cleanupToolbarButtons: 挿入要素・属性の全除去
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  generateTooltipId,
  resetTooltipIdCounter,
  createToolbarButton,
  addButtonToToolbar,
  processAllToolbars,
  cleanupToolbarButtons,
} from "./toolbarButton";
import { BUTTON_CLASS, GROUP_CLASS, PROCESSED_ATTR, TOOLBAR_SELECTOR } from "./constants";

// SVG アセットのスタブ
vi.mock("./icons/gear.svg?raw", () => ({ default: "<svg data-testid='gear'/>" }));

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/** ツールバー要素を作成して body に追加する */
function buildToolbar(): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Formatting tools");
  document.body.appendChild(toolbar);
  return toolbar;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
  resetTooltipIdCounter();
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanupToolbarButtons();
});

// ---------------------------------------------------------------------------
// generateTooltipId / resetTooltipIdCounter
// ---------------------------------------------------------------------------

describe("generateTooltipId", () => {
  it("呼ぶたびに異なる ID が生成される（カウンターがインクリメントされる）", () => {
    const id1 = generateTooltipId();
    const id2 = generateTooltipId();
    const id3 = generateTooltipId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).toMatch(/^gh-gearbox-toolbar-tooltip-\d+$/);
  });

  it("resetTooltipIdCounter 後、次の ID は 0 から再開する", () => {
    generateTooltipId(); // → 0
    generateTooltipId(); // → 1
    resetTooltipIdCounter();

    const id = generateTooltipId(); // → 0 に戻る
    expect(id).toBe("gh-gearbox-toolbar-tooltip-0");
  });
});

// ---------------------------------------------------------------------------
// createToolbarButton
// ---------------------------------------------------------------------------

describe("createToolbarButton", () => {
  it("group と button を返す", () => {
    const { group, button } = createToolbarButton();
    expect(group.tagName).toBe("DIV");
    expect(button.tagName).toBe("BUTTON");
  });

  it("button に BUTTON_CLASS が付与される", () => {
    const { button } = createToolbarButton();
    expect(button.classList.contains(BUTTON_CLASS)).toBe(true);
  });

  it("button に aria-haspopup='menu' が付与される", () => {
    const { button } = createToolbarButton();
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("button に aria-expanded='false' が付与される（初期値）", () => {
    const { button } = createToolbarButton();
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("button の innerHTML にギアアイコン SVG が含まれる", () => {
    const { button } = createToolbarButton();
    expect(button.innerHTML).toContain("gear");
  });

  it("group に GROUP_CLASS が付与される", () => {
    const { group } = createToolbarButton();
    expect(group.classList.contains(GROUP_CLASS)).toBe(true);
  });

  it("group の子として divider, button, tooltip が含まれる", () => {
    const { group } = createToolbarButton();
    expect(group.children).toHaveLength(3);
  });

  it("ツールチップのテキストが 'GitHub Gearbox' である", () => {
    const { group } = createToolbarButton();
    const tooltip = group.querySelector(".gh-gearbox-toolbar-tooltip");
    expect(tooltip?.textContent).toBe("GitHub Gearbox");
  });

  it("button クリック時にドロップダウンが開かれる（aria-expanded が true になる）", () => {
    const { button } = createToolbarButton();
    document.body.appendChild(button);

    button.click();

    expect(button.getAttribute("aria-expanded")).toBe("true");
    // クリーンアップ
    document.querySelector(".gh-gearbox-dropdown")?.remove();
  });

  it("ドロップダウンが開いている状態でボタンをクリックするとドロップダウンが閉じる", () => {
    const { button } = createToolbarButton();
    document.body.appendChild(button);

    button.click(); // 開く
    button.click(); // 閉じる

    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
  });

  it("ArrowDown キーでドロップダウンが開かれる", () => {
    const { button } = createToolbarButton();
    document.body.appendChild(button);

    button.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(button.getAttribute("aria-expanded")).toBe("true");
    // クリーンアップ
    document.querySelector(".gh-gearbox-dropdown")?.remove();
  });

  it("ドロップダウンが既に開いている場合、ArrowDown を押しても二重に開かない", () => {
    const { button } = createToolbarButton();
    document.body.appendChild(button);

    button.click(); // ドロップダウンを開く
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(document.querySelectorAll(".gh-gearbox-dropdown")).toHaveLength(1);
    // クリーンアップ
    document.querySelector(".gh-gearbox-dropdown")?.remove();
  });
});

// ---------------------------------------------------------------------------
// addButtonToToolbar
// ---------------------------------------------------------------------------

describe("addButtonToToolbar", () => {
  it("未処理のツールバーにグループ要素が追加される（PROCESSED_ATTR なし = 真）", () => {
    const toolbar = buildToolbar();
    addButtonToToolbar(toolbar);

    expect(toolbar.querySelector(`.${GROUP_CLASS}`)).not.toBeNull();
  });

  it("追加後にツールバーへ PROCESSED_ATTR が付与される", () => {
    const toolbar = buildToolbar();
    addButtonToToolbar(toolbar);

    expect(toolbar.hasAttribute(PROCESSED_ATTR)).toBe(true);
  });

  it("処理済みのツールバーはスキップされる（PROCESSED_ATTR あり = 真）", () => {
    const toolbar = buildToolbar();
    addButtonToToolbar(toolbar); // 1回目
    addButtonToToolbar(toolbar); // 2回目

    expect(toolbar.querySelectorAll(`.${GROUP_CLASS}`)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// processAllToolbars
// ---------------------------------------------------------------------------

describe("processAllToolbars", () => {
  it("ページ内の全ツールバーにボタンが追加される", () => {
    buildToolbar();
    buildToolbar();
    buildToolbar();

    processAllToolbars();

    expect(document.querySelectorAll(`.${GROUP_CLASS}`)).toHaveLength(3);
  });

  it("既に処理済みのツールバーはスキップされる", () => {
    const toolbar = buildToolbar();
    addButtonToToolbar(toolbar); // 処理済みにする

    processAllToolbars();

    expect(toolbar.querySelectorAll(`.${GROUP_CLASS}`)).toHaveLength(1);
  });

  it("ツールバーが 0 件の場合、例外を投げない", () => {
    expect(() => processAllToolbars()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// cleanupToolbarButtons
// ---------------------------------------------------------------------------

describe("cleanupToolbarButtons", () => {
  it("挿入したグループ要素が全て除去される（グループあり = 真）", () => {
    buildToolbar();
    buildToolbar();
    processAllToolbars();

    expect(document.querySelectorAll(`.${GROUP_CLASS}`)).toHaveLength(2);

    cleanupToolbarButtons();

    expect(document.querySelectorAll(`.${GROUP_CLASS}`)).toHaveLength(0);
  });

  it("PROCESSED_ATTR が全ツールバーから除去される", () => {
    buildToolbar();
    processAllToolbars();

    expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(1);

    cleanupToolbarButtons();

    expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(0);
  });

  it("ツールチップ ID カウンターがリセットされる", () => {
    generateTooltipId(); // カウンター=1
    generateTooltipId(); // カウンター=2

    cleanupToolbarButtons(); // → resetTooltipIdCounter() が呼ばれる

    const nextId = generateTooltipId(); // 0 から再開するはず
    expect(nextId).toBe("gh-gearbox-toolbar-tooltip-0");
  });

  it("グループが 0 件の状態で呼ばれても例外を投げない（グループあり = 偽）", () => {
    expect(() => cleanupToolbarButtons()).not.toThrow();
  });
});
