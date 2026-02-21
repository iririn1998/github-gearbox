/**
 * formatCopyText のテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * `formatCopyText` は純粋関数なので、各引数（fileName / lineNumber / comment）の
 * 真偽を組み合わせた 2^3 = 8 パターン全てを検証する。
 */

import { describe, it, expect } from "vitest";
import { formatCopyText } from "./formatCopyText";

describe("formatCopyText", () => {
  // ----- C2: 全条件の真偽の組み合わせ (8パターン) -----

  it("fileName・lineNumber・comment が全て空の場合、空文字を返す", () => {
    expect(formatCopyText("", "", "")).toBe("");
  });

  it("fileName のみある場合、File: 行だけを返す", () => {
    expect(formatCopyText("src/foo.ts", "", "")).toBe("File: src/foo.ts");
  });

  it("lineNumber のみある場合、Line: 行だけを返す", () => {
    expect(formatCopyText("", "L42", "")).toBe("Line: L42");
  });

  it("comment のみある場合、Comment: ヘッダー＋本文を返す", () => {
    expect(formatCopyText("", "", "LGTM")).toBe("Comment:\nLGTM");
  });

  it("fileName と lineNumber がある場合、改行区切りで結合される", () => {
    expect(formatCopyText("src/a.ts", "L5", "")).toBe("File: src/a.ts\nLine: L5");
  });

  it("fileName と comment がある場合、改行区切りで結合される", () => {
    expect(formatCopyText("src/b.ts", "", "fix this")).toBe("File: src/b.ts\nComment:\nfix this");
  });

  it("lineNumber と comment がある場合、改行区切りで結合される", () => {
    expect(formatCopyText("", "L20", "world")).toBe("Line: L20\nComment:\nworld");
  });

  it("全フィールドが揃っている場合、File / Line / Comment の順で結合される", () => {
    expect(formatCopyText("src/c.ts", "L100", "full")).toBe(
      "File: src/c.ts\nLine: L100\nComment:\nfull",
    );
  });

  // ----- 境界値: 空白・改行を含む値 -----

  it("comment に改行が含まれていてもそのまま出力される", () => {
    const result = formatCopyText("", "", "line1\nline2");
    expect(result).toBe("Comment:\nline1\nline2");
  });

  it("fileName に空白が含まれていてもそのまま出力される", () => {
    const result = formatCopyText("src/my file.ts", "", "");
    expect(result).toBe("File: src/my file.ts");
  });
});
