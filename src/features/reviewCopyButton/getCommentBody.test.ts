/**
 * getCommentBody のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * `getCommentBody` は以下の条件分岐を持つ:
 *   1. .comment-body が存在する
 *   2. .markdown-body が存在する（.comment-body がない場合のフォールバック）
 *   3. どちらも存在しない
 *
 * 各条件を独立に真/偽にして MC/DC を達成する。
 */

import { beforeEach, describe, it, expect } from "vitest";
import { getCommentBody } from "./getCommentBody";

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

function makeComment(): HTMLElement {
  const el = document.createElement("div");
  el.className = "review-comment";
  document.body.appendChild(el);
  return el;
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe("getCommentBody", () => {
  // ----- 条件 1: .comment-body が存在する -----

  it(".comment-body があればその textContent を返す（条件1=真）", () => {
    const comment = makeComment();
    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = "This is a review comment.";
    comment.appendChild(body);

    expect(getCommentBody(comment)).toBe("This is a review comment.");
  });

  it(".comment-body の textContent が空の場合、空文字を返す", () => {
    const comment = makeComment();
    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = "";
    comment.appendChild(body);

    // innerText.trim() → ""
    expect(getCommentBody(comment)).toBe("");
  });

  it(".comment-body の textContent が空白のみの場合、trim() により空文字を返す", () => {
    const comment = makeComment();
    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = "   ";
    comment.appendChild(body);

    expect(getCommentBody(comment)).toBe("");
  });

  // ----- 条件 2: .markdown-body のフォールバック -----

  it(".comment-body がなく .markdown-body がある場合、その textContent を返す（条件1=偽, 条件2=真）", () => {
    const comment = makeComment();
    const mb = document.createElement("div");
    mb.className = "markdown-body";
    mb.textContent = "Markdown content here.";
    comment.appendChild(mb);

    expect(getCommentBody(comment)).toBe("Markdown content here.");
  });

  it(".markdown-body の textContent が空の場合、空文字を返す", () => {
    const comment = makeComment();
    const mb = document.createElement("div");
    mb.className = "markdown-body";
    mb.textContent = "";
    comment.appendChild(mb);

    expect(getCommentBody(comment)).toBe("");
  });

  // ----- 条件 3: どちらも存在しない -----

  it(".comment-body も .markdown-body もない場合、空文字を返す（条件1=偽, 条件2=偽）", () => {
    const comment = makeComment();
    expect(getCommentBody(comment)).toBe("");
  });

  // ----- 優先順位: .comment-body が .markdown-body より優先される -----

  it(".comment-body と .markdown-body の両方ある場合、.comment-body を優先する", () => {
    const comment = makeComment();

    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = "from comment-body";
    comment.appendChild(body);

    const mb = document.createElement("div");
    mb.className = "markdown-body";
    mb.textContent = "from markdown-body";
    comment.appendChild(mb);

    expect(getCommentBody(comment)).toBe("from comment-body");
  });

  it("前後の空白が trim() される", () => {
    const comment = makeComment();
    const body = document.createElement("div");
    body.className = "comment-body";
    body.textContent = "  trimmed  ";
    comment.appendChild(body);

    expect(getCommentBody(comment)).toBe("trimmed");
  });
});
