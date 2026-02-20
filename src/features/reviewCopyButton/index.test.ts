/**
 * reviewCopyButton/index.ts のテスト
 *
 * テスト戦略: C2（条件網羅 / Modified Condition/Decision Coverage）
 *
 * `getFileName`, `getLineNumber`, `getCommentBody`, `formatCopyText`,
 * `createCopyButton`, `addCopyButtonToComment`, `processAllReviewComments`,
 * `cleanup` の各分岐を網羅する。
 *
 * プライベート関数は直接エクスポートされないため、
 * 各関数が依拠する DOM を組み立てて公開済み Feature オブジェクト経由でテストする。
 * 純粋関数相当のロジックは DOM を組み立てた上で振る舞いを検証する。
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { reviewCopyButtonFeature } from "./index";

// ---------------------------------------------------------------------------
// SVG アセットのスタブ（vite の ?raw インポートは Vitest では解決されないため）
// ---------------------------------------------------------------------------
vi.mock("./icons/clipboard.svg?raw", () => ({ default: "<svg data-testid='clipboard'/>" }));
vi.mock("./icons/check.svg?raw", () => ({ default: "<svg data-testid='check'/>" }));

// ---------------------------------------------------------------------------
// ヘルパー: .review-comment 要素を作成する
// ---------------------------------------------------------------------------
/**
 * `.review-comment` 要素のオプション型
 */
interface ReviewCommentOptions {
  /** data-tagsearch-path 属性値。未指定なら属性なし */
  tagsearchPath?: string;
  /** .file[data-path] 属性値。未指定なら要素なし */
  dataPath?: string;
  /** .file-header a[title] のタイトル属性値。未指定なら要素なし */
  fileHeaderTitle?: string;
  /** .file-header a の textContent。title がない場合のフォールバック */
  fileHeaderText?: string;
  /** スレッドコンテナのアンカー(href="* /files...") の textContent */
  threadFileLink?: string;
  /**
   * コードスニペットテーブルの行番号セル値の配列。
   * 指定するとスレッドコンテナ内に <td class="blob-num" data-line-number="N"> を生成する
   */
  blobLineNumbers?: number[];
  /** href="#diff-xxxR{n}" 形式のリンク href */
  diffHref?: string;
  /** .comment-body の innerText */
  commentBody?: string;
  /** .markdown-body の innerText */
  markdownBody?: string;
  /** .timeline-comment-actions を含めるか（デフォルト: true） */
  withActions?: boolean;
}

function buildReviewComment(opts: ReviewCommentOptions = {}): HTMLElement {
  const { withActions = true } = opts;

  // ルートとなるスレッドコンテナ
  const thread = document.createElement("div");
  thread.className = "js-resolvable-timeline-thread-container";

  // ファイルリンク (スレッド内 a[href*='/files'])
  if (opts.threadFileLink !== undefined) {
    const a = document.createElement("a");
    a.href = "/files";
    a.textContent = opts.threadFileLink;
    thread.appendChild(a);
  }

  // diffHref リンク (a[href*='#diff-'])
  if (opts.diffHref !== undefined) {
    const a = document.createElement("a");
    a.href = opts.diffHref;
    thread.appendChild(a);
  }

  // コードスニペットテーブル (blob-num cells)
  if (opts.blobLineNumbers && opts.blobLineNumbers.length > 0) {
    const table = document.createElement("table");
    for (const n of opts.blobLineNumbers) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.className = "blob-num";
      td.setAttribute("data-line-number", String(n));
      tr.appendChild(td);
      table.appendChild(tr);
    }
    thread.appendChild(table);
  }

  // .review-comment
  const comment = document.createElement("div");
  comment.className = "review-comment";

  // .timeline-comment-actions
  if (withActions) {
    const actions = document.createElement("div");
    actions.className = "timeline-comment-actions";
    comment.appendChild(actions);
  }

  // .comment-body
  if (opts.commentBody !== undefined) {
    const body = document.createElement("div");
    body.className = "comment-body";
    // happy-dom では innerText の getter は textContent に準じる
    body.textContent = opts.commentBody;
    comment.appendChild(body);
  }

  // .markdown-body
  if (opts.markdownBody !== undefined) {
    const mb = document.createElement("div");
    mb.className = "markdown-body";
    mb.textContent = opts.markdownBody;
    comment.appendChild(mb);
  }

  thread.appendChild(comment);

  // data-tagsearch-path をスレッド全体に付与(最祖先)
  if (opts.tagsearchPath !== undefined) {
    thread.setAttribute("data-tagsearch-path", opts.tagsearchPath);
  }

  // .file[data-path] ラッパー
  //   fileHeaderTitle/fileHeaderText が指定された場合も .file ラッパーを作成して
  //   実装コードの closest(".file") が正しくマッチするようにする
  let wrapper: HTMLElement = thread;
  if (
    opts.dataPath !== undefined ||
    opts.fileHeaderTitle !== undefined ||
    opts.fileHeaderText !== undefined
  ) {
    const file = document.createElement("div");
    file.className = "file";
    if (opts.dataPath !== undefined) {
      file.setAttribute("data-path", opts.dataPath);
    }
    file.appendChild(thread);
    wrapper = file;
  }

  // .file-header a[title]
  if (opts.fileHeaderTitle !== undefined || opts.fileHeaderText !== undefined) {
    const header = document.createElement("div");
    header.className = "file-header";
    const a = document.createElement("a");
    if (opts.fileHeaderTitle !== undefined) {
      a.setAttribute("title", opts.fileHeaderTitle);
    }
    if (opts.fileHeaderText !== undefined) {
      a.textContent = opts.fileHeaderText;
    }
    header.appendChild(a);
    wrapper.prepend(header);
  }

  // DOM に追加（document.body にマウントしないと closest が正しく動かない）
  document.body.appendChild(wrapper);
  return comment;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  // Feature が init されていた場合は destroy してクリーンアップ
  reviewCopyButtonFeature.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ===========================================================================
// getFileName のテスト
// ===========================================================================

describe("getFileName", () => {
  /**
   * 分岐 1: 祖先に data-tagsearch-path がある場合その値を返す
   */
  it("data-tagsearch-path の祖先要素が存在する場合、そのパスを返す", () => {
    const comment = buildReviewComment({ tagsearchPath: "src/foo/bar.ts" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn");
    expect(button).not.toBeNull();
    // ボタンが追加されるということは処理されたことを確認（ファイル名取得は click 時なので別途テスト）
  });

  /**
   * getFileName を DOM の構造から間接的に検証する:
   * クリップボード API をスパイして copyText の内容を確認する
   */
  it("data-tagsearch-path の値がコピーテキストの File: 行として含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      tagsearchPath: "src/foo/bar.ts",
      commentBody: "LGTM",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("File: src/foo/bar.ts");
  });

  /**
   * 分岐 2: data-tagsearch-path がなく .file[data-path] がある場合
   */
  it(".file[data-path] の値がコピーテキストの File: 行として含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      dataPath: "src/bar/baz.ts",
      commentBody: "fix this",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("File: src/bar/baz.ts");
  });

  /**
   * 分岐 3: .file-header a[title] からファイル名を取得する
   * (data-tagsearch-path も data-path もない場合)
   */
  it(".file-header の a[title] の値がコピーテキストの File: 行として含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      fileHeaderTitle: "src/hello/world.ts",
      commentBody: "nice",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("File: src/hello/world.ts");
  });

  /**
   * 分岐 4: Conversation タブ: .js-resolvable-timeline-thread-container 内の a[href*='/files']
   */
  it("スレッドコンテナ内の files リンクの textContent がコピーテキストに含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      threadFileLink: "src/conversation/file.ts",
      commentBody: "ok",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("File: src/conversation/file.ts");
  });

  /**
   * 分岐 5: 全ての祖先要素にファイル情報がない場合、File: 行を含まない
   */
  it("ファイル名の手がかりが全くない場合、File: 行をコピーテキストに含まない", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({ commentBody: "some comment" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).not.toContain("File:");
  });
});

// ===========================================================================
// getLineNumber のテスト
// ===========================================================================

describe("getLineNumber", () => {
  /**
   * 分岐 1: blob-num テーブルに 1行だけある場合 → "L{n}"
   */
  it("スニペットテーブルに行番号が 1つの場合 L{n} 形式でコピーテキストに含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({ blobLineNumbers: [42], commentBody: "comment" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("Line: L42");
  });

  /**
   * 分岐 1 (範囲): blob-num テーブルに複数行番号がある場合 → "L{first}-L{last}"
   */
  it("スニペットテーブルに複数の行番号がある場合 L{first}-L{last} 形式でコピーテキストに含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      blobLineNumbers: [302, 303, 305],
      commentBody: "comment",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("Line: L302-L305");
  });

  /**
   * 分岐 2: blob-num なし、diffHref にアンカー行番号がある場合
   */
  it("diffHref の R{n} アンカーから行番号を取得してコピーテキストに含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({
      diffHref: "https://github.com/org/repo/pull/1/files#diff-abc123R99",
      commentBody: "comment",
    });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("Line: L99");
  });

  /**
   * 分岐 3（全てなし）: 行番号の手がかりがない場合、Line: 行を含まない
   */
  it("行番号の手がかりが全くない場合、Line: 行をコピーテキストに含まない", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({ commentBody: "some text" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).not.toContain("Line:");
  });
});

// ===========================================================================
// getCommentBody のテスト
// ===========================================================================

describe("getCommentBody", () => {
  /**
   * 分岐 1: .comment-body が存在する場合、その innerText を返す
   */
  it(".comment-body の内容がコピーテキストの Comment: 以下に含まれる", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({ commentBody: "This is a review comment." });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("Comment:\nThis is a review comment.");
  });

  /**
   * 分岐 2: .comment-body がなく .markdown-body が存在する場合
   */
  it(".markdown-body の内容がコピーテキストの Comment: 以下に含まれる（フォールバック）", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment({ markdownBody: "Markdown content here." });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).toContain("Comment:\nMarkdown content here.");
  });

  /**
   * 分岐 3: .comment-body も .markdown-body も存在しない場合、Comment: 行を含まない
   */
  it("コメント本文が見つからない場合、Comment: 行をコピーテキストに含まない", async () => {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });

    const comment = buildReviewComment();
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);

    expect(written[0]).not.toContain("Comment:");
  });
});

// ===========================================================================
// formatCopyText のテスト（C2: 各引数の真偽の組み合わせ）
// ===========================================================================

describe("formatCopyText (各フィールドの有無の組み合わせ)", () => {
  async function copyAndGet(opts: ReviewCommentOptions): Promise<string> {
    const written: string[] = [];
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn((text: string) => {
          written.push(text);
          return Promise.resolve();
        }),
      },
    });
    const comment = buildReviewComment(opts);
    reviewCopyButtonFeature.init();
    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();
    await vi.waitFor(() => written.length > 0);
    return written[0];
  }

  it("fileName・lineNumber・comment が全て空の場合、空文字を返す", async () => {
    const text = await copyAndGet({});
    expect(text).toBe("");
  });

  it("fileName のみある場合、File: 行だけになる", async () => {
    const text = await copyAndGet({ tagsearchPath: "only/file.ts" });
    expect(text).toBe("File: only/file.ts");
  });

  it("lineNumber のみある場合、Line: 行だけになる", async () => {
    const text = await copyAndGet({ blobLineNumbers: [10] });
    expect(text).toBe("Line: L10");
  });

  it("comment のみある場合、Comment: 行だけになる", async () => {
    const text = await copyAndGet({ commentBody: "only comment" });
    expect(text).toBe("Comment:\nonly comment");
  });

  it("fileName と lineNumber がある場合、改行区切りで結合される", async () => {
    const text = await copyAndGet({
      tagsearchPath: "src/a.ts",
      blobLineNumbers: [5],
    });
    expect(text).toBe("File: src/a.ts\nLine: L5");
  });

  it("fileName と comment がある場合、改行区切りで結合される", async () => {
    const text = await copyAndGet({
      tagsearchPath: "src/b.ts",
      commentBody: "hello",
    });
    expect(text).toBe("File: src/b.ts\nComment:\nhello");
  });

  it("lineNumber と comment がある場合、改行区切りで結合される", async () => {
    const text = await copyAndGet({
      blobLineNumbers: [20],
      commentBody: "world",
    });
    expect(text).toBe("Line: L20\nComment:\nworld");
  });

  it("全フィールドが揃っている場合、File / Line / Comment の順で結合される", async () => {
    const text = await copyAndGet({
      tagsearchPath: "src/c.ts",
      blobLineNumbers: [100],
      commentBody: "full",
    });
    expect(text).toBe("File: src/c.ts\nLine: L100\nComment:\nfull");
  });
});

// ===========================================================================
// addCopyButtonToComment のテスト
// ===========================================================================

describe("addCopyButtonToComment", () => {
  /**
   * .timeline-comment-actions があればボタンが先頭に挿入される
   */
  it(".timeline-comment-actions の先頭にボタンが挿入される", () => {
    const comment = buildReviewComment({ commentBody: "test" });
    reviewCopyButtonFeature.init();

    const actions = comment.querySelector(".timeline-comment-actions")!;
    expect(actions.firstElementChild).not.toBeNull();
    expect(actions.firstElementChild!.classList.contains("gh-gearbox-copy-btn")).toBe(true);
  });

  /**
   * .timeline-comment-actions がない場合はボタンが挿入されない
   */
  it(".timeline-comment-actions がない場合はボタンが挿入されない", () => {
    const comment = buildReviewComment({ commentBody: "test", withActions: false });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector(".gh-gearbox-copy-btn");
    expect(button).toBeNull();
  });

  /**
   * 既に処理済み（PROCESSED_ATTR あり）の場合はスキップされる（ボタンが二重に挿入されない）
   */
  it("処理済みのコメントにはボタンが二重に挿入されない", () => {
    const comment = buildReviewComment({ commentBody: "test" });
    reviewCopyButtonFeature.init();
    reviewCopyButtonFeature.init(); // 2回 init

    const buttons = comment.querySelectorAll(".gh-gearbox-copy-btn");
    expect(buttons).toHaveLength(1);
  });
});

// ===========================================================================
// processAllReviewComments のテスト
// ===========================================================================

describe("processAllReviewComments", () => {
  it("複数の .review-comment 全てにボタンが追加される", () => {
    for (let i = 0; i < 3; i++) {
      buildReviewComment({ commentBody: `comment ${i}` });
    }
    reviewCopyButtonFeature.init();

    const buttons = document.querySelectorAll(".gh-gearbox-copy-btn");
    expect(buttons).toHaveLength(3);
  });
});

// ===========================================================================
// クリックコールバック（createCopyButton 内部）のテスト
// ===========================================================================

describe("コピーボタンのクリックコールバック", () => {
  it("クリップボードへの書き込みに成功した場合、一時的に success クラスが付与される", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(() => Promise.resolve()) },
    });

    const comment = buildReviewComment({ commentBody: "ok" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();

    // Promise の解決を待つ（マイクロタスクキューをフラッシュ）
    await Promise.resolve();
    await Promise.resolve();

    expect(button.classList.contains("gh-gearbox-copy-btn--success")).toBe(true);

    // 1500ms 後に元に戻る
    await vi.advanceTimersByTimeAsync(1500);
    expect(button.classList.contains("gh-gearbox-copy-btn--success")).toBe(false);

    vi.useRealTimers();
  });

  it("クリップボードへの書き込みに失敗した場合、console.error が呼ばれる", async () => {
    const error = new Error("denied");
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(() => Promise.reject(error)) },
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const comment = buildReviewComment({ commentBody: "fail" });
    reviewCopyButtonFeature.init();

    const button = comment.querySelector<HTMLButtonElement>(".gh-gearbox-copy-btn")!;
    button.click();

    await vi.waitFor(() => consoleSpy.mock.calls.length > 0);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[GitHub Gearbox] クリップボードへのコピーに失敗しました:",
      error,
    );
  });
});

// ===========================================================================
// Feature ライフサイクルのテスト
// ===========================================================================

describe("reviewCopyButtonFeature ライフサイクル", () => {
  it("Feature の id と name が正しく設定されている", () => {
    expect(reviewCopyButtonFeature.id).toBe("review-copy-button");
    expect(reviewCopyButtonFeature.name).toBe("レビューコメント コピー");
  });

  it("destroy() 後、追加されたボタンが全て除去される", () => {
    buildReviewComment({ commentBody: "test1" });
    buildReviewComment({ commentBody: "test2" });
    reviewCopyButtonFeature.init();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(2);

    reviewCopyButtonFeature.destroy();

    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(0);
  });

  it("destroy() 後、data-gh-gearbox-copy-btn 属性が全て除去される", () => {
    buildReviewComment({ commentBody: "test" });
    reviewCopyButtonFeature.init();

    expect(document.querySelectorAll("[data-gh-gearbox-copy-btn]")).toHaveLength(1);

    reviewCopyButtonFeature.destroy();

    expect(document.querySelectorAll("[data-gh-gearbox-copy-btn]")).toHaveLength(0);
  });

  it("destroy() 後に再び init() を呼ぶとボタンが再挿入される", () => {
    buildReviewComment({ commentBody: "test" });
    reviewCopyButtonFeature.init();
    reviewCopyButtonFeature.destroy();

    reviewCopyButtonFeature.init();
    expect(document.querySelectorAll(".gh-gearbox-copy-btn")).toHaveLength(1);
  });
});

// ===========================================================================
// MutationObserver のテスト（動的に追加されたコメントへの対応）
// ===========================================================================

describe("MutationObserver による動的コメントへの対応", () => {
  it("init() 後に DOM へ追加された .review-comment にもボタンが挿入される", async () => {
    reviewCopyButtonFeature.init();

    // 動的にコメントを追加
    const newComment = buildReviewComment({ commentBody: "dynamic" });

    // Observer のコールバックは micro/macro task で実行されるため少し待つ
    await vi.waitFor(() => {
      return newComment.querySelector(".gh-gearbox-copy-btn") !== null;
    });

    expect(newComment.querySelector(".gh-gearbox-copy-btn")).not.toBeNull();
  });
});
