// Gera os ícones da app (public/icone-*.png e public/favicon.svg) em pixel art.
// Uso: npm i -D playwright && node scripts/gerar-icones.mjs
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

/** Moeda dourada com um € sobre fundo verde, numa grelha de 32x32. */
const ICONE = `
const c = document.createElement('canvas'); c.width = 32; c.height = 32
const g = c.getContext('2d')
const px = (x, y, w, h, cor) => { g.fillStyle = cor; g.fillRect(x, y, w, h) }
px(0, 0, 32, 32, '#2a8a5a')
px(0, 24, 32, 8, '#22704a')
for (let x = 1; x < 32; x += 4) px(x, 23, 2, 1, '#48b070')
const circ = (cx, cy, r, cor) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) px(cx + x, cy + y, 1, 1, cor) }
circ(16, 15, 12, '#283040')
circ(16, 15, 11, '#b08010')
circ(16, 15, 10, '#f0c838')
circ(15, 14, 7, '#f8d860')
px(10, 7, 4, 2, '#fff4b0')
const euro = ['..XXXX.', '.X.....', 'XXXXX..', '.X.....', 'XXXXX..', '.X.....', '..XXXX.']
euro.forEach((l, y) => [...l].forEach((ch, x) => ch === 'X' && px(13 + x, 12 + y, 1, 1, '#8a5a10')))
`

const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const p = await b.newPage()
for (const [nome, tam] of [['icone-192.png', 192], ['icone-512.png', 512], ['icone-apple.png', 180]]) {
  const url = await p.evaluate(`(() => { ${ICONE}; const o = document.createElement('canvas'); o.width = ${tam}; o.height = ${tam}; const k = o.getContext('2d'); k.imageSmoothingEnabled = false; k.drawImage(c, 0, 0, ${tam}, ${tam}); return o.toDataURL('image/png') })()`)
  writeFileSync(`public/${nome}`, Buffer.from(url.split(',')[1], 'base64'))
}
const rects = await p.evaluate(`(() => { ${ICONE}; const d = g.getImageData(0, 0, 32, 32).data; const r = []; const cor = (x, y) => { const i = (y * 32 + x) * 4; return '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('') }; for (let y = 0; y < 32; y++) { let x = 0; while (x < 32) { const k = cor(x, y); let w = 1; while (x + w < 32 && cor(x + w, y) === k) w++; r.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="1" fill="' + k + '"/>'); x += w } } return r.join('') })()`)
writeFileSync('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${rects}</svg>`)
await b.close()
console.log('Ícones gerados em public/')
