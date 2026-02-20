/**
 * copyButton のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * 対象:
 *   - createCopyButton: クリックハンドラの成功/失敗分岐
 *   - addCopyButtonToComment: 処理済みスキップ / timeline-comment-actions の有無
 *   - processAllReviewComments: 複数コメントへの一括適用
 *   - cleanupButtons: ボタンと属性の除去
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  createCopyButton,
  addCopyButtonToComment,
  processAllReviewComments,
  cleanupButtons,
} from "./copyButton";
import { PROCESSED_ATTR, COPY_BTN_CLASS, COPY_BTN_SUCCESS_CLASS } from "./constants";

// SVG アセットのスタブ
vi.mock("./icons/clipboard.svg?raw", () => ({ default: "<svg data-testid='clipboard'/>" }));
vi.mock("./icons/check.svg?raw", () => ({ default: "<svg data-testid='check'/>" }));

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

function makeComment(withActions = true): HTMLElement {
  const comment = document.createElement("div");
  comment.className = "review-comment";

  if (withActions) {
    const actions = document.createElement("div");
    actions.className = "timeline-comment-actions";
    comment.appendChild(actions);
  }

  const body = document.createElement("div");
  body.className = "comment-body";
  body.textContent = "test comment";
  comment.appendChild(body);

  document.body.appendChild(comment);
  return comment;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// createCopyButton
// ---------------------------------------------------------------------------

describe("createCopyButton", () => {
  it("button 要素を返し、初期アイコンはクリップボード SVG である", () => {
    const comment = makeComment();
    const btn = createCopyButton(comment);

    expect(btn.tagName).toBe("BUTTON");
    expect(btn.className).toBe(COPY_BTN_CLASS);
    expect(btn.innerHTML).toContain("clipboard");
  });

  it("クリップボード書き込み成功後、success クラスが付与されアイコンが変わる", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    });

    const comment = makeComment();
    const btn = createCopyButton(comment);
    document.body.appendChild(btn);

    btn.click();

    // Promise チェーンの解決を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(btn.classList.contains(COPY_BTN_SUCCESS_CLASS)).toBe(true);
    expect(btn.innerHTML).toContain("check");

    // 1500ms 後に元に戻る
    await vi.advanceTimersByTimeAsync(1500);

    expect(btn.classList.contains(COPY_BTN_SUCCESS_CLASS)).toBe(false);
    expect(btn.innerHTML).toContain("clipboard");

    vi.useRealTimers();
  });

  it("クリップボード書き込み失敗時、console.error が呼ばれる（エラー分岐=真）", async () => {
    const error = new Error("denied");
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(() => Promise.reject(error)) },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const comment = makeComment();
    const btn = createCopyButton(comment);
    document.body.appendChild(btn);

    btn.click();
    await vi.waitFor(() => consoleSpy.mock.calls.length > 0);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[GitHub Gearbox] クリップボードへのコピーに失敗しました:",
      error,
    );

    // success クラスは付与されない
    expect(btn.classList.contains(COPY_BTN_SUCCESS_CLASS)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addCopyButtonToComment
// ---------------------------------------------------------------------------

describe("addCopyButtonToComment", () => {
  it(".timeline-comment-actions の先頭にボタンが挿入される（条件: actions あり, 未処理）", () => {
    const comment = makeComment(true);
    addCopyButtonToComment(comment);

    const actions = comment.querySelector(".timeline-comment-actions")!;
    expect(actions.firstElementChild).not.toBeNull();
    expect(actions.firstElementChild!.classList.contains(COPY_BTN_CLASS)).toBe(true);
  });

  it(".timeline-comment-actions がない場合、ボタンは挿入されない（conditions: actions なし）", () => {
    const comment = makeComment(false);
    addCopyButtonToComment(comment);

    expect(comment.querySelector(`.${COPY_BTN_CLASS}`)).toBeNull();
  });

  it("処理済みマーク(PROCESSED_ATTR)が付与される", () => {
    const comment = makeComment();
    addCopyButtonToComment(comment);

    expect(comment.hasAttribute(PROCESSED_ATTR)).toBe(true);
  });

  it("既に処理済みの場合、ボタンが二重に挿入されない（スキップ分岐=真）", () => {
    const comment = makeComment();
    addCopyButtonToComment(comment);
    addCopyButtonToComment(comment); // 2回目

    const buttons = comment.querySelectorAll(`.${COPY_BTN_CLASS}`);
    expect(buttons).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// processAllReviewComments
// ---------------------------------------------------------------------------

describe("processAllReviewComments", () => {
  it("ページ内の全 .review-comment にボタンが追加される", () => {
    makeComment();
    makeComment();
    makeComment();

    processAllReviewComments();

    expect(document.querySelectorAll(`.${COPY_BTN_CLASS}`)).toHaveLength(3);
  });

  it("既に処理済みのコメントはスキップされる", () => {
    const comment = makeComment();
    addCopyButtonToComment(comment); // 処理済みにする

    processAllReviewComments(); // もう一度実行

    expect(comment.querySelectorAll(`.${COPY_BTN_CLASS}`)).toHaveLength(1);
  });

  it(".review-comment が 0 件の場合、何も起きない", () => {
    // body は空
    expect(() => processAllReviewComments()).not.toThrow();
    expect(document.querySelectorAll(`.${COPY_BTN_CLASS}`)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// cleanupButtons
// ---------------------------------------------------------------------------

describe("cleanupButtons", () => {
  it("挿入されたボタンが全て除去される（ボタンあり=真）", () => {
    makeComment();
    makeComment();
    processAllReviewComments();

    expect(document.querySelectorAll(`.${COPY_BTN_CLASS}`)).toHaveLength(2);

    cleanupButtons();

    expect(document.querySelectorAll(`.${COPY_BTN_CLASS}`)).toHaveLength(0);
  });

  it("PROCESSED_ATTR が全要素から除去される", () => {
    makeComment();
    processAllReviewComments();

    expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(1);

    cleanupButtons();

    expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(0);
  });

  it("ボタンが 0 件の状態で呼ばれても例外を投げない（ボタンあり=偽）", () => {
    expect(() => cleanupButtons()).not.toThrow();
  });
});
