/**
 * レビューコメントからファイル名を取得する
 *
 * GitHub の PR レビューコメントの DOM 構造:
 * - Files changed タブ: .file[data-tagsearch-path] > table > tr > td > ... > .review-comment
 * - Conversation タブ: コメントスレッド内にファイルリンクがある
 */
export const getFileName = (commentElement: HTMLElement): string => {
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
