# クイックスタートガイド

live-editor モノレポを数分で起動・実行できるようにします。

## 前提条件

以下がインストールされていることを確認してください：

- **Node.js** >= 22.0.0 ([ダウンロード](https://nodejs.org/))
- **pnpm** >= 8.0.0

## インストール

### 1. pnpm のインストール

```bash
npm install -g pnpm
```

### 2. リポジトリのクローン

```bash
git clone https://github.com/pa-y-kunimoto/live-editor.git
cd live-editor
```

### 3. 依存関係のインストール

```bash
pnpm install
```

ワークスペース内のすべてのパッケージの依存関係がインストールされます。

### 4. 全パッケージのビルド

```bash
pnpm build
```

## よく使うタスク

### 開発

すべてのパッケージをウォッチモードで実行：

```bash
pnpm dev
```

### ビルド

全パッケージをビルド：

```bash
pnpm build
```

特定のパッケージをビルド：

```bash
pnpm --filter @live-editor/core build
```

### テスト

全テストを実行：

```bash
pnpm test
```

特定のパッケージのテストを実行：

```bash
pnpm --filter @live-editor/core test
```

### Lint

コード品質をチェック：

```bash
pnpm lint
```

### フォーマット

全コードをフォーマット：

```bash
pnpm format
```

変更なしでフォーマットをチェック：

```bash
pnpm format:check
```

### クリーン

全ビルド成果物と依存関係を削除：

```bash
pnpm clean
```

## プロジェクト構成

```
live-editor/
├── apps/
│   └── web/              # Nuxt.js Web アプリケーション
├── packages/
│   ├── core/             # @live-editor/core - 型定義・基本機能
│   ├── code-block/       # @live-editor/code-block - コードブロック
│   ├── list/             # @live-editor/list - リスト・チェックリスト
│   ├── table/            # @live-editor/table - テーブル
│   ├── quote/            # @live-editor/quote - 引用
│   ├── link/             # @live-editor/link - リンクプレビュー
│   ├── history/          # @live-editor/history - Undo/Redo
│   └── document/         # @live-editor/document - ドキュメント操作
├── docs/                 # ドキュメント
├── .github/              # GitHub Actions ワークフロー
└── ...設定ファイル
```

## 主要コマンドリファレンス

| コマンド       | 説明                               |
| -------------- | ---------------------------------- |
| `pnpm install` | 全依存関係をインストール           |
| `pnpm build`   | 全パッケージをビルド               |
| `pnpm dev`     | 開発モードで実行                   |
| `pnpm test`    | 全テストを実行                     |
| `pnpm lint`    | 全コードの Lint を実行             |
| `pnpm format`  | 全コードをフォーマット             |
| `pnpm clean`   | ビルド成果物と node_modules を削除 |

## 特定パッケージでの作業

`--filter` フラグを使用して特定のパッケージでコマンドを実行：

```bash
# code-block パッケージに依存関係を追加
pnpm --filter @live-editor/code-block add lodash

# Web アプリのみ開発モードで実行
pnpm -C apps/web dev

# core パッケージのみビルド
pnpm --filter @live-editor/core build
```

## トラブルシューティング

### ビルドエラー

ビルドエラーが発生した場合：

```bash
pnpm clean
pnpm install
pnpm build
```

### 依存関係の問題

依存関係の競合がある場合：

```bash
rm -rf node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
```

### 型エラー

アプリを実行する前に、パッケージがビルドされていることを確認：

```bash
pnpm -r build
pnpm -C apps/web build
```

## 次のステップ

- 開発ガイドラインは [CONTRIBUTING.md](../CONTRIBUTING.md) をご覧ください
- システム設計は [docs/ARCHITECTURE.md](./ARCHITECTURE.md) をご覧ください
- [packages](../packages/) ディレクトリでコード例を確認

## ヘルプ

- [ドキュメント](../docs/) を確認
- [オープンな Issue](https://github.com/pa-y-kunimoto/live-editor/issues) を確認
- パッケージ固有の情報は [パッケージ README](../packages/README.md) を参照

## 継続的インテグレーション

すべての PR は自動的に以下がチェックされます：

- ✅ コードフォーマット（Prettier）
- ✅ Lint（ESLint）
- ✅ TypeScript コンパイル
- ✅ テストの成功

プッシュ前にローカルでこれらを実行してください：

```bash
pnpm format && pnpm lint && pnpm build && pnpm test
```
