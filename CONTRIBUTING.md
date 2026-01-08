# live-editor への貢献

live-editor への貢献にご興味をお持ちいただきありがとうございます。このガイドでは、貢献を始めるための手順を説明します。

## 開発環境のセットアップ

### 前提条件

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0
- **Git**

### 初期セットアップ

1. **リポジトリをフォークしてクローン**

```bash
git clone https://github.com/your-username/live-editor.git
cd live-editor
```

2. **依存関係をインストール**

```bash
pnpm install
```

3. **全パッケージをビルド**

```bash
pnpm build
```

## 開発ワークフロー

### ブランチの作成

```bash
git checkout -b feature/your-feature-name
# または
git checkout -b fix/your-bug-fix
```

### 変更を加える

1. **適切なパッケージで変更を加える**
2. **コードをフォーマット**

```bash
pnpm format
```

3. **Lint を実行**

```bash
pnpm lint
```

4. **パッケージをビルド**

```bash
pnpm build
```

5. **テストを実行**

```bash
pnpm test
```

### パッケージでの作業

#### 特定のパッケージで作業する

```bash
# パッケージに移動
cd packages/core

# またはルートから pnpm filter を使用
pnpm --filter @live-editor/core dev
```

#### 依存関係の追加

```bash
# 特定のパッケージに追加
pnpm --filter @live-editor/core add lodash

# dev 依存関係を追加
pnpm --filter @live-editor/core add -D @types/lodash

# ルートに追加（開発ツール用）
pnpm add -w -D prettier
```

#### 新しいパッケージの作成

1. `packages/` 配下に新しいディレクトリを作成
2. `@live-editor/your-package` という名前で `package.json` を追加
3. `pnpm install` を実行してワークスペースに登録

### コミットガイドライン

コンベンショナルコミットに従います：

- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメントの変更
- `style:` - コードスタイルの変更（フォーマットなど）
- `refactor:` - コードのリファクタリング
- `test:` - テストの変更
- `chore:` - ビルドプロセスや補助ツールの変更

例：

```bash
git commit -m "feat(core): add field validation utility"
git commit -m "fix(web): resolve form update race condition"
git commit -m "docs: update README with examples"
```

## テスト

### テストの実行

```bash
# 全テストを実行
pnpm test

# 特定のパッケージのテストを実行
pnpm --filter @live-editor/core test

# ウォッチモードでテストを実行（設定されている場合）
pnpm --filter @live-editor/core test:watch
```

### テストの作成

- テストファイルはソースファイルの隣または `__tests__` ディレクトリに配置
- わかりやすいテスト名を使用
- コードベース内の既存のテストパターンに従う

## コードスタイル

### TypeScript

- すべての新しいコードには TypeScript を使用
- 明確なインターフェースと型を定義
- 可能な限り `any` 型の使用を避ける
- strict モードを使用

### フォーマット

- コードフォーマットには Prettier を使用
- コミット前に `pnpm format` を実行
- 設定は `prettier.config.js` にあります

### Lint

- コードの Lint には ESLint を使用
- コミット前に `pnpm lint` を実行
- 設定は `eslint.config.js` にあります

## プルリクエストプロセス

1. **機能を変更する場合はドキュメントを更新**
2. **ローカルですべてのチェックを実行**：

```bash
pnpm format
pnpm lint
pnpm build
pnpm test
```

3. **ブランチをフォークにプッシュ**

```bash
git push origin feature/your-feature-name
```

4. **GitHub でプルリクエストを作成**
5. **PR テンプレートに変更の詳細を記入**
6. **CI チェックが通過するのを待つ**
7. **レビューフィードバックがあれば対応**

### PR タイトルのフォーマット

コンベンショナルコミットフォーマットを使用：

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`

## CI/CD パイプライン

CI パイプラインはすべてのプルリクエストで実行されます：

- **フォーマットチェック** - コードが適切にフォーマットされていることを確認
- **Lint** - コード品質の問題をチェック
- **ビルド** - すべての TypeScript パッケージをコンパイル
- **テスト** - テストスイートを実行

PR をマージする前に、すべてのチェックが通過する必要があります。

## ドキュメント

- 各パッケージの README ファイルを最新の状態に保つ
- パブリック API を JSDoc コメントで文書化
- 構造的な変更を行った場合はアーキテクチャドキュメントを更新
- 複雑なロジックにはインラインコメントを追加

## ベストプラクティス

### モノレポガイドライン

- **パッケージは集中させる** - 各パッケージは単一の責任を持つべき
- **ワークスペース依存関係を使用** - 内部パッケージは `workspace:*` で参照
- **循環依存を避ける** - 依存関係グラフを非循環に保つ
- **共通設定を共有** - 共有ツールにはルート設定を使用

### コードガイドライン

- **自己文書化コードを書く** - 明確な変数名と関数名を使用
- **関数を小さく保つ** - 各関数は一つのことをうまく行う
- **TypeScript を効果的に使用** - 安全性のために型システムを活用
- **エラーを適切に処理** - 常にエラーケースを考慮

### パフォーマンス

- **依存関係を最小限に** - 必要な依存関係のみ追加
- **ビルドを最適化** - ビルド時間を合理的に保つ
- **適切にキャッシュ** - 有益な場所でキャッシュを使用

## Issue の報告

Issue を報告する際：

1. **既存の Issue を先に確認**
2. **利用可能な場合は Issue テンプレートを使用**
3. **再現手順を提供**
4. **環境の詳細を含める**（Node バージョン、OS など）
5. **関連するコードスニペット** やエラーメッセージを追加

## ヘルプを得る

- **ドキュメント** - docs/ ディレクトリを確認
- **Issues** - GitHub Issues を検索または作成
- **Discussions** - 質問には GitHub Discussions を使用

## 行動規範

- 敬意を持ち、包括的であること
- 建設的なフィードバックに集中
- 歓迎される環境の創出に協力

live-editor への貢献ありがとうございます！
