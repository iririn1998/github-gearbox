/**
 * toolbarButton/index.ts の統合テスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * Feature オブジェクト（init / destroy）と MutationObserver のライフサイクルを検証する。
 * 個々のロジック（textInserter / dropdown / toolbarButton）は各専用テストファイルで
 * 網羅しているため、ここでは統合的な振る舞いに絞る。
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { toolbarButtonFeature } from "./index";

// SVG アセットのスタブ
vi.mock("./icons/gear.svg?raw", () => ({ default: "<svg data-testid='gear'/>" }));

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/** ツールバー要素を body に追加する */
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
});

afterEach(() => {
  toolbarButtonFeature.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Feature メタデータ
// ---------------------------------------------------------------------------

describe("toolbarButtonFeature メタデータ", () => {
  it("id が 'toolbar-button' である", () => {
    expect(toolbarButtonFeature.id).toBe("toolbar-button");
  });

  it("name が 'ツールバーボタン' である", () => {
    expect(toolbarButtonFeature.name).toBe("ツールバーボタン");
  });
});

// ---------------------------------------------------------------------------
// Feature ライフサイクル
// ---------------------------------------------------------------------------

describe("toolbarButtonFeature ライフサイクル", () => {
  it("init() 後、既存のツールバーにグループ要素が挿入される", () => {
    buildToolbar();
    buildToolbar();

    toolbarButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-toolbar-group")).toHaveLength(2);
  });

  it("init() を連続で 2 回呼んでも二重挿入されない（処理済みスキップ = 真）", () => {
    buildToolbar();

    toolbarButtonFeature.init();
    toolbarButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-toolbar-group")).toHaveLength(1);
  });

  it("destroy() 後、挿入されたグループ要素が全て除去される", () => {
    buildToolbar();
    buildToolbar();
    toolbarButtonFeature.init();

    toolbarButtonFeature.destroy();

    expect(document.querySelectorAll(".gh-gearbox-toolbar-group")).toHaveLength(0);
  });

  it("destroy() 後、data-gh-gearbox-toolbar-btn 属性が全て除去される", () => {
    buildToolbar();
    toolbarButtonFeature.init();

    toolbarButtonFeature.destroy();

    expect(document.querySelectorAll("[data-gh-gearbox-toolbar-btn]")).toHaveLength(0);
  });

  it("destroy() 後に再び init() を呼ぶとグループが再挿入される", () => {
    buildToolbar();
    toolbarButtonFeature.init();
    toolbarButtonFeature.destroy();

    toolbarButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-toolbar-group")).toHaveLength(1);
  });

  it("destroy() 前に destroy() を呼んでも例外を投げない（observer=null 分岐 = 真）", () => {
    expect(() => toolbarButtonFeature.destroy()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// MutationObserver による動的ツールバーへの対応
// ---------------------------------------------------------------------------

describe("MutationObserver による動的ツールバーへの対応", () => {
  it("init() 後に DOM へ追加されたツールバーにもグループが挿入される", async () => {
    toolbarButtonFeature.init();

    const toolbar = buildToolbar();

    await vi.waitFor(() => {
      return toolbar.querySelector(".gh-gearbox-toolbar-group") !== null;
    });

    expect(toolbar.querySelector(".gh-gearbox-toolbar-group")).not.toBeNull();
  });

  it("動的に追加された要素がツールバーでない場合、グループが挿入されない", async () => {
    toolbarButtonFeature.init();

    const unrelated = document.createElement("div");
    unrelated.className = "unrelated-element";
    document.body.appendChild(unrelated);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(unrelated.querySelector(".gh-gearbox-toolbar-group")).toBeNull();
  });

  it("ツールバーを含む親要素が追加された場合もグループが挿入される", async () => {
    toolbarButtonFeature.init();

    const parent = document.createElement("div");
    const toolbar = document.createElement("div");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Formatting tools");
    parent.appendChild(toolbar);
    document.body.appendChild(parent);

    await vi.waitFor(() => toolbar.querySelector(".gh-gearbox-toolbar-group") !== null);

    expect(toolbar.querySelector(".gh-gearbox-toolbar-group")).not.toBeNull();
  });

  it("destroy() 後に動的追加されたツールバーにはグループが挿入されない（Observer 停止）", async () => {
    toolbarButtonFeature.init();
    toolbarButtonFeature.destroy();

    const toolbar = buildToolbar();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(toolbar.querySelector(".gh-gearbox-toolbar-group")).toBeNull();
  });
});
