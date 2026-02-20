/**
 * レビューコメントから対象行番号を取得する
 *
 * GitHub の DOM 構造 (Conversation タブ):
 * - .js-resolvable-timeline-thread-container 内にコードスニペットの table がある
 * - table 内の td.blob-num[data-line-number] に行番号が格納されている
 * - 最初と最後の行番号を取得して範囲を返す (例: "L302-L305")
 *
 * GitHub の DOM 構造 (Files changed タブ):
 * - コメント行の直前の diff 行から行番号を取得
 */
export const getLineNumber = (commentElement: HTMLElement): string => {
  // コメントスレッドコンテナを取得
  const threadContainer =
    commentElement.closest<HTMLElement>(".js-resolvable-timeline-thread-container") ??
    commentElement.closest<HTMLElement>(".comment-holder");

  if (threadContainer) {
    // 1. コードスニペットのテーブルから行番号を取得
    //    td.blob-num[data-line-number] にコードスニペットの各行の行番号が入っている
    const lineNumberCells = threadContainer.querySelectorAll<HTMLElement>(
      "td.blob-num[data-line-number]",
    );

    if (lineNumberCells.length > 0) {
      const lineNumbers = Array.from(lineNumberCells)
        .map((cell) => cell.getAttribute("data-line-number"))
        .filter((n): n is string => n !== null && n !== "")
        .map(Number)
        .filter((n) => !Number.isNaN(n));

      if (lineNumbers.length > 0) {
        const first = Math.min(...lineNumbers);
        const last = Math.max(...lineNumbers);
        if (first !== last) {
          return `L${first}-L${last}`;
        }
        return `L${first}`;
      }
    }

    // 2. フォールバック: summary 内のファイルリンクの href からアンカー行番号を抽出
    //    (例: href="...#diff-xxxR302" → 302)
    const fileLink = threadContainer.querySelector<HTMLAnchorElement>("a[href*='#diff-']");
    if (fileLink) {
      const href = fileLink.getAttribute("href") ?? "";
      const match = href.match(/R(\d+)$/);
      if (match) {
        return `L${match[1]}`;
      }
    }
  }

  // 3. フォールバック: コメント行の直前の diff 行から行番号を取得 (Files changed タブ)
  const commentRow = commentElement.closest<HTMLTableRowElement>("tr");
  if (commentRow) {
    let prevRow = commentRow.previousElementSibling as HTMLTableRowElement | null;
    while (prevRow) {
      const blobNum =
        prevRow.querySelector<HTMLElement>("td.blob-num-addition[data-line-number]") ??
        prevRow.querySelector<HTMLElement>("td.blob-num[data-line-number]:last-of-type");
      if (blobNum) {
        const lineNum = blobNum.getAttribute("data-line-number");
        if (lineNum) {
          return `L${lineNum}`;
        }
      }
      prevRow = prevRow.previousElementSibling as HTMLTableRowElement | null;
    }
  }

  return "";
};
