/**
 * レビューコメントからファイル名を取得する
 *
 * GitHub の PR レビューコメントの DOM 構造:
 * - Files changed タブ: .file[data-tagsearch-path] > table > tr > td > ... > .review-comment
 * - Conversation タブ (旧): コメントスレッド内にファイルリンクがある
 * - Conversation タブ (新): review-thread-component の summary 内にファイルリンクがある
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
  //    旧: .js-resolvable-timeline-thread-container
  //    新: .review-thread-component (details > summary 内のリンク)
  const threadContainer = commentElement.closest<HTMLElement>(
    ".js-resolvable-timeline-thread-container, .review-thread-component",
  );
  if (threadContainer) {
    // summary 内のファイルリンク（新UI: text-mono クラスの a タグ）
    const monoLink = threadContainer.querySelector<HTMLAnchorElement>(
      "summary a.text-mono[href*='/files']",
    );
    if (monoLink) {
      return monoLink.textContent?.trim() ?? "";
    }

    // フォールバック: /files を含む任意のリンク
    const fileLink = threadContainer.querySelector<HTMLAnchorElement>("a[href*='/files']");
    if (fileLink) {
      return fileLink.textContent?.trim() ?? "";
    }
  }

  return "";
};
