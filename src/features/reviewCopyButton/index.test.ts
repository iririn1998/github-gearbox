/**
 * reviewCopyButton/index.ts の統合テスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * Feature オブジェクト（init / destroy）と MutationObserver のライフサイクルを検証する。
 * 個々のロジック（getFileName / getLineNumber / getCommentBody / formatCopyText / copyButton）
 * は各専用テストファイルで網羅しているため、ここでは統合的な振る舞いに絞る。
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { reviewCopyButtonFeature } from "./index";

// SVG アセットのスタブ
vi.mock("./icons/clipboard.svg?raw", () => ({ default: "<svg data-testid='clipboard'/>" }));
vi.mock("./icons/check.svg?raw", () => ({ default: "<svg data-testid='check'/>" }));

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/** 旧UIのレビューコメントを作成する */
function buildComment(): HTMLElement {
  const comment = document.createElement("div");
  comment.className = "review-comment";

  const actions = document.createElement("div");
  actions.className = "timeline-comment-actions";
  comment.appendChild(actions);

  const body = document.createElement("div");
  body.className = "comment-body";
  body.textContent = "test";
  comment.appendChild(body);

  document.body.appendChild(comment);
  return comment;
}

/** 新UIのレビューコメントを作成する */
function buildNewUIComment(): HTMLElement {
  const threadComponent = document.createElement("div");
  threadComponent.className =
    "review-thread-component js-comment-container js-resolvable-timeline-thread-container";

  const commentsHolder = document.createElement("div");
  commentsHolder.className = "js-comments-holder";

  const commentDiv = document.createElement("div");
  commentDiv.id = "discussion_r99999";
  commentDiv.setAttribute("data-testid", "automated-review-comment");

  const header = document.createElement("div");
  header.setAttribute("data-testid", "comment-header");
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "ActivityHeader-module__ActionsButtonsContainer__YAGtp";
  header.appendChild(actionsContainer);
  commentDiv.appendChild(header);

  const body = document.createElement("div");
  body.className = "markdown-body";
  body.textContent = "new ui test";
  commentDiv.appendChild(body);

  commentsHolder.appendChild(commentDiv);
  threadComponent.appendChild(commentsHolder);
  document.body.appendChild(threadComponent);
  return commentDiv;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  reviewCopyButtonFeature.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Feature メタデータ
// ---------------------------------------------------------------------------

describe("reviewCopyButtonFeature メタデータ", () => {
  it("id が 'review-copy-button' である", () => {
    expect(reviewCopyButtonFeature.id).toBe("review-copy-button");
  });

  it("name が chrome.i18n.getMessage で取得される", () => {
    expect(reviewCopyButtonFeature.name).toBe("featureReviewCopyButton");
  });
});

// ---------------------------------------------------------------------------
// Feature ライフサイクル
// ---------------------------------------------------------------------------

describe("reviewCopyButtonFeature ライフサイクル", () => {
  it("init() 後、既存の .review-comment にボタンが挿入される", () => {
    buildComment();
    buildComment();

    reviewCopyButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(2);
  });

  it("init() を連続で 2 回呼んでもボタンが二重挿入されない（処理済みスキップ=真）", () => {
    buildComment();

    reviewCopyButtonFeature.init();
    reviewCopyButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(1);
  });

  it("destroy() 後、挿入されたボタンが全て除去される", () => {
    buildComment();
    buildComment();
    reviewCopyButtonFeature.init();

    reviewCopyButtonFeature.destroy();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(0);
  });

  it("destroy() 後、data-gh-gearbox-copy-btn 属性が全て除去される", () => {
    buildComment();
    reviewCopyButtonFeature.init();

    reviewCopyButtonFeature.destroy();

    expect(document.querySelectorAll("[data-gh-gearbox-copy-btn]")).toHaveLength(0);
  });

  it("destroy() 後に再び init() を呼ぶとボタンが再挿入される", () => {
    buildComment();
    reviewCopyButtonFeature.init();
    reviewCopyButtonFeature.destroy();

    reviewCopyButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(1);
  });

  it("destroy() 前に destroy() を呼んでも例外を投げない（observer=null 分岐=真）", () => {
    expect(() => reviewCopyButtonFeature.destroy()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// MutationObserver による動的コメントへの対応
// ---------------------------------------------------------------------------

describe("MutationObserver による動的コメントへの対応", () => {
  it("init() 後に DOM へ追加された .review-comment にもボタンが挿入される", async () => {
    reviewCopyButtonFeature.init();

    // 動的にコメントを追加
    const newComment = buildComment();

    await vi.waitFor(() => {
      return newComment.querySelector(".gh-gearbox-copy-btn") !== null;
    });

    expect(newComment.querySelector(".gh-gearbox-copy-btn")).not.toBeNull();
  });

  it("動的に追加された要素が .review-comment でない場合、ボタンが挿入されない", async () => {
    reviewCopyButtonFeature.init();

    const unrelated = document.createElement("div");
    unrelated.className = "unrelated-element";
    document.body.appendChild(unrelated);

    // 少し待ってから確認（MutationObserver は非同期）
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(unrelated.querySelector(".gh-gearbox-copy-btn")).toBeNull();
  });

  it(".review-comment を含む親要素が追加された場合もボタンが挿入される", async () => {
    reviewCopyButtonFeature.init();

    const parent = document.createElement("div");
    const comment = document.createElement("div");
    comment.className = "review-comment";

    const actions = document.createElement("div");
    actions.className = "timeline-comment-actions";
    comment.appendChild(actions);

    parent.appendChild(comment);
    document.body.appendChild(parent);

    await vi.waitFor(() => comment.querySelector(".gh-gearbox-copy-btn") !== null);

    expect(comment.querySelector(".gh-gearbox-copy-btn")).not.toBeNull();
  });

  it("新UIの review-thread-component が動的に追加された場合もボタンが挿入される", async () => {
    reviewCopyButtonFeature.init();

    const commentDiv = buildNewUIComment();

    await vi.waitFor(() => commentDiv.querySelector(".gh-gearbox-copy-btn") !== null);

    expect(commentDiv.querySelector(".gh-gearbox-copy-btn")).not.toBeNull();
  });
});
