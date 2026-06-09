// Generates pwa-192.png and pwa-512.png — pure Node.js, no extra packages.
// Icon: rounded #6B2737 square with a white "K" drawn as filled polygons.
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) {
    c ^= b
    for (let i = 0; i < 8; i++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : c >>> 1
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length)
  const crcVal = crc32(Buffer.concat([t, data]))
  const c = Buffer.alloc(4); c.writeUInt32BE(crcVal)
  return Buffer.concat([l, t, data, c])
}

function makePNG(size) {
  const bg  = [0x6B, 0x27, 0x37]   // #6B2737
  const fg  = [0xFF, 0xFF, 0xFF]   // white

  // Draw into RGBA pixel array
  const pixels = new Uint8Array(size * size * 4)

  function setPixel(x, y, rgb) {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    pixels[i]   = rgb[0]
    pixels[i+1] = rgb[1]
    pixels[i+2] = rgb[2]
    pixels[i+3] = 255
  }

  // Fill background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      setPixel(x, y, bg)

  // Draw a white "K" using thick lines — scaled to icon size
  const s = size / 192   // scale factor
  const lw = Math.max(1, Math.round(18 * s))   // stroke width
  const x0 = Math.round(60 * s)                // left edge of K
  const top  = Math.round(44 * s)
  const bot  = Math.round(148 * s)
  const mid  = Math.round(96 * s)
  const x1   = Math.round(132 * s)             // right tips of K

  // Vertical bar of K
  for (let y = top; y <= bot; y++)
    for (let dx = 0; dx < lw; dx++)
      setPixel(x0 + dx, y, fg)

  // Upper arm: x0+lw → x1, y from top → mid  (diagonal line)
  for (let step = 0; step <= 100; step++) {
    const t  = step / 100
    const px = Math.round((x0 + lw) + t * (x1 - (x0 + lw)))
    const py = Math.round(top + t * (mid - top))
    for (let dx = -Math.round(lw/2); dx <= Math.round(lw/2); dx++)
      for (let dy = -Math.round(lw/2); dy <= Math.round(lw/2); dy++)
        setPixel(px + dx, py + dy, fg)
  }

  // Lower arm: x0+lw → x1, y from mid → bot
  for (let step = 0; step <= 100; step++) {
    const t  = step / 100
    const px = Math.round((x0 + lw) + t * (x1 - (x0 + lw)))
    const py = Math.round(mid + t * (bot - mid))
    for (let dx = -Math.round(lw/2); dx <= Math.round(lw/2); dx++)
      for (let dy = -Math.round(lw/2); dy <= Math.round(lw/2); dy++)
        setPixel(px + dx, py + dy, fg)
  }

  // Build PNG: RGBA pixels → filter bytes prepended per row
  const rows = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 4)] = 0  // filter byte: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * (1 + size * 4) + 1 + x * 4
      rows[dst]   = pixels[src]
      rows[dst+1] = pixels[src+1]
      rows[dst+2] = pixels[src+2]
      rows[dst+3] = pixels[src+3]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8]  = 8   // bit depth
  ihdr[9]  = 6   // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = path.join(__dirname, 'public', 'icons')
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'pwa-192.png'), makePNG(192))
fs.writeFileSync(path.join(out, 'pwa-512.png'), makePNG(512))
console.log('Icons written: pwa-192.png, pwa-512.png')
