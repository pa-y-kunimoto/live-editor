import https from 'node:https'
import http from 'node:http'

// グローバルURLを使用
const URLConstructor = globalThis.URL

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URLConstructor(url)
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      },
      timeout: 5000,
      rejectUnauthorized: false // 開発環境用: SSL証明書検証をスキップ
    }

    const req = protocol.request(options, (res) => {
      // リダイレクトをフォロー
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve).catch(reject)
        return
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      let data = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    req.end()
  })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL parameter is required'
    })
  }

  // URLの形式を検証
  try {
    new URLConstructor(url)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid URL format'
    })
  }

  try {
    const html = await fetchHtml(url)

    // メタタグから情報を抽出するヘルパー関数
    function getMetaContent(property: string): string | null {
      // property属性パターン (og:title, og:description など)
      const propertyMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'))
      if (propertyMatch) return propertyMatch[1].trim()

      // name属性パターン (description, twitter:title など)
      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'))
      if (nameMatch) return nameMatch[1].trim()

      return null
    }

    // <title>タグからタイトルを抽出（複数行・空白に対応）
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const htmlTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null

    // OGP情報を取得
    const ogTitle = getMetaContent('og:title')
    const ogDescription = getMetaContent('og:description') || getMetaContent('description')
    const ogImage = getMetaContent('og:image')
    const ogSiteName = getMetaContent('og:site_name')

    // faviconを取得
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
    let favicon = faviconMatch ? faviconMatch[1] : null

    // 相対URLを絶対URLに変換
    if (favicon && !favicon.startsWith('http')) {
      const parsedUrl = new URLConstructor(url)
      if (favicon.startsWith('//')) {
        favicon = parsedUrl.protocol + favicon
      } else if (favicon.startsWith('/')) {
        favicon = `${parsedUrl.protocol}//${parsedUrl.host}${favicon}`
      } else {
        favicon = `${parsedUrl.protocol}//${parsedUrl.host}/${favicon}`
      }
    }

    // og:imageも相対URLを絶対URLに変換
    let image = ogImage
    if (image && !image.startsWith('http')) {
      const parsedUrl = new URLConstructor(url)
      if (image.startsWith('//')) {
        image = parsedUrl.protocol + image
      } else if (image.startsWith('/')) {
        image = `${parsedUrl.protocol}//${parsedUrl.host}${image}`
      } else {
        image = `${parsedUrl.protocol}//${parsedUrl.host}/${image}`
      }
    }

    return {
      title: ogTitle || htmlTitle || null,
      description: ogDescription || null,
      image: image || null,
      siteName: ogSiteName || null,
      favicon: favicon || null
    }
  } catch {
    // 取得できない場合はnullを返す
    return { title: null, description: null, image: null, siteName: null, favicon: null }
  }
})
