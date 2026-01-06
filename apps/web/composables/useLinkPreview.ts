import { nextTick, type Ref } from 'vue'
import type { Block } from './useMarkdownBlocks'

export interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  favicon: string | null
}

export function useLinkPreview(
  linkPreviews: Ref<Map<string, LinkPreview>>,
  loadingUrls: Ref<Set<string>>
) {
  async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    try {
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        return {
          url,
          title: data.title || null,
          description: data.description || null,
          image: data.image || null,
          siteName: data.siteName || null,
          favicon: data.favicon || null
        }
      }
    } catch {
      // フェッチ失敗時はnullを返す
    }
    return null
  }

  async function processUrlBlock(
    url: string,
    blocks: { value: Block[] },
    updateBlock: (blockId: string, content: string) => void,
    renderBlock: (block: Block) => void
  ) {
    // markdownリンク形式のパターン
    const linkPattern = `[${url}](${url})`

    // ローディング状態を設定
    loadingUrls.value.add(url)

    // nextTickでDOMの更新を待ってからレンダリング
    await nextTick()

    // ローディングスケルトンを表示するため再レンダリング（厳密にマッチ）
    for (const b of blocks.value) {
      if (b.content.trim() === linkPattern) {
        renderBlock(b)
        break
      }
    }

    // OGP情報を非同期で取得
    const preview = await fetchLinkPreview(url)

    // ローディング状態を解除
    loadingUrls.value.delete(url)

    if (preview) {
      linkPreviews.value.set(url, preview)

      // タイトルが取得できた場合、リンクテキストを更新
      if (preview.title) {
        for (const b of blocks.value) {
          // 厳密にURLのみのリンクブロックかチェック
          if (b.content.trim() === linkPattern) {
            updateBlock(b.id, `[${preview.title}](${url})`)
            break
          }
        }
      }

      // nextTickでDOMの更新を待つ
      await nextTick()

      // プレビューカードを再レンダリング（URLを含むリンクブロック）
      for (const b of blocks.value) {
        const linkMatch = b.content.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
        if (linkMatch && linkMatch[2] === url) {
          renderBlock(b)
          break
        }
      }
    } else {
      // フェッチ失敗時もローディング解除後に再レンダリング
      await nextTick()
      for (const b of blocks.value) {
        if (b.content.trim() === linkPattern) {
          renderBlock(b)
          break
        }
      }
    }
  }

  return {
    fetchLinkPreview,
    processUrlBlock
  }
}
