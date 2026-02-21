/**
 * ツールバーボタン機能 エントリポイント
 *
 * GitHub のコメントフォームツールバーにレビューバッジ挿入ボタンを追加する。
 */

import type { Feature } from "../../types";
import { FEATURE_ID } from "./constants";
import { closeDropdown } from "./dropdown";
import { processAllToolbars, cleanupToolbarButtons } from "./toolbarButton";
import { startObserver, stopObserver } from "./observer";

// ---------------------------------------------------------------------------
// クリーンアップ
// ---------------------------------------------------------------------------

/**
 * 機能全体のクリーンアップを行う
 *
 * Observer 停止・ドロップダウン閉鎖・挿入済み要素の除去を一括実行する。
 */
const cleanup = (): void => {
  stopObserver();
  closeDropdown();
  cleanupToolbarButtons();
};

// ---------------------------------------------------------------------------
// Feature エクスポート
// ---------------------------------------------------------------------------

/**
 * ツールバーボタン機能
 */
export const toolbarButtonFeature: Feature = {
  id: FEATURE_ID,
  name: "ツールバーボタン",

  init(): void {
    processAllToolbars();
    startObserver();
  },

  destroy(): void {
    cleanup();
  },
};
