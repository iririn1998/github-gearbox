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
 * GitHub の PR レビューコメントは以下のいずれかの構造に含まれる:
 * 1. Files changed タブ: .file[data-path] > ... > コメント
 * 2. Conversation タブ: .timeline-comment-group 内にファイルパス情報がある
 */
function getFileName(commentElement: HTMLElement): string {
  // 1. Files changed タブ: 祖先の .file 要素から data-path を取得
  const fileContainer = commentElement.closest<HTMLElement>(".file[data-path]");
  if (fileContainer) {
    return fileContainer.getAttribute("data-path") ?? "";
  }

  // 2. copilot-diff-entry 要素の data-file-path 属性
  const diffEntry = commentElement.closest<HTMLElement>("[data-file-path]");
  if (diffEntry) {
    return diffEntry.getAttribute("data-file-path") ?? "";
  }

  // 3. Conversation タブ: コメントスレッド内のファイルリンクから取得
  const threadContainer = commentElement.closest<HTMLElement>(
    ".inline-comment-form-container, .review-thread-component, .js-resolvable-timeline-thread-container",
  );
  if (threadContainer) {
    // スレッドヘッダーにあるファイルパスリンクを探す
    const fileLink = threadContainer.querySelector<HTMLAnchorElement>(
      "a[href*='/files']",
    );
    if (fileLink) {
      // リンクテキストからファイル名を取得
      return fileLink.textContent?.trim() ?? "";
    }
  }

  // 4. .file-header 内の .file-info から取得
  const fileHeader = commentElement
    .closest<HTMLElement>(".file")
    ?.querySelector<HTMLElement>(".file-header .file-info a, .file-header .file-info .Truncate a");
  if (fileHeader) {
    return fileHeader.textContent?.trim() ?? "";
  }

  return "unknown";
}

/**
 * レビューコメントから対象行番号を取得する
 *
 * コメントスレッドは diff テーブル内の tr 要素に配置されており、
 * 直前の行の td.blob-num から行番号を取得できる
 */
function getLineNumber(commentElement: HTMLElement): string {
  // 1. コメントが含まれる tr の直前の行から行番号を取得
  const commentRow = commentElement.closest<HTMLTableRowElement>("tr");
  if (commentRow) {
    // 直前の兄弟 tr を遡って行番号を探す
    let prevRow = commentRow.previousElementSibling as HTMLTableRowElement | null;
    while (prevRow) {
      const blobNums = prevRow.querySelectorAll<HTMLElement>("td.blob-num[data-line-number]");
      if (blobNums.length > 0) {
        // 右側（新しいコード側）の行番号を優先
        const lastBlobNum = blobNums[blobNums.length - 1];
        const lineNum = lastBlobNum.getAttribute("data-line-number");
        if (lineNum) {
          return `L${lineNum}`;
        }
      }
      prevRow = prevRow.previousElementSibling as HTMLTableRowElement | null;
    }
  }

  // 2. Conversation タブのスレッドヘッダーから行番号リンクを取得
  const threadContainer = commentElement.closest<HTMLElement>(
    ".inline-comment-form-container, .review-thread-component, .js-resolvable-timeline-thread-container",
  );
  if (threadContainer) {
    const lineLink = threadContainer.querySelector<HTMLAnchorElement>(
      "a[href*='#diff-']",
    );
    if (lineLink) {
      // href から行番号を抽出 (例: #diff-xxxR42, #diff-xxxL42-R50)
      const href = lineLink.getAttribute("href") ?? "";
      const lineMatch = href.match(/[RL](\d+)(?:-[RL](\d+))?$/);
      if (lineMatch) {
        if (lineMatch[2]) {
          return `L${lineMatch[1]}-L${lineMatch[2]}`;
        }
        return `L${lineMatch[1]}`;
      }
      // リンクテキストに行番号が含まれている場合
      const text = lineLink.textContent?.trim() ?? "";
      if (text) {
        return text;
      }
    }
  }

  return "";
}

/**
 * レビューコメントの本文テキストを取得する
 */
function getCommentBody(commentElement: HTMLElement): string {
  const markdownBody = commentElement.querySelector<HTMLElement>(
    ".comment-body .markdown-body, .markdown-body",
  );
  if (markdownBody) {
    return markdownBody.innerText.trim();
  }

  // フォールバック: .comment-body から直接取得
  const commentBody = commentElement.querySelector<HTMLElement>(".comment-body");
  if (commentBody) {
    return commentBody.innerText.trim();
  }

  return "";
}

/**
 * コピー用テキストをフォーマットする
 */
function formatCopyText(fileName: string, lineNumber: string, comment: string): string {
  const parts: string[] = [];

  if (fileName && fileName !== "unknown") {
    parts.push(`File: ${fileName}`);
  }

  if (lineNumber) {
    parts.push(`Line: ${lineNumber}`);
  }

  if (comment) {
    parts.push(`Comment:\n${comment}`);
  }

  return parts.join("\n");
}

/**
 * コピーボタンを作成する
 */
function createCopyButton(commentElement: HTMLElement): HTMLButtonElement {
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
}

/**
 * 単一のレビューコメントにコピーボタンを追加する
 */
function addCopyButtonToComment(commentElement: HTMLElement): void {
  // 既に処理済みならスキップ
  if (commentElement.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  // コメントヘッダーのアクション領域を探す
  const headerActions =
    commentElement.querySelector<HTMLElement>(
      ".timeline-comment-actions, .review-comment-contents .timeline-comment-actions",
    ) ??
    commentElement.querySelector<HTMLElement>(
      ".comment-header .timeline-comment-actions",
    ) ??
    commentElement.querySelector<HTMLElement>(
      // GitHub の新しいUI構造にも対応
      ".timeline-comment-header .timeline-comment-actions",
    );

  if (headerActions) {
    const button = createCopyButton(commentElement);
    // アクションメニューの先頭に挿入
    headerActions.prepend(button);
  } else {
    // アクション領域が見つからない場合、コメントヘッダーの末尾に追加
    const commentHeader = commentElement.querySelector<HTMLElement>(
      ".timeline-comment-header, .comment-header",
    );
    if (commentHeader) {
      const button = createCopyButton(commentElement);
      commentHeader.appendChild(button);
    }
  }

  // 処理済みマークを付与
  commentElement.setAttribute(PROCESSED_ATTR, "true");
}

/**
 * ページ内の全レビューコメントにコピーボタンを追加する
 */
function processAllReviewComments(): void {
  // PR の Files changed タブ、Conversation タブのレビューコメントを対象
  const selectors = [
    // インラインレビューコメント（Files changed タブ）
    `.review-comment:not([${PROCESSED_ATTR}])`,
    // タイムラインのレビューコメント（Conversation タブ）
    `.timeline-comment-group .review-comment:not([${PROCESSED_ATTR}])`,
    // 個別のタイムラインコメント
    `.js-comment-container:not([${PROCESSED_ATTR}])`,
  ].join(", ");

  const comments = document.querySelectorAll<HTMLElement>(selectors);
  comments.forEach(addCopyButtonToComment);
}

/**
 * MutationObserver を開始して動的に追加されるコメントにも対応する
 */
function startObserver(): void {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // レビューコメント関連の要素が追加されたか確認
            if (
              node.classList?.contains("review-comment") ||
              node.classList?.contains("js-comment-container") ||
              node.querySelector?.(".review-comment") ||
              node.querySelector?.(".js-comment-container") ||
              node.classList?.contains("js-resolvable-timeline-thread-container")
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
}

/**
 * クリーンアップ: 追加したコピーボタンと属性を全て除去する
 */
function cleanup(): void {
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
}

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
