/**
 * Post-build prerender script.
 * Runs after `vite build` and uses Puppeteer to render static marketing pages
 * into fully-populated HTML so Googlebot's first crawl sees real content.
 *
 * Usage: node scripts/prerender.mjs
 * Runs automatically via the "build" npm script.
 */

import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { createReadStream, writeFileSync, mkdirSync, statSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const PORT = 3501
const ROUTES = ['/', '/how-it-works', '/for-businesses']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.txt':  'text/plain',
}

function startServer() {
  return new Promise((res) => {
    const server = createServer((req, res2) => {
      const urlPath = req.url.split('?')[0]
      let filePath = resolve(DIST, urlPath.replace(/^\//, '') || 'index.html')
      try {
        statSync(filePath)
      } catch {
        filePath = resolve(DIST, 'index.html')
      }
      res2.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream')
      createReadStream(filePath).pipe(res2)
    })
    server.listen(PORT, () => res(server))
  })
}

async function prerender() {
  console.log('Starting prerender...')
  const server = await startServer()

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  for (const route of ROUTES) {
    const page = await browser.newPage()
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    // Extra wait for react-helmet-async to flush title/meta into the DOM
    await new Promise((r) => setTimeout(r, 1500))

    const html = await page.content()
    await page.close()

    const outDir = route === '/' ? DIST : resolve(DIST, route.slice(1))
    if (route !== '/') mkdirSync(outDir, { recursive: true })
    writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8')
    console.log(`  ✓ ${route}  →  ${resolve(outDir, 'index.html')}`)
  }

  await browser.close()
  server.close()
  console.log('Prerender complete.')
}

prerender().catch((err) => {
  console.error('Prerender failed:', err.message)
  process.exit(1)
})
