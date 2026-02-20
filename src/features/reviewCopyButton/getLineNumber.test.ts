/**
 * getLineNumber のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * `getLineNumber` は以下の条件分岐を持つ:
 *   A. スレッドコンテナが存在する
 *   B.   td.blob-num[data-line-number] が 1 つ以上存在する
 *   C.     有効な行番号が 1 つ以上ある
 *   D.     有効行番号が複数あり first !== last（範囲表記）
 *   E.   a[href*='#diff-'] が存在する
 *   F.   href が /R(\d+)$/ にマッチする
 *   G. tr の直前行に blob-num-addition / blob-num がある（Files changed フォールバック）
 *
 * 各条件を独立に真/偽にして MC/DC を達成する。
 */

import { beforeEach, describe, it, expect } from "vitest";
import { getLineNumber } from "./getLineNumber";

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

/** スレッドコンテナ内に .review-comment を配置して返す */
function mountInThread(
  buildThread: (thread: HTMLElement, comment: HTMLElement) => void,
): HTMLElement {
  const thread = document.createElement("div");
  thread.className = "js-resolvable-timeline-thread-container";
  const comment = document.createElement("div");
  comment.className = "review-comment";
  buildThread(thread, comment);
  thread.appendChild(comment);
  document.body.appendChild(thread);
  return comment;
}

/** blob-num セルのテーブルを作成してスレッドに追加するユーティリティ */
function appendBlobNumTable(parent: HTMLElement, lineNumbers: number[]): void {
  const table = document.createElement("table");
  for (const n of lineNumbers) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "blob-num";
    td.setAttribute("data-line-number", String(n));
    tr.appendChild(td);
    table.appendChild(tr);
  }
  parent.appendChild(table);
}

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe("getLineNumber", () => {
  // ----- 条件 A: スレッドコンテナなし -----

  it("スレッドコンテナが存在しない場合、空文字を返す（条件A=偽）", () => {
    const comment = document.createElement("div");
    comment.className = "review-comment";
    document.body.appendChild(comment);

    expect(getLineNumber(comment)).toBe("");
  });

  // ----- 条件 B, C: blob-num セルが存在する -----

  it("blob-num セルが 1 つの場合、L{n} 形式を返す（条件B=真, C=真, D=偽）", () => {
    const comment = mountInThread((thread) => {
      appendBlobNumTable(thread, [42]);
    });

    expect(getLineNumber(comment)).toBe("L42");
  });

  it("blob-num セルが複数で first !== last の場合、L{first}-L{last} を返す（条件D=真）", () => {
    const comment = mountInThread((thread) => {
      appendBlobNumTable(thread, [302, 303, 305]);
    });

    expect(getLineNumber(comment)).toBe("L302-L305");
  });

  it("blob-num セルが複数でも全て同じ行番号の場合、L{n} を返す（条件D=偽）", () => {
    const comment = mountInThread((thread) => {
      appendBlobNumTable(thread, [10, 10]);
    });

    expect(getLineNumber(comment)).toBe("L10");
  });

  it("blob-num セルの data-line-number が空文字の場合、フィルタされ行番号を取得できない", () => {
    // 有効な行番号セルがない → diffHref フォールバックもない → 空文字
    const comment = mountInThread((thread) => {
      const table = document.createElement("table");
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.className = "blob-num";
      td.setAttribute("data-line-number", ""); // 空文字
      tr.appendChild(td);
      table.appendChild(tr);
      thread.appendChild(table);
    });

    expect(getLineNumber(comment)).toBe("");
  });

  it("blob-num セルの data-line-number が NaN の場合、フィルタされ行番号を取得できない", () => {
    const comment = mountInThread((thread) => {
      const table = document.createElement("table");
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.className = "blob-num";
      td.setAttribute("data-line-number", "abc"); // NaN
      tr.appendChild(td);
      table.appendChild(tr);
      thread.appendChild(table);
    });

    expect(getLineNumber(comment)).toBe("");
  });

  // ----- 条件 E, F: diffHref フォールバック -----

  it("blob-num なし・diffHref あり・R{n}$マッチの場合、L{n} を返す（条件B=偽, E=真, F=真）", () => {
    const comment = mountInThread((thread) => {
      const a = document.createElement("a");
      a.href = "https://github.com/org/repo/pull/1/files#diff-abc123R99";
      thread.appendChild(a);
    });

    expect(getLineNumber(comment)).toBe("L99");
  });

  it("diffHref があっても R{n}$ にマッチしない場合、空文字を返す（条件F=偽）", () => {
    const comment = mountInThread((thread) => {
      const a = document.createElement("a");
      a.href = "https://github.com/org/repo/pull/1/files#diff-abc123"; // R{n}なし
      thread.appendChild(a);
    });

    expect(getLineNumber(comment)).toBe("");
  });

  it("diffHref の href が null の場合、空文字を返す", () => {
    const comment = mountInThread((thread) => {
      const a = document.createElement("a");
      // href 属性を設定しない → getAttribute("href") は null
      thread.appendChild(a);
    });

    // a[href*='#diff-'] セレクタにマッチしないため条件Eも偽になり空文字
    expect(getLineNumber(comment)).toBe("");
  });

  // ----- 条件 G: Files changed タブのフォールバック (tr の直前行) -----

  it("comment が tr 内にあり直前の tr に blob-num-addition セルがある場合、L{n} を返す", () => {
    const table = document.createElement("table");

    // 直前行
    const prevTr = document.createElement("tr");
    const blobTd = document.createElement("td");
    blobTd.className = "blob-num-addition";
    blobTd.setAttribute("data-line-number", "55");
    prevTr.appendChild(blobTd);

    // コメント行
    const commentTr = document.createElement("tr");
    const comment = document.createElement("div");
    comment.className = "review-comment";
    commentTr.appendChild(comment);

    table.appendChild(prevTr);
    table.appendChild(commentTr);
    document.body.appendChild(table);

    expect(getLineNumber(comment)).toBe("L55");
  });

  it("スレッドコンテナも tr も存在しない場合、空文字を返す（全条件=偽）", () => {
    const comment = document.createElement("div");
    comment.className = "review-comment";
    document.body.appendChild(comment);

    expect(getLineNumber(comment)).toBe("");
  });

  it(".comment-holder をスレッドコンテナとして認識する", () => {
    const holder = document.createElement("div");
    holder.className = "comment-holder";
    const comment = document.createElement("div");
    comment.className = "review-comment";

    appendBlobNumTable(holder, [77]);
    holder.appendChild(comment);
    document.body.appendChild(holder);

    expect(getLineNumber(comment)).toBe("L77");
  });
});
