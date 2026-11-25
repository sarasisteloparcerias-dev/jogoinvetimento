// Gera as capturas de ecrã da página para parceiros (public/imagens/*.png).
// Uso: npx vite --port 5190 (noutro terminal) e depois node scripts/gerar-capturas.mjs
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const URL = process.env.URL ?? 'http://localhost:5190/'
mkdirSync('public/imagens', { recursive: true })

const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 760, height: 760 } })

async function comecar(idade, cartao, desbloquear = []) {
  await p.goto(URL)
  await p.evaluate((d) => {
    localStorage.clear()
    localStorage.setItem('vila-moeda:som', '0')
    for (const f of d) localStorage.setItem(`vila-moeda:${f}`, '1')
  }, desbloquear)
  await p.goto(URL)
  await p.fill('input', String(idade))
  await p.click('button[type=submit]')
  if (cartao !== undefined) await p.click(`button.cartao-modo >> nth=${cartao}`)
  for (let i = 0; i < 40 && !(await p.locator('input').count()); i++) {
    await p.keyboard.press('z')
    await p.waitForTimeout(80)
  }
  await p.fill('input', 'Alex')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(500)
  for (let i = 0; i < 15 && (await p.locator('[data-testid=dialogo]').count()); i++) await p.keyboard.press('z')
  await p.keyboard.press('ArrowUp')
  await p.keyboard.press('z')
  for (let i = 0; i < 80 && !(await p.locator('canvas.ecra-canvas').count()); i++) {
    await p.keyboard.press('z')
    await p.waitForTimeout(100)
  }
  await p.waitForFunction(() => !!window.__vilaMoeda)
  await fecharFalas()
}

/** Avança as falas (e escolhe a 1.ª opção) até não haver diálogo durante um bocado. */
async function fecharFalas() {
  let livre = 0
  for (let i = 0; i < 1500 && livre < 10; i++) {
    if (await p.locator('[data-testid=dialogo], [data-testid=opcoes]').count()) {
      livre = 0
      await p.keyboard.press('z')
      await p.waitForTimeout(50)
    } else {
      livre++
      await p.waitForTimeout(100)
    }
  }
}

async function levar(mapa, x, y, dir = 'down') {
  await p.evaluate(([m, x, y, d]) => window.__vilaMoeda.ctx.levar(m, x, y, d), [mapa, x, y, dir])
  await p.waitForTimeout(900)
  await fecharFalas()
}

async function foto(nome) {
  await p.locator('.ecra').screenshot({ path: `public/imagens/${nome}.png` })
}

await comecar(10)
await levar('vila', 10, 8)
await foto('vila')
await p.evaluate(() => void window.__vilaMoeda.ctx.jogar('regatear'))
await p.waitForTimeout(600)
await p.keyboard.press('z')
await p.waitForTimeout(400)
for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowUp')
await p.keyboard.press('z')
await p.waitForTimeout(300)
await foto('minijogo')

await comecar(16)
await levar('cidade', 19, 9)
await foto('cidade')

await comecar(25, 2)
await levar('escritorio', 7, 5, 'up')
await foto('mercado')

await comecar(28, 3)
await levar('imobiliaria', 5, 5, 'up')
await foto('casa')

await comecar(30, 4, ['negocio'])
await levar('empresa', 6, 5, 'up')
await foto('negocio')

await comecar(65, 5, ['negocio', 'reforma'])
await levar('vila', 9, 20, 'left')
await foto('reforma')

await b.close()
console.log('capturas em public/imagens/')
