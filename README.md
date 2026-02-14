# GitHub Gearbox

GitHub の生産性を向上させる Chrome 拡張機能ツール集。

## 機能

### タスクリスト Label 拡張

GitHub の PR / Issue にあるタスクリスト（チェックボックス）で、チェックボックス横のテキスト部分をクリックしてもチェックの ON/OFF ができるようにします。

**Before:** チェックボックスの小さな四角部分のみクリック可能
**After:** テキスト部分をクリックしてもチェック可能

## 開発

### 前提条件

- Node.js 18+
- npm

### セットアップ

```bash
npm install
```

### ビルド

```bash
npm run build
```

### 開発モード（ファイル変更を監視して自動ビルド）

```bash
npm run dev
```

### Chrome への読み込み

1. `npm run build` を実行してビルド
2. Chrome で `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトの `dist` ディレクトリを選択
6. GitHub の PR や Issue ページを開いてタスクリストのテキストをクリックして動作確認

### ディレクトリ構成

```
src/
  content.ts              # Content Script エントリポイント
  background.ts           # Service Worker
  types.ts                # 共通型定義
  features/               # 機能モジュール（機能ごとに分割）
    taskListLabel/
      index.ts            # タスクリスト Label 機能
      styles.css           # スタイル
  popup/                  # Popup UI
    index.html
    popup.ts
    popup.css
public/
  manifest.json           # Chrome 拡張マニフェスト (Manifest V3)
  icons/                  # 拡張機能アイコン
```

## 新しい機能の追加方法

1. `src/features/` に新しいディレクトリを作成
2. `Feature` インターフェースを実装したモジュールを作成
3. `src/content.ts` の `features` 配列にインポートして追加

```typescript
// src/features/myNewFeature/index.ts
import type { Feature } from "../../types";

export const myNewFeature: Feature = {
  id: "my-new-feature",
  name: "新機能の名前",
  init() { /* 初期化処理 */ },
  destroy() { /* クリーンアップ処理 */ },
};
```

```typescript
// src/content.ts に追加
import { myNewFeature } from "./features/myNewFeature";
const features: Feature[] = [taskListLabelFeature, myNewFeature];
```
