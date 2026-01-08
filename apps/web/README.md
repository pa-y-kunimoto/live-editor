# @live-editor/web

Live Editor の Web アプリケーションです。Nuxt.js 4 と Vue 3 で構築されています。

## 概要

このパッケージは、ブロックベースの Markdown エディタの Web フロントエンドを提供します。エディタの UI コンポーネントと、OGP メタデータ取得用のサーバー API を含みます。

## 機能

- **MarkdownEditor コンポーネント** - ブロックベースの Markdown 編集 UI
- **リアルタイムプレビュー** - 入力中に Markdown をレンダリング
- **OGP API** - URL からメタデータを取得するサーバーエンドポイント

## 依存パッケージ

| パッケージ                                                     | 説明                     |
| -------------------------------------------------------------- | ------------------------ |
| [@live-editor/core](../../packages/core/README.md)             | 型定義・基本 Composables |
| [@live-editor/code-block](../../packages/code-block/README.md) | コードブロック           |
| [@live-editor/list](../../packages/list/README.md)             | リスト・チェックリスト   |
| [@live-editor/table](../../packages/table/README.md)           | テーブル                 |
| [@live-editor/quote](../../packages/quote/README.md)           | 引用                     |
| [@live-editor/link](../../packages/link/README.md)             | リンクプレビュー         |
| [@live-editor/history](../../packages/history/README.md)       | Undo/Redo                |
| [@live-editor/document](../../packages/document/README.md)     | ドキュメント操作         |

## ディレクトリ構成

```
apps/web/
├── app.vue              # ルートコンポーネント
├── components/          # Vue コンポーネント
│   └── MarkdownEditor.vue
├── pages/               # Nuxt ページ
│   └── index.vue
├── server/              # サーバー API
│   └── api/
│       └── fetch-title.ts  # OGP メタデータ取得
├── public/              # 静的アセット
│   └── default-content.md
├── assets/              # CSS などのアセット
├── nuxt.config.ts       # Nuxt 設定
└── package.json
```

## 開発

### 開発サーバーの起動

```bash
# ルートディレクトリから
pnpm -C apps/web dev

# または apps/web ディレクトリで
pnpm dev
```

### ビルド

```bash
# ルートディレクトリから
pnpm -C apps/web build

# または apps/web ディレクトリで
pnpm build
```

### プレビュー

```bash
# ビルド後にプレビュー
pnpm -C apps/web preview
```

### テスト

```bash
# テストを実行
pnpm -C apps/web test:run
```

## サーバー API

### `/api/fetch-title`

URL から OGP メタデータを取得します。

**リクエスト:**

```
GET /api/fetch-title?url=https://example.com
```

**レスポンス:**

```json
{
  "title": "Example Domain",
  "description": "This domain is for use in examples...",
  "image": "https://example.com/og-image.png",
  "siteName": "Example",
  "favicon": "https://example.com/favicon.ico"
}
```

## コンポーネント

### MarkdownEditor

メインのエディタコンポーネントです。

**Props:**

| Prop         | 型       | 説明                |
| ------------ | -------- | ------------------- |
| `modelValue` | `string` | Markdown コンテンツ |

**Events:**

| Event               | 引数     | 説明                       |
| ------------------- | -------- | -------------------------- |
| `update:modelValue` | `string` | コンテンツが変更されたとき |

**使用例:**

```vue
<template>
  <MarkdownEditor v-model="content" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const content = ref('# Hello World');
</script>
```

## 設定

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['highlight.js/styles/github.css'],
});
```

## ライセンス

MIT
