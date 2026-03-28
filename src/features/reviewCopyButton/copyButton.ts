import clipboardIcon from "./icons/clipboard.svg?raw";
import checkIcon from "./icons/check.svg?raw";
import { PROCESSED_ATTR, COPY_BTN_CLASS, COPY_BTN_SUCCESS_CLASS } from "./constants";
import { getFileName } from "./getFileName";
import { getLineNumber } from "./getLineNumber";
import { getCommentBody } from "./getCommentBody";
import { formatCopyText } from "./formatCopyText";

const SUCCESS_DURATION_MS = 1500;

/**
 * コピーボタンを作成する
 */
export const createCopyButton = (commentElement: HTMLElement): HTMLButtonElement => {
  const button = document.createElement("button");
  button.className = COPY_BTN_CLASS;
  button.type = "button";
  button.title = chrome.i18n.getMessage("copyReviewComment");
  button.innerHTML = clipboardIcon;

  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const fileName = getFileName(commentElement);
    const lineNumber = getLineNumber(commentElement);
    const commentBody = getCommentBody(commentElement);

    const copyText = formatCopyText(fileName, lineNumber, commentBody);

    try {
      await navigator.clipboard.writeText(copyText);

      button.innerHTML = checkIcon;
      button.classList.add(COPY_BTN_SUCCESS_CLASS);

      setTimeout(() => {
        button.innerHTML = clipboardIcon;
        button.classList.remove(COPY_BTN_SUCCESS_CLASS);
      }, SUCCESS_DURATION_MS);
    } catch (error) {
      console.error(`[GitHub Gearbox] ${chrome.i18n.getMessage("clipboardCopyFailed")}`, error);
    }
  });

  return button;
};

/**
 * コメント要素からボタン挿入先を見つける
 *
 * 旧UI: .timeline-comment-actions
 * 新UI (React): [class*="ActionsButtonsContainer"] または [data-testid="comment-header"]
 */
const findInsertionTarget = (
  commentElement: HTMLElement,
): { container: HTMLElement; method: "prepend" | "append" } | null => {
  // 旧UI: .timeline-comment-actions
  const legacyActions = commentElement.querySelector<HTMLElement>(".timeline-comment-actions");
  if (legacyActions) {
    return { container: legacyActions, method: "prepend" };
  }

  // 新UI: ActionsButtonsContainer (React コンポーネント内)
  const reactActions = commentElement.querySelector<HTMLElement>(
    '[class*="ActionsButtonsContainer"]',
  );
  if (reactActions) {
    return { container: reactActions, method: "prepend" };
  }

  // 新UI: comment-header の右側アクション領域
  const headerActions = commentElement.querySelector<HTMLElement>(
    '[data-testid="comment-header-right-side-items"]',
  );
  if (headerActions) {
    return { container: headerActions, method: "prepend" };
  }

  return null;
};

/**
 * 単一のレビューコメントにコピーボタンを追加する
 */
export const addCopyButtonToComment = (commentElement: HTMLElement): void => {
  if (commentElement.hasAttribute(PROCESSED_ATTR)) {
    return;
  }

  const target = findInsertionTarget(commentElement);

  if (target) {
    const button = createCopyButton(commentElement);
    if (target.method === "prepend") {
      target.container.prepend(button);
    } else {
      target.container.append(button);
    }
  }

  commentElement.setAttribute(PROCESSED_ATTR, "true");
};

/**
 * レビューコメント要素のセレクタ
 *
 * 旧UI: .review-comment
 * 新UI: [data-testid="automated-review-comment"], review-thread-component 内のコメント
 */
const COMMENT_SELECTORS = [
  `.review-comment:not([${PROCESSED_ATTR}])`,
  `[data-testid="automated-review-comment"]:not([${PROCESSED_ATTR}])`,
  `.review-thread-component .js-comments-holder > div:not([${PROCESSED_ATTR}])`,
].join(", ");

/**
 * ページ内の全レビューコメントにコピーボタンを追加する
 */
export const processAllReviewComments = (): void => {
  const comments = document.querySelectorAll<HTMLElement>(COMMENT_SELECTORS);
  comments.forEach(addCopyButtonToComment);
};

/**
 * クリーンアップ: 追加したコピーボタンと属性を全て除去する
 */
export const cleanupButtons = (): void => {
  const buttons = document.querySelectorAll<HTMLElement>(`.${COPY_BTN_CLASS}`);
  buttons.forEach((btn) => btn.remove());

  const processedElements = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedElements.forEach((el) => el.removeAttribute(PROCESSED_ATTR));
};
