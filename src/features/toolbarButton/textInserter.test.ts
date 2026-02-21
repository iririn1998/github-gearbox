/**
 * textInserter のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * 対象:
 *   - findAssociatedTextarea:
 *       from の祖先要素に textarea がある場合 / ない場合 / document.body に到達した場合
 *   - insertTextAtCursor:
 *       execCommand 成功分岐 / 失敗分岐（フォールバック）
 *       selectionStart/End が null の場合 / 0 の場合 / 文字列中間の場合
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { findAssociatedTextarea, insertTextAtCursor } from "./textInserter";

// ---------------------------------------------------------------------------
// ヘルパー: happy-dom には document.execCommand が未定義のため
//           Object.defineProperty で先にプロパティを生やしてから spyOn する
// ---------------------------------------------------------------------------

/**
 * document.execCommand をスタブし、戻り値を固定する。
 * afterEach で vi.restoreAllMocks() を呼ぶことで元に戻る。
 */
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
// findAssociatedTextarea
// ---------------------------------------------------------------------------

describe("findAssociatedTextarea", () => {
  it("直接の祖先に textarea がある場合、その textarea を返す（条件: 祖先に textarea = 真）", () => {
    const wrapper = document.createElement("div");
    const textarea = document.createElement("textarea");
    wrapper.appendChild(textarea);
    document.body.appendChild(wrapper);

    const from = document.createElement("button");
    wrapper.appendChild(from);

    expect(findAssociatedTextarea(from)).toBe(textarea);
  });

  it("一段上の祖先に textarea がある場合も検出できる", () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    const textarea = document.createElement("textarea");
    outer.appendChild(textarea);
    outer.appendChild(inner);
    document.body.appendChild(outer);

    const from = document.createElement("button");
    inner.appendChild(from);

    expect(findAssociatedTextarea(from)).toBe(textarea);
  });

  it("どの祖先にも textarea がない場合、null を返す（条件: 祖先に textarea = 偽）", () => {
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);

    const from = document.createElement("button");
    wrapper.appendChild(from);

    expect(findAssociatedTextarea(from)).toBeNull();
  });

  it("document.body まで遡っても見つからない場合、null を返す（ループ終端分岐 = 真）", () => {
    // from が body の直接の子 → parentElement === document.body でループを抜ける
    const from = document.createElement("button");
    document.body.appendChild(from);

    expect(findAssociatedTextarea(from)).toBeNull();
  });

  it("from.parentElement が null の場合（孤立ノード）、null を返す", () => {
    const from = document.createElement("button");
    // DOM に追加しない → parentElement は null
    expect(findAssociatedTextarea(from)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// insertTextAtCursor
// ---------------------------------------------------------------------------

describe("insertTextAtCursor", () => {
  it("execCommand が成功した場合、フォールバック処理を行わない（success = 真）", () => {
    mockExecCommand(true);

    const textarea = document.createElement("textarea");
    textarea.value = "hello";
    document.body.appendChild(textarea);

    // focus() が FocusEvent を発火するため dispatchEvent 全体ではなく
    // フォールバック経路の input イベントのみを監視する
    const inputEvents: Event[] = [];
    textarea.addEventListener("input", (e) => inputEvents.push(e));

    insertTextAtCursor(textarea, " world");

    expect(inputEvents).toHaveLength(0);
  });

  it("execCommand が失敗した場合、カーソル位置にテキストが挿入される（success = 偽）", () => {
    mockExecCommand(false);

    const textarea = document.createElement("textarea");
    textarea.value = "hello";
    textarea.selectionStart = 5;
    textarea.selectionEnd = 5;
    document.body.appendChild(textarea);

    insertTextAtCursor(textarea, " world");

    expect(textarea.value).toBe("hello world");
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
  });

  it("execCommand 失敗時、input イベントが発火される", () => {
    mockExecCommand(false);

    const textarea = document.createElement("textarea");
    textarea.value = "";
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    document.body.appendChild(textarea);

    const inputSpy = vi.fn();
    textarea.addEventListener("input", inputSpy);

    insertTextAtCursor(textarea, "abc");

    expect(inputSpy).toHaveBeenCalledTimes(1);
  });

  it("execCommand 失敗時、選択範囲がある場合は選択テキストを置換する（start !== end）", () => {
    mockExecCommand(false);

    const textarea = document.createElement("textarea");
    textarea.value = "hello world";
    textarea.selectionStart = 6;
    textarea.selectionEnd = 11; // "world" を選択
    document.body.appendChild(textarea);

    insertTextAtCursor(textarea, "there");

    expect(textarea.value).toBe("hello there");
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
  });

  it("execCommand 失敗時、selectionStart が null の場合は末尾に挿入される（null 分岐 = 真）", () => {
    mockExecCommand(false);

    const textarea = document.createElement("textarea");
    textarea.value = "abc";
    document.body.appendChild(textarea);

    // happy-dom では selectionStart/End を null に設定できないため
    // Object.defineProperty でオーバーライドしてテストする。
    // setter も定義しないと insertTextAtCursor 内の代入が TypeError になる。
    let _start: number | null = null;
    let _end: number | null = null;
    Object.defineProperty(textarea, "selectionStart", {
      get: () => _start,
      set: (v: number | null) => {
        _start = v;
      },
      configurable: true,
    });
    Object.defineProperty(textarea, "selectionEnd", {
      get: () => _end,
      set: (v: number | null) => {
        _end = v;
      },
      configurable: true,
    });

    insertTextAtCursor(textarea, "X");

    // 末尾 (length=3) に挿入されているはず
    expect(textarea.value).toBe("abcX");
  });

  it("テキストが空文字列の場合、値は変わらない（フォールバック時）", () => {
    mockExecCommand(false);

    const textarea = document.createElement("textarea");
    textarea.value = "hello";
    textarea.selectionStart = 2;
    textarea.selectionEnd = 2;
    document.body.appendChild(textarea);

    insertTextAtCursor(textarea, "");

    expect(textarea.value).toBe("hello");
  });
});
