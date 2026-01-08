# @live-editor/history

エディターのUndo/Redo履歴管理機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/history
```

## 機能一覧

| 機能               | 説明                |
| ------------------ | ------------------- |
| `useEditorHistory` | Undo/Redo履歴の管理 |

## 型定義

### HistoryState

| プロパティ          | 型               | 説明                         |
| ------------------- | ---------------- | ---------------------------- |
| `content`           | `string`         | Markdownコンテンツ           |
| `editingBlockIndex` | `number \| null` | 編集中のブロックインデックス |
| `cursorPos`         | `number \| null` | カーソル位置                 |

## 使い方

### useEditorHistory

Undo/Redo機能を提供するComposable。

```typescript
import { ref } from 'vue';
import { useEditorHistory } from '@live-editor/history';

const modelValue = ref('# Hello');
const editingBlockIndex = ref<number | null>(null);

const { history, historyIndex, isUndoRedo, undo, redo } = useEditorHistory(
  modelValue,
  editingBlockIndex,
  () => document.activeElement as HTMLTextAreaElement | null
);

// Undo実行
undo(
  (event, value) => emit(event, value),
  (index, cursorPos) => startEditing(index, cursorPos)
);

// Redo実行
redo(
  (event, value) => emit(event, value),
  (index, cursorPos) => startEditing(index, cursorPos)
);
```

#### 引数

| 引数                | 型                                  | 説明                               |
| ------------------- | ----------------------------------- | ---------------------------------- |
| `modelValue`        | `Ref<string>`                       | Markdownコンテンツ                 |
| `editingBlockIndex` | `Ref<number \| null>`               | 編集中のブロックインデックス       |
| `getTextarea`       | `() => HTMLTextAreaElement \| null` | アクティブなtextareaを取得する関数 |

#### 戻り値

| プロパティ     | 型                                    | 説明                   |
| -------------- | ------------------------------------- | ---------------------- |
| `history`      | `Ref<HistoryState[]>`                 | 履歴スタック           |
| `historyIndex` | `Ref<number>`                         | 現在の履歴インデックス |
| `isUndoRedo`   | `Ref<boolean>`                        | Undo/Redo操作中フラグ  |
| `undo`         | `(emit, startEditingByIndex) => void` | Undo実行               |
| `redo`         | `(emit, startEditingByIndex) => void` | Redo実行               |

## 動作仕様

| 項目             | 値                        |
| ---------------- | ------------------------- |
| 最大履歴数       | 100                       |
| 自動履歴追加     | `modelValue` の変更を監視 |
| カーソル位置復元 | Undo/Redo時に復元         |

## 履歴の管理

| 操作           | 動作                                         |
| -------------- | -------------------------------------------- |
| コンテンツ変更 | 現在位置以降の履歴を破棄し、新しい状態を追加 |
| Undo           | 1つ前の状態に戻る                            |
| Redo           | 1つ先の状態に進む                            |
| 履歴上限超過   | 最古の履歴を削除                             |

## 関連パッケージ

| パッケージ                                     | 説明             |
| ---------------------------------------------- | ---------------- |
| [@live-editor/core](../core/README.md)         | 型定義・基本機能 |
| [@live-editor/document](../document/README.md) | ドキュメント操作 |

## 依存関係

| パッケージ | バージョン | 種別            |
| ---------- | ---------- | --------------- |
| `vue`      | ^3.5.0     | peer dependency |

## 開発コマンド

| コマンド         | 説明                     |
| ---------------- | ------------------------ |
| `pnpm build`     | ビルド                   |
| `pnpm test`      | テスト（ウォッチモード） |
| `pnpm test:run`  | テスト（単発実行）       |
| `pnpm typecheck` | 型チェック               |

## ライセンス

MIT
