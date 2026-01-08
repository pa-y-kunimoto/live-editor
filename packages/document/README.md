# @live-editor/document

Markdownドキュメントの操作機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/document
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| `useMarkdownDocument` | ドキュメントの管理とクリップボードコピー |

## 使い方

### useMarkdownDocument

Markdownドキュメントの管理機能を提供するComposable。

```typescript
import { useMarkdownDocument } from '@live-editor/document';

const {
  markdownContent,
  showCopyNotification,
  formatMarkdownForCopy,
  copyToClipboard,
  setContent
} = useMarkdownDocument();

// コンテンツを設定
setContent('# Hello\n\nWorld');

// クリップボードにコピー（自動フォーマット適用）
await copyToClipboard();
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `markdownContent` | `Ref<string>` | Markdownコンテンツ |
| `showCopyNotification` | `Ref<boolean>` | コピー通知の表示状態 |
| `formatMarkdownForCopy` | `(content: string) => string` | コピー用にフォーマット |
| `copyToClipboard` | `() => Promise<void>` | クリップボードにコピー |
| `setContent` | `(content: string) => void` | コンテンツを設定 |

## フォーマット機能

`formatMarkdownForCopy` は以下のルールで空行を挿入し、読みやすいMarkdownに整形します。

| ブロックタイプ | 前後の空行 |
|---------------|-----------|
| 見出し（`#`） | 前後に空行を挿入 |
| リスト（`-`, `*`, `1.`） | 前後に空行を挿入（連続リストは除く） |
| コードブロック（` ``` `） | 前後に空行を挿入 |
| 引用（`>`） | 前後に空行を挿入 |
| テーブル（`\|`） | 前後に空行を挿入 |

### フォーマット例

入力:
```markdown
# Title
Some text
- Item 1
- Item 2
## Subtitle
```

出力:
```markdown
# Title

Some text

- Item 1
- Item 2

## Subtitle
```

## コピー通知

`copyToClipboard` 実行後、`showCopyNotification` が `true` になり、2秒後に自動で `false` に戻ります。

| イベント | `showCopyNotification` |
|---------|----------------------|
| コピー成功 | `true`（2秒間） |
| コピー失敗 | `false`（変化なし） |

## 関連パッケージ

| パッケージ | 説明 |
|-----------|------|
| [@live-editor/core](../core/README.md) | 型定義・基本機能 |
| [@live-editor/history](../history/README.md) | Undo/Redo履歴管理 |

## 依存関係

| パッケージ | バージョン | 種別 |
|-----------|-----------|------|
| `vue` | ^3.5.0 | peer dependency |

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm build` | ビルド |
| `pnpm test` | テスト（ウォッチモード） |
| `pnpm test:run` | テスト（単発実行） |
| `pnpm typecheck` | 型チェック |

## ライセンス

MIT
