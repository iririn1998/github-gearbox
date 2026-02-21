/**
 * テキスト挿入ユーティリティ
 *
 * textarea へのテキスト挿入に関する純粋なロジックを提供する。
 * DOM ツリーのトラバースとテキスト挿入を分離することで単体テストを容易にする。
 */

/**
 * ツールバーに紐づく textarea を DOM ツリーを遡って探す
 *
 * @param from - 探索の起点となる要素
 * @returns 見つかった textarea、見つからない場合は null
 */
export const findAssociatedTextarea = (from: HTMLElement): HTMLTextAreaElement | null => {
  let el: HTMLElement | null = from.parentElement;
  while (el && el !== document.body) {
    const textarea = el.querySelector<HTMLTextAreaElement>("textarea");
    if (textarea) return textarea;
    el = el.parentElement;
  }
  return null;
};

/**
 * textarea のカーソル位置にテキストを挿入する
 *
 * execCommand でアンドゥ履歴を保持したまま挿入を試みる。
 * 失敗した場合はフォールバックとして手動で値を書き換え input イベントを発火する。
 *
 * @param textarea - 挿入先の textarea
 * @param text - 挿入するテキスト
 */
export const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string): void => {
  textarea.focus();
  // execCommand はアンドゥ履歴を保持したまま挿入できる
  const success = document.execCommand("insertText", false, text);
  if (!success) {
    // フォールバック: 手動で値を書き換えて input イベントを発火
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
};
