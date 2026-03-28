/** レビューバッジのメニュー項目 */
export type DropdownItem = {
  /** メニューに表示するラベル */
  label: string;
  /** textarea に挿入するマークダウンテキスト */
  text: string;
};

/**
 * レビューバッジの選択肢
 * @see https://zenn.dev/yumemi_inc/articles/review-badge
 */
export const DROPDOWN_ITEMS: readonly DropdownItem[] = [
  {
    label: chrome.i18n.getMessage("badgeLabelAsk"),
    text: "![ask-badge](https://img.shields.io/badge/review-ask-yellowgreen.svg)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelMust"),
    text: "![must-badge](https://img.shields.io/badge/review-must-red.svg)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelImo"),
    text: "![imo-badge](https://img.shields.io/badge/review-imo-orange.svg)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelNits"),
    text: "![nits-badge](https://img.shields.io/badge/review-nits-green.svg)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelNext"),
    text: "![next-badge](https://img.shields.io/badge/review-next-blueviolet)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelMemo"),
    text: "![memo-badge](https://img.shields.io/badge/review-memo-lightgrey)",
  },
  {
    label: chrome.i18n.getMessage("badgeLabelGood"),
    text: "![good-badge](https://img.shields.io/badge/review-good-brightgreen.svg)",
  },
];
