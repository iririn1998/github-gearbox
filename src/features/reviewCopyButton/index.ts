import type { Feature } from "../../types";

const FEATURE_ID = "review-copy-button";
const PROCESSED_ATTR = "data-gh-gearbox-copy-btn";

/** クリップボードアイコン (SVG) */
const CLIPBOARD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>`;

/** チェックマークアイコン (SVG) */
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>`;

let observer: MutationObserver | null = null;

/**
 * レビューコメントからファイル名を取得する
 *
 * GitHub の PR レビューコメントの DOM 構造:
 * - Files changed タブ: .file[data-tagsearch-path] > table > tr > td > ... > .review-comment
 * - Conversation タブ: コメントスレッド内にファイルリンクがある
 */
const getFileName = (commentElement: HTMLElement): string => {
  // 1. 祖先の .file 要素から data-tagsearch-path を取得（Files changed タブ）
  const fileWrapper = commentElement.closest<HTMLElement>("[data-tagsearch-path]");
  if (fileWrapper) {
    return fileWrapper.getAttribute("data-tagsearch-path") ?? "";
  }

  // 2. 祖先の .file 要素から data-path を取得
  const fileContainer = commentElement.closest<HTMLElement>(".file[data-path]");
  if (fileContainer) {
    return fileContainer.getAttribute("data-path") ?? "";
  }

  // 3. .file-header 内の a[title] からファイル名を取得
  const fileElement = commentElement.closest<HTMLElement>(".file");
  if (fileElement) {
    const fileLink = fileElement.querySelector<HTMLElement>(".file-header a[title], .file-info a");
    if (fileLink) {
      return fileLink.getAttribute("title") ?? fileLink.textContent?.trim() ?? "";
    }
  }

  // 4. Conversation タブ: コメントスレッドのヘッダーにあるファイルリンク
  //    (.js-resolvable-timeline-thread-container 内の summary にファイル名リンクがある)
  const threadContainer = commentElement.closest<HTMLElement>(
    ".js-resolvable-timeline-thread-container",
  );
  if (threadContainer) {
    const fileLink = threadContainer.querySelector<HTMLAnchorElement>("a[href*='/files']");
    if (fileLink) {
      return fileLink.textContent?.trim() ?? "";
    }
  }

  return "";
};

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
const getLineNumber = (commentElement: HTMLElement): string => {
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

/**
 * レビューコメントの本文テキストを取得する
 */
const getCommentBody = (commentElement: HTMLElement): string => {
  // .comment-body 内のテキストを取得（GitHub はレンダリング済みHTMLを .comment-body 内に配置）
  const commentBody = commentElement.querySelector<HTMLElement>(".comment-body");
  if (commentBody) {
    return commentBody.innerText.trim();
  }

  // フォールバック: .markdown-body から取得
  const markdownBody = commentElement.querySelector<HTMLElement>(".markdown-body");
  if (markdownBody) {
    return markdownBody.innerText.trim();
  }

  return "";
};

/**
 * コピー用テキストをフォーマットする
 */
const formatCopyText = (fileName: string, lineNumber: string, comment: string): string => {
  const parts: string[] = [];

  if (fileName) {
    parts.push(`File: ${fileName}`);
  }

  if (lineNumber) {
    parts.push(`Line: ${lineNumber}`);
  }

  if (comment) {
    parts.push(`Comment:\n${comment}`);
  }

  return parts.join("\n");
};

/**
 * コピーボタンを作成する
 */
const createCopyButton = (commentElement: HTMLElement): HTMLButtonElement => {
  const button = document.createElement("button");
  button.className = "gh-gearbox-copy-btn";
  button.type = "button";
  button.title = "レビューコメントをコピー";
  button.innerHTML = CLIPBOARD_ICON;

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const fileName = getFileName(commentElement);
    const lineNumber = getLineNumber(commentElement);
    const commentBody = getCommentBody(commentElement);

    const copyText = formatCopyText(fileName, lineNumber, commentBody);

    try {
      await navigator.clipboard.writeText(copyText);

      // 成功フィードバック: チェックマークアイコンに変更
      button.innerHTML = CHECK_ICON;
      button.classList.add("gh-gearbox-copy-btn--success");

      setTimeout(() => {
        button.innerHTML = CLIPBOARD_ICON;
        button.classList.remove("gh-gearbox-copy-btn--success");
      }, 1500);
    } catch (error) {
      console.error("[GitHub Gearbox] クリップボードへのコピーに失敗しました:", error);
    }
  });

  return button;
};

/**
 * 単一のレビューコメントにコピーボタンを追加する
 */
const addCopyButtonToComment = (commentElement: HTMLElement): void => {
  // 既に処理済みならスキップ
  if (commentElement.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  // コメントヘッダーのアクション領域を探す
  // .timeline-comment-actions は .review-comment 直下のヘッダー内にある
  const headerActions = commentElement.querySelector<HTMLElement>(".timeline-comment-actions");

  if (headerActions) {
    const button = createCopyButton(commentElement);
    // アクションメニューの先頭に挿入
    headerActions.prepend(button);
  }

  // 処理済みマークを付与
  commentElement.setAttribute(PROCESSED_ATTR, "true");
};

/**
 * ページ内の全レビューコメントにコピーボタンを追加する
 *
 * ターゲットは .review-comment のみ。
 * .js-comment-container は .review-comment を内包する親要素であり、
 * 両方をターゲットにするとボタンが2重に挿入されるため除外する。
 */
const processAllReviewComments = (): void => {
  const comments = document.querySelectorAll<HTMLElement>(
    `.review-comment:not([${PROCESSED_ATTR}])`,
  );
  comments.forEach(addCopyButtonToComment);
};

/**
 * MutationObserver を開始して動的に追加されるコメントにも対応する
 */
const startObserver = (): void => {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (
              node.classList?.contains("review-comment") ||
              node.querySelector?.(".review-comment")
            ) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
      if (shouldProcess) break;
    }

    if (shouldProcess) {
      processAllReviewComments();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * クリーンアップ: 追加したコピーボタンと属性を全て除去する
 */
const cleanup = (): void => {
  // Observer を停止
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // 追加したコピーボタンを全て除去
  const buttons = document.querySelectorAll<HTMLElement>(".gh-gearbox-copy-btn");
  buttons.forEach((btn) => btn.remove());

  // 処理済みマークを除去
  const processedElements = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedElements.forEach((el) => el.removeAttribute(PROCESSED_ATTR));
};

/**
 * レビューコメント コピーボタン機能
 */
export const reviewCopyButtonFeature: Feature = {
  id: FEATURE_ID,
  name: "レビューコメント コピー",

  init(): void {
    processAllReviewComments();
    startObserver();
  },

  destroy(): void {
    cleanup();
  },
};
