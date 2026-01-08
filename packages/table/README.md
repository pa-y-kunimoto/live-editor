# @live-editor/table

テーブルの生成とレンダリング機能を提供するパッケージ。`/table` コマンドのサポートを含む。

## インストール

```bash
pnpm add @live-editor/core @live-editor/table
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| `useTableGenerator` | テーブルMarkdownの生成 |
| `useTableCommand` | `/table` コマンドのハンドラー |
| `useTableRenderer` | テーブルをHTMLにレンダリング |

## 使い方

### useTableGenerator

テーブルMarkdownを生成するComposable。

```typescript
import { useTableGenerator } from '@live-editor/table';

const { generateTableMarkdown, parseTableCommand } = useTableGenerator();

// 3行4列のテーブルを生成
const markdown = generateTableMarkdown(3, 4);
// | Header1 | Header2 | Header3 | Header4 |
// | --- | --- | --- | --- |
// |  |  |  |  |
// |  |  |  |  |
// |  |  |  |  |

// /tableコマンドを解析
const parsed = parseTableCommand('/table 3 4');
// parsed => { rows: 3, cols: 4 }
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `generateTableMarkdown` | `(rows: number, cols: number) => string` | テーブルMarkdownを生成 |
| `parseTableCommand` | `(content: string) => { rows, cols } \| null` | `/table` コマンドを解析 |

#### テーブルサイズの制限

| 項目 | 最小 | 最大 |
|------|------|------|
| 行数（rows） | 1 | 20 |
| 列数（cols） | 1 | 10 |

---

### useTableCommand

`/table` コマンドを処理するCommandHandler。`@live-editor/core` の `useKeyboardHandler` と連携。

```typescript
import { useKeyboardHandler } from '@live-editor/core';
import { useTableCommand } from '@live-editor/table';

const tableCommand = useTableCommand();

const { handleKeydown } = useKeyboardHandler({
  blocks,
  editingBlockIndex,
  blockRefs,
  updateBlock,
  adjustTextareaHeight,
  commandHandlers: [tableCommand],
});
```

#### コマンド形式

| 形式 | 説明 |
|------|------|
| `/table 行数 列数` | 指定サイズのテーブルを生成 |

#### 使用例

| コマンド | 結果 |
|---------|------|
| `/table 3 4` | 3行4列のテーブル |
| `/table 5 2` | 5行2列のテーブル |

---

### useTableRenderer

テーブルをHTMLにレンダリングするComposable。

```typescript
import { useTableRenderer } from '@live-editor/table';

const { renderTable } = useTableRenderer();

const html = renderTable('| A | B |\n| --- | --- |\n| 1 | 2 |');
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `renderTable` | `(content: string) => string` | テーブルをHTMLにレンダリング |

## 関連パッケージ

| パッケージ | 説明 |
|-----------|------|
| [@live-editor/core](../core/README.md) | 型定義・CommandHandler（依存先） |

## 依存関係

| パッケージ | バージョン | 種別 |
|-----------|-----------|------|
| `@live-editor/core` | workspace:* | dependency |
| `marked` | ^15.0.12 | dependency |
| `vue` | ^3.5.17 | dependency |

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm build` | ビルド |
| `pnpm dev` | 開発モード（ウォッチ） |
| `pnpm test` | テスト（ウォッチモード） |
| `pnpm test:run` | テスト（単発実行） |

## ライセンス

MIT
