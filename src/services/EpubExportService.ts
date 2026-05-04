import JSZip from 'jszip'

export interface EpubChapter {
  id: string
  title: string
  content: string  // HTML 富文本
}

export interface EpubMetadata {
  title: string
  author: string
  language: string
  description?: string
  category?: string
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
  
  // Build manifest items
  let manifestItems = ''
  if (coverImage) {
    manifestItems += `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" properties="cover-image"/>\n`
    manifestItems += `    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>\n`
  }
  manifestItems += `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`
  manifestItems += `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`
  manifestItems += `    <item id="css" href="styles.css" media-type="text/css"/>\n`
  
  const chapterManifest = chapters.map((_ch, i) => 
    `    <item id="chapter${i}" href="chapters/chapter_${i}.xhtml" media-type="application/xhtml+xml"/>`
  ).join('\n')
  manifestItems += chapterManifest
  
  // Build spine items
  const spineItems = chapters.map((_ch, i) => 
    `    <itemref idref="chapter${i}"/>`
  ).join('\n')
  
  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <dc:identifier>${uuid}</dc:identifier>
    <dc:type>${metadata.category || 'Novel'}</dc:type>
    ${metadata.description ? `<dc:description>${metadata.description}</dc:description>` : ''}
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

  const navPoints = chapters.map((ch, i) => 
    `<navPoint id="navpoint-${i}" playOrder="${i}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="chapters/chapter_${i}.xhtml"/>
    </navPoint>`
  ).join('\n    ')
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${metadata.title}</text></docTitle>
  <navMap>${navPoints}</navMap>
</ncx>`)
  
  // 5. OEBPS/nav.xhtml（导航，用于 EPUB3 nav）
  const navLinks = chapters.map((ch, i) => 
    `<li><a href="chapters/chapter_${i}.xhtml">${ch.title}</a></li>`
  ).join('\n          ')
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>目录</title></head>
<body>
  <nav epub:type="toc"><h1>目录</h1><ol>${navLinks}</ol></nav>
</body>
</html>`)
  
  // 6. OEBPS/styles.css
  zip.file('OEBPS/styles.css', `body { font-family: "SimSun", serif; font-size: 16px; line-height: 1.8; padding: 20px; }
h1 { font-size: 1.5em; text-align: center; margin: 1em 0; }
h2 { font-size: 1.2em; margin: 0.8em 0; }
p { text-indent: 2em; margin: 0.5em 0; }`)

  // 7. Cover image (if provided)
  if (coverImage) {
    // Extract base64 data and mime type from data URL
    const matches = coverImage.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      const mimeType = matches[1]
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

  // 9. OEBPS/chapters/chapter_*.xhtml
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]
    zip.file(`OEBPS/chapters/chapter_${i}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title}</title><link rel="stylesheet" type="text/css" href="../styles.css"/></head>
<body>
  <h1>${ch.title}</h1>
  ${ch.content}
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
