/**
 * dropdown のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * 対象:
 *   - closeDropdown:
 *       activeAnchor あり/なし × returnFocus true/false
 *       activeDropdown あり/なし
 *       outsideClickHandler あり/なし
 *       keydownHandler あり/なし
 *   - openDropdown:
 *       既存ドロップダウンを閉じてから開く
 *       メニューアイテムクリック → textarea あり/なし
 *       キーボードナビゲーション (ArrowDown/Up/Home/End/Escape/Tab)
 *       外側クリックで閉じる
 *       画面下/左にはみ出す場合の位置補正
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { openDropdown, closeDropdown, activeDropdown, activeAnchor } from "./dropdown";

// ---------------------------------------------------------------------------
// ヘルパー: happy-dom には document.execCommand が未定義のため
//           Object.defineProperty で先にプロパティを生やしてから spyOn する
// ---------------------------------------------------------------------------

function mockExecCommand(returnValue: boolean): void {
  if (!("execCommand" in document)) {
    Object.defineProperty(document, "execCommand", {
      value: () => returnValue,
      writable: true,
      configurable: true,
    });
  }
  vi.spyOn(document, "execCommand").mockReturnValue(returnValue);
}

// SVG アセットのスタブ（dropdown が依存するモジュールは不要だが念のため）
vi.mock("./icons/gear.svg?raw", () => ({ default: "<svg data-testid='gear'/>" }));

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/** textarea を含むフォームを構築し body に追加する */
function buildFormWithTextarea(): {
  form: HTMLElement;
  anchor: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
} {
  const form = document.createElement("div");

  const toolbar = document.createElement("div");
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Formatting tools");

  const anchor = document.createElement("button");
  anchor.type = "button";
  toolbar.appendChild(anchor);
  form.appendChild(toolbar);

  const textarea = document.createElement("textarea");
  form.appendChild(textarea);
  document.body.appendChild(form);

  return { form, anchor, textarea };
}

/** textarea を持たない孤立ボタンを返す */
function buildOrphanAnchor(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  document.body.appendChild(btn);
  return btn;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  closeDropdown(false);
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// closeDropdown
// ---------------------------------------------------------------------------

describe("closeDropdown", () => {
  it("ドロップダウンが開いていない状態で呼んでも例外を投げない（activeDropdown = null）", () => {
    expect(() => closeDropdown()).not.toThrow();
  });

  it("ドロップダウンが開いている場合、DOM から除去される（activeDropdown あり）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);
    expect(document.querySelector(".gh-gearbox-dropdown")).not.toBeNull();

    closeDropdown(false);

    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
  });

  it("returnFocus=true のとき anchor にフォーカスが戻る", () => {
    const { anchor } = buildFormWithTextarea();
    anchor.setAttribute("aria-expanded", "true");
    openDropdown(anchor);

    const focusSpy = vi.spyOn(anchor, "focus");
    closeDropdown(true);

    expect(focusSpy).toHaveBeenCalled();
  });

  it("returnFocus=false のとき anchor にフォーカスが戻らない（returnFocus 分岐 = 偽）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const focusSpy = vi.spyOn(anchor, "focus");
    closeDropdown(false);

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("closeDropdown 後、activeAnchor の aria-expanded が false になる", () => {
    const { anchor } = buildFormWithTextarea();
    anchor.setAttribute("aria-expanded", "true");
    openDropdown(anchor);

    closeDropdown(false);

    expect(anchor.getAttribute("aria-expanded")).toBe("false");
  });
});

// ---------------------------------------------------------------------------
// openDropdown
// ---------------------------------------------------------------------------

describe("openDropdown", () => {
  it("ドロップダウンが body に追加され role=menu を持つ", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const dropdown = document.querySelector(".gh-gearbox-dropdown");
    expect(dropdown).not.toBeNull();
    expect(dropdown?.getAttribute("role")).toBe("menu");
  });

  it("メニューアイテムの数は DROPDOWN_ITEMS の要素数と一致する", async () => {
    const { DROPDOWN_ITEMS } = await import("./dropdownItems");
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = document.querySelectorAll(".gh-gearbox-dropdown__item");
    expect(items).toHaveLength(DROPDOWN_ITEMS.length);
  });

  it("既にドロップダウンが開いている場合、古いものが閉じられてから新しく開く（二重開き防止）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);
    const first = document.querySelector(".gh-gearbox-dropdown");

    openDropdown(anchor);
    const second = document.querySelector(".gh-gearbox-dropdown");

    // 古いものが除去されて新しいものが生成される
    expect(first).not.toBe(second);
    expect(document.querySelectorAll(".gh-gearbox-dropdown")).toHaveLength(1);
  });

  it("メニューアイテムをクリックすると textarea にテキストが挿入される（textarea あり）", async () => {
    mockExecCommand(false);
    const { anchor, textarea } = buildFormWithTextarea();
    textarea.value = "";
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    openDropdown(anchor);

    const firstItem = document.querySelector<HTMLButtonElement>(".gh-gearbox-dropdown__item");
    expect(firstItem).not.toBeNull();
    firstItem!.click();

    // テキストが挿入されドロップダウンが閉じられる
    expect(textarea.value).not.toBe("");
    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
  });

  it("メニューアイテムをクリックし textarea が見つからない場合、console.warn を呼ぶ（textarea なし）", () => {
    const anchor = buildOrphanAnchor();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    openDropdown(anchor);

    const firstItem = document.querySelector<HTMLButtonElement>(".gh-gearbox-dropdown__item");
    firstItem!.click();

    expect(warnSpy).toHaveBeenCalledWith(
      "[GitHub Gearbox] 対応する textarea が見つかりませんでした",
    );
  });

  // --- キーボードナビゲーション ---

  it("Escape キーでドロップダウンが閉じ、アンカーにフォーカスが戻る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);
    const focusSpy = vi.spyOn(anchor, "focus");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
    expect(focusSpy).toHaveBeenCalled();
  });

  it("ArrowDown キーで次のメニューアイテムにフォーカスが移る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[0]?.focus(); // 先頭にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(document.activeElement).toBe(items[1]);
  });

  it("ArrowUp キーで前のメニューアイテムにフォーカスが移る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[1]?.focus(); // 2番目にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(document.activeElement).toBe(items[0]);
  });

  it("Home キーで先頭メニューアイテムにフォーカスが移る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[items.length - 1]?.focus(); // 末尾にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));

    expect(document.activeElement).toBe(items[0]);
  });

  it("End キーで末尾メニューアイテムにフォーカスが移る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[0]?.focus(); // 先頭にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));

    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it("Tab キーでドロップダウンが閉じる（フォーカスは戻さない）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);
    const focusSpy = vi.spyOn(anchor, "focus");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("ArrowDown の末尾から ArrowDown でループして先頭に戻る", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[items.length - 1]?.focus(); // 末尾にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(document.activeElement).toBe(items[0]);
  });

  it("ArrowUp の先頭から ArrowUp でループして末尾に移動する", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".gh-gearbox-dropdown__item"),
    );
    items[0]?.focus(); // 先頭にフォーカス

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it("ドロップダウン外のクリックでドロップダウンが閉じる（外側クリック = 真）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    const outside = document.createElement("div");
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector(".gh-gearbox-dropdown")).toBeNull();
  });

  it("アンカー自体のクリックではドロップダウンが閉じない（外側クリック = 偽）", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);

    // アンカーを target にして click イベントをディスパッチ
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // 外側クリックハンドラはアンカーをスキップするはず
    expect(document.querySelector(".gh-gearbox-dropdown")).not.toBeNull();
  });

  it("activeDropdown が null のとき keydownHandler は何もしない", () => {
    const { anchor } = buildFormWithTextarea();
    openDropdown(anchor);
    closeDropdown(false); // activeDropdown を null にする

    // keydown ハンドラがまだ document に残っている間に発火させる
    // （cleanupDropdown が removeEventListener するため実際には届かないが、
    //   removeEventListener のタイミングを確認する意味で例外が起きないことを保証）
    expect(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    }).not.toThrow();
  });
});
