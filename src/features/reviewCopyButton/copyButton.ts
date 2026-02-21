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
  button.title = "レビューコメントをコピー";
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

      // 成功フィードバック: チェックマークアイコンに変更
      button.innerHTML = checkIcon;
      button.classList.add(COPY_BTN_SUCCESS_CLASS);

      setTimeout(() => {
        button.innerHTML = clipboardIcon;
        button.classList.remove(COPY_BTN_SUCCESS_CLASS);
      }, SUCCESS_DURATION_MS);
    } catch (error) {
      console.error("[GitHub Gearbox] クリップボードへのコピーに失敗しました:", error);
    }
  });

  return button;
};

/**
 * 単一のレビューコメントにコピーボタンを追加する
 */
export const addCopyButtonToComment = (commentElement: HTMLElement): void => {
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
export const processAllReviewComments = (): void => {
  const comments = document.querySelectorAll<HTMLElement>(
    `.review-comment:not([${PROCESSED_ATTR}])`,
  );
  comments.forEach(addCopyButtonToComment);
};

/**
 * クリーンアップ: 追加したコピーボタンと属性を全て除去する
 */
export const cleanupButtons = (): void => {
  // 追加したコピーボタンを全て除去
  const buttons = document.querySelectorAll<HTMLElement>(`.${COPY_BTN_CLASS}`);
  buttons.forEach((btn) => btn.remove());

  // 処理済みマークを除去
  const processedElements = document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`);
  processedElements.forEach((el) => el.removeAttribute(PROCESSED_ATTR));
};
