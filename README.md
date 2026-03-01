# GitHub Gearbox

GitHub の生産性を向上させる Chrome 拡張機能ツール集。

## 機能一覧

### 1. タスクリスト Label 拡張

タスクリストのテキスト部分をクリックしてもチェックできるようにします。

### 2. レビューコメント コピー

PR レビューコメントのファイル名・行数・内容をワンクリックでコピーします。

### 3. レビューバッジ ツールバーボタン

PR レビューコメント入力欄のツールバーにドロップダウンボタンを追加します。  
選択したバッジ（`ask` / `must` / `imo` / `nits` / `next` / `memo` / `good`）のマークダウンをテキストエリアに挿入できます。

> バッジの仕様は [こちらの記事](https://zenn.dev/yumemi_inc/articles/review-badge) を参照してください。

## 開発

### セットアップ

```bash
npm install
```

Git フック（pre-commit lint / format チェック）をインストールします。

```bash
npx lefthook install
```

### スクリプト一覧

| コマンド | 説明 |
|---|---|
| `npm run dev` | ファイル変更を監視して自動ビルド |
| `npm run build` | 型チェック → プロダクションビルド |
| `npm run typecheck` | TypeScript 型チェックのみ |
| `npm run lint` | oxlint によるコード検査 |
| `npm run lint:fix` | oxlint による自動修正 |
| `npm run format` | oxfmt によるフォーマット |
| `npm run format:check` | oxfmt によるフォーマットチェック |
| `npm run test` | Vitest によるテスト実行 |
| `npm run test:watch` | Vitest ウォッチモード |
| `npm run test:coverage` | Vitest カバレッジレポート生成 |

### Chrome への読み込み

1. `npm run build` を実行してビルド
2. Chrome で `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このプロジェクトの `dist` ディレクトリを選択
6. GitHub の PR や Issue ページで各機能の動作を確認

## CI

プルリクエスト時に GitHub Actions で以下のチェックが自動実行されます。

- **lint-format.yml** — oxlint によるコード検査・oxfmt によるフォーマットチェック
- **test.yml** — Vitest によるユニットテスト

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

---