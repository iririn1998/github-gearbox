/** 機能ID */
export const FEATURE_ID = "toolbar-button";

/** ツールバーに処理済みマークを付与する属性名 */
export const PROCESSED_ATTR = "data-gh-gearbox-toolbar-btn";

/** カスタムボタンに付与するクラス名 */
export const BUTTON_CLASS = "gh-gearbox-toolbar-btn";

/** ツールチップに付与するクラス名 */
export const TOOLTIP_CLASS = "gh-gearbox-toolbar-tooltip";

/** グループ要素に付与するクラス名 */
export const GROUP_CLASS = "gh-gearbox-toolbar-group";

/** ドロップダウン要素に付与するクラス名 */
export const DROPDOWN_CLASS = "gh-gearbox-dropdown";

/** ドロップダウンが開いているときに付与するクラス名 */
export const DROPDOWN_OPEN_CLASS = "gh-gearbox-dropdown--open";

/**
 * ツールバーのセレクタ
 * ハッシュ付きクラス名はビルドごとに変わる可能性があるため、
 * role と aria-label 属性で特定する
 */
export const TOOLBAR_SELECTOR = 'div[role="toolbar"][aria-label="Formatting tools"]';
