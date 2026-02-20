/**
 * レビューコメントの本文テキストを取得する
 */
export const getCommentBody = (commentElement: HTMLElement): string => {
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
