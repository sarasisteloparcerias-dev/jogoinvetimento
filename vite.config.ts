import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Service worker feito à medida: guarda todos os ficheiros do jogo para se poder jogar sem internet
 * (e instalar como app no telemóvel). A lista de ficheiros é gerada em cada build.
 */
function jogarSemInternet(): Plugin {
  return {
    name: 'vila-moeda-sw',
    apply: 'build',
    generateBundle(_opcoes, bundle) {
      const ficheiros = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icone-192.png', './icone-512.png', './icone-apple.png', ...Object.keys(bundle).map((f) => `./${f}`)]
      const unicos = [...new Set(ficheiros)].filter((f) => !f.endsWith('sw.js'))
      let h = 0
      for (const c of unicos.join('|')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
      const versao = (h >>> 0).toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Gerado no build: guarda o jogo para jogar sem internet.
const CACHE = 'vila-moeda-${versao}'
const FICHEIROS = ${JSON.stringify(unicos)}
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }
  e.respondWith(
    caches.match(req).then(
      (r) =>
        r ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resp
        }),
    ),
  )
})
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/jogoinvetimento/' : '/',
  plugins: [react(), tailwindcss(), jogarSemInternet()],
})
