// Generates pwa-192.png and pwa-512.png from kimawalogo.svg using sharp.
const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const svgPath = path.join(__dirname, 'public', 'kimawalogo.svg')
const outDir  = path.join(__dirname, 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

const svgSrc = fs.readFileSync(svgPath)

// Embed the SVG (white logo, 1024x559) centred on a #6B2737 square background.
async function makeIcon(size) {
  const padding = Math.round(size * 0.15)
  const logoW   = size - padding * 2
  const logoH   = Math.round(logoW * (559 / 1024))
  const offsetY = Math.round((size - logoH) / 2)

  // Render SVG → PNG at target dimensions, white logo on transparent bg
  const logoPng = await sharp(svgSrc)
    .resize(logoW, logoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Composite onto solid primary-colour background
  const result = await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { r: 0x6B, g: 0x27, b: 0x37, alpha: 1 },
    },
  })
    .composite([{ input: logoPng, left: padding, top: offsetY }])
    .png()
    .toBuffer()

  const outPath = path.join(outDir, `pwa-${size}.png`)
  fs.writeFileSync(outPath, result)
  console.log(`Written: ${outPath} (${(result.length / 1024).toFixed(1)} KB)`)
}

;(async () => {
  await makeIcon(192)
  await makeIcon(512)
  console.log('Done.')
})()
