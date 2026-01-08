# ユビキタス言語 / 用語集

このドキュメントでは、Live Editor プロジェクト全体で使用されるドメイン固有の用語を定義します。チームメンバー全員がコード、ドキュメント、コミュニケーションにおいてこれらの用語を一貫して使用してください。

## コアコンセプト

### Block（ブロック）

**Block** はエディタにおけるコンテンツの基本単位です。各ブロックは、独立して編集、レンダリング、操作できる単一の論理的な Markdown コンテンツを表します。

```typescript
interface Block {
  id: string; // 一意の識別子（例: "block-0", "block-1"）
  content: string; // ブロックの生の Markdown コンテンツ
}
```

**コードでの使用:** `useMarkdownBlocks`, `Block`, `blocks`

### Block Type（ブロックタイプ）

**Block Type** は、Markdown コンテンツに基づいてブロックを分類します。エディタはブロックタイプを使用して、各ブロックのレンダリング方法とインタラクション方法を決定します。

| タイプ           | 説明               | Markdown パターン            |
| --------------- | ----------------- | ---------------------------- |
| `heading-1`     | レベル 1 見出し    | `# Title`                    |
| `heading-2`     | レベル 2 見出し    | `## Subtitle`                |
| `heading-3`     | レベル 3 見出し    | `### Section`                |
| `code-block`    | フェンス付きコードブロック | ` ```lang ... ``` `    |
| `checklist`     | タスクリスト項目   | `- [ ] Task` または `- [x] Done` |
| `bullet-list`   | 箇条書きリスト     | `- Item` または `* Item`     |
| `numbered-list` | 番号付きリスト     | `1. Item`                    |
| `blockquote`    | 引用ブロック       | `> Quote`                    |
| `table`         | Markdown テーブル  | `\| A \| B \|`               |
| `empty`         | 空行              | （空白）                      |
| `paragraph`     | 通常のテキスト     | その他のコンテンツ            |

**コードでの使用:** `BlockType`, `getBlockType()`

### Section（セクション）

**Section** は、見出しで始まり、同等以上のレベルの次の見出しまでの後続のすべてのブロックを含む、ブロックの階層的なグループです。セクションは「セクションをコピー」などの操作に使用されます。

**例：**

```markdown
# Section 1 <- このセクションはこの見出しと...

Paragraph text <- ...この段落を含み

## Subsection <- ...このサブセクションと

More content <- ...このコンテンツを含む

# Section 2 <- これは新しいセクションの開始
```

**コードでの使用:** `getSectionBlockIds()`

## エディタ操作

### Editing State（編集状態）

**Editing State** は、ユーザーが現在編集しているブロックを追跡します。一度に編集モードにできるブロックは 1 つだけです。

- `editingBlockIndex` - 現在編集中のブロックのインデックス（なければ null）
- `editingBlockId` - 現在編集中のブロックの ID

**コードでの使用:** `useBlockEditor`, `editingBlockIndex`, `editingBlockId`

### Hover State（ホバー状態）

**Hover State** は、ユーザーがホバーしているブロックを追跡し、コピーボタンやドラッグハンドルなどのコンテキスト UI 要素を表示するために使用されます。

- `hoveredBlockId` - ホバー中のブロックの ID
- `hoveredCopyBlockId` - セクションコピー UI を表示するための ID

**コードでの使用:** `hoveredBlockId`, `hoveredCopyBlockId`

### Block Rendering（ブロックレンダリング）

**Block Rendering** は、生の Markdown コンテンツを表示用の HTML に変換するプロセスです。これには以下が含まれます：

1. コードブロックの構文ハイライト
2. チェックボックス付きチェックリスト項目のレンダリング
3. 標準 Markdown 解析（見出し、リスト、リンクなど）
4. リンクプレビューカードの生成

**コードでの使用:** `useMarkdownRenderer`, `renderBlock()`, `getRenderedBlock()`

## リンクプレビュー

### Link Preview（リンクプレビュー）

**Link Preview** は、URL リンクの拡張表示で、タイトル、説明、画像、favicon などの OGP（Open Graph Protocol）メタデータを表示します。

```typescript
interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
}
```

**コードでの使用:** `useLinkPreview`, `LinkPreview`, `linkPreviews`

### Loading State（読み込み状態）

リンクプレビューの **Loading State** は、メタデータを取得中の URL を追跡します。

**コードでの使用:** `loadingUrls`

## 履歴と Undo/Redo

### Editor History（エディタ履歴）

**Editor History** は、時間の経過に伴うコンテンツの変更を追跡する Undo/Redo システムです。各履歴状態は以下をキャプチャします：

- 完全な Markdown コンテンツ
- 編集中だったブロック
- カーソル位置

```typescript
interface HistoryState {
  content: string;
  editingBlockIndex: number | null;
  cursorPos: number | null;
}
```

**コードでの使用:** `useEditorHistory`, `history`, `historyIndex`

### Undo/Redo 操作

- **Undo（元に戻す）** - 履歴から前の状態を復元
- **Redo（やり直し）** - 履歴から次の状態を復元（Undo 後）

**コードでの使用:** `undo()`, `redo()`, `isUndoRedo`

## フォーマット

### Format Toolbar（フォーマットツールバー）

**Format Toolbar** はテキストフォーマットコマンドへのクイックアクセスを提供します。利用可能なフォーマット：

| フォーマット     | 説明           | Markdown       |
| --------------- | ------------- | -------------- |
| `bold`          | 太字テキスト   | `**text**`     |
| `italic`        | 斜体テキスト   | `*text*`       |
| `strikethrough` | 取り消し線     | `~~text~~`     |
| `code`          | インラインコード | `` `code` ``  |
| `link`          | ハイパーリンク | `[text](url)`  |
| `h1`            | 見出し 1       | `# `           |
| `h2`            | 見出し 2       | `## `          |
| `h3`            | 見出し 3       | `### `         |
| `bullet`        | 箇条書きリスト | `- `           |
| `numbered`      | 番号付きリスト | `1. `          |
| `checklist`     | チェックリスト | `- [ ] `       |
| `quote`         | 引用           | `> `           |

**コードでの使用:** `useFormatToolbar`, `FormatType`, `applyFormat()`

## ドラッグ＆ドロップ

### Block Reordering（ブロック並べ替え）

**Block Reordering** は、ドラッグ＆ドロップでブロックの順序を変更できます。ドラッグハンドルはホバー時に表示されます。

- `draggedBlockIndex` - ドラッグ中のブロックのインデックス
- `dragOverBlockIndex` - ドラッグオーバー中のブロックのインデックス（ドロップ先）

**コードでの使用:** `handleDragStart()`, `handleDragOver()`, `handleDrop()`, `handleDragEnd()`

## キーボード処理

### Keyboard Shortcuts（キーボードショートカット）

**Keyboard Shortcuts** は効率的なナビゲーションと編集を提供します。キーハンドラには以下が含まれます：

| アクション     | ショートカット      | 説明                              |
| ------------- | ------------------ | --------------------------------- |
| Enter         | `Enter`            | ブロックを分割または新規ブロック作成 |
| Backspace     | `Backspace`        | 先頭で前のブロックと結合           |
| Tab           | `Tab`              | リスト項目をインデント             |
| Shift+Tab     | `Shift+Tab`        | リスト項目をアウトデント           |
| Arrow Up      | `ArrowUp`          | 前のブロックに移動                |
| Arrow Down    | `ArrowDown`        | 次のブロックに移動                |
| Undo          | `Cmd/Ctrl+Z`       | 最後の変更を元に戻す              |
| Redo          | `Cmd/Ctrl+Shift+Z` | 最後に元に戻した変更をやり直す     |

**コードでの使用:** `useKeyboardHandler`

## ドキュメント操作

### Document（ドキュメント）

**Document** は編集中の完全な Markdown コンテンツを表します。ドキュメントは単一の文字列として保存され、編集用にブロックに解析されます。

**コードでの使用:** `useMarkdownDocument`, `markdownContent`

### Copy to Clipboard（クリップボードにコピー）

**Copy to Clipboard** は、現在のドキュメントコンテンツを適切な Markdown フォーマットを保持したままシステムクリップボードにエクスポートします。

**コードでの使用:** `copyToClipboard()`, `formatMarkdownForCopy()`

## テーブル生成

### Table Generator（テーブルジェネレーター）

**Table Generator** はシンプルなコマンド構文から Markdown テーブルを作成します。

**コマンド形式:** `/table <行数> <列数>`

**例:** `/table 3 4` は 3 行 4 列のテーブルを作成

**コードでの使用:** `useTableGenerator`, `parseTableCommand()`, `generateTableMarkdown()`

## コードハイライト

### Syntax Highlighting（構文ハイライト）

**Syntax Highlighting** は highlight.js を使用して、指定されたプログラミング言語に基づいてコードブロックを色付けします。

**コードでの使用:** `useHighlight`, `highlightCode()`

## Composables サマリー

| Composable             | 目的                                               |
| --------------------- | -------------------------------------------------- |
| `useMarkdownBlocks`   | コンテンツをブロックに解析、ブロックタイプを決定      |
| `useMarkdownRenderer` | ブロックを HTML にレンダリング、プレビューを処理     |
| `useBlockEditor`      | 編集状態を管理、ユーザーインタラクションを処理        |
| `useLinkPreview`      | リンクプレビューデータを取得・管理                   |
| `useEditorHistory`    | Undo/Redo のためのコンテンツ履歴を追跡              |
| `useFormatToolbar`    | テキストフォーマットを適用                          |
| `useKeyboardHandler`  | キーボードショートカットとナビゲーションを処理        |
| `useTableGenerator`   | Markdown テーブルを生成                            |
| `useHighlight`        | 構文ハイライトを提供                               |
| `useMarkdownDocument` | ドキュメントの読み込みとコピーを管理                 |
