/**
 * 各機能（Feature）が実装する型定義
 */
export type Feature = {
  /** 機能の一意な識別子 */
  id: string;
  /** 機能の表示名 */
  name: string;
  /** 機能を初期化して有効化する */
  init(): void;
  /** 機能を無効化してクリーンアップする */
  destroy(): void;
};
