# @live-editor/code-block

コードブロックの構文ハイライトとレンダリング機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/core @live-editor/code-block
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| `parseCodeBlock` | コードブロックのMarkdownを解析 |
| `useHighlight` | 構文ハイライト機能を提供 |
| `useCodeBlockRenderer` | コードブロックをHTMLにレンダリング |

## 対応言語

| 言語 | エイリアス |
|------|-----------|
| JavaScript | `javascript`, `js` |
| TypeScript | `typescript`, `ts` |
| Python | `python`, `py` |
| Rust | `rust` |
| Go | `go` |
| Java | `java` |
| C | `c` |
| C++ | `cpp` |
| C# | `csharp`, `cs` |
| PHP | `php` |
| Ruby | `ruby`, `rb` |
| Swift | `swift` |
| Kotlin | `kotlin` |
| HTML/XML | `html`, `xml` |
| CSS | `css` |
| SCSS | `scss` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| Markdown | `markdown`, `md` |
| SQL | `sql` |
| Bash | `bash`, `sh` |
| Shell | `shell` |
| Dockerfile | `dockerfile`, `docker` |

## 使い方

### parseCodeBlock

コードブロックのMarkdownコンテンツを解析します。

```typescript
import { parseCodeBlock } from '@live-editor/code-block';

const result = parseCodeBlock('```typescript\nconst x = 1;\n```');
// result => { lang: 'typescript', code: 'const x = 1;' }
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `lang` | `string` | 言語識別子 |
| `code` | `string` | コード本文 |

---

### useHighlight

構文ハイライト機能を提供するComposable。

```typescript
import { useHighlight } from '@live-editor/code-block';

const { highlightCode, supportedLanguages } = useHighlight();

const html = highlightCode('const x = 1;', 'typescript');
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `highlightCode` | `(code: string, lang: string) => string` | コードをハイライトしたHTMLを返す |
| `supportedLanguages` | `string[]` | 対応言語の一覧 |

---

### useCodeBlockRenderer

コードブロックをHTMLにレンダリングするComposable。

```typescript
import { useCodeBlockRenderer } from '@live-editor/code-block';

const { renderCodeBlock, highlightCode } = useCodeBlockRenderer();

const html = renderCodeBlock('```typescript\nconst x = 1;\n```');
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `renderCodeBlock` | `(content: string) => string \| null` | コードブロックをHTMLにレンダリング |
| `highlightCode` | `(code: string, lang: string) => string` | コードをハイライトしたHTMLを返す |

## 関連パッケージ

| パッケージ | 説明 |
|-----------|------|
| [@live-editor/core](../core/README.md) | 型定義・基本機能（依存先） |

## 依存関係

| パッケージ | バージョン | 種別 |
|-----------|-----------|------|
| `@live-editor/core` | workspace:* | dependency |
| `highlight.js` | ^11.11.1 | dependency |

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm build` | ビルド |
| `pnpm dev` | 開発モード（ウォッチ） |
| `pnpm test` | テスト（ウォッチモード） |
| `pnpm test:run` | テスト（単発実行） |

## ライセンス

MIT
