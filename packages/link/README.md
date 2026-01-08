# @live-editor/link

リンクプレビュー（OGP）機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/core @live-editor/link
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| `useLinkPreview` | リンクプレビューのフェッチと処理 |
| `useLinkPreviewRenderer` | プレビューカードのHTMLレンダリング |

## 型定義

### LinkPreview

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `url` | `string` | リンクURL |
| `title` | `string \| null` | ページタイトル |
| `description` | `string \| null` | ページ説明 |
| `image` | `string \| null` | OGP画像URL |
| `siteName` | `string \| null` | サイト名 |
| `favicon` | `string \| null` | ファビコンURL |

### LinkPreviewFetcher

カスタムフェッチャー関数の型。

```typescript
type LinkPreviewFetcher = (url: string) => Promise<LinkPreview | null>;
```

## 使い方

### useLinkPreview

リンクプレビューのフェッチと処理を行うComposable。

```typescript
import { ref } from 'vue';
import { useLinkPreview, type LinkPreview } from '@live-editor/link';

const linkPreviews = ref(new Map<string, LinkPreview>());
const loadingUrls = ref(new Set<string>());

const { fetchLinkPreview, processUrlBlock } = useLinkPreview(
  linkPreviews,
  loadingUrls
);

// 単純にOGP情報を取得
const preview = await fetchLinkPreview('https://example.com');

// URLブロックを処理（ローディング表示→プレビュー表示）
await processUrlBlock(url, blocks, updateBlock, renderBlock);
```

#### 引数

| 引数 | 型 | 説明 |
|------|-----|------|
| `linkPreviews` | `Ref<Map<string, LinkPreview>>` | プレビューデータのキャッシュ |
| `loadingUrls` | `Ref<Set<string>>` | ローディング中のURL |
| `fetcher` | `LinkPreviewFetcher` | カスタムフェッチャー（省略可） |

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `fetchLinkPreview` | `(url: string) => Promise<LinkPreview \| null>` | OGP情報をフェッチ |
| `processUrlBlock` | `(url, blocks, updateBlock, renderBlock) => Promise<void>` | URLブロックを処理 |

---

### useLinkPreviewRenderer

プレビューカードのHTMLを生成するComposable。

```typescript
import { useLinkPreviewRenderer } from '@live-editor/link';

const { renderLoadingPreview, renderLinkPreview } = useLinkPreviewRenderer();

// ローディング中のプレビュー
const loadingHtml = renderLoadingPreview('https://example.com');

// プレビューカード
const previewHtml = renderLinkPreview('https://example.com', {
  url: 'https://example.com',
  title: 'Example Site',
  description: 'サイトの説明',
  image: 'https://example.com/og.png',
  siteName: 'Example',
  favicon: 'https://example.com/favicon.ico'
});
```

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `renderLoadingPreview` | `(url: string) => string` | ローディングスケルトンを生成 |
| `renderLinkPreview` | `(url: string, preview: LinkPreview) => string` | プレビューカードを生成 |

## APIエンドポイント

デフォルトのフェッチャーは `/api/fetch-title` エンドポイントを使用します。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `url` | `string` | 取得対象のURL（クエリパラメータ） |

### レスポンス形式

```json
{
  "title": "ページタイトル",
  "description": "ページの説明",
  "image": "https://example.com/og.png",
  "siteName": "サイト名",
  "favicon": "https://example.com/favicon.ico"
}
```

## 関連パッケージ

| パッケージ | 説明 |
|-----------|------|
| [@live-editor/core](../core/README.md) | 型定義・基本機能（依存先） |

## 依存関係

| パッケージ | バージョン | 種別 |
|-----------|-----------|------|
| `@live-editor/core` | workspace:* | dependency |
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
