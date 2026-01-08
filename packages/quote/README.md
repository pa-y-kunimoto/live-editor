# @live-editor/quote

引用ブロック（blockquote）のレンダリング機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/core @live-editor/quote
```

## 機能一覧

| 機能               | 説明                             |
| ------------------ | -------------------------------- |
| `useQuoteRenderer` | 引用ブロックをHTMLにレンダリング |

## 使い方

### useQuoteRenderer

引用ブロックをHTMLにレンダリングするComposable。

```typescript
import { useQuoteRenderer } from '@live-editor/quote';

const { renderQuote } = useQuoteRenderer();

const html = renderQuote('> これは引用です\n> 複数行も対応');
```

#### 戻り値

| プロパティ    | 型                            | 説明                     |
| ------------- | ----------------------------- | ------------------------ |
| `renderQuote` | `(content: string) => string` | 引用をHTMLにレンダリング |

## 対応する引用形式

| 形式   | 例                     |
| ------ | ---------------------- |
| 単一行 | `> 引用テキスト`       |
| 複数行 | `> 行1\n> 行2`         |
| ネスト | `> > ネストされた引用` |

## 関連パッケージ

| パッケージ                             | 説明                       |
| -------------------------------------- | -------------------------- |
| [@live-editor/core](../core/README.md) | 型定義・基本機能（依存先） |

## 依存関係

| パッケージ          | バージョン   | 種別       |
| ------------------- | ------------ | ---------- |
| `@live-editor/core` | workspace:\* | dependency |
| `marked`            | ^15.0.12     | dependency |

## 開発コマンド

| コマンド        | 説明                     |
| --------------- | ------------------------ |
| `pnpm build`    | ビルド                   |
| `pnpm dev`      | 開発モード（ウォッチ）   |
| `pnpm test`     | テスト（ウォッチモード） |
| `pnpm test:run` | テスト（単発実行）       |

## ライセンス

MIT
