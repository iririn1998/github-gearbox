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
    label: "ask  - 確認・質問",
    text: "![ask-badge](https://img.shields.io/badge/review-ask-yellowgreen.svg)",
  },
  {
    label: "must - 必須の修正",
    text: "![must-badge](https://img.shields.io/badge/review-must-red.svg)",
  },
  {
    label: "imo  - 個人的意見",
    text: "![imo-badge](https://img.shields.io/badge/review-imo-orange.svg)",
  },
  {
    label: "nits - 軽微な指摘",
    text: "![nits-badge](https://img.shields.io/badge/review-nits-green.svg)",
  },
  {
    label: "next - 次回対応",
    text: "![next-badge](https://img.shields.io/badge/review-next-blueviolet)",
  },
  {
    label: "memo - メモ",
    text: "![memo-badge](https://img.shields.io/badge/review-memo-lightgrey)",
  },
  {
    label: "good - 良いコード",
    text: "![good-badge](https://img.shields.io/badge/review-good-brightgreen.svg)",
  },
];
