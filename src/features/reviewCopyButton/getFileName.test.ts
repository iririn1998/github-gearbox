/**
 * getFileName のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * `getFileName` は 4 つの条件分岐を持つ:
 *   1. 祖先に [data-tagsearch-path] がある
 *   2. 祖先に .file[data-path] がある
 *   3. 祖先の .file 内の .file-header a[title] がある
 *   4. .js-resolvable-timeline-thread-container 内の a[href*='/files'] がある
 *   5. いずれも存在しない
 *
 * 各条件を独立に "真" にして他を偽にすることで MC/DC を満たす。
 */

import { beforeEach, describe, it, expect } from "vitest";
import { getFileName } from "./getFileName";

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/**
 * `.review-comment` 要素を DOM に配置して返す。
 * 引数で指定された構造だけを構築するため、条件の独立性を確保する。
 */
function mountComment(setup: (comment: HTMLElement) => HTMLElement): HTMLElement {
  const comment = document.createElement("div");
  comment.className = "review-comment";
  const root = setup(comment);
  document.body.appendChild(root);
  return comment;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// テスト
// ---------------------------------------------------------------------------

describe("getFileName", () => {
  // ----- 分岐 1: data-tagsearch-path -----

  it("祖先要素に data-tagsearch-path がある場合、その値を返す（条件1=真）", () => {
    const comment = mountComment((c) => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-tagsearch-path", "src/utils/foo.ts");
      wrapper.appendChild(c);
      return wrapper;
    });

    expect(getFileName(comment)).toBe("src/utils/foo.ts");
  });

  it("data-tagsearch-path の属性値が空文字の場合、空文字を返す", () => {
    const comment = mountComment((c) => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-tagsearch-path", "");
      wrapper.appendChild(c);
      return wrapper;
    });

    expect(getFileName(comment)).toBe("");
  });

  // ----- 分岐 2: .file[data-path] -----

  it(".file[data-path] の祖先要素がある場合、その値を返す（条件1=偽, 条件2=真）", () => {
    const comment = mountComment((c) => {
      const file = document.createElement("div");
      file.className = "file";
      file.setAttribute("data-path", "src/bar/baz.ts");
      file.appendChild(c);
      return file;
    });

    expect(getFileName(comment)).toBe("src/bar/baz.ts");
  });

  it(".file[data-path] の属性値が空文字の場合、空文字を返す", () => {
    const comment = mountComment((c) => {
      const file = document.createElement("div");
      file.className = "file";
      file.setAttribute("data-path", "");
      file.appendChild(c);
      return file;
    });

    expect(getFileName(comment)).toBe("");
  });

  // ----- 分岐 3: .file-header a[title] -----

  it(".file-header の a[title] がある場合、title 属性値を返す（条件1=偽, 条件2=偽, 条件3=真）", () => {
    const comment = mountComment((c) => {
      const file = document.createElement("div");
      file.className = "file";

      const header = document.createElement("div");
      header.className = "file-header";
      const a = document.createElement("a");
      a.setAttribute("title", "src/hello/world.ts");
      a.textContent = "world.ts";
      header.appendChild(a);

      file.appendChild(header);
      file.appendChild(c);
      return file;
    });

    expect(getFileName(comment)).toBe("src/hello/world.ts");
  });

  // セレクターは `.file-header a[title]` なので title 属性のない <a> はマッチしない。
  // title なしの場合は条件3=偽となり、後続の分岐へ流れて最終的に空文字を返す。
  it(".file-header の a に title 属性がない場合、セレクターにマッチせず空文字を返す（条件3=偽）", () => {
    const comment = mountComment((c) => {
      const file = document.createElement("div");
      file.className = "file";

      const header = document.createElement("div");
      header.className = "file-header";
      const a = document.createElement("a");
      a.textContent = "  src/no-title.ts  "; // title 属性なし
      header.appendChild(a);

      file.appendChild(header);
      file.appendChild(c);
      return file;
    });

    // `.file-header a[title]` にも `.file-info a` にもマッチしないため空文字
    expect(getFileName(comment)).toBe("");
  });

  // textContent フォールバックは `.file-info a` でヒットした場合に使われる
  it(".file-info a が存在する場合、textContent を返す（条件3の textContent フォールバック）", () => {
    const comment = mountComment((c) => {
      const file = document.createElement("div");
      file.className = "file";

      const fileInfo = document.createElement("div");
      fileInfo.className = "file-info";
      const a = document.createElement("a");
      a.textContent = "  src/from-file-info.ts  ";
      fileInfo.appendChild(a);

      file.appendChild(fileInfo);
      file.appendChild(c);
      return file;
    });

    expect(getFileName(comment)).toBe("src/from-file-info.ts");
  });

  // ----- 分岐 4: スレッドコンテナ内の a[href*='/files'] -----

  it("スレッドコンテナ内の files リンクがある場合、その textContent を返す（条件1-3=偽, 条件4=真）", () => {
    const comment = mountComment((c) => {
      const thread = document.createElement("div");
      thread.className = "js-resolvable-timeline-thread-container";

      const a = document.createElement("a");
      a.href = "/org/repo/pull/1/files";
      a.textContent = "  src/conversation/file.ts  ";
      thread.appendChild(a);
      thread.appendChild(c);
      return thread;
    });

    expect(getFileName(comment)).toBe("src/conversation/file.ts");
  });

  it("スレッドコンテナ内の files リンクの textContent が空の場合、空文字を返す", () => {
    const comment = mountComment((c) => {
      const thread = document.createElement("div");
      thread.className = "js-resolvable-timeline-thread-container";

      const a = document.createElement("a");
      a.href = "/org/repo/pull/1/files";
      // textContent なし
      thread.appendChild(a);
      thread.appendChild(c);
      return thread;
    });

    // textContent?.trim() が "" になり空文字を返す
    expect(getFileName(comment)).toBe("");
  });

  // ----- 分岐 5: いずれも存在しない -----

  it("ファイル名の手がかりが全くない場合、空文字を返す（全条件=偽）", () => {
    const comment = mountComment((c) => c);
    expect(getFileName(comment)).toBe("");
  });

  // ----- 優先順位のテスト (C2 の相互作用) -----

  it("data-tagsearch-path と data-path の両方ある場合、data-tagsearch-path が優先される", () => {
    const comment = mountComment((c) => {
      const outer = document.createElement("div");
      outer.setAttribute("data-tagsearch-path", "priority/tagsearch.ts");

      const file = document.createElement("div");
      file.className = "file";
      file.setAttribute("data-path", "priority/datapath.ts");

      file.appendChild(c);
      outer.appendChild(file);
      return outer;
    });

    expect(getFileName(comment)).toBe("priority/tagsearch.ts");
  });
});
