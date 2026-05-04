import JSZip from 'jszip'

export interface EpubChapter {
  id: string
  title: string
  content: string  // HTML 富文本
  type: 'volume' | 'chapter' | 'section' | 'scene'
  children?: EpubChapter[]  // 子章节（层级结构）
}

export interface EpubMetadata {
  title: string
  author: string
  language: string
  description?: string
  category?: string
}

/**
 * 扁平化层级章节为线性列表（用于spine/内容顺序）
 */
function flattenChapters(chapters: EpubChapter[]): EpubChapter[] {
  const result: EpubChapter[] = []
  for (const ch of chapters) {
    result.push(ch)
    if (ch.children && ch.children.length > 0) {
      result.push(...flattenChapters(ch.children))
    }
  }
  return result
}

/**
 * 构建带id映射的扁平章节列表（用于内容文件和NCX索引）
 */
function buildChapterIndex(chapters: EpubChapter[]): Map<string, { chapter: EpubChapter; index: number }> {
  const map = new Map()
  let idx = 0
  const process = (list: EpubChapter[]) => {
    for (const ch of list) {
      if (ch.type === 'volume' || ch.type === 'chapter' || ch.type === 'section') {
        map.set(ch.id, { chapter: ch, index: idx++ })
        if (ch.children) {
          process(ch.children)
        }
      }
    }
  }
  process(chapters)
  return map
}

/**
 * 生成嵌套的NCX结构
 */
function buildNavPoints(chapters: EpubChapter[], playOrderRef: { value: number }): string[] {
  const points: string[] = []
  for (const ch of chapters) {
    // 只有 volume/chapter/section 类型的节点才进入目录
    if (ch.type === 'volume' || ch.type === 'chapter' || ch.type === 'section') {
      const order = playOrderRef.value++
      points.push(`    <navPoint id="navpoint-${order}" playOrder="${order}">`)
      points.push(`      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>`)
      points.push(`      <content src="chapters/chapter_${order}.xhtml"/>`)
      // 递归处理子节点
      if (ch.children && ch.children.length > 0) {
        points.push('      <navMap>')
        points.push(...buildNavPoints(ch.children, playOrderRef))
        points.push('      </navMap>')
      }
      points.push('    </navPoint>')
    }
  }
  return points
}

/**
 * 生成nav.xhtml的多级列表
 */
function buildNavList(chapters: EpubChapter[]): string {
  let html = ''
  for (const ch of chapters) {
    if (ch.type === 'volume' || ch.type === 'chapter' || ch.type === 'section') {
      // 根据层级决定缩进
      const depth = getDepth(ch)
      const indent = '        '.repeat(depth)
      html += `${indent}<li><a href="chapters/chapter_${ch.id}.xhtml">${escapeXml(ch.title)}</a>`
      if (ch.children && ch.children.length > 0) {
        const hasValidChildren = ch.children.some(
          child => child.type === 'volume' || child.type === 'chapter' || child.type === 'section'
        )
        if (hasValidChildren) {
          html += `\n${indent}  <ol>\n${buildNavList(ch.children)}\n${indent}  </ol>\n${indent}</li>`
        } else {
          html += '</li>'
        }
      } else {
        html += '</li>'
      }
    }
  }
  return html
}

/**
 * 获取节点深度（用于nav.xhtml缩进）
 */
function getDepth(chapter: EpubChapter): number {
  switch (chapter.type) {
    case 'volume': return 0
    case 'chapter': return 1
    case 'section':
    case 'scene': return 2
    default: return 0
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function generateEpub(
  metadata: EpubMetadata,
  chapters: EpubChapter[],
  coverImage?: string | null
): Promise<Blob> {
  const zip = new JSZip()
  
  // 1. mimetype（必须无压缩）
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  
  // 2. META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)
  
  // 3. OEBPS/content.opf（OPF 文件）
  const uuid = `urn:uuid:${crypto.randomUUID()}`
  
  // 建立章节索引映射
  const chapterIndex = buildChapterIndex(chapters)
  
  // Build manifest items
  let manifestItems = ''
  if (coverImage) {
    manifestItems += `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" properties="cover-image"/>\n`
    manifestItems += `    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>\n`
  }
  manifestItems += `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`
  manifestItems += `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`
  manifestItems += `    <item id="css" href="styles.css" media-type="text/css"/>\n`
  
  // 按索引顺序添加章节manifest
  const sortedEntries = Array.from(chapterIndex.entries()).sort((a, b) => a[1].index - b[1].index)
  const chapterManifest = sortedEntries.map(([, { index }]) => 
    `    <item id="chapter${index}" href="chapters/chapter_${index}.xhtml" media-type="application/xhtml+xml"/>`
  ).join('\n')
  manifestItems += chapterManifest
  
  // Build spine items（按顺序引用）
  const spineItems = sortedEntries.map(([, { index }]) => 
    `    <itemref idref="chapter${index}"/>`
  ).join('\n')
  
  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(metadata.title)}</dc:title>
    <dc:creator>${escapeXml(metadata.author)}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <dc:identifier>${uuid}</dc:identifier>
    <dc:type>${escapeXml(metadata.category || 'Novel')}</dc:type>
    ${metadata.description ? `<dc:description>${escapeXml(metadata.description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`
  zip.file('OEBPS/content.opf', opfContent)

  // 生成 NCX（多级目录）
  const playOrderRef = { value: 0 }
  const navPointsStr = buildNavPoints(chapters, playOrderRef).join('\n')
  const ncxDepth = 3 // volume > chapter > section 三级
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="${ncxDepth}"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(metadata.title)}</text></docTitle>
  <navMap>${navPointsStr}
  </navMap>
</ncx>`)
  
  // 5. OEBPS/nav.xhtml（导航，用于 EPUB3 nav）- 多级列表
  const navListHtml = buildNavList(chapters)
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>目录</title></head>
<body>
  <nav epub:type="toc"><h1>目录</h1><ol>${navListHtml}
  </ol></nav>
</body>
</html>`)
  
  // 6. OEBPS/styles.css - 增强样式
  zip.file('OEBPS/styles.css', `body { font-family: "SimSun", "Noto Serif SC", serif; font-size: 16px; line-height: 1.8; padding: 20px; }
h1.volume { font-size: 1.8em; text-align: center; margin: 1.5em 0 1em 0; font-weight: bold; }
h1.chapter { font-size: 1.4em; text-align: left; margin: 1.2em 0 0.8em 0; font-weight: bold; }
h1.section { font-size: 1.2em; text-align: left; margin: 1em 0 0.6em 0; font-weight: bold; }
h1 { font-size: 1.5em; text-align: center; margin: 1em 0; }
h2 { font-size: 1.2em; margin: 0.8em 0; }
p { text-indent: 2em; margin: 0.5em 0; }
span.scene { display: block; margin: 0.5em 0; text-indent: 2em; }`)

  // 7. Cover image (if provided)
  if (coverImage) {
    const matches = coverImage.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      const base64Data = matches[2]
      const binaryData = atob(base64Data)
      const bytes = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i)
      }
      zip.file('OEBPS/images/cover.jpg', bytes)
      
      // 8. OEBPS/cover.xhtml
      zip.file('OEBPS/cover.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Cover</title></head>
<body>
  <section epub:type="cover-image">
    <img src="images/cover.jpg" alt="Cover" style="width: 100%; height: auto;"/>
  </section>
</body>
</html>`)
    }
  }

  // 9. OEBPS/chapters/chapter_*.xhtml - 按索引顺序写入所有有效章节
  for (const [, { chapter, index }] of sortedEntries) {
    // 根据类型选择h1的class
    const h1Class = chapter.type === 'volume' ? 'volume' : 
                    chapter.type === 'chapter' ? 'chapter' : 
                    chapter.type === 'section' ? 'section' : ''
    const h1ClassAttr = h1Class ? ` class="${h1Class}"` : ''
    
    zip.file(`OEBPS/chapters/chapter_${index}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(chapter.title)}</title><link rel="stylesheet" type="text/css" href="../styles.css"/></head>
<body>
  <h1${h1ClassAttr}>${escapeXml(chapter.title)}</h1>
  ${chapter.content}
</body>
</html>`)
  }
  
  // Generate zip
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
}

export function downloadEpub(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
