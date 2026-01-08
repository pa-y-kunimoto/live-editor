# @live-editor/core

Live Editor の中核となるパッケージ。型定義、ブロック解析、エディター機能、レンダリングの基盤を提供します。

## インストール

```bash
pnpm add @live-editor/core
```

## 機能一覧

| カテゴリ | 機能 | 説明 |
|---------|------|------|
| 型定義 | `Block` | ブロックの基本型（id, content） |
| 型定義 | `BlockType` | ブロックタイプの判定用ユニオン型 |
| Composable | `useMarkdownBlocks` | Markdownテキストをブロック単位に分割・解析 |
| Composable | `useBlockEditor` | ブロックの編集状態を管理 |
| Composable | `useKeyboardHandler` | キーボードイベント処理（拡張可能） |
| Composable | `useFormatToolbar` | フォーマットツールバー機能 |
| Composable | `useMarkdownRenderer` | ブロックをHTMLにレンダリング |

## 型定義

### Block

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `id` | `string` | ブロックの一意識別子 |
| `content` | `string` | ブロックのMarkdownコンテンツ |

### BlockType

| 値 | 説明 |
|----|------|
| `heading-1` | H1見出し（`# `） |
| `heading-2` | H2見出し（`## `） |
| `heading-3` | H3見出し（`### `） |
| `code-block` | コードブロック（` ``` `） |
| `checklist` | チェックリスト（`- [ ] `） |
| `bullet-list` | 箇条書きリスト（`- `） |
| `numbered-list` | 番号付きリスト（`1. `） |
| `blockquote` | 引用（`> `） |
| `table` | テーブル（`\| `） |
| `empty` | 空行 |
| `paragraph` | 段落（上記以外） |

## Composables

### useMarkdownBlocks

Markdown テキストをブロック単位に分割・解析します。

```typescript
import { ref } from 'vue';
import { useMarkdownBlocks } from '@live-editor/core';

const content = ref('# Hello\n\nWorld');
const { blocks, getBlockType, getSectionBlockIds } = useMarkdownBlocks(content);
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `blocks` | `ComputedRef<Block[]>` | 解析されたブロックの配列 |
| `getBlockType` | `(content: string) => BlockType` | コンテンツからブロックタイプを判定 |
| `parseCodeBlock` | `(content: string) => { lang, code } \| null` | コードブロックを解析 |
| `parseChecklist` | `(content: string) => { checked, text, indent } \| null` | チェックリストを解析 |
| `getSectionBlockIds` | `(hoveredBlockId: string \| null) => Set<string>` | セクション配下のブロックIDを取得 |

---

### useBlockEditor

ブロックの編集状態を管理します。

```typescript
import { useBlockEditor } from '@live-editor/core';

const editor = useBlockEditor(blocks, emit);
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `editingBlockIndex` | `Ref<number \| null>` | 編集中のブロックインデックス |
| `editingBlockId` | `ComputedRef<string \| null>` | 編集中のブロックID |
| `hoveredBlockId` | `Ref<string \| null>` | ホバー中のブロックID |
| `blockRefs` | `Ref<Map<string, HTMLTextAreaElement>>` | textarea要素の参照マップ |
| `updateBlock` | `(blockId: string, content: string) => void` | ブロック内容を更新 |
| `startEditing` | `(index: number) => void` | 編集を開始 |
| `stopEditing` | `() => void` | 編集を終了 |
| `handleDragStart` | `(e: DragEvent, index: number) => void` | ドラッグ開始処理 |
| `handleDrop` | `(e: DragEvent, index: number) => void` | ドロップ処理 |
| `adjustTextareaHeight` | `(textarea: HTMLTextAreaElement) => void` | textareaの高さを自動調整 |

---

### useKeyboardHandler

キーボードイベントを処理します。拡張可能なコマンドハンドラー機構を持ちます。

```typescript
import { useKeyboardHandler, type CommandHandler } from '@live-editor/core';

// カスタムコマンドハンドラーを作成
const myCommand: CommandHandler = {
  match: (content) => content.startsWith('/mycommand'),
  execute: (context) => {
    context.updateBlock(context.blockId, 'transformed content');
  },
};

const { handleKeydown } = useKeyboardHandler({
  blocks,
  editingBlockIndex,
  commandHandlers: [myCommand],
  // ... 他の依存関係
});
```

#### 依存関係（KeyboardHandlerDeps）

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `blocks` | `ComputedRef<Block[]>` | ブロックの配列 |
| `editingBlockIndex` | `Ref<number \| null>` | 編集中のブロックインデックス |
| `blockRefs` | `Ref<Map<string, HTMLTextAreaElement>>` | textarea要素の参照 |
| `updateBlock` | `(blockId: string, content: string) => void` | ブロック更新関数 |
| `adjustTextareaHeight` | `(textarea: HTMLTextAreaElement) => void` | 高さ調整関数 |
| `commandHandlers` | `CommandHandler[]` | カスタムコマンドハンドラー（省略可） |

---

### useFormatToolbar

フォーマットツールバーの機能を提供します。

```typescript
import { useFormatToolbar } from '@live-editor/core';

const { applyFormat } = useFormatToolbar(
  () => editingBlockId.value,
  (blockId) => blockRefs.value.get(blockId) ?? null,
  updateBlock,
  adjustTextareaHeight
);

applyFormat('bold');
```

#### 引数

| 引数 | 型 | 説明 |
|------|-----|------|
| `getEditingBlockId` | `() => string \| null` | 編集中のブロックIDを取得する関数 |
| `getTextarea` | `(blockId: string) => HTMLTextAreaElement \| null` | textareaを取得する関数 |
| `updateBlock` | `(blockId: string, content: string) => void` | ブロック更新関数 |
| `adjustTextareaHeight` | `(textarea: HTMLTextAreaElement) => void` | 高さ調整関数 |

#### 対応フォーマット

| フォーマット | 説明 |
|-------------|------|
| `h1`, `h2`, `h3` | 見出し |
| `bold` | 太字 |
| `italic` | 斜体 |
| `code` | インラインコード |
| `code-block` | コードブロック |
| `bullet` | 箇条書きリスト |
| `numbered` | 番号付きリスト |
| `checklist` | チェックリスト |
| `quote` | 引用 |
| `table` | テーブル |

---

### useMarkdownRenderer

ブロックを HTML にレンダリングします。依存注入パターンで各種レンダラーをカスタマイズ可能。

```typescript
import { useMarkdownRenderer } from '@live-editor/core';

const renderer = useMarkdownRenderer({
  parseCodeBlock: (content) => /* ... */,
  renderCodeBlock: (content) => /* ... */,
  parseMarkdown: (content) => marked.parse(content),
});
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `renderBlock` | `(block: Block) => void` | ブロックをレンダリング |
| `getRenderedBlock` | `(blockId: string) => string` | レンダリング済みHTMLを取得 |
| `watchBlocks` | `(blocks: ComputedRef<Block[]>) => void` | ブロック変更を監視して自動レンダリング |
| `linkPreviews` | `Ref<Map<string, LinkPreview>>` | リンクプレビューのデータ |
| `loadingUrls` | `Ref<Set<string>>` | ローディング中のURL |

---

## インターフェース

### CommandHandler

キーボードハンドラーに注入するコマンドハンドラーのインターフェース。

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `match` | `(content: string) => boolean` | コマンドにマッチするか判定 |
| `execute` | `(context: CommandContext) => void` | コマンドを実行 |

### CommandContext

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `content` | `string` | 現在のブロックコンテンツ |
| `blockId` | `string` | 現在のブロックID |
| `textarea` | `HTMLTextAreaElement` | textarea要素 |
| `updateBlock` | `(blockId: string, content: string) => void` | ブロック更新関数 |
| `adjustTextareaHeight` | `(textarea: HTMLTextAreaElement) => void` | 高さ調整関数 |
| `blockRefs` | `Ref<Map<string, HTMLTextAreaElement>>` | textarea参照マップ |

### BlockRenderers

レンダラーに注入可能な関数群のインターフェース。

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `parseCodeBlock` | `(content: string) => { language, code } \| null` | コードブロック解析 |
| `renderCodeBlock` | `(content: string) => string \| null` | コードブロックHTML生成 |
| `isChecklistBlock` | `(content: string) => boolean` | チェックリスト判定 |
| `renderChecklist` | `(block: Block) => string \| null` | チェックリストHTML生成 |
| `renderLoadingPreview` | `(url: string) => string` | ローディングプレビュー生成 |
| `renderLinkPreview` | `(url: string, preview: LinkPreview) => string` | リンクプレビュー生成 |
| `parseMarkdown` | `(content: string) => string` | Markdown→HTML変換 |

### LinkPreview

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `title` | `string` | ページタイトル |
| `description` | `string \| undefined` | ページ説明 |
| `image` | `string \| undefined` | OGP画像URL |
| `favicon` | `string \| undefined` | ファビコンURL |

---

## 関連パッケージ

| パッケージ | 説明 | coreとの関係 |
|-----------|------|-------------|
| [@live-editor/code-block](../code-block/README.md) | コードブロックの構文ハイライト | coreの型を使用 |
| [@live-editor/list](../list/README.md) | リスト・チェックリストのレンダリング | coreの型を使用 |
| [@live-editor/table](../table/README.md) | テーブルの生成・レンダリング | coreの型とCommandHandlerを使用 |
| [@live-editor/link](../link/README.md) | リンクプレビュー機能 | coreの型を使用 |
| [@live-editor/quote](../quote/README.md) | 引用ブロックのレンダリング | coreの型を使用 |
| [@live-editor/history](../history/README.md) | Undo/Redo履歴管理 | 独立（coreに依存しない） |
| [@live-editor/document](../document/README.md) | ドキュメント操作 | 独立（coreに依存しない） |

## 依存関係

| パッケージ | バージョン | 種別 |
|-----------|-----------|------|
| `vue` | ^3.5.0 | peer dependency |

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm build` | ビルド |
| `pnpm dev` | 開発モード（ウォッチ） |
| `pnpm test` | テスト（ウォッチモード） |
| `pnpm test:run` | テスト（単発実行） |

## ライセンス

MIT
