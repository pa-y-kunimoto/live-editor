# @live-editor/list

リスト（箇条書き、番号付き、チェックリスト）のレンダリング機能を提供するパッケージ。

## インストール

```bash
pnpm add @live-editor/core @live-editor/list
```

## 機能一覧

| 機能                   | 説明                                         |
| ---------------------- | -------------------------------------------- |
| `parseChecklist`       | チェックリスト項目を解析                     |
| `isChecklistBlock`     | チェックリストブロックかどうかを判定         |
| `useChecklistRenderer` | チェックリストをHTMLにレンダリング           |
| `useListRenderer`      | 箇条書き・番号付きリストをHTMLにレンダリング |

## 使い方

### parseChecklist

チェックリスト項目を解析します。

```typescript
import { parseChecklist } from '@live-editor/list';

const result = parseChecklist('- [x] タスク完了');
// result => { checked: true, text: 'タスク完了', indent: '' }
```

#### 戻り値

| プロパティ | 型        | 説明             |
| ---------- | --------- | ---------------- |
| `checked`  | `boolean` | チェック状態     |
| `text`     | `string`  | テキスト内容     |
| `indent`   | `string`  | インデント文字列 |

---

### isChecklistBlock

コンテンツがチェックリストブロックかどうかを判定します。

```typescript
import { isChecklistBlock } from '@live-editor/list';

isChecklistBlock('- [x] タスク1\n- [ ] タスク2'); // true
isChecklistBlock('- 通常のリスト'); // false
```

---

### useChecklistRenderer

チェックリストをHTMLにレンダリングするComposable。

```typescript
import { useChecklistRenderer } from '@live-editor/list';

const { renderChecklist, isChecklistBlock, parseChecklist } = useChecklistRenderer();

const html = renderChecklist({
  id: 'block-1',
  content: '- [x] タスク1\n- [ ] タスク2',
});
```

#### 戻り値

| プロパティ         | 型                                             | 説明                               |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| `renderChecklist`  | `(block: Block) => string \| null`             | チェックリストをHTMLにレンダリング |
| `isChecklistBlock` | `(content: string) => boolean`                 | チェックリスト判定                 |
| `parseChecklist`   | `(content: string) => ParsedChecklist \| null` | チェックリスト解析                 |

---

### useListRenderer

箇条書き・番号付きリストをHTMLにレンダリングするComposable。

```typescript
import { useListRenderer } from '@live-editor/list';

const { renderList } = useListRenderer();

const html = renderList('- 項目1\n- 項目2\n- 項目3');
```

#### 戻り値

| プロパティ   | 型                            | 説明                       |
| ------------ | ----------------------------- | -------------------------- |
| `renderList` | `(content: string) => string` | リストをHTMLにレンダリング |

## チェックリストのHTML出力

レンダリングされるHTMLには以下のdata属性が付与されます。

| 属性              | 説明           |
| ----------------- | -------------- |
| `data-block-id`   | ブロックID     |
| `data-line-index` | 行インデックス |

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
